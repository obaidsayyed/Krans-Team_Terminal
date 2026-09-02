import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  User, 
  Phone, 
  Mail, 
  ChevronRight, 
  Star, 
  Send, 
  Volume2, 
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  BadgeCheck,
  Building2,
  Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Complaint, IncidentStatus, ServiceDepartment, UserRole, ComplaintTrackingDetail } from '../types';
import { DEPARTMENTS } from '../utils/constants';
import { updateComplaintStatus, escalateComplaintToAdmin } from '../utils/storage';
import { playResolutionChime } from '../utils/audio';
import { getFullTracking } from '../services/api';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  currentUserName: string;
  onOpenAllotModal?: (complaint: Complaint) => void;
  onComplaintUpdated?: (updated: Complaint) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  isOpen,
  onClose,
  currentUserRole,
  currentUserName,
  onOpenAllotModal,
  onComplaintUpdated
}) => {
  const [newNote, setNewNote] = useState('');
  const [userRating, setUserRating] = useState<number>(complaint?.rating || 5);
  const [userFeedback, setUserFeedback] = useState<string>(complaint?.feedback || '');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(!!complaint?.feedback);
  const [showEscalateBox, setShowEscalateBox] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateSuccessMsg, setEscalateSuccessMsg] = useState('');
  const [backendTracking, setBackendTracking] = useState<ComplaintTrackingDetail | null>(null);

  useEffect(() => {
    if (complaint?.id) {
      getFullTracking(complaint.id)
        .then(res => setBackendTracking(res))
        .catch(() => {
          // If not in backend yet or mock ID
          setBackendTracking(null);
        });
    }
  }, [complaint?.id]);

  if (!isOpen || !complaint) return null;

  const deptInfo = DEPARTMENTS[complaint.assignedService] || DEPARTMENTS.municipal;
  const isOfficerOrAdmin = currentUserRole !== 'citizen';

  const handleEscalateToAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const reason = escalateReason.trim() || 'Urgent citizen escalation to Central Admin Command HQ';
    const updated = escalateComplaintToAdmin(complaint.id, currentUserName, reason);
    if (updated) {
      setEscalateSuccessMsg('Escalated to Admin HQ! Admin Dashboard is now ringing.');
      setShowEscalateBox(false);
      setEscalateReason('');
      if (onComplaintUpdated) onComplaintUpdated(updated);
      setTimeout(() => setEscalateSuccessMsg(''), 6000);
    }
  };

  const steps: { status: IncidentStatus; label: string; pct: number }[] = [
    { status: 'registered', label: 'Registered', pct: 0 },
    { status: 'allotted', label: 'Allotted to Unit', pct: 25 },
    { status: 'in_progress', label: 'In Progress / On-Scene', pct: 50 },
    { status: 'action_taken', label: 'Action Taken', pct: 75 },
    { status: 'resolved', label: '100% Resolved & Closed', pct: 100 }
  ];

  const handleAdvanceStatus = (nextStatus: IncidentStatus, nextPct: number) => {
    const updated = updateComplaintStatus(
      complaint.id,
      nextStatus,
      nextPct,
      currentUserName,
      newNote || `Status escalated to ${nextStatus.toUpperCase()} by ${currentUserName}`
    );

    if (updated) {
      if (nextStatus === 'resolved') {
        playResolutionChime();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      setNewNote('');
      if (onComplaintUpdated) onComplaintUpdated(updated);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const updated = updateComplaintStatus(
      complaint.id,
      complaint.status,
      complaint.progressPercent,
      currentUserName,
      newNote
    );
    if (updated) {
      setNewNote('');
      if (onComplaintUpdated) onComplaintUpdated(updated);
    }
  };

  const handleSubmitFeedback = () => {
    setFeedbackSubmitted(true);
    // update feedback locally
    complaint.rating = userRating;
    complaint.feedback = userFeedback;
    if (onComplaintUpdated) onComplaintUpdated({ ...complaint });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r ${deptInfo.accentBg}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl bg-slate-900 border border-slate-700 ${deptInfo.color}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {complaint.id}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${deptInfo.badgeColor}`}>
                  {deptInfo.shortName}
                </span>
                {complaint.isEmergencySOS && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                    SOS EMERGENCY
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white mt-1 line-clamp-1 font-['Outfit']">
                {complaint.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* 5-Step Progress Resolution Track Bar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Live Incident Resolution Progress
              </span>
              <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {complaint.progressPercent}% COMPLETED
              </span>
            </div>

            {/* Stepper Bar */}
            <div className="relative mb-6 mt-2">
              <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-800">
                <div
                  style={{ width: `${complaint.progressPercent}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700 bg-gradient-to-r ${
                    complaint.progressPercent === 100 ? 'from-emerald-500 to-teal-400' : 'from-rose-500 via-amber-500 to-indigo-500'
                  }`}
                />
              </div>

              {/* Step points */}
              <div className="grid grid-cols-5 gap-1 text-center mt-3">
                {steps.map((step) => {
                  const isPassed = complaint.progressPercent >= step.pct;
                  const isCurrent = complaint.status === step.status;
                  return (
                    <div key={step.status} className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/20'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isPassed ? '✓' : step.pct}
                      </div>
                      <span className={`text-[10px] leading-tight font-medium ${
                        isCurrent ? 'text-amber-300 font-bold' : isPassed ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick advance buttons for Responders / Admins */}
            {isOfficerOrAdmin && (
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Officer Action Controls:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleAdvanceStatus('allotted', 25)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                  >
                    Mark 25% Allotted
                  </button>
                  <button
                    onClick={() => handleAdvanceStatus('in_progress', 50)}
                    className="px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 text-xs font-semibold rounded-lg border border-blue-700/60 transition"
                  >
                    Mark 50% In Progress
                  </button>
                  <button
                    onClick={() => handleAdvanceStatus('action_taken', 75)}
                    className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 text-xs font-semibold rounded-lg border border-amber-700/60 transition"
                  >
                    Mark 75% Action Taken
                  </button>
                  <button
                    onClick={() => handleAdvanceStatus('resolved', 100)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1"
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>Mark 100% Resolved</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Details Grid: Left Info & Right Photo */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Left Description & GPS Details */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h3>
                <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {complaint.description}
                </p>
              </div>

              {/* Location & GPS */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>GPS Geolocation Site</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${complaint.location.latitude},${complaint.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span>Open in Maps</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-200 font-medium">{complaint.location.address}</p>
                {complaint.location.landmark && (
                  <p className="text-[11px] text-slate-400">Landmark: {complaint.location.landmark}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-cyan-300 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                  <span>LAT: {complaint.location.latitude.toFixed(5)}° N</span>
                  <span>•</span>
                  <span>LNG: {complaint.location.longitude.toFixed(5)}° E</span>
                  {complaint.location.accuracy && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">±{complaint.location.accuracy}m</span>
                    </>
                  )}
                </div>
              </div>

              {/* Citizen Contact details */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-400 text-[10px]">Registered By:</p>
                  <p className="text-white font-bold">{complaint.citizenName}</p>
                  <p className="text-slate-400 text-[11px]">{complaint.citizenPhone}</p>
                </div>
                {onOpenAllotModal && currentUserRole === 'admin' && (
                  <button
                    onClick={() => onOpenAllotModal(complaint)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
                  >
                    Re-Allot Service
                  </button>
                )}
              </div>
            </div>

            {/* Right Photo Evidence */}
            <div className="md:col-span-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Photo Evidence</h3>
              {complaint.photos && complaint.photos.length > 0 ? (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video sm:aspect-square relative group">
                  <img
                    src={complaint.photos[0]}
                    alt="Evidence"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-[10px] text-slate-300 backdrop-blur-xs">
                    Timestamp: {new Date(complaint.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  No photos attached
                </div>
              )}

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 text-[10px] block">Assigned Officer:</span>
                <span className="font-semibold text-white">{complaint.assignedOfficer || deptInfo.defaultOfficer}</span>
              </div>
            </div>

          </div>

          {/* FastAPI AI Multi-Department Routing & Official Tickets */}
          {backendTracking && backendTracking.routes && backendTracking.routes.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Auto-Assigned Department Routes ({backendTracking.routes.length})
                  </span>
                </div>
                {backendTracking.ai_priority && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                    backendTracking.ai_priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    backendTracking.ai_priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  }`}>
                    AI Priority: {backendTracking.ai_priority}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {backendTracking.routes.map((route, rIdx) => (
                  <div key={rIdx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-100">{route.department_name || route.department_type}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {route.department_city ? `${route.department_city} • ` : ''}
                        Type: <span className="text-slate-300 font-mono">{route.department_type}</span>
                        {route.distance_km !== null && (
                          <span className="text-cyan-400 ml-1.5 font-semibold">({route.distance_km} km away)</span>
                        )}
                      </p>
                      {route.external_ticket_id && (
                        <div className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 w-fit">
                          <Ticket className="w-3 h-3" />
                          <span>Ticket: {route.external_ticket_id}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {route.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline of events */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Incident Audit Timeline & Dispatch Logs
            </h3>
            <div className="space-y-2.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {complaint.timeline.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs border-b border-slate-900 pb-2 last:border-b-0">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.label}</span>
                      <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Actor: {item.actor}</p>
                    {item.note && (
                      <p className="text-[11px] text-indigo-300 mt-0.5 bg-slate-900/90 p-1.5 rounded border border-slate-800">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add responder action note form */}
          {isOfficerOrAdmin && (
            <form onSubmit={handleAddNote} className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-300">
                Add Field Note / Action Update:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Unit arrived at site, initiating equipment..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log Note</span>
                </button>
              </div>
            </form>
          )}

          {/* Citizen Feedback / Rating section (when resolved) */}
          {complaint.status === 'resolved' && (
            <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  Citizen Resolution Satisfaction Feedback
                </span>
                {feedbackSubmitted && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                    Feedback Saved
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setUserRating(star);
                      setFeedbackSubmitted(false);
                    }}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                  >
                    <Star className={`w-5 h-5 ${star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-300 ml-2">{userRating} / 5 Stars</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="Share feedback on response time and service quality..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {/* Citizen Direct Admin Escalation Section (When unresolved) */}
          {complaint.status !== 'resolved' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Admin Command HQ Escalation Desk
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    If department response is delayed, escalate directly to Central Admin HQ. This will ring the Admin Command Dashboard immediately.
                  </p>
                </div>
                {complaint.isEscalatedToAdmin && (
                  <span className="px-2.5 py-1 bg-red-600/30 border border-red-500/50 text-red-300 text-[10px] font-black uppercase rounded-full animate-pulse">
                    Escalated to HQ
                  </span>
                )}
              </div>

              {escalateSuccessMsg && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{escalateSuccessMsg}</span>
                </div>
              )}

              {complaint.isEscalatedToAdmin ? (
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                  <p className="font-bold">⚠️ Case Currently Escalated Under Admin Review</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Escalation Reason: {complaint.escalationReason || 'Citizen request for immediate intervention.'}
                  </p>
                  {complaint.escalatedAt && (
                    <span className="text-[10px] font-mono text-slate-400 block mt-1">
                      Escalated At: {new Date(complaint.escalatedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  {!showEscalateBox ? (
                    <button
                      type="button"
                      onClick={() => setShowEscalateBox(true)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Escalate Complaint to Admin HQ (Ring Alarm)</span>
                    </button>
                  ) : (
                    <form onSubmit={handleEscalateToAdmin} className="space-y-3 pt-2">
                      <label className="block text-xs font-semibold text-slate-300">
                        Reason for Admin Escalation:
                      </label>
                      <textarea
                        value={escalateReason}
                        onChange={(e) => setEscalateReason(e.target.value)}
                        placeholder="e.g. No field officer arrived within expected window / high severity risk escalating..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 h-20"
                        required
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Confirm & Ring Admin Dashboard</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEscalateBox(false)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
