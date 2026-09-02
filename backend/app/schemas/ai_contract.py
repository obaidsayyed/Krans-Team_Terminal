from enum import Enum

from pydantic import BaseModel, Field


class AIPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AIAnalysisResult(BaseModel):
    """
    Contract between the external AI agent and this backend.

    The AI agent POSTs/PATCHes this payload to:
        PATCH /complaints/{tracking_id}/analysis

    Fields
    ------
    title           : Short human-readable title for the complaint.
    summary         : One-paragraph summary of the issue.
    formal_draft    : Formal letter/draft for official forwarding.
    category        : Category string (e.g. "Road Accident", "Water Supply").
    priority        : Urgency level — LOW | MEDIUM | HIGH | CRITICAL.
    departments     : List of department type codes to route to
                      (e.g. ["POLICE", "RTO", "HOSPITAL"]).
                      Must be valid values from DEPARTMENT_TYPES constant.
    raw_payload     : Optional arbitrary dict the AI may include for debugging
                      or extended data (stored as-is in ai_payload column).
    """

    title: str = Field(..., min_length=1, max_length=255)
    summary: str = Field(..., min_length=1)
    formal_draft: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1, max_length=100)
    priority: AIPriority
    departments: list[str] = Field(..., min_length=1)
    raw_payload: dict | None = Field(default=None)
