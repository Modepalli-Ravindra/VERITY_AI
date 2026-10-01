import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const DemoVideoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleScale = spring({ frame, fps, config: { damping: 12 } });

  const probOpacity = interpolate(frame, [45, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const aiProgress = interpolate(frame, [60, 100], [0, 87], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const humanizeOpacity = interpolate(frame, [105, 125], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div className="w-full h-full bg-[#050507] text-white flex flex-col items-center justify-center p-12 relative overflow-hidden font-sans select-none">
      
      {/* Background glow animation */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[100px]"
        style={{ transform: `scale(${1 + Math.sin(frame / 20) * 0.1})` }}
      />

      {/* Phase 1: Intro Title */}
      {frame < 50 && (
        <div 
          className="text-center space-y-4"
          style={{ opacity: titleOpacity, transform: `scale(${titleScale})` }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-lime-sprout)]/20 border border-[var(--color-lime-sprout)]/40 text-purple-300 text-sm font-semibold">
            VERITY Product Tour
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-[var(--color-lime-sprout)]">
            See Beyond the Words.
          </h1>
          <p className="text-xl text-gray-400">VERITY Detection Engine & Feature Fusion</p>
        </div>
      )}

      {/* Phase 2: AI Detection Score Visualization */}
      {frame >= 45 && frame < 110 && (
        <div 
          className="w-full max-w-xl p-8 rounded-3xl bg-white/5 border border-[var(--color-lime-sprout)]/30 backdrop-blur-xl shadow-2xl space-y-6"
          style={{ opacity: probOpacity }}
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-widest">Real-Time Detection</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-lime-sprout)]/30 text-purple-200 border border-[var(--color-lime-sprout)]/50">
              Likely AI Generated
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-purple-300">AI Probability</span>
                <span className="text-white text-xl">{Math.round(aiProgress)}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-[var(--color-lime-sprout)] rounded-full" style={{ width: `${aiProgress}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-emerald-400">Human Probability</span>
                <span className="text-white text-xl">{100 - Math.round(aiProgress)}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-lime-sprout)] rounded-full" style={{ width: `${100 - aiProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3: Text Paraphrasing Complete */}
      {frame >= 105 && (
        <div 
          className="w-full max-w-2xl p-8 rounded-3xl bg-purple-900/20 border border-[var(--color-lime-sprout)]/40 backdrop-blur-xl shadow-2xl text-center space-y-4"
          style={{ opacity: humanizeOpacity }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-lime-sprout)]/20 text-[var(--color-lime-sprout)] flex items-center justify-center mx-auto border border-[var(--color-lime-sprout)]/40">
            ✓
          </div>
          <h2 className="text-3xl font-bold text-white">Natural Paraphrasing Complete</h2>
          <p className="text-gray-300 text-sm max-w-md mx-auto leading-relaxed">
            Paraphrased via LLM provider abstraction while preserving original facts, citations, and terminology.
          </p>
        </div>
      )}

    </div>
  );
};
