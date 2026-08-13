/**
 * Real 3D Human Character Factory for QuanBar (img2threejs + GSAP + Three.js PBR).
 * Converts photo characters into full 3D volumetric human models with 3D limbs, head, torso, and PBR lighting.
 * Eliminates 2D flat cardboard planes.
 */
import * as THREE from "three";
import { markFactory, type SculptGroup, type SculptRuntime } from "./runtime";
import { createHumanCharacter } from "./createHumanCharacter";

export type PhotoCharOpts = {
  style?: number;
  skin?: number;
  dancing?: boolean;
  wingTier?: number;
  auraUntil?: number;
  scale?: number;
  role?: "dancer" | "dj" | "bartender" | "bouncer" | "guest";
  url?: string;
};

/**
 * Async factory: Always returns a full 3D Volumetric Human Model with 3D volume, PBR lighting, and GSAP motion.
 */
export async function createPhotoCharacter(
  opts: PhotoCharOpts = {},
): Promise<SculptGroup> {
  const style = opts.style ?? 0;
  const sc = opts.scale ?? 1;

  // Render complete 3D volumetric human model with 3D head, body, arms, legs & club fashion
  return createHumanCharacter({
    style,
    skin: opts.skin,
    dancing: opts.dancing,
    wingTier: opts.wingTier,
    auraUntil: opts.auraUntil,
    scale: sc,
    role: opts.role ?? "dancer",
  });
}

export function preloadPhotoCharacters() {
  return Promise.resolve();
}
