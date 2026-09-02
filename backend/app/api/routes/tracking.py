from fastapi import APIRouter, HTTPException, status

from app.schemas.tracking import ComplaintTrackingDetail
from app.services.tracking_service import get_full_tracking


router = APIRouter(tags=["Tracking"])


@router.get(
    "/complaints/{tracking_id}/tracking",
    response_model=ComplaintTrackingDetail,
    summary="Full complaint tracking timeline",
    description=(
        "Returns overall status, per-department route details, "
        "and the full chronological event timeline for a complaint."
    ),
)
def get_tracking_endpoint(tracking_id: str):
    try:
        return get_full_tracking(tracking_id)

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    except Exception as exc:
        print(f"Tracking fetch error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve tracking information",
        )
