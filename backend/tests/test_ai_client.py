"""Tests for Lyzr AI Studio Agent Client implementation."""

import json
import pytest
import httpx

from app.ai.client import (
    AIAgentClient,
    _extract_json_from_text,
    _parse_departments,
    _parse_priority,
)
from app.ai.interface import AIAgentInterface
from app.schemas.ai_contract import AIAnalysisResult, AIPriority


# ---------------------------------------------------------------------------
# Interface & Initialization Tests
# ---------------------------------------------------------------------------

class TestAIAgentClientInit:

    def test_implements_protocol(self):
        client = AIAgentClient(api_key="test-key")
        assert isinstance(client, AIAgentInterface)

    def test_raises_if_api_key_missing(self):
        client = AIAgentClient(api_key="")
        with pytest.raises(RuntimeError, match="LYZR_API_KEY is not configured"):
            client.analyze("Pothole on main road")


# ---------------------------------------------------------------------------
# Helper / Parser Functions
# ---------------------------------------------------------------------------

class TestParsers:

    def test_parse_priority(self):
        assert _parse_priority("HIGH") == AIPriority.HIGH
        assert _parse_priority("high") == AIPriority.HIGH
        assert _parse_priority("Critical") == AIPriority.CRITICAL
        assert _parse_priority("low") == AIPriority.LOW
        assert _parse_priority(AIPriority.HIGH) == AIPriority.HIGH
        assert _parse_priority("UNKNOWN_PRIORITY") == AIPriority.MEDIUM
        assert _parse_priority(None) == AIPriority.MEDIUM

    def test_parse_departments_direct_match(self):
        assert _parse_departments(["POLICE", "FIRE"]) == ["POLICE", "FIRE"]
        assert _parse_departments("POLICE, FIRE") == ["POLICE", "FIRE"]

    def test_parse_departments_synonyms(self):
        result = _parse_departments(["WATER_SUPPLY", "NMC", "POLICE_DEPARTMENT", "MSEB"])
        assert "WATER" in result
        assert "MUNICIPAL" in result
        assert "POLICE" in result
        assert "ELECTRICITY" in result

    def test_parse_departments_fallback(self):
        assert _parse_departments(["UNKNOWN_DEPT_XYZ"]) == ["OTHER"]
        assert _parse_departments([]) == ["OTHER"]

    def test_extract_json_direct(self):
        text = '{"title": "Test", "category": "Roads"}'
        res = _extract_json_from_text(text)
        assert res == {"title": "Test", "category": "Roads"}

    def test_extract_json_markdown_fence(self):
        text = 'Here is the analysis:\n```json\n{"title": "Fence Test", "priority": "HIGH"}\n```\nHope this helps!'
        res = _extract_json_from_text(text)
        assert res == {"title": "Fence Test", "priority": "HIGH"}

    def test_extract_json_substring(self):
        text = 'Prefix text {"title": "Embedded", "category": "Water"} suffix text'
        res = _extract_json_from_text(text)
        assert res == {"title": "Embedded", "category": "Water"}


# ---------------------------------------------------------------------------
# Lyzr API Request & Response Handling Tests
# ---------------------------------------------------------------------------

class TestLyzrAPIAnalyze:

    @pytest.fixture
    def client(self):
        return AIAgentClient(
            api_url="https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            api_key="test-api-key",
            user_id="test@example.com",
            agent_id="6a97b13e5579d60760072668",
            timeout=10.0,
        )

    def test_successful_analysis_json_string(self, client, mocker):
        mock_response_data = {
            "response": json.dumps({
                "title": "Severe Water Logging at Ring Road",
                "summary": "Heavy rain caused water logging for 2 days.",
                "formal_draft": "Respected Authority, please address the water logging.",
                "category": "Water Drainage",
                "priority": "HIGH",
                "departments": ["MUNICIPAL", "PWD"],
            })
        }

        mock_resp = mocker.MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_response_data
        mock_resp.raise_for_status.return_value = None

        mocker.patch("httpx.Client.post", return_value=mock_resp)

        result = client.analyze("Severe water logging on Ring Road since yesterday")

        assert result.title == "Severe Water Logging at Ring Road"
        assert result.priority == AIPriority.HIGH
        assert result.departments == ["MUNICIPAL", "PWD"]
        assert result.category == "Water Drainage"
        assert "Ring Road" in result.title

    def test_successful_analysis_dict_response(self, client, mocker):
        mock_response_data = {
            "response": {
                "title": "Transformer Sparking",
                "summary": "Electricity transformer sparking near market.",
                "formal_draft": "Dear Electricity Dept, please repair the transformer.",
                "category": "Electricity",
                "priority": "CRITICAL",
                "departments": ["ELECTRICITY", "FIRE"],
            }
        }

        mock_resp = mocker.MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_response_data
        mock_resp.raise_for_status.return_value = None

        mocker.patch("httpx.Client.post", return_value=mock_resp)

        result = client.analyze("Transformer is sparking danger!")

        assert result.title == "Transformer Sparking"
        assert result.priority == AIPriority.CRITICAL
        assert "ELECTRICITY" in result.departments
        assert "FIRE" in result.departments

    def test_conversational_response_fallback(self, client, mocker):
        mock_response_data = {
            "response": "I have noted your complaint about the broken street lights and will forward it to authorities."
        }

        mock_resp = mocker.MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_response_data
        mock_resp.raise_for_status.return_value = None

        mocker.patch("httpx.Client.post", return_value=mock_resp)

        result = client.analyze("Broken street lights for a week")

        assert isinstance(result, AIAnalysisResult)
        assert result.priority == AIPriority.MEDIUM
        assert result.departments == ["OTHER"]
        assert "broken street lights" in result.summary.lower()

    def test_http_error_handling(self, client, mocker):
        mock_resp = mocker.MagicMock()
        mock_resp.status_code = 401
        mock_resp.text = '{"detail": "Invalid API key"}'
        mock_error = httpx.HTTPStatusError(
            "Unauthorized",
            request=mocker.MagicMock(),
            response=mock_resp,
        )

        mocker.patch("httpx.Client.post", side_effect=mock_error)

        with pytest.raises(RuntimeError, match="Lyzr API returned HTTP 401"):
            client.analyze("Sample grievance")

    def test_timeout_handling(self, client, mocker):
        mocker.patch(
            "httpx.Client.post",
            side_effect=httpx.TimeoutException("Connection timed out"),
        )

        with pytest.raises(RuntimeError, match="Failed to communicate with Lyzr AI service"):
            client.analyze("Sample grievance")

    def test_custom_session_and_user_override(self, client, mocker):
        mock_response_data = {
            "response": {"title": "Test", "summary": "Sum", "formal_draft": "Draft", "category": "Cat", "priority": "LOW", "departments": ["POLICE"]}
        }
        mock_resp = mocker.MagicMock()
        mock_resp.json.return_value = mock_response_data
        mock_resp.raise_for_status.return_value = None

        mock_post = mocker.patch("httpx.Client.post", return_value=mock_resp)

        client.analyze(
            "Complaint text",
            user_id="custom_user@domain.com",
            session_id="custom-session-123",
            agent_id="6a97b13e5579d60760072668",
        )

        called_kwargs = mock_post.call_args.kwargs
        json_body = called_kwargs["json"]
        assert json_body["user_id"] == "custom_user@domain.com"
        assert json_body["session_id"] == "custom-session-123"
        assert json_body["agent_id"] == "6a97b13e5579d60760072668"
        assert json_body["message"] == "Complaint text"
