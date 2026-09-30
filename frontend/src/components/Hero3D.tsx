import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Float, Environment, Line } from '@react-three/drei';
import * as THREE from 'three';

// --------------------------------------------------------
// HTML WRAPPERS FOR GLASS PANELS
// --------------------------------------------------------
const GlassPanelLabel = ({ title, children, accentColor = 'rgba(255,255,255,0.1)' }: any) => (
  <div 
    className="backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col relative group transition-all"
    style={{ width: '240px', background: 'linear-gradient(135deg, rgba(20,20,25,0.6) 0%, rgba(10,10,15,0.8) 100%)' }}
  >
    {/* Inner glow/highlight on top edge */}
    <div className="absolute top-0 left-0 right-0 h-[1px] opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
    
    <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
      <span className="text-[9px] font-mono tracking-[0.2em] text-white/50 uppercase font-medium">
        {title}
      </span>
    </div>
    <div className="p-5 text-white/90 text-sm font-light leading-relaxed">
      {children}
    </div>
  </div>
);

// --------------------------------------------------------
// INDIVIDUAL FLOATING OBJECTS
// --------------------------------------------------------

const TextCard = () => {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5} position={[-2, 1.5, -2]}>
      <mesh>
        <boxGeometry args={[3, 2, 0.05]} />
        <meshPhysicalMaterial 
          color="#000000" 
          transmission={0.9} 
          opacity={1} 
          metalness={0.2} 
          roughness={0.1} 
          ior={1.5} 
          thickness={0.1}
          transparent
        />
        <Html transform position={[0, 0, 0.03]} scale={0.5} occlude="blending">
          <GlassPanelLabel title="TEXT" accentColor="rgba(255,255,255,0.1)">
            <div className="flex flex-col gap-2 text-xs text-gray-300">
              <span className="opacity-60 blur-[0.5px]">"Artificial intelligence..."</span>
              <span className="text-white font-medium">"semantic representation..."</span>
              <span className="opacity-60 blur-[0.5px]">"writing patterns..."</span>
            </div>
          </GlassPanelLabel>
        </Html>
      </mesh>
    </Float>
  );
};

const SemanticSignal = () => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.elapsedTime * 0.2;
      ringRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} position={[-0.5, 3, -4]}>
      <group>
        {/* Outer Ring */}
        <mesh ref={ringRef}>
          <torusGeometry args={[1, 0.02, 16, 64]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.5} />
        </mesh>
        
        {/* Inner Waveform (Illustrative lines) */}
        <Line points={[[-0.6, 0, 0], [-0.3, 0.4, 0], [0, -0.2, 0], [0.3, 0.5, 0], [0.6, 0, 0]]} color="#38bdf8" lineWidth={1} transparent opacity={0.6} />

        <Html position={[0, -1.3, 0]} center className="pointer-events-none">
          <div className="text-[10px] font-mono text-cyan-400 tracking-[0.2em] uppercase opacity-80">
            Semantic
          </div>
        </Html>
      </group>
    </Float>
  );
};

const StyleSignal = () => {
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.8} position={[-3, -2, -3]}>
      <group>
        {/* 3D Histogram Bars */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => {
          const height = 0.5 + Math.sin(i) * 0.5 + 0.5;
          return (
            <mesh key={i} position={[x, height / 2 - 0.5, 0]}>
              <boxGeometry args={[0.2, height, 0.2]} />
              <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.2} transparent opacity={0.8} />
            </mesh>
          );
        })}
        
        <Html position={[0, -0.8, 0]} center className="pointer-events-none">
          <div className="text-[10px] font-mono text-violet-400 tracking-[0.2em] uppercase opacity-80">
            Stylometric
          </div>
        </Html>
      </group>
    </Float>
  );
};

const DetectionResult = () => {
  return (
    <Float speed={1.8} rotationIntensity={0.1} floatIntensity={0.3} position={[3, 1, 0]}>
      <mesh>
        <boxGeometry args={[3, 1.8, 0.05]} />
        <meshPhysicalMaterial 
          color="#000000" 
          transmission={0.9} 
          opacity={1} 
          metalness={0.2} 
          roughness={0.1} 
          ior={1.5} 
          transparent
        />
        <Html transform position={[0, 0, 0.03]} scale={0.5} occlude="blending">
          <GlassPanelLabel title="DETECTION (ILLUSTRATIVE)" accentColor="rgba(56, 189, 248, 0.2)">
            <div className="flex justify-between items-end mb-4 mt-2">
              <span className="text-sm font-mono text-cyan-400">AI</span>
              <span className="text-3xl font-light text-white">87%</span>
            </div>
            <div className="w-full h-[2px] bg-white/10 mb-4 rounded-full overflow-hidden">
               <div className="h-full bg-cyan-400 w-[87%]" />
            </div>
            <div className="flex justify-between items-center opacity-50">
              <span className="text-xs font-mono">Human</span>
              <span className="text-sm">13%</span>
            </div>
          </GlassPanelLabel>
        </Html>
      </mesh>
    </Float>
  );
};

const RobustnessPanel = () => {
  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.4} position={[2.5, -2, 1]}>
      <mesh>
        <boxGeometry args={[3.2, 2.2, 0.05]} />
        <meshPhysicalMaterial 
          color="#000000" 
          transmission={0.9} 
          opacity={1} 
          metalness={0.2} 
          roughness={0.1} 
          ior={1.5} 
          transparent
        />
        <Html transform position={[0, 0, 0.03]} scale={0.5} occlude="blending">
          <GlassPanelLabel title="ROBUSTNESS" accentColor="rgba(167, 139, 250, 0.3)">
            <div className="flex flex-col gap-3 py-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">ORIGINAL</span>
                <span className="text-sm text-white">94%</span>
              </div>
              
              <div className="flex flex-col items-center opacity-50">
                <div className="w-px h-3 bg-white/20" />
                <span className="text-[8px] font-mono mt-1">PARAPHRASE</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono">PARAPHRASED</span>
                <span className="text-sm text-gray-300">81%</span>
              </div>
              
              <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] tracking-widest uppercase text-violet-400">Degradation</span>
                <span className="text-xs font-mono text-violet-300">Δ -13%</span>
              </div>
            </div>
          </GlassPanelLabel>
        </Html>
      </mesh>
    </Float>
  );
};

// --------------------------------------------------------
// SCENE ASSEMBLY
// --------------------------------------------------------
const Scene = () => {
  const { mouse, size } = useThree();
  const group = useRef<THREE.Group>(null);
  const isMobile = size.width < 768;

  // Extremely subtle mouse parallax
  useFrame(() => {
    if (group.current) {
      const targetX = (mouse.x * Math.PI) * 0.02;
      const targetY = (mouse.y * Math.PI) * 0.02;
      group.current.rotation.y += (targetX - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (-targetY - group.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={group} position={[isMobile ? 0 : 3, 0, -2]}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} color="#ffffff" />
      
      {/* Subtle Environment for glass reflections */}
      <Environment preset="city" />

      {/* Floating Components */}
      <TextCard />
      <SemanticSignal />
      
      {/* Hide some components on mobile to keep it clean */}
      {!isMobile && <StyleSignal />}
      {!isMobile && <DetectionResult />}
      
      <RobustnessPanel />
    </group>
  );
};

export default function Hero3D() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
