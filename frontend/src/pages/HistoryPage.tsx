import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { insforge } from '../lib/insforge';
import { 
  MagnifyingGlassIcon as Search, 
  TrashIcon as Trash2, 
  SparklesIcon as Wand2, 
  XMarkIcon as X, 
  ChevronRightIcon as ChevronRight, 
  FunnelIcon as Filter,
  ClockIcon as Clock
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { HistoryService } from '../services/historyService';

interface HistoryPageProps {
  onNavigate: (route: string, state?: any) => void;
  initialSearch?: string;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate, initialSearch = '' }) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [filterClass, setFilterClass] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const isInitialRef = useRef(true);
  const isFetchingRef = useRef(false);

  const fetchHistory = useCallback(async (isBackground = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Only display full-screen loading spinner on the first initial empty load
    if (!isBackground && isInitialRef.current) {
      setLoading(true);
    }

    try {
      const { data, error } = await insforge.database
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        setItems(data);
      } else {
        // Fallback to local user cache synchronously without triggering background loops
        const local = HistoryService.getStoredRecords(userId);
        if (local && local.length > 0) {
          const mapped = local.map(a => ({
            id: a.id,
            original_text: a.snippet,
            ai_probability: a.aiProbability ?? 0,
            classification: a.classification || 'Analyzed',
            model_used: a.modelUsed || 'ModernBERT-V5',
            created_at: a.createdAt,
            word_count: a.wordCount
          }));
          setItems(mapped);
        } else {
          setItems([]);
        }
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
      isInitialRef.current = false;
      isFetchingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory(false);
    const unsub = HistoryService.subscribe(() => {
      fetchHistory(true);
    });
    return () => unsub();
  }, [fetchHistory]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this record?')) return;

    try {
      await insforge.database.from('analyses').delete().eq('id', id);
      setItems(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to permanently delete ALL your analysis history? This cannot be undone.')) return;
    
    try {
      await insforge.database.from('analyses').delete().eq('user_id', userId);
      setItems([]);
      setSelectedItem(null);
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  const filteredItems = items.filter(item => {
    const text = item.original_text || '';
    const matchesSearch = text.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterClass === 'all' || 
      (filterClass === 'ai' && item.classification?.includes('AI')) ||
      (filterClass === 'human' && item.classification?.includes('Human'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 min-h-0 h-full text-[#FFFFFF] px-3 sm:px-6 lg:px-8 pt-1.5 pb-3 relative overflow-hidden font-sans bg-transparent flex flex-col selection:bg-[#A64C61]/35">
      
      {/* Background Glows */}
      

      <div className="max-w-7xl mx-auto w-full space-y-5 relative z-10 flex-1 flex flex-col min-h-0">
      
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-4 border-b border-white/[0.08] shrink-0"
        >
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#FFFFFF] uppercase tracking-[0.22em] mb-2 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Telemetry Archive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] tracking-tight">
              Analysis History & Audit Log
            </h1>
            <p className="text-xs sm:text-sm text-[#9BB2B7] mt-1 font-sans">
              Review, inspect, and benchmark previous document evaluations and detection records.
            </p>
          </div>

          {/* Search & Filter & Clear */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handleClearAll}
              disabled={items.length === 0 || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/25 bg-red-500/10 text-xs uppercase tracking-wider text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-mono font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
            
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D28B96]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search archive..."
                className="w-full pl-10 pr-4 py-2 bg-[#0A0407]/90 backdrop-blur-md border border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#FFFFFF] placeholder-[#D28B96]/45 focus:outline-none focus:border-[#00C9D8] focus:ring-1 focus:ring-[#00C9D8]/30 transition-all font-sans"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D28B96] pointer-events-none" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="pl-9 pr-8 py-2 bg-[#0A0407]/90 backdrop-blur-md border border-white/[0.08] rounded-xl text-xs sm:text-sm text-[#FFFFFF] focus:outline-none focus:border-[#00C9D8] appearance-none cursor-pointer transition-all font-sans"
              >
                <option value="all" className="bg-[#140A10]/80 backdrop-blur-2xl text-[#FFFFFF]">All Records</option>
                <option value="ai" className="bg-[#140A10]/80 backdrop-blur-2xl text-amber-300">AI Generated</option>
                <option value="human" className="bg-[#140A10]/80 backdrop-blur-2xl text-[#FFFFFF]">Human Written</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* History Items List / Table */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col min-h-0"
        >
          {loading ? (
            <div className="py-28 flex flex-col items-center justify-center text-[#9BB2B7]">
              <div className="w-8 h-8 border-[3px] border-[#00C9D8]/30 border-t-[#00C9D8] rounded-full animate-spin mb-4" />
              <span className="text-xs uppercase tracking-[0.2em] font-mono text-[#FFFFFF]">Retrieving Records</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-28 flex flex-col items-center justify-center text-[#9BB2B7] border border-dashed border-white/[0.08] rounded-2xl bg-[#140A10]/80 backdrop-blur-2xl/40">
              <span className="text-sm font-medium">{search || filterClass !== 'all' ? 'No records match your criteria.' : 'Archive is empty.'}</span>
            </div>
          ) : (
            <div className="bg-[#140A10]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col flex-1 min-h-[500px] relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />
              
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/[0.08] bg-[#1D1015]/95 text-xs font-mono font-bold text-[#D28B96] uppercase tracking-[0.15em] shrink-0">
                <div className="col-span-2">Date</div>
                <div className="col-span-6">Excerpt</div>
                <div className="col-span-2">Classification</div>
                <div className="col-span-1 text-right">AI Prob</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {/* Table Rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-[rgba(0,201,216,0.08)]">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="group flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center px-6 md:px-8 py-4 sm:py-5 hover:bg-[#1C0F17]/85 backdrop-blur-2xl transition-colors cursor-pointer"
                  >
                    <div className="md:col-span-2 text-xs sm:text-sm text-[#9BB2B7] font-mono">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </div>
                    
                    <div className="md:col-span-6">
                      <p className="text-sm sm:text-base text-[#FFFFFF] line-clamp-1 font-sans tracking-normal group-hover:text-[#FFFFFF] transition-colors">
                        "{item.original_text}"
                      </p>
                    </div>
                    
                    <div className="md:col-span-2 flex items-center">
                      <span className={`text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md font-mono border ${
                        item.classification?.includes('AI') 
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                          : 'bg-[#00C9D8]/10 text-[#FFFFFF] border-[#00C9D8]/20'
                      }`}>
                        {item.classification?.includes('AI') ? 'AI Generated' : 'Human Written'}
                      </span>
                    </div>

                    <div className="md:col-span-1 flex items-center md:justify-end">
                      <span className="text-sm sm:text-base font-mono font-bold text-[#FFFFFF]">
                        {typeof item.ai_probability === 'number' ? `${Math.round(item.ai_probability * 100)}%` : '--'}
                      </span>
                    </div>

                    <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t border-[rgba(0,201,216,0.08)] md:border-0 mt-1 md:mt-0">
                      <span className="text-xs text-[#9BB2B7] md:hidden uppercase tracking-wider">Actions</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 text-[#D28B96] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#D28B96] group-hover:text-[#FFFFFF] transition hidden md:block" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Item Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#1D1015]/85 flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-4xl bg-[#140A10]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-6 sm:p-10 relative max-h-[90vh] flex flex-col overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/40 to-transparent" />
                
                <div className="flex items-start justify-between pb-5 border-b border-white/[0.08] shrink-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-[#9BB2B7] uppercase tracking-widest font-mono">
                        {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-[#FFFFFF] tracking-tight">{selectedItem.classification}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 text-[#9BB2B7] hover:text-[#FFFFFF] rounded-xl bg-[#0A0407]/90 backdrop-blur-md hover:bg-[#081A1D] border border-white/[0.08] transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-6 space-y-6 overflow-y-auto pr-2">
                  
                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-8 sm:gap-14">
                    <div className="bg-[#0A0407]/90 backdrop-blur-md p-4 rounded-xl border border-white/[0.08] flex-1 min-w-[160px]">
                      <span className="text-xs text-[#9BB2B7] uppercase tracking-[0.2em] font-mono block mb-1">AI Probability</span>
                      <span className="text-4xl font-bold text-[#FFFFFF] font-mono">
                        {typeof selectedItem.ai_probability === 'number' ? `${Math.round(selectedItem.ai_probability * 100)}%` : '--'}
                      </span>
                    </div>
                    <div className="bg-[#0A0407]/90 backdrop-blur-md p-4 rounded-xl border border-white/[0.08] flex-1 min-w-[160px]">
                      <span className="text-xs text-[#9BB2B7] uppercase tracking-[0.2em] font-mono block mb-1">Human Probability</span>
                      <span className="text-4xl font-bold text-[#008FA3] font-mono">
                        {typeof selectedItem.ai_probability === 'number'
                          ? `${Math.round((selectedItem.human_probability ?? (1 - selectedItem.ai_probability)) * 100)}%`
                          : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Text Block */}
                  <div className="space-y-2">
                    <span className="text-xs text-[#9BB2B7] uppercase tracking-[0.2em] font-mono font-semibold">Analyzed Text</span>
                    <div className="p-5 rounded-xl bg-[#0A0407]/90 backdrop-blur-md border border-white/[0.08] text-[#FFFFFF] leading-relaxed font-sans text-sm sm:text-base">
                      {selectedItem.original_text}
                    </div>
                  </div>

                  {/* Explanation */}
                  {selectedItem.explanation && (
                    <div className="space-y-2">
                      <span className="text-xs text-[#9BB2B7] uppercase tracking-[0.2em] font-mono font-semibold">Diagnostic Reasoning</span>
                      <div className="p-5 rounded-xl bg-[#00C9D8]/5 border border-[#00C9D8]/20 text-[#FFFFFF] text-xs sm:text-sm leading-relaxed">
                        {selectedItem.explanation}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between shrink-0">
                  <button
                    onClick={(e) => handleDelete(selectedItem.id, e)}
                    className="px-4 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 transition cursor-pointer font-mono"
                  >
                    Delete Record
                  </button>

                  <button
                    onClick={() => {
                      const text = selectedItem.original_text;
                      setSelectedItem(null);
                      onNavigate('/paraphrase', { text });
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061416] hover:brightness-110 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition cursor-pointer "
                  >
                    <Wand2 className="w-4 h-4 text-[#061416]" />
                    <span>Test Robustness (Paraphrase)</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
