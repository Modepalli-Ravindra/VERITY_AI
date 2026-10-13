import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarSquareIcon as Activity, 
  ArrowTrendingDownIcon as TrendingDown, 
  ArrowPathIcon as RotateCcw, 
  ExclamationTriangleIcon as AlertTriangle, 
  DocumentDuplicateIcon as Copy, 
  CheckIcon as Check 
} from '@heroicons/react/24/outline';
import { ThinkingOrbs } from '../components/ThinkingOrbs';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../lib/insforge';
import { computeComparisonMetrics, countWords } from '../utils/probability';
import { HistoryService } from '../services/historyService';

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
  const { user } = useAuth();

  const [originalText, setOriginalText] = useState(() => {
    if (initialOriginal) return initialOriginal;
    return (
      (user ? localStorage.getItem(`verity_compare_orig_${user.id}`) : null) ||
      localStorage.getItem('verity_compare_orig') ||
      ''
    );
  });

  const [humanizedText, setHumanizedText] = useState(() => {
    if (initialHumanized) return initialHumanized;
    return (
      (user ? localStorage.getItem(`verity_compare_hum_${user.id}`) : null) ||
      localStorage.getItem('verity_compare_hum') ||
      ''
    );
  });

  const [origResult, setOrigResult] = useState<any | null>(() => {
    if (initialOrigResult) return initialOrigResult;
    try {
      const saved = (user ? localStorage.getItem(`verity_compare_ores_${user.id}`) : null) ||
        localStorage.getItem('verity_compare_ores');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [humResult, setHumResult] = useState<any | null>(() => {
    if (initialHumResult) return initialHumResult;
    try {
      const saved = (user ? localStorage.getItem(`verity_compare_hres_${user.id}`) : null) ||
        localStorage.getItem('verity_compare_hres');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [copiedOrig, setCopiedOrig] = useState(false);
  const [copiedHum, setCopiedHum] = useState(false);

  // Restore cached results if user was resolved after mount
  useEffect(() => {
    if (user) {
      if (!origResult) {
        try {
          const saved = localStorage.getItem(`verity_compare_ores_${user.id}`);
          if (saved) setOrigResult(JSON.parse(saved));
        } catch {}
      }
      if (!humResult) {
        try {
          const saved = localStorage.getItem(`verity_compare_hres_${user.id}`);
          if (saved) setHumResult(JSON.parse(saved));
        } catch {}
      }
    }
  }, [user]);

  // Persist inputs to localStorage
  useEffect(() => {
    const key = user ? `verity_compare_orig_${user.id}` : 'verity_compare_orig';
    localStorage.setItem(key, originalText);
    localStorage.setItem('verity_compare_orig', originalText);
  }, [originalText, user]);

  useEffect(() => {
    const key = user ? `verity_compare_hum_${user.id}` : 'verity_compare_hum';
    localStorage.setItem(key, humanizedText);
    localStorage.setItem('verity_compare_hum', humanizedText);
  }, [humanizedText, user]);

  // Persist results to localStorage safely without wiping on unmount
  useEffect(() => {
    if (origResult) {
      const key = user ? `verity_compare_ores_${user.id}` : 'verity_compare_ores';
      localStorage.setItem(key, JSON.stringify(origResult));
      localStorage.setItem('verity_compare_ores', JSON.stringify(origResult));
    }
  }, [origResult, user]);

  useEffect(() => {
    if (humResult) {
      const key = user ? `verity_compare_hres_${user.id}` : 'verity_compare_hres';
      localStorage.setItem(key, JSON.stringify(humResult));
      localStorage.setItem('verity_compare_hres', JSON.stringify(humResult));
    }
  }, [humResult, user]);

  const compareStages = [
    'Parsing original semantic representation',
    'Parsing adversarial semantic representation',
    'Extracting stylometric variances',
    'Calculating output degradation',
    'Finalizing robustness check'
  ];

  const lastEvaluatedOrigRef = useRef<string>('');
  const lastEvaluatedHumRef = useRef<string>('');

  const runComparison = async (orig: string, hum: string, skipDelay: boolean = false) => {
    const oTrim = orig.trim();
    const hTrim = hum.trim();
    if (!oTrim || !hTrim) return;

    if (oTrim.length < 50 || hTrim.length < 50) {
      setCompareError('Both sequences require at least 50 characters (approx. 10 words) for neural stylometric evaluation.');
      return;
    }

    setLoading(true);
    setCompareError(null);
    
    const startTime = Date.now();
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Parallel concurrent execution for original and humanized text analysis (cuts wait time by 50%)
      const [resOrig, resHum] = await Promise.all([
        fetch('/api/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({ text: oTrim, detailed: false })
        }),
        fetch('/api/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({ text: hTrim, detailed: false })
        })
      ]);

      const [origJson, humJson] = await Promise.all([
        resOrig.ok ? resOrig.json().catch(() => null) : null,
        resHum.ok ? resHum.json().catch(() => null) : null
      ]);

      if (!resOrig.ok || !resHum.ok || !origJson || !humJson) {
        let errorDetail = '';
        if (!resOrig.ok) {
          try {
            const errObj = await resOrig.json();
            errorDetail = errObj.detail || errObj.message || '';
          } catch {
            errorDetail = await resOrig.text().catch(() => '');
          }
        } else if (!resHum.ok) {
          try {
            const errObj = await resHum.json();
            errorDetail = errObj.detail || errObj.message || '';
          } catch {
            errorDetail = await resHum.text().catch(() => '');
          }
        }
        if (!errorDetail) {
          errorDetail = 'Detection engine returned an unparseable response';
        }
        setCompareError(`Comparison incomplete: ${errorDetail}`);
      }

      if (!skipDelay) {
        const elapsed = Date.now() - startTime;
        const minLoadingTime = 500; 
        if (elapsed < minLoadingTime) {
          await new Promise(r => setTimeout(r, minLoadingTime - elapsed));
        }
      }

      if (origJson) {
        setOrigResult(origJson);
        lastEvaluatedOrigRef.current = oTrim;
      }
      if (humJson) {
        setHumResult(humJson);
        lastEvaluatedHumRef.current = hTrim;
      }

      // Record in unified history if both valid
      if (origJson && humJson) {
        const m = computeComparisonMetrics(origJson, humJson);
        if (m.canCompare) {
          HistoryService.recordComparison({
            userId: user?.id,
            originalSnippet: oTrim.slice(0, 100),
            origAiProbability: m.originalScore.probability,
            adversarialAiProbability: m.adversarialScore.probability,
            deltaPoints: m.signalChange,
            modelUsed: m.originalScore.activeModel || 'ModernBERT-V5'
          });
        }
      }
    } catch (err: any) {
      console.error('Comparison error:', err);
      setCompareError(err.message || 'Unable to execute comparative analysis');
    } finally {
      setLoading(false);
    }
  };

  // Initial mount trigger: ONLY run if handed off explicitly from Paraphrase with initial inputs
  useEffect(() => {
    if (initialOrigResult && initialHumResult) {
      setOrigResult(initialOrigResult);
      setHumResult(initialHumResult);
      lastEvaluatedOrigRef.current = initialOriginal.trim();
      lastEvaluatedHumRef.current = initialHumanized.trim();
    } else if (initialOriginal && initialHumanized) {
      // User explicitly clicked "Compare" in Paraphrase section
      runComparison(initialOriginal, initialHumanized, true);
    }
    // eslint-disable-next-line
  }, [initialOriginal, initialHumanized, initialOrigResult, initialHumResult]);

  // Word counts independently calculated directly from text sequences
  const origWords = countWords(originalText);
  const humWords = countWords(humanizedText);
  const wordCountDelta = humWords - origWords;

  // Authoritative probability normalization & delta computation
  const metrics = useMemo(() => {
    return computeComparisonMetrics(origResult, humResult);
  }, [origResult, humResult]);

  return (
    <div className="flex-1 min-h-0 h-full text-[#F3F8F8] px-3 sm:px-6 lg:px-8 pb-3 relative overflow-hidden font-sans bg-transparent flex flex-col selection:bg-[#00C9D8]/30">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#00C9D8]/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#008FA3]/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-[1600px] w-full mx-auto flex flex-col flex-1 relative z-10 min-h-0 gap-3">
        
        {/* Workspace Toolbar / Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 py-1.5 border-b border-[rgba(0,201,216,0.15)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs sm:text-sm font-mono font-bold text-[#00C9D8] tracking-[0.25em] uppercase">
              COMPARE WORKSPACE
            </span>
            <span className="text-[#00C9D8]/30 text-xs">•</span>
            <div className="flex items-center gap-2 text-xs font-mono text-[#9BB2B7]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00C9D8] animate-pulse" />
              <span>ModernBERT V5</span>
            </div>
            <span className="text-[#00C9D8]/30 text-xs">•</span>
            <span className="text-xs font-mono text-[#6F8B91]">Threshold: 0.70</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setOriginalText('');
                setHumanizedText('');
                setOrigResult(null);
                setHumResult(null);
                setCompareError(null);
                const uKey = user ? `_${user.id}` : '';
                localStorage.removeItem(`verity_compare_orig${uKey}`);
                localStorage.removeItem(`verity_compare_hum${uKey}`);
                localStorage.removeItem(`verity_compare_ores${uKey}`);
                localStorage.removeItem(`verity_compare_hres${uKey}`);
                localStorage.removeItem('verity_compare_orig');
                localStorage.removeItem('verity_compare_hum');
                localStorage.removeItem('verity_compare_ores');
                localStorage.removeItem('verity_compare_hres');
              }}
              className="px-3.5 py-2 text-xs font-mono tracking-widest uppercase text-[#9BB2B7] hover:text-[#F3F8F8] transition-colors cursor-pointer flex items-center gap-1.5 rounded-xl border border-[rgba(0,201,216,0.15)] bg-[#030B0D]/80 hover:border-[#00C9D8]/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Both</span>
            </button>

            <button
              onClick={() => runComparison(originalText, humanizedText)}
              disabled={loading || !originalText.trim() || !humanizedText.trim()}
              id="compare-run-btn"
              className="px-6 py-2.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:brightness-110 text-[#061416] font-bold text-xs sm:text-sm font-mono uppercase tracking-widest rounded-xl flex items-center gap-2.5 transition-all disabled:opacity-40 disabled:hover:brightness-100 cursor-pointer shadow-[0_0_24px_rgba(0,201,216,0.25)]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#061416]/30 border-t-[#061416] rounded-full animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 text-[#061416]" />
                  <span>Run Comparison</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading ThinkingOrbs Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#061416]/80 backdrop-blur-md"
            >
              <div className="bg-[#0A2023] p-8 rounded-2xl border border-[rgba(0,201,216,0.25)] flex items-center justify-center shadow-2xl">
                <ThinkingOrbs title="EVALUATING SIGNAL DIFFERENTIAL" stages={compareStages} durationMs={450} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 shrink-0">
          {/* Card 1: Original Probability */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:border-[#00C9D8]/40 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div>
              <span className="text-xs text-[#9BB2B7] font-mono tracking-widest uppercase block font-semibold leading-tight">Original Text AI Score</span>
              <span className="text-[10px] text-[#6F8B91] font-sans block mt-0.5 leading-tight">Likelihood original was AI</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
              {loading ? (
                <span className="text-xs font-mono text-[#00C9D8] animate-pulse">EVALUATING...</span>
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-bold text-[#00C9D8] font-mono tracking-tight">
                    {metrics.originalScore.formattedPercentage}
                  </span>
                  {metrics.originalScore.isValid && origResult?.classification && (
                    <span className="text-xs text-[#9BB2B7] truncate font-sans">
                      {origResult.classification}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 2: Adversarial / Rewritten Probability */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:border-[#00C9D8]/40 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div>
              <span className="text-xs text-[#9BB2B7] font-mono tracking-widest uppercase block font-semibold leading-tight">Rewritten Text AI Score</span>
              <span className="text-[10px] text-[#6F8B91] font-sans block mt-0.5 leading-tight">Likelihood rewrite is AI</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
              {loading ? (
                <span className="text-xs font-mono text-[#00C9D8] animate-pulse">EVALUATING...</span>
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-bold text-[#00C9D8] font-mono tracking-tight">
                    {metrics.adversarialScore.formattedPercentage}
                  </span>
                  {metrics.adversarialScore.isValid && humResult?.classification && (
                    <span className="text-xs text-[#9BB2B7] truncate font-sans">
                      {humResult.classification}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 3: Signal Change */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl border border-[#00C9D8]/30 rounded-2xl p-4 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:border-[#00C9D8]/50 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/40 to-transparent" />
            <div>
              <span className="text-xs text-[#00C9D8] font-mono tracking-widest uppercase flex items-center gap-1.5 font-semibold leading-tight">
                <TrendingDown className="w-3.5 h-3.5 text-[#00C9D8]" />
                <span>AI Score Reduction</span>
              </span>
              <span className="text-[10px] text-[#00C9D8]/70 font-sans block mt-0.5 leading-tight">AI detection dropped</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#00C9D8] font-mono tracking-tight mt-2">
              {loading ? (
                <span className="text-xs font-mono text-[#00C9D8] animate-pulse">CALCULATING...</span>
              ) : (
                metrics.formattedSignalChange
              )}
            </div>
          </div>

          {/* Card 4: Word Count Delta */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:border-[#00C9D8]/40 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div>
              <span className="text-xs text-[#9BB2B7] font-mono tracking-widest uppercase block font-semibold leading-tight">Word Count Difference</span>
              <span className="text-[10px] text-[#6F8B91] font-sans block mt-0.5 leading-tight">Change after rewrite</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-[#F3F8F8] font-mono tracking-tight">
                {wordCountDelta > 0 ? `+${wordCountDelta}` : wordCountDelta}
              </span>
              <span className="text-xs text-[#9BB2B7] font-sans font-medium uppercase tracking-wider">
                ({humWords} vs {origWords} words)
              </span>
            </div>
          </div>
        </div>

        {/* Unavailable Notice / Warning Banner */}
        {(!metrics.canCompare && (origResult || humResult || compareError)) && (
          <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm flex items-center gap-2.5 font-mono shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-400" />
            <span>
              {compareError || metrics.errorMessage || 'Unable to calculate comparison: detection score unavailable'}
            </span>
          </div>
        )}

        {/* Split-Screen Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[520px]">
          
          {/* Left Pane: Original Sequence */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] flex flex-col h-full overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#030B0D]/50 border-b border-[rgba(0,201,216,0.12)] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#F3F8F8] uppercase font-bold">ORIGINAL SEQUENCE</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#00C9D8]/10 text-[#00C9D8] border border-[#00C9D8]/20">
                  {origWords} words
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { navigator.clipboard.writeText(originalText); setCopiedOrig(true); setTimeout(() => setCopiedOrig(false), 2000); }} 
                  className="px-3 py-1.5 text-xs font-mono text-[#9BB2B7] hover:text-[#00C9D8] transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                >
                  {copiedOrig ? <Check className="w-3.5 h-3.5 text-[#00C9D8]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOrig ? 'COPIED' : 'COPY'}</span>
                </button>
                <button 
                  onClick={() => { 
                    setOriginalText(''); 
                    setOrigResult(null); 
                    const uKey = user ? `_${user.id}` : '';
                    localStorage.removeItem(`verity_compare_orig${uKey}`);
                    localStorage.removeItem(`verity_compare_ores${uKey}`);
                    localStorage.removeItem('verity_compare_orig');
                    localStorage.removeItem('verity_compare_ores');
                  }} 
                  className="px-3 py-1.5 text-xs font-mono text-[#6F8B91] hover:text-[#F3F8F8] transition-colors uppercase tracking-widest cursor-pointer"
                >
                  CLEAR
                </button>
              </div>
            </div>

            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste or type original sequence here..."
              className="flex-1 w-full p-5 sm:p-6 bg-transparent focus:outline-none text-[#F3F8F8] text-base leading-relaxed resize-none placeholder-[#6F8B91] focus:ring-1 focus:ring-[#00C9D8]/30 min-h-[340px]"
            />
          </div>

          {/* Right Pane: Adversarial Sequence */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] flex flex-col h-full overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#030B0D]/50 border-b border-[rgba(0,201,216,0.12)] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#00C9D8] uppercase font-bold">ADVERSARIAL SEQUENCE</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#00C9D8]/10 text-[#00C9D8] border border-[#00C9D8]/20">
                  {humWords} words
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { navigator.clipboard.writeText(humanizedText); setCopiedHum(true); setTimeout(() => setCopiedHum(false), 2000); }} 
                  className="px-3 py-1.5 text-xs font-mono text-[#9BB2B7] hover:text-[#00C9D8] transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                >
                  {copiedHum ? <Check className="w-3.5 h-3.5 text-[#00C9D8]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHum ? 'COPIED' : 'COPY'}</span>
                </button>
                <button 
                  onClick={() => { 
                    setHumanizedText(''); 
                    setHumResult(null); 
                    const uKey = user ? `_${user.id}` : '';
                    localStorage.removeItem(`verity_compare_hum${uKey}`);
                    localStorage.removeItem(`verity_compare_hres${uKey}`);
                    localStorage.removeItem('verity_compare_hum');
                    localStorage.removeItem('verity_compare_hres');
                  }} 
                  className="px-3 py-1.5 text-xs font-mono text-[#6F8B91] hover:text-[#F3F8F8] transition-colors uppercase tracking-widest cursor-pointer"
                >
                  CLEAR
                </button>
              </div>
            </div>

            <textarea
              value={humanizedText}
              onChange={(e) => setHumanizedText(e.target.value)}
              placeholder="Paste or type transformed adversarial sequence here..."
              className="flex-1 w-full p-5 sm:p-6 bg-transparent focus:outline-none text-[#F3F8F8] text-base leading-relaxed resize-none placeholder-[#6F8B91] focus:ring-1 focus:ring-[#00C9D8]/30 min-h-[340px]"
            />
          </div>

        </div>

      </div>
    </div>
  );
};
