from app.database.db import supabase


def create_tracking_event(
    complaint_id: str,
    status: str,
    message: str,
    route_id: str | None = None,
) -> dict:
    data: dict = {
        "complaint_id": complaint_id,
        "status": status,
        "message": message,
    }

    if route_id is not None:
        data["route_id"] = route_id

    response = (
        supabase
        .table("tracking_events")
        .insert(data)
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            f"Failed to create tracking event for complaint {complaint_id}"
        )

    return response.data[0]


def get_events_by_complaint_id(complaint_id: str) -> list[dict]:
    response = (
        supabase
        .table("tracking_events")
        .select("*")
        .eq("complaint_id", complaint_id)
        .order("created_at")
        .execute()
    )

    return response.data or []
