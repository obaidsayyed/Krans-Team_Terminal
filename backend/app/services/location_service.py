from app.repositories.department_repository import get_departments_by_type
from app.utils.distance import haversine_km


def find_nearest_department(
    department_type: str,
    latitude: float,
    longitude: float,
) -> dict | None:
    """
    Return the active department of *department_type* that is geographically
    closest to the given citizen coordinates.

    Departments without valid coordinates are skipped.
    Returns None if no qualifying department exists.
    """
    candidates = get_departments_by_type(department_type)

    best: dict | None = None
    best_distance: float = float("inf")

    for dept in candidates:
        dept_lat = dept.get("latitude")
        dept_lon = dept.get("longitude")

        if dept_lat is None or dept_lon is None:
            continue

        distance = haversine_km(latitude, longitude, dept_lat, dept_lon)

        if distance < best_distance:
            best_distance = distance
            best = {**dept, "_distance_km": round(best_distance, 4)}

    return best
