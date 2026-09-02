"""
Shared fixtures and test configuration.

Supabase is never called during tests — all repository functions are mocked.
"""

import pytest


# ---------------------------------------------------------------------------
# Reusable sample data
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_complaint() -> dict:
    return {
        "id":             "complaint-uuid-1",
        "tracking_id":    "GRV-20260902-AABBCC",
        "citizen_name":   "Ravi Kumar",
        "contact":        "ravi@example.com",
        "raw_complaint":  "Street light not working for 5 days near Main Chowk.",
        "address":        "Main Chowk, Nagpur",
        "latitude":       21.1458,
        "longitude":      79.0882,
        "status":         "SUBMITTED",
        "ai_status":      "PENDING",
        "ai_title":       None,
        "ai_summary":     None,
        "ai_formal_draft": None,
        "ai_category":    None,
        "ai_priority":    None,
        "ai_departments": None,
        "ai_payload":     None,
        "created_at":     "2026-09-02T10:00:00+00:00",
        "updated_at":     "2026-09-02T10:00:00+00:00",
    }


@pytest.fixture
def analyzed_complaint(sample_complaint) -> dict:
    return {
        **sample_complaint,
        "status":         "ANALYZED",
        "ai_status":      "COMPLETED",
        "ai_title":       "Street Light Outage Near Main Chowk",
        "ai_summary":     "Street lights have been non-functional for 5 days.",
        "ai_formal_draft": "To the Electricity Department...",
        "ai_category":    "Electricity",
        "ai_priority":    "MEDIUM",
        "ai_departments": ["ELECTRICITY", "MUNICIPAL"],
    }


@pytest.fixture
def sample_department_electricity() -> dict:
    return {
        "id":              "dept-elec-1",
        "name":            "MSEDCL Nagpur Division",
        "code":            "NGP_ELEC_1",
        "department_type": "ELECTRICITY",
        "city":            "Nagpur",
        "state":           "Maharashtra",
        "latitude":        21.1520,
        "longitude":       79.0940,
        "is_active":       True,
    }


@pytest.fixture
def sample_department_municipal() -> dict:
    return {
        "id":              "dept-nmc-1",
        "name":            "NMC Main Office",
        "code":            "NGP_NMC_1",
        "department_type": "MUNICIPAL",
        "city":            "Nagpur",
        "state":           "Maharashtra",
        "latitude":        21.1534,
        "longitude":       79.0887,
        "is_active":       True,
    }


@pytest.fixture
def sample_route(analyzed_complaint, sample_department_electricity) -> dict:
    return {
        "id":                 "route-uuid-1",
        "complaint_id":       analyzed_complaint["id"],
        "department_id":      sample_department_electricity["id"],
        "department_type":    "ELECTRICITY",
        "status":             "ROUTED",
        "external_ticket_id": "ELEC-AABBCCDD",
        "distance_km":        0.85,
        "notes":              None,
        "created_at":         "2026-09-02T10:05:00+00:00",
        "updated_at":         "2026-09-02T10:05:00+00:00",
    }
