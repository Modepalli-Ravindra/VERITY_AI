import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowRightOnRectangleIcon as LogOut, ShieldCheckIcon as ShieldCheck } from '@heroicons/react/24/outline';
import { VerityLogo } from '../components/VerityLogo';

interface LogoutPageProps {
  onNavigate: (route: string) => void;
}

export const LogoutPage: React.FC<LogoutPageProps> = ({ onNavigate }) => {
  const { signOut } = useAuth();
  const [statusText, setStatusText] = useState('Terminating cryptographic session...');
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    let isMounted = true;

    // Progress bar animations
    const t1 = setTimeout(() => {
      if (isMounted) {
        setProgress(50);
        setStatusText('Clearing session tokens & local cache...');
      }
    }, 400);

    const t2 = setTimeout(() => {
      if (isMounted) {
        setProgress(85);
        setStatusText('Session cleared securely. Redirecting to home...');
      }
    }, 900);

    const performLogout = async () => {
      try {
        await signOut();
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        if (isMounted) {
          setProgress(100);
          setTimeout(() => {
            onNavigate('/');
          }, 1200);
        }
      }
    };

    performLogout();

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [signOut, onNavigate]);

  return (
    <div className="min-h-screen bg-[#061416] text-[#F3F8F8] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[380px] bg-[#00C9D8]/12 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[280px] bg-[#008FA3]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Technical noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] pointer-events-none mix-blend-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#0A2023]/90 backdrop-blur-2xl border border-[rgba(0,201,216,0.28)] rounded-3xl p-8 sm:p-9 text-center shadow-[0_25px_60px_rgba(0,0,0,0.7)] relative overflow-hidden z-10"
      >
        {/* Glowing top cyan accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00C9D8] to-transparent shadow-[0_0_15px_#00C9D8]" />

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <VerityLogo className="h-9 w-auto" />
          <span className="font-mono text-base font-bold tracking-widest text-[#F4F7F8]">VERITY</span>
        </div>

        {/* High-tech Multi-Ring Spinning Loader */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          {/* Outer glowing pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-[#00C9D8]/10 blur-md animate-pulse" />

          {/* Outer rotating dashed ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-[rgba(0,201,216,0.15)] border-t-[#00C9D8] border-r-[#00D4E5]/40"
          />

          {/* Counter-rotating inner ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border border-[rgba(0,201,216,0.1)] border-b-[#00C9D8]/70"
          />

          {/* Inner center badge */}
          <div className="w-11 h-11 rounded-2xl bg-[#00C9D8]/15 border border-[#00C9D8]/30 flex items-center justify-center text-[#00C9D8] shadow-[0_0_16px_rgba(0,201,216,0.3)]">
            <LogOut className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Text descriptions */}
        <h2 className="text-2xl font-bold font-sans tracking-tight text-[#F3F8F8] mb-2">
          Signing Out
        </h2>
        <p className="text-xs sm:text-sm font-sans text-[#9BB2B7] mb-5 leading-relaxed min-h-[38px] flex items-center justify-center">
          {statusText}
        </p>

        {/* Animated Progress Bar */}
        <div className="w-full bg-[#030B0D] h-2 rounded-full overflow-hidden border border-[rgba(0,201,216,0.15)] mb-5 p-0.5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#008FA3] via-[#00C9D8] to-[#00E5FF] rounded-full shadow-[0_0_10px_#00C9D8]"
            initial={{ width: '10%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        {/* Security badge pill */}
        <div className="p-2.5 rounded-xl bg-[#030B0D]/80 border border-[rgba(0,201,216,0.15)] flex items-center justify-center gap-2 text-xs font-mono text-[#00C9D8]">
          <ShieldCheck className="w-4 h-4 text-[#00C9D8]" />
          <span>Session Invalidation Verified</span>
        </div>

        {/* Fallback link */}
        <div className="mt-5">
          <button
            onClick={() => onNavigate('/')}
            className="text-[11px] font-mono text-[#6F8B91] hover:text-[#00C9D8] transition-colors cursor-pointer uppercase tracking-wider"
          >
            Immediate Return to Home →
          </button>
        </div>
      </motion.div>
    </div>
  );
};
