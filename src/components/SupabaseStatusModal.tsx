import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Key, 
  Globe, 
  ShieldCheck, 
  TableProperties,
  Copy,
  Check
} from 'lucide-react';
import { 
  diagnoseSupabaseConnection, 
  getSupabaseConfigInfo, 
  SupabaseDiagnosticResult 
} from '../services/supabase';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<SupabaseDiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const res = await diagnoseSupabaseConnection();
      setDiagnostics(res);
    } catch (e: any) {
      setDiagnostics({
        isConfigured: false,
        url: 'Error',
        authConnected: false,
        dbConnected: false,
        authError: e.message,
        details: [e.message]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const config = getSupabaseConfigInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#14261e] border border-[#2d4b3c] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d4b3c] bg-[#1a3328]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#f5f0e6] font-['Outfit'] flex items-center gap-2">
                Supabase Connection Status
              </h3>
              <p className="text-xs text-[#b8ad9c]">Real-time live Auth & Database diagnostic test</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#b8ad9c] hover:text-[#f5f0e6] hover:bg-[#234234] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Environment Variables Overview */}
          <div className="bg-[#0f1d17] border border-[#234032] rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-[#d6cebf] uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Environment Configuration Check
            </h4>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#1b3328]">
                <span className="text-[#a89d8d] font-mono">VITE_SUPABASE_URL</span>
                <span className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                  config.hasValidUrlPattern 
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' 
                    : 'bg-red-950/80 text-red-300 border border-red-800/50'
                }`}>
                  {config.url.length > 35 ? `${config.url.substring(0, 32)}...` : config.url}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1b3328]">
                <span className="text-[#a89d8d] font-mono">VITE_SUPABASE_ANON_KEY</span>
                <span className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                  config.hasValidKeyPattern 
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' 
                    : 'bg-red-950/80 text-red-300 border border-red-800/50'
                }`}>
                  {config.maskedKey}
                </span>
              </div>
            </div>
          </div>

          {/* Test Status Cards */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Auth Service */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              diagnostics?.authConnected
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                : 'bg-red-950/20 border-red-800/40 text-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Supabase Auth</span>
                </div>
                {diagnostics?.authConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <p className="text-[11px] text-[#c7beaf]">
                {diagnostics?.authConnected
                  ? 'Connected & responding to sessions'
                  : diagnostics?.authError || 'Not connected'}
              </p>
            </div>

            {/* Database Service */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              diagnostics?.dbConnected
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">Database Tables</span>
                </div>
                {diagnostics?.dbConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-[#c7beaf]">
                {diagnostics?.dbConnected
                  ? 'Connected & schema tables queried'
                  : diagnostics?.dbError || 'Tables query pending'}
              </p>
            </div>

          </div>

          {/* Tables Checklist */}
          {diagnostics?.tablesFound && (
            <div className="bg-[#0f1d17] border border-[#234032] rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-[#d6cebf] uppercase tracking-wider flex items-center gap-1.5">
                <TableProperties className="w-3.5 h-3.5 text-emerald-400" />
                PostgreSQL Tables Verification
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(diagnostics.tablesFound).map(([tableName, found]) => (
                  <div 
                    key={tableName} 
                    className="flex items-center justify-between p-2 rounded-lg bg-[#14261e] border border-[#234032]"
                  >
                    <span className="font-mono text-[#d6cebf] text-[11px]">{tableName}</span>
                    {found ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                        <AlertCircle className="w-3 h-3" /> Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic Log Output */}
          <div className="bg-[#0c1712] border border-[#1d3529] rounded-xl p-3 text-[11px] font-mono text-[#b8ad9c] space-y-1">
            <div className="text-[10px] text-[#7a8c82] uppercase font-bold tracking-wider mb-1">
              Diagnostic Log:
            </div>
            {diagnostics?.details?.map((log, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 select-none">›</span>
                <span>{log}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-amber-400 pt-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Pinging Supabase API servers...</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2d4b3c] bg-[#1a3328]">
          <span className="text-xs text-[#a89d8d]">
            Automatic fallback enabled if offline
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={runTest}
              disabled={loading}
              className="px-4 py-2 bg-[#224032] hover:bg-[#2d5240] text-[#f5f0e6] text-xs font-bold rounded-xl transition flex items-center space-x-1.5 border border-[#345945] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Testing...' : 'Retest Connection'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-[#0c1813] text-xs font-black rounded-xl transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
