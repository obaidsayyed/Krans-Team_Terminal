import { Complaint, SOSAlert, ServiceDepartment, IncidentStatus, UserAccount, UserSession, UserRole, LocationData } from '../types';
import { SAMPLE_INCIDENT_PHOTOS } from './constants';
import { playDispatchRingtone, playEmergencySiren, playAdminEscalationRingtone } from './audio';

const STORAGE_KEY_COMPLAINTS = 'civicpulse_complaints_v6_live';
const STORAGE_KEY_SOS = 'civicpulse_sos_alerts_v6_live';
const STORAGE_KEY_USERS = 'civicpulse_users_v6_live';

// No hardcoded mock/demo users - purely user-registered or backend-provided accounts
const INITIAL_USERS: UserAccount[] = [];

// No sample complaints - starts completely empty for real live submissions
const INITIAL_COMPLAINTS: Complaint[] = [];

// No sample SOS alerts - starts completely empty
const INITIAL_SOS_ALERTS: SOSAlert[] = [];

// Event emitter helper for cross-component and tab reactive state
class CivicEventManager extends EventTarget {
  emitChange() {
    this.dispatchEvent(new CustomEvent('civic_state_change'));
  }

  emitDeptComplaint(department: ServiceDepartment, complaint: Complaint) {
    this.dispatchEvent(new CustomEvent('dept_complaint_alert', { 
      detail: { department, complaint } 
    }));
  }

  emitAdminEscalation(complaint: Complaint, reason: string) {
    this.dispatchEvent(new CustomEvent('admin_escalation_alert', { 
      detail: { complaint, reason } 
    }));
  }
}

export const civicEvents = new CivicEventManager();

export function getStoredUsers(): UserAccount[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  const data = localStorage.getItem(STORAGE_KEY_USERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse users:', e);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: UserAccount[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  civicEvents.emitChange();
}

/**
 * Register a new user with selected role from dropdown
 */
export function registerUserAccount(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  badgeNumber?: string;
}): { success: boolean; account?: UserAccount; session?: UserSession; error?: string } {
  const users = getStoredUsers();
  const normalizedEmail = data.email.trim().toLowerCase();

  // Check duplicate email
  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please sign in.'
    };
  }

  // Derive department if role is one of the 5 services
  const isDept = (['police', 'rto', 'hospital', 'fire', 'municipal'] as UserRole[]).includes(data.role);
  const department = isDept ? (data.role as ServiceDepartment) : undefined;

  const newAccount: UserAccount = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: data.name.trim(),
    email: normalizedEmail,
    password: data.password,
    role: data.role,
    phone: data.phone?.trim(),
    badgeNumber: data.badgeNumber?.trim() || (isDept ? `${data.role.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}` : undefined),
    department,
    createdAt: new Date().toISOString()
  };

  const updatedUsers = [...users, newAccount];
  saveUsers(updatedUsers);

  const session: UserSession = {
    role: newAccount.role,
    name: newAccount.name,
    email: newAccount.email,
    phone: newAccount.phone,
    badgeNumber: newAccount.badgeNumber,
    department: newAccount.department
  };

  return {
    success: true,
    account: newAccount,
    session
  };
}

/**
 * Authenticate user with email and password strictly.
 * Determines the role & dashboard automatically based on user account credentials.
 */
export function authenticateUser(
  emailInput: string, 
  passwordInput: string
): { success: boolean; session?: UserSession; error?: string } {
  const users = getStoredUsers();
  const normalizedEmail = emailInput.trim().toLowerCase();
  const trimmedPassword = passwordInput.trim();

  const matchedUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!matchedUser) {
    return {
      success: false,
      error: 'No account found with this email. Please create a new profile via Sign Up.'
    };
  }

  if (matchedUser.password !== trimmedPassword) {
    return {
      success: false,
      error: 'Incorrect password. Please verify your password and try again.'
    };
  }

  const session: UserSession = {
    role: matchedUser.role,
    name: matchedUser.name,
    email: matchedUser.email,
    phone: matchedUser.phone,
    badgeNumber: matchedUser.badgeNumber,
    department: matchedUser.department
  };

  return {
    success: true,
    session
  };
}

export function getStoredComplaints(): Complaint[] {
  if (typeof window === 'undefined') return INITIAL_COMPLAINTS;
  const data = localStorage.getItem(STORAGE_KEY_COMPLAINTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
    return INITIAL_COMPLAINTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse complaints:', e);
    return INITIAL_COMPLAINTS;
  }
}

export function saveComplaints(complaints: Complaint[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(complaints));
  civicEvents.emitChange();
}

