"""
Base adapter interface for department integrations.

Every department adapter must implement submit_complaint().
When a real government API becomes available, replace the mock body
with actual HTTP calls without changing the routing service.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class AdapterResult:
    success: bool
    external_ticket_id: str | None
    status: str
    message: str


class BaseAdapter(ABC):
    """Abstract base for all department adapters."""

    @abstractmethod
    def submit_complaint(
        self,
        complaint: dict,
        department: dict,
    ) -> AdapterResult:
        """
        Submit a complaint to the target department system.

        Args:
            complaint:  Full complaint dict from Supabase.
            department: Full department dict from Supabase.

        Returns:
            AdapterResult with success flag, ticket ID, and status.
        """
        ...
