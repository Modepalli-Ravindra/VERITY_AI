import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRightIcon as ArrowRight, 
  ArrowLeftIcon as ArrowLeft, 
  LockClosedIcon as Lock, 
  EnvelopeIcon as Mail, 
  EyeIcon as Eye, 
  EyeSlashIcon as EyeOff
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { VerityLogo } from '../components/VerityLogo';

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
      if (
        errMsg.toLowerCase().includes('verify') || 
        errMsg.toLowerCase().includes('verification') || 
        errMsg.toLowerCase().includes('confirm')
      ) {
        setIsVerifying(true);
        setInfoMessage('Account verification required. Check your inbox for the code.');
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
      setError('Verification code is required');
      return;
    }

    setLoading(true);
    const res = await verifyEmail(email, otp.trim());
    setLoading(false);

    if (res.error) {
      setError(res.error.message || 'Invalid verification code.');
    } else {
      onNavigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#06141B] text-[#CCD0CF] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#253745]">
      
      {/* Subtle technical grid background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#06141B]">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Top Header: Logo & Back on left, Sign Up on right */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 text-xs font-medium text-[#9BA8AB] hover:text-[#CCD0CF] transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-[#172836] cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </button>
          
          <div className="h-4 w-px #1C2633 hidden sm:block" />

          <div 
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <VerityLogo className="h-7 w-auto" />
            <span className="font-display tracking-[0.14em] text-[#CCD0CF] text-lg font-bold group-hover:text-[#CCD0CF] transition-colors">
              VERITY
            </span>
          </div>
        </div>

        <div className="text-xs text-[#9BA8AB] flex items-center gap-1.5">
          <span className="hidden sm:inline">New to VERITY?</span>
          <button 
            onClick={() => onNavigate('/signup')}
            className="text-[#CCD0CF] hover:text-[#CCD0CF] font-medium transition-colors cursor-pointer px-3 py-1 rounded-xl border border-[#253745] bg-[#172836] hover:border-[#364C5E] hover:bg-[#1A2430] text-[#CCD0CF]"
          >
            Create an Account
          </button>
        </div>
      </header>

      {/* Main Centered Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[440px]"
        >
          {/* Main Form Surface */}
          <div className="bg-[#11212D] border border-[#253745] rounded-2xl p-7 sm:p-9 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
            
            {/* Top decorative subtle hairline glow */}
            

            {/* Form Header */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#172836] border border-[#253745] text-[#CCD0CF] text-[10px] font-mono tracking-widest uppercase mb-3 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C9D8] " />
                <span>SECURE AUTHENTICATION</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#CCD0CF] mb-2 font-display">
                Welcome back.
              </h1>
              
              <p className="text-xs sm:text-sm text-[#9BA8AB] leading-relaxed">
                Continue your work in AI text detection and document intelligence.
              </p>
            </div>

            {/* Error & Info Banners */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/35 text-rose-300 text-xs font-mono tracking-wide leading-relaxed"
              >
                {error}
              </motion.div>
            )}
            
            {infoMessage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-5 p-3.5 rounded-xl bg-[#0D282B] border border-[#00C9D8]/35 text-[#CCD0CF] text-xs font-mono tracking-wide leading-relaxed"
              >
                {infoMessage}
              </motion.div>
            )}

            {/* Form Mode: OTP Verification or Standard Email/Password */}
            {isVerifying ? (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#9BA8AB] mb-2 font-medium">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5C6A]" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      className="w-full pl-11 pr-4 py-3 bg-[#06141B] border border-[#253745] rounded-xl focus:border-[#00C9D8] focus:ring-1 focus:ring-[#00C9D8] focus:outline-none text-[#CCD0CF] tracking-[0.3em] font-mono text-center text-lg transition-all placeholder-[#4A5C6A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#CCD0CF] hover:bg-white active:bg-[#00B4C2] text-[#040D10] font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{loading ? 'Verifying Session...' : 'Verify & Continue'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#9BA8AB] mb-1.5 font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5C6A]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="researcher@organization.org"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#06141B] border border-[#253745] rounded-xl focus:border-[#00C9D8] focus:ring-1 focus:ring-[#00C9D8] focus:outline-none text-[#CCD0CF] placeholder-[#4A5C6A] text-xs sm:text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#9BA8AB] font-medium">
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setError('Password reset instructions will be sent if the email exists in our records.')}
                      className="text-[11px] text-[#4A5C6A] hover:text-[#CCD0CF] transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5C6A]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#06141B] border border-[#253745] rounded-xl focus:border-[#00C9D8] focus:ring-1 focus:ring-[#00C9D8] focus:outline-none text-[#CCD0CF] placeholder-[#4A5C6A] text-xs sm:text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5C6A] hover:text-[#CCD0CF] transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#CCD0CF] hover:bg-white active:bg-[#00B4C2] text-[#040D10] font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            )}

            {/* Bottom registration link */}
            <div className="mt-6 pt-5 border-t border-[#253745] text-center text-xs text-[#9BA8AB]">
              Need a research account?{' '}
              <button 
                onClick={() => onNavigate('/signup')}
                className="text-[#CCD0CF] hover:underline font-semibold ml-1 cursor-pointer transition-colors"
              >
                Create an account
              </button>
            </div>

          </div>
        </motion.div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-20 w-full py-4 px-6 text-center text-[11px] font-mono text-[#4A5C6A]">
        <span>VERITY AI • Research Security & Authenticity</span>
      </footer>

    </div>
  );
};
