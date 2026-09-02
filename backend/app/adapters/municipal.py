"""
SIMULATED Municipal Corporation Adapter.
WARNING: This is a mock integration. No real municipal system is contacted.
"""

import secrets

from app.adapters.base import AdapterResult, BaseAdapter


class MunicipalAdapter(BaseAdapter):

    def submit_complaint(
        self,
        complaint: dict,
        department: dict,
    ) -> AdapterResult:
        ticket_id = f"NMC-{secrets.token_hex(4).upper()}"

        return AdapterResult(
            success=True,
            external_ticket_id=ticket_id,
            status="ROUTED",
            message=f"[SIMULATED] Complaint forwarded to {department['name']}",
        )
