/**
 * High-quality Neon Club venue — GLTFLoader props + PBR floor + club lights.
 * Characters, DJ booth, tables, bar, speakers all load as .glb.
 */
import * as THREE from "three";
import { createGlbProp } from "@/lib/three/createGlbProp";
import { preloadGltf } from "@/lib/three/gltf";
import { VENUE_GLTF, VENUE_PRELOAD_URLS } from "@/lib/three/venueCatalog";
import {
  createFashionCharacter,
  createModelCharacter,
  type SculptGroup,
} from "@/lib/img2threejs";

export type ClubVenue = {
  scene: THREE.Scene;
  rings: THREE.Mesh[];
  p1: THREE.PointLight;
  p2: THREE.PointLight;
  p3: THREE.PointLight;
  spots: THREE.SpotLight[];
  beams: THREE.Mesh[];
  tickables: SculptGroup[];
};

function pbr(
  color: number,
  opts: {
    metal?: number;
    rough?: number;
    emissive?: number;
    em?: number;
    env?: number;
  } = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metal ?? 0.2,
    roughness: opts.rough ?? 0.5,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.em ?? 0,
    envMapIntensity: opts.env ?? 0.8,
  });
}

function neonMat(color: number, intensity = 0.9) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.35,
    roughness: 0.35,
  });
}

/**
 * Build full club venue. Detailed props via GLTFLoader.
 * Floor / walls / beams stay lightweight PBR primitives (structure only).
 */
