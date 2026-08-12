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
  0x22d3ee, 0xc084fc, 0xf472b6, 0x34d399, 0xfbbf24, 0xfb7185, 0x60a5fa, 0xe879f9,
];

export const SKIN: number[] = [
  0xf5d0b0, 0xe8b88a, 0xc68642, 0x8d5524, 0xffe0bd, 0xd4a574, 0xb56b45, 0x6b3f2a,
];

export const HAIR: number[] = [
  0x1a0a14, 0x2a1810, 0x4a2060, 0x0a2a3a, 0xc04060, 0x1a1a2a, 0xf0d080, 0x203050,
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
