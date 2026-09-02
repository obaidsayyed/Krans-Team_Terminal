import json

from app.ai.client import AIAgentClient
from app.core.constants import (
    AI_STATUS_COMPLETED,
    AI_STATUS_FAILED,
    AI_STATUS_PROCESSING,
    COMPLAINT_STATUS_ANALYZED,
    COMPLAINT_STATUS_SUBMITTED,
    DEPARTMENT_TYPE_SET,
)
from app.repositories.complaint_repository import (
    create_complaint,
    get_complaint_by_tracking_id,
    update_complaint_ai_analysis,
)
from app.schemas.ai_contract import AIAnalysisResult
from app.schemas.complaint import ComplaintCreate
from app.services.tracking_service import log_event
from app.utils.ids import generate_tracking_id


def submit_complaint(payload: ComplaintCreate) -> dict:
    tracking_id = generate_tracking_id()

    complaint_data = {
        "tracking_id": tracking_id,

        "citizen_name": payload.citizen_name,
        "contact": payload.contact,

        "raw_complaint": payload.complaint,

        "address": payload.address,
        "latitude": payload.latitude,
        "longitude": payload.longitude,

        "status": COMPLAINT_STATUS_SUBMITTED,

        # AI team handles this later
        "ai_status": "PENDING",
    }

    complaint = create_complaint(complaint_data)

    log_event(
        complaint_id=complaint["id"],
        status=COMPLAINT_STATUS_SUBMITTED,
        message="Complaint submitted by citizen",
    )

    return complaint


def get_complaint_status(tracking_id: str) -> dict | None:
    return get_complaint_by_tracking_id(tracking_id)


def apply_ai_analysis(
    tracking_id: str,
    result: AIAnalysisResult,
) -> dict:
    """
    Persist AI analysis results onto an existing complaint.

    Validates that all department codes in result.departments are
    recognised values before writing. Raises ValueError on bad codes.
    """
    complaint = get_complaint_by_tracking_id(tracking_id)

    if complaint is None:
        raise LookupError(f"Complaint not found: {tracking_id!r}")

    # Validate department codes supplied by the AI agent.
    unknown = [
        d for d in result.departments
        if d.upper() not in DEPARTMENT_TYPE_SET
    ]
    if unknown:
        raise ValueError(
            f"Unknown department type(s): {unknown}. "
            f"Valid types: {sorted(DEPARTMENT_TYPE_SET)}"
        )

    normalised_departments = [d.upper() for d in result.departments]

    update_data = {
        "ai_title":        result.title,
        "ai_summary":      result.summary,
        "ai_formal_draft": result.formal_draft,
        "ai_category":     result.category,
        "ai_priority":     result.priority.value,
        "ai_departments":  normalised_departments,
        "ai_payload":      json.dumps(result.raw_payload) if result.raw_payload else None,
        "ai_status":       AI_STATUS_COMPLETED,
        "status":          COMPLAINT_STATUS_ANALYZED,
    }

    updated = update_complaint_ai_analysis(complaint["id"], update_data)

    log_event(
        complaint_id=complaint["id"],
        status=COMPLAINT_STATUS_ANALYZED,
        message=(
            f"AI analysis completed — category: {result.category}, "
            f"priority: {result.priority.value}, "
            f"departments: {', '.join(normalised_departments)}"
        ),
    )

    return updated


def analyze_complaint(
    tracking_id: str,
    ai_client: AIAgentClient | None = None,
) -> dict:
    """
    Trigger AI analysis for an existing complaint using Lyzr AI Agent.
    Fetches raw complaint text, sends it to Lyzr AI Agent, and persists
    the structured analysis results.
    """
    complaint = get_complaint_by_tracking_id(tracking_id)
    if complaint is None:
        raise LookupError(f"Complaint not found: {tracking_id!r}")

    # Mark as processing
    try:
        update_complaint_ai_analysis(
            complaint["id"],
            {"ai_status": AI_STATUS_PROCESSING},
        )
    except Exception:
        pass

    log_event(
        complaint_id=complaint["id"],
        status="AI_PROCESSING",
        message="AI analysis started via Lyzr AI Agent",
    )

    client = ai_client or AIAgentClient()

    try:
        result = client.analyze(
            complaint_text=complaint["raw_complaint"],
            tracking_id=tracking_id,
        )
        return apply_ai_analysis(tracking_id, result)
    except Exception as exc:
        try:
            update_complaint_ai_analysis(
                complaint["id"],
                {"ai_status": AI_STATUS_FAILED},
            )
            log_event(
                complaint_id=complaint["id"],
                status="AI_FAILED",
                message=f"AI analysis failed: {exc}",
            )
        except Exception:
            pass
        raise