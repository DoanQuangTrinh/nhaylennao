import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Clone, Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Dancer } from "@/lib/store/live-store";

const MODEL_A = "/models/Soldier.glb";
const MODEL_B = "/models/Xbot.glb";

const OUTFIT = [
  "#22d3ee",
  "#c084fc",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#60a5fa",
  "#e879f9",
] as const;

const SKIN = [
  "#f1c27d",
  "#e0ac69",
  "#c68642",
  "#8d5524",
  "#ffdbac",
  "#d4a574",
  "#b56b45",
  "#6b3f2a",
] as const;

useGLTF.preload(MODEL_A);
useGLTF.preload(MODEL_B);

type Props = {
  dancer: Dancer;
  index: number;
  total: number;
};

function StylizedHuman({
  outfit,
  skin,
  dancing,
  phase,
}: {
  outfit: string;
  skin: string;
  dancing: boolean;
  phase: number;
}) {
  const g = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime + phase;
    const swing = dancing ? Math.sin(t * 6.2) : Math.sin(t * 1.4) * 0.12;
    const bounce = dancing ? Math.abs(Math.sin(t * 5.4)) * 0.1 : 0;
    g.current.position.y = bounce;

    const setRot = (name: string, x: number) => {
      const o = g.current?.getObjectByName(name);
      if (o) o.rotation.x = x;
    };
    setRot("armL", swing * 1.05);
    setRot("armR", -swing * 1.05);
    setRot("legL", -swing * 0.6);
    setRot("legR", swing * 0.6);
  });

  return (
    <group ref={g}>
      <mesh name="legL" position={[-0.13, 0.48, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.5, 5, 10]} />
        <meshStandardMaterial color="#17122a" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh name="legR" position={[0.13, 0.48, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.5, 5, 10]} />
        <meshStandardMaterial color="#17122a" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[-0.13, 0.06, 0.06]} castShadow>
        <boxGeometry args={[0.14, 0.08, 0.24]} />
        <meshStandardMaterial color={outfit} emissive={outfit} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.13, 0.06, 0.06]} castShadow>
        <boxGeometry args={[0.14, 0.08, 0.24]} />
        <meshStandardMaterial color={outfit} emissive={outfit} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.08, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.5, 6, 14]} />
        <meshStandardMaterial
          color={outfit}
          emissive={outfit}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      <mesh position={[0, 1.12, 0.2]}>
        <boxGeometry args={[0.32, 0.1, 0.05]} />
        <meshStandardMaterial color="#f8fafc" emissive={outfit} emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial color={skin} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.74, -0.02]} castShadow>
        <sphereGeometry args={[0.155, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#0b0614" roughness={0.95} />
      </mesh>
      <mesh position={[-0.055, 1.64, 0.14]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.055, 1.64, 0.14]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh name="armL" position={[-0.36, 1.22, 0]} castShadow>
        <capsuleGeometry args={[0.065, 0.42, 5, 10]} />
        <meshStandardMaterial color={skin} roughness={0.65} />
      </mesh>
      <mesh name="armR" position={[0.36, 1.22, 0]} castShadow>
        <capsuleGeometry args={[0.065, 0.42, 5, 10]} />
        <meshStandardMaterial color={skin} roughness={0.65} />
      </mesh>
    </group>
  );
}

