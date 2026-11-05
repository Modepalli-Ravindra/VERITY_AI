import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, getUserDisplayName } from '../context/AuthContext';
import {
  MagnifyingGlassIcon as Search,
  SparklesIcon as Wand2,
  ChartBarSquareIcon as Activity,
  ArrowRightIcon as ArrowRight,
  ShieldCheckIcon as ShieldCheck,
  ArrowPathIcon as RefreshCw,
  ClockIcon as Clock,
  DocumentTextIcon as FileText,
  ExclamationTriangleIcon as AlertTriangle,
  CheckCircleIcon as CheckCircle
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
    <div className="flex-1 w-full text-[#FFFFFF] px-4 sm:px-6 lg:px-8 pt-3 pb-6 font-sans relative selection:bg-[#F1DDE0]/30">
      <div className="max-w-[1480px] mx-auto space-y-5">

        {/* 1. Header Bar: Minimal, Direct & Clean */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#FFFFFF]">
              Welcome back, {getUserDisplayName(user)}.
            </h1>
            <p className="text-sm text-[#D28B96] mt-1 font-normal">
              Overview of document evaluations and content verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-[#140A10]/80 backdrop-blur-2xl border border-white/[0.08] text-[#D28B96] hover:text-[#FFFFFF] hover:border-[#D28B96]/35 transition-all cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#FFFFFF]' : ''}`} />
            </button>

            <button
              onClick={() => onNavigate('/paraphrase')}
              className="px-4 py-2 rounded-xl bg-[#140A10]/80 backdrop-blur-2xl border border-white/[0.08] text-xs font-medium text-[#FFFFFF] hover:text-[#FFFFFF] hover:border-[#D28B96]/35 transition-all flex items-center gap-2 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#D28B96]" />
              <span>Rewrite Text</span>
            </button>

            <button
              onClick={() => onNavigate('/compare')}
              className="px-4 py-2 rounded-xl bg-[#140A10]/80 backdrop-blur-2xl border border-white/[0.08] text-xs font-medium text-[#FFFFFF] hover:text-[#FFFFFF] hover:border-[#D28B96]/35 transition-all flex items-center gap-2 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            >
              <Activity className="w-3.5 h-3.5 text-[#D28B96]" />
              <span>Compare Signals</span>
            </button>

            <button
              onClick={() => onNavigate('/analyze')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8E2848] to-[#5C182D] hover:from-[#A23054] hover:to-[#701E37] text-white border border-white/15 shadow-[0_4px_20px_rgba(142,40,72,0.35)] font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            >
              <Search className="w-3.5 h-3.5 text-[#421B29]" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>

        {/* 2. Top Bento Strip: 4 Balanced Minimal Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Metric 1: Total Processed */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#140A10]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-[#D28B96]/35 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#D28B96] tracking-wide">
                Total Evaluations
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#1C0F17]/85 backdrop-blur-2xl border border-white/[0.08] flex items-center justify-center text-[#D28B96]">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#FFFFFF] tracking-tight">
              {loading ? '—' : telemetry.totalAnalyses}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.08] text-xs text-[#D28B96] flex items-center justify-between">
              <span>All documents & inputs</span>
              <span className="text-[#FFFFFF] font-medium">Logged</span>
            </div>
          </motion.div>

          {/* Metric 2: AI Content Flagged */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="bg-[#140A10]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-[#D28B96]/35 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#D28B96] tracking-wide">
                AI Detected
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#1C0F17]/85 backdrop-blur-2xl border border-white/[0.08] flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-bold text-[#FFFFFF] tracking-tight">
                {loading ? '—' : telemetry.aiDetected}
              </span>
              {telemetry.totalAnalyses > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                  {aiPercentage}%
                </span>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.08] text-xs text-[#D28B96] flex items-center justify-between">
              <span>Machine likelihood</span>
              <span className="text-amber-400 font-medium">High Confidence</span>
            </div>
          </motion.div>

          {/* Metric 3: Human Content Verified */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-[#140A10]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-[#D28B96]/35 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#D28B96] tracking-wide">
                Human Content
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#1C0F17]/85 backdrop-blur-2xl border border-white/[0.08] flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-bold text-[#FFFFFF] tracking-tight">
                {loading ? '—' : telemetry.humanDetected}
              </span>
              {telemetry.totalAnalyses > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  {humanPercentage}%
                </span>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.08] text-xs text-[#D28B96] flex items-center justify-between">
              <span>Natural variance</span>
              <span className="text-emerald-400 font-medium">Verified</span>
            </div>
          </motion.div>

          {/* Metric 4: Transformations */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-[#140A10]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-[#D28B96]/35 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#D28B96] tracking-wide">
                Transformations
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#1C0F17]/85 backdrop-blur-2xl border border-white/[0.08] flex items-center justify-center text-[#FFFFFF]">
                <Wand2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#FFFFFF] tracking-tight">
              {loading ? '—' : telemetry.paraphrases + telemetry.comparisons}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.08] text-xs text-[#D28B96] flex items-center justify-between">
              <span>{telemetry.paraphrases} rewrites</span>
              <span>{telemetry.comparisons} comparisons</span>
            </div>
          </motion.div>

        </div>

        {/* 3. Smooth Bento Grid: Activity Chart & Recent Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Bento: 7-Day Request Volume (5 Cols) */}
          <div className="lg:col-span-5 bg-[#140A10]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#FFFFFF]">
                  Activity Volume
                </h3>
                <p className="text-xs text-[#D28B96] mt-0.5">
                  Daily evaluation requests over the last 7 days
                </p>
              </div>
              <span className="text-[11px] font-medium text-[#D28B96] px-2 py-0.5 rounded-md bg-[#1C0F17]/85 backdrop-blur-2xl border border-white/[0.08]">
                7 Days
              </span>
            </div>

            {/* Smooth Clean Bars */}
            <div className="h-52 w-full flex items-end gap-3 pt-6 pb-2">
              {telemetry.volumeByDay.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 h-full group">
                  <div className="w-full flex justify-center items-end h-full relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#182330] border border-[#27384E] text-[#FFFFFF] text-[11px] font-medium px-2 py-0.5 rounded shadow-lg transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {d.count} {d.count === 1 ? 'call' : 'calls'}
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(d.height, 8)}%` }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                      className={`w-full max-w-[2.25rem] rounded-md transition-all ${
                        i === 6
                          ? 'bg-[#F1DDE0]'
                          : d.count > 0 ? 'bg-[#1E2D3D] group-hover:bg-[#2A3F55]' : 'bg-[#1C0F17]/85 backdrop-blur-2xl'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-[#D28B96] font-medium">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.08] pt-3 mt-2 flex items-center justify-between text-xs text-[#D28B96]">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Strict In-Memory Processing</span>
              </div>
              <span className="text-[#D28B96]">Private & Confidential</span>
            </div>
          </div>

          {/* Right Bento: Recent Activity Feed (7 Cols) */}
          <div className="lg:col-span-7 bg-[#140A10]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D28B96]" />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">
                  Recent Operations
                </h3>
              </div>
              <button
                onClick={() => onNavigate('/history')}
                className="text-xs text-[#FFFFFF] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 min-h-[220px]">
              {telemetry.isEmpty ? (
                <div className="h-52 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-[#0A0407]/90 backdrop-blur-md border border-white/[0.08] text-[#D28B96]">
                  <FileText className="w-8 h-8 text-[#D28B96]/40 mb-2" />
                  <p className="text-[#FFFFFF] text-sm font-medium mb-1">No operations recorded yet</p>
                  <p className="text-[#D28B96] text-xs max-w-sm mb-3">
                    Analyze or rewrite text to populate your live telemetry feed.
                  </p>
                  <button
                    onClick={() => onNavigate('/analyze')}
                    className="px-4 py-2 rounded-xl bg-[#1C0F17]/85 backdrop-blur-2xl hover:bg-[#1A2532] border border-white/[0.08] text-[#FFFFFF] text-xs font-medium transition cursor-pointer"
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
                    className="p-3.5 rounded-xl bg-[#0A0407]/90 backdrop-blur-md hover:bg-[#1C0F17]/85 backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.08] transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        act.type === 'analysis'
                          ? 'bg-[#1C0F17]/85 backdrop-blur-2xl border-white/[0.08] text-[#FFFFFF]'
                          : act.type === 'humanization'
                          ? 'bg-[#1C0F17]/85 backdrop-blur-2xl border-white/[0.08] text-[#FFFFFF]'
                          : 'bg-[#1C0F17]/85 backdrop-blur-2xl border-white/[0.08] text-[#FFFFFF]'
                      }`}>
                        {act.type === 'analysis' ? <Search className="w-4 h-4" /> : act.type === 'humanization' ? <Wand2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-medium text-[#FFFFFF] truncate block group-hover:text-[#FFFFFF] transition-colors">
                          {act.title}
                        </span>
                        <p className="text-xs text-[#D28B96] truncate max-w-md sm:max-w-lg mt-0.5">
                          {act.snippet}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {act.classification && (
                        <div className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                          act.classification.toLowerCase().includes('ai')
                            ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                            : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                          {act.classification}
                        </div>
                      )}
                      <div className="text-[11px] text-[#D28B96] mt-1">
                        {new Date(act.createdAt).toLocaleDateString()}
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
