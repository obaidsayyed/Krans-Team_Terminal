"""
SIMULATED Hospital Adapter.
WARNING: This is a mock integration. No real hospital system is contacted.
CRITICAL SAFETY NOTE: CRITICAL-priority medical complaints are simulated only.
Real medical emergencies must use official emergency numbers (108 in India).
"""

import secrets

from app.adapters.base import AdapterResult, BaseAdapter


class HospitalAdapter(BaseAdapter):

    def submit_complaint(
        self,
        complaint: dict,
        department: dict,
    ) -> AdapterResult:
        ticket_id = f"HOSP-{secrets.token_hex(4).upper()}"

        return AdapterResult(
            success=True,
            external_ticket_id=ticket_id,
            status="ROUTED",
            message=f"[SIMULATED] Complaint forwarded to {department['name']}",
        )
