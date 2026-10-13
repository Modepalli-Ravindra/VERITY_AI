import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const DemoVideoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Intro (0 - 140 frames ~ 0-4.6s)
  const introOpacity = interpolate(frame, [0, 20, 125, 140], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const introScale = spring({ frame, fps, config: { damping: 14 } });

  // Phase 2: AI Detection & 20-D Stylometrics (130 - 290 frames ~ 4.3-9.6s)
  const detectOpacity = interpolate(frame, [130, 150, 275, 290], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const aiProgress = interpolate(frame, [145, 230], [12, 94], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Phase 3: Paraphrase & Humanization (280 - 440 frames ~ 9.3-14.6s)
  const rewriteOpacity = interpolate(frame, [280, 300, 425, 440], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const humanizeProgress = interpolate(frame, [295, 375], [6, 92], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Phase 4: Cryptographic Verification & CTA (430 - 600 frames ~ 14.3-20.0s)
  const finalOpacity = interpolate(frame, [430, 450, 590, 600], [0, 1, 1, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Global Timeline Progress (0 to 100% across 600 frames)
  const timelineProgress = interpolate(frame, [0, 600], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div className="w-full h-full bg-[#061416] text-[#F3F8F8] flex flex-col items-center justify-center p-8 sm:p-14 relative overflow-hidden font-sans select-none">
      
      {/* Background Animated Ambient Lights */}
      <div 
        className="absolute w-[680px] h-[680px] rounded-full bg-[#00C9D8]/15 blur-[140px] pointer-events-none"
        style={{ transform: `scale(${1 + Math.sin(frame / 35) * 0.12})` }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[#008FA3]/12 blur-[130px] pointer-events-none"
        style={{ transform: `scale(${1.1 - Math.cos(frame / 40) * 0.1})` }}
      />

      {/* Subtle fine technical grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#00C9D8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Floating HUD Indicator */}
      <div className="absolute top-6 left-8 right-8 flex items-center justify-between text-xs font-mono text-[#6F8B91] border-b border-[rgba(0,201,216,0.15)] pb-3 z-30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00C9D8] animate-pulse shadow-[0_0_8px_#00C9D8]" />
          <span className="text-[#00C9D8] font-bold tracking-widest uppercase text-[11px]">VERITY NEURAL RUNTIME</span>
          <span className="text-white/20">|</span>
          <span className="text-[10px] text-[#9BB2B7]">ModernBERT V5 Calibrated</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#00C9D8] bg-[#00C9D8]/10 px-2 py-0.5 rounded border border-[#00C9D8]/20">
            FRAME {Math.min(frame, 600)} / 600 • 20.0s
          </span>
        </div>
      </div>

      {/* =========================================================================
          PHASE 1 (0s - 4.6s): INTRO & SYSTEM OVERVIEW
         ========================================================================= */}
      {frame < 140 && (
        <div 
          className="text-center space-y-6 max-w-3xl z-20"
          style={{ opacity: introOpacity, transform: `scale(${introScale})` }}
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00C9D8] text-xs font-mono font-bold tracking-widest uppercase">
            <span>● Empirical Analysis in 4 Steps</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-[#F3F8F8] leading-tight">
            See Beyond <span className="text-[#00C9D8] drop-shadow-[0_0_25px_rgba(0,201,216,0.4)]">Synthetic Text</span>.
          </h1>

          <p className="text-lg text-[#9BB2B7] max-w-xl mx-auto leading-relaxed">
            Multi-modal stylometrics fusion, paragraph probability maps, and factual integrity preservation at 100% transparency.
          </p>

          <div className="flex items-center justify-center gap-4 text-xs font-mono text-[#00C9D8] pt-2">
            <span className="px-3 py-1 rounded-xl bg-[#0A2023] border border-[#00C9D8]/20">01. Extract Tokens</span>
            <span className="text-white/30">→</span>
            <span className="px-3 py-1 rounded-xl bg-[#0A2023] border border-[#00C9D8]/20">02. 20-D Vectors</span>
            <span className="text-white/30">→</span>
            <span className="px-3 py-1 rounded-xl bg-[#0A2023] border border-[#00C9D8]/20">03. ModernBERT V5</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 2 (4.3s - 9.6s): 20-DIMENSIONAL STYLOMETRICS & DETECTION SCORE
         ========================================================================= */}
      {frame >= 130 && frame < 290 && (
        <div 
          className="w-full max-w-2xl bg-[#0A2023]/90 border border-[rgba(0,201,216,0.3)] rounded-3xl p-7 shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl space-y-6 z-20"
          style={{ opacity: detectOpacity }}
        >
          <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(0,201,216,0.15)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-[#00C9D8] tracking-wider">Step 02: Neural Feature Extraction</span>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              High Synthetic Risk
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline text-sm font-mono font-bold mb-2">
                <span className="text-[#00C9D8] uppercase tracking-wider">Overall AI Probability</span>
                <span className="text-2xl font-bold text-amber-400">{Math.round(aiProgress)}%</span>
              </div>
              <div className="w-full h-3.5 bg-[#061519] border border-[rgba(0,201,216,0.25)] rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-[#00C9D8] rounded-full transition-all"
                  style={{ width: `${aiProgress}%` }}
                />
              </div>
            </div>

            {/* 20-D Stylometric Vector Breakdown */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#061519]/80 border border-[rgba(0,201,216,0.15)]">
                <span className="text-[10px] font-mono text-[#6F8B91] block uppercase">Burstiness Var</span>
                <span className="text-base font-bold font-mono text-amber-300">8.42 (Low)</span>
                <span className="text-[9px] text-[#9BB2B7] block mt-0.5">Machine cadence</span>
              </div>
              <div className="p-3 rounded-xl bg-[#061519]/80 border border-[rgba(0,201,216,0.15)]">
                <span className="text-[10px] font-mono text-[#6F8B91] block uppercase">Simpson Div.</span>
                <span className="text-base font-bold font-mono text-amber-300">0.31</span>
                <span className="text-[9px] text-[#9BB2B7] block mt-0.5">Constrained vocabulary</span>
              </div>
              <div className="p-3 rounded-xl bg-[#061519]/80 border border-[rgba(0,201,216,0.15)]">
                <span className="text-[10px] font-mono text-[#6F8B91] block uppercase">Syntax Entropy</span>
                <span className="text-base font-bold font-mono text-amber-300">1.84</span>
                <span className="text-[9px] text-[#9BB2B7] block mt-0.5">Uniform sentence flow</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#061519]/60 border border-white/5 text-xs text-[#9BB2B7] font-mono leading-relaxed">
              <span className="text-amber-400 font-bold">Segment Map:</span> Paragraphs 1-3 display low syntactic burstiness and high lexical uniformity characteristic of large language model generations.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 3 (9.3s - 14.6s): PARAPHRASE & FACT-PRESERVING HUMANIZATION
         ========================================================================= */}
      {frame >= 280 && frame < 440 && (
        <div 
          className="w-full max-w-2xl bg-[#0A2023]/90 border border-[rgba(0,201,216,0.3)] rounded-3xl p-7 shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl space-y-6 z-20"
          style={{ opacity: rewriteOpacity }}
        >
          <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(0,201,216,0.15)]">
            <span className="text-xs font-mono font-bold uppercase text-[#00C9D8] tracking-wider">Step 04: Tone-Adaptive Paraphrase</span>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Human Cadence Restored
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#061519]/80 border border-[rgba(0,201,216,0.12)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-[#6F8B91] font-bold">Before: Synthetic</span>
                <span className="text-[10px] font-mono text-rose-400 font-bold">94% AI</span>
              </div>
              <p className="text-xs text-[#9BB2B7] leading-relaxed line-through opacity-75">
                "It is important to remember that artificial intelligence serves as a testament to algorithmic progress..."
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#061519]/80 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">After: Paraphrased</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{Math.round(humanizeProgress)}% Human</span>
              </div>
              <p className="text-xs text-[#F3F8F8] leading-relaxed">
                "Modern machine learning marks a distinct shift in analytical speed, changing how researchers evaluate evidence."
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs font-mono font-bold">
              <span className="text-emerald-400 uppercase tracking-wider">Human Credibility Index</span>
              <span className="text-xl font-bold text-emerald-400">{Math.round(humanizeProgress)}%</span>
            </div>
            <div className="w-full h-3 bg-[#061519] border border-[rgba(0,201,216,0.25)] rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-[#00C9D8] to-emerald-400 rounded-full transition-all"
                style={{ width: `${humanizeProgress}%` }}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
            <span>✓ 100% Proper Nouns & Citations Preserved</span>
            <span className="text-[#00C9D8]">No Hallucinations</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 4 (14.3s - 20.0s): VERIFICATION, SECURITY & CALL TO ACTION
         ========================================================================= */}
      {frame >= 430 && (
        <div 
          className="text-center space-y-6 max-w-2xl z-20"
          style={{ opacity: finalOpacity }}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#00C9D8]/15 border border-[#00C9D8]/30 flex items-center justify-center mx-auto text-[#00C9D8] shadow-[0_0_25px_rgba(0,201,216,0.3)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#F3F8F8]">
              Empirical Accuracy. <span className="text-[#00C9D8]">Zero Compromises.</span>
            </h2>
            <p className="text-sm text-[#9BB2B7] max-w-lg mx-auto leading-relaxed">
              Cryptographically verified audit trail, zero public data retention, and calibrated ModernBERT V5 sequence architecture.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto text-xs font-mono text-[#F3F8F8]">
            <div className="p-3 rounded-xl bg-[#0A2023] border border-[rgba(0,201,216,0.2)]">
              <span className="text-[#00C9D8] font-bold block text-sm">1024</span>
              <span className="text-[10px] text-[#6F8B91]">Token Window</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0A2023] border border-[rgba(0,201,216,0.2)]">
              <span className="text-[#00C9D8] font-bold block text-sm">20-D</span>
              <span className="text-[10px] text-[#6F8B91]">Stylometrics</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0A2023] border border-[rgba(0,201,216,0.2)]">
              <span className="text-[#00C9D8] font-bold block text-sm">100%</span>
              <span className="text-[10px] text-[#6F8B91]">Privacy Safe</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Timeline Indicator HUD */}
      <div className="absolute bottom-6 left-8 right-8 z-30">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#6F8B91] mb-1.5">
          <span className={frame < 140 ? 'text-[#00C9D8] font-bold' : ''}>01. Architecture</span>
          <span className={frame >= 130 && frame < 290 ? 'text-[#00C9D8] font-bold' : ''}>02. 20-D Detection</span>
          <span className={frame >= 280 && frame < 440 ? 'text-[#00C9D8] font-bold' : ''}>03. Paraphrase</span>
          <span className={frame >= 430 ? 'text-[#00C9D8] font-bold' : ''}>04. Verification</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#00C9D8] to-[#008FA3] transition-all"
            style={{ width: `${timelineProgress}%` }}
          />
        </div>
      </div>

    </div>
  );
};

