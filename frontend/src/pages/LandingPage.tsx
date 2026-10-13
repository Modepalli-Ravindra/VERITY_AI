import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRightIcon as ArrowRight,
  ChartBarIcon as BarChart2,
  SparklesIcon as Wand2,
  MagnifyingGlassIcon as Search,
  DocumentTextIcon as FileText,
  ChevronDownIcon as ChevronDown,
  CpuChipIcon as Cpu,
  QrCodeIcon as QrCode,
  PlayIcon as Play,
  CheckCircleIcon as CheckCircle
} from '@heroicons/react/24/outline';
import { VerityLogo } from '../components/VerityLogo';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

type PreviewTab = 'analyze' | 'paraphrase' | 'compare';

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('analyze');
  const [previewTone, setPreviewTone] = useState<string>('natural');

  const handleCTA = (route: string) => {
    onNavigate(user ? route : '/login');
  };

  const goToDemo = () => {
    onNavigate('/demo');
  };

  return (
    <div className="min-h-screen bg-[#061619] text-[#F4F7F8] font-sans overflow-x-hidden selection:bg-[#148BA6]/30">

      {/* Atmospheric Ambient Teal & Charcoal Background Mesh */}
      <div className="absolute top-0 left-0 right-0 h-[105vh] z-0 pointer-events-none overflow-hidden">
        {/* Radial ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(20,139,166,0.18)_0%,rgba(6,22,25,0.98)_75%)]" />
        
        {/* Animated ambient light streaks */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/6 left-1/4 w-[36rem] h-[36rem] bg-[#00D4E5]/10 rounded-full blur-[140px]"
            animate={{ 
              scale: [1, 1.2, 1], 
              opacity: [0.25, 0.5, 0.25],
              x: [0, 30, 0],
              y: [0, -25, 0]
            }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[38rem] h-[38rem] bg-[#148BA6]/16 rounded-full blur-[160px]"
            animate={{ 
              scale: [1.15, 1, 1.15], 
              opacity: [0.2, 0.45, 0.2],
              x: [0, -30, 0],
              y: [0, 25, 0]
            }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Fine technical noise texture */}
        <div className="absolute inset-0 opacity-[0.025] bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] mix-blend-overlay" />
        
        {/* Smooth gradient transition to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#061619] to-transparent" />
      </div>

      <main id="home" className="relative z-10 pt-32 lg:pt-36 pb-24 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-6 lg:px-8">

        {/* =========================================================================
            3. HERO SECTION (2-Column Desktop Layout + Halo + Two-line Headline)
           ========================================================================= */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10 xl:gap-12 mb-24 min-h-[78vh]">

          {/* Left Column (Eyebrow with illuminated cylindrical halo, Headline, Copy, Actions) */}
          <div className="w-full lg:w-[42%] xl:w-[40%] flex flex-col items-start z-20 shrink-0">
            
            {/* Eyebrow with Cylindrical Illuminated Halo */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mb-6"
            >
              {/* Layered cylindrical/elliptical halo glow behind eyebrow */}
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[#148BA6]/30 via-[#00D4E5]/40 to-[#148BA6]/30 blur-md opacity-75 animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-[#00D4E5]/50 shadow-[0_0_15px_rgba(0,212,229,0.3)]" />

              {/* Eyebrow Label Pill */}
              <div className="relative px-4 py-1.5 rounded-full bg-[#0A2024]/90 backdrop-blur-md border border-[#148BA6]/50 flex items-center gap-2 text-[11px] sm:text-xs font-mono tracking-[0.22em] text-[#00D4E5] uppercase font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4E5] shadow-[0_0_8px_#00D4E5]" />
                <span>AI DETECTION</span>
                <span className="text-[#148BA6] font-normal">/</span>
                <span>DOCUMENT INTELLIGENCE</span>
              </div>
            </motion.div>

            {/* Headline — Exactly Two Lines on Desktop */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-[2.5rem] xl:text-[2.85rem] 2xl:text-[3.2rem] font-bold tracking-tight text-[#F4F7F8] leading-[1.16] mb-6"
            >
              <span className="block whitespace-normal lg:whitespace-nowrap">Detect AI. Verify Truth.</span>
              <span className="block whitespace-normal lg:whitespace-nowrap text-[#00D4E5] drop-shadow-[0_0_25px_rgba(0,212,229,0.3)]">
                Power Your Work.
              </span>
            </motion.h1>

            {/* Supporting Copy — Exactly ~Two lines on Desktop */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#9CB0B7] text-base sm:text-lg max-w-xl leading-relaxed mb-8 font-normal"
            >
              Detect AI-generated content, inspect document-level signals, and evaluate text transformations with VERITY’s intelligent analysis tools.
            </motion.p>

            {/* Hero Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 mb-8"
            >
              <button
                onClick={() => onNavigate('/docs')}
                className="px-7 py-3.5 bg-[#148BA6] hover:bg-[#00D4E5] text-[#061619] hover:text-[#061619] font-bold text-sm tracking-wide rounded-full transition-all shadow-[0_0_25px_rgba(20,139,166,0.4)] hover:shadow-[0_0_30px_rgba(0,212,229,0.5)] flex items-center gap-2 cursor-pointer"
              >
                <span>Analyze a Document</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={goToDemo}
                className="px-6 py-3.5 bg-[#0A2024]/90 hover:bg-[#0A2024] border border-[#148BA6]/40 hover:border-[#00D4E5] text-[#F4F7F8] font-medium text-sm rounded-full transition-all flex items-center gap-2.5 cursor-pointer shadow-[0_0_15px_rgba(20,139,166,0.15)]"
              >
                <div className="w-6 h-6 rounded-full bg-[#148BA6]/20 border border-[#00D4E5]/40 flex items-center justify-center text-[#00D4E5]">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
                <span>Explore the Demo</span>
              </button>
            </motion.div>

            {/* Metric pill notes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-6 text-xs text-[#9CB0B7] font-mono"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#00D4E5]" />
                <span>ModernBERT V5 (0.70 Calibrated)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#00D4E5]" />
                <span>100% Fact Preservation</span>
              </div>
            </motion.div>

          </div>

          {/* =========================================================================
              4. RIGHT COLUMN — REFINED PRODUCT PREVIEW (Analyze / Paraphrase / Compare) - ZOOMED & WIDER
             ========================================================================= */}
          <div className="w-full lg:w-[58%] xl:w-[60%] relative z-30">
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-[#0A2024]/90 backdrop-blur-2xl border border-[rgba(20,139,166,0.4)] rounded-3xl p-6 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.75)] flex flex-col relative overflow-hidden transition-all w-full"
            >
              {/* Window Header with App Tabs */}
              <div className="flex items-center justify-between pb-4 mb-4 sm:mb-5 border-b border-[#148BA6]/25 shrink-0">
                <div className="flex items-center gap-2.5">
                  <VerityLogo className="h-6 w-auto" />
                  <span className="text-sm font-mono font-bold tracking-widest text-[#F4F7F8]">VERITY</span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#148BA6]/20 text-[#00D4E5] border border-[#00D4E5]/30 font-semibold">
                    Interactive Preview
                  </span>
                </div>

                {/* Switchable Preview Modes: Analyze, Paraphrase, Compare */}
                <div className="flex items-center gap-1.5 bg-[#061619] p-1.5 rounded-xl border border-[#148BA6]/30 text-xs font-mono">
                  <button
                    onClick={() => setPreviewTab('analyze')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                      previewTab === 'analyze' 
                        ? 'bg-[#148BA6] text-[#061619] font-bold shadow-[0_0_12px_rgba(0,212,229,0.35)]' 
                        : 'text-[#9CB0B7] hover:text-white'
                    }`}
                  >
                    Analyze
                  </button>
                  <button
                    onClick={() => setPreviewTab('paraphrase')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                      previewTab === 'paraphrase' 
                        ? 'bg-[#148BA6] text-[#061619] font-bold shadow-[0_0_12px_rgba(0,212,229,0.35)]' 
                        : 'text-[#9CB0B7] hover:text-white'
                    }`}
                  >
                    Paraphrase
                  </button>
                  <button
                    onClick={() => setPreviewTab('compare')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                      previewTab === 'compare' 
                        ? 'bg-[#148BA6] text-[#061619] font-bold shadow-[0_0_12px_rgba(0,212,229,0.35)]' 
                        : 'text-[#9CB0B7] hover:text-white'
                    }`}
                  >
                    Compare
                  </button>
                </div>
              </div>

              {/* Dynamic Tab Body */}
              {previewTab === 'analyze' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
                  {/* Left inner column: Document Analysis Input */}
                  <div className="md:col-span-6 bg-[#030B0D]/85 border border-[#148BA6]/25 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-mono font-bold uppercase text-white">Document Input</span>
                        <span className="text-xs font-mono text-[#00D4E5] font-semibold">145 words</span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#F4F7F8] leading-relaxed font-sans bg-[#061619]/70 p-3.5 sm:p-4 rounded-xl border border-white/5">
                        Artificial intelligence is transforming how research is conducted. While generative tools provide unprecedented drafting velocity, maintaining transparent attribution and scholarly authenticity remains essential for critical peer review.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#148BA6]/20">
                      <span className="text-xs text-[#9CB0B7] font-mono">Format: DOCX / Text</span>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#00D4E5] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#00D4E5] animate-ping" />
                        <span>Analysis Ready</span>
                      </div>
                    </div>
                  </div>

                  {/* Right inner column: Analysis Result */}
                  <div className="md:col-span-6 bg-[#030B0D]/85 border border-[#148BA6]/25 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-mono font-bold uppercase text-white">Analysis Result</span>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#148BA6]/25 text-[#00D4E5] border border-[#00D4E5]/30 font-bold">
                          ModernBERT V5
                        </span>
                      </div>

                      {/* Donut and classification */}
                      <div className="flex items-center gap-3.5 p-2.5 rounded-xl bg-[#0A2024] border border-[#148BA6]/25 mb-3.5">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" className="stroke-white/10" strokeWidth="3.5" fill="transparent" />
                            <circle cx="18" cy="18" r="15" stroke="#00D4E5" strokeWidth="3.5" strokeDasharray="94.2" strokeDashoffset="82.9" strokeLinecap="round" fill="transparent" />
                          </svg>
                          <span className="absolute text-xs sm:text-sm font-black text-white">12%</span>
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-bold text-white leading-tight">Likely Human Written</div>
                          <div className="text-xs text-[#9CB0B7] leading-tight mt-1">Low probability of AI generation</div>
                        </div>
                      </div>

                      {/* Probability rows */}
                      <div className="space-y-2 text-xs sm:text-sm font-mono border-b border-[#148BA6]/20 pb-3 mb-3">
                        <div className="flex items-center justify-between text-[#9CB0B7]">
                          <span>AI Probability</span>
                          <span className="font-bold text-[#00D4E5]">12%</span>
                        </div>
                        <div className="flex items-center justify-between text-[#9CB0B7]">
                          <span>Human Probability</span>
                          <span className="font-bold text-[#00C9D8]">88%</span>
                        </div>
                      </div>

                      {/* Segment Analysis breakdown */}
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[#9CB0B7] mb-1.5 font-semibold">Segment Analysis</div>
                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-[#9CB0B7]">1. Intro Clause</span>
                            <div className="flex items-center gap-2 w-28 sm:w-32">
                              <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-[#00D4E5] h-full w-[8%]" />
                              </div>
                              <span className="text-[#9CB0B7] text-[10px] w-7 text-right">8%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#9CB0B7]">2. Core Content</span>
                            <div className="flex items-center gap-2 w-28 sm:w-32">
                              <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-[#00D4E5] h-full w-[14%]" />
                              </div>
                              <span className="text-[#9CB0B7] text-[10px] w-7 text-right">14%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {previewTab === 'paraphrase' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between bg-[#030B0D] p-2.5 rounded-xl border border-[#148BA6]/20">
                    <span className="text-xs font-mono text-[#9CB0B7]">Target Tone Profile:</span>
                    <div className="flex gap-1.5">
                      {['natural', 'professional', 'academic', 'casual'].map(t => (
                        <button
                          key={t}
                          onClick={() => setPreviewTone(t)}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono capitalize transition-all cursor-pointer ${
                            previewTone === t ? 'bg-[#148BA6] text-[#061619] font-bold shadow-sm' : 'text-[#9CB0B7] hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-[13px] font-sans">
                    <div className="p-3.5 rounded-xl bg-[#030B0D] border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs font-mono text-[#9CB0B7]">
                        <span>ORIGINAL TEXT</span>
                        <span className="text-rose-400 font-bold">89% AI Probability</span>
                      </div>
                      <p className="text-[#9CB0B7] leading-relaxed">
                        It is imperative to delve into the testament of modern computational paradigms, as they facilitate substantial operational efficacy...
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0A2024] border border-[#00D4E5]/30 space-y-2">
                      <div className="flex justify-between text-xs font-mono text-[#00D4E5]">
                        <span className="font-bold">PARAPHRASED ({previewTone.toUpperCase()})</span>
                        <span className="text-[#00C9D8] font-bold">14% AI Probability</span>
                      </div>
                      <p className="text-[#F4F7F8] leading-relaxed">
                        Examining modern computing architectures shows clear operational gains without overcomplicating day-to-day workflow processes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-[#9CB0B7] pt-1.5 border-t border-[#148BA6]/15">
                    <span>Anchors Preserved: 100% facts & citations</span>
                    <span className="text-[#00C9D8] font-semibold">Decoupled LLM Architecture</span>
                  </div>
                </div>
              )}

              {previewTab === 'compare' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[#030B0D] border border-[#148BA6]/20">
                      <div className="text-[11px] text-[#9CB0B7] mb-1">Original AI Score</div>
                      <div className="text-lg font-bold text-rose-400">88%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#030B0D] border border-[#148BA6]/20">
                      <div className="text-[11px] text-[#9CB0B7] mb-1">Paraphrased AI Score</div>
                      <div className="text-lg font-bold text-[#00C9D8]">14%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0A2024] border border-[#00D4E5]/40">
                      <div className="text-[11px] text-[#00D4E5] mb-1">Signal Delta (Δ)</div>
                      <div className="text-lg font-bold text-[#00D4E5]">-74%</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#030B0D] border border-[#148BA6]/20 text-xs sm:text-[13px] font-mono space-y-2">
                    <div className="text-xs text-[#9CB0B7] uppercase font-semibold">Syntactic Diversity Metric Shift</div>
                    <div className="flex justify-between">
                      <span className="text-[#9CB0B7]">Burstiness Variance:</span>
                      <span className="text-[#00D4E5] font-bold">Increased (+42%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9CB0B7]">Type-Token Ratio (TTR):</span>
                      <span className="text-[#00C9D8] font-bold">Expanded (+18%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Banner inside Preview */}
              <div className="mt-4 pt-3.5 border-t border-[#148BA6]/25 flex items-center justify-between">
                <span className="text-xs sm:text-sm text-[#9CB0B7] font-medium">Ready to test with your documents?</span>
                <button
                  onClick={() => handleCTA('/analyze')}
                  className="px-5 py-2 rounded-full bg-[#148BA6] hover:bg-[#00D4E5] text-[#061619] hover:text-[#061619] font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(20,139,166,0.35)] cursor-pointer"
                >
                  <span>Launch Analyzer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </div>

        </section>





        {/* =========================================================================
            7. REFINED BENTO GRID & CORE CAPABILITIES
           ========================================================================= */}
        <section id="why-verity" className="mb-32 pt-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00C9D8] text-[10px] font-mono tracking-widest uppercase font-bold mb-3 shadow-[0_0_12px_rgba(0,201,216,0.15)]">
              SYSTEM CAPABILITIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F7F8] mb-3">
              Engineered for Complete Authenticity
            </h2>
            <p className="text-sm text-[#9CB0B7]">
              VERITY bridges deep transformer embeddings with 20-D stylometrics to evaluate text origin beyond surface heuristics.
            </p>
          </div>

          {/* Symmetrical Capabilities Layout: 1st Box Full Width + 3 Equal Boxes Below */}
          <div className="space-y-5">
                {/* Primary Feature: ModernBERT V5 Deep Feature Fusion (Full Width - Compact) */}
            <div className="w-full bg-[#0A2024]/90 backdrop-blur-xl border border-[rgba(0,201,216,0.28)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-[#00D4E5]/50 transition-all">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/40 to-transparent" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C9D8]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#00C9D8]/15 transition-all" />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00C9D8]/15 border border-[#00C9D8]/30 flex items-center justify-center text-[#00C9D8] shadow-sm">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00C9D8]/15 text-[#00C9D8] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#00C9D8]/35 shadow-sm">
                    Primary Engine
                  </span>
                </div>

                <div className="max-w-4xl">
                  <h3 className="text-base sm:text-lg font-bold text-[#F4F7F8] mb-1">ModernBERT V5 + Stylometric Fusion</h3>
                  <p className="text-xs text-[#9CB0B7] leading-relaxed mb-3">
                    Extracts 768-dimensional contextual embeddings across 1024 token sequence windows and fuses them with 20 syntactic diversity features into a calibrated 320-D classification head.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-t border-[rgba(0,201,216,0.18)] pt-2.5 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#061519]/70 border border-white/5">
                    <span className="text-[#9CB0B7] block text-[10px] uppercase">Decision Threshold</span>
                    <span className="text-[#00D4E5] font-bold text-xs">0.70 Calibrated</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#061519]/70 border border-white/5">
                    <span className="text-[#9CB0B7] block text-[10px] uppercase">Sequence Length</span>
                    <span className="text-white font-bold text-xs">1024 Tokens</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#061519]/70 border border-white/5">
                    <span className="text-[#9CB0B7] block text-[10px] uppercase">Explainability</span>
                    <span className="text-white font-bold text-xs">Sentence & Token</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#061519]/70 border border-white/5">
                    <span className="text-[#9CB0B7] block text-[10px] uppercase">Feature Fusion</span>
                    <span className="text-[#00D4E5] font-bold text-xs">20-D Stylometrics</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Below: 3 Equal Boxes in Row (Compact Height & Proper Alignment) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Box 1: Full Document Intelligence */}
              <div className="bg-[#0A2024]/85 backdrop-blur-xl border border-[rgba(0,201,216,0.22)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-[#00D4E5]/50 transition-all h-full">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/25 to-transparent" />
                <div>
                  <div className="w-7 h-7 rounded-md bg-[#00C9D8]/15 border border-[#00C9D8]/30 flex items-center justify-center text-[#00C9D8] mb-2">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F4F7F8] mb-1">Full Document Intelligence</h3>
                  <p className="text-xs text-[#9CB0B7] leading-relaxed mb-2.5">
                    Native DOCX, PDF, and TXT parsing with up to 100,000 characters. Large documents automatically partition into 1,000-token chunks with bounded overlap.
                  </p>
                </div>

                <div className="space-y-1 border-t border-[rgba(0,201,216,0.18)] pt-2 text-[11px] font-mono">
                  <div className="flex justify-between items-center text-[#9CB0B7]">
                    <span>Supported Formats:</span>
                    <span className="text-white font-semibold">DOCX, PDF, TXT</span>
                  </div>
                  <div className="flex justify-between items-center text-[#9CB0B7]">
                    <span>Processing Limit:</span>
                    <span className="text-[#00D4E5] font-bold">100,000 Characters</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Writing Intelligence & Paraphrasing */}
              <div className="bg-[#0A2024]/85 backdrop-blur-xl border border-[rgba(0,201,216,0.22)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-[#00D4E5]/50 transition-all h-full">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/25 to-transparent" />
                <div>
                  <div className="w-7 h-7 rounded-md bg-[#00C9D8]/15 border border-[#00C9D8]/30 flex items-center justify-center text-[#00C9D8] mb-2">
                    <Wand2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F4F7F8] mb-1">Writing Intelligence & Paraphrasing</h3>
                  <p className="text-xs text-[#9CB0B7] leading-relaxed mb-2.5">
                    Calibrated tone transformation across Natural, Professional, Academic, and Casual styles. Strict factual anchors protect citations and terminology without classifier leakage.
                  </p>
                </div>

                <div className="border-t border-[rgba(0,201,216,0.18)] pt-2">
                  <div className="flex flex-wrap gap-1">
                    {['Natural', 'Professional', 'Academic', 'Casual'].map(tone => (
                      <span key={tone} className="px-2 py-0.5 rounded bg-[#061519] border border-[rgba(0,201,216,0.25)] text-[10px] font-mono text-[#00D4E5] font-medium">
                        {tone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 3: Verifiable Provenance & QR Codes */}
              <div className="bg-[#0A2024]/85 backdrop-blur-xl border border-[rgba(0,201,216,0.22)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-[#00D4E5]/50 transition-all h-full">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/25 to-transparent" />
                <div>
                  <div className="w-7 h-7 rounded-md bg-[#00C9D8]/15 border border-[#00C9D8]/30 flex items-center justify-center text-[#00C9D8] mb-2">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F4F7F8] mb-1">Verifiable Provenance & QR Codes</h3>
                  <p className="text-xs text-[#9CB0B7] leading-relaxed mb-2.5">
                    Every evaluated document receives an immutable SHA-256 fingerprint and tamper-evident timestamp accessible via public audit URLs.
                  </p>
                </div>

                <div className="space-y-1 border-t border-[rgba(0,201,216,0.18)] pt-2 text-[11px] font-mono">
                  <div className="flex justify-between items-center text-[#9CB0B7]">
                    <span>Hashing Standard:</span>
                    <span className="text-white font-semibold">SHA-256 Cryptographic</span>
                  </div>
                  <div className="flex justify-between items-center text-[#9CB0B7]">
                    <span>Audit Verification:</span>
                    <span className="text-[#00D4E5] font-bold">Public QR Portal URL</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* =========================================================================
            MODEL TRANSPARENCY SECTION
           ========================================================================= */}
        <section id="architecture" className="mb-32 pt-8">
          <div className="text-center max-w-3xl mx-auto mb-10 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00C9D8] text-[10px] font-mono tracking-widest uppercase font-bold shadow-[0_0_12px_rgba(0,201,216,0.15)]">
              <Cpu className="w-3.5 h-3.5" /> Empirical Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F7F8]">
              Model Transparency & Hot-Standby Rollback
            </h2>
            <p className="text-xs sm:text-sm text-[#9CB0B7] leading-relaxed max-w-2xl mx-auto">
              VERITY enforces transparent classification boundaries. Administrators can inspect runtime telemetry or switch between deep contextual and lightweight transformer models with zero downtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Card 1: ModernBERT V5 */}
            <div className="bg-[#0A2024]/80 backdrop-blur-xl border border-[#00D4E5]/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#148BA6] text-[#061619] font-bold text-[10px] uppercase tracking-wider font-mono">
                    Primary Production Engine
                  </span>
                  <span className="text-xs font-mono text-[#00D4E5]">Active</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">ModernBERT V5 + 20-D Stylometrics</h3>
                <p className="text-xs text-[#9CB0B7] mb-6 leading-relaxed">
                  ModernBERT-base (768-D semantic representations with 1024 token sequence context) fused with 20-dimensional syntactic burstiness vectors into a 320-D classifier head.
                </p>
                <div className="space-y-3 border-t border-[#148BA6]/20 pt-4 text-xs font-mono">
                  <div className="flex justify-between text-[#9CB0B7]">
                    <span>Decision Threshold:</span>
                    <span className="text-[#00D4E5] font-bold">0.70 Calibrated</span>
                  </div>
                  <div className="flex justify-between text-[#9CB0B7]">
                    <span>In-Domain F1 Score:</span>
                    <span className="text-white font-bold">0.998</span>
                  </div>
                  <div className="flex justify-between text-[#9CB0B7]">
                    <span>Sequence Context Window:</span>
                    <span className="text-white">1024 Tokens</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Card 2: DistilRoBERTa V2 */}
            <div className="bg-[#0A2024]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.22)] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#00C9D8]/15 text-[#00C9D8] border border-[#00C9D8]/30 font-bold text-[10px] uppercase tracking-wider font-mono">
                    Hot Standby Rollback
                  </span>
                  <span className="text-xs font-mono text-[#00C9D8]">Validated</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">DistilRoBERTa V2 + 20-D Stylometrics</h3>
                <p className="text-xs text-[#9CB0B7] mb-6 leading-relaxed">
                  Proven 768-D transformer representations paired with 20-D stylometric features. Zero downtime rollback target selectable instantly via the Model Selection API.
                </p>
                <div className="space-y-3 border-t border-[rgba(0,201,216,0.15)] pt-4 text-xs font-mono">
                  <div className="flex justify-between text-[#9CB0B7]">
                    <span>Decision Threshold:</span>
                    <span className="text-[#00C9D8] font-bold">0.50 Balanced</span>
                  </div>
                  <div className="flex justify-between text-[#9CB0B7]">
                    <span>CPU Inference Latency:</span>
                    <span className="text-white font-bold">&lt;500 ms</span>
                  </div>
                  <div className="flex justify-between text-[#9CB0B7]">
                    <span>Rollback Selection:</span>
                    <span className="text-[#00C9D8]">1-Click Endpoint</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* =========================================================================
            HOW IT WORKS (4 STEPS)
           ========================================================================= */}
        {/* =========================================================================
            6. WORKFLOW PIPELINE — EMPIRICAL ANALYSIS IN 4 STEPS
           ========================================================================= */}
        <section id="how-it-works" className="mb-32 pt-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00C9D8] text-[10px] font-mono tracking-widest uppercase font-bold mb-3 shadow-[0_0_12px_rgba(0,201,216,0.15)]">
              WORKFLOW PIPELINE
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F7F8] mb-4">
              Empirical Analysis in 4 Steps
            </h2>
            <p className="text-sm text-[#9CB0B7] leading-relaxed mb-6 max-w-2xl mx-auto">
              From raw character extraction to segment-level probability maps, VERITY ensures full transparency at every stage.
            </p>
            <div className="flex justify-center items-center">
              <button
                onClick={() => handleCTA('/analyze')}
                className="px-8 py-3.5 bg-[#148BA6] hover:bg-[#00D4E5] text-[#061619] font-bold text-sm rounded-full flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(20,139,166,0.35)] hover:shadow-[0_0_30px_rgba(0,212,229,0.5)] cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Input Text or File', desc: 'Paste raw text or upload DOCX, PDF, or TXT documents up to 100,000 characters.', icon: FileText },
              { step: '02', title: 'Stylometric Extraction', desc: 'Extracts 20 linguistic signals including syntactic burstiness, perplexity, and lexical entropy.', icon: Search },
              { step: '03', title: 'Feature Fusion Verdict', desc: 'ModernBERT V5 produces an overall probability donut and segment-by-segment ratings.', icon: BarChart2 },
              { step: '04', title: 'Paraphrase or Compare', desc: 'Optionally adapt tone with preserved facts or run a side-by-side differential comparison.', icon: Wand2 },
            ].map((s, i) => (
              <div key={i} className="bg-[#0A2024]/80 border border-[#148BA6]/25 rounded-2xl p-6 hover:border-[#00D4E5]/40 transition-colors flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#00D4E5] mb-3 bg-[#148BA6]/20 px-2.5 py-1 rounded inline-block font-bold">
                    STEP {s.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl border border-[#00D4E5]/30 bg-[#061619] flex items-center justify-center mb-3 text-[#00D4E5]">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1.5">{s.title}</h4>
                  <p className="text-xs text-[#9CB0B7] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* =========================================================================
            FAQ SECTION
           ========================================================================= */}
        <section id="faq" className="mb-32 max-w-4xl mx-auto pt-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00C9D8] text-[10px] font-mono tracking-widest uppercase font-bold mb-3 shadow-[0_0_12px_rgba(0,201,216,0.15)]">
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F7F8]">
              Common Questions & Answers
            </h2>
          </div>

          <div className="space-y-3.5">
            {[
              { 
                q: 'How does ModernBERT V5 improve AI detection?', 
                a: 'ModernBERT V5 features a 1024-token sequence context with native flash attention, allowing it to process full-length paragraphs without loss of context. It is fused with a 20-dimensional stylometrics layer that flags syntactic repetition and low human variance.' 
              },
              { 
                q: 'How does the 20-Dimensional Stylometric Fusion work?', 
                a: 'We evaluate 20 linguistic signals—including syntactic burstiness variance, Simpson diversity index, punctuation entropy, sentence length standard deviation, and Type-Token Ratio—and fuse them with deep semantic embeddings to evaluate text flow holistically.' 
              },
              { 
                q: 'Can it detect paraphrased or humanized AI text?', 
                a: 'Yes. While basic classifiers suffer steep accuracy degradation against reworded text, VERITY inspects structural cadences, syntactic predictability, and sentence length variance that automated rewriters cannot easily disguise.' 
              },
              { 
                q: 'How does Paraphrasing preserve factual integrity?', 
                a: 'Our writing intelligence pipeline isolates proper nouns, dates, statistics, and domain formulas as immutable anchors. Transitional tropes (such as "delve into" or "testament to") are refactored into natural prose without changing factual assertions.' 
              },
              { 
                q: 'What document formats and file sizes are supported?', 
                a: 'VERITY supports DOCX, PDF, and plain TXT files with up to 100,000 characters. Files exceeding 20,000 characters automatically partition into bounded segments with overlap to prevent truncation errors.' 
              },
              { 
                q: 'What is Verification Provenance and the QR verification portal?', 
                a: 'Every evaluated document receives a verifiable SHA-256 cryptographic fingerprint, tamper-evident classification timestamp, and a shareable QR code that allows clients, teachers, or editors to audit authentic results independently.' 
              },
              { 
                q: 'How does VERITY safeguard against false positives on formal writing?', 
                a: 'VERITY employs a calibrated decision threshold of 0.70 for ModernBERT V5 specifically to protect legitimate formal human writing. Scores between 0.50 and 0.70 are categorized as moderate uncertainty rather than outright AI generation.' 
              },
              { 
                q: 'Is my text stored or used to train external AI models?', 
                a: 'No. VERITY processes text strictly in-memory during inference. Uploaded documents and analyzed text are never shared with third-party LLM providers for model training.' 
              }
            ].map((faq, i) => (
              <div 
                key={i} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="bg-[#0A2024]/70 border border-[#148BA6]/30 rounded-2xl p-5 hover:border-[#00D4E5]/40 transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-white">{faq.q}</h4>
                  <ChevronDown className={`w-4 h-4 text-[#00D4E5] transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </div>
                <div className={`transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-60 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs text-[#9CB0B7] leading-relaxed pr-6">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* =========================================================================
            BOTTOM CLOSING CTA
           ========================================================================= */}
        <section className="text-center py-16 px-8 sm:px-12 bg-[#0A2024]/90 backdrop-blur-2xl border border-[#148BA6]/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,229,0.06),transparent_60%)]" />
          <div className="relative z-10 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00C9D8] text-[10px] font-mono tracking-widest uppercase font-bold mb-3 shadow-[0_0_12px_rgba(0,201,216,0.15)]">
              VERITY PRODUCTION SUITE
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F7F8] mb-4">
              Truth in <span className="text-[#00D4E5] drop-shadow-[0_0_20px_rgba(0,212,229,0.4)]">Every Word.</span>
            </h2>
            <p className="text-[#9CB0B7] mb-8 text-sm sm:text-base leading-relaxed">
              Join researchers, publishers, and educators who verify text authenticity with VERITY.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button 
                onClick={() => handleCTA('/analyze')}
                className="px-8 py-3.5 bg-[#148BA6] hover:bg-[#00D4E5] text-[#061619] font-bold rounded-full transition-all shadow-[0_0_25px_rgba(20,139,166,0.4)] hover:shadow-[0_0_35px_rgba(0,212,229,0.5)] inline-flex items-center gap-2 cursor-pointer text-sm"
              >
                <span>Start Analyzing Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onNavigate('/docs')}
                className="px-6 py-3.5 bg-[#061619] hover:bg-[#0A2024] text-[#F4F7F8] border border-[#148BA6]/40 hover:border-[#00D4E5] font-medium rounded-full transition-all text-sm cursor-pointer"
              >
                <span>Read Documentation</span>
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#148BA6]/20 bg-[#061619]/90 backdrop-blur-2xl py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#9CB0B7] font-mono">
          <div className="flex items-center gap-2">
            <VerityLogo className="h-5 w-auto" />
            <span className="font-bold text-white tracking-wider">VERITY AI</span>
            <span className="text-white/20">|</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/docs')} className="hover:text-[#00D4E5] transition-colors">
              Documentation
            </button>
            <button onClick={() => handleCTA('/analyze')} className="hover:text-[#00D4E5] transition-colors">
              Analyzer
            </button>
            <button onClick={() => handleCTA('/paraphrase')} className="hover:text-[#00D4E5] transition-colors">
              Paraphrase
            </button>
            <button onClick={() => onNavigate('/login')} className="hover:text-[#00D4E5] transition-colors">
              Login
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
