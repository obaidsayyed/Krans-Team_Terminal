"""
SIMULATED RTO Adapter.
WARNING: This is a mock integration. No real RTO system is contacted.
"""

import secrets

from app.adapters.base import AdapterResult, BaseAdapter


class RTOAdapter(BaseAdapter):

    def submit_complaint(
        self,
        complaint: dict,
        department: dict,
    ) -> AdapterResult:
        ticket_id = f"RTO-{secrets.token_hex(4).upper()}"

        return AdapterResult(
            success=True,
            external_ticket_id=ticket_id,
            status="ROUTED",
            message=f"[SIMULATED] Complaint forwarded to {department['name']}",
        )
