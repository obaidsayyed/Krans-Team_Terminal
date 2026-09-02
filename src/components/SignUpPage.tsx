import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  BadgeCheck, 
  CheckCircle2, 
  Shield, 
  LogIn, 
  Radio 
} from 'lucide-react';
import { UserRole, UserSession } from '../types';
import { registerUserAccount } from '../utils/storage';
import { isSupabaseConfigured, signUpWithSupabase } from '../services/supabase';

interface SignUpPageProps {
  initialRole?: UserRole | null;
  onSignUpSuccess: (session: UserSession) => void;
  onGoToLogin: (role?: UserRole) => void;
  onBackToLanding: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  initialRole,
  onSignUpSuccess,
  onGoToLogin,
  onBackToLanding
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole || 'citizen');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabaseActive = isSupabaseConfigured();

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  // Standard email validation regex
  const standardEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // Exact 10 digits phone regex
  const tenDigitPhoneRegex = /^\d{10}$/;

  const roleOptions: { value: UserRole; label: string; departmentNote: string; badgeLabel?: string; badgePlaceholder?: string }[] = [
    { value: 'citizen', label: 'User / General Public Citizen', departmentNote: 'File complaints with GPS & Photos, trigger emergency SOS sirens, track resolutions live' },
    { value: 'admin', label: 'Central Admin Command HQ', departmentNote: 'City-wide triage, cross-service re-allotment & emergency escalation desk', badgeLabel: 'Command HQ ID', badgePlaceholder: 'e.g. ADM-HQ-01' },
    { value: 'police', label: 'Police Department (Law Enforcement)', departmentNote: 'Dial 100/112 PCR patrol dispatches, criminal FIRs & investigation', badgeLabel: 'Police Badge / Station ID', badgePlaceholder: 'e.g. POL-DIV-77' },
    { value: 'rto', label: 'Regional Transport Office (RTO)', departmentNote: 'Accident clearance, road blockages, crane towing & vehicle tracking', badgeLabel: 'RTO Inspector Badge', badgePlaceholder: 'e.g. RTO-ZONE-4' },
    { value: 'hospital', label: 'Hospital & Emergency Medical Services (EMS)', departmentNote: 'Dial 102/108 ACLS ambulance dispatch, ICU intake & cardiac trauma', badgeLabel: 'Medical Officer / EMS ID', badgePlaceholder: 'e.g. EMS-TR-12' },
    { value: 'fire', label: 'Fire & Rescue Services', departmentNote: 'Dial 101 Fire tenders, HazMat chemical containment & structural rescue', badgeLabel: 'Fire Marshal / Station Badge', badgePlaceholder: 'e.g. FIR-CMD-09' },
    { value: 'municipal', label: 'Municipal Corporation (Civic Works)', departmentNote: 'Dial 1916 Sanitation, water pipe leaks, road potholes & streetlights', badgeLabel: 'Municipal Zonal Officer ID', badgePlaceholder: 'e.g. MNC-NORTH-5' }
  ];

  const selectedRoleOption = roleOptions.find(r => r.value === role)!;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      setError('Please enter a full name between 2 and 60 characters.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!standardEmailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address with standard domain format (e.g. user@example.com or officer@city.gov).');
      return;
    }

    if (!phone) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    if (!tenDigitPhoneRegex.test(phone)) {
      setError('Phone number must contain exactly 10 digits without alphabets or special characters.');
      return;
    }

    if (role !== 'citizen' && !badgeNumber.trim()) {
      setError(`Please provide your official ${selectedRoleOption.badgeLabel || 'Service ID'}.`);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);

    (async () => {
      try {
        let finalSession: UserSession | null = null;

        if (supabaseActive) {
          const sbResult = await signUpWithSupabase({
            email: trimmedEmail,
            password,
            name: trimmedName,
            phone: `+91 ${phone}`,
            role,
            badgeNumber: role !== 'citizen' ? badgeNumber.trim() : undefined,
          });

          if (!sbResult.success && sbResult.error) {
            // If user already registered or error
            console.warn('Supabase sign up notice:', sbResult.error);
          } else if (sbResult.session) {
            finalSession = sbResult.session;
          }
        }

        // Always register in local state store as well for persistent offline sync
        const result = registerUserAccount({
          name: trimmedName,
          email: trimmedEmail,
          phone: `+91 ${phone}`,
          role,
          badgeNumber: role !== 'citizen' ? badgeNumber.trim() : undefined,
          password
        });

        setIsLoading(false);

        if (finalSession) {
          onSignUpSuccess(finalSession);
        } else if (result.success && result.session) {
          onSignUpSuccess(result.session);
        } else {
          setError(result.error || 'Failed to create profile. Email may already be in use.');
        }
      } catch (err: any) {
        setIsLoading(false);
        setError(err.message || 'Error occurred while creating account profile.');
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#14261e] via-[#12231b] to-[#0f1d16] text-[#f2ece1] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Ambient Warm/Emerald Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-700/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Header Navigation */}
      <div className="max-w-xl w-full mx-auto px-4 mb-3 flex items-center justify-between relative z-10">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#d6cebf] hover:text-[#f5f0e6] bg-[#182e24] hover:bg-[#1f3a2e] border border-[#2d4e3e] px-3.5 py-2 rounded-xl transition shadow-lg backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Command Grid</span>
        </button>

        <button
          onClick={() => onGoToLogin(role)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-[#1c3529] hover:bg-[#244234] border border-[#345c47] px-3.5 py-2 rounded-xl transition shadow-lg backdrop-blur-md cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Already registered? Sign In</span>
        </button>
      </div>

      <div className="max-w-xl w-full mx-auto px-4 relative z-10">
        
        {/* Main Card in Forest Moss */}
        <div className="bg-[#182e24] rounded-3xl border border-[#2d4e3e] shadow-2xl overflow-hidden p-6 sm:p-8">
          
          {/* Header */}
          <div className="text-center pb-5 border-b border-[#264535]">
            <div className="w-12 h-12 rounded-2xl bg-[#14261e] border border-[#2d4e3e] text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Radio className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#f5f0e6] font-['Outfit']">
              Create Profile
            </h1>
            <p className="text-xs text-[#c7beaf] mt-1">
              Register a citizen or departmental officer profile for direct workstation access.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            
            {error && (
              <div className="p-3.5 rounded-2xl bg-[#2e1818] border border-orange-500/40 text-orange-200 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Department Role Selection */}
            <div>
              <label className="block text-xs font-bold text-[#d6cebf] uppercase tracking-wider mb-1.5">
                Select Profile Role / Department <span className="text-amber-400">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-[#14261e] border border-[#2d4e3e] rounded-xl px-3.5 py-3 text-sm text-[#f5f0e6] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition cursor-pointer"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#182e24] text-[#f5f0e6]">
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-300 mt-1 font-medium bg-[#14261e] p-2.5 rounded-lg border border-[#2d4e3e]">
                {selectedRoleOption.departmentNote}
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#d6cebf] uppercase tracking-wider mb-1.5">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a39785]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma or Officer Rajesh Kumar"
                  className="w-full bg-[#14261e] border border-[#2d4e3e] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f5f0e6] placeholder-[#8f8373] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            {/* Email and Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#d6cebf] uppercase tracking-wider mb-1.5">
                  Official Email <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a39785]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@civic.gov"
                    className="w-full bg-[#14261e] border border-[#2d4e3e] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f5f0e6] placeholder-[#8f8373] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                    required
                  />
                </div>
                <p className="text-[10px] text-[#a39785] mt-1">Standard format (e.g. user@domain.com)</p>
              </div>

              {/* Phone (10 digits only) */}
              <div>
                <label className="block text-xs font-bold text-[#d6cebf] uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full bg-[#14261e] border border-[#2d4e3e] rounded-xl pl-12 pr-4 py-3 text-sm text-[#f5f0e6] placeholder-[#8f8373] font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#a39785] mt-1">
                  <span>Strictly 10 digits</span>
                  <span className={phone.length === 10 ? 'text-emerald-400 font-bold' : 'text-[#a39785]'}>
                    {phone.length}/10 digits
                  </span>
                </div>
              </div>

            </div>

            {/* Officer Badge Number (Conditional) */}
            {role !== 'citizen' && (
              <div>
                <label className="block text-xs font-bold text-[#d6cebf] uppercase tracking-wider mb-1.5">
                  {selectedRoleOption.badgeLabel || 'Service Badge ID'} <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a39785]" />
                  <input
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder={selectedRoleOption.badgePlaceholder || 'e.g. POL-DIV-77'}
                    className="w-full bg-[#14261e] border border-[#2d4e3e] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f5f0e6] placeholder-[#8f8373] font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition uppercase"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password and Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#d6cebf] uppercase tracking-wider mb-1.5">
                  Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a39785]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#14261e] border border-[#2d4e3e] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f5f0e6] placeholder-[#8f8373] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#d6cebf] uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a39785]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-[#14261e] border border-[#2d4e3e] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f5f0e6] placeholder-[#8f8373] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 active:from-emerald-600 active:to-amber-600 text-emerald-950 font-black rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2 transition cursor-pointer"
              id="signup-submit-btn"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-950/40 border-t-emerald-950 rounded-full animate-spin"></div>
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Official Profile & Access Desk</span>
                </>
              )}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
};
