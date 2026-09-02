"""Tests for complaint creation and AI analysis update."""

import pytest

from app.schemas.ai_contract import AIAnalysisResult, AIPriority
from app.schemas.complaint import ComplaintCreate


# ---------------------------------------------------------------------------
# Complaint creation
# ---------------------------------------------------------------------------

class TestSubmitComplaint:

    def test_creates_complaint_with_tracking_id(self, mocker, sample_complaint):
        mocker.patch(
            "app.services.complaint_service.create_complaint",
            return_value=sample_complaint,
        )
        mocker.patch(
            "app.services.complaint_service.log_event",
            return_value={},
        )

        from app.services.complaint_service import submit_complaint

        payload = ComplaintCreate(
            citizen_name="Ravi Kumar",
            contact="ravi@example.com",
            complaint="Street light not working for 5 days near Main Chowk.",
            address="Main Chowk, Nagpur",
            latitude=21.1458,
            longitude=79.0882,
        )

        result = submit_complaint(payload)

        assert result["tracking_id"].startswith("GRV-")
        assert result["status"] == "SUBMITTED"

    def test_tracking_event_is_logged_on_submit(self, mocker, sample_complaint):
        mocker.patch(
            "app.services.complaint_service.create_complaint",
            return_value=sample_complaint,
        )
        mock_log = mocker.patch(
            "app.services.complaint_service.log_event",
            return_value={},
        )

        from app.services.complaint_service import submit_complaint

        payload = ComplaintCreate(complaint="Street light issue near chowk for 5 days.")
        submit_complaint(payload)

        mock_log.assert_called_once()
        call_kwargs = mock_log.call_args.kwargs
        assert call_kwargs["status"] == "SUBMITTED"


# ---------------------------------------------------------------------------
# AI analysis update
# ---------------------------------------------------------------------------

class TestApplyAIAnalysis:

    def _make_result(self, departments=None) -> AIAnalysisResult:
        return AIAnalysisResult(
            title="Street Light Outage",
            summary="Lights off for 5 days.",
            formal_draft="To the concerned authority...",
            category="Electricity",
            priority=AIPriority.MEDIUM,
            departments=departments or ["ELECTRICITY", "MUNICIPAL"],
        )

    def test_applies_analysis_and_sets_analyzed_status(
        self, mocker, sample_complaint
    ):
        updated = {**sample_complaint, "status": "ANALYZED", "ai_status": "COMPLETED"}

        mocker.patch(
            "app.services.complaint_service.get_complaint_by_tracking_id",
            return_value=sample_complaint,
        )
        mock_update = mocker.patch(
            "app.services.complaint_service.update_complaint_ai_analysis",
            return_value=updated,
        )
        mocker.patch("app.services.complaint_service.log_event", return_value={})

        from app.services.complaint_service import apply_ai_analysis

        result = apply_ai_analysis(sample_complaint["tracking_id"], self._make_result())

        assert result["status"] == "ANALYZED"
        assert result["ai_status"] == "COMPLETED"
        mock_update.assert_called_once()
        update_data = mock_update.call_args.args[1]
        assert update_data["ai_status"] == "COMPLETED"
        assert "ELECTRICITY" in update_data["ai_departments"]

    def test_raises_lookup_error_for_unknown_tracking_id(self, mocker):
        mocker.patch(
            "app.services.complaint_service.get_complaint_by_tracking_id",
            return_value=None,
        )

        from app.services.complaint_service import apply_ai_analysis

        with pytest.raises(LookupError):
            apply_ai_analysis("GRV-INVALID", self._make_result())

    def test_raises_value_error_for_invalid_department_code(
        self, mocker, sample_complaint
    ):
        mocker.patch(
            "app.services.complaint_service.get_complaint_by_tracking_id",
            return_value=sample_complaint,
        )

        from app.services.complaint_service import apply_ai_analysis

        result = self._make_result(departments=["ELECTRICITY", "INVALID_DEPT"])

        with pytest.raises(ValueError, match="Unknown department type"):
            apply_ai_analysis(sample_complaint["tracking_id"], result)

    def test_department_codes_are_uppercased(self, mocker, sample_complaint):
        updated = {**sample_complaint, "status": "ANALYZED"}
        mocker.patch(
            "app.services.complaint_service.get_complaint_by_tracking_id",
            return_value=sample_complaint,
        )
        mock_update = mocker.patch(
            "app.services.complaint_service.update_complaint_ai_analysis",
            return_value=updated,
        )
        mocker.patch("app.services.complaint_service.log_event", return_value={})

        from app.services.complaint_service import apply_ai_analysis

        result = self._make_result(departments=["electricity", "municipal"])
        apply_ai_analysis(sample_complaint["tracking_id"], result)

        update_data = mock_update.call_args.args[1]
        assert update_data["ai_departments"] == ["ELECTRICITY", "MUNICIPAL"]


