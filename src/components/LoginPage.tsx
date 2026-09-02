import React, { useState } from 'react';
import { 
  LogIn, 
  Mail, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  UserPlus, 
  Radio
} from 'lucide-react';
import { UserRole, UserSession } from '../types';
import { authenticateUser } from '../utils/storage';
import { isSupabaseConfigured, signInWithSupabase } from '../services/supabase';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
  onGoToSignUp: (role?: UserRole) => void;
  onBackToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onGoToSignUp,
  onBackToLanding
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabaseActive = isSupabaseConfigured();

  // Standard email validation regex
  const standardEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!standardEmailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address with a standard format (e.g. user@domain.com).');
      return;
    }

    if (!trimmedPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      if (supabaseActive) {
        const sbResult = await signInWithSupabase(trimmedEmail, trimmedPassword);
        if (sbResult.success && sbResult.session) {
          setIsLoading(false);
          onLoginSuccess(sbResult.session);
          return;
        }
      }

      // Local / Offline authentication fallback
      const result = authenticateUser(trimmedEmail, trimmedPassword);
      setIsLoading(false);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setError(result.error || 'Invalid credentials. If you do not have an account, please create a profile below.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Authentication error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#14261e] via-[#12231b] to-[#0f1d16] text-[#f2ece1] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Ambient Warm/Emerald Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-700/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Back Navigation */}
      <div className="max-w-md w-full mx-auto px-4 mb-4 flex items-center justify-between relative z-10">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#d6cebf] hover:text-[#f5f0e6] bg-[#182e24] hover:bg-[#1f3a2e] border border-[#2d4e3e] px-3.5 py-2 rounded-xl transition shadow-lg backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Command Grid</span>
        </button>

        <button
          onClick={() => onGoToSignUp()}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-[#1c3529] hover:bg-[#244234] border border-[#345c47] px-3.5 py-2 rounded-xl transition shadow-lg backdrop-blur-md cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Profile</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto px-4 relative z-10">
        
        {/* Main Sign In Card in Forest Moss */}
        <div className="bg-[#182e24] rounded-3xl border border-[#2d4e3e] shadow-2xl p-6 sm:p-8">
          
          {/* Header */}
          <div className="text-center pb-6 border-b border-[#264535]">
            <div className="w-14 h-14 rounded-2xl bg-[#14261e] border border-[#2d4e3e] text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Radio className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#f5f0e6] font-['Outfit'] tracking-tight">
              Sign In to <span className="text-amber-400">CivicPulse</span>
            </h1>
            <p className="text-xs text-[#c7beaf] mt-1.5">
              Enter your credentials to access your designated command workstation
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 mt-6">
            
            {error && (
              <div className="p-3.5 rounded-2xl bg-[#2e1818] border border-orange-500/40 text-orange-200 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#d6cebf] uppercase tracking-wider mb-1.5">
                Registered Email <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a39785]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full bg-[#14261e] border border-[#2d4e3e] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f5f0e6] placeholder-[#8f8373] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
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
                  placeholder="••••••••"
                  className="w-full bg-[#14261e] border border-[#2d4e3e] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f5f0e6] placeholder-[#8f8373] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 active:from-emerald-600 active:to-amber-600 disabled:opacity-50 text-emerald-950 font-black rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2 transition cursor-pointer"
              id="login-submit-btn"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-950/40 border-t-emerald-950 rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span className="tracking-wide">Sign In to Dashboard</span>
                </>
              )}
            </button>

          </form>

          {/* Footer - Create Account Callout */}
          <div className="mt-6 pt-5 border-t border-[#264535] text-center">
            <p className="text-xs text-[#c7beaf]">
              Don't have an account registered on the grid?
            </p>
            <button
              type="button"
              onClick={() => onGoToSignUp()}
              className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition inline-flex items-center space-x-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register / Create New Profile</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;
