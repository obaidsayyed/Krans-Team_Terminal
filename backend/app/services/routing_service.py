from app.adapters.base import BaseAdapter
from app.adapters.fire import FireAdapter
from app.adapters.hospital import HospitalAdapter
from app.adapters.municipal import MunicipalAdapter
from app.adapters.police import PoliceAdapter
from app.adapters.rto import RTOAdapter
from app.core.constants import (
    COMPLAINT_STATUS_ASSIGNED,
    COMPLAINT_STATUS_IN_PROGRESS,
    COMPLAINT_STATUS_RESOLVED,
    COMPLAINT_STATUS_ROUTING,
    ROUTE_ACTIVE_STATUSES,
    ROUTE_STATUS_RESOLVED,
    ROUTE_STATUS_SET,
)
from app.repositories.complaint_repository import (
    get_complaint_by_tracking_id,
    update_complaint_status,
)
from app.repositories.route_repository import (
    create_route,
    exists_route,
    get_route_by_id,
    get_routes_by_complaint_id,
    get_routes_by_department_id,
    update_route,
)
from app.services.location_service import find_nearest_department
from app.services.tracking_service import log_event

# ---------------------------------------------------------------------------
# Adapter registry — maps department_type → adapter instance
# Add new adapters here when available; routing service needs no other change.
# ---------------------------------------------------------------------------

_ADAPTER_REGISTRY: dict[str, BaseAdapter] = {
    "POLICE":         PoliceAdapter(),
    "TRAFFIC_POLICE": PoliceAdapter(),   # same adapter until dedicated one exists
    "RTO":            RTOAdapter(),
    "MUNICIPAL":      MunicipalAdapter(),
    "SANITATION":     MunicipalAdapter(),
    "FIRE":           FireAdapter(),
    "HOSPITAL":       HospitalAdapter(),
    "HEALTH":         HospitalAdapter(),
    "ELECTRICITY":    MunicipalAdapter(),
    "WATER":          MunicipalAdapter(),
    "PWD":            MunicipalAdapter(),
    "OTHER":          MunicipalAdapter(),
}


def get_adapter(department_type: str) -> BaseAdapter:
    adapter = _ADAPTER_REGISTRY.get(department_type.upper())
    if adapter is None:
        raise ValueError(
            f"No adapter registered for department type: {department_type!r}"
        )
    return adapter


def route_complaint(tracking_id: str) -> list[dict]:
    """
    Route a complaint to all departments identified by the AI analysis.

    Flow:
        1. Load complaint (must be ANALYZED).
        2. Read ai_departments list.
        3. For each department type:
            a. Find nearest active department (Haversine).
            b. Skip if route already exists (idempotent).
            c. Create complaint_route row (PENDING).
            d. Call mock adapter → get external_ticket_id.
            e. Update route status → ROUTED.
            f. Log tracking event.
        4. Update main complaint status → ASSIGNED.

    Returns:
        List of created/existing route dicts.
    """
    complaint = get_complaint_by_tracking_id(tracking_id)

    if complaint is None:
        raise LookupError(f"Complaint not found: {tracking_id!r}")

    ai_departments: list[str] = complaint.get("ai_departments") or []

    if not ai_departments:
        raise ValueError(
            f"Complaint {tracking_id!r} has no AI department assignments. "
            "Run AI analysis first via PATCH /complaints/{tracking_id}/analysis"
        )

    citizen_lat: float | None = complaint.get("latitude")
    citizen_lon: float | None = complaint.get("longitude")

    # Mark complaint as routing in progress
    update_complaint_status(complaint["id"], COMPLAINT_STATUS_ROUTING)
    log_event(
        complaint_id=complaint["id"],
        status=COMPLAINT_STATUS_ROUTING,
        message="Routing to identified departments",
    )

    created_routes: list[dict] = []

    for dept_type in ai_departments:
        dept_type = dept_type.upper()

        # Find the nearest authority of this type
        if citizen_lat is not None and citizen_lon is not None:
            nearest = find_nearest_department(dept_type, citizen_lat, citizen_lon)
        else:
            nearest = None

        if nearest is None:
            log_event(
                complaint_id=complaint["id"],
                status=COMPLAINT_STATUS_ROUTING,
                message=f"No active {dept_type} department found — skipped",
            )
            continue

        department_id = nearest["id"]
        distance_km = nearest.get("_distance_km")

        # Idempotency check — do not create duplicate routes
        if exists_route(complaint["id"], department_id):
            existing = [
                r for r in get_routes_by_complaint_id(complaint["id"])
                if r["department_id"] == department_id
            ]
            if existing:
                created_routes.extend(existing)
            continue

        # Create the route row (PENDING)
        route = create_route({
            "complaint_id":    complaint["id"],
            "department_id":   department_id,
            "department_type": dept_type,
            "status":          "PENDING",
            "distance_km":     distance_km,
        })

        # Submit via mock adapter
        try:
            adapter = get_adapter(dept_type)
            result = adapter.submit_complaint(complaint, nearest)

            update_data: dict = {
                "status": result.status,
                "external_ticket_id": result.external_ticket_id,
            }
            route = update_route(route["id"], update_data)

            log_event(
                complaint_id=complaint["id"],
                route_id=route["id"],
                status=result.status,
                message=(
                    f"Complaint routed to {nearest['name']} "
                    f"({dept_type}) — ticket: {result.external_ticket_id} "
                    f"— distance: {distance_km} km"
                ),
            )

        except Exception as exc:
            route = update_route(route["id"], {"status": "FAILED"})
            log_event(
                complaint_id=complaint["id"],
                route_id=route["id"],
                status="FAILED",
                message=f"Routing to {dept_type} failed: {exc}",
            )

        created_routes.append(route)

    # Update main complaint status based on routing results
    if created_routes:
        update_complaint_status(complaint["id"], COMPLAINT_STATUS_ASSIGNED)
        log_event(
            complaint_id=complaint["id"],
            status=COMPLAINT_STATUS_ASSIGNED,
            message=(
                f"Complaint assigned to "
                f"{len(created_routes)} department(s)"
            ),
        )

    return created_routes


