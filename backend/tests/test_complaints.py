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
