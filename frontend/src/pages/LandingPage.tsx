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
} from '@heroicons/react/24/solid';
import { VerityLogo } from '../components/VerityLogo';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCTA = (route: string) => {
    onNavigate(user ? route : '/login');
  };

  const goToDemo = () => {
    onNavigate('/demo');
  };

  return (
    <div className="min-h-screen bg-transparent text-[#FFFFFF] font-sans overflow-x-hidden selection:bg-[#00C9D8]/30">

      {/* Studio Ambient Gradient Lighting Background */}
      <div className="absolute top-0 left-0 right-0 h-[110vh] z-0 pointer-events-none overflow-hidden">
        {/* Soft upper-left studio beam */}
        <div className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-[radial-gradient(circle,rgba(0,201,216,0.12)_0%,rgba(20,139,166,0.06)_40%,transparent_70%)] blur-3xl pointer-events-none" />
        {/* Soft upper-center glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[40vw] bg-[radial-gradient(ellipse_at_top,rgba(0,201,216,0.14)_0%,transparent_70%)] blur-2xl pointer-events-none" />
      </div>

      <main id="home" className="relative z-10 pt-32 lg:pt-36 pb-24 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-6 lg:px-8">

        {/* =========================================================================
            3. HERO SECTION (Full-Width Centered Editorial Layout with Studio Lighting)
           ========================================================================= */}
        <section className="flex flex-col items-center justify-center text-center max-w-5xl xl:max-w-6xl mx-auto pt-6 lg:pt-14 pb-20 min-h-[58vh] relative z-20">

          {/* Headline — Centered, Two Lines with The Jungle Serif Display Font (Decreased 5px) */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[39px] sm:text-[53px] md:text-[67px] lg:text-[83px] xl:text-[95px] 2xl:text-[107px] font-jungle tracking-[0.01em] text-[#FFFFFF] leading-[1.12] mb-8 max-w-5xl"
          >
            <span className="block">Detect AI. Verify Truth.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] via-[#A5F3FC] to-[#00D5E5]">
              Power Your Work.
            </span>
          </motion.h1>

          {/* Supporting Copy — Centered & Zoomed */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#8DA2AA] text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed mb-10 font-normal"
          >
            Detect AI-generated content, inspect document-level signals, and evaluate text transformations with VERITY’s intelligent analysis tools.
          </motion.p>

          {/* Hero Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-10"
          >
            <button
              onClick={() => handleCTA('/analyze')}
              className="px-7 py-3.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:from-[#00E5F5] hover:to-[#00A3BA] text-[#051115] font-bold text-sm sm:text-base tracking-wide rounded-xl transition-all flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00C9D8]/20"
            >
              <span>Analyze a Document</span>
              <ArrowRight className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={goToDemo}
              className="px-6 py-3.5 bg-[#0D151D]/85 backdrop-blur-2xl hover:bg-[#121E2A]/90 border border-white/[0.12] hover:border-[#00C9D8]/40 text-[#FFFFFF] font-medium text-sm sm:text-base rounded-xl transition-all flex items-center gap-2.5 cursor-pointer shadow-sm"
            >
              <div className="w-6 h-6 rounded-lg bg-[#00C9D8] text-[#051115] shadow-sm flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <span>Explore the Demo</span>
            </button>
          </motion.div>

          {/* Metric Badges with Solid Filled Checkmarks */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-[#8DA2AA]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#00D5E5] fill-current" />
              <span>ModernBERT V5 (0.70 Calibrated)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#00D5E5] fill-current" />
              <span>100% Fact Preservation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#00D5E5] fill-current" />
              <span>Enterprise-Grade Privacy</span>
            </div>
          </motion.div>

        </section>

        {/* =========================================================================
            7. REFINED BENTO GRID & CORE CAPABILITIES
           ========================================================================= */}
        <section id="why-verity" className="mb-32 pt-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00D5E5] text-[10px] font-mono tracking-widest uppercase font-bold mb-3">
              SYSTEM CAPABILITIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#FFFFFF] mb-3">
              Engineered for Complete Authenticity
            </h2>
            <p className="text-sm text-[#8DA2AA]">
              VERITY bridges deep transformer embeddings with 20-D stylometrics to evaluate text origin beyond surface heuristics.
            </p>
          </div>

          {/* Symmetrical Capabilities Layout: 1st Box Full Width + 3 Equal Boxes Below */}
          <div className="space-y-5">
            {/* Primary Feature: ModernBERT V5 Deep Feature Fusion (Full Width - Compact) */}
            <div className="w-full bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#00C9D8]/35 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center">
                    <Cpu className="w-5 h-5 fill-current" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00C9D8]/15 text-[#00D5E5] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#00C9D8]/35">
                    Primary Engine
                  </span>
                </div>

                <div className="max-w-4xl">
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#FFFFFF] mb-1">ModernBERT V5 + Stylometric Fusion</h3>
                  <p className="text-xs text-[#8DA2AA] leading-relaxed mb-3 font-sans">
                    Extracts 768-dimensional contextual embeddings across 1024 token sequence windows and fuses them with 20 syntactic diversity features into a calibrated 320-D classification head.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-t border-white/[0.08] pt-2.5 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#070D12]/90 backdrop-blur-md border border-white/5">
                    <span className="text-[#8DA2AA] block text-[10px] uppercase">Decision Threshold</span>
                    <span className="text-[#FFFFFF] font-bold text-xs">0.70 Calibrated</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#070D12]/90 backdrop-blur-md border border-white/5">
                    <span className="text-[#8DA2AA] block text-[10px] uppercase">Sequence Length</span>
                    <span className="text-white font-bold text-xs">1024 Tokens</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#070D12]/90 backdrop-blur-md border border-white/5">
                    <span className="text-[#8DA2AA] block text-[10px] uppercase">Explainability</span>
                    <span className="text-white font-bold text-xs">Sentence & Token</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#070D12]/90 backdrop-blur-md border border-white/5">
                    <span className="text-[#8DA2AA] block text-[10px] uppercase">Feature Fusion</span>
                    <span className="text-[#FFFFFF] font-bold text-xs">20-D Stylometrics</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Below: 3 Equal Boxes in Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Box 1: Full Document Intelligence */}
              <div className="bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#00C9D8]/35 transition-all h-full">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center mb-2">
                    <FileText className="w-4 h-4 fill-current" />
                  </div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-[#FFFFFF] mb-1">Full Document Intelligence</h3>
                  <p className="text-xs text-[#8DA2AA] leading-relaxed mb-2.5 font-sans">
                    Native DOCX, PDF, and TXT parsing with up to 100,000 characters. Large documents automatically partition into 1,000-token chunks with bounded overlap.
                  </p>
                </div>

                <div className="space-y-1 border-t border-white/[0.08] pt-2 text-[11px] font-mono">
                  <div className="flex justify-between items-center text-[#8DA2AA]">
                    <span>Supported Formats:</span>
                    <span className="text-white font-semibold">DOCX, PDF, TXT</span>
                  </div>
                  <div className="flex justify-between items-center text-[#8DA2AA]">
                    <span>Processing Limit:</span>
                    <span className="text-[#00D5E5] font-bold">100,000 Characters</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Writing Intelligence & Paraphrasing */}
              <div className="bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#00C9D8]/35 transition-all h-full">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center mb-2">
                    <Wand2 className="w-4 h-4 fill-current" />
                  </div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-[#FFFFFF] mb-1">Writing Intelligence & Paraphrasing</h3>
                  <p className="text-xs text-[#8DA2AA] leading-relaxed mb-2.5 font-sans">
                    Calibrated tone transformation across Natural, Professional, Academic, and Casual styles. Strict factual anchors protect citations and terminology without classifier leakage.
                  </p>
                </div>

                <div className="border-t border-white/[0.08] pt-2">
                  <div className="flex flex-wrap gap-1">
                    {['Natural', 'Professional', 'Academic', 'Casual'].map(tone => (
                      <span key={tone} className="px-2 py-0.5 rounded bg-[#070D12]/90 backdrop-blur-md border border-white/[0.08] text-[10px] font-mono text-[#E2EEF1] font-medium">
                        {tone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 3: Verifiable Provenance & QR Codes */}
              <div className="bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#00C9D8]/35 transition-all h-full">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center mb-2">
                    <QrCode className="w-4 h-4 fill-current" />
                  </div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-[#FFFFFF] mb-1">Verifiable Provenance & QR Codes</h3>
                  <p className="text-xs text-[#8DA2AA] leading-relaxed mb-2.5 font-sans">
                    Every evaluated document receives an immutable SHA-256 fingerprint and tamper-evident timestamp accessible via public audit URLs.
                  </p>
                </div>

                <div className="space-y-1 border-t border-white/[0.08] pt-2 text-[11px] font-mono">
                  <div className="flex justify-between items-center text-[#8DA2AA]">
                    <span>Hashing Standard:</span>
                    <span className="text-white font-semibold">SHA-256 Cryptographic</span>
                  </div>
                  <div className="flex justify-between items-center text-[#8DA2AA]">
                    <span>Audit Verification:</span>
                    <span className="text-[#00D5E5] font-bold">Public QR Portal URL</span>
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00D5E5] text-[10px] font-mono tracking-widest uppercase font-bold">
              <Cpu className="w-3.5 h-3.5 fill-current" /> Empirical Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#FFFFFF]">
              Model Transparency & Hot-Standby Rollback
            </h2>
            <p className="text-xs sm:text-sm text-[#8DA2AA] leading-relaxed max-w-2xl mx-auto">
              VERITY enforces transparent classification boundaries. Administrators can inspect runtime telemetry or switch between deep contextual and lightweight transformer models with zero downtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Card 1: ModernBERT V5 */}
            <div className="bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-[#00C9D8]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-xl bg-[#00C9D8] text-[#051115] font-bold text-[10px] uppercase tracking-wider font-mono">
                    Primary Production Engine
                  </span>
                  <span className="text-xs font-mono text-[#00D5E5] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00D5E5] animate-ping" />
                    Active
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">ModernBERT V5 + 20-D Stylometrics</h3>
                <p className="text-xs text-[#8DA2AA] mb-6 leading-relaxed font-sans">
                  ModernBERT-base (768-D semantic representations with 1024 token sequence context) fused with 20-dimensional syntactic burstiness vectors into a 320-D classifier head.
                </p>
                <div className="space-y-3 border-t border-white/[0.08] pt-4 text-xs font-mono">
                  <div className="flex justify-between text-[#8DA2AA]">
                    <span>Decision Threshold:</span>
                    <span className="text-[#00D5E5] font-bold">0.70 Calibrated</span>
                  </div>
                  <div className="flex justify-between text-[#8DA2AA]">
                    <span>In-Domain F1 Score:</span>
                    <span className="text-white font-bold">0.998</span>
                  </div>
                  <div className="flex justify-between text-[#8DA2AA]">
                    <span>Sequence Context Window:</span>
                    <span className="text-white">1024 Tokens</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Card 2: DistilRoBERTa V2 */}
            <div className="bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-[#00C9D8]/30 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#00C9D8]/15 text-[#00D5E5] border border-[#00C9D8]/30 font-bold text-[10px] uppercase tracking-wider font-mono">
                    Hot Standby Rollback
                  </span>
                  <span className="text-xs font-mono text-[#8DA2AA]">Validated</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">DistilRoBERTa V2 + 20-D Stylometrics</h3>
                <p className="text-xs text-[#8DA2AA] mb-6 leading-relaxed font-sans">
                  Proven 768-D transformer representations paired with 20-D stylometric features. Zero downtime rollback target selectable instantly via the Model Selection API.
                </p>
                <div className="space-y-3 border-t border-[#1C2633] pt-4 text-xs font-mono">
                  <div className="flex justify-between text-[#8DA2AA]">
                    <span>Decision Threshold:</span>
                    <span className="text-[#FFFFFF] font-bold">0.50 Balanced</span>
                  </div>
                  <div className="flex justify-between text-[#8DA2AA]">
                    <span>CPU Inference Latency:</span>
                    <span className="text-white font-bold">&lt;500 ms</span>
                  </div>
                  <div className="flex justify-between text-[#8DA2AA]">
                    <span>Rollback Selection:</span>
                    <span className="text-[#00D5E5]">1-Click Endpoint</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* =========================================================================
            6. WORKFLOW PIPELINE — EMPIRICAL ANALYSIS IN 4 STEPS
           ========================================================================= */}
        <section id="how-it-works" className="mb-32 pt-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00D5E5] text-[10px] font-mono tracking-widest uppercase font-bold mb-3">
              WORKFLOW PIPELINE
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#FFFFFF] mb-4">
              Empirical Analysis in 4 Steps
            </h2>
            <p className="text-sm text-[#8DA2AA] leading-relaxed mb-6 max-w-2xl mx-auto">
              From raw character extraction to segment-level probability maps, VERITY ensures full transparency at every stage.
            </p>
            <div className="flex justify-center items-center">
              <button
                onClick={() => handleCTA('/analyze')}
                className="px-8 py-3.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:from-[#00E5F5] hover:to-[#00A3BA] text-[#051115] font-bold text-sm rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#00C9D8]/20"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 fill-current" />
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
              <div key={i} className="bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 hover:border-[#00C9D8]/35 transition-colors flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#00D5E5] mb-3 bg-[#00C9D8]/10 border border-[#00C9D8]/20 px-2.5 py-1 rounded inline-block font-bold">
                    STEP {s.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center mb-3">
                    <s.icon className="w-5 h-5 fill-current" />
                  </div>
                  <h4 className="text-base font-serif font-bold text-white mb-1.5">{s.title}</h4>
                  <p className="text-xs text-[#8DA2AA] leading-relaxed font-sans">{s.desc}</p>
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00D5E5] text-[10px] font-mono tracking-widest uppercase font-bold mb-3">
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#FFFFFF]">
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
                className="bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 hover:border-[#00C9D8]/35 transition-all cursor-pointer overflow-hidden shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-white font-sans">{faq.q}</h4>
                  <ChevronDown className={`w-4 h-4 text-[#00D5E5] fill-current transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </div>
                <div className={`transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-60 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs text-[#8DA2AA] leading-relaxed pr-6 font-sans">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* =========================================================================
            BOTTOM CLOSING CTA
           ========================================================================= */}
        <section className="text-center py-16 px-8 sm:px-12 bg-[#0D151D]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl mb-16 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,201,216,0.1),transparent_70%)]" />
          <div className="relative z-10 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/30 text-[#00D5E5] text-[10px] font-mono tracking-widest uppercase font-bold mb-3">
              VERITY PRODUCTION SUITE
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-[#FFFFFF] mb-4">
              Truth in <span className="text-[#00D5E5]">Every Word.</span>
            </h2>
            <p className="text-[#8DA2AA] mb-8 text-sm sm:text-base leading-relaxed">
              Join researchers, publishers, and educators who verify text authenticity with VERITY.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button 
                onClick={() => handleCTA('/analyze')}
                className="px-8 py-3.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:from-[#00E5F5] hover:to-[#00A3BA] text-[#051115] font-bold rounded-full transition-all inline-flex items-center gap-2 cursor-pointer text-sm shadow-lg shadow-[#00C9D8]/25"
              >
                <span>Start Analyzing Now</span>
                <ArrowRight className="w-4 h-4 fill-current" />
              </button>
              <button 
                onClick={() => onNavigate('/docs')}
                className="px-6 py-3.5 bg-[#070D12]/90 hover:bg-[#101923] backdrop-blur-2xl text-[#FFFFFF] border border-[#1C2633] hover:border-[#00C9D8]/40 font-medium rounded-full transition-all text-sm cursor-pointer"
              >
                <span>Read Documentation</span>
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#1C2633] bg-[#070D12]/95 backdrop-blur-xl py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#8DA2AA] font-mono">
          <div className="flex items-center gap-2">
            <VerityLogo className="h-5 w-auto" />
            <span className="font-serif font-bold text-white tracking-wider text-sm">VERITY AI</span>
            <span className="text-white/20">|</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/docs')} className="hover:text-[#00D5E5] transition-colors cursor-pointer">
              Documentation
            </button>
            <button onClick={() => handleCTA('/analyze')} className="hover:text-[#00D5E5] transition-colors cursor-pointer">
              Analyzer
            </button>
            <button onClick={() => handleCTA('/paraphrase')} className="hover:text-[#00D5E5] transition-colors cursor-pointer">
              Paraphrase
            </button>
            <button onClick={() => onNavigate('/login')} className="hover:text-[#00D5E5] transition-colors cursor-pointer">
              Login
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
