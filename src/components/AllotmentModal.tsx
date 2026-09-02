import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  Car, 
  HeartPulse, 
  Flame, 
  Building2, 
  CheckCircle2, 
  Volume2, 
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Complaint, ServiceDepartment } from '../types';
import { DEPARTMENTS } from '../utils/constants';
import { allotComplaintToService } from '../utils/storage';

interface AllotmentModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
  onAllotted: (updated: Complaint) => void;
}

export const AllotmentModal: React.FC<AllotmentModalProps> = ({
  complaint,
  isOpen,
  onClose,
  adminName,
  onAllotted
}) => {
  const [targetService, setTargetService] = useState<ServiceDepartment>('police');
  const [officerName, setOfficerName] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (complaint) {
      setTargetService(complaint.assignedService || 'police');
      setOfficerName(DEPARTMENTS[complaint.assignedService || 'police']?.defaultOfficer || '');
      setDispatchNote('');
      setError(null);
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const handleAllot = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedOfficer = officerName.trim();
    if (trimmedOfficer && (trimmedOfficer.length < 2 || trimmedOfficer.length > 80)) {
      setError('Officer name must be between 2 and 80 characters.');
      return;
    }

    const trimmedNotes = dispatchNote.trim();
    if (trimmedNotes && trimmedNotes.length > 500) {
      setError('Dispatch notes must not exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const defaultOfficer = DEPARTMENTS[targetService]?.defaultOfficer || 'Zonal Officer Assigned';
      const updated = allotComplaintToService(
        complaint.id,
        targetService,
        trimmedOfficer || defaultOfficer,
        adminName,
        trimmedNotes || `Direct Central Allotment to ${targetService.toUpperCase()} Division.`
      );

      if (updated) {
        onAllotted(updated);
      }
      setIsSubmitting(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit'] truncate">
                Allot / Re-Allot Complaint To Service
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Ticket: <span className="text-indigo-400 font-mono font-semibold">{complaint.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAllot} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Target Service Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Target Service Division <span className="text-rose-400">*</span>
            </label>
            <div className="space-y-2">
              {(['police', 'rto', 'hospital', 'fire', 'municipal'] as ServiceDepartment[]).map((service) => {
                const info = DEPARTMENTS[service];
                const active = targetService === service;
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => {
                      setTargetService(service);
                      setOfficerName(info.defaultOfficer);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between min-h-[50px] ${
                      active
                        ? `${info.badgeColor} ring-2 ring-white/20 font-bold shadow-md`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {service === 'police' && <ShieldAlert className="w-4 h-4 text-blue-400" />}
                        {service === 'rto' && <Car className="w-4 h-4 text-amber-400" />}
                        {service === 'hospital' && <HeartPulse className="w-4 h-4 text-emerald-400" />}
                        {service === 'fire' && <Flame className="w-4 h-4 text-rose-400" />}
                        {service === 'municipal' && <Building2 className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-white leading-tight">{info.name}</p>
                        <p className="text-[11px] text-slate-400">Helpline: {info.helpline}</p>
                      </div>
                    </div>
                    {active && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Officer */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assigned Field Officer / Unit Designation
            </label>
            <input
              type="text"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              maxLength={80}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[44px]"
              placeholder="e.g. Insp. R. Verma (Badge #POL-44)"
            />
          </div>

          {/* Dispatch Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Dispatch Instructions / Priority Notes
              </label>
              <span className="text-[11px] text-slate-500 font-mono">{dispatchNote.length}/500</span>
            </div>
            <textarea
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. High priority response needed. Clear road before peak hours..."
            />
          </div>

          {/* Audio Ringing notice */}
          <div className="p-3 bg-indigo-950/50 rounded-xl border border-indigo-500/30 flex items-center space-x-2 text-xs text-indigo-300">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span>Allotment will sound a telephone ringing bell alert at the {targetService.toUpperCase()} workstation.</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[48px]"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Confirm Allotment & Send Ringing Dispatch</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
