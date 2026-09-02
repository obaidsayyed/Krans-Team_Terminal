import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  ShieldAlert, 
  Car, 
  HeartPulse, 
  Flame, 
  Building2, 
  Search, 
  MapPin, 
  Layers,
  UserCheck, 
  BadgeCheck,
  BellRing,
  PhoneCall,
  X,
  AlertOctagon,
  ArrowUpRight
} from 'lucide-react';
import { Complaint, SOSAlert, ServiceDepartment, UserSession } from '../types';
import { DEPARTMENTS } from '../utils/constants';
import { playAdminEscalationRingtone } from '../utils/audio';
import { civicEvents, acknowledgeAdminEscalation } from '../utils/storage';

interface AdminDashboardProps {
  session: UserSession;
  complaints: Complaint[];
  sosAlerts: SOSAlert[];
  onOpenSOSModal: () => void;
  onOpenAllotModal: (complaint: Complaint) => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onUpdateStatus: (complaintId: string, nextStatus: any, nextPct: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  complaints,
  sosAlerts,
  onOpenSOSModal,
  onOpenAllotModal,
  onSelectComplaint,
  onUpdateStatus
}) => {
  const [activeSection, setActiveSection] = useState<ServiceDepartment | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved' | 'sos' | 'escalated'>('all');
  const [activeEscalationAlert, setActiveEscalationAlert] = useState<{ complaint: Complaint; reason: string } | null>(null);

  const servicesList: ServiceDepartment[] = ['police', 'rto', 'hospital', 'fire', 'municipal'];

  // Listen strictly to citizen escalation events (Only rings when user escalates a complaint!)
  useEffect(() => {
    const handleAdminEscalation = (e: Event) => {
      const customEvt = e as CustomEvent<{ complaint: Complaint; reason: string }>;
      if (customEvt.detail && customEvt.detail.complaint) {
        setActiveEscalationAlert({
          complaint: customEvt.detail.complaint,
          reason: customEvt.detail.reason || 'Citizen Escalation'
        });
        // Play distinct command escalation ring!
        playAdminEscalationRingtone();
      }
    };

    civicEvents.addEventListener('admin_escalation_alert', handleAdminEscalation);
    return () => {
      civicEvents.removeEventListener('admin_escalation_alert', handleAdminEscalation);
    };
  }, []);

  const escalatedComplaints = complaints.filter(c => c.isEscalatedToAdmin && c.status !== 'resolved');

  const filteredComplaints = complaints.filter(c => {
    // Dept section filter
    if (activeSection !== 'all' && c.assignedService !== activeSection) return false;

    // Search query
    const matches = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.citizenName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matches) return false;

    // Status filter
    if (statusFilter === 'unresolved') return c.status !== 'resolved';
    if (statusFilter === 'resolved') return c.status === 'resolved';
    if (statusFilter === 'sos') return c.isEmergencySOS;
    if (statusFilter === 'escalated') return c.isEscalatedToAdmin;
    return true;
  });

  const totalComplaints = complaints.length;
  const totalUnresolved = complaints.filter(c => c.status !== 'resolved').length;
  const totalResolved = complaints.filter(c => c.status === 'resolved').length;
  const criticalCount = complaints.filter(c => c.severity === 'critical' || c.isEmergencySOS).length;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 pb-20">
      
      {/* Real-time Admin Urgent Escalation Ringing Alert Banner */}
      {activeEscalationAlert && (
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-amber-600 border-b-2 border-red-400 p-4 text-white shadow-2xl relative animate-pulse z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-black/40 rounded-2xl border border-white/30 text-white animate-bounce">
                <AlertOctagon className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white text-red-950 px-2.5 py-0.5 rounded-full">
                    CITIZEN ESCALATION RING • ADMIN COMMAND HQ
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-200">
                    {activeEscalationAlert.complaint.id}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  Citizen Escalated: {activeEscalationAlert.complaint.title}
                </h3>
                <p className="text-xs text-white/90">
                  Citizen: <strong>{activeEscalationAlert.complaint.citizenName}</strong> • Reason: <em>"{activeEscalationAlert.reason}"</em>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  playAdminEscalationRingtone();
                }}
                className="px-3.5 py-2 bg-black/40 hover:bg-black/60 border border-white/30 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                title="Ring HQ escalation alarm again"
              >
                <BellRing className="w-4 h-4 text-amber-300" />
                <span>Re-Ring Alert</span>
              </button>
              
              <button
                onClick={() => {
                  acknowledgeAdminEscalation(activeEscalationAlert.complaint.id);
                  onSelectComplaint(activeEscalationAlert.complaint);
                  setActiveEscalationAlert(null);
                }}
                className="px-4 py-2 bg-white hover:bg-amber-100 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Take Command & Re-Allot</span>
              </button>

              <button
                onClick={() => setActiveEscalationAlert(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-black/30 rounded-xl transition cursor-pointer"
                title="Dismiss alert banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Command Banner with Admin SOS Escalation */}
      <div className="bg-slate-900/90 border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
                <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>Central Incident Command & Multi-Desk Dispatch HQ</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white font-['Outfit']">
                Admin Command Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Supervise all 5 civic & emergency services, track live resolution status, re-allot complaints, and trigger emergency SOS direct escalations.
              </p>
            </div>

            {/* Admin SOS Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenSOSModal}
                className="px-5 py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 border border-red-400/40 flex items-center space-x-2 transition"
                id="admin-sos-escalate-btn"
                title="Directly forward unresolved emergency cases to nearest service"
              >
                <AlertTriangle className="w-5 h-5 fill-white text-red-600" />
                <span>Admin SOS: Direct Emergency Forward</span>
              </button>
            </div>

          </div>

          {/* Key Admin KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Total Registered Incidents</span>
              <p className="text-2xl font-black text-white font-['Outfit'] mt-1">{totalComplaints}</p>
              <span className="text-[11px] text-blue-300">Across 5 city divisions</span>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Pending & In-Progress</span>
              <p className="text-2xl font-black text-amber-400 font-['Outfit'] mt-1">{totalUnresolved}</p>
              <span className="text-[11px] text-amber-300">Active queue demanding review</span>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Critical / SOS Emergencies</span>
              <p className="text-2xl font-black text-red-400 font-['Outfit'] mt-1">{criticalCount}</p>
              <span className="text-[11px] text-red-300">High priority dispatch</span>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Resolution Success</span>
              <p className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1">{totalResolved}</p>
              <span className="text-[11px] text-emerald-300">{Math.round((totalResolved / (totalComplaints || 1)) * 100)}% Clearance rate</span>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* 5 Sections Based on Services (Requested by User) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>5 Departmental Service Divisions</span>
              </h2>
              <p className="text-xs text-slate-400">
                Filter and inspect complaints registered for each specific department.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Click tab to filter section
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* All Services Tab */}
            <button
              onClick={() => setActiveSection('all')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                activeSection === 'all'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/20'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] uppercase font-bold block opacity-80">Grid Master</span>
              <p className="text-xs font-extrabold mt-0.5">All Services</p>
              <span className="text-xs font-mono font-bold mt-1 block">
                {complaints.length} Total
              </span>
            </button>

            {/* 5 Service Tabs */}
            {servicesList.map((service) => {
              const dept = DEPARTMENTS[service];
              const active = activeSection === service;
              const count = complaints.filter(c => c.assignedService === service).length;
              return (
                <button
                  key={service}
                  onClick={() => setActiveSection(service)}
                  className={`p-3.5 rounded-2xl border text-left transition relative overflow-hidden ${
                    active
                      ? `${dept.badgeColor} ring-2 ring-white/30 shadow-md`
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Section</span>
                    {service === 'police' && <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />}
                    {service === 'rto' && <Car className="w-3.5 h-3.5 text-amber-400" />}
                    {service === 'hospital' && <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />}
                    {service === 'fire' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                    {service === 'municipal' && <Building2 className="w-3.5 h-3.5 text-teal-400" />}
                  </div>
                  <p className="text-xs font-extrabold truncate">{dept.shortName}</p>
                  <span className="text-xs font-mono font-bold mt-1 block text-slate-200">
                    {count} Active
                  </span>
                </button>
              );
            })}

          </div>
        </div>

        {/* Complaints Master Table & Allotment Grid */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                {activeSection === 'all' ? 'All Registered Incidents & Service Allocation' : `${DEPARTMENTS[activeSection]?.name} Incidents`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect registered photos, GPS coordinates, track progress, and use "Allot Service" to route tasks.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search complaints, GPS..."
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
                {(['all', 'unresolved', 'resolved', 'sos', 'escalated'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition flex items-center space-x-1.5 ${
                      statusFilter === s ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{s === 'sos' ? 'SOS' : s === 'escalated' ? 'Escalated' : s}</span>
                    {s === 'escalated' && escalatedComplaints.length > 0 && (
                      <span className="bg-red-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                        {escalatedComplaints.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List / Cards */}
          <div className="divide-y divide-slate-800/80 mt-2">
            {filteredComplaints.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <ShieldAlert className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm">No complaints found in this service category.</p>
              </div>
            ) : (
              filteredComplaints.map((item) => {
                const dept = DEPARTMENTS[item.assignedService] || DEPARTMENTS.municipal;
                return (
                  <div
                    key={item.id}
                    className="py-5 hover:bg-slate-950/50 -mx-6 px-6 transition flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    
                    {/* Left: Details */}
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
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] text-white font-medium">
                          View
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {item.id}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${dept.badgeColor}`}>
                            Allotted: {dept.shortName}
                          </span>
                          {item.isEmergencySOS && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                              SOS Alert
                            </span>
                          )}
                          {item.isEscalatedToAdmin && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                              <span>Citizen Escalated</span>
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium">
                            By {item.citizenName} ({item.citizenPhone})
                          </span>
                        </div>

                        <h4 
                          onClick={() => onSelectComplaint(item)}
                          className="text-sm font-bold text-white hover:text-blue-300 transition cursor-pointer line-clamp-1"
                        >
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate max-w-xs">{item.location.address}</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            GPS: {item.location.latitude.toFixed(4)}°, {item.location.longitude.toFixed(4)}°
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Right: Progress Tracker & Allotment Actions */}
                    <div className="lg:w-96 flex flex-col justify-center space-y-3 shrink-0 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      
                      {/* Live Progress Bar */}
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

                      {/* Allot & Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
                        
                        {/* Allot / Transfer Button */}
                        <button
                          onClick={() => onOpenAllotModal(item)}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                          title="Allot or transfer to Police, RTO, Hospital, Fire, or Municipal"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span>Allot Service</span>
                        </button>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => onSelectComplaint(item)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                          >
                            Details
                          </button>
                          {item.status !== 'resolved' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'resolved', 100)}
                              className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                              title="Directly resolve case"
                            >
                              <BadgeCheck className="w-3.5 h-3.5" />
                              <span>Resolve</span>
                            </button>
                          )}
                        </div>

                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
