"""
Seed script — populates the departments table with Nagpur demo data.

Run manually:
    cd backend
    python -m app.database.seed

Requires the departments table to already exist (run database/schema.sql first).
Running twice is safe — existing rows with the same code are skipped.
"""

from app.database.db import supabase

SEED_DEPARTMENTS = [
    # POLICE
    {"name": "Sitabuldi Police Station",     "code": "NGP_POLICE_1",   "department_type": "POLICE",         "address": "Sitabuldi, Nagpur",          "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1468, "longitude": 79.0868, "is_active": True},
    {"name": "Lakadganj Police Station",     "code": "NGP_POLICE_2",   "department_type": "POLICE",         "address": "Lakadganj, Nagpur",          "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1567, "longitude": 79.0748, "is_active": True},
    {"name": "Sadar Police Station",         "code": "NGP_POLICE_3",   "department_type": "POLICE",         "address": "Sadar, Nagpur",              "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1368, "longitude": 79.0950, "is_active": True},
    # TRAFFIC_POLICE
    {"name": "Nagpur Traffic HQ",            "code": "NGP_TRAFFIC_1",  "department_type": "TRAFFIC_POLICE", "address": "Civil Lines, Nagpur",        "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1489, "longitude": 79.0926, "is_active": True},
    {"name": "Dharampeth Traffic Post",      "code": "NGP_TRAFFIC_2",  "department_type": "TRAFFIC_POLICE", "address": "Dharampeth, Nagpur",         "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1310, "longitude": 79.0797, "is_active": True},
    # RTO
    {"name": "Nagpur RTO Office",            "code": "NGP_RTO_1",      "department_type": "RTO",            "address": "Civil Lines, Nagpur",        "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1502, "longitude": 79.0955, "is_active": True},
    {"name": "Nagpur West RTO Sub-Office",   "code": "NGP_RTO_2",      "department_type": "RTO",            "address": "Wadi, Nagpur",               "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1640, "longitude": 79.0490, "is_active": True},
    # MUNICIPAL
    {"name": "NMC Main Office",              "code": "NGP_NMC_1",      "department_type": "MUNICIPAL",      "address": "Mahal, Nagpur",              "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1534, "longitude": 79.0887, "is_active": True},
    {"name": "NMC Zone 2 Office",            "code": "NGP_NMC_2",      "department_type": "MUNICIPAL",      "address": "Gandhibagh, Nagpur",         "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1441, "longitude": 79.0832, "is_active": True},
    {"name": "NMC West Zone",                "code": "NGP_NMC_3",      "department_type": "MUNICIPAL",      "address": "Dharampeth, Nagpur",         "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1296, "longitude": 79.0784, "is_active": True},
    # FIRE
    {"name": "Nagpur Central Fire Station",  "code": "NGP_FIRE_1",     "department_type": "FIRE",           "address": "Sitabuldi, Nagpur",          "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1459, "longitude": 79.0881, "is_active": True},
    {"name": "Dharampeth Fire Station",      "code": "NGP_FIRE_2",     "department_type": "FIRE",           "address": "Dharampeth, Nagpur",         "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1313, "longitude": 79.0810, "is_active": True},
    # HOSPITAL
    {"name": "Government Medical College & Hospital", "code": "NGP_HOSP_1", "department_type": "HOSPITAL", "address": "Hanuman Nagar, Nagpur",       "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1412, "longitude": 79.0867, "is_active": True},
    {"name": "Daga Memorial Hospital",       "code": "NGP_HOSP_2",     "department_type": "HOSPITAL",       "address": "Gandhibagh, Nagpur",         "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1447, "longitude": 79.0854, "is_active": True},
    {"name": "NMC Super-Speciality Hospital","code": "NGP_HOSP_3",     "department_type": "HOSPITAL",       "address": "Digdoh, Nagpur",             "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1610, "longitude": 79.1210, "is_active": True},
    # ELECTRICITY
    {"name": "MSEDCL Nagpur Division",       "code": "NGP_ELEC_1",     "department_type": "ELECTRICITY",    "address": "Civil Lines, Nagpur",        "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1520, "longitude": 79.0940, "is_active": True},
    {"name": "MSEDCL Dharampeth Sub-Div",    "code": "NGP_ELEC_2",     "department_type": "ELECTRICITY",    "address": "Dharampeth, Nagpur",         "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1295, "longitude": 79.0801, "is_active": True},
    # WATER
    {"name": "NMC Water Works Department",   "code": "NGP_WATER_1",    "department_type": "WATER",          "address": "Mahal, Nagpur",              "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1540, "longitude": 79.0910, "is_active": True},
    {"name": "Orange City Water (OCW)",      "code": "NGP_WATER_2",    "department_type": "WATER",          "address": "Laxmi Nagar, Nagpur",        "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1350, "longitude": 79.1100, "is_active": True},
    # PWD
    {"name": "PWD Division Nagpur",          "code": "NGP_PWD_1",      "department_type": "PWD",            "address": "Civil Lines, Nagpur",        "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1508, "longitude": 79.0962, "is_active": True},
    {"name": "PWD Sub-Division West",        "code": "NGP_PWD_2",      "department_type": "PWD",            "address": "Dharampeth, Nagpur",         "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1280, "longitude": 79.0792, "is_active": True},
    # SANITATION
    {"name": "NMC Sanitation Dept",          "code": "NGP_SANIT_1",    "department_type": "SANITATION",     "address": "Mahal, Nagpur",              "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1537, "longitude": 79.0892, "is_active": True},
    {"name": "Nagpur Solid Waste Mgmt",      "code": "NGP_SANIT_2",    "department_type": "SANITATION",     "address": "Bhandewadi, Nagpur",         "city": "Nagpur", "state": "Maharashtra", "latitude": 21.1180, "longitude": 79.0620, "is_active": True},
]


def seed() -> None:
    # Fetch existing codes to avoid duplicates
    existing = supabase.table("departments").select("code").execute()
    existing_codes = {row["code"] for row in (existing.data or [])}

    to_insert = [
        dept for dept in SEED_DEPARTMENTS
        if dept["code"] not in existing_codes
    ]

    if not to_insert:
        print("Seed: all departments already present, nothing to insert.")
        return

    response = supabase.table("departments").insert(to_insert).execute()
    inserted = len(response.data or [])
    print(f"Seed: inserted {inserted} department(s).")


if __name__ == "__main__":
    seed()
