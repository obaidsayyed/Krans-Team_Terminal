-- =============================================================================
-- AI Grievance Redressal System — Database Schema
-- =============================================================================
-- Run this manually in your Supabase SQL editor.
-- Tables are created with IF NOT EXISTS so re-running is safe.
-- The complaints table already exists — only the new tables are here.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- departments
-- Registry of government offices / authorities that complaints can be routed to.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS departments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT        NOT NULL,
    code             TEXT        NOT NULL,          -- short identifier e.g. "NGP_POLICE_1"
    department_type  TEXT        NOT NULL,          -- matches DEPARTMENT_TYPES constant
    address          TEXT,
    city             TEXT,
    state            TEXT,
    latitude         DOUBLE PRECISION,
    longitude        DOUBLE PRECISION,
    api_endpoint     TEXT,                          -- reserved for future real-API integration
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_type
    ON departments (department_type);

CREATE INDEX IF NOT EXISTS idx_departments_city
    ON departments (city);

CREATE INDEX IF NOT EXISTS idx_departments_active
    ON departments (is_active);


-- -----------------------------------------------------------------------------
-- complaint_routes
-- One row per (complaint × department) routing decision.
-- Multiple rows per complaint when AI routes to several departments.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS complaint_routes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id        UUID        NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    department_id       UUID        NOT NULL REFERENCES departments(id),
    department_type     TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'PENDING',
    external_ticket_id  TEXT,                       -- ticket ID returned by department adapter
    distance_km         DOUBLE PRECISION,           -- Haversine distance from citizen to authority
    notes               TEXT,                       -- optional officer notes
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_routes_complaint
    ON complaint_routes (complaint_id);

CREATE INDEX IF NOT EXISTS idx_complaint_routes_department
    ON complaint_routes (department_id);

CREATE INDEX IF NOT EXISTS idx_complaint_routes_status
    ON complaint_routes (status);


-- -----------------------------------------------------------------------------
-- tracking_events
-- Append-only audit log of every status transition for a complaint or route.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tracking_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID        NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    route_id     UUID        REFERENCES complaint_routes(id) ON DELETE SET NULL,
    status       TEXT        NOT NULL,              -- the new status being recorded
    message      TEXT        NOT NULL,              -- human-readable description
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_complaint
    ON tracking_events (complaint_id);

CREATE INDEX IF NOT EXISTS idx_tracking_events_created
    ON tracking_events (complaint_id, created_at ASC);


-- =============================================================================
-- SEED DATA  (Nagpur demo — 2-3 authorities per key type)
-- Run this block separately after the tables are created.
-- =============================================================================

