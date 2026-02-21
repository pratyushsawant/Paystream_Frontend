import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function HoloSphere() {
  const outerRef = useRef<THREE.Mesh>(null);
  const midRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const r1Ref = useRef<THREE.Mesh>(null);
  const r2Ref = useRef<THREE.Mesh>(null);
  const r3Ref = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) groupRef.current.rotation.y = t * 0.04;

    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.1;
      outerRef.current.rotation.x = Math.sin(t * 0.2) * 0.07;
    }
    if (midRef.current) {
      midRef.current.rotation.y = -t * 0.15;
      midRef.current.rotation.z = t * 0.06;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.22;
      const s = 1 + Math.sin(t * 1.4) * 0.04;
      innerRef.current.scale.setScalar(s);
    }
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.12;
      coreRef.current.scale.setScalar(s);
    }
    if (r1Ref.current) r1Ref.current.rotation.z = t * 0.28;
    if (r2Ref.current) { r2Ref.current.rotation.x = t * 0.18; r2Ref.current.rotation.z = -t * 0.12; }
    if (r3Ref.current) { r3Ref.current.rotation.y = t * 0.22; r3Ref.current.rotation.x = t * 0.08; }
  });

  return (
    <group ref={groupRef}>
      {/* Outer wireframe icosahedron */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[2.2, 2]} />
        <meshBasicMaterial color="#88B5FC" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Mid icosahedron */}
      <mesh ref={midRef} rotation={[0.6, 0.4, 0]}>
        <icosahedronGeometry args={[1.75, 1]} />
        <meshBasicMaterial color="#7E3FF2" wireframe transparent opacity={0.07} />
      </mesh>

      {/* Inner sphere — main glowing body */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[1.15, 48, 48]} />
        <meshStandardMaterial
          color="#06090F"
          emissive="#5B21F5"
          emissiveIntensity={2.2}
          transparent
          opacity={0.88}
          roughness={0}
          metalness={0.5}
        />
      </mesh>

      {/* Bright core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.48, 16, 16]} />
        <meshStandardMaterial
          color="#38B2F6"
          emissive="#38B2F6"
          emissiveIntensity={4}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Ring 1 */}
      <mesh ref={r1Ref} rotation={[Math.PI / 3.5, 0, 0]}>
        <torusGeometry args={[2.55, 0.007, 8, 160]} />
        <meshBasicMaterial color="#88B5FC" transparent opacity={0.55} />
      </mesh>

      {/* Ring 2 */}
      <mesh ref={r2Ref} rotation={[0, Math.PI / 4, Math.PI / 5]}>
        <torusGeometry args={[2.85, 0.005, 8, 160]} />
        <meshBasicMaterial color="#7E3FF2" transparent opacity={0.38} />
      </mesh>

      {/* Ring 3 */}
      <mesh ref={r3Ref} rotation={[Math.PI / 7, Math.PI / 3, 0]}>
        <torusGeometry args={[3.15, 0.003, 8, 160]} />
        <meshBasicMaterial color="#38B2F6" transparent opacity={0.22} />
      </mesh>

      {/* Sparkle field */}
      <Sparkles count={70} scale={6} size={1.0} speed={0.2} color="#88B5FC" opacity={0.45} />

      {/* Lights */}
      <ambientLight intensity={0.06} />
      <pointLight color="#7E3FF2" intensity={5} distance={12} />
      <pointLight color="#38B2F6" intensity={3} distance={9} position={[4, 2, 1]} />
      <pointLight color="#88B5FC" intensity={1.8} distance={9} position={[-3, -2, 2]} />
    </group>
  );
}

export default function AICore({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.5], fov: 44 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', ...style }}
      className={className}
    >
      <Suspense fallback={null}>
        <HoloSphere />
      </Suspense>
    </Canvas>
  );
}
