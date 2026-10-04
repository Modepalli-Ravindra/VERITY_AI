import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FULL_PARAPHRASE = "Artificial intelligence has rapidly transformed the way people work, learn, and solve problems across different industries. Although AI was created by humans, modern systems can process large amounts of information, generate content, analyze patterns, and automate many tasks. Its influence can already be seen across healthcare, finance, agriculture, education, technology, communication, transportation, and other sectors.";

export const HeroVisual: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Explicit state management for the demo timeline
  const [demoStep, setDemoStep] = useState<number>(0);
  const [paraphraseText, setParaphraseText] = useState("");
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [isParaphraseComplete, setIsParaphraseComplete] = useState(false);

  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTyping = () => {
    setIsParaphrasing(true);
    setIsParaphraseComplete(false);
    setParaphraseText("");
    
    let index = 0;
    typingIntervalRef.current = setInterval(() => {
      if (index < FULL_PARAPHRASE.length) {
        setParaphraseText(FULL_PARAPHRASE.substring(0, index + 1));
        index++;
      } else {
        // Typing finished
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setIsParaphrasing(false);
        setIsParaphraseComplete(true);
        
        // Hold for 3 seconds, then move to step 2
        holdTimeoutRef.current = setTimeout(() => {
          setDemoStep(2);
        }, 3000);
      }
    }, 15); // Fast typing speed
  };

  const handleStepChange = (step: number) => {
    // Clear all existing timeouts/intervals when manually or automatically changing steps
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

    setDemoStep(step);

    if (step === 0) {
      // Step 0: Detect -> wait 4s then go to Paraphrase
      holdTimeoutRef.current = setTimeout(() => {
        setDemoStep(1);
      }, 4000);
    } else if (step === 1) {
      // Step 1: Paraphrase -> Typewriter -> Hold -> Step 2
      startTyping();
    } else if (step === 2) {
      // Step 2: Re-verify -> wait 3s then go to Compare
      holdTimeoutRef.current = setTimeout(() => {
        setDemoStep(3);
      }, 3000);
    } else if (step === 3) {
      // Step 3: Compare -> wait 5s then restart
      holdTimeoutRef.current = setTimeout(() => {
        setDemoStep(0);
      }, 5000);
    }
  };

  // Initial start
  useEffect(() => {
    handleStepChange(0);
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const tokens = ['perplexity', 'ttr_diversity', 'burstiness', 'stylometric', 'ai_prob', 'variance'];
    const particles: any[] = [];
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        label: tokens[i % tokens.length],
        size: Math.random() * 1.5 + 1,
        color: i % 2 === 0 ? '#E4FD97' : '#10b981'
      });
    }

    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(228, 253, 151, 0.1)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x += 10) {
        const y = height / 2 + Math.sin(x * 0.012 + time) * 30 + Math.cos(x * 0.02 + time * 0.8) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden border border-white/10 bg-[#06070a]/95 backdrop-blur-md shadow-2xl p-6 flex flex-col justify-between">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] font-mono text-gray-300 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-lime-sprout)] animate-pulse" />
          <span>VERITY CORE ENGINE</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
          LIVE DEMO
        </span>
      </div>

      {/* Dynamic Simulated Preview Cards */}
      <div className="relative z-10 my-4 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {demoStep === 0 && (
            <motion.div 
              key="detect"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl bg-[#090b09]/80 border border-white/10 space-y-4 backdrop-blur-xl shadow-lg"
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 border-b border-white/10 pb-2">
                <span>AI DETECTION SCAN</span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30">
                  AI DETECTED
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-full border-4 border-red-500/30 border-t-red-500">
                  <span className="text-white font-bold text-sm">94%</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Highly likely AI-generated</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    <span className="bg-red-500/20 text-red-200 px-1 rounded">Furthermore, it is imperative</span> to analyze the algorithmic constraints...
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {demoStep === 1 && (
            <motion.div 
              key="paraphrase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl bg-[#090b09]/80 border border-[var(--color-lime-sprout)]/30 space-y-4 backdrop-blur-xl shadow-[0_0_15px_rgba(228,253,151,0.05)] relative overflow-hidden"
            >
              {isParaphrasing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-lime-sprout)]/5 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
              )}
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 border-b border-white/10 pb-2 relative z-10">
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full bg-[var(--color-lime-sprout)] ${isParaphrasing ? 'animate-pulse' : ''}`}></span> 
                  {isParaphraseComplete ? 'PARAPHRASE COMPLETE' : 'PROCESSING PARAPHRASE...'}
                </span>
                <span className="text-[var(--color-lime-sprout)]">
                  {isParaphraseComplete ? 'DONE' : 'REWRITING TEXT'}
                </span>
              </div>
              <div className="relative z-10 py-1 min-h-[4rem]">
                <p className="text-[12px] font-mono text-emerald-100 leading-relaxed">
                  {paraphraseText}
                  {(isParaphrasing || isParaphraseComplete) && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-[var(--color-lime-sprout)] animate-pulse align-middle"></span>
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {demoStep === 2 && (
            <motion.div 
              key="reverify"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl bg-black/80 border border-[var(--color-lime-sprout)]/30 space-y-3 backdrop-blur-md shadow-[0_0_20px_rgba(228,253,151,0.05)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
              <div className="flex justify-between items-center text-[11px] font-mono text-gray-300 border-b border-white/10 pb-2">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  RE-VERIFYING AI DETECTION SCORE...
                </span>
                <span className="text-emerald-400 font-bold tracking-wide">HUMAN RHYTHM ACHIEVED</span>
              </div>
              <p className="text-xs font-mono text-emerald-200/90 leading-relaxed py-1 line-clamp-2">
                {FULL_PARAPHRASE}
              </p>
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 pt-2 border-t border-white/5">
                <span>Re-check Score: <strong className="text-emerald-400">98% Human</strong></span>
                <span className="text-[var(--color-lime-sprout)]">Stylometrics: Passed</span>
              </div>
            </motion.div>
          )}

          {demoStep === 3 && (
            <motion.div 
              key="compare"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl bg-[#090b09]/80 border border-white/10 space-y-4 backdrop-blur-xl shadow-lg"
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 border-b border-white/10 pb-2">
                <span>SIDE-BY-SIDE COMPARE</span>
                <span className="text-emerald-400 font-bold tracking-wide">SIMILARITY: 25%</span>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <span className="text-[9px] font-mono text-gray-500 uppercase">Original Text</span>
                  <div className="h-[4.5rem] p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] text-gray-400 line-through decoration-red-500/50 overflow-hidden">
                    Furthermore, it is imperative to elucidate the intricate algorithmic constraints...
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-[9px] font-mono text-[var(--color-lime-sprout)] uppercase">Paraphrased Text</span>
                  <div className="h-[4.5rem] p-2 rounded-lg bg-[var(--color-lime-sprout)]/5 border border-[var(--color-lime-sprout)]/20 text-[10px] text-emerald-100 overflow-hidden">
                    Artificial intelligence has rapidly transformed the way people work, learn...
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Step Indicator Bar */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-[10px] font-mono text-gray-400">
        <div className="flex gap-2">
          {['1. Detect', '2. Paraphrase', '3. Re-Verify', '4. Compare'].map((label, idx) => (
            <button
              key={label}
              onClick={() => handleStepChange(idx)}
              className={`px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
                demoStep === idx 
                  ? 'bg-[var(--color-lime-sprout)] text-black font-bold shadow-[0_0_15px_rgba(228,253,151,0.3)]' 
                  : 'bg-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

