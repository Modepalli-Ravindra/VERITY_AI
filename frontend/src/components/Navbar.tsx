import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, 
  X, 
  LogOut,
  Search,
  ChevronDown,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string, state?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const { user, signOut } = useAuth();
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
    { name: 'FAQ', route: '#faq' }
  ];

  const appLinks = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'Analyze', route: '/analyze' },
    { name: 'Paraphrase', route: '/paraphrase' },
    { name: 'Compare', route: '/compare' },
    { name: 'History', route: '/history' }
  ];

  const navLinks = user ? appLinks : publicLinks;

  return (
    <div className="fixed top-0 w-full z-50 flex flex-col items-center pt-6 px-4 pointer-events-none">
      <nav className={`pointer-events-auto transition-all duration-300 rounded-full w-full max-w-6xl flex items-center justify-between px-6 py-2.5 ${
        scrolled || mobileMenuOpen 
          ? 'bg-[var(--bg-card)]/80 backdrop-blur-2xl border-[1px] border-[var(--color-lime-sprout)] shadow-[0_20px_40px_rgba(0,0,0,0.4)]' 
          : 'bg-[var(--bg-dark)]/40 backdrop-blur-xl border-[1px] border-[var(--color-lime-sprout)] shadow-[0_0_15px_rgba(228,253,151,0.2)]'
      }`}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav(user ? '/dashboard' : '/')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <img 
            src="/v-logo.png" 
            alt="V" 
            className="h-8 md:h-10 object-contain drop-shadow-[0_0_15px_rgba(228,253,151,0.2)] group-hover:drop-shadow-[0_0_15px_rgba(228,253,151,0.5)] transition-all"
          />
          <span className="font-display tracking-[0.15em] text-white text-xl group-hover:text-[var(--color-lime-sprout)] transition-colors drop-shadow-[0_0_10px_rgba(228,253,151,0)] group-hover:drop-shadow-[0_0_10px_rgba(228,253,151,0.5)]">
            VERITY
          </span>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = currentRoute === link.route;
            return (
              <button
                key={link.route}
                onClick={() => handleNav(link.route)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer relative border border-transparent ${
                  isActive 
                    ? 'text-[var(--color-lime-sprout)] drop-shadow-[0_0_10px_rgba(228,253,151,0.5)]' 
                    : 'text-gray-400 hover:text-white hover:bg-[var(--bg-card)]/50 hover:border-[var(--color-lime-sprout)]/30 hover:shadow-[0_0_15px_rgba(228,253,151,0.1)] hover:backdrop-blur-md'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-lime-sprout)] shadow-[0_0_10px_rgba(228,253,151,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <button
                onClick={() => handleNav('/login')}
                className="text-sm font-medium text-white hover:text-[var(--color-lime-sprout)] transition-colors cursor-pointer px-5 py-2 border border-white/[0.08] rounded-full hover:bg-white/[0.03]"
              >
                Login
              </button>
              <button
                onClick={() => handleNav('/signup')}
                className="px-6 py-2 text-sm font-bold bg-[var(--color-lime-sprout)] hover:brightness-110 text-gray-950 rounded-full transition-all shadow-[0_0_20px_rgba(228,253,151,0.15)] cursor-pointer"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex relative items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-3" />
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
                  className="bg-transparent border border-white/10 rounded-full py-1.5 pl-9 pr-12 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[var(--color-lime-sprout)]/30 w-48"
                />
                <button 
                  onClick={() => {
                    if (searchQuery.trim()) {
                      onNavigate('/history', { search: searchQuery.trim() });
                    }
                  }}
                  className="absolute right-2 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-gray-500 font-mono hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Enter
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 cursor-pointer ml-2 group"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm font-bold font-sans group-hover:bg-white/20 transition-colors">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-white transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-40 bg-[#121812]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-50 flex flex-col"
                    >
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleNav('/settings');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-white/5 hover:text-rose-300 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
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
            className="p-2 text-gray-400 hover:text-white focus:outline-none"
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
            className="md:hidden pointer-events-auto w-full max-w-6xl mt-4 bg-[var(--bg-card)]/90 backdrop-blur-2xl border border-[var(--color-lime-sprout)]/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] rounded-3xl overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {!user ? (
                <>
                  {navLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => handleNav(link.route)}
                      className="text-left text-sm font-medium tracking-wide text-gray-400 hover:text-white py-2"
                    >
                      {link.name}
                    </button>
                  ))}
                  <div className="w-full h-px bg-white/5 my-2" />
                  <button
                    onClick={() => handleNav('/login')}
                    className="text-left text-sm font-medium tracking-wide text-gray-400 hover:text-white py-2"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNav('/signup')}
                    className="w-full py-3 mt-2 text-sm font-semibold bg-white text-black rounded-xl shadow-lg"
                  >
                    Get Started
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
                          isActive ? 'text-[var(--color-lime-sprout)] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-gray-400'
                        }`}
                      >
                        {link.name}
                      </button>
                    );
                  })}
                  <div className="w-full h-px bg-white/5 my-2" />
                  <button
                    onClick={() => handleNav('/settings')}
                    className="flex items-center gap-3 py-3 text-sm font-medium tracking-wide text-gray-300 hover:text-white"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 py-3 text-sm font-medium tracking-wide text-rose-400"
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
