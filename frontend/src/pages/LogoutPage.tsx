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
    <div className="min-h-screen bg-transparent text-[#FFFFFF] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Ambient background glows */}
      

      {/* Technical noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] pointer-events-none mix-blend-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 sm:p-9 text-center relative overflow-hidden z-10"
      >
        {/* Glowing top cyan accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00C9D8] to-transparent " />

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <VerityLogo className="h-9 w-auto" />
          <span className="font-mono text-base font-bold tracking-widest text-[#FFFFFF]">VERITY</span>
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
          <div className="w-11 h-11 rounded-2xl bg-[#00C9D8]/15 border border-[#00C9D8]/30 flex items-center justify-center text-[#FFFFFF] ">
            <LogOut className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Text descriptions */}
        <h2 className="text-2xl font-bold font-sans tracking-tight text-[#FFFFFF] mb-2">
          Signing Out
        </h2>
        <p className="text-xs sm:text-sm font-sans text-[#9BB2B7] mb-5 leading-relaxed min-h-[38px] flex items-center justify-center">
          {statusText}
        </p>

        {/* Animated Progress Bar */}
        <div className="w-full bg-[#070D12]/90 backdrop-blur-md h-2 rounded-full overflow-hidden border border-[rgba(0,201,216,0.15)] mb-5 p-0.5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#008FA3] via-[#00C9D8] to-[#00E5FF] rounded-full "
            initial={{ width: '10%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        {/* Security badge pill */}
        <div className="p-2.5 rounded-xl bg-[#070D12]/90 backdrop-blur-md/80 border border-[rgba(0,201,216,0.15)] flex items-center justify-center gap-2 text-xs font-mono text-[#FFFFFF]">
          <ShieldCheck className="w-4 h-4 text-[#FFFFFF]" />
          <span>Session Invalidation Verified</span>
        </div>

        {/* Fallback link */}
        <div className="mt-5">
          <button
            onClick={() => onNavigate('/')}
            className="text-[11px] font-mono text-[#8DA2AA] hover:text-[#FFFFFF] transition-colors cursor-pointer uppercase tracking-wider"
          >
            Immediate Return to Home →
          </button>
        </div>
      </motion.div>
    </div>
  );
};
