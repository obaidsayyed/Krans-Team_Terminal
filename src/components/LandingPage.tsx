import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Car, 
  HeartPulse, 
  Flame, 
  Building2, 
  Radio, 
  LogIn, 
  ArrowRight, 
  CheckCircle2, 
  BellRing, 
  Clock, 
  Compass, 
  Layers, 
  PhoneCall, 
  UserPlus, 
  FileText, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  Camera, 
  ShieldCheck, 
  Users, 
  User,
  Navigation,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Crosshair,
  Wifi,
  FlameKindling,
  Search,
  Ticket
} from 'lucide-react';
import { UserRole, ComplaintTrackingDetail } from '../types';
import { Full3DCityBackground } from './Full3DCityBackground';
import { getFullTracking } from '../services/api';

interface LandingPageProps {
  onGoToLogin: (role?: UserRole) => void;
  onGoToSignUp: (role?: UserRole) => void;
  onOpenSOSModal: () => void;
  onRegisterComplaintFast: () => void;
}

interface SectorZone {
  id: string;
  code: string;
  name: string;
  dept: string;
  role: UserRole;
  status: string;
  unitsActive: number;
  avgEta: string;
  description: string;
  badgeColor: string;
  accentBorder: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToSignUp,
  onOpenSOSModal,
  onRegisterComplaintFast
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('zone-central');
  const [activeHoverRole, setActiveHoverRole] = useState<UserRole | null>(null);
  const [searchTrackingId, setSearchTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState<ComplaintTrackingDetail | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleTrackComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTrackingId.trim().toUpperCase();
    if (!query) return;

    setIsSearching(true);
    setSearchError('');
    setTrackingResult(null);

    try {
      const result = await getFullTracking(query);
      setTrackingResult(result);
    } catch (err: any) {
      setSearchError('No active complaint found with Tracking ID: ' + query);
    } finally {
      setIsSearching(false);
    }
  };

  const citySectors: SectorZone[] = [
    {
      id: 'zone-central',
      code: 'SEC-01',
      name: 'Central Command & Municipal Core',
      dept: 'Municipal & Admin HQ',
      role: 'admin',
      status: 'Master Control Active',
      unitsActive: 18,
      avgEta: '1.8 min',
      description: 'Central administrative coordination, municipal water pipe grids, street lighting networks, and master emergency broadcast hub.',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      accentBorder: 'border-pink-500'
    },
    {
      id: 'zone-north',
      code: 'SEC-02',
      name: 'North Law Enforcement Precinct',
      dept: 'Police Department',
      role: 'police',
      status: 'Active Patrol Fleet',
      unitsActive: 14,
      avgEta: '1.2 min',
      description: 'Rapid PCR interceptor vans, 24x7 CCTV coordinate trace, public safety enforcement, and instant citizen distress response.',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      accentBorder: 'border-yellow-500'
    },
    {
      id: 'zone-east',
      code: 'SEC-03',
      name: 'East Trauma & EMS Health Corridor',
      dept: 'Hospital / EMS',
      role: 'hospital',
      status: 'Tenders & ALS Ready',
      unitsActive: 11,
      avgEta: '1.5 min',
      description: 'Advanced life support ambulances, critical patient triage routing, trauma desk telemetry, and emergency medical mobilization.',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      accentBorder: 'border-emerald-500'
    },
    {
      id: 'zone-south',
      code: 'SEC-04',
      name: 'South Traffic & Highway Arterial',
      dept: 'RTO Transport',
      role: 'rto',
      status: 'Real-Time Radar Active',
      unitsActive: 9,
      avgEta: '2.1 min',
      description: 'Expressway radar surveillance, signal failure mitigation, accident wreckage clearing, and heavy commercial vehicle tracking.',
      badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
      accentBorder: 'border-amber-400'
    },
    {
      id: 'zone-west',
      code: 'SEC-05',
      name: 'West Industrial & Fire Rescue Safety',
      dept: 'Fire & Rescue',
      role: 'fire',
      status: 'High Standby Readiness',
      unitsActive: 12,
      avgEta: '1.4 min',
      description: 'Hazardous chemical leak suppression, high-rise aerial ladder rescue tenders, structural collapse response, and thermal sirens.',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      accentBorder: 'border-orange-500'
    }
  ];

  const currentSectorData = citySectors.find(s => s.id === selectedZone) || citySectors[0];

