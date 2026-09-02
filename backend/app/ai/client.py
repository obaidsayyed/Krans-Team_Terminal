"""
AI Agent Client — Lyzr AI Studio Integration
=============================================
Communicates with Lyzr AI Agent (https://agent-prod.studio.lyzr.ai/v3/inference/chat/)
to analyze citizen grievances, extracting category, priority, departments, and formal draft.
"""

import json
import logging
import re
import uuid
from typing import Any

import httpx

from app.ai.interface import AIAgentInterface
from app.core.config import settings
from app.core.constants import DEPARTMENT_TYPE_SET
from app.schemas.ai_contract import AIAnalysisResult, AIPriority

logger = logging.getLogger(__name__)

DEPARTMENT_SYNONYMS: dict[str, str] = {
    "POLICE_DEPARTMENT": "POLICE",
    "TRAFFIC": "TRAFFIC_POLICE",
    "TRAFFIC_POLICE_DEPARTMENT": "TRAFFIC_POLICE",
    "RTO_DEPARTMENT": "RTO",
    "TRANSPORT": "RTO",
    "MUNICIPALITY": "MUNICIPAL",
    "MUNICIPAL_CORPORATION": "MUNICIPAL",
    "NMC": "MUNICIPAL",
    "FIRE_BRIGADE": "FIRE",
    "FIRE_DEPARTMENT": "FIRE",
    "MEDICAL": "HOSPITAL",
    "HEALTH_DEPARTMENT": "HEALTH",
    "POWER": "ELECTRICITY",
    "ELECTRICITY_BOARD": "ELECTRICITY",
    "MSEB": "ELECTRICITY",
    "MSEDCL": "ELECTRICITY",
    "WATER_SUPPLY": "WATER",
    "WATER_DEPARTMENT": "WATER",
    "PUBLIC_WORKS": "PWD",
    "PUBLIC_WORKS_DEPARTMENT": "PWD",
    "ROADS": "PWD",
    "CLEANLINESS": "SANITATION",
    "WASTE_MANAGEMENT": "SANITATION",
}


def _parse_priority(val: Any) -> AIPriority:
    if isinstance(val, AIPriority):
        return val
    if isinstance(val, dict):
        val = val.get("level") or val.get("priority") or val.get("value")
    if isinstance(val, str):
        normalized = val.strip().upper()
        for p in AIPriority:
            if p.value == normalized:
                return p
    return AIPriority.MEDIUM


def _parse_departments(val: Any) -> list[str]:
    if isinstance(val, str):
        raw_list = [item.strip() for item in val.split(",") if item.strip()]
    elif isinstance(val, (list, tuple, set)):
        raw_list = []
        for item in val:
            if isinstance(item, dict):
                dept_name = item.get("department") or item.get("name") or item.get("dept") or ""
                if dept_name:
                    raw_list.append(str(dept_name).strip())
            elif item:
                raw_list.append(str(item).strip())
    elif isinstance(val, dict):
        dept_name = val.get("department") or val.get("name") or ""
        raw_list = [dept_name] if dept_name else []
    else:
        raw_list = []

    matched: list[str] = []
    for item in raw_list:
        clean = item.upper().replace(" ", "_")
        if clean in DEPARTMENT_TYPE_SET:
            if clean not in matched:
                matched.append(clean)
        elif clean in DEPARTMENT_SYNONYMS:
            target = DEPARTMENT_SYNONYMS[clean]
            if target in DEPARTMENT_TYPE_SET and target not in matched:
                matched.append(target)

    return matched or ["OTHER"]


