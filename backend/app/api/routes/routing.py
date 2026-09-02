from fastapi import APIRouter, HTTPException, status

from app.schemas.routing import RouteResponse, RouteStatusUpdate
from app.services.routing_service import route_complaint, update_route_status


router = APIRouter(tags=["Routing"])


@router.post(
    "/complaints/{tracking_id}/route",
    response_model=list[RouteResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Route a complaint to all AI-identified departments",
    description=(
        "Reads ai_departments from the complaint, finds the nearest active "
        "authority per type, creates complaint_route rows, and simulates "
        "submission via department adapters. Calling this endpoint twice is "
        "safe — existing routes are not duplicated."
    ),
)
def route_complaint_endpoint(tracking_id: str):
    try:
        routes = route_complaint(tracking_id)
        return routes

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except Exception as exc:
        print(f"Routing error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Routing failed",
        )


@router.patch(
    "/routes/{route_id}/status",
    response_model=RouteResponse,
    summary="Officer / department updates a route status",
    description=(
        "Allows a department officer to update the status of a routed "
        "complaint. Automatically recalculates and updates the main "
        "complaint status based on all route states."
    ),
)
def update_route_status_endpoint(
    route_id: str,
    payload: RouteStatusUpdate,
):
    try:
        updated = update_route_status(
            route_id=route_id,
            new_status=payload.status,
            message=payload.message,
        )
        return updated

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except Exception as exc:
        print(f"Route status update error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update route status",
        )
