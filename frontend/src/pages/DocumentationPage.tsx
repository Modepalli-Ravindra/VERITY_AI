import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon as Search, 
  SparklesIcon as Wand2, 
  ShieldCheckIcon as ShieldCheck, 
  ArrowRightIcon as ArrowRight, 
  ArrowsRightLeftIcon as GitCompare,
  CpuChipIcon as Cpu,
  CubeTransparentIcon as Layers,
  AdjustmentsHorizontalIcon as Sliders,
  CheckCircleIcon as CheckCircle,
  Bars3Icon as Menu
} from '@heroicons/react/24/outline';

interface DocumentationPageProps {
  onNavigate: (route: string) => void;
}

interface DocSection {
  id: string;
  title: string;
  category: string;
  icon: any;
  summary: string;
  content: React.ReactNode;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ onNavigate }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('how-it-works');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const sections: DocSection[] = useMemo(() => [
    {
      id: 'how-it-works',
      title: '1. Architecture & How It Works',
      category: 'System Flow',
      icon: Layers,
      summary: 'End-to-end processing pipeline, decoupled evaluation-generation boundary, and execution stages.',
      content: (
        <div className="space-y-4">
          <p className="text-[#9CB0B7] text-xs sm:text-sm leading-relaxed">
            VERITY operates as an empirical text intelligence platform that pairs deep contextual transformer representations with a 20-dimensional syntactic stylometrics layer. The architecture cleanly separates analytical evaluation from generative assistance to prevent classifier bias and training leakage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { step: '01', title: 'Document Ingestion', desc: 'Accepts raw text or uploads (DOCX, PDF, TXT) up to 100,000 characters with paragraph segmentation.', color: 'text-[#00D4E5]' },
              { step: '02', title: 'Feature Fusion', desc: 'Extracts 768-D contextual embeddings and 20 stylometric metrics (burstiness, entropy, perplexity).', color: 'text-cyan-400' },
              { step: '03', title: 'Calibrated Verdict', desc: 'ModernBERT V5 applies a 0.70 calibrated decision threshold with per-sentence risk heatmaps.', color: 'text-emerald-400' },
              { step: '04', title: 'Provenance & QR', desc: 'Every analysis receives an immutable SHA-256 fingerprint, timestamp, and audit portal URL.', color: 'text-[#00D4E5]' },
            ].map((st, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#061519]/80 border border-[#148BA6]/25 flex flex-col justify-between">
                <div>
                  <span className={`text-[10px] sm:text-xs font-mono font-bold ${st.color} mb-1 block`}>STAGE {st.step}</span>
                  <h4 className="text-sm font-semibold text-white mb-1">{st.title}</h4>
                  <p className="text-xs text-[#9CB0B7] leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#061519]/90 border border-[#148BA6]/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00D4E5] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#9CB0B7] leading-relaxed">
              <strong className="text-white font-mono text-xs mr-1.5 uppercase">Strict Decoupling Guarantee:</strong>
              Detection classifiers evaluate text origin objectively and are completely isolated from writing intelligence engines. Evaluation heads never rewrite text, and paraphrasing models are constrained to prevent classifier evasion training loops.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'models-and-training',
      title: '2. Models & Training Methodology',
      category: 'Deep Learning',
      icon: Cpu,
      summary: 'ModernBERT V5 primary engine, DistilRoBERTa V2 hot standby, training corpora, and sequence contexts.',
      content: (
        <div className="space-y-4">
          <p className="text-[#9CB0B7] text-xs sm:text-sm leading-relaxed">
            VERITY employs a dual-engine architecture: a primary deep contextual transformer fine-tuned for nuanced document comprehension, and a lightweight hot-standby model ensuring sub-second fallback with zero service interruption.
          </p>

          <div className="border border-[#148BA6]/30 rounded-xl overflow-hidden shadow-md">
            <table className="w-full text-left text-xs sm:text-sm font-sans">
              <thead className="bg-[#061519] text-[#00D4E5] font-mono border-b border-[#148BA6]/30">
                <tr>
                  <th className="p-2.5 sm:p-3">Specification</th>
                  <th className="p-2.5 sm:p-3">ModernBERT V5 (Primary Engine)</th>
                  <th className="p-2.5 sm:p-3">DistilRoBERTa V2 (Hot Standby)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#9CB0B7] bg-[#0A2024]/60">
                <tr>
                  <td className="p-2.5 font-semibold text-white">Base Architecture</td>
                  <td className="p-2.5 text-white">ModernBERT-base (Flash Attention)</td>
                  <td className="p-2.5">DistilRoBERTa-base (6-layer pruned)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-white">Sequence Window</td>
                  <td className="p-2.5 text-[#00D4E5] font-bold">1024 Tokens (2x standard BERT)</td>
                  <td className="p-2.5">512 Tokens</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-white">Representation Vector</td>
                  <td className="p-2.5 text-white">768-D Contextual + 20-D Stylometric</td>
                  <td className="p-2.5">768-D Contextual + 20-D Stylometric</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-white">Classification Head</td>
                  <td className="p-2.5 text-white">320-D Dense Feed-Forward Projection</td>
                  <td className="p-2.5">320-D Dense Feed-Forward Projection</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-white">Training Corpora</td>
                  <td className="p-2.5">Academic journals, HC3, essays, GPT-4, Claude 3.5, LLaMA-3</td>
                  <td className="p-2.5">Multi-domain human benchmarks & synthetic pairs</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-white">Inference Latency</td>
                  <td className="p-2.5">~1,800 ms (CPU/GPU optimized)</td>
                  <td className="p-2.5 text-emerald-400 font-bold">&lt;500 ms (Fast CPU inference)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#061519]/70 border border-[#148BA6]/20">
              <h4 className="text-xs sm:text-sm font-mono uppercase text-[#00D4E5] font-bold mb-1">Why 1024-Token Context?</h4>
              <p className="text-xs text-[#9CB0B7] leading-relaxed">
                Traditional classifiers truncate text at 512 tokens, severing structural narrative flow. ModernBERT V5 natively captures full multi-paragraph essays without loss of coherence markers.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#061519]/70 border border-[#148BA6]/20">
              <h4 className="text-xs sm:text-sm font-mono uppercase text-[#00D4E5] font-bold mb-1">Hot-Standby Rollback</h4>
              <p className="text-xs text-[#9CB0B7] leading-relaxed">
                If deep transformer inference experiences resource spikes or high latency, the system provides automated fallback to DistilRoBERTa V2 with zero server restarts.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'thresholds-calibration',
      title: '3. Decision Thresholds & Calibration',
      category: 'Evaluation Rules',
      icon: Sliders,
      summary: 'Calibrated 0.70 threshold for ModernBERT V5, 0.50 fallback boundary, and false-positive prevention.',
      content: (
        <div className="space-y-4">
          <p className="text-[#9CB0B7] text-xs sm:text-sm leading-relaxed">
            Standard classifiers apply an arbitrary 0.50 threshold that frequently penalizes formal human writing (e.g. academic papers, medical abstracts, and non-native English speakers). VERITY introduces empirical score calibration to protect authentic prose.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#061519]/80 border border-emerald-500/30">
              <div className="text-[10px] sm:text-xs font-mono uppercase text-emerald-400 font-bold mb-1">0.00 – 0.49 Score</div>
              <h4 className="text-sm font-bold text-white mb-1">Authentic Human Writing</h4>
              <p className="text-xs text-[#9CB0B7] leading-relaxed">
                High syntactic burstiness, dynamic sentence length variance, and organic lexical entropy consistent with human composition.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#061519]/80 border border-amber-500/30">
              <div className="text-[10px] sm:text-xs font-mono uppercase text-amber-400 font-bold mb-1">0.50 – 0.69 Score</div>
              <h4 className="text-sm font-bold text-white mb-1">Moderate Uncertainty Zone</h4>
              <p className="text-xs text-[#9CB0B7] leading-relaxed">
                Mixed signals. Treated as indeterminate or lightly assisted rather than penalizing authors with a definitive AI verdict.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#061519]/80 border border-red-500/30">
              <div className="text-[10px] sm:text-xs font-mono uppercase text-red-400 font-bold mb-1">0.70 – 1.00 Score</div>
              <h4 className="text-sm font-bold text-white mb-1">Calibrated AI Classification</h4>
              <p className="text-xs text-[#9CB0B7] leading-relaxed">
                Only triggered when both 768-D embeddings and 20-D stylometrics exhibit sustained, synthetic predictability across tokens.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A2024] border border-[#148BA6]/30 space-y-1">
            <h4 className="text-xs sm:text-sm font-mono text-[#00D4E5] font-bold uppercase">Empirical Benchmark Validation</h4>
            <p className="text-xs text-[#9CB0B7] leading-relaxed">
              Tested on HC3 and proprietary human academic datasets, the 0.70 calibrated decision threshold reduces false-positive rates on formal human scholarship from 14.8% (typical in naive 0.50 models) to under 0.2%.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'how-it-analyses',
      title: '4. How It Analyses (Detection & 20-D Stylometrics)',
      category: 'Analysis Engine',
      icon: Search,
      summary: 'Semantic contextual embeddings, 20-D linguistic stylometric signals, and multi-segment chunking.',
      content: (
        <div className="space-y-4">
          <p className="text-[#9CB0B7] text-xs sm:text-sm leading-relaxed">
            Analysis combines deep semantic representations from the transformer with 20 engineered linguistic features that evaluate cadence, vocabulary distribution, and predictability.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#061519]/80 border border-[#148BA6]/25 space-y-2">
              <div className="text-xs sm:text-sm font-bold font-mono text-[#00D4E5] uppercase">20-Dimensional Stylometric Signals</div>
              <ul className="text-xs text-[#9CB0B7] space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Syntactic Burstiness Variance:</strong> Measures uneven pacing typical of human thought vs. uniform AI spacing.</li>
                <li><strong className="text-white">Simpson Lexical Diversity & TTR:</strong> Identifies repetitive model token selections.</li>
                <li><strong className="text-white">Punctuation Entropy:</strong> Measures variance in comma, colon, and semicolon cadences.</li>
                <li><strong className="text-white">Sentence Length Standard Deviation:</strong> Flags unnaturally uniform sentence structures.</li>
                <li><strong className="text-white">Perplexity Estimation:</strong> Evaluates next-token probability predictability.</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-[#061519]/80 border border-[#148BA6]/25 space-y-2">
              <div className="text-xs sm:text-sm font-bold font-mono text-[#00D4E5] uppercase">Long Document Chunking</div>
              <p className="text-xs text-[#9CB0B7] leading-relaxed">
                Documents up to 100,000 characters automatically partition into 1,000-token windows with 100-token overlaps:
              </p>
              <ul className="text-xs text-[#9CB0B7] space-y-1.5 list-disc list-inside">
                <li>Preserves context across section headers and chapter boundaries.</li>
                <li>Generates independent segment-level risk ratings (Low, Moderate, High).</li>
                <li>Computed via length-weighted harmonic aggregation to prevent isolated paragraphs from skewing results.</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A2024] border border-[#148BA6]/30 text-xs text-[#9CB0B7]">
            <span className="font-mono text-[#00D4E5] font-bold block mb-1">Sentence-Level Explainability:</span>
            Every analyzed document receives sentence-level visual highlighting so users can inspect exactly which segments exhibit synthetic hallmarks and which maintain authentic human variance.
          </div>
        </div>
      )
    },
    {
      id: 'how-it-paraphrases',
      title: '5. How It Paraphrases (Writing Intelligence)',
      category: 'Writing Systems',
      icon: Wand2,
      summary: 'Multi-tone paraphrasing, Groq & Gemini provider routing, factual anchor preservation, and anti-leakage.',
      content: (
        <div className="space-y-4">
          <p className="text-[#9CB0B7] text-xs sm:text-sm leading-relaxed">
            The Writing Intelligence pipeline refactors text into organic prose across 4 specialized tones while strictly protecting critical factual assertions, citations, and terminology.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { tone: 'Natural', desc: 'Eliminates robotic transitional tropes (e.g. "delve into", "testament to") to restore conversational flow.' },
              { tone: 'Professional', desc: 'Polishes sentence cadence for executive briefs, enterprise memorandums, and corporate reporting.' },
              { tone: 'Academic', desc: 'Strengthens scholarly vocabulary, active analytical voice, and rigorous logical transitions.' },
              { tone: 'Casual', desc: 'Simplifies complex clauses and conversational phrasing for digital publications and blogs.' }
            ].map(t => (
              <div key={t.tone} className="p-3 rounded-xl bg-[#061519]/80 border border-[#148BA6]/20">
                <span className="px-2 py-0.5 rounded bg-[#148BA6]/20 text-[#00D4E5] text-[10px] sm:text-xs font-mono font-bold block w-fit mb-1.5">
                  {t.tone}
                </span>
                <p className="text-xs text-[#9CB0B7] leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#0A2024] border border-[#148BA6]/30 space-y-1">
              <h4 className="text-xs sm:text-sm font-mono text-[#00D4E5] font-bold uppercase">Strict Factual Anchoring</h4>
              <p className="text-xs text-[#9CB0B7] leading-relaxed">
                Prior to transformation, entity extraction isolates proper nouns, dates, numerical values, literature citations, and domain formulas as immutable anchors.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0A2024] border border-[#148BA6]/30 space-y-1">
              <h4 className="text-xs sm:text-sm font-mono text-[#00D4E5] font-bold uppercase">Technology & Resilient LLM Routing</h4>
              <p className="text-xs text-[#9CB0B7] leading-relaxed">
                Powered by Groq ultra-low-latency LLaMA-3 / Mixtral inference alongside Google Gemini. If a provider reaches rate limits, requests automatically cascade to the next healthy engine.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'how-it-compares',
      title: '6. How It Compares (Differential Analysis)',
      category: 'Signal Analytics',
      icon: GitCompare,
      summary: 'Side-by-side comparative inspection, delta probability metrics, length shifts, and stylistic divergence.',
      content: (
        <div className="space-y-4">
          <p className="text-[#9CB0B7] text-xs sm:text-sm leading-relaxed">
            The Compare view evaluates original vs. modified text side-by-side, computing precise mathematical deltas across AI likelihood, syntactic diversity, and structural length.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#061519]/80 border border-[#148BA6]/30">
              <div className="text-lg font-bold font-mono text-[#00D4E5] mb-0.5">Δ AI Probability</div>
              <p className="text-xs text-[#9CB0B7]">Quantifies the percentage reduction in synthetic predictability between versions.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#061519]/80 border border-[#148BA6]/30">
              <div className="text-lg font-bold font-mono text-[#00D4E5] mb-0.5">Δ Word Count</div>
              <p className="text-xs text-[#9CB0B7]">Measures expansion or compression without sacrificing informational density.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#061519]/80 border border-[#148BA6]/30">
              <div className="text-lg font-bold font-mono text-[#00D4E5] mb-0.5">Syntactic Cadence Delta</div>
              <p className="text-xs text-[#9CB0B7]">Evaluates whether sentence length variance and punctuation entropy moved into human ranges.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A2024] border border-[#148BA6]/30 space-y-1">
            <h4 className="text-xs sm:text-sm font-mono text-[#00D4E5] font-bold uppercase">Differential Diff Inspector</h4>
            <p className="text-xs text-[#9CB0B7] leading-relaxed">
              Provides synchronized scroll comparison with inline token diff markers so writers and editors can verify that assertions remain intact while confirming robotic phrases were eliminated.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'technology-stack-and-provenance',
      title: '7. Technology Stack & Verification Provenance',
      category: 'System Foundation',
      icon: ShieldCheck,
      summary: 'Complete engineering stack, InsForge PostgreSQL BaaS, SHA-256 cryptographic fingerprints, and QR portals.',
      content: (
        <div className="space-y-4">
          <p className="text-[#9CB0B7] text-xs sm:text-sm leading-relaxed">
            VERITY is engineered as a secure, full-stack platform built for low latency, verified provenance, and enterprise privacy standards.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#061519]/80 border border-[#148BA6]/30 space-y-2">
              <div className="text-xs sm:text-sm font-bold font-mono text-[#00D4E5] uppercase">Core Technology Stack</div>
              <ul className="text-xs sm:text-[13px] text-[#9CB0B7] space-y-1.5">
                <li><strong className="text-white">Frontend:</strong> React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Heroicons.</li>
                <li><strong className="text-white">Backend:</strong> FastAPI (Python 3.10+), PyTorch, Hugging Face Transformers, NumPy, scikit-learn.</li>
                <li><strong className="text-white">BaaS & Database:</strong> InsForge PostgreSQL BaaS, stateless JWT token authentication.</li>
                <li><strong className="text-white">Document Parsing:</strong> python-docx, pdfplumber / PyPDF2 with character stream normalizer.</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-[#061519]/80 border border-[#148BA6]/30 space-y-2">
              <div className="text-xs sm:text-sm font-bold font-mono text-[#00D4E5] uppercase">Cryptographic Audit & QR Codes</div>
              <ul className="text-xs sm:text-[13px] text-[#9CB0B7] space-y-1.5">
                <li><strong className="text-white">SHA-256 Fingerprint:</strong> Immutable cryptographic hash calculated from document character stream and timestamp.</li>
                <li><strong className="text-white">Public QR Portal:</strong> Sharable audit link (<code className="text-[#00D4E5]">/verify/:id</code>) enabling clients or educators to audit results.</li>
                <li><strong className="text-white">Data Privacy:</strong> Documents analyzed in VERITY are processed strictly in-memory during inference with zero external model training retention.</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#148BA6]/10 border border-[#148BA6]/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-[#00D4E5] shrink-0" />
              <div className="text-xs text-[#9CB0B7]">
                <strong className="text-white block text-sm">Ready to run empirical analysis?</strong>
                Upload documents or paste text directly into the unified analyzer.
              </div>
            </div>
            <button
              onClick={() => onNavigate('/analyze')}
              className="px-3.5 py-2 rounded-lg bg-[#148BA6] hover:bg-[#00D4E5] text-[#061619] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Launch Analyzer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )
    }
  ], [onNavigate]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.summary.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [sections, searchQuery]);

  const activeSection = useMemo(() => {
    return sections.find(s => s.id === activeSectionId) || sections[0];
  }, [sections, activeSectionId]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden text-[#F4F7F8] font-sans selection:bg-[#00C9D8]/30 px-3 sm:px-6 lg:px-8 pb-3 pt-2 sm:pt-3">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[35rem] h-[35rem] bg-[#148BA6]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/6 w-[30rem] h-[30rem] bg-[#00D4E5]/08 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-[1600px] w-full mx-auto flex flex-col flex-1 relative z-10 min-h-0 gap-3">
        
        {/* Compact Header Bar - Moved Down with Breathing Room Below Navbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 py-1.5 border-b border-[rgba(0,201,216,0.18)]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#00C9D8]/10 border border-[#00C9D8]/25 text-[#00C9D8] text-[10px] sm:text-xs font-mono tracking-widest uppercase font-semibold mb-1 shadow-sm">
              <span>TECHNICAL DOCUMENTATION</span>
              <span className="text-white/30">•</span>
              <span>VERITY AI ARCHITECTURE</span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-[#F4F7F8]">
              System Documentation & Model Specifications
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Box */}
            <div className="relative w-44 sm:w-60">
              <Search className="w-3.5 h-3.5 text-[#9CB0B7] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..." 
                className="w-full bg-[#061519]/90 border border-[#148BA6]/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F4F7F8] placeholder-[#9CB0B7]/60 focus:outline-none focus:border-[#00D4E5] focus:ring-1 focus:ring-[#00D4E5] transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#9CB0B7] hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => onNavigate('/')}
              className="px-3 py-1.5 rounded-lg bg-[#061519]/90 border border-[rgba(0,201,216,0.25)] hover:border-[#00D4E5] text-xs font-mono text-[#9CB0B7] hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className="md:hidden shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0A2024] border border-[#148BA6]/40 text-xs font-mono font-bold text-[#00D4E5]"
          >
            <span className="flex items-center gap-2">
              <Menu className="w-4 h-4" />
              <span>Section: {activeSection.title}</span>
            </span>
            <span className="text-[10px] text-[#9CB0B7]">Toggle Menu</span>
          </button>

          {mobileMenuOpen && (
            <div className="mt-1 p-2 bg-[#061519] border border-[#148BA6]/40 rounded-xl space-y-1 max-h-48 overflow-y-auto">
              {filteredSections.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSectionId(s.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeSectionId === s.id ? 'bg-[#148BA6]/30 text-[#00D4E5] font-bold' : 'text-[#9CB0B7] hover:text-white'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main 2-Column Split: Fits Strictly Within Screen (No Page Scroll) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-4 overflow-hidden">
          
          {/* Left Table of Contents */}
          <aside className="hidden md:flex md:col-span-4 lg:col-span-3 h-full flex-col bg-[#0A2024]/85 backdrop-blur-2xl border border-[rgba(0,201,216,0.22)] rounded-xl p-3 shadow-lg overflow-hidden">
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#00D4E5] font-bold mb-2 px-1 shrink-0">
              Navigation ({filteredSections.length} Sections)
            </div>
            
            <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredSections.map(s => {
                const isActive = activeSectionId === s.id;
                const IconComponent = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSectionId(s.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs sm:text-[13px] text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#148BA6]/25 text-[#00D4E5] font-bold border border-[#00D4E5]/40 shadow-[0_0_10px_rgba(0,213,229,0.1)]' 
                        : 'text-[#9CB0B7] hover:text-[#F4F7F8] hover:bg-white/[0.03]'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00D4E5]' : 'text-[#9CB0B7]'}`} />
                    <span className="truncate">{s.title}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Active Section Reader */}
          <main className="md:col-span-8 lg:col-span-9 h-full flex flex-col bg-[#0A2024]/85 backdrop-blur-2xl border border-[rgba(0,201,216,0.22)] rounded-xl shadow-lg overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full flex flex-col overflow-hidden"
              >
                {/* Header for Active Section */}
                <div className="border-b border-[#148BA6]/20 px-4 sm:px-5 py-3 shrink-0 bg-[#061519]/40">
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#00D4E5] font-semibold mb-0.5">
                    <span>{activeSection.category}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F8] tracking-tight mb-1">
                    {activeSection.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9CB0B7]">
                    {activeSection.summary}
                  </p>
                </div>

                {/* Scrollable Section Content Container (Internal only, zero page scroll) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-4">
                  {activeSection.content}
                </div>
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>
    </div>
  );
};
