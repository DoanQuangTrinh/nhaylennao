import type * as THREE from "three";

/**
 * img2threejs sculptRuntime contract (subset used by Neon Club).
 * Factories return THREE.Group with userData.sculptRuntime for animation.
 */
export type SculptSocket = {
  name: string;
  object: THREE.Object3D;
};

export type SculptRuntime = {
  /** Called every frame from the club render loop */
  tick?: (dt: number, t: number) => void;
  sockets?: Record<string, THREE.Object3D>;
  pivots?: Record<string, THREE.Object3D>;
  colliders?: THREE.Object3D[];
  /** Semantic labels for debugging */
  labels?: Record<string, string>;
  dispose?: () => void;
};

export type SculptSource = "procedural" | "glb" | "hybrid" | "photo";

export type SculptGroup = THREE.Group & {
  userData: {
    sculptRuntime?: SculptRuntime;
    img2threejs?: {
      id: string;
      source: SculptSource;
      version: string;
    };
  };
};

export function getRuntime(obj: THREE.Object3D): SculptRuntime | undefined {
  return (obj.userData as SculptGroup["userData"])?.sculptRuntime;
}

export function tickSculptTree(root: THREE.Object3D, dt: number, t: number) {
  root.traverse((o) => {
    const rt = getRuntime(o);
    rt?.tick?.(dt, t);
  });
}

export function markFactory(
  group: THREE.Group,
  id: string,
  source: SculptSource,
  runtime: SculptRuntime,
): SculptGroup {
  const g = group as SculptGroup;
  g.userData.sculptRuntime = runtime;
  g.userData.img2threejs = { id, source, version: "1.0.0" };
  return g;
}