  const departmentDesks: {
    role: UserRole;
    name: string;
    code: string;
    badge: string;
    icon: React.ReactNode;
    desc: string;
    dispatchNote: string;
    accentBg: string;
    tagColor: string;
    hoverGlow: string;
  }[] = [
    {
      role: 'citizen',
      name: 'Public User / Citizen Hub',
      code: 'Civic Desk',
      badge: 'Public Portal',
      icon: <User className="w-6 h-6 text-pink-400" />,
      desc: 'Submit geo-tagged grievances with real photo attachments, trigger high-decibel SOS sirens with live coordinates, and monitor 5-stage SLA resolution.',
      dispatchNote: 'Active 24x7 Citizen Network',
      accentBg: 'bg-black/85 hover:bg-black/95 border-pink-500/30 hover:border-pink-400',
      tagColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      hoverGlow: 'hover:shadow-pink-500/20'
    },
    {
      role: 'police',
      name: 'Police Department Command',
      code: 'Dial 100 / 112',
      badge: 'Law Enforcement',
      icon: <ShieldAlert className="w-6 h-6 text-emerald-400" />,
      desc: 'Rapid PCR interceptor deployment, crime investigation, CCTV coordinate trace, and emergency law enforcement dispatch.',
      dispatchNote: 'Active 24x7 PCR Fleet',
      accentBg: 'bg-black/85 hover:bg-black/95 border-emerald-500/30 hover:border-emerald-400',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      hoverGlow: 'hover:shadow-emerald-500/20'
    },
    {
      role: 'hospital',
      name: 'Hospital & EMS Trauma Desk',
      code: 'Dial 102 / 108',
      badge: 'Medical Emergency',
      icon: <HeartPulse className="w-6 h-6 text-pink-400" />,
      desc: 'Advanced life support ambulance routing, trauma desk handoff, critical medical triage, and paramedic mobilization.',
      dispatchNote: 'ACLS Ambulances on Standby',
      accentBg: 'bg-black/85 hover:bg-black/95 border-pink-500/30 hover:border-pink-400',
      tagColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      hoverGlow: 'hover:shadow-pink-500/20'
    },
    {
      role: 'fire',
      name: 'Fire & Rescue Services',
      code: 'Dial 101',
      badge: 'Fire & Rescue',
      icon: <Flame className="w-6 h-6 text-rose-400" />,
      desc: 'Hazardous gas suppression, building evacuation sirens, water tender dispatch, and high-rise structural rescue.',
      dispatchNote: 'HazMat & Heavy Tenders',
      accentBg: 'bg-black/85 hover:bg-black/95 border-rose-500/30 hover:border-rose-400',
      tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      hoverGlow: 'hover:shadow-rose-500/20'
    },
    {
      role: 'rto',
      name: 'Regional Transport (RTO)',
      code: 'Dial 1073',
      badge: 'Road Safety',
      icon: <Car className="w-6 h-6 text-emerald-300" />,
      desc: 'Traffic signal failure mitigation, accident wreckage towing, hit-and-run tracking, and commercial road safety.',
      dispatchNote: 'Highway Interceptor Radar',
      accentBg: 'bg-black/85 hover:bg-black/95 border-emerald-500/30 hover:border-emerald-400',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      hoverGlow: 'hover:shadow-emerald-500/20'
    },
    {
      role: 'municipal',
      name: 'Municipal Corporation',
      code: 'Dial 1916',
      badge: 'Civic Works',
      icon: <Building2 className="w-6 h-6 text-teal-400" />,
      desc: 'Pothole asphalt repairs, sewage overflow, broken streetlights, water pipeline repairs, and public sanitation.',
      dispatchNote: 'Zonal Engineering Teams',
      accentBg: 'bg-black/85 hover:bg-black/95 border-teal-500/30 hover:border-teal-400',
      tagColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      hoverGlow: 'hover:shadow-teal-500/20'
    },
    {
      role: 'admin',
      name: 'Central Admin Command HQ',
      code: 'HQ Desk',
      badge: 'Master Control',
      icon: <Layers className="w-6 h-6 text-pink-400" />,
      desc: 'Cross-service dispatch allotment, master incident map, SLA monitoring, and city-wide emergency broadcasting.',
      dispatchNote: 'Unified Master Control',
      accentBg: 'bg-black/85 hover:bg-black/95 border-pink-500/40 hover:border-pink-300',
      tagColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      hoverGlow: 'hover:shadow-pink-500/30'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-[#f4f4f5] flex flex-col relative selection:bg-pink-500 selection:text-black overflow-x-hidden font-sans">
      
      {/* FULL-SCREEN 3D ANIMATED BACKGROUND IN BLACK, GREEN, YELLOW, ORANGE, AND PINK */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-auto">
        <Full3DCityBackground 
          activeHoverRole={activeHoverRole}
          onSelectRole={(role) => onGoToLogin(role)}
        />
        {/* Subtle radial vignette gradient to maintain high content legibility */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/85 pointer-events-none" />
      </div>

      {/* Top 24x7 Emergency Hotlines Banner with Neon Accents */}
      <div className="bg-black/90 backdrop-blur-xl text-zinc-300 py-2.5 px-4 text-xs font-medium border-b border-pink-500/20 shadow-2xl relative z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold text-white">24x7 Emergency Hotlines:</span>
            <span className="bg-zinc-950 text-pink-300 px-2.5 py-0.5 rounded-md border border-pink-500/40 font-mono text-[11px] font-bold shadow-xs">
              POLICE: 100/112 • FIRE: 101 • AMBULANCE: 108 • RTO: 1073 • MUNICIPAL: 1916
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 text-emerald-300 font-medium bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>7 3D Workstations Active</span>
            </span>
            <span className="hidden sm:inline text-pink-400 text-[11px] font-mono font-bold bg-pink-950/60 px-2.5 py-0.5 rounded-full border border-pink-500/40">
              BLACK • PINK • GREEN 3D MATRIX
            </span>
          </div>
        </div>
      </div>

      {/* HERO SECTION: Framed over Interactive 3D Canvas */}
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden relative z-20">
        
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-xl border border-pink-500/50 text-pink-300 text-xs font-bold shadow-lg shadow-pink-950/40">
                <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Unified 3D Incident Command Network</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-['Outfit'] leading-[1.12] drop-shadow-md">
                Direct Public Response & <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-emerald-400 bg-clip-text text-transparent">Emergency Dispatch</span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed max-w-2xl bg-black/75 backdrop-blur-md p-4 rounded-2xl border border-pink-500/20 shadow-xl">
                Real-time synchronization between citizens and <strong>Central Admin, Police, RTO, Hospital / EMS, Fire & Rescue, and Municipal Corporation</strong>. Live geo-tagged grievance tickets, automated department routing, and transparent SLA resolution tracking.
              </p>

              {/* Action Buttons: Sign In + Emergency SOS */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                
                {/* Main Sign In Button (Neon Pink to Emerald Green Gradient) */}
                <button
                  onClick={() => onGoToLogin()}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-pink-500 hover:from-emerald-400 hover:to-pink-400 text-black font-black rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center space-x-3 transition transform hover:-translate-y-0.5 cursor-pointer"
                  id="landing-signin-btn"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="text-base tracking-wide">Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Instant Emergency SOS Siren Button (High-Contrast Neon Pink) */}
                <button
                  onClick={onOpenSOSModal}
                  className="px-7 py-4 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-500 hover:to-rose-500 text-white font-black rounded-2xl shadow-xl shadow-pink-600/35 flex items-center space-x-2.5 transition transform hover:-translate-y-0.5 cursor-pointer border border-pink-400/40"
                  id="landing-emergency-sos-btn"
                >
                  <AlertTriangle className="w-5 h-5 text-emerald-300 animate-bounce" />
                  <span className="text-sm">Broadcast Emergency SOS</span>
                </button>

              </div>

              {/* FastAPI Quick Grievance Live Tracker Input */}
              <div className="pt-2">
                <form onSubmit={handleTrackComplaint} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={searchTrackingId}
                      onChange={(e) => setSearchTrackingId(e.target.value)}
                      placeholder="Enter Tracking ID (e.g. GRV-2026-A1B2C3)"
                      className="w-full pl-10 pr-4 py-3 bg-black/85 border border-pink-500/30 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSearching ? <span className="animate-spin">⏳</span> : <Search className="w-3.5 h-3.5" />}
                    <span>Track Ticket</span>
                  </button>
                </form>

                {searchError && (
                  <p className="text-xs text-rose-400 mt-2 font-medium bg-rose-950/40 border border-rose-800/40 p-2 rounded-lg max-w-xl">
                    {searchError}
                  </p>
                )}

                {trackingResult && (
                  <div className="mt-3 p-4 bg-black/90 rounded-2xl border border-emerald-500/40 shadow-xl max-w-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <Ticket className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-xs font-bold text-white">{trackingResult.tracking_id}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {trackingResult.overall_status}
                      </span>
                    </div>

                    {trackingResult.ai_priority && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">AI Priority Level:</span>
                        <span className="font-bold text-amber-400 uppercase">{trackingResult.ai_priority}</span>
                      </div>
                    )}

                    {trackingResult.routes && trackingResult.routes.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Assigned Units & Dispatch Tickets:
                        </span>
                        {trackingResult.routes.map((r, idx) => (
                          <div key={idx} className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 flex items-center justify-between text-xs">
                            <span className="text-zinc-200 font-semibold">{r.department_name || r.department_type}</span>
                            <div className="flex items-center space-x-2">
                              {r.distance_km !== null && (
                                <span className="text-cyan-400 text-[11px] font-mono font-bold">{r.distance_km} km</span>
                              )}
                              {r.external_ticket_id && (
                                <span className="font-mono text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50">
                                  {r.external_ticket_id}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Metrics HUD in Black Glass with Pink & Green Accents */}
              <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg">
                <div className="p-3.5 bg-black/85 backdrop-blur-xl rounded-2xl border border-pink-500/40 shadow-lg shadow-pink-950/20">
                  <p className="text-2xl font-black text-pink-400 font-['Outfit']">7</p>
                  <p className="text-xs text-zinc-400 font-medium">Command Desks</p>
                </div>
                <div className="p-3.5 bg-black/85 backdrop-blur-xl rounded-2xl border border-emerald-500/40 shadow-lg shadow-emerald-950/20">
                  <p className="text-2xl font-black text-emerald-400 font-['Outfit']">&lt; 90s</p>
                  <p className="text-xs text-zinc-400 font-medium">Avg Dispatch Ring</p>
                </div>
                <div className="p-3.5 bg-black/85 backdrop-blur-xl rounded-2xl border border-pink-500/30 shadow-lg">
                  <p className="text-2xl font-black text-pink-300 font-['Outfit']">100%</p>
                  <p className="text-xs text-zinc-400 font-medium">GPS Evidence Trace</p>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive Civic Zonal District Grid in Frosted Black Glass */}
            <div className="lg:col-span-5">
              
              <div className="bg-black/90 backdrop-blur-2xl rounded-3xl border border-pink-500/30 shadow-2xl p-6 space-y-5 shadow-pink-950/30">
                
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-5 h-5 text-emerald-400" />
                    <span className="font-extrabold text-sm text-white uppercase tracking-wider font-['Outfit']">
                      City Zonal Sector Command
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/50">
                    Real-Time 3D Active
                  </span>
                </div>

                {/* Sector Selector Tabs with Pink & Green Accents */}
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-zinc-950/90 rounded-2xl border border-zinc-800">
                  {citySectors.map((sector) => (
                    <button
                      key={sector.id}
                      onClick={() => {
                        setSelectedZone(sector.id);
                        setActiveHoverRole(sector.role);
                      }}
                      onMouseEnter={() => setActiveHoverRole(sector.role)}
                      onMouseLeave={() => setActiveHoverRole(null)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                        selectedZone === sector.id
                          ? 'bg-gradient-to-r from-pink-500 to-emerald-500 text-black shadow-lg font-black'
                          : 'text-zinc-400 hover:text-pink-300 hover:bg-pink-950/20'
                      }`}
                    >
                      <span>{sector.code}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Sector Telemetry Card */}
                <div className="p-4 bg-zinc-950/90 rounded-2xl border border-zinc-800 space-y-3 shadow-inner">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                        {currentSectorData.code} • {currentSectorData.dept}
                      </span>
                      <h3 className="text-base font-black text-white font-['Outfit'] mt-0.5">
                        {currentSectorData.name}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentSectorData.badgeColor}`}>
                      {currentSectorData.status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {currentSectorData.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs">
                    <div className="p-2.5 bg-black/80 rounded-xl border border-pink-500/20">
                      <span className="text-[10px] text-zinc-400 block">Active Field Units</span>
                      <span className="font-bold text-white font-mono">{currentSectorData.unitsActive} Response Units</span>
                    </div>
                    <div className="p-2.5 bg-black/80 rounded-xl border border-emerald-500/20">
                      <span className="text-[10px] text-zinc-400 block">Average Dispatch SLA</span>
                      <span className="font-bold text-emerald-400 font-mono">{currentSectorData.avgEta}</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Quick Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={onRegisterComplaintFast}
                    className="w-full py-3 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-between transition cursor-pointer shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Register Public Grievance</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>

                  <button
                    onClick={() => onGoToSignUp('citizen')}
                    className="w-full py-3 px-4 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/40 text-pink-200 font-bold rounded-xl text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-pink-400" />
                      <span>Create New User Profile</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-pink-400" />
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Strict 10-Digit Mobile Auth
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-pink-400" /> Tamper-Proof Receipts
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>

      </section>

      {/* 7 DEDICATED COMMAND DESKS SECTION WITH GLOWING COLOR CARDS */}
      <section className="py-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 bg-black/75 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-950/40 px-3.5 py-1.5 rounded-full border border-yellow-500/40 shadow-xs">
              Unified Incident Response
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] mt-3">
              Direct Access to All 7 Workstations
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 mt-2">
              Hover over any workstation to illuminate its real-time 3D beacon in the background city.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {departmentDesks.map((dept) => (
              <div 
                key={dept.role}
                onClick={() => onGoToLogin(dept.role)}
                onMouseEnter={() => setActiveHoverRole(dept.role)}
                onMouseLeave={() => setActiveHoverRole(null)}
                className={`bg-black/80 backdrop-blur-2xl rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group cursor-pointer ${dept.accentBg} ${dept.hoverGlow}`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900/90 flex items-center justify-center border border-zinc-800 shadow-inner transition group-hover:scale-110">
                      {dept.icon}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${dept.tagColor}`}>
                      {dept.code}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    {dept.badge}
                  </span>

                  <h3 className="text-xl font-black text-white group-hover:text-yellow-300 transition font-['Outfit']">
                    {dept.name}
                  </h3>

                  <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                    {dept.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{dept.dispatchNote}</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoToSignUp(dept.role);
                      }}
                      className="p-2 text-zinc-400 hover:text-pink-300 hover:bg-zinc-800 rounded-xl border border-zinc-700 transition cursor-pointer"
                      title={`Create ${dept.name} Profile`}
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoToLogin(dept.role);
                      }}
                      className="px-3.5 py-2 bg-zinc-900 group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-orange-500 group-hover:text-black text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-md border border-zinc-700 group-hover:border-transparent"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}

          </div>

        </div>
      </section>

      {/* CITIZEN EXPERIENCE SHOWCASE SECTION */}
      <section className="py-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-black/85 backdrop-blur-2xl p-8 sm:p-12 rounded-3xl border border-zinc-800 shadow-2xl">
            
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-300 bg-pink-950/40 px-3.5 py-1.5 rounded-full border border-pink-500/40">
                Citizen Grievance & SOS Suite
              </span>
              
              <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
                Complete Transparency from First Call to Resolution
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Citizens enjoy direct access to emergency services without bureaucracy. Every complaint receives a unique GPS tracking ticket, multi-stage progress bars, and officer contact cards.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onGoToLogin('citizen')}
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-pink-500 text-black font-black rounded-xl shadow-lg text-xs flex items-center space-x-2 transition cursor-pointer hover:opacity-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Citizen Sign In</span>
                </button>

                <button
                  onClick={() => onGoToSignUp('citizen')}
                  className="px-5 py-3.5 bg-zinc-900/90 hover:bg-zinc-800 text-pink-300 border border-pink-500/40 font-bold rounded-xl text-xs flex items-center space-x-2 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-pink-400" />
                  <span>Create Citizen Profile</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-5 bg-zinc-950/90 rounded-2xl border border-emerald-500/30 space-y-3 shadow-lg shadow-emerald-950/20">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white font-['Outfit']">
                  1-Click GPS Capture
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Pinpoint exact coordinates and address with browser geolocation and interactive map pins.
                </p>
              </div>

              <div className="p-5 bg-zinc-950/90 rounded-2xl border border-pink-500/30 space-y-3 shadow-lg shadow-pink-950/20">
                <div className="w-10 h-10 rounded-xl bg-pink-950/60 text-pink-400 border border-pink-500/40 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white font-['Outfit']">
                  1-Tap Emergency SOS Siren
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Audible emergency siren ringtone dispatched simultaneously to Police, Hospital, and Fire HQ.
                </p>
              </div>

              <div className="p-5 bg-zinc-950/90 rounded-2xl border border-emerald-500/30 space-y-3 shadow-lg shadow-emerald-950/20">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white font-['Outfit']">
                  5-Stage Real-Time Progress
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Track status live from Registered (0%) → Allotted (25%) → Officer On Scene (50%) → Work In Progress (75%) → Resolved (100%).
                </p>
              </div>

              <div className="p-5 bg-zinc-950/90 rounded-2xl border border-pink-500/30 space-y-3 shadow-lg shadow-pink-950/20">
                <div className="w-10 h-10 rounded-xl bg-pink-950/60 text-pink-400 border border-pink-500/40 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white font-['Outfit']">
                  Citizen Rating & Feedback
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Review and rate officer performance upon resolution to ensure civic accountability.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/95 border-t border-zinc-800 py-8 text-xs text-zinc-400 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-white">CivicPulse Incident Command Network</span>
            <span>• Universal Public & Emergency Services</span>
          </div>
          <p>© 2026 CivicPulse • Real-Time Citizen Grievance & 3D Dispatch Network</p>
        </div>
      </footer>

    </div>
  );
};
