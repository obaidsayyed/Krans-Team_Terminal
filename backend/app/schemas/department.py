from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    code: str
    department_type: str
    address: str | None
    city: str | None
    state: str | None
    latitude: float | None
    longitude: float | None
    api_endpoint: str | None
    is_active: bool
    created_at: datetime
