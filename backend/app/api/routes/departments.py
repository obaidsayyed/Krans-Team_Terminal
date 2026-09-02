from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.department import DepartmentResponse
from app.services.department_service import get_department, list_departments
from app.services.routing_service import get_routes_for_department


router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
)


@router.get(
    "",
    response_model=list[DepartmentResponse],
)
def list_departments_endpoint(
    type: str | None = Query(default=None, description="Filter by department type (e.g. POLICE)"),
    city: str | None = Query(default=None, description="Filter by city name (case-insensitive)"),
):
    try:
        return list_departments(type_filter=type, city_filter=city)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve departments",
        )


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def get_department_endpoint(department_id: str):
    department = get_department(department_id)

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    return department


@router.get(
    "/{department_id}/complaints",
    summary="Department dashboard — list routed complaints",
)
def get_department_complaints_endpoint(
    department_id: str,
    route_status: str | None = Query(
        default=None,
        alias="status",
        description="Filter by route status (e.g. ROUTED, IN_PROGRESS)",
    ),
    priority: str | None = Query(
        default=None,
        description="Filter by AI priority (e.g. HIGH, CRITICAL)",
    ),
):
    department = get_department(department_id)

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    try:
        return get_routes_for_department(
            department_id=department_id,
            status_filter=route_status,
            priority_filter=priority,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve department complaints",
        )
