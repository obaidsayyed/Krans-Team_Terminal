from app.repositories.complaint_repository import get_complaint_by_tracking_id
from app.repositories.route_repository import get_routes_by_complaint_id
from app.repositories.tracking_repository import (
    create_tracking_event,
    get_events_by_complaint_id,
)


def log_event(
    complaint_id: str,
    status: str,
    message: str,
    route_id: str | None = None,
) -> dict:
    """Create a tracking event. Called by other services on every status transition."""
    return create_tracking_event(
        complaint_id=complaint_id,
        status=status,
        message=message,
        route_id=route_id,
    )


def get_complaint_timeline(complaint_id: str) -> list[dict]:
    """Return all tracking events for a complaint in chronological order."""
    return get_events_by_complaint_id(complaint_id)


def get_full_tracking(tracking_id: str) -> dict:
    """
    Assemble the full tracking response for a citizen:
    - overall complaint status
    - per-route summaries (department, ticket, distance)
    - chronological event timeline
    """
    complaint = get_complaint_by_tracking_id(tracking_id)

    if complaint is None:
        raise LookupError(f"Complaint not found: {tracking_id!r}")

    raw_routes = get_routes_by_complaint_id(complaint["id"])
    events = get_events_by_complaint_id(complaint["id"])

    route_summaries = []
    for r in raw_routes:
        # department data comes from the joined select in route_repository
        dept = r.get("departments") or {}
        route_summaries.append({
            "route_id":          r["id"],
            "department_type":   r["department_type"],
            "department_name":   dept.get("name"),
            "department_city":   dept.get("city"),
            "status":            r["status"],
            "external_ticket_id": r.get("external_ticket_id"),
            "distance_km":       r.get("distance_km"),
        })

    return {
        "tracking_id":    complaint["tracking_id"],
        "overall_status": complaint["status"],
        "ai_status":      complaint["ai_status"],
        "ai_priority":    complaint.get("ai_priority"),
        "routes":         route_summaries,
        "timeline":       events,
    }
