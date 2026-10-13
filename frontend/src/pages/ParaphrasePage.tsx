import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getAuthToken, clearAuthTokens } from '../lib/insforge';
import { 
  SparklesIcon as Sparkles, 
  ExclamationCircleIcon as AlertCircle, 
  ArrowPathIcon as RefreshCw, 
  ArrowsRightLeftIcon as GitCompare, 
  DocumentTextIcon as FileText, 
  ShieldCheckIcon as ShieldCheck, 
  DocumentDuplicateIcon as Copy, 
  CheckIcon as Check, 
  ArrowDownTrayIcon as Download, 
  ChartBarSquareIcon as Activity 
} from '@heroicons/react/24/outline';
import { ThinkingOrbs } from '../components/ThinkingOrbs';
import { computeWordDiff, getDiffStats, type DiffChunk } from '../utils/textDiff';
import { chunkDocumentForHumanization, countWords } from '../utils/documentChunker';
import { HistoryService } from '../services/historyService';

interface ParaphrasePageProps {
  onNavigate: (route: string, state?: any) => void;
  initialText?: string;
  initialResult?: any;
}

export type HumanizerTone = 'natural' | 'professional' | 'academic' | 'casual';

export interface SectionRecord {
  index: number;
  originalText: string;
  transformedText: string;
  status: 'pending' | 'completed' | 'preserved' | 'failed';
  provider?: string;
  error?: string;
}

interface ProgressState {
  current: number;
  total: number;
  percent: number;
  stageMessage: string;
}

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage quota errors
  }
};

