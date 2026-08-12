import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "@/lib/3d/gsap-core";
import { useLiveStore } from "@/lib/store/live-store";

/**
 * R3F + GSAP gift orbit layer — sits above the main club canvas.
 * Spawns glowing orbs + rings when a gift lands.
 */
export function GiftOrbitFx() {
  const gifts = useLiveStore((s) => s.gifts);
  const latest = gifts[0];
  const group = useRef<THREE.Group>(null);
  const orbs = useRef<THREE.Mesh[]>([]);
  const ring = useRef<THREE.Mesh>(null);
  const lastId = useRef<string | null>(null);

  const colors = useMemo(
    () => [0x22d3ee, 0xf472b6, 0xc084fc, 0xfbbf24, 0xff6a00],
    [],
  );

  useEffect(() => {
    if (!latest || latest.id === lastId.current) return;
    lastId.current = latest.id;

    const intensity =
      latest.effect === "legendary"
        ? 1.4
        : latest.effect === "mega"
          ? 1.1
          : latest.effect === "fireworks"
            ? 0.9
            : 0.55;

    orbs.current.forEach((m, i) => {
      const col = colors[i % colors.length]!;
      (m.material as THREE.MeshBasicMaterial).color.setHex(col);
      m.scale.setScalar(0.01);
      m.visible = true;
      gsap.to(m.scale, {
        x: 0.35 + intensity * 0.25,
        y: 0.35 + intensity * 0.25,
        z: 0.35 + intensity * 0.25,
        duration: 0.35,
        delay: i * 0.04,
        ease: "back.out(2)",
      });
      gsap.to(m.position, {
        y: 1.2 + Math.random() * 1.8 * intensity,
        duration: 1.1,
        delay: i * 0.03,
        ease: "power2.out",
      });
      gsap.to(m.scale, {
        x: 0.01,
        y: 0.01,
        z: 0.01,
        duration: 0.4,
        delay: 1.0 + i * 0.02,
        onComplete: () => {
          m.visible = false;
          m.position.set(
            (Math.random() - 0.5) * 3,
            0.2,
            (Math.random() - 0.5) * 2,
          );
        },
      });
    });

    if (ring.current) {
      ring.current.visible = true;
      ring.current.scale.setScalar(0.2);
      const mat = ring.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.85;
      gsap.to(ring.current.scale, {
        x: 3.5 * intensity,
        y: 3.5 * intensity,
        z: 3.5 * intensity,
        duration: 0.9,
        ease: "power2.out",
      });
      gsap.to(mat, {
        opacity: 0,
        duration: 0.9,
        onComplete: () => {
          if (ring.current) ring.current.visible = false;
        },
      });
    }
  }, [latest, colors]);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.35;
    if (ring.current?.visible) ring.current.rotation.z += dt * 2.5;
  });

  return (
    <group ref={group} position={[0, 0.8, 0]}>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) orbs.current[i] = el;
          }}
          position={[(Math.random() - 0.5) * 2.5, 0.2, (Math.random() - 0.5) * 2]}
          visible={false}
        >
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color={colors[i % colors.length]} transparent />
        </mesh>
      ))}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.4, 0.55, 48]} />
        <meshBasicMaterial
          color={0xf472b6}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 2, 2]} intensity={2} color="#c084fc" />
    </group>
  );
}
