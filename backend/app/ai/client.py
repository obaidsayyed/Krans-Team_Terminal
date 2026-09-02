"""
AI Agent Client — Placeholder
==============================
IMPORTANT: This is a placeholder. No AI or LLM is implemented here.

When the AI team is ready to integrate:
1. Implement the AIAgentInterface Protocol from `app/ai/interface.py`.
2. Replace the NotImplementedError below with your actual client code.
3. Wire the client into complaint_service.py if you want auto-analysis on submit.

The PATCH /complaints/{tracking_id}/analysis endpoint allows the AI service
to push analysis results externally — that is the primary integration path.
"""

from app.ai.interface import AIAgentInterface
from app.schemas.ai_contract import AIAnalysisResult


class AIAgentClient:
    """
    Stub AI client. Replace this class body with the real implementation.

    Example integration points:
        - Gemini API via google-generativeai
        - OpenAI via openai
        - Custom internal model
        - LangChain / LangGraph agent
    """

    def analyze(self, complaint_text: str, **kwargs) -> AIAnalysisResult:
        raise NotImplementedError(
            "AI agent is not yet integrated. "
            "Use PATCH /complaints/{tracking_id}/analysis to push AI results externally."
        )


# Verify that the stub satisfies the interface at import time (type-checker friendly).
_: AIAgentInterface = AIAgentClient()
