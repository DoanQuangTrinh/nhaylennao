import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * Shared Three.js GLTF Loader for Neon Club.
 * - Caches parsed GLTF by URL
 * - Optional DRACO (Google CDN decoders)
 * - Safe skinned clone via SkeletonUtils
 * - Material normalize for ACES/stream lighting
 */

export type GltfPack = {
  url: string;
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  gltf: GLTF;
};

export type InstantiateOpts = {
  height?: number;
  scale?: number;
  yaw?: number;
  ground?: boolean;
  tint?: number;
  tintStrength?: number;
  noFrustumCull?: boolean;
  cloneMaterials?: boolean;
};

type ProgressCb = (url: string, loaded: number, total: number) => void;

let loader: GLTFLoader | null = null;
let draco: DRACOLoader | null = null;
const cache = new Map<string, Promise<GltfPack>>();
const listeners = new Set<ProgressCb>();
let lastProgress = { url: "", loaded: 0, total: 0, ready: 0, pending: 0 };

function ensureLoader(): GLTFLoader {
  if (loader) return loader;
  loader = new GLTFLoader();
  loader.manager.onProgress = (url, loaded, total) => {
    lastProgress = { ...lastProgress, url, loaded, total };
    listeners.forEach((fn) => fn(url, loaded, total));
  };
  return loader;
}

export function onGltfProgress(cb: ProgressCb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getGltfProgress() {
  return { ...lastProgress, cacheSize: cache.size };
}

export function loadGltf(url: string): Promise<GltfPack> {
  const existing = cache.get(url);
  if (existing) return existing;

  lastProgress.pending += 1;
  const p = ensureLoader()
    .loadAsync(url)
    .then((gltf) => {
      const pack: GltfPack = {
        url,
        scene: gltf.scene as THREE.Group,
        animations: gltf.animations,
        gltf,
      };
      lastProgress.ready += 1;
      lastProgress.pending = Math.max(0, lastProgress.pending - 1);
      return pack;
    })
    .catch((err) => {
      cache.delete(url);
      lastProgress.pending = Math.max(0, lastProgress.pending - 1);
      throw err;
    });

  cache.set(url, p);
  return p;
}

export function preloadGltf(urls: string[]) {
  return Promise.all(
    urls.map((u) =>
      loadGltf(u).catch((e) => {
        console.warn("[gltf] preload failed", u, e);
        return null;
      }),
    ),
  );
}

export function instantiateGltf(
  pack: GltfPack,
  opts: InstantiateOpts = {},
): THREE.Group {
  const root = new THREE.Group();
  root.name = `gltf:${pack.url.split("/").pop() ?? "model"}`;

  const model = SkeletonUtils.clone(pack.scene) as THREE.Group;
  const noCull = opts.noFrustumCull !== false;
  const shouldProcess = opts.cloneMaterials !== false || opts.tint != null;

  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (noCull) mesh.frustumCulled = false;

    if (shouldProcess) {
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => normalizeMaterial(m.clone(), opts));
      } else if (mesh.material) {
        mesh.material = normalizeMaterial(mesh.material.clone(), opts);
      }
    }
  });

  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  let s = opts.scale ?? 1;
  if (opts.height && size.y > 1e-4) {
    s *= opts.height / size.y;
  }
  model.scale.setScalar(s);

  if (opts.ground !== false) {
    const box2 = new THREE.Box3().setFromObject(model);
    model.position.y = -box2.min.y;
  }

  if (opts.yaw) model.rotation.y = opts.yaw;

  root.add(model);
  root.userData.gltf = {
    url: pack.url,
    animations: pack.animations,
    model,
  };
  return root;
}

function normalizeMaterial(
  mat: THREE.Material,
  opts: InstantiateOpts,
): THREE.Material {
  if (mat.type === "MeshPhongMaterial" || mat.type === "MeshLambertMaterial") {
    const src = mat as THREE.MeshPhongMaterial;
    const std = new THREE.MeshStandardMaterial({
      color: src.color?.clone?.() ?? new THREE.Color(0xcccccc),
      map: src.map,
      normalMap: (src as THREE.MeshPhongMaterial).normalMap ?? null,
      emissive: src.emissive?.clone?.() ?? new THREE.Color(0x000000),
      emissiveMap: src.emissiveMap ?? null,
      emissiveIntensity: 0,
      metalness: 0.15,
      roughness: 0.65,
      transparent: src.transparent,
      opacity: src.opacity,
      side: src.side,
    });
    const anyMat = mat as THREE.Material & { skinning?: boolean; morphTargets?: boolean };
    if (anyMat.skinning) (std as THREE.Material & { skinning?: boolean }).skinning = true;
    if (anyMat.morphTargets)
      (std as THREE.Material & { morphTargets?: boolean }).morphTargets = true;
    applyTint(std, opts);
    return std;
  }

  if (mat.type === "MeshStandardMaterial" || mat.type === "MeshPhysicalMaterial") {
    const std = mat as THREE.MeshStandardMaterial;
    applyTint(std, opts);
    if (std.emissiveIntensity > 0.12) std.emissiveIntensity = 0.08;
    return std;
  }

  return mat;
}

