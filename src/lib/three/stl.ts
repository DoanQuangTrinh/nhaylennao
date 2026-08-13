import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { physical, std } from "@/lib/img2threejs/materials";
import type { SculptGroup, SculptRuntime } from "@/lib/img2threejs/runtime";
import { markFactory } from "@/lib/img2threejs/runtime";

const stlLoader = new STLLoader();
const stlCache = new Map<string, Promise<THREE.BufferGeometry>>();

export function loadStlGeometry(url: string): Promise<THREE.BufferGeometry> {
  const hit = stlCache.get(url);
  if (hit) return hit;

  const p = stlLoader
    .loadAsync(url)
    .then((geom) => {
      geom.computeVertexNormals();
      geom.center();
      return geom;
    })
    .catch((err) => {
      stlCache.delete(url);
      throw err;
    });

  stlCache.set(url, p);
  return p;
}

export type StlCharOpts = {
  url?: string;
  color?: number;
  scale?: number;
  height?: number;
  dancing?: boolean;
  role?: "dancer" | "dj" | "bartender" | "bouncer" | "guest";
};

/**
 * Load and instantiate an STL 3D model into a stream-ready 3D character/prop for QuanBar.
 */
export async function createStlCharacter(
  opts: StlCharOpts = {},
): Promise<SculptGroup> {
  const url = opts.url ?? "/3d/15.stl";
  const targetHeight = opts.height ?? 1.75;
  const matColor = opts.color ?? 0xf8fafc;

  const geom = await loadStlGeometry(url);

  geom.computeBoundingBox();
  const bbox = geom.boundingBox ?? new THREE.Box3();
  const rawHeight = bbox.max.y - bbox.min.y;
  const fitScale = (targetHeight / (rawHeight || 1)) * (opts.scale ?? 1);

  const root = new THREE.Group();
  root.name = `stl:${url.split("/").pop()}`;

  const pivot = new THREE.Group();
  pivot.name = "stlPivot";

  // High-end PBR Metallic / Glossy material for STL 3D Mesh
  const mat = physical(matColor, {
    metal: 0.75,
    rough: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.2,
    emissive: 0x22d3ee,
    emInt: 0.08,
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.scale.setScalar(fitScale);

  // Position ground base
  mesh.position.y = (rawHeight * fitScale) / 2;
  pivot.add(mesh);
  root.add(pivot);

  // Base glowing shadow disc
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 24),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  const state = { dancing: opts.dancing ?? true };
  const phase = Math.random() * Math.PI * 2;

  const runtime: SculptRuntime & { setDancing: (v: boolean) => void; state: { dancing: boolean } } = {
    state,
    pivots: { pivot, mesh },
    sockets: { ground: root, headTop: pivot },
    labels: { factory: "stl", url, source: "stl-loader" },
    setDancing(v: boolean) {
      state.dancing = v;
    },
    tick(_dt, t) {
      const ph = t + phase;
      if (state.dancing) {
        // Face-camera bar hop (no full spin — stay toward screen)
        const hop = Math.pow(Math.abs(Math.sin(ph * 5.4)), 0.55);
        pivot.position.y = hop * 0.14;
        pivot.rotation.y = Math.sin(ph * 0.95) * 0.18; // gentle groove only
        pivot.rotation.z = Math.sin(ph * 2.6) * 0.07;
        pivot.rotation.x = -hop * 0.05 + (1 - hop) * 0.03;
        pivot.scale.y = 1 - (1 - hop) * 0.04 + hop * 0.03;
        pivot.scale.x = 1 + (1 - hop) * 0.02;
        pivot.scale.z = pivot.scale.x;
        shadow.scale.setScalar(1 + hop * 0.1 + Math.sin(ph * 2.5) * 0.04);
      }
    },
  };

  return markFactory(root, `stl-model`, "procedural", runtime);
}
