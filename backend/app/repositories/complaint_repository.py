from app.database.db import supabase


def create_complaint(data: dict) -> dict:
    response = (
        supabase
        .table("complaints")
        .insert(data)
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Complaint could not be created"
        )

    return response.data[0]


def get_complaint_by_tracking_id(
    tracking_id: str,
) -> dict | None:

    response = (
        supabase
        .table("complaints")
        .select("*")
        .eq("tracking_id", tracking_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


def get_complaint_by_id(complaint_id: str) -> dict | None:
    response = (
        supabase
        .table("complaints")
        .select("*")
        .eq("id", complaint_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


def update_complaint_ai_analysis(
    complaint_id: str,
    data: dict,
) -> dict:
    """Persist AI analysis fields onto the complaint row."""
    response = (
        supabase
        .table("complaints")
        .update(data)
        .eq("id", complaint_id)
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            f"Failed to update AI analysis for complaint {complaint_id}"
        )

    return response.data[0]


def update_complaint_status(
    complaint_id: str,
    status: str,
) -> dict:
    """Update only the main complaint status."""
    response = (
        supabase
        .table("complaints")
        .update({"status": status})
        .eq("id", complaint_id)
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            f"Failed to update status for complaint {complaint_id}"
        )

    return response.data[0]