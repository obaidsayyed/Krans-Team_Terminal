from fastapi import APIRouter, HTTPException, status

from app.schemas.ai_contract import AIAnalysisResult
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintTrackingResponse,
)
from app.services.complaint_service import (
    analyze_complaint,
    apply_ai_analysis,
    get_complaint_status,
    submit_complaint,
)


router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"],
)


@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_complaint_endpoint(
    payload: ComplaintCreate,
):
    try:
        complaint = submit_complaint(payload)
        return complaint

    except Exception as exc:
        print("CREATE COMPLAINT ERROR:")
        print(repr(exc))

        raise HTTPException(
            status_code=500,
            detail=str(exc),   # temporary debugging
        )


@router.get(
    "/{tracking_id}",
    response_model=ComplaintTrackingResponse,
)
def track_complaint_endpoint(
    tracking_id: str,
):
    try:
        complaint = get_complaint_status(tracking_id)

        if complaint is None:
            raise HTTPException(
                status_code=404,
                detail="Complaint not found",
            )

        return complaint

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Track complaint error: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve complaint",
        )


@router.patch(
    "/{tracking_id}/analysis",
    summary="AI Agent — submit analysis result for a complaint",
    description=(
        "Endpoint for the external AI agent to push analysis results. "
        "Updates AI fields and transitions complaint to ANALYZED status."
    ),
)
def submit_ai_analysis_endpoint(
    tracking_id: str,
    payload: AIAnalysisResult,
):
    try:
        updated = apply_ai_analysis(tracking_id, payload)
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
        print(f"AI analysis submission error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply AI analysis",
        )


@router.post(
    "/{tracking_id}/analyze",
    summary="Trigger AI Agent analysis for a complaint",
    description=(
        "Invokes the Lyzr AI Agent to analyze the complaint text, extract "
        "category, priority, target departments, and formal draft, and "
        "transitions the complaint to ANALYZED status."
    ),
)
def trigger_ai_analysis_endpoint(
    tracking_id: str,
):
    try:
        updated = analyze_complaint(tracking_id)
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

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )

    except Exception as exc:
        print(f"AI analysis trigger error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute AI analysis",
        )

