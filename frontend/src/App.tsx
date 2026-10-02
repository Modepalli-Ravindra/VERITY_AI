import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { ParaphrasePage } from './pages/ParaphrasePage';
import { ComparePage } from './pages/ComparePage';
import { HistoryPage } from './pages/HistoryPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SettingsPage } from './pages/SettingsPage';
import { X, Play } from 'lucide-react';
import { Player } from '@remotion/player';
import { DemoVideoComposition } from './components/RemotionDemoVideo';

const MainRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => window.location.pathname || '/');
  const [routeState, setRouteState] = useState<any>(null);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string, state?: any) => {
    setCurrentRoute(route);
    setRouteState(state || null);
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const protectedRoutes = ['/dashboard', '/analyze', '/paraphrase', '/compare', '/history', '/settings'];

  useEffect(() => {
    if (!loading) {
      if (user && (currentRoute === '/' || currentRoute === '/login' || currentRoute === '/signup')) {
        navigate('/dashboard');
      } else if (!user && protectedRoutes.includes(currentRoute)) {
        navigate('/');
      }
    }
  }, [user, loading, currentRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-8">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              borderRadius: ["20%", "50%", "20%"]
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              repeat: Infinity,
            }}
            className="w-16 h-16 border-[3px] border-[var(--color-lime-sprout)]/20 border-t-[var(--color-lime-sprout)] border-l-[var(--color-lime-sprout)] shadow-[0_0_30px_rgba(228,253,151,0.2)]"
          />
          <div className="flex flex-col items-center gap-2">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              className="text-[var(--color-lime-sprout)] font-medium tracking-[0.2em] text-xs uppercase"
            >
              Initializing VERITY
            </motion.p>
            <p className="text-gray-500 text-[10px] tracking-widest uppercase">Security & Auth Session</p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated users are redirected by useEffect, but render nothing or a loader momentarily
  if (protectedRoutes.includes(currentRoute) && !user) {
    return <LandingPage onNavigate={navigate} />;
  }

  // 2. Authenticated users are redirected by useEffect, but render nothing or dashboard momentarily
  if (user && (currentRoute === '/login' || currentRoute === '/signup' || currentRoute === '/')) {
    return <DashboardPage onNavigate={navigate} />;
  }

  const renderView = () => {
    switch (currentRoute) {
      case '/':
        return <LandingPage onNavigate={navigate} />;
      case '/login':
        return <LoginPage onNavigate={navigate} />;
      case '/signup':
        return <SignUpPage onNavigate={navigate} />;
      case '/dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case '/analyze':
        return <AnalyzerPage onNavigate={navigate} />;
      case '/paraphrase':
        return <ParaphrasePage onNavigate={navigate} initialText={routeState?.text || ''} initialResult={routeState?.result || null} />;
      case '/compare':
        return <ComparePage 
                 onNavigate={navigate} 
                 initialOriginal={routeState?.original || ''} 
                 initialHumanized={routeState?.humanized || ''} 
                 initialOrigResult={routeState?.origResult || null}
                 initialHumResult={routeState?.humResult || null}
               />;
      case '/history':
        return <HistoryPage onNavigate={navigate} initialSearch={routeState?.search || ''} />;
      case '/settings':
        return <SettingsPage onNavigate={navigate} />;
      case '/docs':
        return <DocumentationPage onNavigate={navigate} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  const isAuthRoute = currentRoute === '/login' || currentRoute === '/signup';
  const isAppRoute = protectedRoutes.includes(currentRoute);

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-hidden relative">
      
      {/* 
        Layout Logic:
        1. Auth routes (Login/SignUp) -> Full screen, no navbar.
        2. Landing Page (/) -> Use old top Navbar.
        3. App routes (/dashboard, etc.) -> Use new Sidebar + TopBar layout.
      */}
      
      {isAppRoute && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[var(--bg-dark)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-dark)] via-[#081009] to-[#040804]" />
          <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-[var(--color-lime-sprout)]/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 opacity-[0.04] bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] mix-blend-overlay" />
        </div>
      )}

      {!isAuthRoute && (
        <Navbar currentRoute={currentRoute} onNavigate={navigate} />
      )}

      {isAppRoute ? (
        <main className="flex-1 overflow-y-auto pt-28 pb-12 z-10 relative">
          {renderView()}
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto">{renderView()}</main>
      )}

      {/* Remotion Product Demo Video Modal */}
      {showDemoVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#0e0e14] border border-indigo-500/30 rounded-3xl p-4 sm:p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-300">
                <Play className="w-4 h-4 text-indigo-400" />
                <span>VERITY Remotion Product Demo</span>
              </div>
              <button
                onClick={() => setShowDemoVideo(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-inner bg-black">
              <Player
                component={DemoVideoComposition}
                durationInFrames={150}
                compositionWidth={1280}
                compositionHeight={720}
                fps={30}
                controls
                autoPlay
                loop
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
