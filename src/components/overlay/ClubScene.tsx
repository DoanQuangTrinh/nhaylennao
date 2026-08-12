import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  MeshReflectorMaterial,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "@/lib/3d/gsap-core";
import { useLiveStore } from "@/lib/store/live-store";

/**
 * R3F club mini-stage — host “R3F preview” + demos.
 * Full OBS venue: imperative Three + GSAP in DanceFloor (stream-stable).
 */
export function ClubScene() {
  const dancers = useLiveStore((s) => s.dancers);
  const ring = useRef<THREE.Mesh>(null);
  const lights = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) ring.current.rotation.z = t * 0.35;
    if (lights.current) lights.current.rotation.y = Math.sin(t * 0.4) * 0.5;
  });

  const list =
    dancers.length > 0
      ? dancers.slice(0, 6)
      : [
          { id: "a", name: "Aya", style: 0, dancing: true },
          { id: "b", name: "Ken", style: 2, dancing: true },
          { id: "c", name: "Mia", style: 4, dancing: true },
        ];

  return (
    <>
      <color attach="background" args={["#100a14"]} />
      <fog attach="fog" args={["#100a14", 8, 28]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#ffe0c8", "#1a1020", 0.7]} />
      <directionalLight position={[4, 8, 5]} intensity={1.2} castShadow />
      <group ref={lights}>
        <pointLight position={[2.5, 3, 1]} intensity={12} color="#22d3ee" />
        <pointLight position={[-2.5, 3, 1]} intensity={10} color="#f472b6" />
        <pointLight position={[0, 4, 0]} intensity={8} color="#c084fc" />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={512}
          mixBlur={0.8}
          mixStrength={0.6}
          roughness={0.35}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#1a1428"
          metalness={0.65}
          mirror={0.35}
        />
      </mesh>

      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.5]}>
        <ringGeometry args={[2.2, 2.28, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={14} blur={2.2} far={6} />
      <Sparkles count={60} scale={[10, 4, 8]} size={2} speed={0.4} color="#ffe8cc" />
      <Environment preset="night" />

      {list.map((d, i) => (
        <R3FDancer
          key={d.id}
          style={"style" in d ? (d as { style: number }).style : i}
          dancing={"dancing" in d ? !!(d as { dancing?: boolean }).dancing : true}
          x={(i - (list.length - 1) / 2) * 1.35}
        />
      ))}

      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
        <mesh position={[0, 2.6, -3.5]}>
          <boxGeometry args={[2.4, 0.5, 0.08]} />
          <meshStandardMaterial color="#0a0610" emissive="#ff2d95" emissiveIntensity={0.4} />
        </mesh>
      </Float>
    </>
  );
}

function R3FDancer({
  style,
  dancing,
  x,
}: {
  style: number;
  dancing: boolean;
  x: number;
}) {
  const g = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const colors = [0x22d3ee, 0xc084fc, 0xf472b6, 0x34d399, 0xfbbf24, 0xfb7185];
  const outfit = colors[style % colors.length]!;

  useEffect(() => {
    if (!g.current) return;
    g.current.scale.setScalar(0.01);
    const tw = gsap.to(g.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.55,
      delay: Math.abs(x) * 0.08,
      ease: "back.out(1.6)",
    });
    return () => {
      tw.kill();
    };
  }, [x]);

  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime + x;
    if (dancing) {
      g.current.position.y = Math.abs(Math.sin(t * 5.5)) * 0.1;
      g.current.rotation.y = Math.sin(t * 0.9) * 0.3;
      const swing = Math.sin(t * 6);
      if (armL.current) armL.current.rotation.x = swing * 1.1;
      if (armR.current) armR.current.rotation.x = -swing * 1.1;
    }
  });

  return (
    <group ref={g} position={[x, 0, 0.8]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color={outfit} transparent opacity={0.4} />
      </mesh>
      <mesh position={[-0.11, 0.48, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        <meshStandardMaterial color="#14101f" />
      </mesh>
      <mesh position={[0.11, 0.48, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        <meshStandardMaterial color="#14101f" />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.45, 6, 12]} />
        <meshStandardMaterial
          color={outfit}
          emissive={outfit}
          emissiveIntensity={0.45}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 1.58, 0]} castShadow>
        <sphereGeometry args={[0.16, 18, 18]} />
        <meshStandardMaterial color="#f5d0b0" roughness={0.7} />
      </mesh>
      <mesh ref={armL} position={[-0.32, 1.15, 0]}>
        <capsuleGeometry args={[0.05, 0.38, 4, 8]} />
        <meshStandardMaterial color="#f5d0b0" />
      </mesh>
      <mesh ref={armR} position={[0.32, 1.15, 0]}>
        <capsuleGeometry args={[0.05, 0.38, 4, 8]} />
        <meshStandardMaterial color="#f5d0b0" />
      </mesh>
    </group>
  );
}
