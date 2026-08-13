/**
 * 100% 3D GLB / STL Model Character Factory for QuanBar.
 * ONLY loads real 3D models provided in /public/3d/ and /public/models/
 * (user Mixamo dance packs, Miku DJ, Lisa pole).
 */
import type { SculptGroup } from "./runtime";
import { createGlbCharacter } from "./createGlbCharacter";
import { createStlCharacter } from "@/lib/three/stl";

export type ModelCharOpts = {
  style?: number;
  skin?: number;
  dancing?: boolean;
  wingTier?: number;
  auraUntil?: number;
  scale?: number;
  role?: "dancer" | "dj" | "bartender" | "bouncer" | "guest";
  prefer?: string;
  stlUrl?: string;
};

/**
 * Spawn exclusively 3D GLB / STL Model characters for QuanBar.
 */
export async function createModelCharacter(
  opts: ModelCharOpts = {},
): Promise<SculptGroup> {
  const role = opts.role ?? "dancer";
  const style = opts.style ?? 0;
  const slot = Math.abs(style) % 11;

  if (opts.prefer === "stl") {
    try {
      return await createStlCharacter({
        url: opts.stlUrl ?? "/3d/15.stl",
        dancing: opts.dancing ?? true,
        scale: opts.scale,
        role,
      });
    } catch (e) {
      console.warn("[createModelCharacter] STL load failed → glb fallback", e);
    }
  }

  return createGlbCharacter({
    model: slot,
    style,
    kind: opts.prefer === "glb" ? "hipHop" : undefined,
    dancing: opts.dancing ?? true,
    wingTier: opts.wingTier,
    auraUntil: opts.auraUntil,
    scale: opts.scale ?? (role === "bouncer" ? 1.08 : 1),
  });
}
