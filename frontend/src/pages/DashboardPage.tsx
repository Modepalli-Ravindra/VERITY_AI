import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, getUserDisplayName } from '../context/AuthContext';
import {
  MagnifyingGlassIcon as Search,
  SparklesIcon as Wand2,
  ChartBarSquareIcon as Activity,
  ArrowRightIcon as ArrowRight,
  ShieldCheckIcon as ShieldCheck,
  CpuChipIcon as Cpu,
  ArrowPathIcon as RefreshCw,
  ClockIcon as Clock,
  DocumentTextIcon as FileText,
  CheckCircleIcon as CheckCircle,
  AdjustmentsHorizontalIcon as Adjustments
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { HistoryService, type DashboardTelemetry } from '../services/historyService';

interface DashboardPageProps {
  onNavigate: (route: string, state?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [telemetry, setTelemetry] = useState<DashboardTelemetry>({
    totalAnalyses: 0,
    aiDetected: 0,
    humanDetected: 0,
    paraphrases: 0,
    comparisons: 0,
    activeModelName: 'ModernBERT V5 + Stylometrics',
    activeModelVersion: 'V5 Advanced',
    activeThreshold: 0.70,
    recentActivity: [],
    volumeByDay: [
      { label: 'Mon', count: 0, height: 12, dateStr: '' },
      { label: 'Tue', count: 0, height: 12, dateStr: '' },
      { label: 'Wed', count: 0, height: 12, dateStr: '' },
      { label: 'Thu', count: 0, height: 12, dateStr: '' },
      { label: 'Fri', count: 0, height: 12, dateStr: '' },
      { label: 'Sat', count: 0, height: 12, dateStr: '' },
      { label: 'Sun', count: 0, height: 12, dateStr: '' },
    ],
    isEmpty: true
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await HistoryService.getDashboardTelemetry(user?.id);
      setTelemetry(data);
    } catch (err) {
      console.error('[Dashboard] Error loading telemetry:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
    const unsubscribe = HistoryService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const aiPercentage = telemetry.totalAnalyses > 0
    ? Math.round((telemetry.aiDetected / telemetry.totalAnalyses) * 100)
    : 0;

  const humanPercentage = telemetry.totalAnalyses > 0
    ? Math.round((telemetry.humanDetected / telemetry.totalAnalyses) * 100)
    : 0;

  return (
    <div className="flex-1 w-full text-[#F3F8F8] px-4 sm:px-6 lg:px-8 py-5 font-sans relative selection:bg-[#00C9D8]/30">
      
      {/* Precision Background Glows */}
      <div className="absolute top-[-100px] right-[-80px] w-[500px] h-[500px] bg-[#00C9D8]/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-100px] left-[-80px] w-[500px] h-[500px] bg-[#008FA3]/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-[1520px] mx-auto space-y-6">

        {/* 1. Header Bar with System Status & Fast Launchers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[rgba(0,201,216,0.14)]">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#F3F8F8] leading-tight">
              Welcome back, <span className="text-[#00C9D8] font-black">{getUserDisplayName(user)}</span>.
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[#9BB2B7] mt-1.5 font-sans font-medium">
              Live monitoring for semantic detection & adversarial evaluation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-[#07171B] border border-[rgba(0,201,216,0.22)] text-[#9BB2B7] hover:text-[#00C9D8] hover:border-[#00C9D8]/50 transition-all cursor-pointer shadow-sm"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00C9D8]' : ''}`} />
            </button>

            <button
              onClick={() => onNavigate('/paraphrase')}
              className="px-3.5 py-2 rounded-xl bg-[#07171B] border border-[rgba(0,201,216,0.22)] text-xs font-mono font-medium text-[#9BB2B7] hover:text-[#F3F8F8] hover:border-[#00C9D8]/45 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#00C9D8]" />
              <span>Adversarial Rewrite</span>
            </button>

            <button
              onClick={() => onNavigate('/compare')}
              className="px-3.5 py-2 rounded-xl bg-[#07171B] border border-[rgba(0,201,216,0.22)] text-xs font-mono font-medium text-[#9BB2B7] hover:text-[#F3F8F8] hover:border-[#00C9D8]/45 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Activity className="w-3.5 h-3.5 text-[#00C9D8]" />
              <span>Signal Compare</span>
            </button>

            <button
              onClick={() => onNavigate('/analyze')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#030B0D] font-bold text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_24px_rgba(0,201,216,0.28)]"
            >
              <Search className="w-3.5 h-3.5 text-[#030B0D]" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>

        {/* 2. Top Metric Cards Strip (Balanced 4-Card Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Metric 1: Total Processed */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#091D22]/85 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-[#00C9D8]/40 transition-all"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#9BB2B7] uppercase tracking-wider font-semibold">
                Total Evaluations
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#00C9D8]/10 border border-[#00C9D8]/20 flex items-center justify-center text-[#00C9D8]">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#F3F8F8] font-mono tracking-tight">
              {loading ? '—' : telemetry.totalAnalyses}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#9BB2B7] pt-2 border-t border-[rgba(0,201,216,0.08)]">
              <span>Analyses & Documents</span>
              <span className="text-[#00C9D8] font-bold">100% Verified</span>
            </div>
          </motion.div>

          {/* Metric 2: Detection Ratio */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#091D22]/85 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-[#00C9D8]/40 transition-all"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#9BB2B7] uppercase tracking-wider font-semibold">
                Classification Split
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#00C9D8]/10 border border-[#00C9D8]/20 flex items-center justify-center text-[#00C9D8]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 text-2xl font-extrabold font-mono tracking-tight">
              <span className="text-amber-400">{telemetry.aiDetected} AI</span>
              <span className="text-[#9BB2B7]/30 text-lg font-light">/</span>
              <span className="text-[#00C9D8]">{telemetry.humanDetected} Human</span>
            </div>
            <div className="mt-3 w-full bg-[#030A0C] h-2 rounded-full overflow-hidden flex border border-[rgba(0,201,216,0.15)]">
              <div style={{ width: `${aiPercentage}%` }} className="bg-amber-400 h-full transition-all duration-500" title={`AI: ${aiPercentage}%`} />
              <div style={{ width: `${humanPercentage}%` }} className="bg-[#00C9D8] h-full transition-all duration-500" title={`Human: ${humanPercentage}%`} />
            </div>
          </motion.div>

          {/* Metric 3: Transformations */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#091D22]/85 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-[#00C9D8]/40 transition-all"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#9BB2B7] uppercase tracking-wider font-semibold">
                Rewrites & Benchmarks
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#00C9D8]/10 border border-[#00C9D8]/20 flex items-center justify-center text-[#00C9D8]">
                <Wand2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#F3F8F8] font-mono tracking-tight">
              {loading ? '—' : telemetry.paraphrases + telemetry.comparisons}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#9BB2B7] pt-2 border-t border-[rgba(0,201,216,0.08)]">
              <span>{telemetry.paraphrases} Rewrites</span>
              <span>{telemetry.comparisons} Comparisons</span>
            </div>
          </motion.div>

          {/* Metric 4: Primary Active Engine */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#091D22]/85 backdrop-blur-xl border border-[#00C9D8]/35 rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-[#00C9D8]/60 transition-all"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/60 to-transparent" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#00C9D8] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>Active Detection Engine</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-[#00C9D8] px-1.5 py-0.5 rounded bg-[#00C9D8]/15 border border-[#00C9D8]/30">
                θ={telemetry.activeThreshold.toFixed(2)}
              </span>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-[#F3F8F8] font-mono tracking-tight truncate">
              {telemetry.activeModelName}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#9BB2B7] pt-2 border-t border-[rgba(0,201,216,0.12)]">
              <span className="text-[#00C9D8]">{telemetry.activeModelVersion}</span>
              <span>768D+20D Fusion</span>
            </div>
          </motion.div>

        </div>

        {/* 3. Deep Architectural Spec Strip */}
        <div className="bg-[#07161A]/90 border border-[rgba(0,201,216,0.16)] rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00C9D8]/10 border border-[#00C9D8]/25 flex items-center justify-center text-[#00C9D8] shrink-0">
                <Adjustments className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F3F8F8] font-mono uppercase tracking-wider">
                  Trained Architecture: ModernBERT V5 + Stylometric Fusion
                </h3>
                <p className="text-xs text-[#9BB2B7] mt-0.5 font-sans">
                  Fuses 768-D ModernBERT contextual embeddings with 20-D syntactic stylometrics into a learned 320-D classification space.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-[#030A0C] border border-[rgba(0,201,216,0.15)] flex items-center gap-2">
                <span className="text-[#9BB2B7]">In-Domain F1:</span>
                <span className="text-[#00C9D8] font-bold">99.8%</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#030A0C] border border-[rgba(0,201,216,0.15)] flex items-center gap-2">
                <span className="text-[#9BB2B7]">Out-Of-Domain F1:</span>
                <span className="text-[#00C9D8] font-bold">87.5%</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#030A0C] border border-[rgba(0,201,216,0.15)] flex items-center gap-2">
                <span className="text-[#9BB2B7]">Decision Threshold:</span>
                <span className="text-amber-300 font-bold">0.70</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#030A0C] border border-[rgba(0,201,216,0.15)] flex items-center gap-2">
                <span className="text-[#9BB2B7]">Database:</span>
                <span className="text-emerald-400 font-bold">SQLite Local</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Main 2-Column Split: Telemetry Chart & Recent Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column: 7-Day Activity Volume (5 Cols) */}
          <div className="lg:col-span-5 bg-[#091D22]/85 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.35)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
            
            <div className="flex items-center justify-between border-b border-[rgba(0,201,216,0.12)] pb-3 mb-4">
              <div>
                <span className="text-xs font-mono tracking-widest uppercase text-[#F3F8F8] font-bold block">
                  7-Day Request Volume
                </span>
                <span className="text-xs text-[#9BB2B7] font-sans mt-0.5 block">
                  Real-time pipeline invocation metrics
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-[#00C9D8] uppercase tracking-wider px-2 py-0.5 rounded bg-[#00C9D8]/10 border border-[#00C9D8]/20">
                Live Window
              </span>
            </div>

            {/* Throughput Bar Chart */}
            <div className="h-48 w-full flex items-end gap-3 pt-6 pb-2 relative">
              {/* Background horizontal lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="border-b border-dashed border-[#00C9D8] w-full" />
                <div className="border-b border-dashed border-[#00C9D8] w-full" />
                <div className="border-b border-dashed border-[#00C9D8] w-full" />
              </div>

              {telemetry.volumeByDay.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 h-full group z-10">
                  <div className="w-full flex justify-center items-end h-full relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-[#00C9D8] text-[#030B0D] text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-lg transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {d.count} calls
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(d.height, 10)}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={`w-full max-w-[2.25rem] rounded-t-lg transition-all ${
                        i === 6
                          ? 'bg-[#00C9D8] shadow-[0_0_16px_rgba(0,201,216,0.4)]'
                          : d.count > 0 ? 'bg-[#00C9D8]/50 group-hover:bg-[#00C9D8]/80' : 'bg-white/5'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-[#9BB2B7] uppercase font-semibold">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[rgba(0,201,216,0.12)] pt-3.5 mt-2 flex items-center justify-between text-xs text-[#9BB2B7]">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#00C9D8]" />
                <span className="font-mono text-[11px]">Strict Privacy Bounds</span>
              </div>
              <span className="font-mono text-[11px] text-[#00C9D8]">No Public Ingestion</span>
            </div>
          </div>

          {/* Right Column: Recent Operations Feed (7 Cols) */}
          <div className="lg:col-span-7 bg-[#091D22]/85 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.35)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />

            <div className="flex items-center justify-between border-b border-[rgba(0,201,216,0.12)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00C9D8]" />
                <span className="text-xs font-mono tracking-widest uppercase text-[#F3F8F8] font-bold">
                  Recent Evaluations & History
                </span>
              </div>
              <button
                onClick={() => onNavigate('/history')}
                className="text-xs font-mono uppercase tracking-wider text-[#00C9D8] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <span>View Full Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 min-h-[220px]">
              {telemetry.isEmpty ? (
                <div className="h-56 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-[#051114]/70 border border-[rgba(0,201,216,0.12)] text-[#9BB2B7]">
                  <FileText className="w-8 h-8 text-[#00C9D8]/20 mb-2" />
                  <p className="text-[#F3F8F8] text-sm font-semibold mb-1">No operations recorded yet</p>
                  <p className="text-[#9BB2B7] text-xs max-w-sm mb-3">
                    Run an analysis, rewrite, or signal comparison to see your live telemetry.
                  </p>
                  <button
                    onClick={() => onNavigate('/analyze')}
                    className="px-4 py-2 rounded-xl bg-[#00C9D8]/15 hover:bg-[#00C9D8]/25 border border-[#00C9D8]/30 text-[#00C9D8] text-xs font-semibold font-mono transition cursor-pointer"
                  >
                    Start with Text Analysis
                  </button>
                </div>
              ) : (
                telemetry.recentActivity.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (act.type === 'analysis') onNavigate('/analyze');
                      else if (act.type === 'humanization') onNavigate('/paraphrase');
                      else onNavigate('/compare');
                    }}
                    className="p-3.5 rounded-xl bg-[#061418] hover:bg-[#091E23] border border-[rgba(0,201,216,0.16)] hover:border-[#00C9D8]/40 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        act.type === 'analysis'
                          ? 'bg-[#00C9D8]/10 border-[#00C9D8]/30 text-[#00C9D8]'
                          : act.type === 'humanization'
                          ? 'bg-[#008FA3]/15 border-[#008FA3]/30 text-[#00C9D8]'
                          : 'bg-[#0A2023] border-[#00C9D8]/25 text-[#00C9D8]'
                      }`}>
                        {act.type === 'analysis' ? <Search className="w-4 h-4 text-[#00C9D8]" /> : act.type === 'humanization' ? <Wand2 className="w-4 h-4 text-[#00C9D8]" /> : <Activity className="w-4 h-4 text-[#00C9D8]" />}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-[#F3F8F8] truncate block group-hover:text-[#00C9D8] transition-colors">
                          {act.title}
                        </span>
                        <p className="text-xs text-[#9BB2B7] truncate max-w-md sm:max-w-lg mt-0.5 font-sans">
                          {act.snippet}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {act.classification && (
                        <div className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                          act.classification.toLowerCase().includes('ai')
                            ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                            : 'text-[#00C9D8] bg-[#00C9D8]/10 border-[#00C9D8]/20'
                        }`}>
                          {act.classification}
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-[#9BB2B7] mt-1">
                        {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
