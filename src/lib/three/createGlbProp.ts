import * as THREE from "three";
import {
  createGltfMixer,
  instantiateGltf,
  loadGltf,
  type InstantiateOpts,
} from "@/lib/three/gltf";
import { markFactory, type SculptGroup } from "@/lib/img2threejs/runtime";

export type GlbPropOpts = InstantiateOpts & {
  id?: string;
  /** Play first matching clip as idle loop */
  idleClip?: string | RegExp;
  /** Extra per-frame motion */
  spinY?: number;
};

/**
 * Load any GLB/GLTF as an img2threejs-compatible prop (sculptRuntime.tick).
 * Drop files in /public/models/ and call:
 *   const p = await createGlbProp("/models/my-bar.glb", { height: 1.2 });
 *   scene.add(p);
 */
export async function createGlbProp(
  url: string,
  opts: GlbPropOpts = {},
): Promise<SculptGroup> {
  const pack = await loadGltf(url);
  const root = instantiateGltf(pack, {
    ground: opts.ground ?? true,
    height: opts.height,
    scale: opts.scale,
    yaw: opts.yaw,
    tint: opts.tint,
    tintStrength: opts.tintStrength,
    noFrustumCull: opts.noFrustumCull,
    cloneMaterials: opts.cloneMaterials,
  });

  const anim = createGltfMixer(root);
  if (opts.idleClip) {
    anim.play(opts.idleClip, { loop: true });
  } else if (anim.clips.length) {
    // prefer Idle/idle if present
    anim.play("Idle") ?? anim.play("idle");
  }

  const spin = opts.spinY ?? 0;
  const id = opts.id ?? `prop-${url.split("/").pop() ?? "glb"}`;

  return markFactory(root, id, "glb", {
    labels: { url, loader: "GLTFLoader" },
    dispose: () => anim.stopAll(),
    tick(dt, t) {
      anim.update(dt);
      if (spin) root.rotation.y += spin * dt;
      void t;
    },
  });
}

/** @deprecated use VENUE_GLTF from venueCatalog */
export { VENUE_GLTF as VENUE_GLTF_OPTIONAL } from "./venueCatalog";
