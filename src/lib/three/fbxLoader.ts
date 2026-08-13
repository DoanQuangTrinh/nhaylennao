import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const fbxCache = new Map<string, Promise<THREE.Group>>();
let fbxLoader: FBXLoader | null = null;

function getFbxLoader(): FBXLoader {
  if (!fbxLoader) {
    fbxLoader = new FBXLoader();
  }
  return fbxLoader;
}

/**
 * Load Mixamo FBX file and extract animation clips / scene.
 */
export function loadFbx(url: string): Promise<{ group: THREE.Group; animations: THREE.AnimationClip[] }> {
  const existing = fbxCache.get(url);
  if (existing) {
    return existing.then((group) => ({
      group,
      animations: group.animations ?? [],
    }));
  }

  const p = getFbxLoader()
    .loadAsync(url)
    .then((group) => {
      group.name = `fbx:${url.split("/").pop() ?? "model"}`;
      return group;
    })
    .catch((err) => {
      fbxCache.delete(url);
      throw err;
    });

  fbxCache.set(url, p);
  return p.then((group) => ({
    group,
    animations: group.animations ?? [],
  }));
}
