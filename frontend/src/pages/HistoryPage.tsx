import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { insforge } from '../lib/insforge';
import { Search, Trash2, Wand2, X, ChevronRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryPageProps {
  onNavigate: (route: string, state?: any) => void;
  initialSearch?: string;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate, initialSearch = '' }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [filterClass, setFilterClass] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setItems(data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
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
      setItems(items.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to permanently delete ALL your analysis history? This cannot be undone.')) return;
    
    try {
      setLoading(true);
      await insforge.database.from('analyses').delete().eq('user_id', user.id);
      setItems([]);
      setSelectedItem(null);
    } catch (err) {
      console.error('Clear all error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.original_text.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterClass === 'all' || 
      (filterClass === 'ai' && item.classification?.includes('AI')) ||
      (filterClass === 'human' && item.classification?.includes('Human'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] text-[#f4f4f5] px-6 lg:px-12 pt-0 pb-4 relative overflow-y-auto font-sans bg-transparent">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[var(--color-lime-sprout)]/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto space-y-4 relative z-10">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-2 border-b border-white/5"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[var(--color-lime-sprout)] drop-shadow-[0_0_15px_rgba(228,253,151,0.2)]">Analysis History</h1>
        </div>

        {/* Search & Filter & Clear */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleClearAll}
            disabled={items.length === 0 || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
          
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search archive..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#09090b] border border-white/10 rounded-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-lime-sprout)]/50 transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-[#09090b] border border-white/10 rounded-full text-xs text-white focus:outline-none focus:border-[var(--color-lime-sprout)]/50 appearance-none cursor-pointer transition-all"
            >
              <option value="all">All Records</option>
              <option value="ai">AI Generated</option>
              <option value="human">Human Written</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* History Items List / Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-500">
            <div className="w-5 h-5 border-2 border-[var(--color-lime-sprout)]/30 border-t-[var(--color-lime-sprout)] rounded-full animate-spin mb-4" />
            <span className="text-xs uppercase tracking-[0.15em]">Retrieving Records</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/5 rounded-[2rem] bg-[#121812]/50">
            <span className="text-sm font-medium">{search || filterClass !== 'all' ? 'No records match your criteria.' : 'Archive is empty.'}</span>
          </div>
        ) : (
          <div className="bg-[#121812]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden shadow-lg flex flex-col h-[65vh]">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 border-b border-white/5 bg-white/[0.01] text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] shrink-0">
              <div className="col-span-2">Date</div>
              <div className="col-span-6">Excerpt</div>
              <div className="col-span-2">Classification</div>
              <div className="col-span-1 text-right">AI Prob</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center px-6 md:px-8 py-5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="md:col-span-2 text-xs text-gray-400 font-mono">
                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  
                  <div className="md:col-span-6">
                    <p className="text-sm text-gray-300 line-clamp-1 font-serif italic tracking-wide">
                      "{item.original_text}"
                    </p>
                  </div>
                  
                  <div className="md:col-span-2 flex items-center">
                    <span className={`text-[10px] uppercase tracking-widest font-semibold ${
                      item.classification?.includes('AI') ? 'text-[var(--color-lime-sprout)]' : 'text-emerald-400'
                    }`}>
                      {item.classification?.includes('AI') ? 'AI Generated' : 'Human Written'}
                    </span>
                  </div>

                  <div className="md:col-span-1 flex items-center md:justify-end">
                    <span className="text-sm font-mono text-white">
                      {Math.round(item.ai_probability * 100)}%
                    </span>
                  </div>

                  <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-3 pt-4 md:pt-0 border-t border-white/5 md:border-0 mt-2 md:mt-0">
                    <span className="text-[10px] text-gray-500 md:hidden uppercase tracking-wider">Actions</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition hidden md:block" />
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
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-white/10 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-8 sm:p-10 shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <div className="flex items-start justify-between pb-6 border-b border-white/5 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">{new Date(selectedItem.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="text-2xl font-light text-white tracking-tight">{selectedItem.classification}</h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 text-gray-500 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-8 space-y-8 overflow-y-auto pr-2">
                
                {/* Stats Row */}
                <div className="flex gap-12">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] block mb-2">AI Probability</span>
                    <span className="text-4xl font-light text-[var(--color-lime-sprout)] font-mono">
                      {Math.round(selectedItem.ai_probability * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] block mb-2">Human Probability</span>
                    <span className="text-4xl font-light text-emerald-400 font-mono">
                      {Math.round(selectedItem.human_probability * 100)}%
                    </span>
                  </div>
                </div>

                {/* Text Block */}
                <div className="space-y-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold">Analyzed Text</span>
                  <div className="p-6 rounded-2xl bg-[#050507] border border-white/5 text-gray-300 leading-relaxed font-serif text-sm">
                    {selectedItem.original_text}
                  </div>
                </div>

                {/* Explanation */}
                {selectedItem.explanation && (
                  <div className="space-y-3">
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold">Diagnostic Reasoning</span>
                    <div className="p-5 rounded-2xl bg-[var(--color-lime-sprout)]/5 border border-[var(--color-lime-sprout)]/10 text-indigo-200/80 text-xs leading-relaxed">
                      {selectedItem.explanation}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between shrink-0">
                <button
                  onClick={(e) => handleDelete(selectedItem.id, e)}
                  className="px-4 py-2 text-xs font-medium text-red-400 hover:text-red-300 transition"
                >
                  Delete Record
                </button>

                <button
                  onClick={() => {
                    const text = selectedItem.original_text;
                    setSelectedItem(null);
                    onNavigate('/paraphrase', { text });
                  }}
                  className="px-6 py-3 bg-white text-black hover:bg-gray-100 font-medium text-xs rounded-full flex items-center gap-2 transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
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