# ---------------------------------------------------------------------------
# Trigger AI Analysis
# ---------------------------------------------------------------------------

class TestAnalyzeComplaint:

    def test_analyze_complaint_success(self, mocker, sample_complaint):
        analyzed_result = AIAnalysisResult(
            title="Broken Street Light",
            summary="Street light not working.",
            formal_draft="Dear Authority...",
            category="Electricity",
            priority=AIPriority.HIGH,
            departments=["ELECTRICITY"],
        )

        mock_client = mocker.MagicMock()
        mock_client.analyze.return_value = analyzed_result

        mocker.patch(
            "app.services.complaint_service.get_complaint_by_tracking_id",
            return_value=sample_complaint,
        )
        mocker.patch(
            "app.services.complaint_service.update_complaint_ai_analysis",
            return_value={**sample_complaint, "status": "ANALYZED", "ai_status": "COMPLETED"},
        )
        mocker.patch("app.services.complaint_service.log_event", return_value={})

        from app.services.complaint_service import analyze_complaint

        result = analyze_complaint(sample_complaint["tracking_id"], ai_client=mock_client)

        assert result["status"] == "ANALYZED"
        mock_client.analyze.assert_called_once_with(
            complaint_text=sample_complaint["raw_complaint"],
            tracking_id=sample_complaint["tracking_id"],
        )

    def test_analyze_complaint_raises_lookup_error_for_unknown_tracking_id(self, mocker):
        mocker.patch(
            "app.services.complaint_service.get_complaint_by_tracking_id",
            return_value=None,
        )

        from app.services.complaint_service import analyze_complaint

        with pytest.raises(LookupError, match="Complaint not found"):
            analyze_complaint("GRV-NONEXISTENT")

    def test_analyze_complaint_handles_ai_failure(self, mocker, sample_complaint):
        mock_client = mocker.MagicMock()
        mock_client.analyze.side_effect = RuntimeError("Lyzr API down")

        mocker.patch(
            "app.services.complaint_service.get_complaint_by_tracking_id",
            return_value=sample_complaint,
        )
        mock_update = mocker.patch(
            "app.services.complaint_service.update_complaint_ai_analysis",
            return_value=sample_complaint,
        )
        mock_log = mocker.patch("app.services.complaint_service.log_event", return_value={})

        from app.services.complaint_service import analyze_complaint

        with pytest.raises(RuntimeError, match="Lyzr API down"):
            analyze_complaint(sample_complaint["tracking_id"], ai_client=mock_client)

        # Check failure state was saved
        mock_update.assert_any_call(
            sample_complaint["id"],
            {"ai_status": "FAILED"},
        )


# ---------------------------------------------------------------------------
# API Routes Tests
# ---------------------------------------------------------------------------

class TestComplaintsAPI:

    def test_post_analyze_endpoint_success(self, mocker, sample_complaint):
        from fastapi.testclient import TestClient
        from app.main import app

        analyzed_resp = {
            **sample_complaint,
            "status": "ANALYZED",
            "ai_status": "COMPLETED",
            "ai_title": "Fixed Wire",
        }

        mocker.patch(
            "app.api.routes.complaints.analyze_complaint",
            return_value=analyzed_resp,
        )

        client = TestClient(app)
        response = client.post(f"/complaints/{sample_complaint['tracking_id']}/analyze")

        assert response.status_code == 200
        assert response.json()["status"] == "ANALYZED"

    def test_post_analyze_endpoint_not_found(self, mocker):
        from fastapi.testclient import TestClient
        from app.main import app

        mocker.patch(
            "app.api.routes.complaints.analyze_complaint",
            side_effect=LookupError("Complaint not found"),
        )

        client = TestClient(app)
        response = client.post("/complaints/GRV-NONEXISTENT/analyze")

        assert response.status_code == 404

    def test_post_analyze_endpoint_gateway_error(self, mocker):
        from fastapi.testclient import TestClient
        from app.main import app

        mocker.patch(
            "app.api.routes.complaints.analyze_complaint",
            side_effect=RuntimeError("Lyzr upstream error"),
        )

        client = TestClient(app)
        response = client.post("/complaints/GRV-123/analyze")

        assert response.status_code == 502


