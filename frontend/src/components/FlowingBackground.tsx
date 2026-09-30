import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FlowingPlane = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(60, 60, 100, 100);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      
      // Complex organic flowing wave math
      const wave1 = Math.sin(x * 0.15 + time * 0.4) * 1.5;
      const wave2 = Math.cos(y * 0.15 + time * 0.3) * 1.5;
      const wave3 = Math.sin((x + y) * 0.1 + time * 0.5) * 0.5;
      
      positions[i + 2] = wave1 + wave2 + wave3;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -2, -10]}>
      <meshBasicMaterial 
        color="#E4FD9B" 
        wireframe={true} 
        transparent={true} 
        opacity={0.4}
      />
    </mesh>
  );
};

export const FlowingBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
      <Canvas camera={{ position: [0, 2, 8], fov: 75 }}>
        <fog attach="fog" args={['#09090b', 10, 40]} />
        <FlowingPlane />
      </Canvas>
      
      {/* Overlay gradient so it fades out organically at the edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-transparent to-[#09090b]/80"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,9,11,0.8)_80%)]"></div>
    </div>
  );
};
