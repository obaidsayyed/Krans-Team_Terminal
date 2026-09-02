from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


ComplaintStatus = Literal[
    "SUBMITTED",
    "ANALYZED",
    "ROUTING",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "REJECTED",
]

AIStatus = Literal[
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
]


class ComplaintCreate(BaseModel):
    citizen_name: str | None = Field(
        default=None,
        max_length=100,
    )

    contact: str | None = Field(
        default=None,
        max_length=100,
    )

    complaint: str = Field(
        ...,
        min_length=10,
        max_length=5000,
    )

    address: str | None = Field(
        default=None,
        max_length=500,
    )

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )


class ComplaintResponse(BaseModel):
    id: UUID

    tracking_id: str

    citizen_name: str | None
    contact: str | None

    raw_complaint: str

    address: str | None
    latitude: float | None
    longitude: float | None

    status: ComplaintStatus
    ai_status: AIStatus

    created_at: datetime
    updated_at: datetime


class ComplaintTrackingResponse(BaseModel):
    tracking_id: str

    status: ComplaintStatus
    ai_status: AIStatus

    ai_title: str | None = None
    ai_category: str | None = None
    ai_priority: str | None = None
    ai_departments: list[str] | None = None

    created_at: datetime
    updated_at: datetime