import React, { useState, useEffect } from 'react';
import { useAuth, getUserDisplayName } from '../context/AuthContext';
import {
  Bars3Icon as Menu,
  XMarkIcon as X,
  ArrowRightOnRectangleIcon as LogOut,
  MagnifyingGlassIcon as Search,
  ChevronDownIcon as ChevronDown,
  Cog6ToothIcon as Settings
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { VerityLogo } from './VerityLogo';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string, state?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (route: string) => {
    if (route.startsWith('#')) {
      if (currentRoute !== '/') {
        onNavigate('/');
        setTimeout(() => {
          const el = document.querySelector(route);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.querySelector(route);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate(route);
    }
    setMobileMenuOpen(false);
  };

  const publicLinks = [
    { name: 'Home', route: '#home' },
    { name: 'Why VERITY', route: '#why-verity' },
    { name: 'How it Works', route: '#how-it-works' },
    { name: 'FAQ', route: '#faq' },
    { name: 'Documentation', route: '/docs' }
  ];

  const appLinks = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'Analyze', route: '/analyze' },
    { name: 'Paraphrase', route: '/paraphrase' },
    { name: 'Compare', route: '/compare' },
    { name: 'History', route: '/history' }
  ];

  const navLinks = (user && currentRoute !== '/') ? appLinks : publicLinks;

  return (
    <div className="fixed top-0 w-full z-50 flex flex-col items-center pt-2 sm:pt-3 px-3 sm:px-6 pointer-events-none">
      <nav className={`pointer-events-auto transition-all duration-300 rounded-2xl w-full max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1536px] flex items-center justify-between px-5 sm:px-7 py-2 sm:py-2.5 relative ${
        scrolled || mobileMenuOpen
          ? 'bg-[#0A1117]/90 backdrop-blur-2xl border border-[#1C2633] shadow-lg shadow-black/20'
          : 'bg-[#0A1117]/80 backdrop-blur-xl border border-[#1C2633]/80'
      }`}>

        {/* Brand Logo */}
        <div
          onClick={() => handleNav(user ? '/dashboard' : '/')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <VerityLogo className="h-8 md:h-9 w-auto" />
          <span className="font-antigravity tracking-[0.14em] text-[#FFFFFF] text-xl group-hover:text-[#00D5E5] transition-colors font-semibold">
            VERITY
          </span>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = currentRoute === link.route;
            return (
              <button
                key={link.route}
                onClick={() => handleNav(link.route)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer relative border ${
                  isActive
                    ? 'text-[#00D5E5] bg-[#0D151D] backdrop-blur-2xl border-[#00C9D8]/30 font-semibold'
                    : 'text-[#8DA2AA] border-transparent hover:text-[#FFFFFF] hover:bg-[#0D151D]/60 hover:border-white/[0.08]'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00D5E5]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3.5">
          {!user ? (
            <>
              <button
                onClick={() => handleNav('/login')}
                className="text-sm font-medium text-[#E2EEF1] hover:text-[#FFFFFF] transition-colors cursor-pointer px-4 py-2 border border-white/[0.08] rounded-xl bg-[#0D151D]/80 backdrop-blur-2xl hover:bg-[#121A23] hover:border-[#00C9D8]/35"
              >
                Login
              </button>
              <button
                onClick={() => handleNav('/signup')}
                className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:from-[#00E5F5] hover:to-[#00A3BA] text-[#051115] rounded-xl transition-all cursor-pointer shadow-md shadow-[#00C9D8]/15"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3.5">
              {currentRoute === '/' ? (
                <button
                  onClick={() => handleNav('/dashboard')}
                  className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:from-[#00E5F5] hover:to-[#00A3BA] text-[#051115] rounded-xl transition-all cursor-pointer shadow-md shadow-[#00C9D8]/15"
                >
                  Go to Dashboard
                </button>
              ) : (
                <div className="hidden lg:flex relative items-center">
                  <Search className="w-4 h-4 text-[#8DA2AA] absolute left-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        onNavigate('/history', { search: searchQuery.trim() });
                      }
                    }}
                    placeholder="Search analyses..."
                    className="bg-[#070D12] backdrop-blur-md border border-[#1C2633] rounded-xl py-1.5 pl-9 pr-12 text-sm text-[#FFFFFF] placeholder-[#8DA2AA]/45 focus:outline-none focus:border-[#00D5E5] focus:ring-1 focus:ring-[#00D5E5]/20 w-48 transition-all"
                  />
                  <button
                    onClick={() => {
                      if (searchQuery.trim()) {
                        onNavigate('/history', { search: searchQuery.trim() });
                      }
                    }}
                    className="absolute right-2 px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9px] text-[#8DA2AA] font-mono hover:text-[#FFFFFF] hover:bg-[#00C9D8]/10 transition-colors cursor-pointer"
                  >
                    Enter
                  </button>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 cursor-pointer ml-1 group p-1 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[#00C9D8]/30"
                  title="Account menu"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#00C9D8]/15 border border-[#00C9D8]/30 flex items-center justify-center text-[#00D5E5] text-sm font-bold font-sans group-hover:bg-[#00C9D8]/25 transition-colors">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#8DA2AA] group-hover:text-[#FFFFFF] transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Icon Dropdown */}
                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-3 w-60 bg-[#0D151D] backdrop-blur-2xl border border-[#1C2633] rounded-2xl p-2.5 z-50 flex flex-col gap-1.5 overflow-hidden shadow-xl"
                    >
                      {/* User Info Header */}
                      <div className="px-3 py-2 rounded-xl bg-[#070D12] backdrop-blur-md border border-white/5 mb-1">
                        <p className="text-xs font-semibold text-[#FFFFFF] truncate font-sans">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="text-[11px] font-mono text-[#8DA2AA] truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">Active Session</span>
                        </div>
                      </div>

                      {/* Settings Button */}
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleNav('/settings');
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium text-[#8DA2AA] hover:text-[#FFFFFF] hover:bg-[#00C9D8]/10 border border-transparent hover:border-[#00C9D8]/25 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-[#00C9D8]/10 border border-[#00C9D8]/20 flex items-center justify-center text-[#00D5E5]">
                            <Settings className="w-3.5 h-3.5" />
                          </div>
                          <span>Settings & Preferences</span>
                        </div>
                        <span className="text-[10px] text-[#00D5E5] font-mono opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </button>

                      <div className="h-px bg-white/5 my-0.5" />

                      {/* Sign Out Button */}
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleNav('/logout');
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                            <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          <span>Sign Out</span>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">EXIT</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#8DA2AA] hover:text-[#FFFFFF] focus:outline-none rounded-xl cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="md:hidden pointer-events-auto w-full max-w-7xl mt-3 bg-[#0A1117]/95 backdrop-blur-2xl border border-[#1C2633] rounded-2xl overflow-hidden relative shadow-2xl"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {!user ? (
                <>
                  {navLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => handleNav(link.route)}
                      className="text-left text-sm font-medium tracking-wide text-[#8DA2AA] hover:text-white py-2"
                    >
                      {link.name}
                    </button>
                  ))}
                  <div className="w-full h-px bg-white/5 my-2" />
                  <button
                    onClick={() => handleNav('/login')}
                    className="text-left text-sm font-medium tracking-wide text-[#8DA2AA] hover:text-white py-2"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNav('/signup')}
                    className="w-full py-3 mt-2 text-sm font-bold bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#051115] rounded-xl shadow-md"
                  >
                    Get Started
                  </button>
                </>
              ) : currentRoute === '/' ? (
                <>
                  {navLinks.map((link) => {
                    const isActive = currentRoute === link.route;
                    return (
                      <button
                        key={link.name}
                        onClick={() => handleNav(link.route)}
                        className={`text-left text-sm font-medium tracking-wide py-2 ${
                          isActive ? 'text-[#00D5E5] font-bold' : 'text-[#8DA2AA] hover:text-[#FFFFFF]'
                        }`}
                      >
                        {link.name}
                      </button>
                    );
                  })}
                  <div className="w-full h-px bg-white/5 my-2" />
                  <button
                    onClick={() => handleNav('/dashboard')}
                    className="w-full py-3 mt-2 text-sm font-bold bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#051115] rounded-xl shadow-md"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleNav('/logout');
                    }}
                    className="flex items-center justify-center gap-3 w-full py-3 text-sm font-medium tracking-wide text-rose-400 mt-2 border border-rose-400/20 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  {navLinks.map((link) => {
                    const isActive = currentRoute === link.route;
                    return (
                      <button
                        key={link.route}
                        onClick={() => handleNav(link.route)}
                        className={`text-left text-sm font-medium tracking-wide py-2 ${
                          isActive ? 'text-[#00D5E5] font-bold' : 'text-[#8DA2AA] hover:text-[#FFFFFF]'
                        }`}
                      >
                        {link.name}
                      </button>
                    );
                  })}
                  <div className="w-full h-px bg-white/5 my-2" />
                  <button
                    onClick={() => handleNav('/settings')}
                    className="flex items-center gap-3 py-3 text-sm font-medium tracking-wide text-[#8DA2AA] hover:text-white"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleNav('/logout');
                    }}
                    className="flex items-center gap-3 py-3 text-sm font-medium tracking-wide text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
