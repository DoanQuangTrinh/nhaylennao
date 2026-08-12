/**
 * AI photo / fashion card character for Neon Club.
 * Loads /chars/*.jpg (Grok Imagine full-body renders) onto a double-sided
 * billboard with soft ground glow + dance bob. Falls back to fashion
 * procedural mesh if texture missing.
 *
 * Manifest: public/chars/manifest.json
 */
import * as THREE from "three";
import { markFactory, type SculptGroup, type SculptRuntime } from "./runtime";
import { createFashionCharacter } from "./createFashionCharacter";

const texLoader = new THREE.TextureLoader();
const cache = new Map<string, Promise<THREE.Texture>>();

/** Map style index → public char texture */
export const CHAR_TEXTURES: Record<number, string> = {
  0: "/chars/aya-red.jpg",
  1: "/chars/mia-black.jpg",
  2: "/chars/mia-black.jpg",
  3: "/chars/ken-casual.jpg",
  4: "/chars/ken-casual.jpg",
  5: "/chars/cyan-neon.jpg",
  6: "/chars/pink-sequin.jpg",
  7: "/chars/pink-sequin.jpg",
};

function loadTex(url: string): Promise<THREE.Texture | null> {
  const hit = cache.get(url);
  if (hit) return hit.then((t) => t);
  const p = new Promise<THREE.Texture>((resolve, reject) => {
    texLoader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      () => reject(new Error(`tex fail ${url}`)),
    );
  })
    .then((t) => t)
    .catch(() => {
      cache.delete(url);
      return null as unknown as THREE.Texture;
    });
  cache.set(url, p as Promise<THREE.Texture>);
  return p as Promise<THREE.Texture | null>;
}

export type PhotoCharOpts = {
  style?: number;
  skin?: number;
  dancing?: boolean;
  wingTier?: number;
  auraUntil?: number;
  scale?: number;
  role?: "dancer" | "dj" | "bartender" | "bouncer" | "guest";
  /** Override texture URL */
  url?: string;
};

export type PhotoRuntime = SculptRuntime & {
  setDancing: (v: boolean) => void;
  state: { dancing: boolean };
};

/**
 * Async factory: AI full-body card if texture exists, else fashion procedural.
 */
export async function createPhotoCharacter(
  opts: PhotoCharOpts = {},
): Promise<SculptGroup> {
  const style = opts.style ?? 0;
  const url = opts.url ?? CHAR_TEXTURES[style % 8] ?? CHAR_TEXTURES[0]!;
  const sc = opts.scale ?? 1;
  const now = Date.now();
  const active = (opts.auraUntil ?? 0) > now;
  const tier = active ? opts.wingTier ?? 0 : 0;

  // Staff always procedural (roles need 3D volume in venue)
  if (opts.role && opts.role !== "dancer" && opts.role !== "guest") {
    return createFashionCharacter({
      outfit: style,
      skin: opts.skin,
      dancing: opts.dancing,
      wingTier: opts.wingTier,
      auraUntil: opts.auraUntil,
      scale: sc,
      role: opts.role,
    });
  }

  const tex = await loadTex(url);
  if (!tex) {
    return createFashionCharacter({
      outfit: style,
      skin: opts.skin,
      dancing: opts.dancing,
      wingTier: opts.wingTier,
      auraUntil: opts.auraUntil,
      scale: sc,
      role: "dancer",
    });
  }

  const root = new THREE.Group();
  root.name = "photoCharacter";

  // Full-body card ~1.7m tall, aspect ~2:3
  const h = 1.72;
  const w = h * (2 / 3) * 0.72; // slightly slim card
  const geo = new THREE.PlaneGeometry(w, h, 1, 1);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.08,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
  const card = new THREE.Mesh(geo, mat);
  card.position.y = h / 2;
  card.castShadow = false;
  card.receiveShadow = false;
  root.add(card);

  // Soft base disc
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 24),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.02;
  root.add(glow);

  // Thin shadow ellipse
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 20),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  shadow.scale.set(1, 0.55, 1);
  root.add(shadow);

  if (tier >= 2) {
    const wingColor = tier >= 4 ? 0xff6a00 : tier >= 3 ? 0xffe9a8 : 0x22d3ee;
    for (const side of [-1, 1] as const) {
      const wing = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.55),
        new THREE.MeshBasicMaterial({
          color: wingColor,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      wing.position.set(side * 0.35, 1.15, -0.05);
      wing.rotation.y = side * 0.4;
      root.add(wing);
    }
  }

  root.scale.setScalar(sc);

  const state = { dancing: opts.dancing ?? true };
  const phase = Math.random() * Math.PI * 2;
  let faceCam = true;

  const runtime: PhotoRuntime = {
    state,
    pivots: { card },
    sockets: { ground: root, headTop: card },
    labels: { factory: "photo", url, source: "grok-imagine" },
    setDancing(v: boolean) {
      state.dancing = v;
    },
    tick(_dt, t) {
      const ph = t + phase;
      if (state.dancing) {
        root.position.y = Math.abs(Math.sin(ph * 5.0)) * 0.04;
        card.rotation.y = Math.sin(ph * 0.9) * 0.15;
        card.rotation.z = Math.sin(ph * 2.2) * 0.03;
        glow.scale.setScalar(1 + Math.sin(ph * 2.5) * 0.06);
      }
      // Subtle always-readable: slight yaw toward camera is handled by scene
      void faceCam;
    },
  };

  return markFactory(root, `photo-${style}`, "photo", runtime);
}

/** Prefetch all AI char textures */
export function preloadPhotoCharacters() {
  return Promise.all(
    Object.values(CHAR_TEXTURES).map((u) => loadTex(u).catch(() => null)),
  );
}
