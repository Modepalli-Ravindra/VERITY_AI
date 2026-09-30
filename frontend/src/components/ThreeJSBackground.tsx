import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';

const GlowingOrb = ({ color, scale, position, speed, distort }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * (speed * 0.8);
      // Subtle floating movement
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 2) * 0.5;
    }
  });

  return (
    <Float speed={speed * 10} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={scale} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={distort}
          speed={speed * 5}
          transparent={true}
          opacity={0.3}
          roughness={1}
          metalness={0.1}
        />
      </Sphere>
    </Float>
  );
};

export const ThreeJSBackground = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
      <div className="absolute inset-0 blur-[120px] scale-110">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} color="#4A6848" />
          
          {/* Main Deep Green Orb */}
          <GlowingOrb color="#2D3E2C" scale={4} position={[-3, 2, 0]} speed={0.05} distort={0.4} />
          
          {/* Secondary Darker Orb */}
          <GlowingOrb color="#161D15" scale={3.5} position={[4, -2, -2]} speed={0.03} distort={0.5} />
          
          {/* Soft wide glow orb */}
          <GlowingOrb color="#1B261A" scale={5} position={[0, -4, -4]} speed={0.02} distort={0.3} />
        </Canvas>
      </div>
      {/* Subtle noise overlay for premium texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
