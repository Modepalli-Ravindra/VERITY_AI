import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ArrowLeft, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { signIn, verifyEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    const res = await signIn(email, password);
    setLoading(false);

    if (res.error) {
      const errMsg = res.error.message || 'Invalid credentials';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('verify') || errMsg.toLowerCase().includes('verification') || errMsg.toLowerCase().includes('confirm')) {
        setIsVerifying(true);
        setInfoMessage('Account verification required. Check your inbox.');
      }
    } else {
      onNavigate('/dashboard');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    if (!otp.trim()) {
      setError('Required');
      return;
    }

    setLoading(true);
    const res = await verifyEmail(email, otp.trim());
    setLoading(false);

    if (res.error) {
      setError(res.error.message || 'Invalid code.');
    } else {
      onNavigate('/dashboard');
    }
  };



  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-[#f4f4f5] flex flex-col md:flex-row relative overflow-hidden font-sans selection:bg-[var(--color-lime-sprout)]/30">
      
      {/* Left Column - Visuals & Marketing (Hidden on mobile) */}
      <div className="hidden md:flex flex-1 relative flex-col justify-between p-12 lg:p-16 overflow-hidden">
        {/* Blurred Background Image */}
        <div className="absolute inset-0 bg-[url('/auth-bg-custom.jpg')] bg-cover bg-center blur-[4px] scale-105"></div>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-transparent to-transparent opacity-90"></div>
        
        <div className="relative flex flex-col justify-between h-full z-10">
          <div>
            <div 
              onClick={() => onNavigate('/')}
              className="flex items-center gap-3 cursor-pointer group w-fit hover:bg-white/5 p-2 -ml-2 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              <img src="/v-logo.png" alt="V" className="h-10 object-contain drop-shadow-[0_0_15px_rgba(228,253,151,0.2)] group-hover:drop-shadow-[0_0_15px_rgba(228,253,151,0.5)] transition-all" />
              <span className="font-display tracking-[0.15em] text-white text-2xl group-hover:text-[var(--color-lime-sprout)] transition-colors">VERITY</span>
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-24">
              <h1 className="text-4xl lg:text-6xl font-display uppercase tracking-widest text-white leading-[1.1] mb-6 drop-shadow-xl">
                See Beyond <br />
                <span className="text-[var(--color-lime-sprout)] drop-shadow-[0_0_15px_rgba(228,253,151,0.3)]">The Words.</span>
              </h1>
              <p className="text-base text-gray-300 font-medium max-w-md leading-relaxed drop-shadow-md">
                Robust AI text detection built around semantic and stylometric signals.
              </p>
            </motion.div>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-[10px] font-mono tracking-widest uppercase text-gray-400">
            <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
               <div className="w-5 h-5 flex items-center justify-center text-[var(--color-lime-sprout)]">
                 <ShieldCheck className="w-4 h-4" />
               </div>
               Semantic Signals
            </div>
            <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
               <div className="w-5 h-5 flex items-center justify-center text-[var(--color-lime-sprout)]">
                 <Lock className="w-4 h-4" />
               </div>
               Stylometric Analysis
            </div>
            <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
               <div className="w-5 h-5 flex items-center justify-center text-[var(--color-lime-sprout)]">
                 <ShieldCheck className="w-4 h-4" />
               </div>
               Robustness
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full md:w-[500px] lg:w-[650px] flex flex-col justify-center relative p-6 md:p-12 lg:p-16 z-10 overflow-y-auto bg-gradient-to-br from-[#111811] to-[#080b08]">
        {/* Soft green glow in the background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-fresh-canopy)]/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Top left back button */}
        <div className="absolute top-8 left-8 md:hidden text-sm">
          <button 
            onClick={() => onNavigate('/')} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </div>
        
        {/* Top right link */}
        <div className="absolute top-8 right-8 md:right-16 text-sm text-gray-300">
          New to VERITY?{' '}
          <button onClick={() => onNavigate('/signup')} className="text-[var(--color-lime-sprout)] hover:brightness-110 transition-colors cursor-pointer font-medium ml-1">
            Create Account
          </button>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md mx-auto relative z-10">
          {/* Main Card */}
          <div className="p-8 md:p-10 rounded-[2rem] border border-white/10 bg-[#161D15]/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            
            <div className="mb-8">
              <p className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-3">Verity Analysis Workspace</p>
              <h2 className="text-3xl md:text-4xl font-display uppercase tracking-widest text-white mb-2">
                Welcome <span className="text-[var(--color-lime-sprout)]">Back</span>
              </h2>
              <p className="text-sm text-gray-300">
                Continue your AI text analysis and robustness research.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-900/10 border border-red-500/20 text-red-400 text-xs font-mono tracking-wide text-center">
                {error}
              </div>
            )}
            {infoMessage && (
              <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-gray-300 text-xs font-mono tracking-wide text-center">
                {infoMessage}
              </div>
            )}

            {isVerifying ? (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-mono text-gray-300 uppercase tracking-widest mb-3">Verification Code</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:border-[var(--color-lime-sprout)]/50 focus:bg-black/40 focus:outline-none text-white tracking-[0.3em] font-mono text-center text-xl transition-all placeholder-gray-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[var(--color-lime-sprout)] hover:brightness-110 text-gray-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(228,253,151,0.2)] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify Session'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-mono text-gray-300 uppercase tracking-widest mb-3">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="researcher@institute.edu"
                      className="w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl focus:border-[var(--color-lime-sprout)]/50 focus:bg-black/40 focus:outline-none text-white placeholder-gray-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-300 uppercase tracking-widest mb-3">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-black/20 border border-white/10 rounded-xl focus:border-[var(--color-lime-sprout)]/50 focus:bg-black/40 focus:outline-none text-white placeholder-gray-500 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button type="button" className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 bg-[var(--color-lime-sprout)] hover:brightness-110 text-gray-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(228,253,151,0.2)] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