export async function buildClubVenue(preview: boolean): Promise<ClubVenue> {
  await preloadGltf([...VENUE_PRELOAD_URLS]);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0612);
  scene.fog = new THREE.FogExp2(0x0a0612, 0.018);

  const tickables: SculptGroup[] = [];

  // ── Lighting (dynamic club) ─────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x2a2038, 0.35));
  scene.add(new THREE.HemisphereLight(0xffe0f0, 0x120818, 0.45));

  // Key directional with soft shadows
  const key = new THREE.DirectionalLight(0xffffff, 0.65);
  key.position.set(5, 14, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(preview ? 1024 : 2048, preview ? 1024 : 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -16;
  key.shadow.camera.right = 16;
  key.shadow.camera.top = 16;
  key.shadow.camera.bottom = -16;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  scene.add(key);

  // Moving club spots (cast soft shadows under dancers/props)
  const spots: THREE.SpotLight[] = [];
  const spotConfigs: Array<{
    color: number;
    pos: [number, number, number];
    target: [number, number, number];
    intensity: number;
  }> = [
    { color: 0x44e0ff, pos: [3.5, 7.5, 2], target: [0, 0, 0], intensity: 28 },
    { color: 0xff4d9a, pos: [-3.5, 7.2, 2.5], target: [-1, 0, 0], intensity: 24 },
    { color: 0xc084fc, pos: [0, 8, -2], target: [0, 0, -1], intensity: 22 },
    { color: 0xffe08a, pos: [-8, 6, -1], target: [-8, 0, -1], intensity: 18 }, // DJ
  ];
  for (const sc of spotConfigs) {
    const spot = new THREE.SpotLight(sc.color, sc.intensity, 28, Math.PI / 5.5, 0.45, 1.4);
    spot.position.set(...sc.pos);
    spot.castShadow = true;
    spot.shadow.mapSize.set(preview ? 512 : 1024, preview ? 512 : 1024);
    spot.shadow.bias = -0.0002;
    spot.shadow.normalBias = 0.02;
    const tgt = new THREE.Object3D();
    tgt.position.set(...sc.target);
    scene.add(tgt);
    spot.target = tgt;
    scene.add(spot);
    spots.push(spot);
  }

  // Point lights for neon pools
  const p1 = new THREE.PointLight(0x44e0ff, 6, 16, 2);
  p1.position.set(4.5, 3.2, 2);
  p1.castShadow = !preview;
  scene.add(p1);
  const p2 = new THREE.PointLight(0xff66b0, 5.5, 16, 2);
  p2.position.set(-4.5, 3.0, 2);
  p2.castShadow = !preview;
  scene.add(p2);
  const p3 = new THREE.PointLight(0xc084fc, 4.5, 14, 2);
  p3.position.set(0, 4.5, -4);
  scene.add(p3);

  // ── Environment shells (PBR structure) ──────────────────────────────────
  // Glossy reflective dance floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9.5, 72),
    new THREE.MeshPhysicalMaterial({
      color: 0x12101c,
      metalness: 0.55,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.2,
      reflectivity: 0.9,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Concentric neon floor rings
  const rings: THREE.Mesh[] = [];
  const ringColors = [0x22d3ee, 0xf472b6, 0xc084fc, 0x22d3ee];
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.2 + i * 1.55, 0.035, 10, 80),
      neonMat(ringColors[i]!, 0.75),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    ring.receiveShadow = true;
    scene.add(ring);
    rings.push(ring);
  }

  // Outer room floor
  const roomFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 28),
    pbr(0x100c18, { metal: 0.15, rough: 0.72 }),
  );
  roomFloor.rotation.x = -Math.PI / 2;
  roomFloor.position.y = -0.02;
  roomFloor.receiveShadow = true;
  scene.add(roomFloor);

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(32, 8, 0.4),
    pbr(0x16101f, { metal: 0.12, rough: 0.7 }),
  );
  backWall.position.set(0, 4, -8.5);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Side walls
  for (const sx of [-1, 1] as const) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 8, 22),
      pbr(0x14101c, { metal: 0.1, rough: 0.75 }),
    );
    wall.position.set(sx * 15, 4, -1);
    wall.receiveShadow = true;
    scene.add(wall);
  }

  // Ceiling truss + moving beams (structure)
  const beams: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.12, 7, 8),
      neonMat(i % 2 ? 0x22d3ee : 0xf472b6, 0.55),
    );
    beam.position.set(-5 + i * 2, 6.5, -1);
    beam.rotation.z = 0.15;
    scene.add(beam);
    beams.push(beam);
  }

  // Mezzanine plate
  const mez = new THREE.Mesh(
    new THREE.BoxGeometry(26, 0.16, 5.5),
    pbr(0x1a1424, { metal: 0.25, rough: 0.55 }),
  );
  mez.position.set(0, 3.2, -5.5);
  mez.receiveShadow = true;
  mez.castShadow = true;
  scene.add(mez);

  // ── GLB venue props ─────────────────────────────────────────────────────
  const place = async (
    url: string,
    opts: {
      x: number;
      y?: number;
      z: number;
      rotY?: number;
      height?: number;
      scale?: number;
      yaw?: number;
    },
  ) => {
    try {
      const prop = await createGlbProp(url, {
        height: opts.height,
        scale: opts.scale,
        yaw: opts.yaw ?? 0,
        ground: true,
        noFrustumCull: true,
        cloneMaterials: true,
      });
      prop.position.set(opts.x, opts.y ?? 0, opts.z);
      if (opts.rotY) prop.rotation.y = opts.rotY;
      prop.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      scene.add(prop);
      tickables.push(prop);
      return prop;
    } catch (e) {
      console.warn("[venue] prop load failed", url, e);
      return null;
    }
  };

  // Bar — 3 segments
  await place(VENUE_GLTF.barCounter, { x: -4.5, z: -6.5, height: 1.2 });
  await place(VENUE_GLTF.barCounter, { x: 0, z: -6.5, height: 1.2 });
  await place(VENUE_GLTF.barCounter, { x: 4.5, z: -6.5, height: 1.2 });

  // Neon BAR sign
  await place(VENUE_GLTF.neonBarSign, {
    x: 0,
    z: -7.8,
    height: 1.1,
    y: 0,
  });
  // lift sign
  const sign = tickables[tickables.length - 1];
  if (sign) sign.position.y = 3.8;

  // DJ booth left
  await place(VENUE_GLTF.djBooth, {
    x: -8.5,
    z: -1.2,
    height: 1.35,
    rotY: 0.2,
  });

  // Speakers
  await place(VENUE_GLTF.speakerStack, { x: -11, z: 1.5, height: 2.1, rotY: 0.4 });
  await place(VENUE_GLTF.speakerStack, { x: 11, z: 1.5, height: 2.1, rotY: -0.4 });
  // BoomBox accents on DJ deck
  await place(VENUE_GLTF.boomBox, { x: -9.2, z: -0.4, height: 0.35, rotY: 0.5 });
  await place(VENUE_GLTF.boomBox, { x: -7.8, z: -0.4, height: 0.35, rotY: -0.5 });

  // High-top tables around floor
  const highTops: Array<[number, number, number]> = [
    [5.5, 3.2, 0.4],
    [6.2, -1.5, -0.3],
    [-5.8, 3.5, -0.5],
    [8, 0.5, Math.PI],
    [-6.5, 0.2, 0.8],
  ];
  for (const [x, z, rot] of highTops) {
    await place(VENUE_GLTF.highTop, { x, z, height: 1.1, rotY: rot });
  }

  // Lounge tables + chairs
  const lounges: Array<[number, number]> = [
    [9, -4],
    [-9.5, -4.5],
    [10, 3.5],
  ];
  for (const [x, z] of lounges) {
    await place(VENUE_GLTF.loungeTable, { x, z, height: 0.6 });
    await place(VENUE_GLTF.sheenChair, {
      x: x + 0.7,
      z: z + 0.5,
      height: 0.95,
      rotY: -0.8,
    });
    await place(VENUE_GLTF.sheenChair, {
      x: x - 0.7,
      z: z - 0.4,
      height: 0.95,
      rotY: 2.2,
    });
  }

  // Entrance / doors + bouncer zone
  await place(VENUE_GLTF.entranceDoors, {
    x: 12.5,
    z: 3.5,
    height: 3.2,
    rotY: -Math.PI / 2,
  });

  // ── Staff as GLB characters ─────────────────────────────────────────────
  const staff = [
    { role: "bartender" as const, x: -3.2, z: -6.35, rot: Math.PI, style: 0 },
    { role: "bartender" as const, x: 0, z: -6.35, rot: Math.PI, style: 1 },
    { role: "bartender" as const, x: 3.2, z: -6.35, rot: Math.PI, style: 2 },
    { role: "dj" as const, x: -8.5, z: -1.15, rot: 0.15, style: 2 },
    { role: "bouncer" as const, x: 11.2, z: 3.5, rot: -Math.PI / 2, style: 0 },
  ];
  for (const s of staff) {
    try {
      const h = await createModelCharacter({
        role: s.role,
        style: s.style,
        dancing: s.role === "dj" || s.role === "bartender",
        scale: s.role === "bouncer" ? 1.08 : 0.98,
        prefer: "auto",
      });
      h.position.set(s.x, 0, s.z);
      h.rotation.y = s.rot;
      scene.add(h);
      tickables.push(h);
    } catch {
      const h = createFashionCharacter({
        role: s.role,
        outfit: s.style,
        dancing: true,
        scale: 0.98,
      });
      h.position.set(s.x, 0, s.z);
      h.rotation.y = s.rot;
      scene.add(h);
      tickables.push(h);
    }
  }

  return { scene, rings, p1, p2, p3, spots, beams, tickables };
}
