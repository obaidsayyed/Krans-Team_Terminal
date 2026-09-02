"""
SIMULATED Fire Department Adapter.
WARNING: This is a mock integration. No real fire department system is contacted.
CRITICAL SAFETY NOTE: CRITICAL-priority fire complaints are simulated only.
Real emergencies must use official emergency numbers (101 in India).
"""

import secrets

from app.adapters.base import AdapterResult, BaseAdapter


class FireAdapter(BaseAdapter):

    def submit_complaint(
        self,
        complaint: dict,
        department: dict,
    ) -> AdapterResult:
        ticket_id = f"FIRE-{secrets.token_hex(4).upper()}"

        return AdapterResult(
            success=True,
            external_ticket_id=ticket_id,
            status="ROUTED",
            message=f"[SIMULATED] Complaint forwarded to {department['name']}",
        )
