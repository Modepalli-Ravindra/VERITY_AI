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
  DocumentTextIcon as FileText
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
      { label: 'Mon', count: 0, height: 6, dateStr: '' },
      { label: 'Tue', count: 0, height: 6, dateStr: '' },
      { label: 'Wed', count: 0, height: 6, dateStr: '' },
      { label: 'Thu', count: 0, height: 6, dateStr: '' },
      { label: 'Fri', count: 0, height: 6, dateStr: '' },
      { label: 'Sat', count: 0, height: 6, dateStr: '' },
      { label: 'Sun', count: 0, height: 6, dateStr: '' },
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
  }, [user]);

  useEffect(() => {
    loadData();
    const unsubscribe = HistoryService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  return (
    <div className="flex-1 min-h-0 h-full text-[#F3F8F8] px-3 sm:px-6 lg:px-8 pb-3 relative overflow-hidden font-sans bg-transparent flex flex-col selection:bg-[#00C9D8]/30">

      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#00C9D8]/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#008FA3]/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-[1600px] w-full mx-auto flex flex-col flex-1 relative z-10 min-h-0 gap-3">

        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 py-1.5 border-b border-[rgba(0,201,216,0.18)]">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-2xl lg:text-3xl font-mono font-black text-[#00C9D8] tracking-[0.16em] uppercase drop-shadow-[0_0_15px_rgba(0,201,216,0.4)]">
                INTELLIGENCE DASHBOARD
              </span>
              <span className="text-[#00C9D8]/50 text-lg sm:text-2xl font-light">•</span>
              <span className="text-sm sm:text-lg text-[#9BB2B7] font-sans font-medium">
                Welcome back, <strong className="text-[#F3F8F8] font-bold text-base sm:text-xl">{getUserDisplayName(user)}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2 text-[#9BB2B7] hover:text-[#00C9D8] rounded-xl bg-[#061519]/90 border border-[rgba(0,201,216,0.2)] hover:border-[#00C9D8]/50 transition-colors cursor-pointer"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00C9D8]' : ''}`} />
            </button>

            <button
              onClick={() => onNavigate('/paraphrase')}
              className="px-3 py-1.5 text-xs font-mono tracking-wider uppercase text-[#9BB2B7] hover:text-[#F3F8F8] rounded-xl bg-[#061519]/90 border border-[rgba(0,201,216,0.2)] hover:border-[#00C9D8]/50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <div className="w-4 h-4 rounded bg-[#00C9D8]/10 border border-[#00C9D8]/20 flex items-center justify-center text-[#00C9D8]">
                <Wand2 className="w-3 h-3" />
              </div>
              <span>Paraphrase</span>
            </button>

            <button
              onClick={() => onNavigate('/compare')}
              className="px-3 py-1.5 text-xs font-mono tracking-wider uppercase text-[#9BB2B7] hover:text-[#F3F8F8] rounded-xl bg-[#061519]/90 border border-[rgba(0,201,216,0.2)] hover:border-[#00C9D8]/50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <div className="w-4 h-4 rounded bg-[#00C9D8]/10 border border-[#00C9D8]/20 flex items-center justify-center text-[#00C9D8]">
                <Activity className="w-3 h-3" />
              </div>
              <span>Compare</span>
            </button>

            <button
              onClick={() => onNavigate('/analyze')}
              className="px-4 py-1.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:brightness-110 text-[#061416] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,201,216,0.25)]"
            >
              <Search className="w-3.5 h-3.5 text-[#061416]" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>

        {/* Primary Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 shrink-0">

          {/* Card 1: Total Analyses */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-xl p-3 flex flex-col justify-between shadow-[0_12px_28px_rgba(0,0,0,0.35)] hover:border-[#00C9D8]/40 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/25 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#9BB2B7] font-mono tracking-widest uppercase font-semibold">Total Analyses</span>
              <div className="w-6 h-6 rounded-lg bg-[#00C9D8]/10 border border-[#00C9D8]/25 flex items-center justify-center text-[#00C9D8] shadow-sm">
                <Activity className="w-3 h-3" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#F3F8F8] font-mono mt-1">
              {loading ? '—' : telemetry.totalAnalyses}
            </div>
          </div>

          {/* Card 2: AI vs Human Distribution */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-xl p-3 flex flex-col justify-between shadow-[0_12px_28px_rgba(0,0,0,0.35)] hover:border-[#00C9D8]/40 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/25 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#9BB2B7] font-mono tracking-widest uppercase font-semibold">Classification Split</span>
              <div className="w-6 h-6 rounded-lg bg-[#00C9D8]/10 border border-[#00C9D8]/25 flex items-center justify-center text-[#00C9D8] shadow-sm">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1 flex-wrap">
              <span className="text-base sm:text-xl font-bold text-amber-400 font-mono">
                {telemetry.aiDetected} AI
              </span>
              <span className="text-[#9BB2B7]/40 text-base font-light">/</span>
              <span className="text-base sm:text-xl font-bold text-[#00C9D8] font-mono">
                {telemetry.humanDetected} Human
              </span>
            </div>
          </div>

          {/* Card 3: Paraphrases */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-xl p-3 flex flex-col justify-between shadow-[0_12px_28px_rgba(0,0,0,0.35)] hover:border-[#00C9D8]/40 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/25 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#9BB2B7] font-mono tracking-widest uppercase font-semibold">Paraphrases</span>
              <div className="w-6 h-6 rounded-lg bg-[#00C9D8]/10 border border-[#00C9D8]/25 flex items-center justify-center text-[#00C9D8] shadow-sm">
                <Wand2 className="w-3 h-3" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#F3F8F8] font-mono mt-1">
              {loading ? '—' : telemetry.paraphrases}
            </div>
          </div>

          {/* Card 4: Signal Comparisons */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-xl p-3 flex flex-col justify-between shadow-[0_12px_28px_rgba(0,0,0,0.35)] hover:border-[#00C9D8]/40 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/25 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#9BB2B7] font-mono tracking-widest uppercase font-semibold">Comparisons</span>
              <div className="w-6 h-6 rounded-lg bg-[#00C9D8]/10 border border-[#00C9D8]/25 flex items-center justify-center text-[#00C9D8] shadow-sm">
                <Activity className="w-3 h-3" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#F3F8F8] font-mono mt-1">
              {loading ? '—' : telemetry.comparisons}
            </div>
          </div>

          {/* Card 5: Active Model Status */}
          <div className="bg-[#0A2023]/80 backdrop-blur-xl border border-[#00C9D8]/30 rounded-xl p-3 flex flex-col justify-between shadow-[0_12px_28px_rgba(0,0,0,0.35)] col-span-2 sm:col-span-1 hover:border-[#00C9D8]/50 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/40 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#00C9D8] font-mono tracking-widest uppercase flex items-center gap-1 font-semibold">
                <div className="w-5 h-5 rounded bg-[#00C9D8]/15 border border-[#00C9D8]/30 flex items-center justify-center text-[#00C9D8]">
                  <Cpu className="w-3 h-3" />
                </div>
                <span>Active Detector</span>
              </span>
              <span className="text-[9px] font-mono text-[#00C9D8] px-1 py-0.2 rounded bg-[#00C9D8]/10 font-bold border border-[#00C9D8]/20">
                θ={telemetry.activeThreshold.toFixed(2)}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-mono font-semibold text-[#F3F8F8] truncate mt-1">
              {telemetry.activeModelName}
            </div>
          </div>

        </div>

        {/* Main Split Grid: 7-Day Volume & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">

          {/* Left: Telemetry Throughput Chart (5 Cols - Compact) */}
          <div className="lg:col-span-5 bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] p-3 sm:p-3.5 flex flex-col justify-between shadow-[0_12px_28px_rgba(0,0,0,0.35)] overflow-hidden relative min-h-0">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />

            <div className="flex items-center justify-between border-b border-[rgba(0,201,216,0.12)] pb-2 mb-1 shrink-0">
              <div>
                <span className="text-xs font-mono tracking-widest uppercase text-[#F3F8F8] font-bold block">
                  7-Day Telemetry Throughput
                </span>
                <span className="text-[10px] text-[#9BB2B7] font-sans block">
                  Requests processed across detection & transformation
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#00C9D8] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#00C9D8]/10 border border-[#00C9D8]/20">
                Live Metrics
              </span>
            </div>

            <div className="flex-1 flex items-end gap-2 pt-1 pb-1 relative min-h-[75px] max-h-[110px]">
              {/* Background grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15">
                <div className="border-b border-dashed border-[#00C9D8]/40 w-full" />
                <div className="border-b border-dashed border-[#00C9D8]/40 w-full" />
                <div className="border-b border-dashed border-[#00C9D8]/40 w-full" />
              </div>

              {telemetry.volumeByDay.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 z-10 h-full group">
                  <div className="w-full flex justify-center items-end h-full relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-6 bg-[#00C9D8] text-[#061416] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-lg transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {d.count} reqs
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${d.height}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className={`w-full max-w-[2rem] rounded-t-md transition-colors ${i === 6
                        ? 'bg-[#00C9D8] shadow-[0_0_15px_rgba(0,201,216,0.35)]'
                        : d.count > 0 ? 'bg-[#00C9D8]/40 group-hover:bg-[#00C9D8]/70' : 'bg-white/5'
                        }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#9BB2B7] uppercase tracking-widest font-medium">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[rgba(0,201,216,0.12)] pt-1.5 flex items-center justify-between text-xs text-[#9BB2B7] shrink-0">
              <span className="font-mono text-[10px]">Strict Privacy Guarantees</span>
              <span className="font-mono text-[10px] text-[#00C9D8] font-semibold">Zero Public Retention</span>
            </div>
          </div>

          {/* Right: Recent Operations Feed (7 Cols - Compact & Themed) */}
          <div className="lg:col-span-7 bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] p-3 sm:p-3.5 flex flex-col shadow-[0_12px_28px_rgba(0,0,0,0.35)] overflow-hidden relative min-h-0">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />

            <div className="flex items-center justify-between border-b border-[rgba(0,201,216,0.12)] pb-2 mb-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#00C9D8]" />
                <span className="text-xs font-mono tracking-widest uppercase text-[#F3F8F8] font-bold">
                  Recent Workspace Activity
                </span>
              </div>
              <button
                onClick={() => onNavigate('/history')}
                className="text-xs font-mono uppercase tracking-wider text-[#00C9D8] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <span>Full Audit Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
              {telemetry.isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 rounded-xl bg-[#061519]/70 border border-[rgba(0,201,216,0.12)] text-[#9BB2B7] font-mono text-sm">
                  <FileText className="w-7 h-7 text-[#00C9D8]/20 mb-1.5" />
                  <p className="text-[#F3F8F8] text-xs font-semibold mb-0.5">No operations recorded yet</p>
                  <p className="text-[#9BB2B7] text-[11px] max-w-sm">
                    Run an analysis, rewrite, or signal comparison to see your live telemetry.
                  </p>
                  <button
                    onClick={() => onNavigate('/analyze')}
                    className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-[#00C9D8]/10 hover:bg-[#00C9D8]/20 border border-[#00C9D8]/30 text-[#00C9D8] text-xs font-semibold transition cursor-pointer"
                  >
                    Start with Analyze Text
                  </button>
                </div>
              ) : (
                telemetry.recentActivity.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (act.type === 'analysis') onNavigate('/analyze');
                      else if (act.type === 'humanization') onNavigate('/paraphrase');
                      else onNavigate('/compare');
                    }}
                    className="p-2.5 sm:p-3 rounded-xl bg-[#061519]/90 hover:bg-[#081F24] border border-[rgba(0,201,216,0.18)] hover:border-[#00C9D8]/45 transition-all flex items-center justify-between gap-3.5 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${act.type === 'analysis'
                        ? 'bg-[#00C9D8]/10 border-[#00C9D8]/30 text-[#00C9D8]'
                        : act.type === 'humanization'
                          ? 'bg-[#008FA3]/15 border-[#008FA3]/30 text-[#00C9D8]'
                          : 'bg-[#0A2023] border-[#00C9D8]/25 text-[#00C9D8]'
                        }`}>
                        {act.type === 'analysis' ? <Search className="w-4 h-4 text-[#00C9D8]" /> : act.type === 'humanization' ? <Wand2 className="w-4 h-4 text-[#00C9D8]" /> : <Activity className="w-4 h-4 text-[#00C9D8]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-[#F3F8F8] truncate group-hover:text-[#00C9D8] transition-colors">
                            {act.title}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#9BB2B7] truncate max-w-md sm:max-w-xl mt-0.5 font-sans">
                          {act.snippet}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {act.classification && (
                        <div className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${act.classification.toLowerCase().includes('ai')
                          ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                          : 'text-[#00C9D8] bg-[#00C9D8]/10 border-[#00C9D8]/20'
                          }`}>
                          {act.classification}
                        </div>
                      )}
                      {act.deltaPoints !== undefined && act.deltaPoints !== 0 && (
                        <div className="text-xs font-mono text-[#00C9D8] font-bold mt-0.5">
                          {act.deltaPoints > 0 ? `+${act.deltaPoints}` : act.deltaPoints} pts
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-[#9BB2B7] mt-0.5">
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
    </div >
  );
};