def update_route_status(
    route_id: str,
    new_status: str,
    message: str | None = None,
) -> dict:
    """
    Update a single route's status and emit a tracking event.
    Also recalculates and updates the main complaint status.
    """
    if new_status not in ROUTE_STATUS_SET:
        raise ValueError(
            f"Invalid route status: {new_status!r}. "
            f"Valid: {sorted(ROUTE_STATUS_SET)}"
        )

    route = get_route_by_id(route_id)
    if route is None:
        raise LookupError(f"Route not found: {route_id!r}")

    update_data: dict = {"status": new_status}
    if message:
        update_data["notes"] = message

    updated_route = update_route(route_id, update_data)

    log_event(
        complaint_id=route["complaint_id"],
        route_id=route_id,
        status=new_status,
        message=message or f"Route status updated to {new_status}",
    )

    # Recalculate overall complaint status
    _sync_complaint_status(route["complaint_id"])

    return updated_route


def _sync_complaint_status(complaint_id: str) -> None:
    """Derive and set the aggregate complaint status from all its routes."""
    all_routes = get_routes_by_complaint_id(complaint_id)

    if not all_routes:
        return

    statuses = {r["status"] for r in all_routes}

    if all(s == ROUTE_STATUS_RESOLVED for s in statuses):
        new_status = COMPLAINT_STATUS_RESOLVED
        message = "All department routes resolved — complaint closed"
    elif statuses & ROUTE_ACTIVE_STATUSES:
        # At least one route is still active
        if "IN_PROGRESS" in statuses:
            new_status = COMPLAINT_STATUS_IN_PROGRESS
            message = "At least one department route is in progress"
        else:
            new_status = COMPLAINT_STATUS_ASSIGNED
            message = "Routes assigned and awaiting action"
    else:
        return  # All failed — leave status as-is, don't mask the issue

    update_complaint_status(complaint_id, new_status)
    log_event(
        complaint_id=complaint_id,
        status=new_status,
        message=message,
    )


def get_routes_for_department(
    department_id: str,
    status_filter: str | None = None,
    priority_filter: str | None = None,
) -> list[dict]:
    """
    Department dashboard — return routed complaints for a given department.
    Optionally filter by route status and/or AI priority.
    """
    routes = get_routes_by_department_id(department_id, status_filter)

    if priority_filter:
        priority_upper = priority_filter.upper()
        routes = [
            r for r in routes
            if (r.get("complaints") or {}).get("ai_priority") == priority_upper
        ]

    return routes
