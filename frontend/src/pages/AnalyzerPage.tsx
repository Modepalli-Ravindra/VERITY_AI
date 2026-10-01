import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { insforge, getAuthToken } from '../lib/insforge';
import { Search, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ThinkingOrbs } from '../components/ThinkingOrbs';

interface AnalyzerPageProps {
  onNavigate: (route: string, state?: any) => void;
}

export const AnalyzerPage: React.FC<AnalyzerPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [text, setText] = useState(() => localStorage.getItem(user ? `verity_analyze_text_${user.id}` : 'verity_analyze_text') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [result, setResult] = useState<any | null>(() => {
    const saved = localStorage.getItem(user ? `verity_analyze_result_${user.id}` : 'verity_analyze_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [copied, setCopied] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);

  useEffect(() => {
    const key = user ? `verity_analyze_text_${user.id}` : 'verity_analyze_text';
    localStorage.setItem(key, text);
  }, [text, user]);

  useEffect(() => {
    const key = user ? `verity_analyze_result_${user.id}` : 'verity_analyze_result';
    if (result) {
      localStorage.setItem(key, JSON.stringify(result));
    } else {
      localStorage.removeItem(key);
    }
  }, [result, user]);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  const detectorStages = [
    'Preparing text sequence',
    'Extracting semantic representations',
    'Analyzing stylometric variance',
    'Applying feature fusion head',
    'Calculating output distribution',
    'Finalizing inference'
  ];

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please provide text for analysis.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setSavedSuccess(false);

    const startTime = Date.now();

    try {
      const token = await getAuthToken();
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || 'Analysis request failed.');
      }

      const data = await resp.json();

      const elapsed = Date.now() - startTime;
      const minLoadingTime = 4800;
      if (elapsed < minLoadingTime) {
        await new Promise(r => setTimeout(r, minLoadingTime - elapsed));
      }

      setResult(data);

      if (user) {
        try {
          const { data: inserted, error: dbErr } = await insforge.database.from('analyses').insert([{
            user_id: user.id,
            original_text: text,
            ai_probability: data.ai_probability,
            human_probability: data.human_probability,
            classification: data.classification,
            confidence: data.confidence,
            explanation: data.explanation,
            model_used: 'DeBERTa-v3 + Stylometrics',
            word_count: wordCount,
            character_count: charCount
          }]);

          if (!dbErr && inserted && (inserted as any[])[0]) {
            setSavedSuccess(true);
            const analysisId = (inserted as any[])[0].id;
            const feats = data.stylometric_features;
            if (feats) {
              try {
                await insforge.database.from('analysis_features').insert([{
                  analysis_id: analysisId,
                  sentence_length: feats.sentence_length,
                  vocabulary_diversity: feats.vocabulary_diversity,
                  punctuation_score: feats.punctuation_score,
                  pos_features: feats.pos_features,
                  stylometric_summary: feats.stylometric_summary
                }]);
              } catch {
                // ignore
              }
            }
          }
        } catch (dbError) {
          console.error('Database save error:', dbError);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error executing AI analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] text-[#f4f4f5] px-6 md:px-10 lg:px-12 pt-0 pb-0 relative overflow-hidden font-sans bg-transparent flex flex-col">
      
      {/* Background Glows (matching landing page wave subtly) */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[var(--color-lime-sprout)]/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      <div className="max-w-[1440px] w-full mx-auto flex flex-col flex-1 relative z-10 min-h-0 gap-4">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 shrink-0"
      >
        <span className="text-[10px] font-semibold text-[var(--color-lime-sprout)] uppercase tracking-[0.2em]">
          AI TEXT DETECTION
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">ANALYZE TEXT</h1>
        <p className="text-gray-400 text-sm mt-1">Analyze writing using semantic and stylometric signals.</p>

        <AnimatePresence>
          {savedSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mt-2 rounded-full bg-[var(--color-lime-sprout)]/10 border border-[var(--color-lime-sprout)]/20 text-[var(--color-lime-sprout)] text-[10px] uppercase tracking-widest font-mono self-start"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Recorded</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-red-900/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 font-mono tracking-wide">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        
        {/* Main Editor Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col h-full"
        >
          <div className="bg-[rgba(20,35,22,0.65)] rounded-[24px] border border-[var(--color-lime-sprout)]/20 shadow-[inset_0_0_20px_rgba(228,253,151,0.02)] overflow-hidden flex flex-col flex-1 min-h-0">
            
            {/* Editor Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
               <span className="text-[10px] font-mono tracking-[0.2em] text-white/50 uppercase">TEXT INPUT</span>
               <div className="flex items-center gap-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                 <span>{wordCount} W / {charCount} C</span>
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={() => {
                       navigator.clipboard.writeText(text);
                       setCopiedInput(true);
                       setTimeout(() => setCopiedInput(false), 2000);
                     }}
                     className="px-2 py-1 hover:text-white transition-colors uppercase tracking-widest"
                   >
                     {copiedInput ? 'COPIED' : 'COPY'}
                   </button>
                   <button 
                     onClick={() => { setText(''); setResult(null); setError(''); }}
                     className="px-2 py-1 hover:text-white transition-colors uppercase tracking-widest"
                   >
                     CLEAR
                   </button>
                 </div>
               </div>
            </div>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here to analyze its semantic and stylometric signals..."
              className="flex-1 w-full p-6 md:p-8 bg-transparent focus:outline-none text-white/80 text-lg font-sans leading-relaxed resize-none placeholder-white/20 transition-colors"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => { setText(''); setResult(null); setError(''); }}
              className="px-2 py-2 text-[10px] font-mono tracking-widest uppercase text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="px-8 py-3 bg-[var(--color-lime-sprout)] text-black font-bold text-xs uppercase tracking-widest rounded-full flex items-center gap-2 transition-all disabled:opacity-50 hover:brightness-110 shadow-[0_0_20px_rgba(228,253,151,0.2)] cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Processing</span>
                </>
              ) : (
                <>
                  <span>ANALYZE TEXT</span>
                  <Search className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Result Area */}
        <AnimatePresence mode="wait">
           {loading ? (
             <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-center justify-center p-12 bg-[#121812]/50 border border-white/5 rounded-[24px] h-full min-h-0"
              >
                <ThinkingOrbs title="INFERENCE ACTIVE" stages={detectorStages} durationMs={800} />
              </motion.div>
           ) : result ? (
             <motion.div 
               key="result"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0 }}
               className="bg-[#121812]/80 backdrop-blur-xl border border-[var(--color-lime-sprout)]/20 shadow-[inset_0_0_30px_rgba(228,253,151,0.03)] rounded-[24px] flex flex-col h-full overflow-hidden min-h-0 relative group"
             >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 bg-[var(--color-lime-sprout)]/[0.02] border-b border-[var(--color-lime-sprout)]/10 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-lime-sprout)] animate-pulse shadow-[0_0_10px_rgba(228,253,151,0.6)]" />
                    <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--color-lime-sprout)] uppercase">Detection Diagnostics</span>
                  </div>
                  <span className="px-3 py-1 rounded-full border border-[var(--color-lime-sprout)]/20 text-[9px] font-mono tracking-widest uppercase text-[var(--color-lime-sprout)] bg-[var(--color-lime-sprout)]/5 hidden sm:block">
                    DeBERTa-v3 + Stylometrics
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
                  
                  {/* Primary Readout */}
                  <div className="flex flex-col md:flex-row items-center gap-10 border-b border-white/5 pb-8">
                    
                    {/* Radial Progress / Main Stat */}
                    <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="4" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className={result.ai_probability > 0.5 ? "text-[var(--color-lime-sprout)] drop-shadow-[0_0_10px_rgba(228,253,151,0.5)]" : "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"} strokeWidth="4" strokeDasharray={`${Math.round(result.ai_probability * 283)} 283`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-light font-mono text-white tracking-tighter">
                          {Math.round(result.ai_probability * 100)}<span className="text-xl text-white/50">%</span>
                        </span>
                        <span className="text-[9px] uppercase tracking-widest font-mono text-white/40 mt-1">AI Conf</span>
                      </div>
                    </div>

                    {/* Classification details */}
                    <div className="flex flex-col flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 mb-3 self-center md:self-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-widest ${result.ai_probability > 0.5 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {result.ai_probability > 0.8 ? 'HIGH RISK' : result.ai_probability > 0.5 ? 'ELEVATED RISK' : 'LOW RISK'}
                        </span>
                      </div>
                      <h2 className="text-3xl font-serif text-white tracking-tight mb-3">
                        {result.classification}
                      </h2>
                      <p className="text-sm text-gray-400 leading-relaxed font-sans max-w-md">
                        {result.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Secondary Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 border border-white/5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
                      <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50" /> Human Likelihood
                      </span>
                      <div className="text-3xl font-light font-mono text-blue-100">{Math.round(result.human_probability * 100)}%</div>
                    </div>
                    <div className="p-5 border border-white/5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
                      <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50" /> Total Words
                      </span>
                      <div className="text-3xl font-light font-mono text-purple-100">{wordCount}</div>
                    </div>
                  </div>

                </div>
                
                {/* Footer Action Bar */}
                <div className="px-8 py-5 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                  <button onClick={handleCopy} className="text-[10px] uppercase tracking-[0.2em] font-mono text-gray-500 hover:text-white transition-colors flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center">
                    {copied ? 'COPIED ✓' : 'COPY RAW JSON'}
                  </button>
                  <button onClick={() => onNavigate('/paraphrase', { text, result })} className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-full border border-[var(--color-lime-sprout)]/30 text-[10px] font-bold uppercase tracking-[0.2em] font-mono text-[var(--color-lime-sprout)] hover:bg-[var(--color-lime-sprout)]/10 transition-colors flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(228,253,151,0.05)]">
                    ADVERSARIAL REWRITE →
                  </button>
                </div>
              </motion.div>
           ) : null}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
};
