"""Tests for department listing and nearest-department selection."""

import pytest

from app.utils.distance import haversine_km


# ---------------------------------------------------------------------------
# Haversine distance
# ---------------------------------------------------------------------------

class TestHaversineKm:

    def test_same_point_is_zero(self):
        assert haversine_km(21.1458, 79.0882, 21.1458, 79.0882) == 0.0

    def test_known_distance_nagpur_to_delhi(self):
        # Nagpur (21.1458, 79.0882) → Delhi (28.6139, 77.2090)
        # Haversine gives ~852 km for these coordinates
        dist = haversine_km(21.1458, 79.0882, 28.6139, 77.2090)
        assert 820 < dist < 900

    def test_symmetrical(self):
        d1 = haversine_km(21.1458, 79.0882, 21.1520, 79.0940)
        d2 = haversine_km(21.1520, 79.0940, 21.1458, 79.0882)
        assert abs(d1 - d2) < 0.001

    def test_nearby_points_under_2km(self):
        # Two points ~700 m apart within Nagpur
        dist = haversine_km(21.1458, 79.0882, 21.1520, 79.0940)
        assert dist < 2.0


# ---------------------------------------------------------------------------
# Department listing
# ---------------------------------------------------------------------------

class TestListDepartments:

    def test_lists_all_departments(self, mocker):
        mock_depts = [{"id": "1", "department_type": "POLICE"}]
        mocker.patch(
            "app.services.department_service.get_all_departments",
            return_value=mock_depts,
        )

        from app.services.department_service import list_departments

        result = list_departments()
        assert result == mock_depts

    def test_raises_for_invalid_type(self):
        from app.services.department_service import list_departments

        with pytest.raises(ValueError, match="Unknown department type"):
            list_departments(type_filter="UNICORN")

    def test_accepts_valid_types(self, mocker):
        mocker.patch(
            "app.services.department_service.get_all_departments",
            return_value=[],
        )

        from app.services.department_service import list_departments

        # Should not raise
        for dept_type in ["POLICE", "HOSPITAL", "FIRE", "RTO"]:
            list_departments(type_filter=dept_type)


# ---------------------------------------------------------------------------
# Nearest department selection
# ---------------------------------------------------------------------------

class TestFindNearestDepartment:

    def test_returns_closest_department(
        self, mocker, sample_department_electricity
    ):
        far_dept = {
            **sample_department_electricity,
            "id": "dept-elec-far",
            "latitude": 21.2000,
            "longitude": 79.1500,
        }
        near_dept = {
            **sample_department_electricity,
            "id": "dept-elec-near",
            "latitude": 21.1460,
            "longitude": 79.0885,
        }

        mocker.patch(
            "app.services.location_service.get_departments_by_type",
            return_value=[far_dept, near_dept],
        )

        from app.services.location_service import find_nearest_department

        result = find_nearest_department("ELECTRICITY", 21.1458, 79.0882)

        assert result is not None
        assert result["id"] == "dept-elec-near"
        assert result["_distance_km"] < 1.0

    def test_returns_none_when_no_departments(self, mocker):
        mocker.patch(
            "app.services.location_service.get_departments_by_type",
            return_value=[],
        )

        from app.services.location_service import find_nearest_department

        result = find_nearest_department("POLICE", 21.1458, 79.0882)
        assert result is None

    def test_skips_departments_without_coordinates(self, mocker):
        no_coords = {"id": "no-coords", "department_type": "POLICE", "latitude": None, "longitude": None, "is_active": True}
        valid_dept = {"id": "valid", "department_type": "POLICE", "latitude": 21.1468, "longitude": 79.0868, "is_active": True}

        mocker.patch(
            "app.services.location_service.get_departments_by_type",
            return_value=[no_coords, valid_dept],
        )

        from app.services.location_service import find_nearest_department

        result = find_nearest_department("POLICE", 21.1458, 79.0882)
        assert result is not None
        assert result["id"] == "valid"
