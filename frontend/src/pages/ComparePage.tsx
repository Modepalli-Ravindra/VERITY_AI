import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingDown, RotateCcw } from 'lucide-react';
import { ThinkingOrbs } from '../components/ThinkingOrbs';

interface ComparePageProps {
  onNavigate?: (route: string, state?: any) => void;
  initialOriginal?: string;
  initialHumanized?: string;
  initialOrigResult?: any;
  initialHumResult?: any;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  initialOriginal = '',
  initialHumanized = '',
  initialOrigResult = null,
  initialHumResult = null
}) => {
  const [originalText, setOriginalText] = useState(() => initialOriginal || localStorage.getItem('verity_compare_orig') || '');
  const [humanizedText, setHumanizedText] = useState(() => initialHumanized || localStorage.getItem('verity_compare_hum') || '');
  const [origResult, setOrigResult] = useState<any | null>(() => {
    const saved = localStorage.getItem('verity_compare_ores');
    return saved ? JSON.parse(saved) : null;
  });
  const [humResult, setHumResult] = useState<any | null>(() => {
    const saved = localStorage.getItem('verity_compare_hres');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [copiedOrig, setCopiedOrig] = useState(false);
  const [copiedHum, setCopiedHum] = useState(false);

  useEffect(() => { localStorage.setItem('verity_compare_orig', originalText); }, [originalText]);
  useEffect(() => { localStorage.setItem('verity_compare_hum', humanizedText); }, [humanizedText]);
  useEffect(() => { if (origResult) localStorage.setItem('verity_compare_ores', JSON.stringify(origResult)); else localStorage.removeItem('verity_compare_ores'); }, [origResult]);
  useEffect(() => { if (humResult) localStorage.setItem('verity_compare_hres', JSON.stringify(humResult)); else localStorage.removeItem('verity_compare_hres'); }, [humResult]);

  const compareStages = [
    'Parsing original semantic representation',
    'Parsing adversarial semantic representation',
    'Extracting stylometric variances',
    'Calculating output degradation',
    'Finalizing robustness check'
  ];

  useEffect(() => {
    if (initialOrigResult && initialHumResult) {
      setOrigResult(initialOrigResult);
      setHumResult(initialHumResult);
    } else if (initialOriginal && initialHumanized) {
      runComparison(initialOriginal, initialHumanized, true);
    }
    // eslint-disable-next-line
  }, [initialOriginal, initialHumanized, initialOrigResult, initialHumResult]);

  const runComparison = async (orig: string, hum: string, skipDelay: boolean = false) => {
    if (!orig.trim() || !hum.trim()) return;
    setLoading(true);
    
    const startTime = Date.now();
    try {
      const [resOrig, resHum] = await Promise.all([
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: orig })
        }).then(r => r.json()),
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: hum })
        }).then(r => r.json())
      ]);

      if (!skipDelay) {
        const elapsed = Date.now() - startTime;
        const minLoadingTime = 4500; 
        if (elapsed < minLoadingTime) {
          await new Promise(r => setTimeout(r, minLoadingTime - elapsed));
        }
      }

      setOrigResult(resOrig);
      setHumResult(resHum);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const origWords = originalText.trim().split(/\s+/).filter(Boolean).length;
  const humWords = humanizedText.trim().split(/\s+/).filter(Boolean).length;

  const origAiProb = origResult ? Math.round(origResult.ai_probability * 100) : 0;
  const humAiProb = humResult ? Math.round(humResult.ai_probability * 100) : 0;
  const aiProbDrop = origAiProb - humAiProb;

  return (
    <div className="h-[calc(100vh-10rem)] text-[#f4f4f5] px-6 lg:px-12 pt-0 pb-0 relative overflow-hidden font-sans bg-transparent flex flex-col">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[var(--color-lime-sprout)]/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <div className="max-w-[1440px] w-full mx-auto flex flex-col flex-1 relative z-10 min-h-0 gap-4">
      
      {/* Header & Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 shrink-0"
      >
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-[var(--color-lime-sprout)] uppercase tracking-[0.2em]">
            SIGNAL COMPARISON
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">COMPARE TEXT</h1>
          <p className="text-gray-400 text-sm mt-1">Evaluate AI probability drop across original and adversarial text sequences.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setOriginalText('');
              setHumanizedText('');
              setOrigResult(null);
              setHumResult(null);
            }}
            className="px-4 py-2 text-[10px] font-mono tracking-widest uppercase text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={() => runComparison(originalText, humanizedText)}
            disabled={loading || !originalText || !humanizedText}
            className="px-6 py-2.5 bg-[var(--color-lime-sprout)] hover:brightness-110 text-gray-950 font-bold text-xs rounded-full flex items-center gap-2 transition-all disabled:opacity-50 disabled:hover:brightness-100 cursor-pointer shadow-[0_0_20px_rgba(228,253,151,0.2)]"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border border-black/30 border-t-black rounded-full animate-spin" />
                <span>Processing</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span>Run Comparison</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Loading ThinkingOrbs Banner */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f0a]/80 backdrop-blur-md"
          >
            <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-[var(--color-lime-sprout)]/10 flex items-center justify-center shadow-2xl">
              <ThinkingOrbs title="EVALUATING DEGRADATION" stages={compareStages} durationMs={900} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delta Stats Bar */}
      <AnimatePresence>
        {!loading && origResult && humResult && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0"
          >
            <div className="bg-[#121812]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group">
              <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase block mb-1">Original AI Probability</span>
              <div className="text-2xl font-light text-[var(--color-lime-sprout)] mb-1 font-mono">{origAiProb}%</div>
              <span className="text-xs text-[var(--color-lime-sprout)]/70 font-sans block">{origResult.classification}</span>
            </div>

            <div className="bg-[#121812]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group">
              <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase block mb-1">Adversarial AI Probability</span>
              <div className="text-2xl font-light text-emerald-400 mb-1 font-mono">{humAiProb}%</div>
              <span className="text-xs text-emerald-300/70 font-sans block">{humResult.classification}</span>
            </div>

            <div className="bg-[#121812]/80 backdrop-blur-xl p-4 rounded-2xl border border-[var(--color-lime-sprout)]/20 shadow-lg relative overflow-hidden group flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-[var(--color-lime-sprout)]/80 font-mono tracking-widest uppercase flex items-center gap-2 mb-1">
                  <TrendingDown className="w-3 h-3 text-[var(--color-lime-sprout)]" />
                  <span>Signal Degradation</span>
                </span>
                <div className="text-2xl font-light text-[var(--color-lime-sprout)] mb-1 font-mono">
                  {aiProbDrop > 0 ? '-' : (aiProbDrop === 0 ? '' : '+')}
                  {Math.abs(aiProbDrop)}%
                </div>
              </div>
              <span className="text-[10px] text-[var(--color-lime-sprout)]/70 font-sans block uppercase tracking-widest">Word count delta: {humWords - origWords > 0 ? '+' : ''}{humWords - origWords}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side-by-side / Stacked Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 pb-2">
        
        {/* Original Text Box */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#121812]/80 backdrop-blur-xl rounded-3xl border border-white/5 flex flex-col h-full shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between px-8 py-5 bg-white/[0.01] border-b border-white/5">
            <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Original Sequence</span>
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600 tracking-widest uppercase">
              <span>W: <strong className="text-gray-300 font-medium">{origWords}</strong></span>
              <div className="flex items-center gap-2">
                <button onClick={() => { navigator.clipboard.writeText(originalText); setCopiedOrig(true); setTimeout(() => setCopiedOrig(false), 2000); }} className="hover:text-white transition-colors uppercase">
                  {copiedOrig ? 'COPIED' : 'COPY'}
                </button>
                <button onClick={() => { setOriginalText(''); setOrigResult(null); }} className="hover:text-white transition-colors uppercase">
                  CLEAR
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 bg-transparent flex flex-col min-h-0">
            <div className="bg-[rgba(20,35,22,0.65)] border border-[var(--color-lime-sprout)]/20 shadow-[inset_0_0_20px_rgba(228,253,151,0.02)] rounded-2xl p-4 flex-1 relative">
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Input original text..."
                className="w-full h-full bg-transparent focus:outline-none text-white/80 text-lg font-sans leading-relaxed resize-none placeholder-gray-600 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Paraphrased Text Box */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#121812]/80 backdrop-blur-xl rounded-3xl border border-[var(--color-lime-sprout)]/10 flex flex-col h-full shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between px-8 py-5 bg-white/[0.01] border-b border-white/5">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--color-lime-sprout)] uppercase">Adversarial Sequence</span>
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600 tracking-widest uppercase">
              <span>W: <strong className="text-gray-300 font-medium">{humWords}</strong></span>
              <div className="flex items-center gap-2">
                <button onClick={() => { navigator.clipboard.writeText(humanizedText); setCopiedHum(true); setTimeout(() => setCopiedHum(false), 2000); }} className="hover:text-white transition-colors uppercase">
                  {copiedHum ? 'COPIED' : 'COPY'}
                </button>
                <button onClick={() => { setHumanizedText(''); setHumResult(null); }} className="hover:text-white transition-colors uppercase">
                  CLEAR
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 bg-transparent flex flex-col min-h-0">
            <div className="bg-[rgba(20,35,22,0.65)] border border-[var(--color-lime-sprout)]/20 shadow-[inset_0_0_20px_rgba(228,253,151,0.02)] rounded-2xl p-4 flex-1 relative">
              <textarea
                value={humanizedText}
                onChange={(e) => setHumanizedText(e.target.value)}
                placeholder="Input adversarial text variation..."
                className="w-full h-full bg-transparent focus:outline-none text-white/80 text-lg font-sans leading-relaxed resize-none placeholder-gray-600 transition-colors"
              />
            </div>
          </div>
        </motion.div>

      </div>

    </div>
    </div>
  );
};