export function getStoredSOSAlerts(): SOSAlert[] {
  if (typeof window === 'undefined') return INITIAL_SOS_ALERTS;
  const data = localStorage.getItem(STORAGE_KEY_SOS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_SOS, JSON.stringify(INITIAL_SOS_ALERTS));
    return INITIAL_SOS_ALERTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse SOS:', e);
    return INITIAL_SOS_ALERTS;
  }
}

export function saveSOSAlerts(alerts: SOSAlert[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SOS, JSON.stringify(alerts));
  civicEvents.emitChange();
}

/**
 * Register a new complaint submitted by user
 * Triggers realistic telephone/dispatch ringing audio notification for preferred service!
 */
export function registerNewComplaint(newComplaintData: Omit<Complaint, 'id' | 'status' | 'progressPercent' | 'timeline' | 'assignedService' | 'allocatedBy'> & { id?: string; preferredService: ServiceDepartment }): Complaint {
  const current = getStoredComplaints();
  const id = newComplaintData.id || `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const complaint: Complaint = {
    ...newComplaintData,
    id,
    assignedService: newComplaintData.preferredService,
    allocatedBy: 'citizen',
    status: 'registered',
    progressPercent: 0,
    timeline: [
      {
        status: 'registered',
        label: 'Complaint Registered with Evidence & GPS',
        timestamp: timeStr,
        actor: `Citizen (${newComplaintData.citizenName})`,
        note: `Preferred Department: ${newComplaintData.preferredService.toUpperCase()}`
      }
    ]
  };

  const updated = [complaint, ...current];
  saveComplaints(updated);

  // Emit department alert event specifically for this receiving service
  civicEvents.emitDeptComplaint(complaint.assignedService, complaint);

  // Play realistic ringing dispatch bell for the receiving department!
  playDispatchRingtone();

  // If it's marked as emergency SOS, also play siren
  if (newComplaintData.isEmergencySOS || newComplaintData.severity === 'critical') {
    setTimeout(() => {
      playEmergencySiren();
    }, 1200);
  }

  return complaint;
}

/**
 * Escalate an existing complaint to Central Admin Command HQ (by Citizen)
 * STRICTLY triggers the Admin Command HQ Dashboard Ringing Audio Alert!
 */
export function escalateComplaintToAdmin(
  id: string,
  citizenName: string,
  reason: string
): Complaint | null {
  const current = getStoredComplaints();
  const idx = current.findIndex(c => c.id === id);
  if (idx === -1) return null;

  const prev = current[idx];
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updatedItem: Complaint = {
    ...prev,
    isEscalatedToAdmin: true,
    escalatedAt: new Date().toISOString(),
    escalationReason: reason || 'Direct Citizen Escalation to Central Admin Command HQ',
    adminAcknowledged: false,
    timeline: [
      ...prev.timeline,
      {
        status: prev.status,
        label: '⚠️ Incident Escalated to Central Admin Command HQ',
        timestamp: timeStr,
        actor: `Citizen (${citizenName})`,
        note: `Escalation Reason: ${reason || 'Urgent intervention requested by citizen.'}`
      }
    ],
    responderNotes: [
      ...(prev.responderNotes || []),
      `[Citizen HQ Escalation @ ${timeStr}]: ${reason || 'Immediate Admin Command review requested.'}`
    ]
  };

  current[idx] = updatedItem;
  saveComplaints(current);

  // Emit Admin escalation event
  civicEvents.emitAdminEscalation(updatedItem, reason);

  // Play distinctive Admin Escalation Ringing Bell!
  playAdminEscalationRingtone();

  return updatedItem;
}

/**
 * Acknowledge an escalated complaint by Admin
 */
export function acknowledgeAdminEscalation(id: string): Complaint | null {
  const current = getStoredComplaints();
  const idx = current.findIndex(c => c.id === id);
  if (idx === -1) return null;

  const prev = current[idx];
  const updatedItem: Complaint = {
    ...prev,
    adminAcknowledged: true
  };

  current[idx] = updatedItem;
  saveComplaints(current);
  return updatedItem;
}

/**
 * Update complaint status & progress percentage (0%, 25%, 50%, 75%, 100%)
 */
export function updateComplaintStatus(
  id: string, 
  status: IncidentStatus, 
  progressPercent: number, 
  actorName: string, 
  note?: string
): Complaint | null {
  const current = getStoredComplaints();
  const idx = current.findIndex(c => c.id === id);
  if (idx === -1) return null;

  const prev = current[idx];
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const statusLabels: Record<IncidentStatus, string> = {
    registered: 'Registered & Queued',
    allotted: 'Allotted & Unit Assigned',
    in_progress: 'Field Unit On-Scene & In Progress',
    action_taken: 'Intervention / Remediation Completed',
    resolved: 'Case Verified & Fully Resolved'
  };

  const newTimelineItem = {
    status,
    label: statusLabels[status] || status,
    timestamp: timeStr,
    actor: actorName,
    note
  };

  const updatedItem: Complaint = {
    ...prev,
    status,
    progressPercent,
    timeline: [...prev.timeline, newTimelineItem],
    responderNotes: note ? [...(prev.responderNotes || []), note] : prev.responderNotes,
    resolvedAt: status === 'resolved' ? new Date().toISOString() : prev.resolvedAt
  };

  current[idx] = updatedItem;
  saveComplaints(current);
  return updatedItem;
}

/**
 * Allot / Reassign a complaint to any service (Police, RTO, Hospital, Fire, Municipal)
 * Triggers dispatch ringing notification for the newly assigned department!
 */
export function allotComplaintToService(
  id: string,
  targetService: ServiceDepartment,
  assignedOfficer: string,
  actorName: string,
  dispatchNote?: string
): Complaint | null {
  const current = getStoredComplaints();
  const idx = current.findIndex(c => c.id === id);
  if (idx === -1) return null;

  const prev = current[idx];
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updatedItem: Complaint = {
    ...prev,
    assignedService: targetService,
    allocatedBy: 'admin',
    assignedOfficer,
    status: prev.status === 'registered' ? 'allotted' : prev.status,
    progressPercent: prev.progressPercent < 25 ? 25 : prev.progressPercent,
    timeline: [
      ...prev.timeline,
      {
        status: 'allotted',
        label: `Assigned / Re-allotted to ${targetService.toUpperCase()} (${assignedOfficer})`,
        timestamp: timeStr,
        actor: actorName,
        note: dispatchNote || `Transferred to ${targetService.toUpperCase()} department.`
      }
    ],
    responderNotes: dispatchNote ? [...(prev.responderNotes || []), `[Admin Allotment]: ${dispatchNote}`] : prev.responderNotes
  };

  current[idx] = updatedItem;
  saveComplaints(current);

  // Emit department event for target service
  civicEvents.emitDeptComplaint(targetService, updatedItem);

  // Play ringing sound when complaint is allotted/transferred to service!
  playDispatchRingtone();

  return updatedItem;
}

/**
 * Trigger an Emergency SOS (From Citizen or Admin)
 */
export function triggerSOS(
  type: 'medical' | 'fire' | 'crime' | 'accident' | 'general',
  citizenName: string,
  citizenPhone: string,
  location: LocationData,
  preferredService?: ServiceDepartment,
  isAdminEscalation = false
): SOSAlert {
  const id = `SOS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Default target service map based on type
  let assignedService: ServiceDepartment = preferredService || 'police';
  if (!preferredService) {
    if (type === 'medical') assignedService = 'hospital';
    else if (type === 'fire') assignedService = 'fire';
    else if (type === 'accident') assignedService = 'rto';
    else if (type === 'crime') assignedService = 'police';
  }

  const alert: SOSAlert = {
    id,
    type,
    citizenName,
    citizenPhone,
    location,
    timestamp: new Date().toISOString(),
    status: 'active',
    escalatedByAdmin: isAdminEscalation,
    assignedService,
    audioTriggered: true,
    notes: isAdminEscalation ? 'Urgent Admin Emergency Escalation Forwarded to Nearest Unit' : 'Live Citizen SOS Emergency Signal'
  };

  const currentAlerts = getStoredSOSAlerts();
  saveSOSAlerts([alert, ...currentAlerts]);

  // Also auto-generate an emergency complaint ticket so it appears in tracking and department queue
  registerNewComplaint({
    title: `[EMERGENCY SOS - ${type.toUpperCase()}] Immediate Dispatch Required`,
    description: `EMERGENCY SOS ALERT triggered at ${location.address}. Type: ${type.toUpperCase()}. Direct dispatch requested.`,
    category: type === 'medical' ? 'Severe Medical Emergency' : type === 'fire' ? 'Building Fire Outbreak' : type === 'accident' ? 'Road Accident Trauma' : 'Emergency Assistance',
    preferredService: assignedService,
    severity: 'critical',
    photos: [type === 'fire' ? SAMPLE_INCIDENT_PHOTOS.fire : type === 'medical' ? SAMPLE_INCIDENT_PHOTOS.ambulance : SAMPLE_INCIDENT_PHOTOS.accident],
    location,
    timestamp: new Date().toISOString(),
    citizenName,
    citizenPhone,
    citizenEmail: `${citizenName.toLowerCase().replace(/\s+/g, '')}@sos.alert`,
    isEmergencySOS: true
  });

  // Play urgent emergency siren
  playEmergencySiren();

  return alert;
}

/**
 * Reset demo data to initial state (clean empty)
 */
export function resetDemoData() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
  localStorage.setItem(STORAGE_KEY_SOS, JSON.stringify(INITIAL_SOS_ALERTS));
  civicEvents.emitChange();
}