export const ParaphrasePage: React.FC<ParaphrasePageProps> = ({ onNavigate, initialText = '', initialResult = null }) => {
  const { user } = useAuth();
  const [originalText, setOriginalText] = useState(() => {
    if (initialText && initialText.trim()) {
      return initialText;
    }
    return safeGetItem(user ? `verity_paraphrase_orig_${user.id}` : 'verity_paraphrase_orig') || '';
  });
  const [paraphrasedText, setParaphrasedText] = useState(() => safeGetItem(user ? `verity_paraphrase_hum_${user.id}` : 'verity_paraphrase_hum') || '');
  const [tone, setTone] = useState<HumanizerTone>(() => (safeGetItem(user ? `verity_paraphrase_tone_${user.id}` : 'verity_paraphrase_tone') as HumanizerTone) || 'natural');
  const [provider, setProvider] = useState('auto');
  const [usedProvider, setUsedProvider] = useState('');
  const [outputView, setOutputView] = useState<'text' | 'diff'>('text');
  const [loading, setLoading] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<ProgressState | null>(null);
  const [sectionRecords, setSectionRecords] = useState<SectionRecord[]>([]);
  const [failedSectionIndex, setFailedSectionIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedOrig, setCopiedOrig] = useState(false);
  const [recheckResult, setRecheckResult] = useState<any | null>(() => {
    const saved = safeGetItem(user ? `verity_paraphrase_res_${user.id}` : 'verity_paraphrase_res');
    return saved ? JSON.parse(saved) : null;
  });
  const [rechecking, setRechecking] = useState(false);

  const completedSectionsCount = useMemo(() => {
    return sectionRecords.filter(s => s.status === 'completed').length;
  }, [sectionRecords]);

  const preservedSectionsCount = useMemo(() => {
    return sectionRecords.filter(s => s.status === 'preserved').length;
  }, [sectionRecords]);


  useEffect(() => { 
    if (originalText) {
      safeSetItem(user ? `verity_paraphrase_orig_${user.id}` : 'verity_paraphrase_orig', originalText); 
    }
  }, [originalText, user]);

  useEffect(() => { 
    if (paraphrasedText) {
      safeSetItem(user ? `verity_paraphrase_hum_${user.id}` : 'verity_paraphrase_hum', paraphrasedText); 
    }
  }, [paraphrasedText, user]);

  useEffect(() => { 
    safeSetItem(user ? `verity_paraphrase_tone_${user.id}` : 'verity_paraphrase_tone', tone); 
  }, [tone, user]);

  useEffect(() => { 
    const key = user ? `verity_paraphrase_res_${user.id}` : 'verity_paraphrase_res';
    if (recheckResult) {
      try {
        localStorage.setItem(key, JSON.stringify(recheckResult));
      } catch {}
    } else {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  }, [recheckResult, user]);

  const paraphraseStages = [
    'Parsing syntactic structure',
    'Applying tone transformation profile',
    'Preserving factual references & names',
    'Injecting natural sentence burstiness',
    'Validating meaning consistency',
    'Finalizing humanized output'
  ];

  useEffect(() => {
    if (initialText && initialText.trim()) {
      setOriginalText(initialText);
      const wCount = initialText.trim().split(/\s+/).filter(Boolean).length;
      console.log('[VERITY DIAGNOSTIC] ParaphrasePage initialText applied:', {
        initialText_chars: initialText.length,
        initialText_words: wCount
      });
    }
  }, [initialText]);

  // Compute word diff and diff statistics
  const diffChunks = useMemo<DiffChunk[]>(() => {
    if (!originalText || !paraphrasedText) return [];
    return computeWordDiff(originalText, paraphrasedText);
  }, [originalText, paraphrasedText]);

  const diffStats = useMemo(() => {
    return getDiffStats(diffChunks);
  }, [diffChunks]);

  const handleParaphrase = async (resumeIndex?: number) => {
    if (!originalText.trim()) {
      setError('Please provide text for transformation.');
      return;
    }
    setError('');
    setLoading(true);
    setChunkProgress(null);

    const isResuming = typeof resumeIndex === 'number' && resumeIndex >= 0;
    if (!isResuming) {
      setFailedSectionIndex(null);
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Your session has expired or you are not signed in. Please sign in to humanize text.');
        setLoading(false);
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const chunks = chunkDocumentForHumanization(originalText, 4500);
      const isMultiChunk = chunks.length > 1;

      console.log('[VERITY DIAGNOSTIC] Initiating paraphrase transformation:', {
        totalCharacters: originalText.length,
        totalWords: countWords(originalText),
        chunkCount: chunks.length,
        isMultiChunk,
        isResuming,
        resumeIndex
      });

      let combinedOutput = '';
      let lastProvider = '';

      if (isMultiChunk) {
        let currentSections: SectionRecord[] = isResuming && sectionRecords.length === chunks.length
          ? [...sectionRecords]
          : chunks.map((c, i) => ({
              index: i,
              originalText: c,
              transformedText: '',
              status: 'pending' as const
            }));

        setSectionRecords(currentSections);

        const startIndex = isResuming && typeof resumeIndex === 'number' ? resumeIndex : 0;

        for (let i = startIndex; i < chunks.length; i++) {
          const chunk = chunks[i];
          const currentSectionNum = i + 1;
          const totalSections = chunks.length;
          const percent = Math.round((i / totalSections) * 100);

          setChunkProgress({
            current: currentSectionNum,
            total: totalSections,
            percent,
            stageMessage: `Transforming section ${currentSectionNum} of ${totalSections}...`
          });

          try {
            const resp = await fetch('/api/humanize', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                text: chunk,
                provider,
                tone
              })
            });

            if (!resp.ok) {
              if (resp.status === 401) {
                clearAuthTokens();
                throw new Error('Your session has expired. Please sign in again.');
              }
              const errData = await resp.json().catch(() => ({}));
              throw new Error(errData.detail || `Transformation unavailable on section ${currentSectionNum}`);
            }

            const data = await resp.json();

            if (data.error) {
              throw new Error(data.error);
            }

            const transformedPart = data.humanized_text || chunk;
            lastProvider = data.provider || lastProvider;

            currentSections[i] = {
              index: i,
              originalText: chunk,
              transformedText: transformedPart,
              status: 'completed',
              provider: data.provider
            };
            setSectionRecords([...currentSections]);

          } catch (chunkError: any) {
            console.error(`[VERITY] Transformation halted at section ${currentSectionNum} of ${totalSections}:`, chunkError);
            
            currentSections[i] = {
              index: i,
              originalText: chunk,
              transformedText: '',
              status: 'failed',
              error: chunkError.message
            };
            setSectionRecords([...currentSections]);
            setFailedSectionIndex(i);

            const partialCompletedText = currentSections
              .slice(0, i)
              .map(s => s.transformedText || s.originalText)
              .join('\n\n');
            
            if (partialCompletedText.trim()) {
              setParaphrasedText(partialCompletedText);
            }

            throw new Error(`Transformation halted at section ${currentSectionNum} of ${totalSections}: ${chunkError.message}. You can resume or retry from this section.`);
          }
        }

        combinedOutput = currentSections.map(s => s.transformedText || s.originalText).join('\n\n');
        setChunkProgress({
          current: chunks.length,
          total: chunks.length,
          percent: 100,
          stageMessage: 'Multi-section document transformation complete'
        });

      } else {
        const resp = await fetch('/api/humanize', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: originalText,
            provider,
            tone
          })
        });

        if (!resp.ok) {
          if (resp.status === 401) {
            clearAuthTokens();
            throw new Error('Your session has expired. Please sign in again.');
          }
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.detail || 'Transformation request failed.');
        }

        const data = await resp.json();

        if (data.error) {
          const uiError = data.error.replace(/Humanization/gi, 'Transformation').replace(/humanize/gi, 'transform');
          throw new Error(uiError);
        }

        combinedOutput = data.humanized_text;
        lastProvider = data.provider;
      }

      setParaphrasedText(combinedOutput);
      setUsedProvider(lastProvider);
      setFailedSectionIndex(null);

      try {
        await HistoryService.recordHumanization({
          userId: user?.id,
          originalText,
          humanizedText: combinedOutput,
          provider: lastProvider || 'auto',
          tone
        });
      } catch (dbErr) {
        console.error('Failed to save record:', dbErr);
      }
    } catch (err: any) {
      setError(err.message || 'Error executing text transformation.');
    } finally {
      setLoading(false);
      setChunkProgress(null);
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
    a.download = `verity-humanized-${tone}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRecheck = async () => {
    if (!paraphrasedText) return;
    setRechecking(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Your session has expired or you are not signed in. Please sign in to continue.');
        setRechecking(false);
        return;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

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

  const tones: { id: HumanizerTone; label: string; desc: string; icon: string }[] = [
    { id: 'natural', label: 'Natural', desc: 'Organic flow & varied burstiness', icon: '🌿' },
    { id: 'professional', label: 'Professional', desc: 'Crisp, authoritative & concise', icon: '💼' },
    { id: 'academic', label: 'Academic', desc: 'Scholarly precision & rigor', icon: '🎓' },
    { id: 'casual', label: 'Casual', desc: 'Approachable & conversational', icon: '☕' },
  ];

  const origWords = countWords(originalText);
  const humWords = countWords(paraphrasedText);

  return (
    <div className="flex-1 min-h-0 h-full text-[#F3F8F8] px-3 sm:px-6 lg:px-8 pb-3 relative overflow-hidden font-sans bg-transparent flex flex-col selection:bg-[#00C9D8]/30">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#00C9D8]/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#008FA3]/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-[1600px] w-full mx-auto flex flex-col flex-1 relative z-10 min-h-0 gap-3">
        
        {/* Workspace Toolbar / Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 py-1.5 border-b border-[rgba(0,201,216,0.15)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs sm:text-sm font-mono font-bold text-[#00C9D8] tracking-[0.25em] uppercase">
              PARAPHRASE WORKSPACE
            </span>
            <span className="text-[#00C9D8]/30 text-xs">•</span>
            
            {/* Tone Selector Pills */}
            <div className="inline-flex p-1 rounded-xl bg-[#030B0D]/80 border border-[rgba(0,201,216,0.2)] gap-1.5 shadow-inner">
              {tones.map((t) => {
                const isActive = tone === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    id={`tone-btn-${t.id}`}
                    title={t.desc}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#00C9D8] text-[#061416] font-bold shadow-md'
                        : 'text-[#9BB2B7] hover:text-[#F3F8F8]'
                    }`}
                  >
                    <span className="text-sm">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[#00C9D8]/30 text-xs hidden md:inline">•</span>
            {/* Model Selection Dropdown */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#9BB2B7]">
              <span className="uppercase tracking-widest text-[#6F8B91] font-semibold">ENGINE:</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="bg-[#030B0D]/80 border border-[rgba(0,201,216,0.2)] rounded-lg px-3 py-1 text-xs font-mono text-[#00C9D8] focus:outline-none cursor-pointer uppercase shadow-inner"
              >
                <option value="auto" className="bg-[#0A2023] text-white">Auto Select</option>
                <option value="google" className="bg-[#0A2023] text-white">Google Gemini</option>
                <option value="groq" className="bg-[#0A2023] text-white">Groq Llama-3.3</option>
                <option value="openrouter" className="bg-[#0A2023] text-white">OpenRouter</option>
                <option value="nvidia" className="bg-[#0A2023] text-white">NVIDIA NeMo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setOriginalText('');
                setParaphrasedText('');
                setRecheckResult(null);
                setError('');
              }}
              className="px-3.5 py-2 text-xs font-mono text-[#9BB2B7] hover:text-[#F3F8F8] transition-colors uppercase tracking-widest cursor-pointer rounded-xl border border-[rgba(0,201,216,0.15)] bg-[#030B0D]/80 hover:border-[#00C9D8]/40"
            >
              CLEAR BOTH
            </button>
            <button
              onClick={() => handleParaphrase()}
              disabled={loading || !originalText.trim()}
              id="humanize-run-btn"
              className="px-6 py-2.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:brightness-110 text-[#061416] font-bold text-xs sm:text-sm font-mono uppercase tracking-widest rounded-xl flex items-center gap-2.5 transition-all disabled:opacity-50 disabled:hover:brightness-100 cursor-pointer shadow-[0_0_24px_rgba(0,201,216,0.25)]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#061416]/30 border-t-[#061416] rounded-full animate-spin" />
                  <span>TRANSFORMING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#061416]" />
                  <span>HUMANIZE TEXT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section Status Banner (for multi-chunk) */}
        {sectionRecords.length > 1 && (
          <div className="flex items-center gap-2.5 text-xs font-mono bg-white/[0.03] px-4 py-2 rounded-xl border border-white/10 shrink-0" id="section-status-banner">
            <span className="text-white/60">Sections: <strong className="text-white">{sectionRecords.length}</strong></span>
            <span className="text-white/20">•</span>
            <span className="text-emerald-400">Completed: <strong>{completedSectionsCount}</strong></span>
            <span className="text-white/20">•</span>
            <span className="text-cyan-400">Preserved: <strong>{preservedSectionsCount}</strong></span>
            {failedSectionIndex !== null && (
              <>
                <span className="text-white/20">•</span>
                <span className="text-rose-400">Failed: <strong>Sec {failedSectionIndex + 1}</strong></span>
              </>
            )}
          </div>
        )}

        {/* Loading ThinkingOrbs Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#061416]/80 backdrop-blur-md"
            >
              <div className="bg-[#0A2023] p-8 rounded-2xl border border-[rgba(0,201,216,0.25)] flex flex-col items-center justify-center shadow-2xl">
                <ThinkingOrbs 
                  title={chunkProgress && chunkProgress.total > 1
                    ? `SECTION ${chunkProgress.current}/${chunkProgress.total} (${chunkProgress.percent}%)`
                    : `HUMANIZING (${tone.toUpperCase()})`} 
                  stages={paraphraseStages} 
                  durationMs={900} 
                />
                {chunkProgress && chunkProgress.total > 1 && (
                  <div className="w-full max-w-xs mt-6 flex flex-col gap-2" id="chunk-progress-container">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00C9D8] transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(0,201,216,0.5)]" 
                        style={{ width: `${chunkProgress.percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-center text-[#00C9D8] tracking-wider">
                      {chunkProgress.stageMessage}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error / Warning Banner */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="px-5 py-3 rounded-xl bg-red-900/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3 font-mono">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-400" />
                  <span className="break-words">{error}</span>
                </div>
                {failedSectionIndex !== null && (
                  <button
                    onClick={() => handleParaphrase(failedSectionIndex)}
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-[#00C9D8] text-[#061416] font-bold text-xs font-mono uppercase rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                    id="retry-failed-section-btn"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Resume Section {failedSectionIndex + 1}</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Split-Screen Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[520px]">
          
          {/* Left Pane: Original Sequence */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] flex flex-col h-full overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#030B0D]/50 border-b border-[rgba(0,201,216,0.12)] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#F3F8F8] uppercase font-bold">ORIGINAL SEQUENCE</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#00C9D8]/10 text-[#00C9D8] border border-[#00C9D8]/20">
                  <span>Words: </span><strong className="text-white">{origWords}</strong>
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
                  onClick={() => { setOriginalText(''); setParaphrasedText(''); setRecheckResult(null); setError(''); }} 
                  className="px-3 py-1.5 text-xs font-mono text-[#6F8B91] hover:text-[#F3F8F8] transition-colors uppercase tracking-widest cursor-pointer"
                >
                  CLEAR
                </button>
              </div>
            </div>

            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste or type original sequence here to rewrite into an adversarial variation..."
              className="flex-1 w-full p-5 sm:p-6 bg-transparent focus:outline-none text-[#F3F8F8] text-base leading-relaxed resize-none placeholder-[#6F8B91] focus:ring-1 focus:ring-[#00C9D8]/30 min-h-[350px]"
            />
          </div>

          {/* Right Pane: Adversarial Sequence */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] flex flex-col h-full overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#030B0D]/50 border-b border-[rgba(0,201,216,0.12)] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#00C9D8] uppercase font-bold">
                  ADVERSARIAL SEQUENCE
                </span>
                {paraphrasedText ? (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#00C9D8]/10 text-[#00C9D8] border border-[#00C9D8]/20" id="output-word-count">
                    <span>Words: </span><strong className="text-white">{humWords}</strong>
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-white/5 text-[#9BB2B7]">
                    0 words
                  </span>
                )}
                {paraphrasedText && (
                  <div className="inline-flex p-0.5 rounded-lg bg-[#030B0D]/80 border border-[rgba(0,201,216,0.2)] text-xs font-mono ml-1.5">
                    <button
                      onClick={() => setOutputView('text')}
                      id="view-toggle-text"
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        outputView === 'text' ? 'bg-[#00C9D8] text-[#061416] font-bold' : 'text-[#9BB2B7] hover:text-[#F3F8F8]'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>TEXT</span>
                    </button>
                    <button
                      onClick={() => setOutputView('diff')}
                      id="diff-view-toggle"
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        outputView === 'diff' ? 'bg-[#00C9D8] text-[#061416] font-bold' : 'text-[#9BB2B7] hover:text-[#F3F8F8]'
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>DIFF</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {paraphrasedText && (
                  <>
                    <button 
                      onClick={handleCopy} 
                      className="px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'COPIED' : 'COPY'}</span>
                    </button>
                    <button 
                      onClick={handleDownload} 
                      className="px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">EXPORT</span>
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { setParaphrasedText(''); setRecheckResult(null); }} 
                  className="px-3 py-1.5 text-xs font-mono text-gray-500 hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
                >
                  CLEAR
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 w-full overflow-hidden relative flex flex-col min-h-0">
              {!paraphrasedText ? (
                <div className="flex-1 p-8 sm:p-10 flex flex-col items-center justify-center text-center text-[#9BB2B7]">
                  <div className="w-14 h-14 rounded-2xl bg-[#00C9D8]/10 flex items-center justify-center text-[#00C9D8] mb-4 border border-[#00C9D8]/25 shadow-lg">
                    <Sparkles className="w-7 h-7 text-[#00C9D8]" />
                  </div>
                  <h3 className="text-sm sm:text-base font-mono uppercase tracking-widest text-[#F3F8F8] mb-2 font-bold">
                    Output will appear here
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9BB2B7] max-w-sm leading-relaxed mb-6 font-sans">
                    Target tone profile: <strong className="text-[#00C9D8] uppercase font-mono">{tone}</strong>. Factual entities, proper nouns, and citations will be strictly preserved.
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left text-xs font-mono border-t border-[rgba(0,201,216,0.12)] pt-4">
                    <div className="text-[#6F8B91]">Tone Profile:</div>
                    <div className="text-[#00C9D8] text-right uppercase font-bold">{tone}</div>
                    <div className="text-[#6F8B91]">Generator:</div>
                    <div className="text-[#F3F8F8] text-right font-medium">{usedProvider || provider.toUpperCase()}</div>
                    <div className="text-[#6F8B91]">Burstiness:</div>
                    <div className="text-[#00C9D8] text-right font-medium">Human Multi-Scale</div>
                    <div className="text-[#6F8B91]">Entity Drift:</div>
                    <div className="text-[#00C9D8] text-right font-medium">0.00% Zero-Loss</div>
                  </div>
                </div>
              ) : outputView === 'text' ? (
                <div
                  className="whitespace-pre-wrap flex-1 w-full p-5 sm:p-6 bg-transparent text-[#F3F8F8] text-base leading-relaxed overflow-y-auto selection:bg-[#00C9D8]/30 focus:outline-none min-h-[350px]"
                  tabIndex={0}
                >
                  {paraphrasedText}
                </div>
              ) : (
                /* Diff View */
                <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col gap-4" id="diff-container">
                  <div className="p-3.5 rounded-xl bg-[#030B0D]/50 border border-[rgba(0,201,216,0.12)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-2 text-[#00C9D8] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#00C9D8] inline-block" />
                        <span>Added: +{diffStats.wordsAdded} w</span>
                      </span>
                      <span className="flex items-center gap-2 text-rose-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                        <span>Replaced: -{diffStats.wordsRemoved} w</span>
                      </span>
                      <span className="flex items-center gap-2 text-[#9BB2B7] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#9BB2B7] inline-block" />
                        <span>Preserved: {diffStats.wordsUnchanged} w</span>
                      </span>
                    </div>
                    <span className="text-[#6F8B91] uppercase tracking-widest text-[10px] font-semibold">
                      Word Diff Comparison
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#030B0D]/80 border border-[rgba(0,201,216,0.1)] font-sans text-base leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 text-[#F3F8F8]">
                    {diffChunks.map((chunk, idx) => {
                      if (chunk.type === 'removed') {
                        return (
                          <span
                            key={idx}
                            className="line-through bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded mx-0.5 text-sm"
                            title="Original phrase replaced"
                          >
                            {chunk.value}
                          </span>
                        );
                      }
                      if (chunk.type === 'added') {
                        return (
                          <span
                            key={idx}
                            className="bg-[#00C9D8]/20 text-[#00C9D8] px-1.5 py-0.5 rounded mx-0.5 font-medium border border-[#00C9D8]/30"
                            title="Humanized phrasing added"
                          >
                            {chunk.value}
                          </span>
                        );
                      }
                      return <span key={idx}>{chunk.value}</span>;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar for Right Pane */}
            {paraphrasedText && (
              <div className="px-5 py-3.5 bg-[#030B0D]/50 border-t border-[rgba(0,201,216,0.12)] flex items-center justify-between text-xs font-mono text-[#9BB2B7] shrink-0">
                <div className="flex items-center gap-2">
                  {recheckResult ? (
                    <span className="flex items-center gap-2 text-[#00C9D8] font-bold">
                      <ShieldCheck className="w-4 h-4 text-[#00C9D8]" />
                      <span>{recheckResult.classification} ({Math.round(recheckResult.ai_probability * 100)}% AI)</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleRecheck}
                      disabled={rechecking}
                      className="text-[#9BB2B7] hover:text-[#00C9D8] transition-colors uppercase tracking-wider flex items-center gap-1.5 cursor-pointer font-semibold"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${rechecking ? 'animate-spin' : ''}`} />
                      <span>{rechecking ? 'RE-CHECKING...' : 'RE-CHECK DETECTION'}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onNavigate('/compare', { 
                    original: originalText, 
                    humanized: paraphrasedText,
                    origResult: initialResult,
                    humResult: recheckResult
                  })}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:brightness-110 text-[#061416] uppercase tracking-wider flex items-center gap-2 cursor-pointer font-bold text-xs transition-all shadow-[0_0_20px_rgba(0,201,216,0.25)]"
                >
                  <Activity className="w-4 h-4 text-[#061416]" />
                  <span>COMPARE IN WORKSPACE</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
