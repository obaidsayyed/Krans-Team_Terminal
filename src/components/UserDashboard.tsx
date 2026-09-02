import React, { useState } from 'react';
import { 
  AlertTriangle, 
  PlusCircle, 
  Search, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  Camera, 
  ShieldAlert, 
  Activity, 
  User, 
  FileText,
  Radio,
  Phone,
  Mail,
  SlidersHorizontal
} from 'lucide-react';
import { Complaint, SOSAlert, UserSession } from '../types';
import { DEPARTMENTS } from '../utils/constants';

interface UserDashboardProps {
  session: UserSession;
  complaints: Complaint[];
  sosAlerts: SOSAlert[];
  onOpenSOSModal: () => void;
  onOpenComplaintModal: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  session,
  complaints,
  sosAlerts,
  onOpenSOSModal,
  onOpenComplaintModal,
  onSelectComplaint
}) => {
  const [activeTab, setActiveTab] = useState<'track_all' | 'track_resolved' | 'track_active'>('track_all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter complaints based on user & search & tab
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'track_resolved') return c.status === 'resolved' || c.progressPercent === 100;
    if (activeTab === 'track_active') return c.status !== 'resolved' && c.progressPercent < 100;
    return true;
  });

  const totalCount = complaints.length;
  const activeCount = complaints.filter(c => c.status !== 'resolved' && c.progressPercent < 100).length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved' || c.progressPercent === 100).length;
  const activeSOS = sosAlerts.filter(s => s.status !== 'resolved');

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 pb-20">
      
      {/* 1. Header with User Name & Credentials */}
      <header className="bg-slate-900/90 border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
                <User className="w-3.5 h-3.5" />
                <span>Citizen Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
                Welcome, {session.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                {session.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>{session.email}</span>
                  </span>
                )}
                {session.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{session.phone}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Active Live Emergency Indicator */}
            {activeSOS.length > 0 && (
              <div className="bg-red-950/80 border border-red-500/50 px-4 py-2.5 rounded-2xl flex items-center space-x-3">
                <span className="p-2 bg-red-600 rounded-xl text-white">
                  <Radio className="w-4 h-4 animate-pulse" />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase text-red-300">Live Active Emergency</p>
                  <p className="text-xs text-white font-bold">{activeSOS[0].id} • Dispatch Alerted</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        
        {/* 2. STRICT 3 MAIN OPTIONS: Register Complaint | Resolved / Track Status | Emergency Button */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
            <span>Select Action</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* OPTION 1: Register Complaint */}
            <div 
              onClick={onOpenComplaintModal}
              id="btn-register-complaint"
              className="bg-slate-900/80 hover:bg-slate-850 border-2 border-blue-500/40 hover:border-blue-400 p-6 rounded-3xl cursor-pointer transition-all duration-200 shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition duration-200 mb-5">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-500/30">
                  Option 1
                </span>
                <h3 className="text-2xl font-black text-white font-['Outfit'] mt-2 group-hover:text-blue-300 transition">
                  Register Complaint
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  File a new incident with incident description, photo evidence capture, live GPS geolocation, and credentials with ringing dispatch to preferred services.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
                <span>+ Start New Registration</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* OPTION 2: Resolved / Track Status */}
            <div 
              onClick={() => {
                const el = document.getElementById('tracking-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              id="btn-track-status"
              className="bg-slate-900/80 hover:bg-slate-850 border-2 border-emerald-500/40 hover:border-emerald-400 p-6 rounded-3xl cursor-pointer transition-all duration-200 shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition duration-200 mb-5">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Option 2
                </span>
                <h3 className="text-2xl font-black text-white font-['Outfit'] mt-2 group-hover:text-emerald-300 transition">
                  Resolved / Track
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Track resolution progress in real-time from 0% Registered to 100% Resolved, with status timeline and assigned officer logs.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                <span>{totalCount} Total ({resolvedCount} Resolved)</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* OPTION 3: Emergency Button */}
            <div 
              onClick={onOpenSOSModal}
              id="btn-emergency-sos"
              className="bg-slate-900/80 hover:bg-slate-850 border-2 border-red-500/50 hover:border-red-400 p-6 rounded-3xl cursor-pointer transition-all duration-200 shadow-lg group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div>
                <div className="w-14 h-14 rounded-2xl bg-red-600 border border-red-400/40 flex items-center justify-center text-white group-hover:scale-105 transition duration-200 mb-5 shadow-md">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-300 bg-red-950/80 px-2.5 py-1 rounded-full border border-red-500/40">
                  Option 3 • Urgent
                </span>
                <h3 className="text-2xl font-black text-white font-['Outfit'] mt-2 group-hover:text-red-300 transition flex items-center gap-2">
                  <span>Emergency Button</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  1-Tap Instant Emergency siren with live GPS dispatch ringing to Police, Ambulance EMS (108), Fire (101), or RTO.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-red-900/40 flex items-center justify-between text-xs font-black text-red-400 group-hover:text-red-300 uppercase tracking-wider">
                <span>⚡ Trigger Instant SOS</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>

          </div>
        </div>

        {/* 3. TRACKING & RESOLVED INCIDENTS VIEW */}
        <section id="tracking-section" className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Tracking Header with Tab Switcher */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-black text-white font-['Outfit'] flex items-center gap-2">
                <span>Incident Resolution & Live Tracking</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {filteredComplaints.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                View filed grievances and track step-by-step resolution status (0% to 100%)
              </p>
            </div>

            {/* Filter Tabs: All | Active | Resolved */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket, location..."
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
                <button
                  onClick={() => setActiveTab('track_all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'track_all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  onClick={() => setActiveTab('track_active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'track_active'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setActiveTab('track_resolved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'track_resolved'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Resolved ({resolvedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Complaints Tracking List */}
          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-4 border-2 border-dashed border-slate-800 rounded-2xl p-8">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto text-slate-600">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-300 font-['Outfit']">No Complaints Registered Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Use Option 1 to register your first complaint or Option 3 to trigger an emergency SOS.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={onOpenComplaintModal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Register Complaint</span>
                  </button>
                  <button
                    onClick={onOpenSOSModal}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergency SOS</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredComplaints.map((item) => {
                const dept = DEPARTMENTS[item.assignedService] || DEPARTMENTS.municipal;
                const isResolved = item.status === 'resolved' || item.progressPercent === 100;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectComplaint(item)}
                    className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm"
                  >
                    {/* Left: Photos & Metadata */}
                    <div className="flex items-start space-x-4 min-w-0 flex-1">
                      
                      {/* Photo Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative">
                        {item.photos && item.photos.length > 0 ? (
                          <img
                            src={item.photos[0]}
                            alt="Evidence Thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                            <Camera className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                        {item.isEmergencySOS && (
                          <span className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                      </div>

                      {/* Complaint Details */}
                      <div className="min-w-0 space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {item.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dept.badgeColor}`}>
                            {dept.name}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          {item.isEmergencySOS && (
                            <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
                              SOS Alert
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition truncate">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-1">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[200px]">{item.location.address}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Right: 5-Stage Step Progress Bar & Resolution Status */}
                    <div className="lg:w-72 shrink-0 bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 space-y-3">
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Status:</span>
                        <span className={`font-bold uppercase tracking-wider ${
                          isResolved ? 'text-emerald-400' : 'text-blue-400'
                        }`}>
                          {item.progressPercent}% {item.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Custom Progress Bar with Percent */}
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isResolved ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>

                      {/* Resolution 5 Steps preview dots */}
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span className={item.progressPercent >= 0 ? 'text-blue-400 font-bold' : ''}>0% Reg</span>
                        <span className={item.progressPercent >= 25 ? 'text-blue-400 font-bold' : ''}>25% Allot</span>
                        <span className={item.progressPercent >= 50 ? 'text-blue-400 font-bold' : ''}>50% Prog</span>
                        <span className={item.progressPercent >= 75 ? 'text-blue-400 font-bold' : ''}>75% Act</span>
                        <span className={item.progressPercent >= 100 ? 'text-emerald-400 font-bold' : ''}>100% Done</span>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60">
                        <span className="truncate">Officer: {item.assignedOfficer || dept.defaultOfficer.split('(')[0]}</span>
                        <span className="text-blue-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                          View Timeline &rarr;
                        </span>
                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

        </section>

      </main>

    </div>
  );
};
