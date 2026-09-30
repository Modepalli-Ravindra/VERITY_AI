import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Wand2, ShieldCheck, ArrowRight, Lock, CheckCircle2, Server, Activity, GitCompare } from 'lucide-react';

interface DocumentationPageProps {
  onNavigate: (route: string) => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = React.useState('introduction');

  const navItems = [
    { id: 'introduction', label: 'Introduction', icon: BookOpen },
    { id: 'detection', label: 'Detection Engine', icon: Search },
    { id: 'paraphrase', label: 'Paraphrase System', icon: Wand2 },
    { id: 'compare', label: 'Comparison Tool', icon: GitCompare },
    { id: 'dashboard', label: 'History & Dashboard', icon: Activity },
    { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheck }
  ];

  return (
    <div className="h-screen bg-[var(--bg-dark)] text-white font-sans overflow-hidden selection:bg-[var(--color-lime-sprout)]/30">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_center,rgba(228,253,151,0.05),transparent_70%)] blur-[120px]" />
        <div className="absolute top-[10%] right-[-10%] w-[70%] h-[70%] bg-[radial-gradient(ellipse_at_center,rgba(228,253,151,0.03),transparent_70%)] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 lg:px-12 pt-32 lg:pt-36 pb-8 flex flex-col md:flex-row gap-8 h-full">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-72 shrink-0 flex flex-col h-full bg-[var(--bg-card)]/80 backdrop-blur-3xl border border-[var(--color-lime-sprout)]/10 rounded-3xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
          <div className="flex-1">
            <h2 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4 px-2">VERITY DOCS</h2>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${
                      isActive 
                        ? 'bg-[var(--color-lime-sprout)]/10 text-[var(--color-lime-sprout)] border-l-4 border-[var(--color-lime-sprout)] shadow-[inset_0_1px_0_0_rgba(228,253,151,0.05)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.03] border-l-4 border-transparent'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[var(--color-lime-sprout)]' : 'text-gray-500'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4">
             <button onClick={() => onNavigate('/')} className="text-sm font-medium text-gray-500 hover:text-[var(--color-lime-sprout)] flex items-center gap-2 transition-colors group">
                <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" /> Back to Home
             </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-[var(--bg-card)]/80 backdrop-blur-3xl border border-[var(--color-lime-sprout)]/10 rounded-3xl p-6 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col justify-center h-full max-h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex flex-col justify-center"
            >
              
              {/* --- INTRODUCTION --- */}
              {activeSection === 'introduction' && (
                <div className="space-y-5 w-full">
                  <div>
                    <h1 className="text-3xl font-display uppercase tracking-widest text-white mb-2">Introduction</h1>
                    <p className="text-base font-medium text-[var(--color-lime-sprout)]/80">An overview of Verity's analysis and processing tools.</p>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                  
                  <p className="text-sm text-gray-300 leading-relaxed max-w-4xl">
                    Verity is a platform designed to analyze text for synthetic generation patterns and restructure content. It is built to assist users in evaluating text origins and modifying documents for improved flow and reduced detection probability.
                  </p>

                  <h3 className="text-lg font-display uppercase tracking-widest text-[var(--color-lime-sprout)] mt-4 mb-3">Core Components</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    {[
                      { title: "Detection", desc: "Analyze synthetic patterns.", icon: Search },
                      { title: "Paraphrasing", desc: "Modify syntax & markers.", icon: Wand2 },
                      { title: "Comparison", desc: "Review structural diffs.", icon: GitCompare },
                      { title: "Privacy", desc: "Secure data handling.", icon: ShieldCheck }
                    ].map((feature, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl hover:border-[var(--color-lime-sprout)]/30 transition-all">
                        <div className="w-8 h-8 bg-[var(--color-lime-sprout)]/10 rounded-lg flex items-center justify-center mb-3">
                          <feature.icon className="w-4 h-4 text-[var(--color-lime-sprout)]" />
                        </div>
                        <h4 className="text-sm text-white font-medium mb-1">{feature.title}</h4>
                        <p className="text-xs text-gray-400">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* --- AI DETECTION --- */}
              {activeSection === 'detection' && (
                <div className="space-y-5 w-full">
                  <div>
                    <h1 className="text-3xl font-display uppercase tracking-widest text-white mb-2">Detection Engine</h1>
                    <p className="text-base font-medium text-[var(--color-lime-sprout)]/80">Methodology for synthetic text classification.</p>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                  
                  <p className="text-sm text-gray-300">
                    The detection system evaluates text by analyzing structural patterns typical of language models based on two statistical properties:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-dark)]/50 border border-white/10 p-5 rounded-xl">
                       <h4 className="text-base font-display tracking-widest text-white mb-1">PERPLEXITY</h4>
                       <p className="text-xs text-gray-400 leading-relaxed">Evaluates predictability of word choices. Synthetic models select highly probable tokens (low perplexity). Human writing is less predictable (high perplexity).</p>
                    </div>
                    <div className="bg-[var(--bg-dark)]/50 border border-white/10 p-5 rounded-xl">
                       <h4 className="text-base font-display tracking-widest text-white mb-1">BURSTINESS</h4>
                       <p className="text-xs text-gray-400 leading-relaxed">Measures variance in sentence structure. AI models generate text with uniform pacing, while human writing varies significantly in complexity.</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-display uppercase tracking-widest text-[var(--color-lime-sprout)] mt-4 mb-3">Score Interpretation</h3>
                  <div className="bg-[var(--bg-dark)]/80 border border-white/10 rounded-xl p-5 flex items-center gap-8 max-w-2xl">
                     <div className="relative w-20 h-20 flex shrink-0 items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                          <motion.circle 
                            initial={{ strokeDasharray: "0 251" }}
                            animate={{ strokeDasharray: "220 251" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="50" cy="50" r="40" stroke="var(--color-lime-sprout)" strokeWidth="8" fill="none" strokeLinecap="round" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-display text-[var(--color-lime-sprout)]">87%</span>
                        </div>
                     </div>
                     <div>
                       <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-lime-sprout)]/10 border border-[var(--color-lime-sprout)]/20 text-[var(--color-lime-sprout)] text-[10px] font-bold uppercase mb-2">High Probability</div>
                       <h4 className="text-sm font-bold text-white mb-1">Synthetic Pattern Match</h4>
                       <p className="text-xs text-gray-400">A score of 87% indicates strong alignment with synthetic statistical patterns (low perplexity and minimal burstiness).</p>
                     </div>
                  </div>
                </div>
              )}


              {/* --- PARAPHRASING --- */}
              {activeSection === 'paraphrase' && (
                <div className="space-y-5 w-full">
                  <div>
                    <h1 className="text-3xl font-display uppercase tracking-widest text-white mb-2">Paraphrase System</h1>
                    <p className="text-base font-medium text-[var(--color-lime-sprout)]/80">Modifying text syntax to alter linguistic markers.</p>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                  
                  <p className="text-sm text-gray-300">
                    The paraphrasing tool restructures content syntactically rather than relying on direct synonym substitution.
                  </p>

                  <div className="bg-[var(--color-lime-sprout)]/5 border border-[var(--color-lime-sprout)]/20 p-5 rounded-xl my-2 max-w-4xl">
                    <h4 className="text-sm text-[var(--color-lime-sprout)] font-bold mb-3 flex items-center gap-2">
                      <Wand2 className="w-4 h-4" /> Restructuring Methodology
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex gap-2 text-xs text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-lime-sprout)] shrink-0" /> 
                        <span><strong>Clause adjustment:</strong> Modifying active/passive voice.</span>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-lime-sprout)] shrink-0" /> 
                        <span><strong>Lexical substitution:</strong> Replacing highly probable sequences.</span>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-lime-sprout)] shrink-0" /> 
                        <span><strong>Pacing modification:</strong> Adjusting sentence lengths.</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-display uppercase tracking-widest text-[var(--color-lime-sprout)] mt-4 mb-2">Processing Example</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    <div className="bg-[var(--bg-dark)]/50 border border-white/10 rounded-lg p-4">
                      <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">Input Text</div>
                      <p className="text-xs text-gray-400 opacity-60">"It is crucially important to understand that the aforementioned technology will significantly revolutionize the current digital landscape in various ways."</p>
                    </div>
                    <div className="bg-[var(--bg-dark)] border border-[var(--color-lime-sprout)]/30 rounded-lg p-4">
                      <div className="text-[10px] font-bold text-[var(--color-lime-sprout)] tracking-widest uppercase mb-2">Processed Output</div>
                      <p className="text-xs text-white">"You need to understand how this technology will reshape the digital space."</p>
                    </div>
                  </div>
                </div>
              )}


              {/* --- COMPARE --- */}
              {activeSection === 'compare' && (
                <div className="space-y-5 w-full">
                  <div>
                    <h1 className="text-3xl font-display uppercase tracking-widest text-white mb-2">Comparison Tool</h1>
                    <p className="text-base font-medium text-[var(--color-lime-sprout)]/80">Reviewing structural modifications.</p>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                  
                  <p className="text-sm text-gray-300">
                    The comparison interface displays a side-by-side evaluation of the original text and the paraphrased output. It functions similarly to a version control diff.
                  </p>

                  <div className="bg-[var(--bg-dark)] border border-white/10 rounded-xl p-5 font-mono text-sm max-w-4xl">
                    <div className="flex flex-col gap-2">
                       <div className="bg-white/5 text-gray-400 px-3 py-2 rounded text-xs opacity-60">
                         - The quick brown fox <span className="bg-red-500/20 text-red-200">rapidly jumped</span> over the lazy dog.
                       </div>
                       <div className="bg-[var(--color-lime-sprout)]/10 text-white px-3 py-2 rounded text-xs">
                         + The quick brown fox <span className="bg-[var(--color-lime-sprout)]/30 text-[var(--color-lime-sprout)]">leapt quickly</span> over the lazy dog.
                       </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Highlighting indicates specific token substitutions and structural adjustments.</p>
                </div>
              )}


              {/* --- DASHBOARD --- */}
              {activeSection === 'dashboard' && (
                <div className="space-y-5 w-full">
                  <div>
                    <h1 className="text-3xl font-display uppercase tracking-widest text-white mb-2">History & Dashboard</h1>
                    <p className="text-base font-medium text-[var(--color-lime-sprout)]/80">Account and data management.</p>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                  
                  <div className="space-y-4 text-sm text-gray-300 max-w-3xl">
                    <p>The dashboard provides an overview of your account usage, including total processing volume and average classification scores.</p>
                    <p>The History section allows you to review previously analyzed documents. Please note that data is only accessible here if you have explicitly enabled persistent storage in your account settings.</p>
                  </div>
                </div>
              )}


              {/* --- PRIVACY --- */}
              {activeSection === 'privacy' && (
                <div className="space-y-5 w-full">
                  <div>
                    <h1 className="text-3xl font-display uppercase tracking-widest text-white mb-2">Privacy & Security</h1>
                    <p className="text-base font-medium text-[var(--color-lime-sprout)]/80">Data handling procedures.</p>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 max-w-4xl">
                    <div className="bg-[var(--bg-dark)]/50 border border-white/5 rounded-xl p-5 hover:border-[var(--color-lime-sprout)]/30 transition-colors">
                      <Server className="w-6 h-6 text-[var(--color-lime-sprout)] mb-3" />
                      <h4 className="text-sm text-white font-bold tracking-wide mb-2">Data Retention</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">By default, text submitted for analysis is processed in memory and discarded upon completion of the request. Data is only persisted if the user enables history storage.</p>
                    </div>
                    <div className="bg-[var(--bg-dark)]/50 border border-white/5 rounded-xl p-5 hover:border-[var(--color-lime-sprout)]/30 transition-colors">
                      <Lock className="w-6 h-6 text-[var(--color-lime-sprout)] mb-3" />
                      <h4 className="text-sm text-white font-bold tracking-wide mb-2">Transport Security</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">All network traffic between the client and our processing infrastructure is secured using standard TLS protocols.</p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