def _extract_json_from_text(text: str) -> dict[str, Any] | None:
    text = text.strip()
    # 1. Try markdown code fence: ```json ... ``` or ``` ... ```
    fence_pattern = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```", re.IGNORECASE)
    match = fence_pattern.search(text)
    if match:
        fence_content = match.group(1).strip()
        try:
            parsed = json.loads(fence_content)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

    # 2. Try direct JSON parsing
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # 3. Try substring between first '{' and last '}'
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace : last_brace + 1]
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

    return None


def _build_analysis_result(
    data: dict[str, Any],
    raw_payload: dict[str, Any] | None = None,
    fallback_text: str = "",
) -> AIAnalysisResult:
    # Support alternate field names (e.g. draftedComplaint from custom Lyzr agents)
    drafted_complaint = (
        data.get("formal_draft")
        or data.get("draftedComplaint")
        or data.get("draft")
        or data.get("letter")
    )
    
    summary = str(
        data.get("summary")
        or drafted_complaint
        or data.get("message")
        or (fallback_text if fallback_text else "Citizen grievance submitted.")
    ).strip()

    formal_draft = str(
        drafted_complaint
        or summary
        or (fallback_text if fallback_text else "Grievance details forwarded for necessary action.")
    ).strip()

    departments = _parse_departments(data.get("departments"))
    priority = _parse_priority(data.get("priority"))

    # Generate or extract category
    category_val = (
        data.get("category")
        or (departments[0].replace("_", " ").title() if departments and departments[0] != "OTHER" else "Grievance")
    )
    category = str(category_val).strip()[:100]

    # Generate or extract title
    title_val = (
        data.get("title")
        or (f"{category} Grievance" if category != "Grievance" else (fallback_text[:50] if fallback_text else "Grievance Complaint"))
    )
    title = str(title_val).strip()[:255]

    return AIAnalysisResult(
        title=title or "Grievance Complaint",
        summary=summary or "Citizen grievance submitted.",
        formal_draft=formal_draft or summary or "Grievance details forwarded for necessary action.",
        category=category or "Grievance",
        priority=priority,
        departments=departments,
        raw_payload=raw_payload or data,
    )


class AIAgentClient:
    """
    Lyzr AI Studio Agent Client.
    Connects to https://agent-prod.studio.lyzr.ai/v3/inference/chat/
    and analyzes grievance text into structured AIAnalysisResult.
    """

    def __init__(
        self,
        api_url: str | None = None,
        api_key: str | None = None,
        user_id: str | None = None,
        agent_id: str | None = None,
        timeout: float | None = None,
    ) -> None:
        raw_url = api_url if api_url is not None else settings.LYZR_API_URL
        raw_key = api_key if api_key is not None else settings.LYZR_API_KEY
        raw_user = user_id if user_id is not None else settings.LYZR_USER_ID
        raw_agent = agent_id if agent_id is not None else settings.LYZR_AGENT_ID

        self.api_url = raw_url.strip().strip('"\'') if raw_url else ""
        self.api_key = raw_key.strip().strip('"\'') if raw_key else ""
        self.user_id = raw_user.strip().strip('"\'') if raw_user else ""
        self.agent_id = raw_agent.strip().strip('"\'') if raw_agent else ""
        self.timeout = timeout if timeout is not None else settings.LYZR_TIMEOUT_SECONDS

    def analyze(self, complaint_text: str, **kwargs: Any) -> AIAnalysisResult:
        """
        Send grievance text to the Lyzr AI Agent and return structured analysis.
        """
        if not self.api_key:
            raise RuntimeError(
                "LYZR_API_KEY is not configured. Please set LYZR_API_KEY in your .env file."
            )

        user_id = kwargs.get("user_id") or self.user_id or "user@grievance.system"
        agent_id = kwargs.get("agent_id") or self.agent_id or "6a97b13e5579d60760072668"
        session_id = kwargs.get("session_id") or f"{agent_id}-{uuid.uuid4().hex[:8]}"

        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
        }

        payload = {
            "user_id": user_id,
            "agent_id": agent_id,
            "session_id": session_id,
            "message": complaint_text,
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    self.api_url,
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                response_json = response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Lyzr API returned HTTP %s: %s",
                exc.response.status_code,
                exc.response.text,
            )
            raise RuntimeError(
                f"Lyzr API returned HTTP {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except httpx.RequestError as exc:
            logger.error("Failed to connect to Lyzr API: %s", exc)
            raise RuntimeError(
                f"Failed to communicate with Lyzr AI service: {exc}"
            ) from exc
        except Exception as exc:
            logger.error("Unexpected error during Lyzr AI analysis: %s", exc)
            raise RuntimeError(f"Error during AI analysis: {exc}") from exc

        return self._parse_response(response_json, fallback_text=complaint_text)

    def _parse_response(
        self,
        response_data: dict[str, Any],
        fallback_text: str = "",
    ) -> AIAnalysisResult:
        content = response_data.get("response")

        if isinstance(content, dict):
            return _build_analysis_result(
                content,
                raw_payload=response_data,
                fallback_text=fallback_text,
            )

        if isinstance(content, str):
            extracted = _extract_json_from_text(content)
            if extracted:
                return _build_analysis_result(
                    extracted,
                    raw_payload=response_data,
                    fallback_text=fallback_text,
                )
            # Freeform conversational response fallback
            return _build_analysis_result(
                {
                    "title": fallback_text[:50] or "Grievance Complaint",
                    "summary": content,
                    "formal_draft": content,
                    "category": "Grievance",
                    "priority": "MEDIUM",
                    "departments": ["OTHER"],
                },
                raw_payload=response_data,
                fallback_text=fallback_text,
            )

        if any(
            k in response_data
            for k in ("title", "summary", "formal_draft", "departments", "category")
        ):
            return _build_analysis_result(
                response_data,
                raw_payload=response_data,
                fallback_text=fallback_text,
            )

        return _build_analysis_result(
            {
                "title": fallback_text[:50] or "Grievance Complaint",
                "summary": str(response_data),
                "formal_draft": str(response_data),
                "category": "Grievance",
                "priority": "MEDIUM",
                "departments": ["OTHER"],
            },
            raw_payload=response_data,
            fallback_text=fallback_text,
        )


# Verify that the client satisfies the interface at import time
_: AIAgentInterface = AIAgentClient()

