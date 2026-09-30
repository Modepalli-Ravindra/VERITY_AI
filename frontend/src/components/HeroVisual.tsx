import React, { useEffect, useRef, useState } from 'react';

export const HeroVisual: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0); // 0: Analyze, 1: Detection Result, 2: Paraphrased

  useEffect(() => {
    // Step rotation timer for interactive product preview
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
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

    const tokens = [
      'perplexity', 'burstiness', 'ttr_diversity', 'pos_syntax',
      'formal_transition', 'nominalization', 'semantic_vec', 'ai_prob_0.87',
      'human_variance', 'entropy', 'token_prob', 'stylometric_trace'
    ];

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      label: string;
      size: number;
      alpha: number;
      color: string;
    }> = [];

    const numParticles = Math.min(24, Math.floor(width / 35));

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        label: tokens[i % tokens.length],
        size: Math.random() * 2 + 1.5,
        alpha: Math.random() * 0.4 + 0.3,
        color: i % 2 === 0 ? '#6366f1' : '#10b981'
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Subtle editorial data grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 50;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Stylometric wave trace
      ctx.beginPath();
      ctx.strokeStyle = activeStep === 2 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x += 10) {
        const y = height / 2 + Math.sin(x * 0.012 + time) * 30 + Math.cos(x * 0.02 + time * 0.8) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Node connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.12;
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Particles & labels
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '9px "JetBrains Mono", monospace, sans-serif';
        ctx.fillStyle = 'rgba(165, 180, 252, 0.6)';
        ctx.fillText(p.label, p.x + 8, p.y + 3);
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeStep]);

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden border border-white/10 bg-[#06070a]/95 backdrop-blur-md shadow-2xl p-5 flex flex-col justify-between">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[10px] font-mono text-gray-300 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-lime-sprout)] animate-pulse" />
          <span>INTERACTIVE PRODUCT PREVIEW</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
          SIMULATION DEMO
        </span>
      </div>

      {/* Dynamic Simulated Preview Cards */}
      <div className="relative z-10 my-4 space-y-3">
        {activeStep === 0 && (
          <div className="p-4 rounded-xl bg-black/70 border border-white/10 space-y-2 backdrop-blur-md animate-fade-in">
            <div className="flex justify-between items-center text-[11px] font-mono text-gray-400 border-b border-white/10 pb-1.5">
              <span>INPUT SAMPLE</span>
              <span className="text-[var(--color-lime-sprout)] font-bold">ANALYZING...</span>
            </div>
            <p className="text-xs font-mono text-gray-300 leading-relaxed italic">
              "Furthermore, it is imperative to delve into the intricate tapestry of machine learning algorithms..."
            </p>
          </div>
        )}

        {activeStep === 1 && (
          <div className="p-4 rounded-xl bg-black/80 border border-[var(--color-lime-sprout)]/30 space-y-3 backdrop-blur-md animate-fade-in">
            <div className="flex justify-between items-center text-[11px] font-mono text-gray-300 border-b border-white/10 pb-1.5">
              <span>DETECTION RESULT</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-lime-sprout)]/20 text-purple-300 border border-[var(--color-lime-sprout)]/30">
                HIGH CONFIDENCE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-purple-300 block">AI GENERATED</span>
                <span className="text-xs text-gray-400 font-mono">87% AI Probability &bull; 13% Human</span>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-[var(--color-lime-sprout)] flex items-center justify-center text-xs font-bold text-white bg-purple-900/30">
                87%
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="p-4 rounded-xl bg-black/80 border border-[var(--color-lime-sprout)]/30 space-y-3 backdrop-blur-md animate-fade-in">
            <div className="flex justify-between items-center text-[11px] font-mono text-gray-300 border-b border-white/10 pb-1.5">
              <span>HUMANIZATION PREVIEW</span>
              <span className="text-emerald-400 font-bold">HUMAN RHYTHM</span>
            </div>
            <p className="text-xs font-mono text-emerald-200/90 leading-relaxed">
              "We should explore how machine learning models actually process data in practice."
            </p>
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 pt-1">
              <span>Re-check Score: <strong className="text-emerald-400">94% Human</strong></span>
              <span className="text-gray-500">Stylometrics: Verified</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Step Indicator Bar */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 text-[10px] font-mono text-gray-400">
        <div className="flex gap-2">
          {['1. Sample', '2. Detect', '3. Paraphrase'].map((label, idx) => (
            <button
              key={label}
              onClick={() => setActiveStep(idx)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeStep === idx 
                  ? 'bg-[var(--color-lime-sprout)]/20 text-[var(--color-lime-sprout)] border border-[var(--color-lime-sprout)]/30 font-bold' 
                  : 'hover:text-gray-200'
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
