from app.database.db import supabase


def get_all_departments(
    type_filter: str | None = None,
    city_filter: str | None = None,
) -> list[dict]:
    query = (
        supabase
        .table("departments")
        .select("*")
        .eq("is_active", True)
        .order("name")
    )

    if type_filter:
        query = query.eq("department_type", type_filter.upper())

    if city_filter:
        query = query.ilike("city", city_filter)

    response = query.execute()
    return response.data or []


def get_department_by_id(department_id: str) -> dict | None:
    response = (
        supabase
        .table("departments")
        .select("*")
        .eq("id", department_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


def get_departments_by_type(department_type: str) -> list[dict]:
    """Return all active departments of a given type. Used by location service."""
    response = (
        supabase
        .table("departments")
        .select("*")
        .eq("department_type", department_type.upper())
        .eq("is_active", True)
        .execute()
    )
    return response.data or []
