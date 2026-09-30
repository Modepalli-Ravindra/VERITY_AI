import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Octahedron, Icosahedron, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const CoreVisual = () => {
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.5;
      coreRef.current.rotation.x = t * 0.2;
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = -t * 0.1;
      outerRef.current.rotation.z = t * 0.15;
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        {/* Inner Glowing Core */}
        <Octahedron ref={coreRef} args={[1.5, 0]}>
          <meshStandardMaterial 
            color="#E4FD97" 
            emissive="#E4FD97" 
            emissiveIntensity={2} 
            wireframe={true} 
          />
        </Octahedron>

        {/* Outer Glass Shell */}
        <Icosahedron ref={outerRef} args={[2.5, 0]}>
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={2}
            chromaticAberration={0.025}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.1}
            temporalDistortion={0.0}
            iridescence={1}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            color="#4A6848"
          />
        </Icosahedron>
      </Float>

      {/* Floating Particles */}
      <Sparkles 
        count={50} 
        scale={10} 
        size={3} 
        speed={0.4} 
        color="#E4FD97" 
        opacity={0.5}
      />
    </group>
  );
};

export const Auth3DVisual = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 10]} intensity={1} color="#E4FD97" />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#4A6848" />
        <pointLight position={[0, 0, 0]} intensity={2} color="#E4FD97" distance={10} />
        <CoreVisual />
      </Canvas>
    </div>
  );
};