function applyTint(mat: THREE.MeshStandardMaterial, opts: InstantiateOpts) {
  if (opts.tint == null) return;
  const strength = opts.tintStrength ?? 0.35;
  const tint = new THREE.Color(opts.tint);
  mat.color.lerp(tint, strength);
  if (!mat.emissive) mat.emissive = new THREE.Color(0x000000);
  mat.emissive.copy(tint).multiplyScalar(0.12);
  mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.35);
}

export function createGltfMixer(root: THREE.Group) {
  const meta = root.userData.gltf as
    | { animations?: THREE.AnimationClip[]; model?: THREE.Object3D }
    | undefined;
  const target = meta?.model ?? root;
  const clips = meta?.animations ?? [];
  const mixer = new THREE.AnimationMixer(target);

  return {
    mixer,
    clips,
    play(
      name: string | RegExp,
      opts: { loop?: boolean; weight?: number; timeScale?: number } = {},
    ): THREE.AnimationAction | null {
      const clip =
        typeof name === "string"
          ? clips.find((c) => c.name.toLowerCase() === name.toLowerCase())
          : clips.find((c) => name.test(c.name));
      if (!clip) return null;
      const action = mixer.clipAction(clip);
      action.reset();
      action.setEffectiveWeight(opts.weight ?? 1);
      action.timeScale = opts.timeScale ?? 1;
      action.setLoop(
        opts.loop === false ? THREE.LoopOnce : THREE.LoopRepeat,
        Infinity,
      );
      action.play();
      return action;
    },
    /** Play first clip matching any of the names (case-insensitive) */
    playFirst(
      names: string[],
      opts: { loop?: boolean; weight?: number; timeScale?: number } = {},
    ): THREE.AnimationAction | null {
      for (const n of names) {
        const a = this.play(n, opts);
        if (a) return a;
      }
      if (clips[0]) return this.play(clips[0].name, opts);
      return null;
    },
    stopAll() {
      mixer.stopAllAction();
    },
    update(dt: number) {
      mixer.update(dt);
    },
  };
}

/** Catalog of user 3D GLB models under /public/3d */
export const USER_3D_GLBS = [
  "/3d/hip_hop_dancing.glb",
  "/3d/rumba_dancing.glb",
  "/3d/ymca_dance.glb",
  "/3d/hip_hop_dancing_1.glb",
  "/3d/dancing.glb",
  "/3d/dancing_running_man.glb",
  "/3d/samba_dancing.glb",
  "/3d/salsadance.glb",
  "/3d/spooky_skeleton_dance_2.glb",
  "/3d/tut_hip_hop_dance.glb",
  "/3d/chicken_dance.glb",
  "/3d/miku_dj.glb?v=color",
  "/3d/lisa_pole.glb",
  "/3d/5dance_11.glb",
  "/3d/gangster.glb",
] as const;

export const CLUB_GLTF = {
  hipHop: USER_3D_GLBS[0],
  rumba: USER_3D_GLBS[1],
  ymca: USER_3D_GLBS[2],
  hipHop2: USER_3D_GLBS[3],
  dancing: USER_3D_GLBS[4],
  runningMan: USER_3D_GLBS[5],
  samba: USER_3D_GLBS[6],
  salsa: USER_3D_GLBS[7],
  skeleton: USER_3D_GLBS[8],
  tutHipHop: USER_3D_GLBS[9],
  chicken: USER_3D_GLBS[10],
  miku: USER_3D_GLBS[11],
  lisa: USER_3D_GLBS[12],
  bar5: USER_3D_GLBS[13],
  gangster: USER_3D_GLBS[14],
  freddie: "/dj_fbx/freddie_brians.glb",
} as const;

/** Floor guests — only packs converted from public/fbx */
export const FLOOR_KINDS = [
  "chicken",
  "runningMan",
  "hipHop2",
  "dancing",
  "salsa",
  "hipHop",
  "ymca",
  "tutHipHop",
  "samba",
  "skeleton",
  "rumba",
] as const;

export type ClubModelId = keyof typeof CLUB_GLTF;

/** Prefetch the small packs. Larger /3d models load when a dancer actually uses them. */
/** Only the first dancer pack — others load when that person actually spawns. */
export const DANCER_GLTF_URLS = [CLUB_GLTF.hipHop] as const;

export function disposeGltfCache() {
  cache.clear();
  draco?.dispose();
  draco = null;
  loader = null;
}
