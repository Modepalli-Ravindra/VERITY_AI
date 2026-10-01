import React, { useEffect, useState } from 'react';
import { useAuth, getUserDisplayName } from '../context/AuthContext';
import { insforge } from '../lib/insforge';
import { 
  Search, 
  Wand2, 
  Activity,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardPageProps {
  onNavigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    aiDetected: 0,
    humanDetected: 0,
    paraphrases: 0,
  });
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        const { data: logsData } = await insforge.database
          .from('analyses')
          .select('*')
          .eq('user_id', user.id);

        const { data: humanizationsData } = await insforge.database
          .from('humanizations')
          .select('*')
          .eq('user_id', user.id);

        if (logsData) {
          const totalAnalyses = logsData.length;
          const aiDetected = logsData.filter((l: any) => 
            l.classification?.toLowerCase().includes('ai') || l.ai_probability > 0.5
          ).length;
          const humanDetected = totalAnalyses - aiDetected;

          setStats({
            totalAnalyses,
            aiDetected,
            humanDetected,
            paraphrases: humanizationsData ? humanizationsData.length : 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, [user]);


  return (
    <div className="h-[calc(100vh-10rem)] text-[#f4f4f5] px-6 lg:px-12 pt-0 pb-0 relative overflow-hidden font-sans bg-transparent flex flex-col">
      
      {/* Background Glows (matching image) */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[var(--color-lime-sprout)]/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      <div className="max-w-[1440px] w-full mx-auto flex flex-col flex-1 relative z-10 min-h-0 gap-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-5xl font-serif text-[var(--color-lime-sprout)] mb-2 drop-shadow-[0_0_15px_rgba(228,253,151,0.2)]">
              Welcome, {getUserDisplayName(user)}
            </h1>
            <p className="text-sm text-gray-300">
              Analyze. Paraphrase. Compare. See beyond the words.
            </p>
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            onClick={() => onNavigate('/analyze')}
            className="px-5 py-2.5 bg-[var(--color-lime-sprout)] hover:brightness-110 text-gray-950 font-bold text-xs rounded-full flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(228,253,151,0.2)] cursor-pointer whitespace-nowrap"
          >
            <span className="text-base leading-none">+</span> New Analysis
          </motion.button>
        </div>

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0"
        >
          {/* Card 1 */}
          <div className="bg-[#121812]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg min-h-[100px]">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-lime-sprout)]/10 text-[var(--color-lime-sprout)] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 font-sans mb-0.5 uppercase tracking-widest">Total Analyses</div>
              <div className="text-xl text-white font-sans font-medium">{stats.totalAnalyses}</div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-[#121812]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg min-h-[100px]">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 font-sans mb-0.5 uppercase tracking-widest">AI Detected</div>
              <div className="text-xl text-white font-sans font-medium">{stats.aiDetected}</div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-[#121812]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg min-h-[100px]">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-lime-sprout)]/20 text-[var(--color-lime-sprout)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 font-sans mb-0.5 uppercase tracking-widest">Human Detected</div>
              <div className="text-xl text-white font-sans font-medium">{stats.humanDetected}</div>
            </div>
          </div>
          {/* Card 4 */}
          <div className="bg-[#121812]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg min-h-[100px]">
            <div className="w-10 h-10 rounded-xl bg-white/5 text-gray-300 flex items-center justify-center shrink-0">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 font-sans mb-0.5 uppercase tracking-widest">Paraphrases</div>
              <div className="text-xl text-white font-sans font-medium">{stats.paraphrases}</div>
            </div>
          </div>
        </motion.div>

        {/* Main Action Boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          
          {/* Analyze Text Box */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#121812]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between shadow-lg h-full"
          >
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-lime-sprout)] uppercase tracking-widest mb-2">
                <Search className="w-3 h-3" />
                <span>Primary Action</span>
              </div>
              <h2 className="text-2xl font-serif text-white mb-2">Analyze Text</h2>
              <p className="text-xs text-gray-400 mb-4 max-w-sm leading-relaxed">
                Detect patterns associated with AI-generated writing using our advanced semantic and stylometric feature fusion engine.
              </p>
              
              <div className="bg-[rgba(20,35,22,0.65)] border border-[var(--color-lime-sprout)]/20 shadow-[inset_0_0_20px_rgba(228,253,151,0.02)] rounded-2xl p-4 relative mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-[var(--color-lime-sprout)]/80">Detection Signals</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-lime-sprout)] animate-pulse"></div>
                    <span className="text-[9px] font-mono text-gray-500 tracking-widest uppercase">Live</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-gray-400 font-sans">
                      <span>Semantic Variance</span>
                      <span className="text-white font-mono">82%</span>
                    </div>
                    <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-[var(--color-lime-sprout)] rounded-full"></motion.div>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-gray-400 font-sans">
                      <span>Stylometric Burstiness</span>
                      <span className="text-white font-mono">45%</span>
                    </div>
                    <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} transition={{ duration: 1.2, delay: 0.6 }} className="h-full bg-emerald-400 rounded-full"></motion.div>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-gray-400 font-sans">
                      <span>Entropy Level</span>
                      <span className="text-white font-mono">67%</span>
                    </div>
                    <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '67%' }} transition={{ duration: 1.4, delay: 0.7 }} className="h-full bg-teal-400 rounded-full"></motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => onNavigate('/analyze')}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                Sample Text
              </button>
              <button 
                onClick={() => onNavigate('/analyze')}
                className="px-6 py-2.5 bg-[var(--color-lime-sprout)] hover:brightness-110 text-gray-950 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer flex-1 justify-center"
              >
                <Search className="w-3.5 h-3.5" /> Analyze Text <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* Analytics Chart Box */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-[#121812]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex flex-col shadow-lg h-full overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-lime-sprout)] uppercase tracking-widest">
                <Activity className="w-3 h-3" />
                <span>Telemetry</span>
              </div>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Last 7 Days</span>
            </div>
            
            <h2 className="text-2xl font-serif text-white mb-1">Analysis Volume</h2>
            <p className="text-xs text-gray-400 mb-6 shrink-0">System throughput and detection requests over time.</p>

            <div className="flex-1 flex items-end gap-3 lg:gap-4 mt-auto mb-2 pt-4 relative">
               {/* Background grid lines */}
               <div className="absolute inset-0 flex flex-col justify-between border-b border-white/5 pb-6 pointer-events-none">
                 <div className="border-b border-white/[0.03] w-full"></div>
                 <div className="border-b border-white/[0.03] w-full"></div>
                 <div className="border-b border-white/[0.03] w-full"></div>
               </div>

               {/* Bars */}
               {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
                 <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 group z-10 h-full">
                   <div className="w-full flex justify-center h-[120px] items-end relative">
                     {/* Tooltip on hover */}
                     <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-white text-black text-[10px] font-mono font-bold px-2 py-1 rounded transition-opacity">
                        {height * 12}
                     </div>
                     <motion.div 
                       initial={{ height: 0 }}
                       animate={{ height: `${height}%` }}
                       transition={{ duration: 0.8, delay: 0.4 + (i * 0.1) }}
                       className={`w-full max-w-[2.5rem] rounded-t-sm ${i === 6 ? 'bg-[var(--color-lime-sprout)] shadow-[0_0_15px_rgba(228,253,151,0.3)]' : 'bg-white/10 group-hover:bg-white/20 transition-colors'}`}
                     ></motion.div>
                   </div>
                   <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span>
                 </div>
               ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
