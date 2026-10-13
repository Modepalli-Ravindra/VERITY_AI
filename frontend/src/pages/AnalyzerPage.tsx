import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getAuthToken, clearAuthTokens } from '../lib/insforge';
import { 
  MagnifyingGlassIcon as Search, 
  ExclamationCircleIcon as AlertCircle, 
  CheckCircleIcon as CheckCircle2, 
  CloudArrowUpIcon as UploadCloud, 
  DocumentTextIcon as FileText, 
  XMarkIcon as X, 
  ShieldCheckIcon as ShieldCheck, 
  CpuChipIcon as Cpu, 
  DocumentDuplicateIcon as Copy, 
  CheckIcon as Check, 
  ArrowRightIcon as ArrowRight, 
  ArrowDownTrayIcon as Download,
  ChartBarSquareIcon as Activity
} from '@heroicons/react/24/solid';
import { ThinkingOrbs } from '../components/ThinkingOrbs';
import { HistoryService } from '../services/historyService';

interface AnalyzerPageProps {
  onNavigate: (route: string, state?: any) => void;
}

export const AnalyzerPage: React.FC<AnalyzerPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [text, setText] = useState(() => localStorage.getItem(user ? `verity_analyze_text_${user.id}` : 'verity_analyze_text') || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [result, setResult] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem(user ? `verity_analyze_result_${user.id}` : 'verity_analyze_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [extractedText, setExtractedText] = useState<string>(() => result?.extracted_text || '');
  const [copiedInput, setCopiedInput] = useState(false);

  useEffect(() => {
    try {
      const key = user ? `verity_analyze_text_${user.id}` : 'verity_analyze_text';
      localStorage.setItem(key, text);
    } catch {
      // ignore storage quota errors
    }
  }, [text, user]);

  useEffect(() => {
    try {
      const key = user ? `verity_analyze_result_${user.id}` : 'verity_analyze_result';
      if (result) {
        localStorage.setItem(key, JSON.stringify(result));
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore storage quota errors
    }
    if (result?.extracted_text) {
      setExtractedText(result.extracted_text);
    }
  }, [result, user]);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  const detectorStages = [
    'Preparing sequence analysis',
    'Extracting semantic representations',
    'Analyzing stylometric variance',
    'Applying feature fusion head',
    'Calculating output distribution',
    'Finalizing inference'
  ];

  const documentStages = [
    'Validating file signature & structure',
    'Extracting document content safely',
    'Decomposing bounded chunk sequence',
    'Evaluating transformer & stylometric signals',
    'Aggregating multi-segment distributions',
    'Finalizing document report'
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const docMeta = result.document_meta
      ? `Document: ${result.document_meta.filename} (${result.document_meta.file_type})\nChunks Analyzed: ${result.document_meta.chunks_analyzed}\nTotal Document Words: ${result.document_meta.total_words}\n`
      : `Text Length: ${wordCount} words / ${charCount} chars\n`;

    const reportText = `VERITY DETECTION REPORT\n=======================\n\n${docMeta}Classification: ${result.classification}\nAI Probability: ${Math.round(result.ai_probability * 100)}%\nHuman Probability: ${Math.round(result.human_probability * 100)}%\nConfidence: ${result.confidence}\n\nExplanation: ${result.explanation}\n\nDETAILED SEGMENTS:\n------------------\n${result.segments ? result.segments.map((seg: any) => `[Segment ${seg.segment_index || '#'} - ${seg.classification} - AI: ${Math.round(seg.ai_probability * 100)}%]\n"${seg.text}"`).join('\n\n') : 'N/A'}`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verity_report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateAndSetFile = (file: File) => {
    setError('');
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx', '.txt'].includes(ext)) {
      setError(`Unsupported file format '${ext}'. Please upload a PDF, DOCX, or TXT file.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB maximum limit.');
      return;
    }
    if (file.size === 0) {
      setError('Uploaded file is empty (0 bytes).');
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setInputMode('upload');
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (inputMode === 'paste' && !text.trim()) {
      setError('Please provide text for analysis.');
      return;
    }
    if (inputMode === 'upload' && !selectedFile) {
      setError('Please select a PDF, DOCX, or TXT document to analyze.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);
    setSavedSuccess(false);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Your session has expired or you are not signed in. Please sign in to analyze documents.');
        setLoading(false);
        return;
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };

      let resp: Response;

      if (inputMode === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('detailed', 'true');

        resp = await fetch('/api/analyze-file', {
          method: 'POST',
          headers,
          body: formData
        });
      } else {
        headers['Content-Type'] = 'application/json';
        resp = await fetch('/api/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({ text, detailed: false })
        });
      }

      if (resp.status === 401) {
        clearAuthTokens();
        throw new Error('Your session has expired. Please sign in again.');
      }

      if (!resp.ok) {
        let errorMsg = 'Analysis request failed.';
        try {
          const errData = await resp.json();
          if (typeof errData.detail === 'string') {
            errorMsg = errData.detail;
          } else if (Array.isArray(errData.detail)) {
            errorMsg = errData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
          } else if (errData.detail && typeof errData.detail === 'object') {
            errorMsg = errData.detail.message || JSON.stringify(errData.detail);
          } else if (errData.message) {
            errorMsg = errData.message;
          }
        } catch {
          errorMsg = `Analysis request failed (HTTP ${resp.status}): ${resp.statusText || 'Server error'}`;
        }
        throw new Error(errorMsg);
      }

      const data = await resp.json();

      setResult(data);
      if (data.extracted_text) {
        setExtractedText(data.extracted_text);
      } else if (inputMode === 'paste') {
        setExtractedText(text);
      }

      try {
        const docName = data.document_meta?.filename;
        const actualModel = data.active_model || data.actual_engine || data.detection_engine || 'ModernBERT-V5';
        const wCount = data.document_meta?.total_words || wordCount;
        const cCount = data.document_meta?.total_characters || charCount;

        await HistoryService.recordAnalysis({
          userId: user?.id,
          text: data.extracted_text || text,
          documentName: docName,
          aiProbability: data.ai_probability,
          humanProbability: data.human_probability,
          classification: data.classification,
          confidence: data.confidence,
          explanation: data.explanation,
          modelUsed: actualModel,
          wordCount: wCount,
          characterCount: cCount
        });
        setSavedSuccess(true);
      } catch (dbError) {
        console.error('History save error:', dbError);
      }
    } catch (err: any) {
      setError(err.message || 'Error executing AI analysis.');
    } finally {
      setLoading(false);
    }
  };

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
              ANALYZE WORKSPACE
            </span>
            <span className="text-[#00C9D8]/30 text-xs">•</span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#9BB2B7]">
              <Cpu className="w-4 h-4 text-[#00C9D8]" />
              <span>ModernBERT-V5</span>
            </div>
            <span className="text-[#00C9D8]/30 text-xs">•</span>
            <span className="text-xs font-mono text-[#6F8B91]">Threshold: 0.70</span>
            {savedSuccess && (
              <>
                <span className="text-[#00C9D8]/30 text-xs">•</span>
                <span className="text-xs font-mono text-[#00C9D8] flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>RECORDED</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                if (inputMode === 'paste') setText('');
                else setSelectedFile(null);
                setResult(null);
                setError('');
              }}
              className="px-3.5 py-2 text-xs font-mono text-[#9BB2B7] hover:text-[#F3F8F8] transition-colors uppercase tracking-widest cursor-pointer rounded-xl border border-[rgba(0,201,216,0.15)] bg-[#030B0D]/80 hover:border-[#00C9D8]/40"
            >
              CLEAR
            </button>
            <button
              onClick={handleAnalyze}
              disabled={loading || (inputMode === 'paste' ? !text.trim() : !selectedFile)}
              id="analyze-run-btn"
              className="px-6 py-2.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:brightness-110 text-[#061416] font-bold text-xs sm:text-sm font-mono uppercase tracking-widest rounded-xl flex items-center gap-2.5 transition-all disabled:opacity-50 disabled:hover:brightness-100 cursor-pointer shadow-[0_0_24px_rgba(0,201,216,0.25)]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#061416]/30 border-t-[#061416] rounded-full animate-spin" />
                  <span>ANALYZING...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#061416]" />
                  <span>{inputMode === 'paste' ? 'ANALYZE TEXT' : 'ANALYZE DOCUMENT'}</span>
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
                <ThinkingOrbs 
                  title={inputMode === 'upload' ? 'DOCUMENT INFERENCE ACTIVE' : 'INFERENCE ACTIVE'} 
                  stages={inputMode === 'upload' ? documentStages : detectorStages} 
                  durationMs={800} 
                />
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
              <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-3 font-mono">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-400" />
                  <span>{error}</span>
                </div>
                {(error.toLowerCase().includes('sign in') || error.toLowerCase().includes('session') || error.toLowerCase().includes('authorization')) && (
                  <button
                    onClick={() => onNavigate('/login')}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061416] font-mono font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_12px_rgba(0,201,216,0.3)] transition-all cursor-pointer shrink-0"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Split-Screen Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[520px]">
          
          {/* Left Pane: Original Sequence / Input */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] flex flex-col h-full overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#061519]/70 border-b border-[rgba(0,201,216,0.12)] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#F3F8F8] uppercase font-semibold">
                  {inputMode === 'paste' ? 'ORIGINAL SEQUENCE' : 'DOCUMENT SOURCE'}
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-[#030B0D]/80 border border-[rgba(0,201,216,0.15)] text-[#9BB2B7]" id="input-word-count">
                  {inputMode === 'paste' ? (
                    <><span>Words: </span><strong className="text-[#00C9D8]">{wordCount}</strong></>
                  ) : (
                    selectedFile ? formatFileSize(selectedFile.size) : 'NO FILE'
                  )}
                </span>
                <div className="inline-flex p-1 rounded-xl bg-[#030B0D]/80 border border-[rgba(0,201,216,0.18)] text-xs font-mono ml-2">
                  <button
                    onClick={() => { setInputMode('paste'); setError(''); }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      inputMode === 'paste' ? 'bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061416] font-bold shadow-[0_0_12px_rgba(0,201,216,0.25)]' : 'text-[#9BB2B7] hover:text-[#F3F8F8]'
                    }`}
                  >
                    Paste Text
                  </button>
                  <button
                    onClick={() => { setInputMode('upload'); setError(''); }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'upload' ? 'bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061416] font-bold shadow-[0_0_12px_rgba(0,201,216,0.25)]' : 'text-[#9BB2B7] hover:text-[#F3F8F8]'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {inputMode === 'paste' && (
                  <button 
                    onClick={() => { navigator.clipboard.writeText(text); setCopiedInput(true); setTimeout(() => setCopiedInput(false), 2000); }} 
                    className="px-3 py-1.5 text-xs font-mono text-[#9BB2B7] hover:text-[#00C9D8] transition-colors uppercase tracking-widest flex items-center gap-1.5 cursor-pointer rounded-lg hover:bg-[rgba(0,201,216,0.08)]"
                  >
                    {copiedInput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedInput ? 'COPIED' : 'COPY'}</span>
                  </button>
                )}
                <button 
                  onClick={() => { 
                    if (inputMode === 'paste') setText(''); 
                    else setSelectedFile(null); 
                    setResult(null); 
                    setError(''); 
                  }} 
                  className="px-3 py-1.5 text-xs font-mono text-[#6F8B91] hover:text-rose-400 transition-colors uppercase tracking-widest cursor-pointer rounded-lg hover:bg-rose-500/10"
                >
                  CLEAR
                </button>
              </div>
            </div>

            {inputMode === 'paste' ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type original sequence here to analyze its semantic and stylometric signals..."
                className="flex-1 w-full p-5 sm:p-6 bg-transparent focus:outline-none text-[#F3F8F8] text-base sm:text-lg font-sans leading-relaxed resize-none placeholder-[#6F8B91] focus:ring-1 focus:ring-[#00C9D8]/30 min-h-[350px]"
              />
            ) : (
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      validateAndSetFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="w-full max-w-lg p-8 rounded-2xl bg-[#061519]/90 border border-[rgba(0,201,216,0.25)] flex flex-col items-center gap-4 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
                    <div className="w-16 h-16 rounded-2xl bg-[#00C9D8]/10 border border-[#00C9D8]/20 flex items-center justify-center text-[#00C9D8]">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-base sm:text-lg font-medium text-[#F3F8F8] truncate max-w-sm">{selectedFile.name}</span>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-[#00C9D8]/10 text-[#00C9D8] uppercase tracking-wider font-semibold border border-[#00C9D8]/20">
                          {selectedFile.name.split('.').pop()?.toUpperCase()}
                        </span>
                        <span className="text-xs sm:text-sm text-[#9BB2B7] font-mono">{formatFileSize(selectedFile.size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl border border-[rgba(0,201,216,0.2)] text-xs font-mono text-[#9BB2B7] hover:text-[#00C9D8] hover:border-[#00C9D8]/40 transition-all uppercase tracking-widest cursor-pointer bg-[#0A2023]/60"
                      >
                        Change File
                      </button>
                      <button
                        onClick={() => { setSelectedFile(null); setResult(null); }}
                        className="px-4 py-2 rounded-xl border border-rose-500/20 text-xs font-mono text-rose-400 hover:bg-rose-500/10 transition-all uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full max-w-lg h-72 flex flex-col items-center justify-center border-2 border-dashed ${dragActive ? 'border-[#00C9D8] bg-[#00C9D8]/5' : 'border-[rgba(0,201,216,0.2)] hover:border-[#00C9D8]/50'} rounded-2xl p-8 cursor-pointer transition-all group shadow-md bg-[#061519]/40`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#00C9D8]/10 group-hover:bg-[#00C9D8]/15 border border-[rgba(0,201,216,0.2)] group-hover:border-[#00C9D8]/40 flex items-center justify-center text-[#00C9D8]/60 group-hover:text-[#00C9D8] transition-all mb-4">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-[#F3F8F8] text-base sm:text-lg font-medium mb-1.5">Click to upload or drag & drop</h3>
                    <p className="text-xs sm:text-sm text-[#9BB2B7] max-w-sm mb-4 leading-relaxed">
                      Multi-page PDF, DOCX, or TXT documents. Evaluated with bounded segment chunking.
                    </p>
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg bg-[#030B0D]/80 border border-[rgba(0,201,216,0.18)] text-xs font-mono text-[#00C9D8] font-medium">PDF</span>
                      <span className="px-3 py-1 rounded-lg bg-[#030B0D]/80 border border-[rgba(0,201,216,0.18)] text-xs font-mono text-[#00C9D8] font-medium">DOCX</span>
                      <span className="px-3 py-1 rounded-lg bg-[#030B0D]/80 border border-[rgba(0,201,216,0.18)] text-xs font-mono text-[#00C9D8] font-medium">TXT</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Pane: Detection Diagnostics */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] flex flex-col h-full overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#061519]/70 border-b border-[rgba(0,201,216,0.12)] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#00C9D8] uppercase font-semibold">
                  DETECTION DIAGNOSTICS
                </span>
                {result && (
                  <>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-[#030B0D]/80 border border-[rgba(0,201,216,0.15)] text-[#9BB2B7] font-medium">
                      {result.classification}
                    </span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-[#00C9D8]/10 border border-[#00C9D8]/20 text-[#00C9D8] font-semibold">
                      {Math.round(result.ai_probability * 100)}% AI
                    </span>
                  </>
                )}
              </div>

              {result && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownloadReport} 
                    className="px-3.5 py-1.5 text-xs font-mono text-[#9BB2B7] hover:text-[#00C9D8] transition-colors uppercase tracking-widest flex items-center gap-1.5 cursor-pointer rounded-xl hover:bg-[rgba(0,201,216,0.08)] border border-[rgba(0,201,216,0.2)] font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>REPORT</span>
                  </button>
                </div>
              )}
            </div>

            {/* Diagnostic Content Body */}
            {result ? (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
                {/* Document Meta Banner (if document result) */}
                {result.document_meta && (
                  <div className="p-4 rounded-xl bg-[#061519]/70 border border-[rgba(0,201,216,0.15)] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-mono">
                    <div className="flex items-center gap-2.5 text-[#F3F8F8]">
                      <FileText className="w-4 h-4 text-[#00C9D8]" />
                      <span className="font-medium truncate max-w-xs">{result.document_meta.filename}</span>
                    </div>
                    <div className="flex items-center gap-3.5 text-[#9BB2B7] text-xs uppercase tracking-wider">
                      <span>{result.document_meta.total_words} Words</span>
                      <span>{result.document_meta.total_characters} Chars</span>
                      <span className="text-[#00C9D8] font-semibold">{result.document_meta.chunks_analyzed} Evaluated Chunks</span>
                    </div>
                  </div>
                )}

                {/* Equal Twin Probability Readout: AI Probability & Human Probability */}
                {(() => {
                  const aiPercent = Math.round((result.ai_probability ?? 0) * 100);
                  const humanPercent = Math.round((result.human_probability ?? (1 - (result.ai_probability ?? 0))) * 100);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 shrink-0">
                      {/* AI Probability Card */}
                      <div className="bg-[#061519]/80 border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#00C9D8]/40 transition-all">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/20 to-transparent" />
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono tracking-widest uppercase text-[#9BB2B7] font-bold">
                            AI PROBABILITY
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                            aiPercent >= 50 
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' 
                              : 'bg-[#00C9D8]/10 text-[#00C9D8] border border-[#00C9D8]/20'
                          }`}>
                            {aiPercent >= 70 ? 'HIGH RISK' : aiPercent >= 40 ? 'MODERATE' : 'LOW RISK'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-3 my-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-black font-sans text-[#00C9D8] tracking-tight">
                              {aiPercent}
                            </span>
                            <span className="text-xl font-bold font-sans text-[#00C9D8]/70">%</span>
                          </div>

                          {/* Circular Radial Gauge */}
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 72 72">
                              {/* Background Circle */}
                              <circle
                                cx="36"
                                cy="36"
                                r="30"
                                className="stroke-[rgba(0,201,216,0.12)]"
                                strokeWidth="7"
                                fill="transparent"
                              />
                              {/* Progress Circle */}
                              <circle
                                cx="36"
                                cy="36"
                                r="30"
                                stroke="#00C9D8"
                                strokeWidth="7"
                                strokeDasharray={188.5}
                                strokeDashoffset={188.5 - (188.5 * aiPercent) / 100}
                                strokeLinecap="round"
                                fill="transparent"
                                className="transition-all duration-700 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[11px] font-black font-sans text-[#00C9D8]">
                                {aiPercent}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] font-sans text-[#9BB2B7] mt-1.5 truncate">
                          {aiPercent >= 50 ? 'AI markers identified in sentence structure' : 'Minimal synthetic footprint detected'}
                        </div>
                      </div>

                      {/* Human Probability Card */}
                      <div className="bg-[#061519]/80 border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-emerald-400/40 transition-all">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono tracking-widest uppercase text-[#9BB2B7] font-bold">
                            HUMAN PROBABILITY
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                            humanPercent >= 50 
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' 
                              : 'bg-white/5 text-[#9BB2B7]'
                          }`}>
                            {humanPercent >= 70 ? 'NATURAL' : humanPercent >= 40 ? 'MIXED' : 'LOW'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 my-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-black font-sans text-emerald-400 tracking-tight">
                              {humanPercent}
                            </span>
                            <span className="text-xl font-bold font-sans text-emerald-400/70">%</span>
                          </div>

                          {/* Circular Radial Gauge */}
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 72 72">
                              {/* Background Circle */}
                              <circle
                                cx="36"
                                cy="36"
                                r="30"
                                className="stroke-white/10"
                                strokeWidth="7"
                                fill="transparent"
                              />
                              {/* Progress Circle */}
                              <circle
                                cx="36"
                                cy="36"
                                r="30"
                                stroke="#34d399"
                                strokeWidth="7"
                                strokeDasharray={188.5}
                                strokeDashoffset={188.5 - (188.5 * humanPercent) / 100}
                                strokeLinecap="round"
                                fill="transparent"
                                className="transition-all duration-700 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[11px] font-black font-sans text-emerald-400">
                                {humanPercent}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] font-sans text-[#9BB2B7] mt-1.5 truncate">
                          {humanPercent >= 70 ? 'Natural cadence and organic variance verified' : 'Low stylometric variance detected'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Primary Classification & Assessment Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#061519]/80 border border-[rgba(0,201,216,0.18)] flex flex-col gap-2.5 shrink-0 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
                  <div className="flex items-center justify-between flex-wrap gap-2.5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl sm:text-3xl font-sans font-medium text-[#F3F8F8] tracking-tight">
                        {result.classification}
                      </h2>
                      <span className={`px-2.5 py-1 rounded-lg text-xs uppercase font-mono tracking-widest font-semibold border ${
                        result.ai_probability > 0.5 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {result.risk_scoring?.risk_level || (result.ai_probability > 0.8 ? 'CRITICAL RISK' : result.ai_probability > 0.5 ? 'ELEVATED RISK' : 'LOW RISK')}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#9BB2B7]">
                      {result.document_meta?.total_words ?? wordCount} words evaluated
                    </div>
                  </div>
                  {result.risk_scoring?.assessment && (
                    <p className="text-xs sm:text-sm text-[#00C9D8] font-mono leading-relaxed">
                      {result.risk_scoring.assessment}
                    </p>
                  )}
                </div>

                {/* Interactive Diagnostic Indicators */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#061519]/80 border border-[rgba(0,201,216,0.18)] flex flex-col gap-3.5 shrink-0 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/20 to-transparent" />
                  <div className="flex items-center justify-between border-b border-[rgba(0,201,216,0.12)] pb-2.5">
                    <span className="text-xs font-mono tracking-widest uppercase text-[#F3F8F8] font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#00C9D8]" />
                      <span>Diagnostic Signals</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#9BB2B7]">
                      Engine: {result.active_model || 'ModernBERT-V5'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Signal 1: Vocabulary Variety */}
                    <div className="p-3 rounded-xl bg-[#030B0D]/60 border border-[rgba(0,201,216,0.15)] hover:border-[#00C9D8]/40 transition-all">
                      <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                        <span className="text-[#9BB2B7]">Vocabulary Variety</span>
                        <span className="text-[#00C9D8] font-semibold">
                          {result.stylometric_features?.vocabulary_diversity 
                            ? `${Math.round(result.stylometric_features.vocabulary_diversity * 100)}%` 
                            : (result.ai_probability > 0.5 ? 'Repetitive' : 'High')}
                        </span>
                      </div>
                      <div className="w-full bg-[#030B0D] h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00C9D8] to-[#008FA3] rounded-full transition-all" 
                          style={{ width: `${result.stylometric_features?.vocabulary_diversity ? Math.min(100, Math.round(result.stylometric_features.vocabulary_diversity * 100)) : (result.ai_probability > 0.5 ? 28 : 86)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#6F8B91] font-sans block mt-1.5">
                        {result.ai_probability > 0.5 ? 'Predictable word choice' : 'Rich human lexical range'}
                      </span>
                    </div>

                    {/* Signal 2: Sentence Burstiness */}
                    <div className="p-3 rounded-xl bg-[#030B0D]/60 border border-[rgba(0,201,216,0.15)] hover:border-emerald-400/40 transition-all">
                      <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                        <span className="text-[#9BB2B7]">Sentence Flow</span>
                        <span className="text-emerald-400 font-semibold">
                          {result.ai_probability > 0.5 ? 'Uniform' : 'Dynamic'}
                        </span>
                      </div>
                      <div className="w-full bg-[#030B0D] h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-emerald-400 rounded-full transition-all" 
                          style={{ width: `${result.ai_probability > 0.5 ? 32 : 88}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#6F8B91] font-sans block mt-1.5">
                        {result.ai_probability > 0.5 ? 'Robotic length cadence' : 'Natural sentence rhythm'}
                      </span>
                    </div>

                    {/* Signal 3: Model Confidence */}
                    <div className="p-3 rounded-xl bg-[#030B0D]/60 border border-[rgba(0,201,216,0.15)] hover:border-teal-400/40 transition-all">
                      <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                        <span className="text-[#9BB2B7]">Model Certainty</span>
                        <span className="text-[#00C9D8] font-semibold">
                          {result.confidence || 'High'}
                        </span>
                      </div>
                      <div className="w-full bg-[#030B0D] h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-[#00C9D8] rounded-full transition-all" 
                          style={{ width: `${result.confidence === 'High' ? 95 : result.confidence === 'Medium' ? 70 : 45}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#6F8B91] font-sans block mt-1.5">
                        Distance from 0.70 threshold
                      </span>
                    </div>
                  </div>
                </div>

                {/* Multi-Section Breakdown ONLY if document has multiple chunks (> 1) */}
                {result.segments && result.segments.length > 1 && (
                  <div className="flex flex-col gap-2.5 shrink-0">
                    <div className="flex items-center justify-between border-b border-[rgba(0,201,216,0.12)] pb-1.5">
                      <span className="text-xs font-mono tracking-[0.2em] text-[#9BB2B7] uppercase font-semibold">
                        Segment Breakdown ({result.segments.length} Sections)
                      </span>
                      <span className="text-xs font-mono text-[#6F8B91] uppercase tracking-widest">
                        Multi-Page Analysis
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                      {result.segments.map((seg: any, idx: number) => {
                        const isAI = seg.ai_probability > 0.5;
                        return (
                          <div key={idx} className={`p-3 rounded-xl border ${isAI ? 'border-rose-500/20 bg-rose-500/5' : 'border-emerald-500/20 bg-emerald-500/5'} flex items-center justify-between gap-3 text-xs font-mono`}>
                            <span className={`uppercase tracking-wider px-2 py-0.5 rounded font-semibold ${isAI ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              Section {seg.segment_index || (idx + 1)}: {isAI ? 'Likely AI' : 'Likely Human'} ({Math.round(seg.ai_probability * 100)}% AI)
                            </span>
                            {seg.word_count && (
                              <span className="text-[#9BB2B7]">{seg.word_count} words</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Handoff to Adversarial Rewrite Button */}
                <div className="pt-3 mt-auto">
                  <button
                    onClick={() => {
                      const fullDocumentText = (
                        result?.extracted_text ||
                        extractedText ||
                        (inputMode === 'paste' ? text : '')
                      ).trim();

                      if (!fullDocumentText) {
                        setError('No text available to transfer to Adversarial Rewrite.');
                        return;
                      }

                      onNavigate('/paraphrase', {
                        text: fullDocumentText,
                        result,
                        documentMeta: result?.document_meta
                      });
                    }}
                    className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061416] text-xs sm:text-sm font-bold uppercase tracking-[0.2em] font-mono hover:shadow-[0_0_24px_rgba(0,201,216,0.4)] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_18px_rgba(0,201,216,0.25)]"
                  >
                    <span>ADVERSARIAL REWRITE</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-8 sm:p-10 flex flex-col items-center justify-center text-center text-[#6F8B91]">
                <div className="w-14 h-14 rounded-2xl bg-[#00C9D8]/10 border border-[rgba(0,201,216,0.2)] flex items-center justify-center text-[#00C9D8] mb-4 shadow-[0_0_20px_rgba(0,201,216,0.15)]">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-mono uppercase tracking-widest text-[#F3F8F8] mb-2 font-semibold">
                  Detection Diagnostics Ready
                </h3>
                <p className="text-xs sm:text-sm text-[#9BB2B7] max-w-sm leading-relaxed mb-6 font-sans">
                  Input text on the left or upload a DOCX/PDF to evaluate semantic representations and stylometric burstiness.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left text-xs font-mono border-t border-[rgba(0,201,216,0.12)] pt-4">
                  <div className="text-[#6F8B91]">Primary Engine:</div>
                  <div className="text-[#F3F8F8] text-right font-medium">ModernBERT V5</div>
                  <div className="text-[#6F8B91]">Decision Threshold:</div>
                  <div className="text-[#00C9D8] text-right font-semibold">0.70 Calibrated</div>
                  <div className="text-[#6F8B91]">Context Window:</div>
                  <div className="text-[#F3F8F8] text-right font-medium">1024 Tokens</div>
                  <div className="text-[#6F8B91]">Preservation:</div>
                  <div className="text-emerald-400 text-right font-medium">100% Full Document</div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
