from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.core.constants import ROUTE_STATUS_SET


class RouteStatusUpdate(BaseModel):
    """Payload for an officer or department updating a route's status."""

    status: str
    message: str | None = None

    def validate_status(self) -> None:
        if self.status not in ROUTE_STATUS_SET:
            raise ValueError(
                f"Invalid route status: {self.status!r}. "
                f"Valid statuses: {sorted(ROUTE_STATUS_SET)}"
            )


class RouteResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    department_id: UUID
    department_type: str
    status: str
    external_ticket_id: str | None
    distance_km: float | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
