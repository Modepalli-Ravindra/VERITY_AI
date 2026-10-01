import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { insforge, getAuthToken } from '../lib/insforge';
import { Wand2, Sparkles, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { ThinkingOrbs } from '../components/ThinkingOrbs';

interface ParaphrasePageProps {
  onNavigate: (route: string, state?: any) => void;
  initialText?: string;
  initialResult?: any;
}

export const ParaphrasePage: React.FC<ParaphrasePageProps> = ({ onNavigate, initialText = '', initialResult = null }) => {
  const { user } = useAuth();
  const [originalText, setOriginalText] = useState(() => initialText || localStorage.getItem(user ? `verity_paraphrase_orig_${user.id}` : 'verity_paraphrase_orig') || '');
  const [paraphrasedText, setParaphrasedText] = useState(() => localStorage.getItem(user ? `verity_paraphrase_hum_${user.id}` : 'verity_paraphrase_hum') || '');
  const [provider, setProvider] = useState('auto');
  const [usedProvider, setUsedProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedOrig, setCopiedOrig] = useState(false);
  const [recheckResult, setRecheckResult] = useState<any | null>(() => {
    const saved = localStorage.getItem(user ? `verity_paraphrase_res_${user.id}` : 'verity_paraphrase_res');
    return saved ? JSON.parse(saved) : null;
  });
  const [rechecking, setRechecking] = useState(false);

  useEffect(() => { localStorage.setItem(user ? `verity_paraphrase_orig_${user.id}` : 'verity_paraphrase_orig', originalText); }, [originalText, user]);
  useEffect(() => { localStorage.setItem(user ? `verity_paraphrase_hum_${user.id}` : 'verity_paraphrase_hum', paraphrasedText); }, [paraphrasedText, user]);
  useEffect(() => { 
    const key = user ? `verity_paraphrase_res_${user.id}` : 'verity_paraphrase_res';
    if (recheckResult) localStorage.setItem(key, JSON.stringify(recheckResult)); 
    else localStorage.removeItem(key); 
  }, [recheckResult, user]);

  const paraphraseStages = [
    'Parsing original structure',
    'Analyzing stylometric variance',
    'Generating adversarial variation',
    'Preserving semantic content',
    'Validating structural shift',
    'Finalizing text transformation'
  ];

  useEffect(() => {
    if (initialText) {
      setOriginalText(initialText);
    }
  }, [initialText]);

  const handleParaphrase = async () => {
    if (!originalText.trim()) {
      setError('Please provide text for transformation.');
      return;
    }
    setError('');
    setLoading(true);
    setParaphrasedText('');
    setRecheckResult(null);

    const startTime = Date.now();

    try {
      const token = await getAuthToken();
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const resp = await fetch('/api/humanize', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: originalText, provider })
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || 'Transformation request failed.');
      }

      const data = await resp.json();

      if (data.error) {
        const uiError = data.error.replace(/Humanization/gi, 'Transformation').replace(/humanize/gi, 'transform');
        throw new Error(uiError);
      }

      const elapsed = Date.now() - startTime;
      const minLoadingTime = 5400; 
      if (elapsed < minLoadingTime) {
        await new Promise(r => setTimeout(r, minLoadingTime - elapsed));
      }

      setParaphrasedText(data.humanized_text);
      setUsedProvider(data.provider);

      if (user) {
        try {
          await insforge.database.from('humanizations').insert([{
            user_id: user.id,
            original_text: originalText,
            humanized_text: data.humanized_text,
            model_used: data.provider
          }]);
        } catch (dbErr) {
          console.error('Failed to save record:', dbErr);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error executing text transformation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!paraphrasedText) return;
    navigator.clipboard.writeText(paraphrasedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!paraphrasedText) return;
    const blob = new Blob([paraphrasedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verity-transformed.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRecheck = async () => {
    if (!paraphrasedText) return;
    setRechecking(true);
    try {
      const token = await getAuthToken();
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const resp = await fetch('/api/recheck', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: paraphrasedText })
      });
      const data = await resp.json();
      setRecheckResult(data);
    } catch (err) {
      console.error('Re-check failed:', err);
    } finally {
      setRechecking(false);
    }
  };

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
            ADVERSARIAL REWRITING
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">PARAPHRASE TEXT</h1>
          <p className="text-gray-400 text-sm mt-1">Transform detected AI text into more organic, human-like variations.</p>
        </div>

        {/* Provider selection */}
        <div className="flex items-center gap-3 bg-[rgba(20,35,22,0.65)] p-2 px-4 rounded-full border border-[var(--color-lime-sprout)]/20 shadow-[inset_0_0_10px_rgba(228,253,151,0.02)] mb-1">
          <label className="text-[10px] text-white/50 font-mono tracking-widest uppercase">MODEL</label>
          <div className="w-px h-4 bg-white/10"></div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-transparent border-none text-[11px] font-mono tracking-widest text-[var(--color-lime-sprout)] focus:outline-none cursor-pointer uppercase appearance-none"
          >
            <option value="auto" className="bg-[#121812] text-white">Auto Select</option>
            <option value="google" className="bg-[#121812] text-white">Google Gemini</option>
            <option value="groq" className="bg-[#121812] text-white">Groq Llama-3.3</option>
            <option value="openrouter" className="bg-[#121812] text-white">OpenRouter</option>
            <option value="nvidia" className="bg-[#121812] text-white">NVIDIA NeMo</option>
          </select>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-red-900/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 mb-6 font-mono tracking-wide">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side-by-side Input & Output Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 pb-2">
        
        {/* Original Text Column */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col h-full"
        >
          <div className="bg-[#121812]/80 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden flex flex-col flex-1 shadow-lg">
            <div className="flex items-center justify-between px-8 py-5 bg-white/[0.01] border-b border-white/5">
              <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Input Text</span>
              <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 tracking-widest uppercase">
                <span>Words: <strong className="text-gray-300">{originalText.trim().split(/\s+/).filter(Boolean).length}</strong></span>
                <div className="flex items-center gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(originalText); setCopiedOrig(true); setTimeout(() => setCopiedOrig(false), 2000); }} className="hover:text-white transition-colors uppercase">
                    {copiedOrig ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={() => { setOriginalText(''); setParaphrasedText(''); setRecheckResult(null); }} className="hover:text-white transition-colors uppercase">
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 bg-transparent flex flex-col min-h-0">
              <div className="bg-[rgba(20,35,22,0.65)] border border-[var(--color-lime-sprout)]/20 shadow-[inset_0_0_20px_rgba(228,253,151,0.02)] rounded-2xl p-4 flex-1 relative">
                <textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="Provide source text to rewrite into adversarial variation..."
                  className="w-full h-full bg-transparent focus:outline-none text-white/80 text-lg font-sans leading-relaxed resize-none placeholder-gray-600 transition-colors"
                />
              </div>
            </div>

            <div className="px-8 py-5 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
              <div className="flex-1"></div>

              <button
                onClick={handleParaphrase}
                disabled={loading || !originalText.trim()}
                className="px-6 py-2.5 bg-[var(--color-lime-sprout)] hover:brightness-110 text-gray-950 font-bold text-xs rounded-full flex items-center gap-2 transition-all disabled:opacity-50 disabled:hover:brightness-100 cursor-pointer shadow-[0_0_20px_rgba(228,253,151,0.2)]"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Transform Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Paraphrased Output Column */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col h-full"
        >
          <div className="bg-[#121812]/80 backdrop-blur-xl rounded-3xl border border-[var(--color-lime-sprout)]/10 overflow-hidden flex flex-col flex-1 shadow-lg relative">
            <div className="flex items-center justify-between px-8 py-5 bg-[var(--color-lime-sprout)]/[0.02] border-b border-[var(--color-lime-sprout)]/10">
              <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--color-lime-sprout)] uppercase flex items-center gap-2">
                <Wand2 className="w-3.5 h-3.5" />
                Transformed Output
              </span>
              {usedProvider && (
                <span className="px-2 py-1 rounded border border-[var(--color-lime-sprout)]/20 text-[9px] font-mono tracking-widest uppercase text-[var(--color-lime-sprout)]">
                  {usedProvider}
                </span>
              )}
            </div>

            <div className="flex-1 p-4 bg-transparent flex flex-col min-h-0">
              <div className="bg-[rgba(20,35,22,0.65)] border border-[var(--color-lime-sprout)]/20 shadow-[inset_0_0_20px_rgba(228,253,151,0.02)] rounded-2xl p-4 flex-1 relative">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/20"
                  >
                    <ThinkingOrbs title="TRANSFORMING" stages={paraphraseStages} durationMs={900} />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 p-8 text-white/80 text-lg font-sans leading-relaxed overflow-y-auto"
                  >
                    {!paraphrasedText ? (
                      <div className="h-full flex items-center justify-center text-center">
                        <span className="text-gray-600 font-sans text-sm font-light uppercase tracking-widest">
                          Output will appear here
                        </span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{paraphrasedText}</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>

            {paraphrasedText && (
              <div className="bg-white/[0.01] border-t border-white/5 flex flex-col">
                {recheckResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-8 py-4 border-b border-white/5 bg-[var(--color-lime-sprout)]/[0.02]"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] uppercase mb-2">
                      <span className="text-[var(--color-lime-sprout)]">Re-Check Result</span>
                      <span className={recheckResult.classification?.includes('AI') ? 'text-[var(--color-lime-sprout)]' : 'text-gray-400'}>
                        {recheckResult.classification} ({Math.round(recheckResult.ai_probability * 100)}% AI)
                      </span>
                    </div>
                    <p className="text-gray-400 text-[11px] leading-relaxed font-light">{recheckResult.explanation}</p>
                  </motion.div>
                )}
                
                <div className="px-8 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white text-[10px] font-mono uppercase tracking-widest rounded-full transition-colors"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white text-[10px] font-mono uppercase tracking-widest rounded-full transition-colors"
                    >
                      Save
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRecheck}
                      disabled={rechecking}
                      className="px-5 py-2.5 bg-[var(--color-lime-sprout)]/10 hover:bg-[var(--color-lime-sprout)]/20 text-[var(--color-lime-sprout)] border border-[var(--color-lime-sprout)]/20 text-[10px] font-semibold uppercase tracking-widest rounded-full flex items-center gap-2 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${rechecking ? 'animate-spin' : ''}`} />
                      <span>Re-check</span>
                    </button>

                    <button
                      onClick={() => onNavigate('/compare', { 
                        original: originalText, 
                        humanized: paraphrasedText,
                        origResult: initialResult,
                        humResult: recheckResult
                      })}
                      className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 text-[10px] font-semibold uppercase tracking-widest rounded-full flex items-center gap-2 transition cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Compare</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
    </div>
  );
};
