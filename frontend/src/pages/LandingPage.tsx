import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  ShieldCheck,
  BarChart2,
  Wand2,
  Lock,
  Search,
  History,
  FileText,
  BookOpen,
  GraduationCap,
  Briefcase,
  ChevronDown
} from 'lucide-react';

// Lazy loading heavy 3D components for performance
const LazyFlowingBackground = React.lazy(() => 

  import('../components/FlowingBackground').then(module => ({ default: module.FlowingBackground }))
);

const SAMPLE_TEXT = "Quantum computing relies on qubits, which can exist in multiple states simultaneously due to superposition. Unlike classical bits that are strictly 0 or 1, qubits enable quantum computers to process vast amounts of data in parallel, solving complex cryptography problems exponentially faster.";
const PARAPHRASED_TEXT = "Quantum computing uses qubits to exist in several states at the same time because of superposition. In contrast to traditional bits that are only 0 or 1, qubits allow quantum machines to handle huge datasets at once, making it possible to solve difficult encryption challenges much more rapidly.";

const LiveDemo = () => {
  const [state, setState] = React.useState<'typing' | 'analyzing' | 'ai_results' | 'paraphrasing' | 'recheck_analyzing' | 'human_results'>('typing');
  const [typedText, setTypedText] = React.useState('');

  React.useEffect(() => {
    let isCancelled = false;

    const runSequence = async () => {
      while (!isCancelled) {
        setState('typing');
        setTypedText('');
        const typeSpeed = 1200 / SAMPLE_TEXT.length;
        for (let i = 0; i <= SAMPLE_TEXT.length; i++) {
          if (isCancelled) return;
          await new Promise(r => setTimeout(r, typeSpeed));
          setTypedText(SAMPLE_TEXT.substring(0, i));
        }
        await new Promise(r => setTimeout(r, 800));

        if (isCancelled) return;
        setState('analyzing');
        await new Promise(r => setTimeout(r, 2000));

        if (isCancelled) return;
        setState('ai_results');
        await new Promise(r => setTimeout(r, 4000));

        if (isCancelled) return;
        setState('paraphrasing');
        setTypedText('');
        const paraphraseTypeSpeed = 1500 / PARAPHRASED_TEXT.length;
        for (let i = 0; i <= PARAPHRASED_TEXT.length; i++) {
          if (isCancelled) return;
          await new Promise(r => setTimeout(r, paraphraseTypeSpeed));
          setTypedText(PARAPHRASED_TEXT.substring(0, i));
        }
        await new Promise(r => setTimeout(r, 2800)); // Hold completed text

        if (isCancelled) return;
        setState('recheck_analyzing');
        await new Promise(r => setTimeout(r, 2000));

        if (isCancelled) return;
        setState('human_results');
        await new Promise(r => setTimeout(r, 5000));
      }
    };

    runSequence();
    return () => { isCancelled = true; };
  }, []);

  const getStatusBadge = () => {
    switch (state) {
      case 'typing': return <span className="text-gray-400">1. User Pastes Text</span>;
      case 'analyzing': return <span className="text-[var(--color-lime-sprout)] opacity-70">2. Detecting...</span>;
      case 'ai_results': return <span className="text-[var(--color-lime-sprout)] brightness-75">3. AI Detected!</span>;
      case 'paraphrasing': return <span className="text-[var(--color-lime-sprout)] opacity-80">4. Paraphrasing...</span>;
      case 'recheck_analyzing': return <span className="text-[var(--color-lime-sprout)] opacity-70">5. Re-checking...</span>;
      case 'human_results': return <span className="text-[var(--color-lime-sprout)]">6. Human-like!</span>;
    }
  };

  const getActiveTab = () => {
    if (['typing', 'analyzing', 'ai_results'].includes(state)) return 'detect';
    if (['paraphrasing'].includes(state)) return 'paraphrase';
    return 'compare';
  };

  const activeTab = getActiveTab();

  const isResults = state === 'ai_results' || state === 'human_results';
  const isHuman = state === 'human_results';
  const currentText = state === 'recheck_analyzing' ? PARAPHRASED_TEXT : typedText;

  return (
    <div className="flex flex-col flex-1 relative z-10 w-full">
      
      {/* Header: Tabs & Status Badge (Inline to prevent overlap) */}
      <div className="flex flex-row items-center justify-between gap-2 mb-6 w-full">
        <div className="flex items-center gap-1 bg-[var(--bg-dark)]/40 p-1 rounded-2xl w-fit border border-white/5 shrink-0 overflow-x-auto no-scrollbar">
          <button className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${activeTab === 'detect' ? 'bg-[var(--color-lime-sprout)] text-gray-950 shadow-[0_0_15px_rgba(228,253,151,0.3)] border border-[var(--color-lime-sprout)]/20' : 'text-gray-400 hover:text-[var(--color-lime-sprout)]'}`}>
            <Search className="w-3 h-3 sm:w-4 sm:h-4" /> Detect
          </button>
          <button className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${activeTab === 'paraphrase' ? 'bg-[var(--color-lime-sprout)] text-gray-950 shadow-[0_0_15px_rgba(228,253,151,0.3)] border border-[var(--color-lime-sprout)]/20' : 'text-gray-400 hover:text-[var(--color-lime-sprout)]'}`}>
            <Wand2 className="w-3 h-3 sm:w-4 sm:h-4" /> Paraphrase
          </button>
          <button className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${activeTab === 'compare' ? 'bg-[var(--color-lime-sprout)] text-gray-950 shadow-[0_0_15px_rgba(228,253,151,0.3)] border border-[var(--color-lime-sprout)]/20' : 'text-gray-400 hover:text-[var(--color-lime-sprout)]'}`}>
            <BarChart2 className="w-3 h-3 sm:w-4 sm:h-4" /> Compare
          </button>
        </div>

        <div className="bg-[var(--bg-dark)] border border-[var(--color-lime-sprout)]/20 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest uppercase shadow-lg shrink-0 whitespace-nowrap">
           {getStatusBadge()}
        </div>
      </div>

      {isResults ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col sm:flex-row gap-6 relative z-10 min-h-[280px]">
          {/* Left: Highlighted Text */}
          <div className="flex-1 bg-[var(--bg-dark)]/60 rounded-2xl border border-[var(--color-lime-sprout)]/10 p-6 text-sm leading-relaxed text-gray-400 overflow-y-auto relative">
            <div className="text-[10px] uppercase tracking-widest text-[var(--color-lime-sprout)] mb-4 font-bold">
              {isHuman ? 'Paraphrased Version' : 'Original Text'}
            </div>
            {!isHuman ? (
              <>
                <span className="text-gray-300">Quantum computing relies on qubits, which can exist in multiple states simultaneously due to superposition. </span>
                <span className="bg-[var(--color-lime-sprout)]/20 text-[var(--color-lime-sprout)] rounded px-1 transition-colors">Unlike classical bits that are strictly 0 or 1, qubits enable quantum computers to process vast amounts of data in parallel,</span>
                <span className="text-gray-300"> solving complex cryptography problems exponentially faster.</span>
              </>
            ) : (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-200 block">
                {PARAPHRASED_TEXT}
              </motion.span>
            )}
          </div>

          {/* Right: Score */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="w-full sm:w-[200px] flex flex-col justify-center items-center bg-[var(--bg-dark)]/80 border border-[var(--color-lime-sprout)]/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(228,253,151,0.1)]"
          >
            <div className="absolute inset-0 opacity-10 bg-gradient-to-t from-[var(--color-lime-sprout)] to-transparent" />
            <h4 className="text-[11px] font-bold text-[var(--color-lime-sprout)] mb-6 uppercase tracking-widest text-center relative z-10">Detection Score</h4>
            
            <div className={`w-28 h-28 rounded-full border-[8px] border-[var(--bg-card)] flex items-center justify-center mb-6 relative transition-colors duration-1000 z-10 ${!isHuman ? 'border-t-[var(--color-lime-sprout)]/50 border-r-[var(--color-lime-sprout)]/50 shadow-[0_0_40px_rgba(228,253,151,0.2)]' : 'border-t-[var(--color-lime-sprout)] border-l-[var(--color-lime-sprout)] shadow-[0_0_40px_rgba(228,253,151,0.4)]'}`}>
               <span className="text-3xl font-display text-white">{!isHuman ? '98%' : '12%'}</span>
            </div>
            
            <p className="text-sm font-bold tracking-wide relative z-10 text-[var(--color-lime-sprout)]">
              {!isHuman ? 'Highly AI Generated' : 'Human Written'}
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 relative z-10 min-h-[280px]">
          <div className="flex-1 bg-[var(--bg-dark)]/60 rounded-2xl border border-[var(--color-lime-sprout)]/10 p-6 mb-4 shadow-inner transition-colors relative overflow-hidden flex flex-col">
            
            {(state === 'analyzing' || state === 'recheck_analyzing') && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[var(--bg-card)]/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
                 <div className="w-10 h-10 border-[3px] border-[var(--color-lime-sprout)]/20 rounded-full animate-spin mb-6 border-t-[var(--color-lime-sprout)] shadow-[0_0_20px_rgba(228,253,151,0.5)]" />
                 <p className="text-base font-bold tracking-wide animate-pulse text-[var(--color-lime-sprout)]">
                   {state === 'analyzing' && "Analyzing semantic signals..."}
                   {state === 'recheck_analyzing' && "Re-verifying AI detection score..."}
                 </p>
               </motion.div>
            )}

            {state === 'paraphrasing' && (
               <div className="flex flex-col mb-4 border-b border-white/10 pb-3">
                 <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">PARAPHRASING</span>
                 <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-[var(--color-lime-sprout)] animate-pulse" />
                   <span className="text-xs font-bold tracking-wide text-[var(--color-lime-sprout)] uppercase">Restructuring text...</span>
                 </div>
               </div>
            )}

            <div className="w-full h-full bg-transparent text-gray-200 text-base leading-relaxed break-words pt-2 flex-1">
              {currentText}
              {(state === 'typing' || state === 'paraphrasing') && <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--color-lime-sprout)] animate-pulse" />}
            </div>
          </div>

          <div className="flex items-center justify-between px-2 h-12">
            <span className="text-sm text-gray-500 font-medium">{currentText.length}/5000 characters</span>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed hidden sm:block">
                Clear
              </button>
              
              <div className="relative w-[140px] h-[40px] flex justify-end items-center">
                {state === 'typing' && (
                  <div className="absolute right-0 px-6 py-2.5 rounded-full text-gray-950 text-sm font-bold bg-[var(--color-lime-sprout)] shadow-[0_0_20px_rgba(228,253,151,0.3)] flex items-center gap-2">
                    Analyze <ArrowRight className="w-4 h-4" />
                  </div>
                )}
                {state === 'analyzing' && (
                  <div className="absolute right-0 px-6 py-2.5 rounded-full text-gray-950 text-sm font-bold bg-[var(--color-lime-sprout)] shadow-[0_0_20px_rgba(228,253,151,0.5)] flex items-center gap-2">
                    Analyze <ArrowRight className="w-4 h-4" />
                  </div>
                )}
                {state === 'paraphrasing' && (
                  <div className="absolute right-0 px-6 py-2.5 rounded-full text-gray-950 text-sm font-bold bg-[var(--color-lime-sprout)] shadow-[0_0_20px_rgba(228,253,151,0.5)] flex items-center gap-2">
                    <Wand2 className="w-4 h-4" /> Paraphrase
                  </div>
                )}
                {state === 'recheck_analyzing' && (
                  <div className="absolute right-0 px-6 py-2.5 rounded-full text-gray-950 text-sm font-bold bg-[var(--color-lime-sprout)] shadow-[0_0_20px_rgba(228,253,151,0.5)] flex items-center gap-2">
                    Re-check <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const handleCTA = (route: string) => {
    onNavigate(user ? route : '/login');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)] font-sans overflow-x-hidden selection:bg-[var(--color-lime-sprout)]/30">

      {/* Minimalist Background restricted to Hero Section */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] z-0 pointer-events-none bg-[#0a150c] overflow-hidden">
        
        {/* Massive Green Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(228,253,151,0.15)_0%,rgba(10,21,12,1)_80%)]"></div>
        
        {/* Floating Text Files Background with Light Splashes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Ambient Light Splashes */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-lime-sprout)]/10 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-emerald-600/10 rounded-full blur-[150px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Document 1 */}
          <motion.div
            className="absolute top-[20%] left-[5%] w-32 h-40 bg-[var(--bg-card)] border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2 opacity-40 rotate-[-12deg]"
            animate={{ y: [0, -30, 0], rotate: [-12, -8, -12] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-full h-2 bg-white/20 rounded-full" />
            <div className="w-3/4 h-2 bg-white/20 rounded-full" />
            <div className="w-5/6 h-2 bg-white/10 rounded-full mt-2" />
            <div className="w-full h-2 bg-white/10 rounded-full" />
            <div className="w-1/2 h-2 bg-white/10 rounded-full" />
            <div className="mt-auto w-8 h-8 rounded bg-[var(--color-lime-sprout)]/20 border border-[var(--color-lime-sprout)]/40 self-end flex items-center justify-center">
              <div className="w-2 h-2 bg-[var(--color-lime-sprout)] rounded-full" />
            </div>
          </motion.div>

          {/* Document 2 */}
          <motion.div
            className="absolute top-[40%] right-[8%] w-40 h-48 bg-[var(--bg-card)] border border-emerald-500/20 rounded-xl p-4 shadow-2xl flex flex-col gap-2 opacity-30 rotate-[8deg]"
            animate={{ y: [0, 40, 0], rotate: [8, 14, 8] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex items-center gap-2 mb-2">
               <div className="w-4 h-4 rounded-full bg-emerald-500/50" />
               <div className="w-16 h-2 bg-white/20 rounded-full" />
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full" />
            <div className="w-full h-2 bg-white/10 rounded-full" />
            <div className="w-3/4 h-2 bg-white/10 rounded-full" />
            <div className="w-5/6 h-2 bg-white/10 rounded-full" />
            <div className="w-1/2 h-2 bg-[var(--color-lime-sprout)]/40 rounded-full mt-2" />
          </motion.div>
          
          {/* Document 3 */}
          <motion.div
            className="absolute bottom-[15%] left-[25%] w-36 h-32 bg-[var(--bg-card)] border border-white/5 rounded-xl p-3 shadow-2xl flex flex-col gap-2 opacity-20 rotate-[-5deg]"
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-full h-2 bg-[var(--color-lime-sprout)]/30 rounded-full" />
            <div className="w-4/5 h-2 bg-[var(--color-lime-sprout)]/30 rounded-full" />
            <div className="w-full h-2 bg-white/10 rounded-full mt-4" />
            <div className="w-full h-2 bg-white/10 rounded-full" />
          </motion.div>
        </div>
        
        {/* Premium subtle noise for texture */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] mix-blend-overlay pointer-events-none" />
        
        {/* Soft bottom horizon fade to blend into the rest of the dark page */}
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-[#0a150c] to-transparent pointer-events-none" />
      </div>

      <main id="home" className="relative z-10 pt-32 lg:pt-40 pb-24 max-w-7xl mx-auto px-6 lg:px-8">

        {/* HERO SECTION */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 mb-24 min-h-[80vh] -mt-12">

          {/* Left Column (Hero Text) */}
          <div className="w-full lg:w-[50%] flex flex-col items-start z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--color-lime-sprout)]/40 text-[var(--color-lime-sprout)] text-[11px] font-bold tracking-[0.2em] uppercase mb-8 shadow-[0_0_15px_rgba(228,253,151,0.15)]"
            >
              <ShieldCheck className="w-4 h-4" /> GUARANTEED ROBUSTNESS
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[3rem] sm:text-[4rem] lg:text-[4.8rem] font-display uppercase tracking-widest leading-[1.1] mb-6 flex flex-col"
            >
              <span>SEE BEYOND</span>
              <span className="text-[var(--color-lime-sprout)] font-display drop-shadow-[0_0_20px_rgba(228,253,151,0.4)]">THE WORDS.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-300 text-lg sm:text-xl max-w-lg leading-relaxed mb-10 font-light"
            >
              VERITY helps you detect AI-generated text, understand its origin, and paraphrase it — with advanced semantic and stylometric analysis.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-5 mb-10"
            >
              <button
                onClick={() => handleCTA('/analyze')}
                className="px-8 py-3.5 bg-[var(--color-lime-sprout)] text-gray-950 font-bold tracking-wide rounded-full hover:brightness-110 transition-all shadow-[0_0_20px_rgba(228,253,151,0.3)] flex items-center gap-2 group"
              >
                Try It Now
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onNavigate('/docs')}
                className="px-8 py-3.5 bg-[var(--bg-card)]/50 border border-[var(--color-lime-sprout)]/20 hover:border-[var(--color-lime-sprout)]/50 text-white font-medium rounded-full transition-all flex items-center gap-3 group"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--color-lime-sprout)] flex items-center justify-center transition-transform group-hover:scale-110">
                  <BookOpen className="w-3 h-3 text-gray-950" />
                </div>
                Documentation
              </button>
            </motion.div>
          </div>

          {/* Right Column (Live Demo in Hero) */}
          <div className="w-full lg:w-[50%] relative z-30">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full bg-[var(--bg-card)]/80 backdrop-blur-2xl border border-[var(--color-lime-sprout)]/10 rounded-[2rem] p-5 sm:p-7 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden min-h-[420px]"
            >
              {/* DEMO STATES */}
              <LiveDemo />
            </motion.div>
          </div>
        </div>

        {/* TRUSTED BY / SOCIAL PROOF */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="border-t border-b border-white/5 py-12 mb-24 mt-12 overflow-hidden flex flex-col items-center"
        >
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-8 font-bold">Empowering Authenticity Across</p>
          <div className="flex gap-12 sm:gap-24 opacity-40 grayscale flex-wrap justify-center">
            {['Education', 'Journalism', 'Enterprise', 'Content Creators'].map((label, i) => (
              <span key={i} className="text-lg sm:text-2xl font-display uppercase tracking-widest text-white whitespace-nowrap">{label}</span>
            ))}
          </div>
        </motion.div>


        {/* SECONDARY SECTION (Floating Cards + Try Verity) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center lg:items-stretch p-8 sm:p-12 lg:p-16 mt-12 sm:mt-20 mb-32 relative bg-[var(--bg-card)]/60 backdrop-blur-2xl border border-[var(--color-lime-sprout)]/10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
        >
          {/* Subtle background glow for separation */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[var(--color-lime-sprout)]/20 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[200px] bg-[var(--color-lime-sprout)]/5 blur-[100px] rounded-full pointer-events-none" />

          {/* Left Side (Floating Cards Graphic) */}
          <div className="w-full lg:w-[55%] relative h-[500px] flex items-center justify-center perspective-[1000px]">
            {/* Handwriting Text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 0.6, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute top-10 left-10 z-30 transform rotate-[-5deg]"
            >

            </motion.div>

            {/* AI Generated Card */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotateY: -15, rotateZ: -8 }}
              whileInView={{
                opacity: 1,
                x: -70,
                y: [0, -15, 0],
              }}
              viewport={{ once: true }}
              transition={{
                opacity: { duration: 0.8 },
                x: { duration: 0.8 },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute z-20 bg-[#0B0C15]/80 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl w-[260px] sm:w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:rounded-3xl"
              style={{ rotateY: '-15deg', rotateZ: '-8deg' }}
            >
              <h3 className="text-gray-200 font-medium mb-8 text-lg relative z-10">AI Generated</h3>
              <div className="flex justify-center mb-8 relative z-10">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-[8px] border-[var(--bg-dark)] border-t-[var(--color-lime-sprout)] border-r-[var(--color-lime-sprout)] flex items-center justify-center shadow-[0_0_40px_rgba(228,253,151,0.3)]">
                  <span className="text-4xl sm:text-5xl font-display text-white">87<span className="text-2xl">%</span></span>
                </div>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-gray-300 relative z-10">
                <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[var(--color-lime-sprout)] shadow-[0_0_10px_rgba(228,253,151,0.8)]" /> High perplexity</li>
                <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[var(--color-lime-sprout)] shadow-[0_0_10px_rgba(228,253,151,0.8)]" /> Repetitive patterns</li>
                <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[var(--color-lime-sprout)] shadow-[0_0_10px_rgba(228,253,151,0.8)]" /> Low human variation</li>
              </ul>
            </motion.div>

            {/* Human Written Card */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: 15, rotateZ: 8 }}
              whileInView={{
                opacity: 0.95,
                x: 80,
                y: [40, 55, 40],
              }}
              viewport={{ once: true }}
              transition={{
                opacity: { duration: 0.8, delay: 0.2 },
                x: { duration: 0.8, delay: 0.2 },
                y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }
              }}
              className="absolute z-10 bg-[#0B0C15]/70 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-[260px] sm:w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-95 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:rounded-3xl"
              style={{ rotateY: '15deg', rotateZ: '8deg' }}
            >
              <h3 className="text-gray-300 font-medium mb-8 text-right text-lg relative z-10">Human Written</h3>
              <div className="flex justify-center mb-8 relative z-10">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-[8px] border-[var(--bg-dark)] border-t-[var(--color-lime-sprout)] flex items-center justify-center shadow-[0_0_40px_rgba(228,253,151,0.2)]">
                  <span className="text-4xl sm:text-5xl font-display text-white">12<span className="text-2xl">%</span></span>
                </div>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-gray-400 relative z-10">
                <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[var(--color-lime-sprout)] shadow-[0_0_10px_rgba(228,253,151,0.8)]" /> Natural flow</li>
                <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[var(--color-lime-sprout)] shadow-[0_0_10px_rgba(228,253,151,0.8)]" /> Diverse vocabulary</li>
                <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[var(--color-lime-sprout)] shadow-[0_0_10px_rgba(228,253,151,0.8)]" /> Human style patterns</li>
              </ul>
            </motion.div>
          </div>

          {/* Right Side Info ("Try VERITY") */}
          <div className="w-full lg:w-[45%] flex flex-col justify-center">
            <div className="mb-10">
              <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-widest mb-4">Try <span className="text-[var(--color-lime-sprout)] drop-shadow-[0_0_10px_rgba(228,253,151,0.3)]">VERITY</span></h2>
              <p className="text-base text-gray-200 leading-relaxed max-w-sm">
                Watch how our advanced AI detection models instantly analyze text for authenticity.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-6">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[var(--color-lime-sprout)]/10 border border-[var(--color-lime-sprout)]/30 flex items-center justify-center shadow-[0_0_15px_rgba(228,253,151,0.15)] group-hover:border-[var(--color-lime-sprout)] transition-colors">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-lime-sprout)]" />
                </div>
                <span className="text-sm text-white font-semibold tracking-wide">High Accuracy</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[var(--color-lime-sprout)]/10 border border-[var(--color-lime-sprout)]/30 flex items-center justify-center shadow-[0_0_15px_rgba(228,253,151,0.15)] group-hover:border-[var(--color-lime-sprout)] transition-colors">
                  <BarChart2 className="w-4 h-4 text-[var(--color-lime-sprout)]" />
                </div>
                <span className="text-sm text-white font-semibold tracking-wide">Detailed Analysis</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[var(--color-lime-sprout)]/10 border border-[var(--color-lime-sprout)]/30 flex items-center justify-center shadow-[0_0_15px_rgba(228,253,151,0.15)] group-hover:border-[var(--color-lime-sprout)] transition-colors">
                  <Wand2 className="w-4 h-4 text-[var(--color-lime-sprout)]" />
                </div>
                <span className="text-sm text-white font-semibold tracking-wide">Paraphrase with AI</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[var(--color-lime-sprout)]/10 border border-[var(--color-lime-sprout)]/30 flex items-center justify-center shadow-[0_0_15px_rgba(228,253,151,0.15)] group-hover:border-[var(--color-lime-sprout)] transition-colors">
                  <Lock className="w-4 h-4 text-[var(--color-lime-sprout)]" />
                </div>
                <span className="text-sm text-white font-semibold tracking-wide">Privacy First</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FEATURES GRID */}
        <div id="why-verity" className="flex flex-col lg:flex-row gap-12 items-end mb-32 pt-20">
          <div className="w-full lg:w-1/3">
            <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">POWERFUL FEATURES</div>
            <h2 className="text-4xl font-display tracking-widest uppercase mb-4">More Than Just <span className="text-[var(--color-lime-sprout)]">Detection.</span></h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              VERITY combines state-of-the-art AI models with advanced linguistic analysis to give you complete text authenticity insights.
            </p>
          </div>

          <div className="w-full lg:w-2/3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FileText, title: 'AI Detection', desc: 'Detect AI-generated content with high accuracy.' },
              { icon: Wand2, title: 'Text Paraphrasing', desc: 'Rewrite text into natural, human-like content.' },
              { icon: BarChart2, title: 'Detailed Analysis', desc: 'Get insights, confidence scores, and patterns.' },
              { icon: History, title: 'History & Save', desc: 'Access your past analyses anytime.' }
            ].map((f, i) => (
              <div key={i} className="bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--color-lime-sprout)]/10 rounded-2xl p-5 hover:border-[var(--color-lime-sprout)]/40 transition-colors shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-lime-sprout)]/10 flex items-center justify-center mb-4 border border-[var(--color-lime-sprout)]/20">
                  <f.icon className="w-5 h-5 text-[var(--color-lime-sprout)]" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div id="how-it-works" className="flex flex-col lg:flex-row gap-12 mb-32 pt-20">
          <div className="w-full lg:w-1/3">
            <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">HOW IT WORKS</div>
            <h2 className="text-4xl font-display uppercase tracking-widest mb-4">Simple. Fast. Reliable.</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              From detection to paraphrasing, VERITY makes text analysis effortless.
            </p>
            <button className="px-6 py-3 bg-[var(--color-lime-sprout)] text-gray-950 font-bold text-sm rounded-full flex items-center gap-2 hover:bg-[#d4f26b] transition-colors shadow-[0_0_20px_rgba(228,253,151,0.3)]">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full lg:w-2/3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { step: '01', title: 'Paste Text', desc: 'Add your text or document.', icon: FileText },
                { step: '02', title: 'Analyze', desc: 'Our AI models detect patterns.', icon: Search },
                { step: '03', title: 'Get Results', desc: 'View detailed analysis.', icon: FileText },
                { step: '04', title: 'Paraphrase', desc: 'Convert text with one click.', icon: Wand2 },
              ].map((s, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center bg-[var(--bg-card)] border border-white/5 rounded-2xl p-6 hover:border-[var(--color-lime-sprout)]/30 transition-colors">
                  <span className="text-[10px] font-mono text-[var(--color-lime-sprout)] mb-4 bg-[var(--color-lime-sprout)]/10 px-2 py-1 rounded">STEP {s.step}</span>
                  <div className="w-12 h-12 rounded-full border border-[var(--color-lime-sprout)]/20 bg-[#161a14] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(228,253,151,0.1)]">
                    <s.icon className="w-5 h-5 text-[var(--color-lime-sprout)]" />
                  </div>
                  <h4 className="text-sm font-medium mb-2">{s.title}</h4>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>



        {/* USE CASES */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">Built For Everyone</div>
            <h2 className="text-4xl font-display uppercase tracking-widest mb-4">Who uses <span className="text-[var(--color-lime-sprout)]">VERITY?</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, title: 'Educators & Students', desc: 'Maintain academic integrity by ensuring original thesis submissions and detecting AI-assisted assignments.' },
              { icon: Briefcase, title: 'Publishers & Editors', desc: 'Screen thousands of submissions to guarantee 100% human-crafted journalism and literature.' },
              { icon: ShieldCheck, title: 'Enterprise Compliance', desc: 'Audit internal communications and public-facing reports to ensure authentic human authorship.' }
            ].map((uc, i) => (
              <div key={i} className="bg-[var(--bg-card)]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-[var(--color-lime-sprout)]/30 transition-all">
                <uc.icon className="w-8 h-8 text-[var(--color-lime-sprout)] mb-6" />
                <h3 className="text-xl font-semibold text-white mb-3">{uc.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ SECTION */}
        <motion.div 
          id="faq"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-32 max-w-4xl mx-auto pt-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display uppercase tracking-widest mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'How does the Stylometric Fusion work?', a: 'We measure the underlying human rhythm (sentence variance, lexical diversity) and fuse it with deep semantic transformer features to create a robust classification boundary.' },
              { q: 'Can it detect heavily paraphrased AI text?', a: 'Yes. While standard detectors suffer a 50% drop in accuracy on paraphrased text, VERITY retains high robustness because structural burstiness is hard for AI to mimic.' },
              { q: 'Is my data stored or used for training?', a: 'No. VERITY is a privacy-first platform. Your analysis is performed securely and we do not use your inputs to train future models.' }
            ].map((faq, i) => (
              <div 
                key={i} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="bg-[var(--bg-card)]/30 border border-white/5 rounded-2xl p-6 group hover:border-[var(--color-lime-sprout)]/20 transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-semibold text-white">{faq.q}</h4>
                  <ChevronDown className={`w-5 h-5 text-gray-500 group-hover:text-[var(--color-lime-sprout)] transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </div>
                <div className={`transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-gray-400 leading-relaxed pr-8">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* BOTTOM CTA */}
        <div className="text-center py-20 px-8 sm:px-12 bg-[var(--bg-card)]/40 backdrop-blur-3xl border border-[var(--color-lime-sprout)]/10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] mb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(228,253,151,0.03),transparent_50%)]" />
          <div className="relative z-10">
            <div className="text-[10px] font-bold tracking-widest text-[var(--color-lime-sprout)]/70 uppercase mb-6">BE A STEP AHEAD</div>
            <h2 className="text-[3rem] sm:text-[4rem] font-display uppercase tracking-widest mb-6">
              Truth in <span className="text-[var(--color-lime-sprout)] drop-shadow-[0_0_20px_rgba(228,253,151,0.3)]">Every Word.</span>
            </h2>
            <p className="text-gray-300 mb-10 max-w-md mx-auto text-lg">
              Join thousands who trust VERITY for authentic, original content analysis.
            </p>
            <button className="px-8 py-4 bg-[var(--color-lime-sprout)] text-gray-950 font-bold rounded-full hover:bg-[#d4f26b] transition-all shadow-[0_0_30px_rgba(228,253,151,0.3)] hover:shadow-[0_0_40px_rgba(228,253,151,0.5)] inline-flex items-center gap-2">
              Start Analyzing Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-[var(--bg-dark)]/80 backdrop-blur-3xl py-8 px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <p className="text-xs text-white">&copy; {new Date().getFullYear()} VERITY AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
