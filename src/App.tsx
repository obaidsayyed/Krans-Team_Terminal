import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { SOSModal } from './components/SOSModal';
import { ComplaintModal } from './components/ComplaintModal';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { AllotmentModal } from './components/AllotmentModal';
import { Complaint, SOSAlert, UserRole, UserSession, ServiceDepartment } from './types';
import { DEPARTMENTS } from './utils/constants';
import { 
  getStoredComplaints, 
  getStoredSOSAlerts, 
  civicEvents, 
  updateComplaintStatus 
} from './utils/storage';
import { playResolutionChime } from './utils/audio';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'signup' | 'dashboard'>('landing');
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [targetLoginRole, setTargetLoginRole] = useState<UserRole | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);

  // Stored state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);

  // Modals state
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [allottingComplaint, setAllottingComplaint] = useState<Complaint | null>(null);

  // Synchronize state with storage & event broadcaster
  const reloadData = () => {
    setComplaints(getStoredComplaints());
    setSosAlerts(getStoredSOSAlerts());
  };

  useEffect(() => {
    reloadData();
    const handleStateChange = () => {
      reloadData();
    };
    civicEvents.addEventListener('civic_state_change', handleStateChange);
    return () => {
      civicEvents.removeEventListener('civic_state_change', handleStateChange);
    };
  }, []);

  // Sync selectedComplaint reference when complaints array updates
  useEffect(() => {
    if (selectedComplaint) {
      const refreshed = complaints.find(c => c.id === selectedComplaint.id);
      if (refreshed) setSelectedComplaint(refreshed);
    }
  }, [complaints]);

  // Handlers for View Navigation & Authentication
  const handleGoToLogin = (role?: UserRole) => {
    if (role) setTargetLoginRole(role);
    setCurrentView('login');
  };

  const handleGoToSignUp = (role?: UserRole) => {
    if (role) setTargetLoginRole(role);
    setCurrentView('signup');
  };

  const handleAuthSuccess = (newSession: UserSession) => {
    setSession(newSession);
    setCurrentRole(newSession.role);
    setCurrentView('dashboard');
  };

  const handleSelectRoleFromNavbar = (role: UserRole) => {
    if (session) {
      // If user is Admin, allow viewing other department desk dashboards
      if (session.role === 'admin') {
        setCurrentRole(role);
        setCurrentView('dashboard');
        return;
      }
      // If user is logged in, their own session determines their view
      setCurrentRole(session.role);
      setCurrentView('dashboard');
    } else {
      // If not logged in, prompt to log in or create profile for that role
      setTargetLoginRole(role);
      setCurrentView('login');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentRole(null);
    setTargetLoginRole(null);
    setCurrentView('landing');
  };

  const handleUpdateStatus = (
    complaintId: string, 
    nextStatus: any, 
    nextPct: number, 
    note?: string
  ) => {
    const actorName = session?.name || 'Department Officer';
    const updated = updateComplaintStatus(complaintId, nextStatus, nextPct, actorName, note);
    if (updated && nextStatus === 'resolved') {
      playResolutionChime();
    }
  };

  const activeSOSCount = sosAlerts.filter(s => s.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-[#11221a] text-[#f2ece1] flex flex-col font-sans selection:bg-amber-500 selection:text-emerald-950">
      
      {/* Top Universal Navbar */}
      <Navbar
        currentView={currentView}
        currentRole={currentRole}
        session={session}
        onNavigate={(view, role) => {
          if (role) setTargetLoginRole(role);
          setCurrentView(view);
        }}
        onSelectRole={handleSelectRoleFromNavbar}
        onLogout={handleLogout}
        onOpenSOSModal={() => setIsSOSModalOpen(true)}
        activeSOSCount={activeSOSCount}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        
        {/* 1. Landing Page View */}
        {currentView === 'landing' && (
          <LandingPage
            onGoToLogin={handleGoToLogin}
            onGoToSignUp={handleGoToSignUp}
            onOpenSOSModal={() => setIsSOSModalOpen(true)}
            onRegisterComplaintFast={() => {
              handleSelectRoleFromNavbar('citizen');
              setIsComplaintModalOpen(true);
            }}
          />
        )}

        {/* 2. Login Page View (Role-aware login with Create Profile options) */}
        {currentView === 'login' && (
          <LoginPage
            targetRole={targetLoginRole}
            onLoginSuccess={handleAuthSuccess}
            onGoToSignUp={handleGoToSignUp}
            onBackToLanding={() => setCurrentView('landing')}
          />
        )}

        {/* 3. Sign Up Page View (Strict 10 digits validation & pre-selected department) */}
        {currentView === 'signup' && (
          <SignUpPage
            initialRole={targetLoginRole}
            onSignUpSuccess={handleAuthSuccess}
            onGoToLogin={handleGoToLogin}
            onBackToLanding={() => setCurrentView('landing')}
          />
        )}

        {/* 4. Role-specific Dashboard Views (7 Desks) */}
        {currentView === 'dashboard' && session && (
          <>
            {/* 4.1 Citizen / User Dashboard */}
            {session.role === 'citizen' && (
              <UserDashboard
                session={session}
                complaints={complaints}
                sosAlerts={sosAlerts}
                onOpenSOSModal={() => setIsSOSModalOpen(true)}
                onOpenComplaintModal={() => setIsComplaintModalOpen(true)}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
              />
            )}

            {/* 4.2 Central Admin Command Dashboard */}
            {session.role === 'admin' && (
              <AdminDashboard
                session={session}
                complaints={complaints}
                sosAlerts={sosAlerts}
                onOpenSOSModal={() => setIsSOSModalOpen(true)}
                onOpenAllotModal={(c) => setAllottingComplaint(c)}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {/* 4.3 to 4.7 Five Department Dashboards (Police, RTO, Hospital, Fire, Municipal) */}
            {(['police', 'rto', 'hospital', 'fire', 'municipal'] as ServiceDepartment[]).includes(session.role as ServiceDepartment) && (
              <DepartmentDashboard
                department={session.role as ServiceDepartment}
                session={session}
                complaints={complaints}
                sosAlerts={sosAlerts}
                onOpenSOSModal={() => setIsSOSModalOpen(true)}
                onOpenAllotModal={(c) => setAllottingComplaint(c)}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
          </>
        )}

      </main>

      {/* Global Modals */}

      {/* Emergency SOS Modal */}
      <SOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        isAdmin={session?.role === 'admin'}
        citizenName={session?.name || 'Citizen In Need'}
        citizenPhone={session?.phone || '+91 98765 00000'}
        onSOSCreated={(alert) => {
          reloadData();
        }}
      />

      {/* Register Complaint Modal */}
      <ComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        citizenName={session?.name || ''}
        citizenEmail={session?.email || ''}
        citizenPhone={session?.phone || ''}
        onComplaintCreated={(comp) => {
          reloadData();
        }}
      />

      {/* Detailed Tracking & Inspection Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        currentUserRole={session?.role || 'citizen'}
        currentUserName={session?.name || 'Field Officer'}
        onOpenAllotModal={(c) => {
          setAllottingComplaint(c);
        }}
        onComplaintUpdated={(updated) => {
          setSelectedComplaint(updated);
          reloadData();
        }}
      />

      {/* Allotment & Department Transfer Modal */}
      <AllotmentModal
        complaint={allottingComplaint}
        isOpen={!!allottingComplaint}
        onClose={() => setAllottingComplaint(null)}
        adminName={session?.name || 'Director General HQ'}
        onAllotted={(updated) => {
          reloadData();
        }}
      />

    </div>
  );
}