/*

INSERT INTO departments (name, code, department_type, address, city, state, latitude, longitude, is_active) VALUES

-- POLICE
('Sitabuldi Police Station',     'NGP_POLICE_1',   'POLICE',         'Sitabuldi, Nagpur',          'Nagpur', 'Maharashtra', 21.1468, 79.0868, TRUE),
('Lakadganj Police Station',     'NGP_POLICE_2',   'POLICE',         'Lakadganj, Nagpur',          'Nagpur', 'Maharashtra', 21.1567, 79.0748, TRUE),
('Sadar Police Station',         'NGP_POLICE_3',   'POLICE',         'Sadar, Nagpur',              'Nagpur', 'Maharashtra', 21.1368, 79.0950, TRUE),

-- TRAFFIC_POLICE
('Nagpur Traffic HQ',            'NGP_TRAFFIC_1',  'TRAFFIC_POLICE', 'Civil Lines, Nagpur',        'Nagpur', 'Maharashtra', 21.1489, 79.0926, TRUE),
('Dharampeth Traffic Post',      'NGP_TRAFFIC_2',  'TRAFFIC_POLICE', 'Dharampeth, Nagpur',         'Nagpur', 'Maharashtra', 21.1310, 79.0797, TRUE),

-- RTO
('Nagpur RTO Office',            'NGP_RTO_1',      'RTO',            'Civil Lines, Nagpur',        'Nagpur', 'Maharashtra', 21.1502, 79.0955, TRUE),
('Nagpur West RTO Sub-Office',   'NGP_RTO_2',      'RTO',            'Wadi, Nagpur',               'Nagpur', 'Maharashtra', 21.1640, 79.0490, TRUE),

-- MUNICIPAL
('NMC Main Office',              'NGP_NMC_1',      'MUNICIPAL',      'Mahal, Nagpur',              'Nagpur', 'Maharashtra', 21.1534, 79.0887, TRUE),
('NMC Zone 2 Office',            'NGP_NMC_2',      'MUNICIPAL',      'Gandhibagh, Nagpur',         'Nagpur', 'Maharashtra', 21.1441, 79.0832, TRUE),
('NMC West Zone',                'NGP_NMC_3',      'MUNICIPAL',      'Dharampeth, Nagpur',         'Nagpur', 'Maharashtra', 21.1296, 79.0784, TRUE),

-- FIRE
('Nagpur Central Fire Station',  'NGP_FIRE_1',     'FIRE',           'Sitabuldi, Nagpur',          'Nagpur', 'Maharashtra', 21.1459, 79.0881, TRUE),
('Dharampeth Fire Station',      'NGP_FIRE_2',     'FIRE',           'Dharampeth, Nagpur',         'Nagpur', 'Maharashtra', 21.1313, 79.0810, TRUE),

-- HOSPITAL
('Government Medical College & Hospital', 'NGP_HOSP_1', 'HOSPITAL',  'Hanuman Nagar, Nagpur',      'Nagpur', 'Maharashtra', 21.1412, 79.0867, TRUE),
('Daga Memorial Hospital',       'NGP_HOSP_2',     'HOSPITAL',       'Gandhibagh, Nagpur',         'Nagpur', 'Maharashtra', 21.1447, 79.0854, TRUE),
('NMC Super-Speciality Hospital','NGP_HOSP_3',     'HOSPITAL',       'Digdoh, Nagpur',             'Nagpur', 'Maharashtra', 21.1610, 79.1210, TRUE),

-- ELECTRICITY
('MSEDCL Nagpur Division',       'NGP_ELEC_1',     'ELECTRICITY',    'Civil Lines, Nagpur',        'Nagpur', 'Maharashtra', 21.1520, 79.0940, TRUE),
('MSEDCL Dharampeth Sub-Div',    'NGP_ELEC_2',     'ELECTRICITY',    'Dharampeth, Nagpur',         'Nagpur', 'Maharashtra', 21.1295, 79.0801, TRUE),

-- WATER
('NMC Water Works Department',   'NGP_WATER_1',    'WATER',          'Mahal, Nagpur',              'Nagpur', 'Maharashtra', 21.1540, 79.0910, TRUE),
('Orange City Water (OCW)',      'NGP_WATER_2',    'WATER',          'Laxmi Nagar, Nagpur',        'Nagpur', 'Maharashtra', 21.1350, 79.1100, TRUE),

-- PWD
('PWD Division Nagpur',          'NGP_PWD_1',      'PWD',            'Civil Lines, Nagpur',        'Nagpur', 'Maharashtra', 21.1508, 79.0962, TRUE),
('PWD Sub-Division West',        'NGP_PWD_2',      'PWD',            'Dharampeth, Nagpur',         'Nagpur', 'Maharashtra', 21.1280, 79.0792, TRUE),

-- SANITATION
('NMC Sanitation Dept',          'NGP_SANIT_1',    'SANITATION',     'Mahal, Nagpur',              'Nagpur', 'Maharashtra', 21.1537, 79.0892, TRUE),
('Nagpur Solid Waste Mgmt',      'NGP_SANIT_2',    'SANITATION',     'Bhandewadi, Nagpur',         'Nagpur', 'Maharashtra', 21.1180, 79.0620, TRUE);

*/
