/**
 * Unified 3D character factory for Neon Club.
 *
 * Priority:
 *  1. Skinned GLB when preferred + GPU supports it
 *  2. Fashion procedural mesh (always readable)
 *
 * Staff always get volume mesh (never flat photo).
 */
import type { SculptGroup } from "./runtime";
import { createGlbCharacter, shouldUseGlb } from "./createGlbCharacter";
import { createFashionCharacter } from "./createFashionCharacter";

export type ModelCharOpts = {
  style?: number;
  skin?: number;
  dancing?: boolean;
  wingTier?: number;
  auraUntil?: number;
  scale?: number;
  role?: "dancer" | "dj" | "bartender" | "bouncer" | "guest";
  /** Force source */
  prefer?: "glb" | "fashion" | "auto";
};

/**
 * Spawn a stream-ready 3D character (GLB skinned or fashion procedural).
 */
export async function createModelCharacter(
  opts: ModelCharOpts = {},
): Promise<SculptGroup> {
  const prefer = opts.prefer ?? "auto";
  const role = opts.role ?? "dancer";
  const style = opts.style ?? 0;
  const useGlb =
    prefer === "glb" || (prefer === "auto" && shouldUseGlb());

  if (useGlb) {
    try {
      // style → model variety: soldier / xbot / robot
      let model = (style % 3) as 0 | 1 | 2;
      if (role === "bouncer") model = 0;
      if (role === "dj") model = 2; // Robot with Dance clip
      if (role === "bartender") model = 1;

      return await createGlbCharacter({
        model,
        style,
        dancing: opts.dancing ?? true,
        wingTier: opts.wingTier,
        auraUntil: opts.auraUntil,
        scale: opts.scale ?? (role === "bouncer" ? 1.08 : 1),
      });
    } catch (e) {
      console.warn("[createModelCharacter] GLB failed → fashion", e);
    }
  }

  return createFashionCharacter({
    outfit: style,
    skin: opts.skin,
    dancing: opts.dancing,
    wingTier: opts.wingTier,
    auraUntil: opts.auraUntil,
    scale: opts.scale,
    role,
  });
}
