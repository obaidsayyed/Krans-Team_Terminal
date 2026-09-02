from app.core.constants import DEPARTMENT_TYPE_SET
from app.repositories.department_repository import (
    get_all_departments,
    get_department_by_id,
)


def list_departments(
    type_filter: str | None = None,
    city_filter: str | None = None,
) -> list[dict]:
    if type_filter and type_filter.upper() not in DEPARTMENT_TYPE_SET:
        raise ValueError(
            f"Unknown department type: {type_filter!r}. "
            f"Valid types: {sorted(DEPARTMENT_TYPE_SET)}"
        )

    return get_all_departments(type_filter, city_filter)


def get_department(department_id: str) -> dict | None:
    return get_department_by_id(department_id)
