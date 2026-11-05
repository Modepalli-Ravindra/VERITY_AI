import React, { useState, useEffect } from 'react';
import { useAuth, getUserDisplayName } from '../context/AuthContext';
import { 
  ArrowRightOnRectangleIcon as LogOut, 
  CheckCircleIcon as CheckCircle2, 
  ExclamationCircleIcon as AlertCircle, 
  ArrowPathIcon as Loader2,
  DocumentDuplicateIcon as CopyIcon,
  CheckIcon as CopiedCheck,
  TrashIcon as Trash2
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsPageProps {
  onNavigate?: (route: string) => void;
}

interface UserPreferences {
  defaultModel: string;
  sensitivityThreshold: string;
  stylometricsRadar: boolean;
  autoParaphrasePrompt: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultModel: 'modernbert',
  sensitivityThreshold: 'balanced',
  stylometricsRadar: true,
  autoParaphrasePrompt: true,
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem('verity_user_preferences');
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_PREFERENCES;
  });

  const [copiedId, setCopiedId] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    if (user && !saving) {
      setFullName(getUserDisplayName(user));
    }
  }, [user, saving]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await updateProfile(fullName.trim());
      if (res?.error) {
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || 'Failed to update name.';
        setError(errMsg);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('verity_user_preferences', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('verity_local_analyses');
      localStorage.removeItem('verity_dashboard_telemetry');
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch {}
  };

  const initials = (getUserDisplayName(user) || user?.email || 'V')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex-1 min-h-0 h-full text-[#FFFFFF] px-4 sm:px-6 lg:px-8 py-3 relative overflow-hidden font-sans bg-transparent flex flex-col justify-center selection:bg-[#A64C61]/35">
      
      {/* Subtle ambient glows */}
      

      {/* Single Unified Card Container - Zero Spacing Boxes */}
      <div className="max-w-4xl mx-auto w-full bg-[#140A10]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-5 sm:p-6 relative overflow-hidden space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,201,216,0.15)]">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FFFFFF] mb-0.5">
              WORKSPACE CONFIGURATION
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Settings & Preferences
            </h1>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#00C9D8]/10 text-[#FFFFFF] border border-[#00C9D8]/25 text-[10px] font-mono">
            RLS Protected
          </span>
        </div>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {saved && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-2 rounded-xl bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#FFFFFF] text-xs flex items-center gap-2 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile name saved successfully.</span>
            </motion.div>
          )}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Profile Row */}
        <form onSubmit={handleSaveProfile} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C9D8]/20 to-[#0A2023] border border-[#00C9D8]/30 flex items-center justify-center text-sm font-bold text-[#FFFFFF] shrink-0">
              {initials}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Researcher Profile</div>
              <div className="text-[11px] text-[#D28B96] font-mono">{user?.email || 'user@verity.ai'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Display Name"
              className="px-3 py-1.5 bg-[#0A0407]/90 backdrop-blur-md border border-white/[0.08] rounded-lg text-xs text-white placeholder-[#D28B96]/45 focus:outline-none focus:border-[#00D4E5] w-48 sm:w-56"
            />
            <button
              type="submit"
              disabled={saving || !fullName.trim() || fullName === getUserDisplayName(user)}
              className="px-3 py-1.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061619] font-bold text-xs rounded-lg flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>

        {/* 2. Detection Model Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div>
            <div className="text-xs font-semibold text-white">Detection Engine</div>
            <div className="text-[11px] text-[#D28B96]">Active neural architecture used for document scoring</div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0A0407]/90 backdrop-blur-md p-1 rounded-xl border border-white/[0.08]">
            {[
              { id: 'modernbert', label: 'ModernBERT V5 (Primary)' },
              { id: 'distilroberta', label: 'DistilRoBERTa V2 (Standby)' }
            ].map(m => {
              const active = preferences.defaultModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleUpdatePreference('defaultModel', m.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active 
                      ? 'bg-[#00C9D8]/15 border border-[#00C9D8]/35 text-[#FFFFFF] font-bold ' 
                      : 'text-[#D28B96] hover:text-white border border-transparent'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Decision Sensitivity Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div>
            <div className="text-xs font-semibold text-white">Decision Sensitivity</div>
            <div className="text-[11px] text-[#D28B96]">Classification threshold for synthetic flag</div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0A0407]/90 backdrop-blur-md p-1 rounded-xl border border-white/[0.08]">
            {[
              { id: 'strict', label: 'Strict (0.60)' },
              { id: 'balanced', label: 'Balanced (0.70)' },
              { id: 'lenient', label: 'Lenient (0.85)' }
            ].map(s => {
              const active = preferences.sensitivityThreshold === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleUpdatePreference('sensitivityThreshold', s.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active 
                      ? 'bg-[#00C9D8]/15 border border-[#00C9D8]/35 text-[#FFFFFF] font-bold ' 
                      : 'text-[#D28B96] hover:text-white border border-transparent'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Preferences & Feature Toggles Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div>
            <div className="text-xs font-semibold text-white">Interactive Features</div>
            <div className="text-[11px] text-[#D28B96]">Real-time visualizers & recommendation prompts</div>
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle 1 */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-[#D28B96]">Stylometrics Radar</span>
              <button
                type="button"
                onClick={() => handleUpdatePreference('stylometricsRadar', !preferences.stylometricsRadar)}
                className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                  preferences.stylometricsRadar ? 'bg-[#00C9D8]' : 'bg-[#1C2633]'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  preferences.stylometricsRadar ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </label>

            {/* Toggle 2 */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-[#D28B96]">Smart Humanizer Prompt</span>
              <button
                type="button"
                onClick={() => handleUpdatePreference('autoParaphrasePrompt', !preferences.autoParaphrasePrompt)}
                className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                  preferences.autoParaphrasePrompt ? 'bg-[#00C9D8]' : 'bg-[#1C2633]'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  preferences.autoParaphrasePrompt ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </label>
          </div>
        </div>

        {/* 5. Account & Session Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D28B96]">
            <span>ID:</span>
            <span className="text-[#FFFFFF] truncate max-w-[160px] sm:max-w-[200px]">{user?.id || 'session-unassigned'}</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1 rounded bg-[#00C9D8]/10 hover:bg-[#00C9D8]/20 text-[#FFFFFF] transition-colors cursor-pointer"
              title="Copy ID"
            >
              {copiedId ? <CopiedCheck className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClearCache}
              className="px-3 py-1.5 rounded-lg bg-[#0A0407]/90 backdrop-blur-md hover:bg-[#081A1D] border border-white/[0.08] text-[#D28B96] hover:text-[#FFFFFF] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{cacheCleared ? 'Cache Cleared!' : 'Clear Cache'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('/logout');
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
