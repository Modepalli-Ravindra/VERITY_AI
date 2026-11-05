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
  CheckCircleIcon as CheckCircle
} from '@heroicons/react/24/solid';
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
    <div className="flex-1 w-full text-[#F3F8F8] px-4 sm:px-6 lg:px-8 pt-2.5 pb-5 font-sans relative selection:bg-[#00C9D8]/30">

      <div className="max-w-[1520px] mx-auto space-y-5">

        {/* 1. Header Bar with System Status & Fast Launchers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1C2633]">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-[#F3F8F8] leading-tight">
              Welcome back, <span className="text-[#00C9D8] font-serif">{getUserDisplayName(user)}</span>.
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-[#10161D] border border-[#1C2633] text-[#8899A6] hover:text-[#00D5E5] hover:border-[#2B3B4E] transition-all cursor-pointer shadow-sm"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00C9D8]' : ''}`} />
            </button>

            <button
              onClick={() => onNavigate('/paraphrase')}
              className="px-3.5 py-2 rounded-xl bg-[#10161D] border border-[#1C2633] text-xs font-mono font-medium text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#2B3B4E] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <div className="w-4 h-4 rounded bg-[#00C9D8]/20 flex items-center justify-center text-[#00C9D8]">
                <Wand2 className="w-3 h-3" />
              </div>
              <span>Adversarial Rewrite</span>
            </button>

            <button
              onClick={() => onNavigate('/compare')}
              className="px-3.5 py-2 rounded-xl bg-[#10161D] border border-[#1C2633] text-xs font-mono font-medium text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#2B3B4E] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <div className="w-4 h-4 rounded bg-[#00C9D8]/20 flex items-center justify-center text-[#00C9D8]">
                <Activity className="w-3 h-3" />
              </div>
              <span>Signal Compare</span>
            </button>

            <button
              onClick={() => onNavigate('/analyze')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:from-[#00E5F5] hover:to-[#00A3BA] text-[#051115] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#00C9D8]/20"
            >
              <Search className="w-3.5 h-3.5 text-[#051115]" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>

        {/* 2. Top Metric Cards Strip (Balanced 4-Card Layout with Filled Solid Icons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Metric 1: Total Processed */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#10161D] border border-[#1C2633] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-[#00C9D8]/35 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#9BB2B7] uppercase tracking-wider font-semibold">
                Total Evaluations
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-serif font-bold text-[#F3F8F8] tracking-tight">
              {loading ? '—' : telemetry.totalAnalyses}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#9BB2B7] pt-2 border-t border-[#18212C]">
              <span>Analyses & Documents</span>
              <span className="text-[#00C9D8] font-bold">100% Verified</span>
            </div>
          </motion.div>

          {/* Metric 2: Detection Ratio */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#10161D] border border-[#1C2633] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-[#00C9D8]/35 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#9BB2B7] uppercase tracking-wider font-semibold">
                Classification Split
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 text-2xl font-serif font-bold tracking-tight">
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
            className="bg-[#10161D] border border-[#1C2633] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-[#00C9D8]/35 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#9BB2B7] uppercase tracking-wider font-semibold">
                Rewrites & Benchmarks
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#00C9D8] text-[#051115] shadow-md shadow-[#00C9D8]/20 flex items-center justify-center shrink-0">
                <Wand2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-serif font-bold text-[#F3F8F8] tracking-tight">
              {loading ? '—' : telemetry.paraphrases + telemetry.comparisons}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#9BB2B7] pt-2 border-t border-[#18212C]">
              <span>{telemetry.paraphrases} Rewrites</span>
              <span>{telemetry.comparisons} Comparisons</span>
            </div>
          </motion.div>

          {/* Metric 4: Primary Active Engine */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#10161D] border border-[#203042] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-[#00C9D8]/35 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-[#00C9D8] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-[#00C9D8] text-[#051115] flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span>Active Detection Engine</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-[#00C9D8] px-1.5 py-0.5 rounded bg-[#00C9D8]/15 border border-[#00C9D8]/30">
                θ={telemetry.activeThreshold.toFixed(2)}
              </span>
            </div>
            <div className="text-lg sm:text-xl font-serif font-bold text-[#F3F8F8] tracking-tight truncate">
              {telemetry.activeModelName}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#9BB2B7] pt-2 border-t border-[#1C2633]">
              <span className="text-[#00C9D8] font-semibold">{telemetry.activeModelVersion}</span>
              <span>768D+20D Fusion</span>
            </div>
          </motion.div>

        </div>

        {/* 3. Main 2-Column Split: Telemetry Chart & Recent Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column: 7-Day Activity Volume (5 Cols) */}
          <div className="lg:col-span-5 bg-[#10161D] rounded-2xl border border-[#1C2633] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1C2633] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#F3F8F8] block">
                  7-Day Request Volume
                </h3>
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

            <div className="border-t border-[#1C2633] pt-3.5 mt-2 flex items-center justify-between text-xs text-[#9BB2B7]">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#00C9D8]" />
                <span className="font-mono text-[11px]">Strict Privacy Bounds</span>
              </div>
              <span className="font-mono text-[11px] text-[#00C9D8] font-bold">No Public Ingestion</span>
            </div>
          </div>

          {/* Right Column: Recent Operations Feed (7 Cols) */}
          <div className="lg:col-span-7 bg-[#10161D] rounded-2xl border border-[#1C2633] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1C2633] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#00C9D8] text-[#051115] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#F3F8F8]">
                  Recent Evaluations & History
                </h3>
              </div>
              <button
                onClick={() => onNavigate('/history')}
                className="text-xs font-mono uppercase tracking-wider text-[#00C9D8] hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <span>View Full Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 min-h-[220px]">
              {telemetry.isEmpty ? (
                <div className="h-56 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-[#070D12] border border-[#1C2633] text-[#9BB2B7]">
                  <div className="w-12 h-12 rounded-2xl bg-[#00C9D8]/10 text-[#00C9D8] flex items-center justify-center mb-2">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-[#F3F8F8] font-serif text-base font-bold mb-1">No operations recorded yet</p>
                  <p className="text-[#9BB2B7] text-xs max-w-sm mb-3 font-sans">
                    Run an analysis, rewrite, or signal comparison to see your live telemetry.
                  </p>
                  <button
                    onClick={() => onNavigate('/analyze')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#051115] text-xs font-bold font-mono transition cursor-pointer shadow-md shadow-[#00C9D8]/20"
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
                    className="p-3.5 rounded-xl bg-[#070D12] hover:bg-[#0D151D] border border-[#1C2633] hover:border-[#00C9D8]/35 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#00C9D8] text-[#051115] shadow-sm">
                        {act.type === 'analysis' ? <Search className="w-4 h-4" /> : act.type === 'humanization' ? <Wand2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-[#F3F8F8] truncate block group-hover:text-[#00C9D8] transition-colors font-serif">
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
