import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
// Supabase Database Client & Synchronization Helpers
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseServer: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project') && SUPABASE_URL.startsWith('http')) {
  try {
    supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[Supabase DB] Initialized backend database connection.');
  } catch (e) {
    console.warn('[Supabase DB] Could not initialize backend client:', e);
  }
}

// ---------------------------------------------------------------------------
// In-Memory / Persistent Data Stores (mirroring backend database/schema.sql)
// ---------------------------------------------------------------------------

interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  department_type: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  api_endpoint: string | null;
  is_active: boolean;
  created_at: string;
}

interface ComplaintRecord {
  id: string;
  tracking_id: string;
  citizen_name: string | null;
  contact: string | null;
  raw_complaint: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string; // SUBMITTED, ANALYZED, ROUTING, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED
  ai_status: string; // PENDING, PROCESSING, COMPLETED, FAILED
  ai_title?: string | null;
  ai_summary?: string | null;
  ai_formal_draft?: string | null;
  ai_category?: string | null;
  ai_priority?: string | null; // LOW, MEDIUM, HIGH, CRITICAL
  ai_departments?: string[] | null;
  ai_payload?: any;
  created_at: string;
  updated_at: string;
}

interface RouteRecord {
  id: string;
  complaint_id: string;
  department_id: string;
  department_type: string;
  status: string; // PENDING, ROUTED, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, FAILED
  external_ticket_id: string | null;
  distance_km: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TrackingEventRecord {
  id: string;
  complaint_id: string;
  route_id: string | null;
  status: string;
  message: string;
  created_at: string;
}

// Seed Departments (mirroring database/schema.sql Nagpur demo dataset)
const DEPARTMENTS_DB: DepartmentRecord[] = [
  // POLICE
  { id: '11111111-0000-0000-0000-000000000001', name: 'Sitabuldi Police Station', code: 'NGP_POLICE_1', department_type: 'POLICE', address: 'Sitabuldi, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1468, longitude: 79.0868, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '11111111-0000-0000-0000-000000000002', name: 'Lakadganj Police Station', code: 'NGP_POLICE_2', department_type: 'POLICE', address: 'Lakadganj, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1567, longitude: 79.0748, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '11111111-0000-0000-0000-000000000003', name: 'Sadar Police Station', code: 'NGP_POLICE_3', department_type: 'POLICE', address: 'Sadar, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1368, longitude: 79.0950, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },

  // TRAFFIC_POLICE
  { id: '22222222-0000-0000-0000-000000000001', name: 'Nagpur Traffic HQ', code: 'NGP_TRAFFIC_1', department_type: 'TRAFFIC_POLICE', address: 'Civil Lines, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1489, longitude: 79.0926, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '22222222-0000-0000-0000-000000000002', name: 'Dharampeth Traffic Post', code: 'NGP_TRAFFIC_2', department_type: 'TRAFFIC_POLICE', address: 'Dharampeth, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1310, longitude: 79.0797, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },

  // RTO
  { id: '33333333-0000-0000-0000-000000000001', name: 'Nagpur RTO Office', code: 'NGP_RTO_1', department_type: 'RTO', address: 'Civil Lines, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1502, longitude: 79.0955, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '33333333-0000-0000-0000-000000000002', name: 'Nagpur West RTO Sub-Office', code: 'NGP_RTO_2', department_type: 'RTO', address: 'Wadi, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1640, longitude: 79.0490, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },

  // MUNICIPAL
  { id: '44444444-0000-0000-0000-000000000001', name: 'NMC Main Office', code: 'NGP_NMC_1', department_type: 'MUNICIPAL', address: 'Mahal, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1534, longitude: 79.0887, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '44444444-0000-0000-0000-000000000002', name: 'NMC Zone 2 Office', code: 'NGP_NMC_2', department_type: 'MUNICIPAL', address: 'Gandhibagh, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1441, longitude: 79.0832, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '44444444-0000-0000-0000-000000000003', name: 'NMC West Zone', code: 'NGP_NMC_3', department_type: 'MUNICIPAL', address: 'Dharampeth, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1296, longitude: 79.0784, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },

  // FIRE
  { id: '55555555-0000-0000-0000-000000000001', name: 'Nagpur Central Fire Station', code: 'NGP_FIRE_1', department_type: 'FIRE', address: 'Sitabuldi, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1459, longitude: 79.0881, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '55555555-0000-0000-0000-000000000002', name: 'Dharampeth Fire Station', code: 'NGP_FIRE_2', department_type: 'FIRE', address: 'Dharampeth, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1313, longitude: 79.0810, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },

  // HOSPITAL
  { id: '66666666-0000-0000-0000-000000000001', name: 'Government Medical College & Hospital', code: 'NGP_HOSP_1', department_type: 'HOSPITAL', address: 'Hanuman Nagar, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1412, longitude: 79.0867, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '66666666-0000-0000-0000-000000000002', name: 'Daga Memorial Hospital', code: 'NGP_HOSP_2', department_type: 'HOSPITAL', address: 'Gandhibagh, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1447, longitude: 79.0854, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '66666666-0000-0000-0000-000000000003', name: 'NMC Super-Speciality Hospital', code: 'NGP_HOSP_3', department_type: 'HOSPITAL', address: 'Digdoh, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1610, longitude: 79.1210, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },

  // ELECTRICITY
  { id: '77777777-0000-0000-0000-000000000001', name: 'MSEDCL Nagpur Division', code: 'NGP_ELEC_1', department_type: 'ELECTRICITY', address: 'Civil Lines, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1520, longitude: 79.0940, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '77777777-0000-0000-0000-000000000002', name: 'MSEDCL Dharampeth Sub-Div', code: 'NGP_ELEC_2', department_type: 'ELECTRICITY', address: 'Dharampeth, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1295, longitude: 79.0801, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },

  // WATER
  { id: '88888888-0000-0000-0000-000000000001', name: 'NMC Water Works Department', code: 'NGP_WATER_1', department_type: 'WATER', address: 'Mahal, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1540, longitude: 79.0910, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },
  { id: '88888888-0000-0000-0000-000000000002', name: 'Orange City Water (OCW)', code: 'NGP_WATER_2', department_type: 'WATER', address: 'Laxmi Nagar, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1350, longitude: 79.1100, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },

  // PWD
  { id: '99999999-0000-0000-0000-000000000001', name: 'PWD Division Nagpur', code: 'NGP_PWD_1', department_type: 'PWD', address: 'Civil Lines, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1508, longitude: 79.0962, api_endpoint: null, is_active: true, created_at: new Date().toISOString() },

  // SANITATION
  { id: 'aaaaaaaa-0000-0000-0000-000000000001', name: 'NMC Sanitation Dept', code: 'NGP_SANIT_1', department_type: 'SANITATION', address: 'Mahal, Nagpur', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1537, longitude: 79.0892, api_endpoint: null, is_active: true, created_at: new Date().toISOString() }
];

const COMPLAINTS_DB = new Map<string, ComplaintRecord>();
const ROUTES_DB = new Map<string, RouteRecord>();
const TRACKING_EVENTS_DB: TrackingEventRecord[] = [];

// Helper: Haversine distance in km (matching app/utils/distance.py)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function findNearestDepartment(deptType: string, lat: number, lon: number): (DepartmentRecord & { _distance_km: number }) | null {
  const matching = DEPARTMENTS_DB.filter(d => d.department_type === deptType && d.is_active);
  if (matching.length === 0) return null;

  let nearest = matching[0];
  let minDistance = haversineDistance(lat, lon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < matching.length; i++) {
    const d = matching[i];
    const dist = haversineDistance(lat, lon, d.latitude, d.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = d;
    }
  }

  return { ...nearest, _distance_km: minDistance };
}

function generateTrackingId(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `GRV-${year}-${hex}`;
}

function logTrackingEvent(complaintId: string, status: string, message: string, routeId: string | null = null): TrackingEventRecord {
  const event: TrackingEventRecord = {
    id: crypto.randomUUID(),
    complaint_id: complaintId,
    route_id: routeId,
    status,
    message,
    created_at: new Date().toISOString()
  };
  TRACKING_EVENTS_DB.push(event);
  syncTrackingEventToSupabase(event);
  return event;
}

// Supabase Async Synchronizers (Non-blocking)
async function syncComplaintToSupabase(complaint: ComplaintRecord) {
  if (!supabaseServer) return;
  try {
    const payload = {
      id: complaint.id,
      tracking_id: complaint.tracking_id,
      citizen_name: complaint.citizen_name,
      contact: complaint.contact,
      raw_complaint: complaint.raw_complaint,
      address: complaint.address,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      status: complaint.status,
      ai_status: complaint.ai_status,
      ai_title: complaint.ai_title || null,
      ai_summary: complaint.ai_summary || null,
      ai_formal_draft: complaint.ai_formal_draft || null,
      ai_category: complaint.ai_category || null,
      ai_priority: complaint.ai_priority || null,
      ai_departments: complaint.ai_departments || null,
      ai_payload: complaint.ai_payload || null,
      updated_at: complaint.updated_at
    };
    await supabaseServer.from('complaints').upsert(payload, { onConflict: 'id' });
  } catch (err: any) {
    // Graceful silent fallback if table not yet created
    console.warn('[Supabase Sync] complaints:', err.message);
  }
}

async function syncRouteToSupabase(route: RouteRecord) {
  if (!supabaseServer) return;
  try {
    const payload = {
      id: route.id,
      complaint_id: route.complaint_id,
      department_id: route.department_id,
      department_type: route.department_type,
      status: route.status,
      external_ticket_id: route.external_ticket_id,
      distance_km: route.distance_km,
      notes: route.notes,
      updated_at: route.updated_at
    };
    await supabaseServer.from('complaint_routes').upsert(payload, { onConflict: 'id' });
  } catch (err: any) {
    console.warn('[Supabase Sync] complaint_routes:', err.message);
  }
}

async function syncTrackingEventToSupabase(event: TrackingEventRecord) {
  if (!supabaseServer) return;
  try {
    const payload = {
      id: event.id,
      complaint_id: event.complaint_id,
      route_id: event.route_id,
      status: event.status,
      message: event.message,
      created_at: event.created_at
    };
    await supabaseServer.from('tracking_events').upsert(payload, { onConflict: 'id' });
  } catch (err: any) {
    console.warn('[Supabase Sync] tracking_events:', err.message);
  }
}

// ---------------------------------------------------------------------------
// AI Classifier / Analyzer (Lyzr / Gemini / Rule-based semantic model)
// ---------------------------------------------------------------------------
function performSemanticAIAnalysis(complaintText: string): {
  title: string;
  summary: string;
  formal_draft: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  departments: string[];
} {
  const text = complaintText.toLowerCase();

  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
  let category = 'General Public Grievance';
  const depts = new Set<string>();

  // Urgency & Critical keyword scoring
  if (
    text.includes('critical') || 
    text.includes('emergency') || 
    text.includes('life threat') || 
    text.includes('casualty') || 
    text.includes('blood') || 
    text.includes('fire outbreak') || 
    text.includes('explosion') || 
    text.includes('massive accident') ||
    text.includes('building collapse')
  ) {
    priority = 'CRITICAL';
  } else if (
    text.includes('urgent') || 
    text.includes('danger') || 
    text.includes('injury') || 
    text.includes('major leak') || 
    text.includes('sparking') || 
    text.includes('traffic jam') ||
    text.includes('crime') || 
    text.includes('theft')
  ) {
    priority = 'HIGH';
  } else if (
    text.includes('minor') || 
    text.includes('cosmetic') || 
    text.includes('suggestion') || 
    text.includes('inquiry')
  ) {
    priority = 'LOW';
  }

  // Department identification
  if (text.includes('accident') || text.includes('hit and run') || text.includes('collision') || text.includes('crash')) {
    category = 'Road Accident & Traffic Collision';
    depts.add('POLICE');
    depts.add('TRAFFIC_POLICE');
    depts.add('HOSPITAL');
    depts.add('RTO');
    if (priority !== 'CRITICAL') priority = 'HIGH';
  } else if (text.includes('fire') || text.includes('smoke') || text.includes('flame') || text.includes('blast') || text.includes('cylinder')) {
    category = 'Fire Outbreak & Hazard';
    depts.add('FIRE');
    depts.add('POLICE');
    depts.add('HOSPITAL');
    priority = 'CRITICAL';
  } else if (text.includes('theft') || text.includes('robbery') || text.includes('assault') || text.includes('fight') || text.includes('harassment') || text.includes('crime')) {
    category = 'Law & Order Incident';
    depts.add('POLICE');
    if (priority !== 'CRITICAL') priority = 'HIGH';
  } else if (text.includes('medical') || text.includes('ambulance') || text.includes('patient') || text.includes('injury') || text.includes('unconscious') || text.includes('hospital')) {
    category = 'Medical Emergency';
    depts.add('HOSPITAL');
    if (priority !== 'CRITICAL') priority = 'CRITICAL';
  } else if (text.includes('pothole') || text.includes('road broken') || text.includes('asphalt') || text.includes('bridge') || text.includes('flyover')) {
    category = 'Road Infrastructure & Potholes';
    depts.add('PWD');
    depts.add('MUNICIPAL');
    depts.add('TRAFFIC_POLICE');
  } else if (text.includes('garbage') || text.includes('waste') || text.includes('drain') || text.includes('sewage') || text.includes('overflow') || text.includes('trash')) {
    category = 'Civic Sanitation & Waste Management';
    depts.add('SANITATION');
    depts.add('MUNICIPAL');
  } else if (text.includes('water supply') || text.includes('pipeline') || text.includes('contamination') || text.includes('water leak')) {
    category = 'Water Supply & Pipeline';
    depts.add('WATER');
    depts.add('MUNICIPAL');
  } else if (text.includes('electric') || text.includes('power cut') || text.includes('transformer') || text.includes('wire') || text.includes('spark')) {
    category = 'Electricity & Grid Hazard';
    depts.add('ELECTRICITY');
    if (text.includes('wire') || text.includes('spark')) {
      depts.add('FIRE');
      if (priority !== 'CRITICAL') priority = 'HIGH';
    }
  } else if (text.includes('traffic') || text.includes('signal') || text.includes('choke') || text.includes('illegal parking') || text.includes('wrong side')) {
    category = 'Traffic Congestion & Violations';
    depts.add('TRAFFIC_POLICE');
    depts.add('RTO');
  } else {
    category = 'Public Civic Infrastructure';
    depts.add('MUNICIPAL');
  }

  const deptList = Array.from(depts);
  const title = `${category} - Automated Assessment`;
  const summary = `Citizen grievance report detailing: "${complaintText.slice(0, 180)}...". Evaluated with ${priority} priority urgency for coordinated municipal and public safety response.`;
  const formal_draft = `To: The Competent Authority (${deptList.join(', ')})\n\nSubject: Formal Notice & Escalation for ${category}\n\nRespected Sir/Madam,\n\nA verified citizen report has been registered regarding: "${complaintText}".\nPriority Level: ${priority}.\n\nImmediate inspection, site allotment, and remedial measures are requested in accordance with civic response protocols.\n\nAutomated AI Dispatch Desk`;

  return {
    title,
    summary,
    formal_draft,
    category,
    priority,
    departments: deptList
  };
}

// ---------------------------------------------------------------------------
// FastAPI COMPATIBLE REST API ENDPOINTS
// ---------------------------------------------------------------------------

// 0. Health Check & Supabase Diagnostic
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    service: 'AI Grievance Redressal System',
    status: 'running',
    version: '0.2.0',
    supabaseConnected: Boolean(supabaseServer),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.get('/api/supabase-status', async (req: express.Request, res: express.Response) => {
  const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project'));
  if (!isConfigured) {
    return res.json({
      configured: false,
      message: 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or default in server environment.',
      url: SUPABASE_URL || 'Not Set',
    });
  }

  if (!supabaseServer) {
    return res.json({
      configured: true,
      connected: false,
      message: 'Supabase client failed to initialize.',
    });
  }

  try {
    const { data, error } = await supabaseServer.from('departments').select('id').limit(1);
    if (error) {
      return res.json({
        configured: true,
        connected: false,
        error: error.message,
        hint: 'Check if you have run schema.sql in your Supabase SQL Editor.',
      });
    }
    return res.json({
      configured: true,
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL database!',
      sampleCheck: `${data?.length ?? 0} rows found in 'departments' table`,
    });
  } catch (err: any) {
    return res.status(500).json({
      configured: true,
      connected: false,
      error: err.message,
    });
  }
});

// 1. POST /complaints & /api/complaints
const createComplaintHandler = (req: express.Request, res: express.Response) => {
  try {
    const { citizen_name, contact, complaint, address, latitude, longitude } = req.body;

    if (!complaint || typeof complaint !== 'string' || complaint.trim().length < 5) {
      return res.status(400).json({ detail: 'Complaint text must be at least 5 characters long.' });
    }

    const id = crypto.randomUUID();
    const tracking_id = generateTrackingId();
    const now = new Date().toISOString();

    const newComplaint: ComplaintRecord = {
      id,
      tracking_id,
      citizen_name: citizen_name || null,
      contact: contact || null,
      raw_complaint: complaint,
      address: address || null,
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
      status: 'SUBMITTED',
      ai_status: 'PENDING',
      created_at: now,
      updated_at: now
    };

    COMPLAINTS_DB.set(tracking_id, newComplaint);
    logTrackingEvent(id, 'SUBMITTED', 'Complaint submitted by citizen');
    syncComplaintToSupabase(newComplaint);

    res.status(201).json(newComplaint);
  } catch (err: any) {
    console.error('Error submitting complaint:', err);
    res.status(500).json({ detail: 'Failed to create complaint: ' + err.message });
  }
};
app.post('/complaints', createComplaintHandler);
app.post('/api/complaints', createComplaintHandler);

// 2. GET /complaints/:tracking_id & /api/complaints/:tracking_id
const getComplaintHandler = (req: express.Request, res: express.Response) => {
  const { tracking_id } = req.params;
  const complaint = COMPLAINTS_DB.get(tracking_id);

  if (!complaint) {
    return res.status(404).json({ detail: 'Complaint not found' });
  }

  res.json({
    tracking_id: complaint.tracking_id,
    status: complaint.status,
    ai_status: complaint.ai_status,
    ai_title: complaint.ai_title || null,
    ai_category: complaint.ai_category || null,
    ai_priority: complaint.ai_priority || null,
    ai_departments: complaint.ai_departments || null,
    created_at: complaint.created_at,
    updated_at: complaint.updated_at
  });
};
app.get('/complaints/:tracking_id', getComplaintHandler);
app.get('/api/complaints/:tracking_id', getComplaintHandler);

// 3. POST /complaints/:tracking_id/analyze & /api/complaints/:tracking_id/analyze
const analyzeComplaintHandler = (req: express.Request, res: express.Response) => {
  const { tracking_id } = req.params;
  const complaint = COMPLAINTS_DB.get(tracking_id);

  if (!complaint) {
    return res.status(404).json({ detail: 'Complaint not found' });
  }

  complaint.ai_status = 'PROCESSING';
  logTrackingEvent(complaint.id, 'AI_PROCESSING', 'AI analysis started via AI Agent');

  const analysis = performSemanticAIAnalysis(complaint.raw_complaint);

  complaint.ai_title = analysis.title;
  complaint.ai_summary = analysis.summary;
  complaint.ai_formal_draft = analysis.formal_draft;
  complaint.ai_category = analysis.category;
  complaint.ai_priority = analysis.priority;
  complaint.ai_departments = analysis.departments;
  complaint.ai_status = 'COMPLETED';
  complaint.status = 'ANALYZED';
  complaint.updated_at = new Date().toISOString();

  logTrackingEvent(
    complaint.id,
    'ANALYZED',
    `AI analysis completed — category: ${analysis.category}, priority: ${analysis.priority}, departments: ${analysis.departments.join(', ')}`
  );
  syncComplaintToSupabase(complaint);

  res.json(complaint);
};
app.post('/complaints/:tracking_id/analyze', analyzeComplaintHandler);
app.post('/api/complaints/:tracking_id/analyze', analyzeComplaintHandler);

// 4. PATCH /complaints/:tracking_id/analysis & /api/complaints/:tracking_id/analysis
const submitAIAnalysisHandler = (req: express.Request, res: express.Response) => {
  const { tracking_id } = req.params;
  const complaint = COMPLAINTS_DB.get(tracking_id);

  if (!complaint) {
    return res.status(404).json({ detail: 'Complaint not found' });
  }

  const { title, summary, formal_draft, category, priority, departments, raw_payload } = req.body;

  if (!title || !summary || !category || !priority || !Array.isArray(departments) || departments.length === 0) {
    return res.status(400).json({ detail: 'Invalid AI analysis payload. Required: title, summary, category, priority, departments[]' });
  }

  complaint.ai_title = title;
  complaint.ai_summary = summary;
  complaint.ai_formal_draft = formal_draft || summary;
  complaint.ai_category = category;
  complaint.ai_priority = priority;
  complaint.ai_departments = departments.map((d: string) => d.toUpperCase());
  complaint.ai_payload = raw_payload || null;
  complaint.ai_status = 'COMPLETED';
  complaint.status = 'ANALYZED';
  complaint.updated_at = new Date().toISOString();

  logTrackingEvent(
    complaint.id,
    'ANALYZED',
    `AI analysis submitted — category: ${category}, priority: ${priority}, departments: ${departments.join(', ')}`
  );
  syncComplaintToSupabase(complaint);

  res.json(complaint);
};
app.patch('/complaints/:tracking_id/analysis', submitAIAnalysisHandler);
app.patch('/api/complaints/:tracking_id/analysis', submitAIAnalysisHandler);

// 5. POST /complaints/:tracking_id/route & /api/complaints/:tracking_id/route
const routeComplaintHandler = (req: express.Request, res: express.Response) => {
  const { tracking_id } = req.params;
  const complaint = COMPLAINTS_DB.get(tracking_id);

  if (!complaint) {
    return res.status(404).json({ detail: 'Complaint not found' });
  }

  // If not analyzed yet, analyze first
  if (!complaint.ai_departments || complaint.ai_departments.length === 0) {
    const autoAnalysis = performSemanticAIAnalysis(complaint.raw_complaint);
    complaint.ai_title = autoAnalysis.title;
    complaint.ai_summary = autoAnalysis.summary;
    complaint.ai_formal_draft = autoAnalysis.formal_draft;
    complaint.ai_category = autoAnalysis.category;
    complaint.ai_priority = autoAnalysis.priority;
    complaint.ai_departments = autoAnalysis.departments;
    complaint.ai_status = 'COMPLETED';
    complaint.status = 'ANALYZED';
  }

  complaint.status = 'ROUTING';
  logTrackingEvent(complaint.id, 'ROUTING', 'Routing to identified nearest departments');

  const createdRoutes: RouteRecord[] = [];
  const citizenLat = complaint.latitude ?? 21.1458;
  const citizenLon = complaint.longitude ?? 79.0882;

  for (const deptType of complaint.ai_departments) {
    // Check if route already exists
    const existing = Array.from(ROUTES_DB.values()).find(
      r => r.complaint_id === complaint.id && r.department_type === deptType
    );
    if (existing) {
      createdRoutes.push(existing);
      continue;
    }

    const nearest = findNearestDepartment(deptType, citizenLat, citizenLon);
    if (!nearest) {
      logTrackingEvent(complaint.id, 'ROUTING', `No active ${deptType} department found — skipped`);
      continue;
    }

    const routeId = crypto.randomUUID();
    const prefix = deptType.slice(0, 3).toUpperCase();
    const token = crypto.randomBytes(2).toString('hex').toUpperCase();
    const external_ticket_id = `${prefix}-${token}`;
    const now = new Date().toISOString();

    const newRoute: RouteRecord = {
      id: routeId,
      complaint_id: complaint.id,
      department_id: nearest.id,
      department_type: deptType,
      status: 'ROUTED',
      external_ticket_id,
      distance_km: nearest._distance_km,
      notes: null,
      created_at: now,
      updated_at: now
    };

    ROUTES_DB.set(routeId, newRoute);
    createdRoutes.push(newRoute);
    syncRouteToSupabase(newRoute);

    logTrackingEvent(
      complaint.id,
      'ROUTED',
      `Complaint routed to ${nearest.name} (${deptType}) — ticket: ${external_ticket_id} — distance: ${nearest._distance_km} km`,
      routeId
    );
  }

  if (createdRoutes.length > 0) {
    complaint.status = 'ASSIGNED';
    complaint.updated_at = new Date().toISOString();
    logTrackingEvent(complaint.id, 'ASSIGNED', `Complaint assigned to ${createdRoutes.length} department(s)`);
    syncComplaintToSupabase(complaint);
  }

  res.status(201).json(createdRoutes);
};
app.post('/complaints/:tracking_id/route', routeComplaintHandler);
app.post('/api/complaints/:tracking_id/route', routeComplaintHandler);

// 6. GET /complaints/:tracking_id/tracking & /api/complaints/:tracking_id/tracking
const getFullTrackingHandler = (req: express.Request, res: express.Response) => {
  const { tracking_id } = req.params;
  const complaint = COMPLAINTS_DB.get(tracking_id);

  if (!complaint) {
    return res.status(404).json({ detail: 'Complaint not found' });
  }

  const routes = Array.from(ROUTES_DB.values())
    .filter(r => r.complaint_id === complaint.id)
    .map(r => {
      const dept = DEPARTMENTS_DB.find(d => d.id === r.department_id);
      return {
        route_id: r.id,
        department_type: r.department_type,
        department_name: dept ? dept.name : null,
        department_city: dept ? dept.city : null,
        status: r.status,
        external_ticket_id: r.external_ticket_id,
        distance_km: r.distance_km
      };
    });

  const timeline = TRACKING_EVENTS_DB.filter(e => e.complaint_id === complaint.id);

  res.json({
    tracking_id: complaint.tracking_id,
    overall_status: complaint.status,
    ai_status: complaint.ai_status,
    ai_priority: complaint.ai_priority || null,
    routes,
    timeline
  });
};
app.get('/complaints/:tracking_id/tracking', getFullTrackingHandler);
app.get('/api/complaints/:tracking_id/tracking', getFullTrackingHandler);

// 7. GET /departments & /api/departments
const listDepartmentsHandler = (req: express.Request, res: express.Response) => {
  const typeFilter = req.query.type as string | undefined;
  const cityFilter = req.query.city as string | undefined;

  let results = DEPARTMENTS_DB.filter(d => d.is_active);

  if (typeFilter) {
    results = results.filter(d => d.department_type.toLowerCase() === typeFilter.toLowerCase());
  }

  if (cityFilter) {
    results = results.filter(d => d.city.toLowerCase() === cityFilter.toLowerCase());
  }

  res.json(results);
};
app.get('/departments', listDepartmentsHandler);
app.get('/api/departments', listDepartmentsHandler);

// 8. GET /departments/:department_id & /api/departments/:department_id
const getDepartmentHandler = (req: express.Request, res: express.Response) => {
  const { department_id } = req.params;
  const dept = DEPARTMENTS_DB.find(d => d.id === department_id);

  if (!dept) {
    return res.status(404).json({ detail: 'Department not found' });
  }

  res.json(dept);
};
app.get('/departments/:department_id', getDepartmentHandler);
app.get('/api/departments/:department_id', getDepartmentHandler);

// 9. GET /departments/:department_id/complaints & /api/departments/:department_id/complaints
const getDepartmentComplaintsHandler = (req: express.Request, res: express.Response) => {
  const { department_id } = req.params;
  const statusFilter = (req.query.status as string | undefined)?.toUpperCase();
  const priorityFilter = (req.query.priority as string | undefined)?.toUpperCase();

  const dept = DEPARTMENTS_DB.find(d => d.id === department_id);
  if (!dept) {
    return res.status(404).json({ detail: 'Department not found' });
  }

  const deptRoutes = Array.from(ROUTES_DB.values()).filter(r => r.department_id === department_id);

  const matched = deptRoutes.map(route => {
    const comp = Array.from(COMPLAINTS_DB.values()).find(c => c.id === route.complaint_id);
    return {
      ...route,
      complaint: comp || null
    };
  });

  let filtered = matched;
  if (statusFilter) {
    filtered = filtered.filter(item => item.status.toUpperCase() === statusFilter);
  }
  if (priorityFilter) {
    filtered = filtered.filter(item => item.complaint?.ai_priority?.toUpperCase() === priorityFilter);
  }

  res.json(filtered);
};
app.get('/departments/:department_id/complaints', getDepartmentComplaintsHandler);
app.get('/api/departments/:department_id/complaints', getDepartmentComplaintsHandler);

// 10. PATCH /routes/:route_id/status & /api/routes/:route_id/status
const updateRouteStatusHandler = (req: express.Request, res: express.Response) => {
  const { route_id } = req.params;
  const { status, message } = req.body;

  const route = ROUTES_DB.get(route_id);
  if (!route) {
    return res.status(404).json({ detail: 'Route not found' });
  }

  const validStatuses = ['PENDING', 'ROUTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'FAILED'];
  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({ detail: `Invalid route status: ${status}. Valid: ${validStatuses.join(', ')}` });
  }

  const newStatus = status.toUpperCase();
  route.status = newStatus;
  if (message) route.notes = message;
  route.updated_at = new Date().toISOString();
  syncRouteToSupabase(route);

  logTrackingEvent(
    route.complaint_id,
    newStatus,
    message || `Route status updated to ${newStatus}`,
    route_id
  );

  // Synchronize aggregate complaint status
  const allRoutesForComplaint = Array.from(ROUTES_DB.values()).filter(r => r.complaint_id === route.complaint_id);
  const complaint = Array.from(COMPLAINTS_DB.values()).find(c => c.id === route.complaint_id);

  if (complaint && allRoutesForComplaint.length > 0) {
    const statuses = allRoutesForComplaint.map(r => r.status);
    if (statuses.every(s => s === 'RESOLVED')) {
      complaint.status = 'RESOLVED';
      complaint.updated_at = new Date().toISOString();
      logTrackingEvent(complaint.id, 'RESOLVED', 'All department routes resolved — complaint closed');
      syncComplaintToSupabase(complaint);
    } else if (statuses.includes('IN_PROGRESS')) {
      complaint.status = 'IN_PROGRESS';
      complaint.updated_at = new Date().toISOString();
      logTrackingEvent(complaint.id, 'IN_PROGRESS', 'Department action in progress');
      syncComplaintToSupabase(complaint);
    }
  }

  res.json(route);
};
app.patch('/routes/:route_id/status', updateRouteStatusHandler);
app.patch('/api/routes/:route_id/status', updateRouteStatusHandler);

// ---------------------------------------------------------------------------
// Vite Integration for Development / Static Serving in Production
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicPulse FastAPI-compliant backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
