import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRightIcon as ArrowRight,
  MagnifyingGlassIcon as Search,
  DocumentTextIcon as FileText,
  SparklesIcon as Wand2,
  ArrowsRightLeftIcon as GitCompare
} from '@heroicons/react/24/solid';
import { VerityLogo } from '../components/VerityLogo';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const handleCTA = (route: string) => {
    onNavigate(user ? route : '/login');
  };

  return (
    <div className="min-h-screen bg-[#060C10] text-[#FFFFFF] font-sans selection:bg-[#00C9D8]/30">
      
      <main id="home" className="relative z-10 pt-20 sm:pt-24 lg:pt-24 pb-16 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-6 lg:px-8">

        {/* 1. HERO SECTION */}
        <section className="flex flex-col items-center justify-center text-center max-w-5xl xl:max-w-6xl mx-auto pt-[28px] lg:pt-[36px] pb-16 lg:pb-24 min-h-[calc(100vh-140px)] relative z-20">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[38px] sm:text-[50px] md:text-[62px] lg:text-[76px] xl:text-[88px] 2xl:text-[96px] font-redaction tracking-tight text-[#FFFFFF] leading-[1.14] mb-5 max-w-5xl"
          >
            <span className="block">Verify Truth in Every Word.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] via-[#A5F3FC] to-[#00D5E5]">
              Precision AI Detection.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#8DA2AA] text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mb-8 font-normal"
          >
            An advanced text intelligence platform designed to detect AI-generated content, analyze document structure, and preserve writing authenticity with forensic precision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <button
              onClick={() => handleCTA('/analyze')}
              className="px-8 py-3.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:from-[#00E5F5] hover:to-[#00A3BA] text-[#051115] font-bold text-sm sm:text-base tracking-wide rounded-xl transition-all flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00C9D8]/20"
            >
              <span>Analyze a Document</span>
              <ArrowRight className="w-4 h-4 fill-current" />
            </button>
          </motion.div>

        </section>

        {/* 2. CORE CAPABILITIES (Clean 4-Card Grid) */}
        <section id="why-verity" className="mb-28 pt-16 sm:pt-20 lg:pt-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#FFFFFF] mb-3">
              Engineered for Complete Authenticity
            </h2>
            <p className="text-sm sm:text-base text-[#8DA2AA] leading-relaxed">
              Powerful tools built to detect machine-generated writing, inspect document signals, and protect authentic authorship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1: AI Content Detection */}
            <div className="bg-[#0D151D] border border-[#1C2633] rounded-2xl p-6 flex flex-col justify-between hover:border-[#00C9D8]/40 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#FFFFFF] mb-2">Deep AI Detection</h3>
                <p className="text-xs sm:text-sm text-[#8DA2AA] leading-relaxed">
                  Accurately identifies text from ChatGPT, Claude, Gemini, and modern language models with paragraph and sentence-level certainty.
                </p>
              </div>
            </div>

            {/* Feature 2: Document Ingestion */}
            <div className="bg-[#0D151D] border border-[#1C2633] rounded-2xl p-6 flex flex-col justify-between hover:border-[#00C9D8]/40 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#FFFFFF] mb-2">Full Document Parsing</h3>
                <p className="text-xs sm:text-sm text-[#8DA2AA] leading-relaxed">
                  Upload DOCX, PDF, or TXT files up to 100,000 characters with automated chunking, bounded overlap, and complete reports.
                </p>
              </div>
            </div>

            {/* Feature 3: Tone & Paraphrasing */}
            <div className="bg-[#0D151D] border border-[#1C2633] rounded-2xl p-6 flex flex-col justify-between hover:border-[#00C9D8]/40 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center mb-4">
                  <Wand2 className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#FFFFFF] mb-2">Adaptive Paraphrasing</h3>
                <p className="text-xs sm:text-sm text-[#8DA2AA] leading-relaxed">
                  Refactor prose into Natural, Professional, Academic, or Casual registers while strictly preserving dates, numbers, and facts.
                </p>
              </div>
            </div>

            {/* Feature 4: Side-by-Side Comparison */}
            <div className="bg-[#0D151D] border border-[#1C2633] rounded-2xl p-6 flex flex-col justify-between hover:border-[#00C9D8]/40 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center mb-4">
                  <GitCompare className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#FFFFFF] mb-2">Comparative Analysis</h3>
                <p className="text-xs sm:text-sm text-[#8DA2AA] leading-relaxed">
                  Inspect before-and-after text differentials side by side to measure reduction in AI signal and verify editorial progress.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS (Clean 3-Step Process) */}
        <section id="how-it-works" className="mb-28 pt-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#FFFFFF] mb-3">
              How VERITY Works
            </h2>
            <p className="text-sm sm:text-base text-[#8DA2AA] leading-relaxed">
              Three straightforward steps from raw text to complete forensic verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0D151D] border border-[#1C2633] rounded-2xl p-6 relative">
              <span className="text-xs font-mono font-bold text-[#00D5E5] block mb-3">01</span>
              <h3 className="text-lg font-serif font-bold text-white mb-2">Submit Your Text</h3>
              <p className="text-xs sm:text-sm text-[#8DA2AA] leading-relaxed">
                Paste any text snippet or upload complete DOCX, PDF, or TXT documents directly into the analyzer workspace.
              </p>
            </div>

            <div className="bg-[#0D151D] border border-[#1C2633] rounded-2xl p-6 relative">
              <span className="text-xs font-mono font-bold text-[#00D5E5] block mb-3">02</span>
              <h3 className="text-lg font-serif font-bold text-white mb-2">Deep Inference</h3>
              <p className="text-xs sm:text-sm text-[#8DA2AA] leading-relaxed">
                VERITY evaluates semantic predictability, syntactic burstiness, and sentence cadences in real time.
              </p>
            </div>

            <div className="bg-[#0D151D] border border-[#1C2633] rounded-2xl p-6 relative">
              <span className="text-xs font-mono font-bold text-[#00D5E5] block mb-3">03</span>
              <h3 className="text-lg font-serif font-bold text-white mb-2">Review & Act</h3>
              <p className="text-xs sm:text-sm text-[#8DA2AA] leading-relaxed">
                Inspect sentence-level probability highlights, export audit records, or adapt tone with writing intelligence.
              </p>
            </div>
          </div>
        </section>

        {/* 4. BOTTOM CLOSING CTA */}
        <section className="text-center py-16 px-8 sm:px-12 bg-[#0D151D] border border-[#1C2633] rounded-2xl mb-16 relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#FFFFFF] mb-4">
              Truth in <span className="text-[#00D5E5]">Every Word.</span>
            </h2>
            <p className="text-[#8DA2AA] mb-8 text-sm sm:text-base leading-relaxed">
              Join researchers, publishers, and educators who verify text authenticity with VERITY.
            </p>
            <div className="flex justify-center">
              <button 
                onClick={() => handleCTA('/analyze')}
                className="px-8 py-3.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:from-[#00E5F5] hover:to-[#00A3BA] text-[#051115] font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer text-sm sm:text-base shadow-lg shadow-[#00C9D8]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Start Analyzing Now</span>
                <ArrowRight className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#1C2633] bg-[#070D12] py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#8DA2AA] font-mono">
          <div className="flex items-center gap-2">
            <VerityLogo className="h-5 w-auto" />
            <span className="font-serif font-bold text-white tracking-wider text-sm">VERITY AI</span>
            <span className="text-white/20">|</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => handleCTA('/analyze')} className="hover:text-[#00D5E5] transition-colors cursor-pointer">
              Analyzer
            </button>
            <button onClick={() => handleCTA('/paraphrase')} className="hover:text-[#00D5E5] transition-colors cursor-pointer">
              Paraphrase
            </button>
            <button onClick={() => handleCTA('/compare')} className="hover:text-[#00D5E5] transition-colors cursor-pointer">
              Compare
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
