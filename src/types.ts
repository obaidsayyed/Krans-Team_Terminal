export type UserRole = 
  | 'citizen' 
  | 'admin' 
  | 'police' 
  | 'rto' 
  | 'hospital' 
  | 'fire' 
  | 'municipal';

export type ServiceDepartment = 
  | 'police' 
  | 'rto' 
  | 'hospital' 
  | 'fire' 
  | 'municipal';

export type IncidentStatus = 
  | 'registered' 
  | 'allotted' 
  | 'in_progress' 
  | 'action_taken' 
  | 'resolved';

export type ComplaintSeverity = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  accuracy?: number;
}

export interface TimelineEvent {
  status: IncidentStatus;
  label: string;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  preferredService: ServiceDepartment;
  assignedService: ServiceDepartment;
  allocatedBy: 'citizen' | 'admin' | 'auto';
  severity: ComplaintSeverity;
  status: IncidentStatus;
  progressPercent: number; // 0, 25, 50, 75, 100
  photos: string[];
  location: LocationData;
  timestamp: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail: string;
  isEmergencySOS: boolean;
  assignedOfficer?: string;
  responderNotes?: string[];
  timeline: TimelineEvent[];
  rating?: number;
  feedback?: string;
  resolvedAt?: string;
  isEscalatedToAdmin?: boolean;
  escalatedAt?: string;
  escalationReason?: string;
  adminAcknowledged?: boolean;
}

export interface SOSAlert {
  id: string;
  type: 'medical' | 'fire' | 'crime' | 'accident' | 'general';
  citizenName: string;
  citizenPhone: string;
  location: LocationData;
  timestamp: string;
  status: 'active' | 'dispatched' | 'resolved';
  escalatedByAdmin: boolean;
  assignedService: ServiceDepartment;
  audioTriggered: boolean;
  notes?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  badgeNumber?: string;
  department?: ServiceDepartment;
  createdAt: string;
}

export interface UserSession {
  role: UserRole;
  name: string;
  email: string;
  badgeNumber?: string;
  department?: ServiceDepartment;
  phone?: string;
  id?: string;
  token?: string;
}

export interface DepartmentInfo {
  id: ServiceDepartment;
  name: string;
  shortName: string;
  iconName: string;
  color: string;
  accentBg: string;
  accentBorder: string;
  badgeColor: string;
  description: string;
  helpline: string;
  typicalCategories: string[];
  defaultOfficer: string;
}

// ---------------------------------------------------------------------------
// FastAPI Backend Integration Types & Contracts
// ---------------------------------------------------------------------------

export type FastAPIComplaintStatus = 
  | 'SUBMITTED'
  | 'ANALYZED'
  | 'ROUTING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export type FastAPIAIStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type FastAPIAIPriority = 
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export interface ComplaintCreate {
  citizen_name?: string | null;
  contact?: string | null;
  complaint: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ComplaintResponse {
  id: string;
  tracking_id: string;
  citizen_name: string | null;
  contact: string | null;
  raw_complaint: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: FastAPIComplaintStatus;
  ai_status: FastAPIAIStatus;
  created_at: string;
  updated_at: string;
}

export interface ComplaintTrackingResponse {
  tracking_id: string;
  status: FastAPIComplaintStatus;
  ai_status: FastAPIAIStatus;
  ai_title?: string | null;
  ai_category?: string | null;
  ai_priority?: string | null;
  ai_departments?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysisResult {
  title: string;
  summary: string;
  formal_draft: string;
  category: string;
  priority: FastAPIAIPriority;
  departments: string[];
  raw_payload?: Record<string, any> | null;
}

export interface RouteResponse {
  id: string;
  complaint_id: string;
  department_id: string;
  department_type: string;
  status: string;
  external_ticket_id: string | null;
  distance_km: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RouteStatusUpdate {
  status: string;
  message?: string | null;
}

export interface DepartmentResponse {
  id: string;
  name: string;
  code: string;
  department_type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  api_endpoint: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RouteSummary {
  route_id: string;
  department_type: string;
  department_name: string | null;
  department_city: string | null;
  status: string;
  external_ticket_id: string | null;
  distance_km: number | null;
}

export interface TrackingEventResponse {
  id: string;
  complaint_id: string;
  route_id: string | null;
  status: string;
  message: string;
  created_at: string;
}

export interface ComplaintTrackingDetail {
  tracking_id: string;
  overall_status: string;
  ai_status: string;
  ai_priority: string | null;
  routes: RouteSummary[];
  timeline: TrackingEventResponse[];
}

