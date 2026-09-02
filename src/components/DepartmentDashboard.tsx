import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  MapPin, 
  CheckCircle2, 
  BellRing, 
  AlertTriangle, 
  BadgeCheck,
  RotateCw,
  PhoneCall,
  Volume2,
  X,
  Radio
} from 'lucide-react';
import { Complaint, SOSAlert, ServiceDepartment, UserSession, IncidentStatus } from '../types';
import { DEPARTMENTS } from '../utils/constants';
import { playDispatchRingtone } from '../utils/audio';
import { civicEvents } from '../utils/storage';

interface DepartmentDashboardProps {
  department: ServiceDepartment;
  session: UserSession;
  complaints: Complaint[];
  sosAlerts: SOSAlert[];
  onOpenSOSModal: () => void;
  onOpenAllotModal: (complaint: Complaint) => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onUpdateStatus: (complaintId: string, nextStatus: IncidentStatus, nextPct: number, note?: string) => void;
}

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({
  department,
  session,
  complaints,
  sosAlerts,
  onOpenSOSModal,
  onOpenAllotModal,
  onSelectComplaint,
  onUpdateStatus
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRinging, setIsRinging] = useState(false);
  const [incomingComplaintAlert, setIncomingComplaintAlert] = useState<Complaint | null>(null);

  const deptInfo = DEPARTMENTS[department] || DEPARTMENTS.police;

  // Real-time listener for incoming department complaint alerts (rings specifically for this department!)
  useEffect(() => {
    const handleDeptAlert = (e: Event) => {
      const customEvt = e as CustomEvent<{ department: ServiceDepartment; complaint: Complaint }>;
      if (customEvt.detail && customEvt.detail.department === department) {
        setIncomingComplaintAlert(customEvt.detail.complaint);
        setIsRinging(true);
        playDispatchRingtone();
        setTimeout(() => setIsRinging(false), 3000);
      }
    };

    civicEvents.addEventListener('dept_complaint_alert', handleDeptAlert);
    return () => {
      civicEvents.removeEventListener('dept_complaint_alert', handleDeptAlert);
    };
  }, [department]);

  // Filter complaints assigned to this department
  const deptComplaints = complaints.filter(c => c.assignedService === department);
  
  const filteredComplaints = deptComplaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.citizenName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'pending') return c.status === 'registered' || c.status === 'allotted';
    if (filter === 'in_progress') return c.status === 'in_progress' || c.status === 'action_taken';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

  const pendingCount = deptComplaints.filter(c => c.status === 'registered' || c.status === 'allotted').length;
  const inProgressCount = deptComplaints.filter(c => c.status === 'in_progress' || c.status === 'action_taken').length;
  const resolvedCount = deptComplaints.filter(c => c.status === 'resolved').length;

  const handleTriggerDepartmentRing = () => {
    setIsRinging(true);
    playDispatchRingtone();
    setTimeout(() => setIsRinging(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 pb-20">
      
      {/* Real-time Incoming Dispatch Call Ringing Banner */}
      {incomingComplaintAlert && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 border-b-2 border-amber-300 p-4 text-white shadow-2xl relative animate-pulse z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-black/40 rounded-2xl border border-white/30 text-amber-200 animate-bounce">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white text-slate-950 px-2 py-0.5 rounded-full">
                    INCOMING DISPATCH RING • {deptInfo.shortName}
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-200">
                    {incomingComplaintAlert.id}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  New Incident Received: {incomingComplaintAlert.title}
                </h3>
                <p className="text-xs text-white/90">
                  Location: {incomingComplaintAlert.location.address} • Citizen: {incomingComplaintAlert.citizenName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  playDispatchRingtone();
                }}
                className="px-3.5 py-2 bg-black/40 hover:bg-black/60 border border-white/30 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                title="Ring station telephone bell again"
              >
                <PhoneCall className="w-4 h-4 text-amber-300" />
                <span>Re-Ring Bell</span>
              </button>
              
              <button
                onClick={() => {
                  onSelectComplaint(incomingComplaintAlert);
                  setIncomingComplaintAlert(null);
                }}
                className="px-4 py-2 bg-white hover:bg-amber-100 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Open & Respond</span>
              </button>

              <button
                onClick={() => setIncomingComplaintAlert(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-black/30 rounded-xl transition cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Header Banner with customized Color Theme */}
      <div className={`border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r ${deptInfo.accentBg}`}>
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold mb-2">
                <span className={`w-2 h-2 rounded-full animate-ping ${deptInfo.color.replace('text-', 'bg-')}`}></span>
                <span className={deptInfo.color}>{deptInfo.name}</span>
                <span className="text-slate-400 font-mono">• Helpline: {deptInfo.helpline}</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white font-['Outfit']">
                {deptInfo.name} Workstation
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                {deptInfo.description} Logged in as <strong>{session.name}</strong> ({session.badgeNumber || 'Unit Lead'}).
              </p>
            </div>

            {/* Top Department Controls */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Test Ringing Sound Button */}
              <button
                onClick={handleTriggerDepartmentRing}
                className={`px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold rounded-xl shadow-lg transition flex items-center space-x-2 ${
                  isRinging ? 'animate-bounce text-amber-300 border-amber-400' : 'text-slate-200'
                }`}
                title="Test incoming ringing bell dispatch sound"
              >
                <BellRing className="w-4 h-4 text-amber-400" />
                <span>Ring Station Bell</span>
              </button>

              {/* Emergency SOS Trigger */}
              <button
                onClick={onOpenSOSModal}
                className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Broadcast SOS</span>
              </button>

            </div>

          </div>

          {/* Department KPI Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Assigned Incidents</span>
              <p className="text-2xl font-black text-white font-['Outfit'] mt-1">{deptComplaints.length}</p>
              <span className="text-[11px] text-slate-400">Total assigned to desk</span>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Pending Quick Dispatch</span>
              <p className="text-2xl font-black text-amber-400 font-['Outfit'] mt-1">{pendingCount}</p>
              <span className="text-[11px] text-amber-300">Awaiting field officer</span>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Field Unit In-Action</span>
              <p className="text-2xl font-black text-blue-400 font-['Outfit'] mt-1">{inProgressCount}</p>
              <span className="text-[11px] text-blue-300">Active operations</span>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Cases Resolved</span>
              <p className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1">{resolvedCount}</p>
              <span className="text-[11px] text-emerald-300">{Math.round((resolvedCount / (deptComplaints.length || 1)) * 100)}% Resolved</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Incident List & Field Action Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>{deptInfo.shortName} Incident Action Queue</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                  {filteredComplaints.length} Assigned
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review citizen GPS evidence, advance resolution status, and deploy units.
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search case, address..."
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
                {(['all', 'pending', 'in_progress', 'resolved'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                      filter === tab ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List of complaints */}
          <div className="divide-y divide-slate-800/80 mt-2">
            {filteredComplaints.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm">No incidents currently in this status for {deptInfo.name}.</p>
              </div>
            ) : (
              filteredComplaints.map((item) => (
                <div
                  key={item.id}
                  className="py-5 hover:bg-slate-950/50 -mx-6 px-6 transition flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  
                  {/* Left: Thumbnail & Data */}
                  <div className="flex items-start space-x-4 min-w-0 flex-1">
                    
                    {/* Photo Thumbnail */}
                    <div 
                      onClick={() => onSelectComplaint(item)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 cursor-pointer relative group"
                    >
                      {item.photos && item.photos.length > 0 ? (
                        <img
                          src={item.photos[0]}
                          alt="Evidence"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                          No Photo
                        </div>
                      )}
                      {item.isEmergencySOS && (
                        <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                        {item.isEmergencySOS && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                            SOS EMERGENCY
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          Reported by: <span className="text-white font-medium">{item.citizenName}</span> ({item.citizenPhone})
                        </span>
                      </div>

                      <h3 
                        onClick={() => onSelectComplaint(item)}
                        className="text-sm font-bold text-white hover:text-blue-300 transition cursor-pointer line-clamp-1"
                      >
                        {item.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate max-w-xs">{item.location.address}</span>
                        </span>
                        <span className="font-mono text-[11px] text-blue-300 bg-slate-950 px-1.5 py-0.5 rounded">
                          GPS: {item.location.latitude.toFixed(4)}° N, {item.location.longitude.toFixed(4)}° E
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Right: Step-by-Step Resolution Action Controls */}
                  <div className="lg:w-96 flex flex-col justify-center space-y-3 shrink-0 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    
                    {/* Progress Percentage & Status */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 capitalize">{item.status.replace('_', ' ')}</span>
                        <span className="font-mono font-bold text-amber-400">{item.progressPercent}% Track</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${item.progressPercent}%` }}
                          className={`h-full ${item.progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        />
                      </div>
                    </div>

                    {/* Stepper advancement buttons */}
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-900">
                      
                      {item.progressPercent < 50 && (
                        <button
                          onClick={() => onUpdateStatus(item.id, 'in_progress', 50, `${deptInfo.shortName} team dispatched on-scene.`)}
                          className="px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 text-xs font-semibold rounded-lg border border-blue-700/60 transition"
                        >
                          → 50% On Scene
                        </button>
                      )}

                      {item.progressPercent >= 50 && item.progressPercent < 75 && (
                        <button
                          onClick={() => onUpdateStatus(item.id, 'action_taken', 75, `${deptInfo.shortName} action & mitigation completed.`)}
                          className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 text-xs font-semibold rounded-lg border border-amber-700/60 transition"
                        >
                          → 75% Action Taken
                        </button>
                      )}

                      {item.progressPercent < 100 && (
                        <button
                          onClick={() => onUpdateStatus(item.id, 'resolved', 100, `Fully verified & resolved by ${session.name}.`)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1"
                        >
                          <BadgeCheck className="w-3.5 h-3.5" />
                          <span>100% Resolve</span>
                        </button>
                      )}

                      {/* Detail modal trigger */}
                      <button
                        onClick={() => onSelectComplaint(item)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
                      >
                        Inspect
                      </button>

                      {/* Re-allot to other department button */}
                      <button
                        onClick={() => onOpenAllotModal(item)}
                        className="p-1 text-slate-400 hover:text-blue-300 hover:bg-slate-800 rounded transition"
                        title="Forward to another service"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
