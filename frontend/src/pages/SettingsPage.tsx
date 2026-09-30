import React, { useState, useEffect } from 'react';
import { useAuth, getUserDisplayName } from '../context/AuthContext';
import { Settings, User, Shield, LogOut, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsPageProps {
  onNavigate?: (route: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const { user, updateProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !saving) {
      // eslint-disable-next-line
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
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || 'Failed to update full name.';
        setError(errMsg);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-transparent text-[#f4f4f5] p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-12 font-sans tracking-wide">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-8 border-b border-white/5"
      >
        <div className="flex items-center gap-2 text-[10px] font-semibold text-[var(--color-lime-sprout)] uppercase tracking-[0.2em] mb-3">
          <Settings className="w-3.5 h-3.5" />
          <span>System Configuration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">Account Settings</h1>
      </motion.div>

      {/* Profile Info Form */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-lime-sprout)]/10 flex items-center justify-center border border-[var(--color-lime-sprout)]/20">
            <User className="w-4 h-4 text-[var(--color-lime-sprout)]" />
          </div>
          <h2 className="text-lg font-medium text-white tracking-tight">Profile Information</h2>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 sm:p-10 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
          {/* Subtle ambient gradient */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[var(--color-lime-sprout)]/[0.02] to-transparent pointer-events-none" />
          
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-md relative z-10">
            
            {saved && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3.5 rounded-xl bg-[var(--color-lime-sprout)]/10 border border-[var(--color-lime-sprout)]/20 text-emerald-200 text-xs flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile updated successfully.</span>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-[0.15em]">
                Display Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--color-lime-sprout)]/50 focus:bg-[var(--color-lime-sprout)]/5 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-[0.15em]">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-3 bg-white/10 border border-white/5 rounded-xl text-sm text-gray-600 cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-600 mt-2 font-medium">Email address is bound to identity and cannot be changed.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || !fullName.trim() || fullName === getUserDisplayName(user)}
                className="px-6 py-3 bg-white text-black hover:bg-gray-100 font-medium text-xs rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes</span>
                  </>
                ) : (
                  <span>Update Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Security & Authentication */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <Shield className="w-4 h-4 text-gray-400" />
          </div>
          <h2 className="text-lg font-medium text-white tracking-tight">Security & Access</h2>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 sm:p-10 rounded-2xl border border-white/5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white">InsForge Authentication</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                Your session is secured via JSON Web Tokens (JWT) with database-enforced Row Level Security (RLS) policies. All analysis history is completely private to this identity.
              </p>
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Active Identity ID</span>
                <p className="font-mono text-xs text-[var(--color-lime-sprout)] bg-[var(--color-lime-sprout)]/10 px-3 py-1.5 rounded-lg border border-[var(--color-lime-sprout)]/20 truncate w-full max-w-[300px]">
                  {user?.id}
                </p>
              </div>
            </div>

            <div className="flex items-end md:justify-end">
              <button
                onClick={signOut}
                className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 font-medium text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Terminate Session</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

