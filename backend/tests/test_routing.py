"""Tests for complaint routing — single dept, multi-dept, duplicate prevention."""

import pytest


class TestRouteComplaint:

    def _setup_mocks(
        self,
        mocker,
        complaint,
        nearest_dept,
        existing_routes=None,
        route_exists=False,
    ):
        mocker.patch(
            "app.services.routing_service.get_complaint_by_tracking_id",
            return_value=complaint,
        )
        mocker.patch(
            "app.services.routing_service.update_complaint_status",
            return_value=complaint,
        )
        mocker.patch(
            "app.services.routing_service.find_nearest_department",
            return_value={**nearest_dept, "_distance_km": 0.85},
        )
        mocker.patch(
            "app.services.routing_service.exists_route",
            return_value=route_exists,
        )
        mocker.patch(
            "app.services.routing_service.get_routes_by_complaint_id",
            return_value=existing_routes or [],
        )

        created_route = {
            "id": "route-uuid-1",
            "complaint_id": complaint["id"],
            "department_id": nearest_dept["id"],
            "department_type": "ELECTRICITY",
            "status": "PENDING",
            "external_ticket_id": None,
            "distance_km": 0.85,
            "notes": None,
            "created_at": "2026-09-02T10:05:00+00:00",
            "updated_at": "2026-09-02T10:05:00+00:00",
        }
        mocker.patch(
            "app.services.routing_service.create_route",
            return_value=created_route,
        )

        routed = {**created_route, "status": "ROUTED", "external_ticket_id": "ELEC-TEST"}
        mock_update = mocker.patch(
            "app.services.routing_service.update_route",
            return_value=routed,
        )
        mocker.patch("app.services.routing_service.log_event", return_value={})

        return mock_update, routed

    def test_single_department_routing(
        self, mocker, analyzed_complaint, sample_department_electricity
    ):
        analyzed_complaint = {
            **analyzed_complaint,
            "ai_departments": ["ELECTRICITY"],
        }
        mock_update, routed = self._setup_mocks(
            mocker, analyzed_complaint, sample_department_electricity
        )

        from app.services.routing_service import route_complaint

        routes = route_complaint(analyzed_complaint["tracking_id"])

        assert len(routes) == 1
        assert routes[0]["status"] == "ROUTED"
        mock_update.assert_called_once()

    def test_multi_department_routing(
        self,
        mocker,
        analyzed_complaint,
        sample_department_electricity,
        sample_department_municipal,
    ):
        analyzed_complaint = {
            **analyzed_complaint,
            "ai_departments": ["ELECTRICITY", "MUNICIPAL"],
        }

        # Alternate between dept types
        dept_iter = iter([
            {**sample_department_electricity, "_distance_km": 0.85},
            {**sample_department_municipal, "_distance_km": 1.2},
        ])
        mocker.patch(
            "app.services.routing_service.find_nearest_department",
            side_effect=lambda *args, **kwargs: next(dept_iter),
        )
        mocker.patch(
            "app.services.routing_service.get_complaint_by_tracking_id",
            return_value=analyzed_complaint,
        )
        mocker.patch(
            "app.services.routing_service.update_complaint_status",
            return_value=analyzed_complaint,
        )
        mocker.patch("app.services.routing_service.exists_route", return_value=False)
        mocker.patch("app.services.routing_service.get_routes_by_complaint_id", return_value=[])

        route_counter = [0]

        def make_route(*args, **kwargs):
            route_counter[0] += 1
            return {"id": f"route-{route_counter[0]}", "complaint_id": analyzed_complaint["id"],
                    "department_id": "some-id", "department_type": "X",
                    "status": "PENDING", "external_ticket_id": None, "distance_km": 1.0,
                    "notes": None, "created_at": "", "updated_at": ""}

        mocker.patch("app.services.routing_service.create_route", side_effect=make_route)
        mocker.patch(
            "app.services.routing_service.update_route",
            side_effect=lambda route_id, data: {"id": route_id, "status": "ROUTED",
                                                  "external_ticket_id": "TICK", "complaint_id": analyzed_complaint["id"],
                                                  "department_id": "d", "department_type": "X",
                                                  "distance_km": 1.0, "notes": None, "created_at": "", "updated_at": ""},
        )
        mocker.patch("app.services.routing_service.log_event", return_value={})

        from app.services.routing_service import route_complaint

        routes = route_complaint(analyzed_complaint["tracking_id"])
        assert len(routes) == 2

    def test_duplicate_routing_is_prevented(
        self, mocker, analyzed_complaint, sample_department_electricity, sample_route
    ):
        analyzed_complaint = {
            **analyzed_complaint,
            "ai_departments": ["ELECTRICITY"],
        }
        mocker.patch(
            "app.services.routing_service.get_complaint_by_tracking_id",
            return_value=analyzed_complaint,
        )
        mocker.patch(
            "app.services.routing_service.update_complaint_status",
            return_value=analyzed_complaint,
        )
        mocker.patch(
            "app.services.routing_service.find_nearest_department",
            return_value={**sample_department_electricity, "_distance_km": 0.85},
        )
        # Route already exists
        mocker.patch("app.services.routing_service.exists_route", return_value=True)
        mocker.patch(
            "app.services.routing_service.get_routes_by_complaint_id",
            return_value=[{**sample_route, "department_id": sample_department_electricity["id"]}],
        )
        mock_create = mocker.patch("app.services.routing_service.create_route")
        mocker.patch("app.services.routing_service.log_event", return_value={})

        from app.services.routing_service import route_complaint

        routes = route_complaint(analyzed_complaint["tracking_id"])

        # Should return the existing route, but NOT create a new one
        mock_create.assert_not_called()
        assert len(routes) == 1

    def test_raises_lookup_error_for_missing_complaint(self, mocker):
        mocker.patch(
            "app.services.routing_service.get_complaint_by_tracking_id",
            return_value=None,
        )

        from app.services.routing_service import route_complaint

        with pytest.raises(LookupError):
            route_complaint("GRV-INVALID")

    def test_raises_value_error_when_no_ai_departments(
        self, mocker, sample_complaint
    ):
        mocker.patch(
            "app.services.routing_service.get_complaint_by_tracking_id",
            return_value={**sample_complaint, "ai_departments": None},
        )
        mocker.patch("app.services.routing_service.update_complaint_status", return_value={})
        mocker.patch("app.services.routing_service.log_event", return_value={})

        from app.services.routing_service import route_complaint

        with pytest.raises(ValueError, match="no AI department"):
            route_complaint(sample_complaint["tracking_id"])
