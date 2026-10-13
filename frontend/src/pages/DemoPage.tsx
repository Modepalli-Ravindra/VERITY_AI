import React from 'react';
import { Player } from '@remotion/player';
import { DemoVideoComposition } from '../components/RemotionDemoVideo';
import { 
  ArrowLeftIcon as ArrowLeft, 
  ArrowRightIcon as ArrowRight,
  PlayIcon as Play,
  SparklesIcon as Sparkles,
  ShieldCheckIcon as ShieldCheck,
  CpuChipIcon as CpuChip
} from '@heroicons/react/24/outline';
import { VerityLogo } from '../components/VerityLogo';

interface DemoPageProps {
  onNavigate: (route: string) => void;
}

export const DemoPage: React.FC<DemoPageProps> = ({ onNavigate }) => {
  const phases = [
    {
      phase: 'Phase 01',
      title: 'Token Preprocessing',
      desc: 'Raw document ingestion, boundary segmentation, and syntactic normalization up to 100k chars.',
      icon: CpuChip,
      time: '0.0s – 4.6s',
      color: 'text-[#00D4E5]'
    },
    {
      phase: 'Phase 02',
      title: '20-D Stylometrics',
      desc: 'Extracts syntactic burstiness, Simpson diversity, and perplexity to uncover synthetic cadence.',
      icon: Sparkles,
      time: '4.6s – 9.6s',
      color: 'text-cyan-400'
    },
    {
      phase: 'Phase 03',
      title: 'Tone Paraphrase',
      desc: 'Refactors robotic formulas into natural cadence while holding facts and proper nouns 100% intact.',
      icon: Play,
      time: '9.6s – 14.6s',
      color: 'text-emerald-400'
    },
    {
      phase: 'Phase 04',
      title: 'Cryptographic Verdict',
      desc: 'ModernBERT V5 calibrated verdict with zero public data retention and immutable SHA-256 logs.',
      icon: ShieldCheck,
      time: '14.6s – 20.0s',
      color: 'text-[#00D4E5]'
    }
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#061416] text-[#F3F8F8] font-sans flex flex-col relative selection:bg-[#00C9D8]/30">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#00C9D8]/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[350px] bg-[#008FA3]/8 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="shrink-0 px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-[rgba(0,201,216,0.18)] bg-[#061519]/90 backdrop-blur-xl relative z-20">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A2023]/80 border border-[rgba(0,201,216,0.25)] hover:border-[#00C9D8]/60 text-xs font-mono text-[#9BB2B7] hover:text-[#00C9D8] transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2.5">
          <VerityLogo className="h-6 sm:h-7 w-auto" />
          <span className="font-display tracking-[0.16em] text-[#F3F8F8] text-base sm:text-lg font-bold">
            VERITY
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00C9D8]/15 text-[#00C9D8] border border-[#00C9D8]/30 uppercase font-semibold">
            Product Tour
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/docs')}
            className="px-3 py-1.5 rounded-xl bg-[#0A2023] border border-[rgba(0,201,216,0.25)] hover:border-[#00C9D8] text-xs font-mono text-[#9BB2B7] hover:text-white transition-colors cursor-pointer hidden sm:inline-flex"
          >
            Documentation
          </button>
          <button
            onClick={() => onNavigate('/analyze')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061416] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,201,216,0.3)] hover:brightness-110 cursor-pointer"
          >
            <span>Try Analyzer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Single-Screen Viewport Content */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4 max-w-[1700px] w-full mx-auto overflow-hidden">
        
        {/* Left: Cinema Video Player Theater */}
        <section className="flex-1 min-h-0 flex flex-col bg-[#0A2023]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.28)] rounded-2xl p-2.5 sm:p-3 shadow-2xl overflow-hidden justify-between">
          
          {/* Theater Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(0,201,216,0.15)] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C9D8] animate-pulse" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Full Architecture In Action
              </h2>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="text-[11px] font-mono text-[#9BB2B7] hidden sm:inline">
                20-Second Dynamic Remotion Engine
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-[#00C9D8]">
              <span className="px-2 py-0.5 rounded bg-[#00C9D8]/10 border border-[#00C9D8]/20">
                1080p • 600 Frames • 30 FPS
              </span>
            </div>
          </div>

          {/* Player Container */}
          <div className="flex-1 min-h-0 w-full relative rounded-xl overflow-hidden bg-black/90 border border-white/10 flex items-center justify-center shadow-inner">
            <Player
              component={DemoVideoComposition}
              durationInFrames={600}
              compositionWidth={1280}
              compositionHeight={720}
              fps={30}
              controls
              autoPlay
              loop
              style={{ width: '100%', height: '100%', maxHeight: '100%' }}
            />
          </div>

          {/* Theater Bottom Stage Indicator */}
          <div className="pt-2.5 mt-2 border-t border-[rgba(0,201,216,0.15)] flex flex-wrap items-center justify-between gap-2 shrink-0 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {['01. Ingestion', '02. 20-D Stylometrics', '03. ModernBERT V5', '04. SHA-256 Provenance'].map((stage, i) => (
                <span 
                  key={i} 
                  className="px-2 py-0.5 rounded-lg bg-[#061519] border border-[rgba(0,201,216,0.2)] text-[#00C9D8] text-[10px] font-semibold whitespace-nowrap"
                >
                  {stage}
                </span>
              ))}
            </div>

            <div className="text-[10px] text-[#9BB2B7] hidden md:block">
              Continuous live playback loop • Interactive timeline controls enabled
            </div>
          </div>

        </section>

        {/* Right: Architectural Telemetry & Phase Cards (Locked to Height, Zero Page Scroll) */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col bg-[#0A2023]/70 backdrop-blur-xl border border-[rgba(0,201,216,0.22)] rounded-2xl p-3 shadow-xl overflow-hidden justify-between">
          
          <div className="shrink-0 mb-2 pb-1.5 border-b border-[rgba(0,201,216,0.15)]">
            <span className="text-[10px] font-mono text-[#00C9D8] uppercase tracking-wider font-bold block">
              Architectural Pipeline
            </span>
            <h3 className="text-sm font-bold text-white">Execution Phases</h3>
          </div>

          {/* Phase Cards */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {phases.map((card, i) => {
              const IconComp = card.icon;
              return (
                <div 
                  key={i}
                  className="p-2.5 rounded-xl bg-[#061519]/70 border border-[rgba(0,201,216,0.18)] hover:border-[#00C9D8]/45 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00C9D8]/10 border border-[#00C9D8]/20 ${card.color}`}>
                      {card.phase}
                    </span>
                    <span className="text-[9px] font-mono text-[#6F8B91]">{card.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <IconComp className={`w-3.5 h-3.5 ${card.color}`} />
                    <h4 className="text-xs font-semibold text-white">{card.title}</h4>
                  </div>
                  <p className="text-[11px] text-[#9BB2B7] leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Bottom Call to Action Card */}
          <div className="shrink-0 mt-2.5 pt-2.5 border-t border-[rgba(0,201,216,0.18)] bg-[#061519]/60 p-2.5 rounded-xl border border-white/5 text-center">
            <h4 className="text-xs font-bold text-white mb-0.5">Ready to Test Your Documents?</h4>
            <p className="text-[10px] text-[#9BB2B7] mb-2 leading-relaxed">
              Verify authenticity with ModernBERT V5 and 20-D stylometrics in real time.
            </p>
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={() => onNavigate('/analyze')}
                className="px-3 py-1.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061416] font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition-all shadow-[0_0_12px_rgba(0,201,216,0.25)] hover:brightness-110 cursor-pointer w-full"
              >
                <span>Launch Analyzer</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </aside>

      </div>

    </div>
  );
};
