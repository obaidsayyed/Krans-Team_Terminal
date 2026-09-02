import { 
  ComplaintCreate, 
  ComplaintResponse, 
  ComplaintTrackingResponse, 
  AIAnalysisResult, 
  RouteResponse, 
  RouteStatusUpdate, 
  DepartmentResponse, 
  ComplaintTrackingDetail 
} from '../types';

// Allow configuring external backend URL via env or default to current origin (or localhost:8000 if standalone)
const API_BASE_URL = (import.meta as any).env?.VITE_FASTAPI_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}${url}` : url;
  const res = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

/**
 * 1. POST /complaints
 * Register a new complaint from citizen
 */
export async function submitComplaint(payload: ComplaintCreate): Promise<ComplaintResponse> {
  return fetchJson<ComplaintResponse>('/complaints', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * 2. GET /complaints/{tracking_id}
 * Retrieve complaint status and basic AI analysis
 */
export async function getComplaintStatus(trackingId: string): Promise<ComplaintTrackingResponse> {
  return fetchJson<ComplaintTrackingResponse>(`/complaints/${encodeURIComponent(trackingId)}`, {
    method: 'GET'
  });
}

/**
 * 3. POST /complaints/{tracking_id}/analyze
 * Trigger AI Agent analysis for a complaint
 */
export async function triggerAIAnalysis(trackingId: string): Promise<any> {
  return fetchJson<any>(`/complaints/${encodeURIComponent(trackingId)}/analyze`, {
    method: 'POST'
  });
}

/**
 * 4. PATCH /complaints/{tracking_id}/analysis
 * External AI agent push analysis results
 */
export async function submitAIAnalysis(trackingId: string, payload: AIAnalysisResult): Promise<any> {
  return fetchJson<any>(`/complaints/${encodeURIComponent(trackingId)}/analysis`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * 5. POST /complaints/{tracking_id}/route
 * Route complaint to all AI-identified nearest departments with Haversine distance
 */
export async function routeComplaint(trackingId: string): Promise<RouteResponse[]> {
  return fetchJson<RouteResponse[]>(`/complaints/${encodeURIComponent(trackingId)}/route`, {
    method: 'POST'
  });
}

/**
 * 6. GET /complaints/{tracking_id}/tracking
 * Full complaint tracking timeline with per-department routes and event logs
 */
export async function getFullTracking(trackingId: string): Promise<ComplaintTrackingDetail> {
  return fetchJson<ComplaintTrackingDetail>(`/complaints/${encodeURIComponent(trackingId)}/tracking`, {
    method: 'GET'
  });
}

/**
 * 7. GET /departments
 * List registered government departments / stations (optionally filtered by type and city)
 */
export async function listDepartments(params?: { type?: string; city?: string }): Promise<DepartmentResponse[]> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.city) query.set('city', params.city);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return fetchJson<DepartmentResponse[]>(`/departments${qs}`, {
    method: 'GET'
  });
}

/**
 * 8. GET /departments/{department_id}
 * Get department details
 */
export async function getDepartment(departmentId: string): Promise<DepartmentResponse> {
  return fetchJson<DepartmentResponse>(`/departments/${encodeURIComponent(departmentId)}`, {
    method: 'GET'
  });
}

/**
 * 9. GET /departments/{department_id}/complaints
 * List complaints routed to a specific department
 */
export async function getDepartmentComplaints(
  departmentId: string,
  params?: { status?: string; priority?: string }
): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return fetchJson<any[]>(`/departments/${encodeURIComponent(departmentId)}/complaints${qs}`, {
    method: 'GET'
  });
}

/**
 * 10. PATCH /routes/{route_id}/status
 * Officer / department updates a route status (ROUTED -> ACKNOWLEDGED -> IN_PROGRESS -> RESOLVED)
 */
export async function updateRouteStatus(routeId: string, payload: RouteStatusUpdate): Promise<RouteResponse> {
  return fetchJson<RouteResponse>(`/routes/${encodeURIComponent(routeId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * 11. GET /health or GET /
 * Health check
 */
export async function checkHealth(): Promise<{ service: string; status: string; version: string }> {
  return fetchJson<{ service: string; status: string; version: string }>('/health', {
    method: 'GET'
  });
}
