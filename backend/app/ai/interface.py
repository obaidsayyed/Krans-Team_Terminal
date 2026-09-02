"""
AI Agent Integration Interface
================================
This module defines the *contract* that any AI agent integration must satisfy.

IMPORTANT: This file contains NO AI or LLM implementation.
The actual AI logic is owned by a separate team.
When the AI agent is ready, implement this Protocol in `client.py`.
"""

from typing import Protocol

from app.schemas.ai_contract import AIAnalysisResult


class AIAgentInterface(Protocol):
    """
    Protocol (structural interface) for an AI agent that analyses grievance
    complaints and returns structured results.

    Any class that implements `analyze` with this signature satisfies the
    interface — no explicit inheritance required.
    """

    def analyze(self, complaint_text: str, **kwargs) -> AIAnalysisResult:
        """
        Analyse a raw complaint and return structured AI output.

        Args:
            complaint_text: The raw grievance text submitted by the citizen.
            **kwargs:        Optional extra context (language, location hint, etc.)

        Returns:
            AIAnalysisResult with title, summary, priority, departments, etc.

        Raises:
            RuntimeError: If the AI agent fails or is unavailable.
        """
        ...
