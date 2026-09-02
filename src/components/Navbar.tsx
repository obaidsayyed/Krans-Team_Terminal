import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  LogIn, 
  LogOut, 
  Volume2, 
  VolumeX, 
  BellRing,
  Menu, 
  X,
  User,
  ShieldAlert,
  Car,
  HeartPulse,
  Flame,
  Building2,
  Layers,
  Sparkles,
  Database
} from 'lucide-react';
import { UserRole, UserSession } from '../types';
import { getIsMuted, setMuted as setAudioMuted, playDispatchRingtone } from '../utils/audio';
import { isSupabaseConfigured } from '../services/supabase';
import { SupabaseStatusModal } from './SupabaseStatusModal';

interface NavbarProps {
  currentView: 'landing' | 'login' | 'signup' | 'dashboard';
  currentRole: UserRole | null;
  session: UserSession | null;
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard', role?: UserRole) => void;
  onSelectRole: (role: UserRole) => void;
  onLogout: () => void;
  onOpenSOSModal: () => void;
  activeSOSCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentRole,
  session,
  onNavigate,
  onSelectRole,
  onLogout,
  onOpenSOSModal,
  activeSOSCount
}) => {
  const [muted, setMuted] = useState(getIsMuted());
  const [isRingingTest, setIsRingingTest] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    setMuted(getIsMuted());
  }, []);

  const toggleSound = () => {
    const nextState = !muted;
    setAudioMuted(nextState);
    setMuted(nextState);
  };

  const handleTestRing = () => {
    setIsRingingTest(true);
    playDispatchRingtone();
    setTimeout(() => {
      setIsRingingTest(false);
    }, 2500);
  };

  const roleTitles: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
    citizen: { label: 'User', icon: <User className="w-3.5 h-3.5 text-emerald-400" />, color: 'text-emerald-400' },
    police: { label: 'Police', icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />, color: 'text-amber-400' },
    hospital: { label: 'Hospital', icon: <HeartPulse className="w-3.5 h-3.5 text-emerald-300" />, color: 'text-emerald-300' },
    fire: { label: 'Fire', icon: <Flame className="w-3.5 h-3.5 text-orange-400" />, color: 'text-orange-400' },
    rto: { label: 'RTO', icon: <Car className="w-3.5 h-3.5 text-amber-300" />, color: 'text-amber-300' },
    municipal: { label: 'Municipal', icon: <Building2 className="w-3.5 h-3.5 text-lime-400" />, color: 'text-lime-400' },
    admin: { label: 'Admin HQ', icon: <Layers className="w-3.5 h-3.5 text-amber-500" />, color: 'text-amber-500' }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#14261e]/95 backdrop-blur-xl border-b border-[#2d4b3c] text-[#f2ece1] transition-all shadow-xl shadow-[#0c1813]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Left Brand Identity */}
          <div 
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-3 cursor-pointer group select-none py-1"
            title="Return to Incident Command Grid"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-[#1d382c] border border-[#3c6450] text-emerald-400 flex items-center justify-center group-hover:scale-105 transition shadow-lg shadow-[#102319]">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#f5f0e6] font-['Outfit'] truncate">
                  Civic<span className="text-amber-400">Pulse</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-[#1b3529] text-emerald-300 border border-[#345945]">
                  7 Desks Network
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#c7beaf] font-medium hidden md:block truncate">
                Incident Response & Emergency Dispatch Network
              </p>
            </div>
          </div>

          {/* Quick Dashboard Role Switcher Menu (Desktop) - ALL 5 SERVICES + USER + ADMIN */}
          <div className="hidden lg:flex items-center space-x-1 bg-[#182e24] p-1 rounded-2xl border border-[#2d4b3c]">
            <span className="text-[11px] font-bold text-[#b8ad9c] px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Desks:
            </span>
            {(['citizen', 'police', 'hospital', 'fire', 'rto', 'municipal', 'admin'] as UserRole[]).map((roleKey) => {
              const active = currentRole === roleKey && currentView === 'dashboard';
              const roleInfo = roleTitles[roleKey];
              return (
                <button
                  key={roleKey}
                  onClick={() => onSelectRole(roleKey)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                    active
                      ? 'bg-amber-500 text-emerald-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-[#d6cebf] hover:text-[#fff9f0] hover:bg-[#224032]'
                  }`}
                  title={`Open ${roleInfo.label} Workstation`}
                >
                  {roleKey === 'citizen' ? (
                    <User className="w-3 h-3 text-emerald-400" />
                  ) : null}
                  <span>{roleInfo.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Supabase Connection Diagnostics Indicator */}
            <button
              onClick={() => setStatusModalOpen(true)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl border transition flex items-center space-x-1.5 cursor-pointer ${
                supabaseConfigured
                  ? 'bg-[#182e24] border-emerald-500/40 text-emerald-300 hover:bg-[#203d30]'
                  : 'bg-[#261d19] border-amber-500/40 text-amber-300 hover:bg-[#332620]'
              }`}
              title="View Supabase Auth & Database Connection Diagnostics"
            >
              <Database className={`w-3.5 h-3.5 ${supabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">
                {supabaseConfigured ? 'Supabase' : 'Supabase (Check)'}
              </span>
              <span className={`w-2 h-2 rounded-full ${supabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            </button>

            {/* Audio Alert Bell / Ring Test */}
            <div className="flex items-center bg-[#182e24] border border-[#2d4b3c] rounded-xl p-0.5 sm:p-1">
              <button
                onClick={toggleSound}
                className="p-1.5 text-[#b8ad9c] hover:text-[#f5f0e6] rounded-lg hover:bg-[#224032] transition cursor-pointer"
                title={muted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
                aria-label="Toggle Sound"
              >
                {muted ? <VolumeX className="w-4 h-4 text-orange-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={handleTestRing}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                  isRingingTest ? 'bg-amber-400 text-emerald-950 font-bold shadow-md' : 'text-[#c7beaf] hover:text-[#f5f0e6] hover:bg-[#224032]'
                }`}
                title="Test Ringing Dispatch Siren"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Siren Test</span>
              </button>
            </div>

            {/* Emergency SOS Quick Trigger Pill */}
            <button
              onClick={onOpenSOSModal}
              className="relative px-3 sm:px-4 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:from-orange-700 active:to-amber-700 text-[#fffbf2] font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-orange-600/30 transition animate-pulse cursor-pointer"
              title="Broadcast Emergency SOS"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
              <span className="font-extrabold tracking-wide">SOS</span>
              {activeSOSCount > 0 && (
                <span className="ml-1 bg-[#fffbf2] text-orange-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {activeSOSCount}
                </span>
              )}
            </button>

            {/* User Session status OR Single Clean Sign In Button (NO extra buttons after Sign In) */}
            {session ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold text-[#f5f0e6] block truncate max-w-[120px]">
                    {session.name}
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase">
                    {session.role === 'citizen' ? 'User' : session.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-[#c7beaf] hover:text-orange-400 hover:bg-[#2f1c1c] rounded-xl border border-[#2d4b3c] transition cursor-pointer"
                  title="Log Out Session"
                  aria-label="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* When not logged in: ONLY the Sign In button is rendered (no extra buttons after it) */
              <button
                onClick={() => onNavigate('login')}
                className="px-3.5 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 active:from-emerald-600 active:to-amber-600 text-emerald-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center space-x-1.5 cursor-pointer"
                id="navbar-signin-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#c7beaf] hover:text-[#f5f0e6] rounded-xl hover:bg-[#1f3b2e] transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 px-2 border-t border-[#2d4b3c] bg-[#14261e] space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#b8ad9c] px-2">
              Select Command Desk:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(['citizen', 'police', 'hospital', 'fire', 'rto', 'municipal', 'admin'] as UserRole[]).map((roleKey) => (
                <button
                  key={roleKey}
                  onClick={() => {
                    onSelectRole(roleKey);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 border transition ${
                    currentRole === roleKey && currentView === 'dashboard'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#182e24] border-[#2d4b3c] text-[#d6cebf] hover:bg-[#224032]'
                  }`}
                >
                  {roleTitles[roleKey].icon}
                  <span className="capitalize">{roleTitles[roleKey].label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Supabase Realtime Diagnostics Modal */}
      <SupabaseStatusModal 
        isOpen={statusModalOpen} 
        onClose={() => setStatusModalOpen(false)} 
      />
    </header>
  );
};