function RealisticGltf({
  url,
  outfit,
  dancing,
  styleBoost,
}: {
  url: string;
  outfit: string;
  dancing: boolean;
  styleBoost: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (!group.current) return;
    const accent = new THREE.Color(outfit);
    group.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial;
        if (m.color) m.color.lerp(accent, 0.2);
        if ("emissive" in m) {
          m.emissive = accent.clone().multiplyScalar(0.12);
          m.emissiveIntensity = 0.4;
        }
        m.needsUpdate = true;
      }
    });
  }, [outfit]);

  useEffect(() => {
    const list = Object.values(actions).filter(Boolean) as THREE.AnimationAction[];
    if (!list.length) return;
    const byName = (n: string) =>
      list.find((a) => a.getClip().name.toLowerCase() === n.toLowerCase());
    const idle = byName("Idle") ?? list[0]!;
    const move = byName("Run") ?? byName("Walk") ?? idle;
    idle.reset().play();
    if (move !== idle) move.reset().play();
  }, [actions]);

  useEffect(() => {
    const list = Object.values(actions).filter(Boolean) as THREE.AnimationAction[];
    if (!list.length) return;
    const byName = (n: string) =>
      list.find((a) => a.getClip().name.toLowerCase() === n.toLowerCase());
    const idle = byName("Idle") ?? list[0]!;
    const move = byName("Run") ?? byName("Walk") ?? idle;
    if (dancing) {
      idle.setEffectiveWeight(move === idle ? 1 : 0.15);
      move.setEffectiveWeight(1);
      move.setEffectiveTimeScale(1.4 + styleBoost * 0.1);
    } else {
      idle.setEffectiveWeight(1);
      idle.setEffectiveTimeScale(1);
      if (move !== idle) move.setEffectiveWeight(0);
    }
  }, [dancing, styleBoost, actions]);

  return (
    <group ref={group} scale={1}>
      <Clone object={scene} castShadow receiveShadow deep />
    </group>
  );
}

export function DancerAvatar({ dancer, index, total }: Props) {
  const useXbot = dancer.skin % 2 === 1;
  const modelUrl = useXbot ? MODEL_B : MODEL_A;
  const root = useRef<THREE.Group>(null);
  const phase = useMemo(() => {
    let h = 0;
    for (let i = 0; i < dancer.id.length; i++) h = (h + dancer.id.charCodeAt(i) * (i + 1)) % 1000;
    return h * 0.01;
  }, [dancer.id]);

  const outfit = OUTFIT[dancer.style % OUTFIT.length]!;
  const skin = SKIN[dancer.skin % SKIN.length]!;

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    const g = root.current;
    if (!g) return;
    const spacing = Math.min(1.55, 7.2 / Math.max(total, 1));
    const targetX = (index - (total - 1) / 2) * spacing;
    const t = state.clock.elapsedTime + phase;

    if (dancer.dancing) {
      g.position.x = targetX + Math.sin(t * 2.3) * 0.12;
      g.position.z = Math.cos(t * 1.8) * 0.14;
      g.rotation.y = Math.sin(t * 0.85) * 0.35;
    } else {
      g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 6, d);
      g.position.z = THREE.MathUtils.damp(g.position.z, 0, 6, d);
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, 0, 4, d);
    }
  });

  return (
    <group ref={root}>
      {/* Always-visible club avatars */}
      <StylizedHuman
        outfit={outfit}
        skin={skin}
        dancing={dancer.dancing}
        phase={phase}
      />

      {/* Realistic skinned GLB layered on top (real GPU). If it fails, Suspense keeps stylized. */}
      <Suspense fallback={null}>
        <group position={[0, 0, 0]}>
          <RealisticGltf
            url={modelUrl}
            outfit={outfit}
            dancing={dancer.dancing}
            styleBoost={dancer.style % 3}
          />
        </group>
      </Suspense>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} renderOrder={2}>
        <circleGeometry args={[0.55, 28]} />
        <meshStandardMaterial
          color={outfit}
          emissive={outfit}
          emissiveIntensity={2}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      <Html
        position={[0, 1.95, 0]}
        center
        distanceFactor={9}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          className="whitespace-nowrap rounded-full border border-white/25 bg-black/80 px-2.5 py-0.5 text-[11px] font-bold text-white"
          style={{ boxShadow: `0 0 14px ${outfit}99` }}
        >
          {dancer.isDemo ? "· " : ""}
          {dancer.name}
        </div>
      </Html>
    </group>
  );
}
