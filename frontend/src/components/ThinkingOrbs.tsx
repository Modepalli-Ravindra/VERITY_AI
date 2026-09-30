import React, { useEffect, useState } from 'react';

interface ThinkingOrbsProps {
  title: string;
  stages: string[];
  subtext?: string;
  durationMs?: number;
}

export const ThinkingOrbs: React.FC<ThinkingOrbsProps> = ({ title, stages, subtext, durationMs = 750 }) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    if (!stages || stages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, durationMs);

    return () => clearInterval(interval);
  }, [stages, durationMs]);

  return (
    <div 
      role="status" 
      aria-live="polite" 
      className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6 animate-fade-in font-sans"
    >
      {/* MODERN SCANNER LOADER */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer ambient glow */}
        <div className="absolute inset-0 rounded-full bg-[var(--color-lime-sprout)]/10 blur-xl animate-pulse" />
        
        {/* Primary spinning arc */}
        <div 
          className="absolute inset-2 rounded-full border border-white/5 border-t-[var(--color-lime-sprout)] border-r-[var(--color-lime-sprout)]/30 animate-spin" 
          style={{ animationDuration: '1.2s' }} 
        />
        
        {/* Secondary inner spinning arc (reverse) */}
        <div 
          className="absolute inset-5 rounded-full border border-white/5 border-b-emerald-400 border-l-emerald-400/30 animate-spin" 
          style={{ animationDuration: '2.5s', animationDirection: 'reverse' }} 
        />
        
        {/* Central static core */}
        <div className="absolute inset-8 rounded-full border border-[var(--color-lime-sprout)]/20 bg-[var(--color-lime-sprout)]/5 flex items-center justify-center backdrop-blur-sm shadow-[inset_0_0_15px_rgba(228,253,151,0.1)]">
           <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_rgba(228,253,151,1)] animate-ping" />
           <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(228,253,151,1)]" />
        </div>
      </div>

      {/* STAGE & STATUS TYPOGRAPHY */}
      <div className="space-y-2 max-w-sm">
        <div className="text-xs font-mono font-semibold text-[var(--color-lime-sprout)] uppercase tracking-[0.25em]">
          {title}
        </div>

        <div className="text-sm font-medium text-white transition-all duration-300 min-h-[1.5rem]">
          {stages[currentStageIdx] || 'Processing...'}
        </div>

        {subtext && (
          <p className="text-xs text-gray-500 font-mono">
            {subtext}
          </p>
        )}
      </div>

      {/* STAGE PROGRESS DOTS */}
      <div className="flex items-center gap-1.5 pt-1">
        {stages.map((stg, idx) => (
          <div
            key={stg}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentStageIdx 
                ? 'w-6 bg-gradient-to-r from-[var(--color-lime-sprout)] to-[var(--color-lime-sprout)]' 
                : idx < currentStageIdx 
                ? 'w-1.5 bg-[var(--color-lime-sprout)]/50' 
                : 'w-1.5 bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
