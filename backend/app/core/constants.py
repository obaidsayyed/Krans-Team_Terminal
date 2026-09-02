"""
Project-wide constants.
Import from here instead of repeating literal strings throughout the codebase.
"""

# ---------------------------------------------------------------------------
# Department types
# ---------------------------------------------------------------------------

DEPARTMENT_TYPES: list[str] = [
    "POLICE",
    "TRAFFIC_POLICE",
    "RTO",
    "MUNICIPAL",
    "FIRE",
    "HOSPITAL",
    "HEALTH",
    "ELECTRICITY",
    "WATER",
    "PWD",
    "SANITATION",
    "OTHER",
]

DEPARTMENT_TYPE_SET: set[str] = set(DEPARTMENT_TYPES)

# ---------------------------------------------------------------------------
# Complaint statuses
# ---------------------------------------------------------------------------

COMPLAINT_STATUS_SUBMITTED = "SUBMITTED"
COMPLAINT_STATUS_ANALYZED = "ANALYZED"
COMPLAINT_STATUS_ROUTING = "ROUTING"
COMPLAINT_STATUS_ASSIGNED = "ASSIGNED"
COMPLAINT_STATUS_IN_PROGRESS = "IN_PROGRESS"
COMPLAINT_STATUS_RESOLVED = "RESOLVED"
COMPLAINT_STATUS_REJECTED = "REJECTED"

# ---------------------------------------------------------------------------
# AI analysis statuses
# ---------------------------------------------------------------------------

AI_STATUS_PENDING = "PENDING"
AI_STATUS_PROCESSING = "PROCESSING"
AI_STATUS_COMPLETED = "COMPLETED"
AI_STATUS_FAILED = "FAILED"

# ---------------------------------------------------------------------------
# AI priority levels
# ---------------------------------------------------------------------------

AI_PRIORITY_LOW = "LOW"
AI_PRIORITY_MEDIUM = "MEDIUM"
AI_PRIORITY_HIGH = "HIGH"
AI_PRIORITY_CRITICAL = "CRITICAL"

AI_PRIORITY_LEVELS: list[str] = [
    AI_PRIORITY_LOW,
    AI_PRIORITY_MEDIUM,
    AI_PRIORITY_HIGH,
    AI_PRIORITY_CRITICAL,
]

# ---------------------------------------------------------------------------
# Route statuses
# ---------------------------------------------------------------------------

ROUTE_STATUS_PENDING = "PENDING"
ROUTE_STATUS_ROUTED = "ROUTED"
ROUTE_STATUS_ACKNOWLEDGED = "ACKNOWLEDGED"
ROUTE_STATUS_IN_PROGRESS = "IN_PROGRESS"
ROUTE_STATUS_RESOLVED = "RESOLVED"
ROUTE_STATUS_FAILED = "FAILED"

ROUTE_STATUS_SET: set[str] = {
    ROUTE_STATUS_PENDING,
    ROUTE_STATUS_ROUTED,
    ROUTE_STATUS_ACKNOWLEDGED,
    ROUTE_STATUS_IN_PROGRESS,
    ROUTE_STATUS_RESOLVED,
    ROUTE_STATUS_FAILED,
}

# Statuses that count as "still active" (not finished)
ROUTE_ACTIVE_STATUSES: set[str] = {
    ROUTE_STATUS_PENDING,
    ROUTE_STATUS_ROUTED,
    ROUTE_STATUS_ACKNOWLEDGED,
    ROUTE_STATUS_IN_PROGRESS,
}
