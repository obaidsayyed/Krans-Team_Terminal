from app.database.db import supabase


def create_route(data: dict) -> dict:
    response = (
        supabase
        .table("complaint_routes")
        .insert(data)
        .execute()
    )

    if not response.data:
        raise RuntimeError("Failed to create complaint route")

    return response.data[0]


def get_routes_by_complaint_id(complaint_id: str) -> list[dict]:
    response = (
        supabase
        .table("complaint_routes")
        .select("*, departments(name, department_type, city)")
        .eq("complaint_id", complaint_id)
        .order("created_at")
        .execute()
    )

    return response.data or []


def get_route_by_id(route_id: str) -> dict | None:
    response = (
        supabase
        .table("complaint_routes")
        .select("*")
        .eq("id", route_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


def update_route(route_id: str, data: dict) -> dict:
    response = (
        supabase
        .table("complaint_routes")
        .update(data)
        .eq("id", route_id)
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            f"Failed to update route {route_id}"
        )

    return response.data[0]


def exists_route(complaint_id: str, department_id: str) -> bool:
    """Return True if a route already exists for this complaint+department pair."""
    response = (
        supabase
        .table("complaint_routes")
        .select("id")
        .eq("complaint_id", complaint_id)
        .eq("department_id", department_id)
        .limit(1)
        .execute()
    )

    return bool(response.data)


def get_routes_by_department_id(
    department_id: str,
    status_filter: str | None = None,
) -> list[dict]:
    """Fetch all routes assigned to a department, with joined complaint data."""
    query = (
        supabase
        .table("complaint_routes")
        .select(
            "*, complaints(tracking_id, citizen_name, address, ai_priority, status)"
        )
        .eq("department_id", department_id)
        .order("created_at", desc=True)
    )

    if status_filter:
        query = query.eq("status", status_filter.upper())

    response = query.execute()
    return response.data or []
