import * as THREE from "three";
import {
  CLUB_GLTF,
  createGltfMixer,
  instantiateGltf,
  loadGltf,
  preloadGltf,
  DANCER_GLTF_URLS,
  type ClubModelId,
} from "@/lib/three/gltf";
import { markFactory, type SculptGroup, type SculptRuntime } from "./runtime";
import { OUTFIT } from "./materials";

/** Detect SwiftShader / software WebGL where skinned GLB often renders invisible */
export function isSoftwareWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl =
      (c.getContext("webgl") as WebGLRenderingContext | null) ||
      (c.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return true;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info") as {
      UNMASKED_RENDERER_WEBGL: number;
    } | null;
    const renderer = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    return /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(
      renderer,
    );
  } catch {
    return false;
  }
}

/**
 * User preference. Default ON.
 * localStorage quanbar-use-glb = "0" | "1"
 */
export function isGlbPreferred(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.localStorage.getItem("quanbar-use-glb");
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setGlbPreferred(on: boolean) {
  try {
    window.localStorage.setItem("quanbar-use-glb", on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** True when we should actually spawn skinned GLB (pref ON and GPU ok, or force) */
export function shouldUseGlb(force = false): boolean {
  if (force) return true;
  if (!isGlbPreferred()) return false;
  // Software GL: skinned meshes often invisible — fall back to fashion mesh
  if (isSoftwareWebGL()) return false;
  return true;
}

export type GlbModelKind = "soldier" | "xbot" | "robot";

export type GlbCharOpts = {
  /** 0 soldier · 1 xbot · 2 robot */
  model?: 0 | 1 | 2;
  kind?: GlbModelKind;
  style?: number;
  dancing?: boolean;
  wingTier?: number;
  auraUntil?: number;
  scale?: number;
};

export type GlbRuntime = SculptRuntime & {
  setDancing: (v: boolean) => void;
  state: { dancing: boolean };
};

const KIND_URL: Record<GlbModelKind, string> = {
  soldier: CLUB_GLTF.soldier,
  xbot: CLUB_GLTF.xbot,
  robot: CLUB_GLTF.robot,
};

function resolveKind(opts: GlbCharOpts): GlbModelKind {
  if (opts.kind) return opts.kind;
  const m = opts.model ?? 0;
  if (m === 2) return "robot";
  if (m === 1) return "xbot";
  return "soldier";
}

/**
 * Skinned GLB character via GLTFLoader (Soldier / Xbot / RobotExpressive).
 */
export async function createGlbCharacter(opts: GlbCharOpts = {}): Promise<SculptGroup> {
  const kind = resolveKind(opts);
  const url = KIND_URL[kind];
  const style = opts.style ?? 0;
  const outfit = OUTFIT[style % OUTFIT.length]!;
  const isRobot = kind === "robot";

  const pack = await loadGltf(url);
  const root = instantiateGltf(pack, {
    height: (isRobot ? 1.55 : 1.72) * (opts.scale ?? 1),
    ground: true,
    yaw: Math.PI,
    tint: isRobot ? undefined : outfit,
    tintStrength: kind === "soldier" ? 0.28 : kind === "xbot" ? 0.4 : 0,
    noFrustumCull: true,
    cloneMaterials: true,
  });
  root.name = `glb-${kind}`;

  // Ensure every skinned mesh is visible
  root.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (m.isSkinnedMesh) {
      m.frustumCulled = false;
      m.visible = true;
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          mat.side = THREE.DoubleSide;
          mat.transparent = false;
          mat.opacity = 1;
          mat.depthWrite = true;
          mat.visible = true;
          // @ts-expect-error skinning flag for older three materials
          mat.skinning = true;
          mat.needsUpdate = true;
        }
      }
    }
  });

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 28),
    new THREE.MeshBasicMaterial({
      color: outfit,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.03;
  root.add(glow);

  const now = Date.now();
  const active = (opts.auraUntil ?? 0) > now;
  const tier = active ? opts.wingTier ?? 0 : 0;
  let wingL: THREE.Group | undefined;
  let wingR: THREE.Group | undefined;
  if (tier >= 2) {
    wingL = makeWing(outfit, -1, tier);
    wingR = makeWing(outfit, 1, tier);
    wingL.position.set(-0.18, 1.2, -0.1);
    wingR.position.set(0.18, 1.2, -0.1);
    root.add(wingL, wingR);
  }

  const anim = createGltfMixer(root);
  let idle: THREE.AnimationAction | null = null;
  let dance: THREE.AnimationAction | null = null;

  if (isRobot) {
    idle = anim.playFirst(["Idle", "Standing"]);
    dance = anim.playFirst(["Dance", "Walking", "Wave"]);
  } else if (kind === "xbot") {
    idle = anim.playFirst(["idle", "Idle"]);
    dance = anim.playFirst(["walk", "Walk", "run", "Run"]);
  } else {
    idle = anim.playFirst(["Idle", "idle", "TPose"]);
    dance = anim.playFirst(["Walk", "walk", "Run", "run"]);
  }

  if (dance) dance.setEffectiveWeight(0);
  if (idle) idle.setEffectiveWeight(1);

  const state = { dancing: opts.dancing ?? true };
  const phase = Math.random() * 10;
  const modelRoot =
    (root.userData.gltf as { model?: THREE.Object3D } | undefined)?.model ?? root;

  if (state.dancing && dance && idle) {
    dance.setEffectiveWeight(0.7);
    idle.setEffectiveWeight(0.3);
    dance.timeScale = isRobot ? 1.0 : 1.35;
  }

  const runtime: GlbRuntime = {
    state,
    pivots: { model: modelRoot },
    sockets: { ground: root },
    labels: { model: url, kind, loader: "GLTFLoader" },
    setDancing(v: boolean) {
      state.dancing = v;
      if (dance && idle) {
        if (v) {
          dance.setEffectiveWeight(0.7);
          idle.setEffectiveWeight(0.3);
          dance.timeScale = isRobot ? 1.0 : 1.35;
        } else {
          dance.setEffectiveWeight(0);
          idle.setEffectiveWeight(1);
        }
      }
    },
    dispose: () => {
      anim.stopAll();
    },
    tick(dt: number, t: number) {
      anim.update(dt);
      const ph = t + phase;
      if (state.dancing) {
        if (dance && idle) {
          dance.setEffectiveWeight(0.55 + Math.sin(ph * 2) * 0.12);
          idle.setEffectiveWeight(0.4);
        }
        root.position.y = Math.abs(Math.sin(ph * 5.0)) * 0.04;
        modelRoot.rotation.y = Math.PI + Math.sin(ph * 0.65) * 0.25;
      }
      glow.scale.setScalar(1 + Math.sin(ph * 2.2) * 0.05);
      if (wingL && wingR) {
        const flap = Math.sin(ph * 5) * 0.3;
        wingL.rotation.y = flap;
        wingR.rotation.y = -flap;
      }
    },
  };

  return markFactory(root, `glb-${kind}`, "glb", runtime);
}

export function preloadGlbCharacters() {
  return preloadGltf([...DANCER_GLTF_URLS]);
}

export function listGlbModels(): { id: ClubModelId; url: string }[] {
  return (Object.keys(CLUB_GLTF) as ClubModelId[]).map((id) => ({
    id,
    url: CLUB_GLTF[id],
  }));
}

function makeWing(color: number, side: 1 | -1, tier: number) {
  const g = new THREE.Group();
  const baseCol = tier >= 4 ? 0xff6a00 : tier >= 3 ? 0xffe9a8 : color;
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const feather = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04 + t * 0.02, 0.4 + t * 0.3, 3, 6),
      new THREE.MeshStandardMaterial({
        color: baseCol,
        emissive: baseCol,
        emissiveIntensity: 0.65,
        metalness: 0.25,
        roughness: 0.35,
      }),
    );
    feather.position.set(side * (0.08 + t * 0.06), 0.05 + t * 0.1, -0.05);
    feather.rotation.z = side * (0.4 + t * 0.45);
    g.add(feather);
  }
  return g;
}
