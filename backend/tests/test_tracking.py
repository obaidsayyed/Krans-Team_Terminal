"""Tests for tracking timeline and route status updates."""

import pytest


class TestGetFullTracking:

    def test_returns_tracking_detail(
        self, mocker, analyzed_complaint, sample_route
    ):
        mocker.patch(
            "app.services.tracking_service.get_complaint_by_tracking_id",
            return_value=analyzed_complaint,
        )
        mocker.patch(
            "app.services.tracking_service.get_routes_by_complaint_id",
            return_value=[{
                **sample_route,
                "departments": {"name": "MSEDCL Nagpur", "city": "Nagpur"},
            }],
        )
        mocker.patch(
            "app.services.tracking_service.get_events_by_complaint_id",
            return_value=[
                {"id": "ev1", "complaint_id": analyzed_complaint["id"],
                 "route_id": None, "status": "SUBMITTED",
                 "message": "Complaint submitted", "created_at": "2026-09-02T10:00:00+00:00"},
                {"id": "ev2", "complaint_id": analyzed_complaint["id"],
                 "route_id": None, "status": "ANALYZED",
                 "message": "AI analysis done", "created_at": "2026-09-02T10:02:00+00:00"},
            ],
        )

        from app.services.tracking_service import get_full_tracking

        result = get_full_tracking(analyzed_complaint["tracking_id"])

        assert result["tracking_id"] == analyzed_complaint["tracking_id"]
        assert result["overall_status"] == "ANALYZED"
        assert len(result["routes"]) == 1
        assert len(result["timeline"]) == 2
        assert result["routes"][0]["department_name"] == "MSEDCL Nagpur"

    def test_raises_lookup_error_for_missing_complaint(self, mocker):
        mocker.patch(
            "app.services.tracking_service.get_complaint_by_tracking_id",
            return_value=None,
        )

        from app.services.tracking_service import get_full_tracking

        with pytest.raises(LookupError):
            get_full_tracking("GRV-NOTFOUND")


class TestUpdateRouteStatus:

    def test_updates_route_and_logs_event(
        self, mocker, sample_route, analyzed_complaint
    ):
        updated_route = {**sample_route, "status": "IN_PROGRESS"}

        mocker.patch(
            "app.services.routing_service.get_route_by_id",
            return_value=sample_route,
        )
        mocker.patch(
            "app.services.routing_service.update_route",
            return_value=updated_route,
        )
        mock_log = mocker.patch(
            "app.services.routing_service.log_event",
            return_value={},
        )
        mocker.patch(
            "app.services.routing_service.get_routes_by_complaint_id",
            return_value=[updated_route],
        )
        mocker.patch(
            "app.services.routing_service.update_complaint_status",
            return_value={},
        )

        from app.services.routing_service import update_route_status

        result = update_route_status(
            route_id=sample_route["id"],
            new_status="IN_PROGRESS",
            message="Officer assigned to the complaint",
        )

        assert result["status"] == "IN_PROGRESS"
        mock_log.assert_called()

    def test_raises_value_error_for_invalid_status(self, mocker, sample_route):
        mocker.patch(
            "app.services.routing_service.get_route_by_id",
            return_value=sample_route,
        )

        from app.services.routing_service import update_route_status

        with pytest.raises(ValueError, match="Invalid route status"):
            update_route_status(sample_route["id"], "FLYING")

    def test_raises_lookup_error_for_missing_route(self, mocker):
        mocker.patch(
            "app.services.routing_service.get_route_by_id",
            return_value=None,
        )

        from app.services.routing_service import update_route_status

        with pytest.raises(LookupError):
            update_route_status("non-existent-id", "IN_PROGRESS")


class TestComplaintResolution:

    def test_complaint_resolved_when_all_routes_resolved(
        self, mocker, sample_route, analyzed_complaint
    ):
        resolved_route = {**sample_route, "status": "RESOLVED"}

        mocker.patch(
            "app.services.routing_service.get_route_by_id",
            return_value=sample_route,
        )
        mocker.patch(
            "app.services.routing_service.update_route",
            return_value=resolved_route,
        )
        mocker.patch("app.services.routing_service.log_event", return_value={})
        mocker.patch(
            "app.services.routing_service.get_routes_by_complaint_id",
            return_value=[resolved_route],  # all routes resolved
        )
        mock_status = mocker.patch(
            "app.services.routing_service.update_complaint_status",
            return_value={},
        )

        from app.services.routing_service import update_route_status

        update_route_status(sample_route["id"], "RESOLVED", "Issue fixed")

        # update_complaint_status should have been called with RESOLVED
        calls = [str(c) for c in mock_status.call_args_list]
        assert any("RESOLVED" in c for c in calls)

    def test_complaint_in_progress_when_one_route_active(
        self, mocker, sample_route, analyzed_complaint
    ):
        in_progress_route = {**sample_route, "status": "IN_PROGRESS"}
        other_resolved = {**sample_route, "id": "route-2", "status": "RESOLVED"}

        mocker.patch(
            "app.services.routing_service.get_route_by_id",
            return_value=sample_route,
        )
        mocker.patch(
            "app.services.routing_service.update_route",
            return_value=in_progress_route,
        )
        mocker.patch("app.services.routing_service.log_event", return_value={})
        mocker.patch(
            "app.services.routing_service.get_routes_by_complaint_id",
            return_value=[in_progress_route, other_resolved],
        )
        mock_status = mocker.patch(
            "app.services.routing_service.update_complaint_status",
            return_value={},
        )

        from app.services.routing_service import update_route_status

        update_route_status(sample_route["id"], "IN_PROGRESS")

        calls = [str(c) for c in mock_status.call_args_list]
        assert any("IN_PROGRESS" in c for c in calls)
