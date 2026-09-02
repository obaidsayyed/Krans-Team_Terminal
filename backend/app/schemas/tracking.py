from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TrackingEventResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    route_id: UUID | None
    status: str
    message: str
    created_at: datetime


class RouteSummary(BaseModel):
    route_id: str
    department_type: str
    department_name: str | None
    department_city: str | None
    status: str
    external_ticket_id: str | None
    distance_km: float | None


class ComplaintTrackingDetail(BaseModel):
    tracking_id: str
    overall_status: str
    ai_status: str
    ai_priority: str | None
    routes: list[RouteSummary]
    timeline: list[TrackingEventResponse]
