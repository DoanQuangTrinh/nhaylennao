import * as THREE from "three";

export type MatOpts = {
  emissive?: number;
  emInt?: number;
  metal?: number;
  rough?: number;
  opacity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  envMapIntensity?: number;
};

/** PBR standard material — default club surface */
export function std(color: number, opts: MatOpts = {}) {
  const {
    emissive = 0x000000,
    emInt = 0,
    metal = 0.25,
    rough = 0.55,
    opacity = 1,
    envMapIntensity = 1,
  } = opts;
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emInt,
    metalness: metal,
    roughness: rough,
    transparent: opacity < 1,
    opacity,
    envMapIntensity,
  });
}

/** High-end PBR with clearcoat (bar tops, vinyl floor, chrome) */
export function physical(color: number, opts: MatOpts = {}) {
  const {
    emissive = 0x000000,
    emInt = 0,
    metal = 0.4,
    rough = 0.25,
    opacity = 1,
    clearcoat = 0.6,
    clearcoatRoughness = 0.15,
    envMapIntensity = 1.2,
  } = opts;
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive,
    emissiveIntensity: emInt,
    metalness: metal,
    roughness: rough,
    clearcoat,
    clearcoatRoughness,
    transparent: opacity < 1,
    opacity,
    envMapIntensity,
  });
}

/**
 * Neon trim — moderate emissive so UnrealBloom glows edges without white-washing the floor.
 * toneMapped stays ON so ACES keeps values in range.
 */
export function neon(color: number, intensity = 0.85) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: Math.min(intensity, 1.4),
    metalness: 0.45,
    roughness: 0.35,
    toneMapped: true,
  });
}

/** Soft volumetric beam cone — very subtle */
export function beamMat(color: number, opacity = 0.045) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: true,
  });
}

export const OUTFIT: number[] = [
  0xf8fafc, // Anime Pure White
  0xf472b6, // Sakura Neon Pink
  0x22d3ee, // Electric Cyan
  0xc084fc, // Royal Violet
  0xfacc15, // Golden Glow
  0xef4444, // Crimson Red
  0x34d399, // Emerald Mint
  0xf97316, // Vibrant Orange
];

export const SKIN: number[] = [
  0xfff1e6, // Porcelain Anime Skin
  0xf5d0b0, // Warm Peach Skin
  0xe8b88a, // Soft Olive Skin
  0xc68642, // Bronze Tan Skin
  0xffe0bd, // Light Cream Anime Skin
  0xd4a574, // Golden Tan Skin
];

export const HAIR: number[] = [
  0xf8fafc, // Anime Platinum Silver White
  0xf472b6, // Sakura Anime Pink
  0x38bdf8, // Anime Cyan Sky Blue
  0x111827, // Midnight Jet Black
  0xfacc15, // Golden Blonde
  0xa855f7, // Royal Purple Anime Hair
  0xe11d48, // Crimson Red Hair
];

/** Enable cast/receive shadows on a subtree */
export function enableShadows(root: THREE.Object3D, cast = true, receive = true) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = cast;
      m.receiveShadow = receive;
    }
  });
}
