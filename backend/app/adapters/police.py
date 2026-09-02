"""
SIMULATED Police Department Adapter.
WARNING: This is a mock integration. No real police system is contacted.
"""

import secrets

from app.adapters.base import AdapterResult, BaseAdapter


class PoliceAdapter(BaseAdapter):

    def submit_complaint(
        self,
        complaint: dict,
        department: dict,
    ) -> AdapterResult:
        # Simulate a ticket ID that a real police portal would return.
        ticket_id = f"POL-{secrets.token_hex(4).upper()}"

        return AdapterResult(
            success=True,
            external_ticket_id=ticket_id,
            status="ROUTED",
            message=f"[SIMULATED] Complaint forwarded to {department['name']}",
        )
