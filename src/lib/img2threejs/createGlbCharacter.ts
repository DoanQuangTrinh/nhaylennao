import * as THREE from "three";
import {
  CLUB_GLTF,
  FLOOR_KINDS,
  createGltfMixer,
  instantiateGltf,
  loadGltf,
  preloadGltf,
  DANCER_GLTF_URLS,
  type ClubModelId,
  type GltfPack,
} from "@/lib/three/gltf";
import { loadFbx } from "@/lib/three/fbxLoader";
import { markFactory, type SculptGroup, type SculptRuntime } from "./runtime";
import { OUTFIT, neon, physical } from "./materials";

export type GlbModelKind =
  | (typeof FLOOR_KINDS)[number]
  | "miku"
  | "lisa"
  | "bar5"
  | "gangster"
  | "freddie";

export type GlbCharOpts = {
  model?: number;
  kind?: GlbModelKind;
  style?: number;
  dancing?: boolean;
  wingTier?: number;
  auraUntil?: number;
  scale?: number;
};

export type GlbRuntime = SculptRuntime & {
  setDancing: (v: boolean) => void;
  state: { dancing: boolean };
};

/** Floor guests cycle — public/fbx packs only. */
const ALL_KINDS: GlbModelKind[] = [...FLOOR_KINDS];

const KIND_URL: Record<GlbModelKind, string> = {
  hipHop: CLUB_GLTF.hipHop,
  rumba: CLUB_GLTF.rumba,
  ymca: CLUB_GLTF.ymca,
  hipHop2: CLUB_GLTF.hipHop2,
  dancing: CLUB_GLTF.dancing,
  runningMan: CLUB_GLTF.runningMan,
  samba: CLUB_GLTF.samba,
  salsa: CLUB_GLTF.salsa,
  skeleton: CLUB_GLTF.skeleton,
  tutHipHop: CLUB_GLTF.tutHipHop,
  chicken: CLUB_GLTF.chicken,
  miku: CLUB_GLTF.miku,
  lisa: CLUB_GLTF.lisa,
  bar5: CLUB_GLTF.bar5,
  gangster: CLUB_GLTF.gangster,
  freddie: CLUB_GLTF.freddie,
};

function resolveKind(opts: GlbCharOpts): GlbModelKind {
  if (opts.kind) return opts.kind;
  const m = Math.abs(opts.model ?? opts.style ?? 0);
  return ALL_KINDS[m % ALL_KINDS.length]!;
}

/**
 * Yaw so the character faces the screen.
 * Camera sits at +Z looking toward origin → model forward must point +Z.
 * Camera at +Z looks toward origin — dancers must face +Z (the audience).
 * Mixamo FBX→GLB already faces +Z; extra Math.PI made them stare into the club.
 */
const FACE_CAMERA_YAW: Record<GlbModelKind, number> = {
  hipHop: 0,
  rumba: 0,
  ymca: 0,
  hipHop2: 0,
  dancing: 0,
  runningMan: 0,
  samba: 0,
  salsa: 0,
  skeleton: 0,
  tutHipHop: 0,
  chicken: 0,
  miku: 0,
  lisa: 0,
  bar5: 0,
  gangster: 0,
  freddie: 0,
};

type BoneSlot = {
  obj: THREE.Object3D;
  rest: THREE.Euler;
  /** upper | lower | hand | other */
  part: "upper" | "lower" | "hand" | "other";
};

type DanceRig = {
  armL: BoneSlot[];
  armR: BoneSlot[];
  legL: BoneSlot[];
  legR: BoneSlot[];
  spine: BoneSlot[];
  head: BoneSlot[];
  hips: BoneSlot[];
};

function normalizeBoneName(name: string): string {
  return name.toLowerCase().replace(/[:.\-\s]/g, "");
}

/** Left / right from Mixamo, Blender (.L/.R), and common export prefixes */
function boneSide(raw: string): "L" | "R" | null {
  const n = raw.toLowerCase();
  const compact = normalizeBoneName(raw);
  if (n.includes("left") || compact.includes("left")) return "L";
  if (n.includes("right") || compact.includes("right")) return "R";
  // Blender / Maya side suffixes (avoid matching the letter inside "clavicle" etc.)
  if (/(?:^|[._\s-])l(?:$|[._\s-])/i.test(raw) || n.endsWith(".l") || n.endsWith("_l"))
    return "L";
  if (/(?:^|[._\s-])r(?:$|[._\s-])/i.test(raw) || n.endsWith(".r") || n.endsWith("_r"))
    return "R";
  return null;
}

function armPart(n: string): BoneSlot["part"] {
  if (
    n.includes("hand") ||
    n.includes("finger") ||
    n.includes("thumb") ||
    n.includes("wrist")
  )
    return "hand";
  if (
    n.includes("forearm") ||
    n.includes("lowerarm") ||
    n.includes("elbow") ||
    n.includes("belowarm")
  )
    return "lower";
  if (
    n.includes("upperarm") ||
    n.includes("uparm") ||
    n.includes("shoulder") ||
    n.includes("clavicle") ||
    n.includes("collar") ||
    (n.includes("arm") && !n.includes("fore"))
  )
    return "upper";
  return "other";
}

function legPart(n: string): BoneSlot["part"] {
  if (n.includes("foot") || n.includes("toe") || n.includes("ankle")) return "hand";
  if (
    n.includes("shin") ||
    n.includes("calf") ||
    n.includes("lowerleg") ||
    n.includes("knee") ||
    (n.includes("leg") && !n.includes("up") && !n.includes("thigh"))
  )
    return "lower";
  if (
    n.includes("upleg") ||
    n.includes("upperleg") ||
    n.includes("thigh") ||
    n.includes("hip") ||
    n.includes("femur")
  )
    return "upper";
  return "other";
}

function discoverDanceRig(root: THREE.Object3D): DanceRig {
  const rig: DanceRig = {
    armL: [],
    armR: [],
    legL: [],
    legR: [],
    spine: [],
    head: [],
    hips: [],
  };

  root.traverse((o) => {
    if (o.type !== "Bone" && !(o as THREE.Bone).isBone) return;
    const raw = o.name || "";
    const n = raw.toLowerCase();
    // Skip helpers / twists / fingers — they break bar dance if rotated en masse
    if (
      n.includes("finger") ||
      n.includes("thumb") ||
      n.includes("toe") ||
      n.includes("index") ||
      n.includes("middle") ||
      n.includes("ring") ||
      n.includes("pinky") ||
      n.includes("twist") ||
      n.includes("_vol_") ||
      n.includes("volume") ||
      n.includes("helper") ||
      n.includes("ik_") ||
      n.includes("_ik") ||
      n.includes("roll") ||
      n.includes("_end") ||
      n.includes("metacarpal") ||
      n.includes("ball")
    )
      return;

    const slot = (part: BoneSlot["part"]): BoneSlot => ({
      obj: o,
      rest: o.rotation.clone(),
      part,
    });
    const side = boneSide(raw);

    const isArm =
      n.includes("arm") ||
      n.includes("shoulder") ||
      n.includes("hand") ||
      n.includes("bicep") ||
      n.includes("elbow") ||
      n.includes("clavicle") ||
      n.includes("wrist");
    const isLeg =
      n.includes("leg") ||
      n.includes("thigh") ||
      n.includes("foot") ||
      n.includes("shin") ||
      n.includes("knee") ||
      n.includes("calf") ||
      n.includes("upleg") ||
      n.includes("femur");
    const isSpine =
      n.includes("spine") ||
      n.includes("chest") ||
      n.includes("torso") ||
      n.includes("abdomen") ||
      n.includes("belly");
    const isHips =
      n.includes("hips") ||
      n.includes("pelvis") ||
      n === "hip" ||
      n.endsWith("_hip");
    const isHead =
      (n.includes("head") || n.includes("neck")) &&
      !n.includes("headtop") &&
      !n.includes("end");

    if (isArm && side === "L") rig.armL.push(slot(armPart(n)));
    else if (isArm && side === "R") rig.armR.push(slot(armPart(n)));
    else if (isLeg && side === "L") rig.legL.push(slot(legPart(n)));
    else if (isLeg && side === "R") rig.legR.push(slot(legPart(n)));
    else if (isHips) rig.hips.push(slot("other"));
    else if (isSpine) rig.spine.push(slot("other"));
    else if (isHead) rig.head.push(slot("other"));
  });

  // Prefer a single primary bone per limb part (upper/lower) so dense rigs don't mush
  const trim = (list: BoneSlot[]) => {
    const byPart = new Map<string, BoneSlot>();
    for (const s of list) {
      if (!byPart.has(s.part)) byPart.set(s.part, s);
    }
    return [...byPart.values()];
  };
  rig.armL = trim(rig.armL);
  rig.armR = trim(rig.armR);
  rig.legL = trim(rig.legL);
  rig.legR = trim(rig.legR);
  rig.spine = rig.spine.slice(0, 3);
  rig.head = rig.head.slice(0, 2);
  rig.hips = rig.hips.slice(0, 1);

  return rig;
}

function applyBone(
  slots: BoneSlot[],
  part: BoneSlot["part"] | "any",
  axis: "x" | "y" | "z",
  delta: number,
) {
  for (const s of slots) {
    if (part !== "any" && s.part !== part) continue;
    s.obj.rotation[axis] = s.rest[axis] + delta;
  }
}

function clipDanceScore(name: string): number {
  const n = name.toLowerCase();
  if (/t[-_ ]?pose|bind|rest|a[-_ ]?pose/.test(n)) return -20;
  if (/death|sit|sleep/.test(n)) return -5;
  if (/dance|hip.?hop|samba|salsa|groove|party|twerk|pole|kick|chicken|skeleton|tut/.test(n)) return 100;
  if (/play/.test(n)) return 95;
  if (/take\s*0*1|mixamo/.test(n)) return 85;
  if (/walk|jog/.test(n)) return 58;
  if (/run/.test(n)) return 48;
  if (/idle|stand/.test(n)) return 35;
  return 15;
}

function pickDanceClip(clips: THREE.AnimationClip[]): THREE.AnimationClip | null {
  if (!clips.length) return null;
  const ranked = [...clips].sort(
    (a, b) => clipDanceScore(b.name) - clipDanceScore(a.name),
  );
  const best = ranked[0];
  if (!best || clipDanceScore(best.name) < 0) return ranked.find((c) => clipDanceScore(c.name) > 0) ?? null;
  return best;
}

type LoosePart = {
  obj: THREE.Object3D;
  role: "hair" | "body" | "cloth" | "feet" | "other";
  pos: THREE.Vector3;
  rot: THREE.Euler;
  scl: THREE.Vector3;
};

function collectLooseParts(root: THREE.Object3D): LoosePart[] {
  const parts: LoosePart[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const n = (mesh.name || "").toLowerCase();
    let role: LoosePart["role"] = "other";
    if (/hair|head/.test(n)) role = "hair";
    else if (/shirt|cloth|dress|top|jacket|short|pant|skirt/.test(n)) role = "cloth";
    else if (/shoe|sneaker|boot|foot/.test(n)) role = "feet";
    else if (/body|skin/.test(n)) role = "body";
    parts.push({
      obj: mesh,
      role,
      pos: mesh.position.clone(),
      rot: mesh.rotation.clone(),
      scl: mesh.scale.clone(),
    });
  });
  return parts.length >= 2 ? parts : [];
}

/** 0..1 pulse that rises fast and eases down — club bounce, not a square hop */
function bounce01(x: number): number {
  const s = Math.sin(x);
  return s > 0 ? s * s : 0;
}

const MIKU_PALETTE = {
  hair: 0x39c5bb,
  hairTip: 0x8af5ee,
  hairDark: 0x1f8f88,
  skin: 0xf4c2a8,
  shirt: 0x3a3a42,
  skirt: 0x141418,
  sleeve: 0x2a2a32,
  boot: 0x0c0c10,
  tie: 0x39c5bb,
  eye: 0x102226,
  lip: 0xd08088,
} as const;

function isHairMatName(name: string | undefined): boolean {
  return /hair|kami|twin/i.test(name ?? "");
}

/** Hatsune palette: FBX shipped gray Phong + no textures, so we paint by material groups. */
function paintMikuCharacter(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return;
    const srcs = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const already = Boolean(mesh.geometry.getAttribute("color"));
    if (!already) {
      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const mtx = mesh.matrixWorld;
      const tmp = new THREE.Vector3();
      const box = new THREE.Box3();
      const world = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        tmp.fromBufferAttribute(pos, i).applyMatrix4(mtx);
        world[i * 3] = tmp.x;
        world[i * 3 + 1] = tmp.y;
        world[i * 3 + 2] = tmp.z;
        box.expandByPoint(tmp);
      }
      const size = box.getSize(new THREE.Vector3());
      if (size.y > 1e-4) {
        const hairOf = new Uint8Array(pos.count);
        const groups = geo.groups?.length
          ? geo.groups
          : [{ start: 0, count: pos.count, materialIndex: 0 }];
        const idx = geo.index;
        const namedHair = srcs.some((s) => isHairMatName(s.name));
        const liftedHair = !namedHair && box.min.y > box.max.y * 0.12;
        for (const gr of groups) {
          const matIndex = gr.materialIndex ?? 0;
          const hair = isHairMatName(srcs[matIndex]?.name) || liftedHair;
          if (idx) {
            for (let i = gr.start; i < gr.start + gr.count; i++) hairOf[idx.getX(i)] = hair ? 1 : 0;
          } else {
            for (let i = gr.start; i < gr.start + gr.count; i++) hairOf[i] = hair ? 1 : 0;
          }
        }
        const colors = new Float32Array(pos.count * 3);
        const skin = new THREE.Color(MIKU_PALETTE.skin);
        const shirt = new THREE.Color(MIKU_PALETTE.shirt);
        const skirt = new THREE.Color(MIKU_PALETTE.skirt);
        const sleeve = new THREE.Color(MIKU_PALETTE.sleeve);
        const boot = new THREE.Color(MIKU_PALETTE.boot);
        const tie = new THREE.Color(MIKU_PALETTE.tie);
        const eye = new THREE.Color(MIKU_PALETTE.eye);
        const lip = new THREE.Color(MIKU_PALETTE.lip);
        const rootC = new THREE.Color(MIKU_PALETTE.hairDark);
        const midC = new THREE.Color(MIKU_PALETTE.hair);
        const tipC = new THREE.Color(MIKU_PALETTE.hairTip);
        const hx = Math.max(size.x, 1e-4);
        const cx = (box.min.x + box.max.x) * 0.5;
        const faceZ = box.max.z - size.z * 0.22;
        const c = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
          const x = world[i * 3]!;
          const y = world[i * 3 + 1]!;
          const z = world[i * 3 + 2]!;
          const ny = (y - box.min.y) / size.y;
          const ax = Math.abs(x - cx) / hx;
          if (hairOf[i]) {
            c.copy(midC);
            if (ny < 0.55) c.lerp(tipC, 1 - ny / 0.55);
            else c.lerp(rootC, (ny - 0.55) / 0.45);
          } else if (ny > 0.78) {
            c.copy(skin);
            if (z > faceZ && ny > 0.86 && ny < 0.935 && ax > 0.04 && ax < 0.15) c.copy(eye);
            else if (z > faceZ && ny > 0.8 && ny < 0.845 && ax < 0.045) c.copy(lip);
          } else if (ny > 0.5) {
            if (ax > 0.26) c.copy(sleeve);
            else if (ax < 0.065 && ny < 0.72 && ny > 0.52) c.copy(tie);
            else c.copy(shirt);
          } else if (ny > 0.13) {
            c.copy(skirt);
          } else {
            c.copy(boot);
          }
          colors[i * 3] = c.r;
          colors[i * 3 + 1] = c.g;
          colors[i * 3 + 2] = c.b;
        }
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      }
    }

    const next = srcs.map((src) => {
      const hair = isHairMatName(src.name);
      if (src instanceof THREE.MeshStandardMaterial || src instanceof THREE.MeshPhysicalMaterial) {
        const mat = src.clone();
        mat.vertexColors = true;
        mat.color.set(0xffffff);
        if (hair) {
          mat.emissive.setHex(MIKU_PALETTE.hair);
          mat.emissiveIntensity = 0.05;
          mat.roughness = 0.28;
          mat.metalness = 0.1;
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          mat.roughness = 0.5;
          mat.metalness = 0.05;
        }
        mat.needsUpdate = true;
        return mat;
      }
      return src;
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
  });
}

function paintChickenGuest(root: THREE.Object3D) {
  type Hit = { mesh: THREE.Mesh; maxY: number; verts: number };
  const hits: Hit[] = [];
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox;
    if (!bb) return;
    const world = bb.clone().applyMatrix4(mesh.matrixWorld);
    hits.push({
      mesh,
      maxY: world.max.y,
      verts: mesh.geometry.attributes.position.count,
    });
  });
  hits.sort((a, b) => b.maxY - a.maxY || b.verts - a.verts);
  // top = hair, then face/skin, then clothes by remaining size
  const byHeight = hits.map((h) => h.mesh);
  const colors = [0x2a1812, 0xe8b89a, 0xf2c4a8, 0x2d6cdf, 0xf4d35e, 0x1a1a22];
  byHeight.forEach((mesh, i) => {
    const hex = colors[Math.min(i, colors.length - 1)]!;
    const srcs = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next = srcs.map(() => {
      return new THREE.MeshStandardMaterial({
        color: hex,
        metalness: i === 0 ? 0.04 : 0.06,
        roughness: i <= 2 ? 0.62 : 0.5,
        emissive: 0x000000,
        emissiveIntensity: 0,
        envMapIntensity: 0.45,
      });
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
  });
}

function paintSalsaCouple(root: THREE.Object3D) {
  const male = {
    hair: 0x1a1410,
    skin: 0xc48a62,
    top: 0x1f6f8b,
    bottom: 0x1c2430,
    shoes: 0x121214,
  };
  const female = {
    hair: 0x2a120e,
    skin: 0xd4a078,
    top: 0xc81e4a,
    bottom: 0x8a1534,
    shoes: 0x1a1214,
  };
  const paint = (
    mesh: THREE.Mesh,
    pal: { hair: number; skin: number; top: number; bottom: number; shoes: number },
  ) => {
    const pos = mesh.geometry.attributes.position;
    if (!pos) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    if (!box) return;
    const h = Math.max(box.max.y - box.min.y, 1e-4);
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const ny = (pos.getY(i) - box.min.y) / h;
      if (ny > 0.88) c.setHex(pal.hair);
      else if (ny > 0.78) c.setHex(pal.skin);
      else if (ny > 0.48) c.setHex(pal.top);
      else if (ny > 0.12) c.setHex(pal.bottom);
      else c.setHex(pal.shoes);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    mesh.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    mesh.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      metalness: 0.06,
      roughness: 0.58,
      envMapIntensity: 0.45,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
  };

  const leftover: THREE.Mesh[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const n = mesh.name.toLowerCase();
    if (/text|cylinder|floor/i.test(n) || !(mesh as THREE.SkinnedMesh).isSkinnedMesh) {
      if (!(mesh as THREE.SkinnedMesh).isSkinnedMesh) mesh.visible = false;
      return;
    }
    if (/female/i.test(n)) paint(mesh, female);
    else if (/male/i.test(n)) paint(mesh, male);
    else leftover.push(mesh);
  });
  leftover.forEach((mesh, i) => paint(mesh, i % 2 ? female : male));
}

function isBarCrewBody(name: string): boolean {
  return /ironman|deadpool|wolverine|spiderman|black_panther/i.test(name);
}

function isBarCrewJunk(name: string): boolean {
  return /^blackpan\d+/i.test(name) || /rigid/i.test(name);
}

function barCrewId(meshName: string): "iron" | "dead" | "wolv" | "spy" | "panther" | null {
  const n = meshName.toLowerCase();
  if (n.includes("iron")) return "iron";
  if (n.includes("dead")) return "dead";
  if (n.includes("wolv")) return "wolv";
  if (n.includes("spider")) return "spy";
  if (n.includes("black_panther") || n.includes("blackpanther")) return "panther";
  return null;
}

function paintBarCrew(root: THREE.Object3D) {
  const byWho: Record<
    NonNullable<ReturnType<typeof barCrewId>>,
    Record<string, { color: number; metal: number; rough: number; em?: number }>
  > = {
    iron: { _: { color: 0xb42318, metal: 0.55, rough: 0.32, em: 0x4a1008 } },
    dead: {
      body: { color: 0xc81e3a, metal: 0.12, rough: 0.45 },
      straps: { color: 0x141416, metal: 0.2, rough: 0.5 },
      gear: { color: 0x8a1528, metal: 0.25, rough: 0.4 },
      metal: { color: 0xb0b4bc, metal: 0.85, rough: 0.22 },
      guns: { color: 0x2a2a30, metal: 0.7, rough: 0.28 },
      swords: { color: 0xc5cad3, metal: 0.9, rough: 0.16 },
      _: { color: 0xc81e3a, metal: 0.15, rough: 0.45 },
    },
    wolv: {
      body: { color: 0xe2b422, metal: 0.18, rough: 0.42 },
      metal: { color: 0xc0c4cc, metal: 0.88, rough: 0.18 },
      mask: { color: 0x1d3f9a, metal: 0.12, rough: 0.48 },
      mouth: { color: 0xe8b496, metal: 0.04, rough: 0.62 },
      claws: { color: 0xd8dde6, metal: 0.92, rough: 0.14 },
      skin: { color: 0xe8b496, metal: 0.04, rough: 0.62 },
      face: { color: 0xe8b496, metal: 0.04, rough: 0.62 },
      _: { color: 0xe2b422, metal: 0.16, rough: 0.44 },
    },
    spy: {
      body: { color: 0xc41e3a, metal: 0.18, rough: 0.4 },
      eyes: { color: 0xf4f4f8, metal: 0.08, rough: 0.35 },
      _: { color: 0xc41e3a, metal: 0.18, rough: 0.42 },
    },
    panther: {
      body: { color: 0x16161c, metal: 0.35, rough: 0.38 },
      gold: { color: 0xc9a227, metal: 0.82, rough: 0.24, em: 0x5a4010 },
      _: { color: 0x16161c, metal: 0.32, rough: 0.4 },
    },
  };

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const who = barCrewId(mesh.name);
    if (!who) return;
    const pack = byWho[who];
    const srcs = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next = srcs.map((src) => {
      const key = (src.name || "").toLowerCase();
      const spec = pack[key] ?? pack._;
      const mat =
        src instanceof THREE.MeshStandardMaterial ||
        src instanceof THREE.MeshPhysicalMaterial ||
        src instanceof THREE.MeshPhongMaterial
          ? (src as THREE.MeshStandardMaterial).clone()
          : new THREE.MeshStandardMaterial();
      const std =
        mat instanceof THREE.MeshStandardMaterial
          ? mat
          : new THREE.MeshStandardMaterial({ map: (src as THREE.MeshPhongMaterial).map });
      std.color.setHex(spec.color);
      std.map = null;
      std.emissiveMap = null;
      std.metalness = spec.metal;
      std.roughness = spec.rough;
      std.emissive.setHex(spec.em ?? spec.color);
      std.emissiveIntensity = spec.em ? 0.16 : 0.08;
      std.envMapIntensity = 0.7;
      std.vertexColors = false;
      std.needsUpdate = true;
      return std;
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
  });
}

function fitFreddieDuo(root: THREE.Object3D, targetH: number) {
  const model =
    (root.userData.gltf as { model?: THREE.Object3D } | undefined)?.model ?? root;
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  const collect = () => {
    box.makeEmpty();
    model.updateMatrixWorld(true);
    model.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if (!mesh.isSkinnedMesh || !mesh.visible) return;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const bb = mesh.geometry.boundingBox;
      if (!bb) return;
      tmp.copy(bb).applyMatrix4(mesh.matrixWorld);
      box.union(tmp);
    });
  };
  collect();
  const size = box.getSize(new THREE.Vector3());
  if (size.y > 1e-4) model.scale.multiplyScalar(targetH / size.y);
  collect();
  if (Number.isFinite(box.min.y)) {
    model.position.y -= box.min.y;
    model.position.x -= (box.min.x + box.max.x) * 0.5;
    model.position.z -= (box.min.z + box.max.z) * 0.5;
  }
}

function fitBarCrew(root: THREE.Object3D, targetH: number) {
  const model =
    (root.userData.gltf as { model?: THREE.Object3D } | undefined)?.model ?? root;
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (isBarCrewJunk(mesh.name)) mesh.visible = false;
  });
  model.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible || !isBarCrewBody(mesh.name)) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox;
    if (!bb) return;
    tmp.copy(bb).applyMatrix4(mesh.matrixWorld);
    box.union(tmp);
  });
  const size = box.getSize(new THREE.Vector3());
  if (size.y > 1e-4) model.scale.multiplyScalar(targetH / size.y);
  model.updateMatrixWorld(true);
  box.makeEmpty();
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible || !isBarCrewBody(mesh.name)) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox;
    if (!bb) return;
    tmp.copy(bb).applyMatrix4(mesh.matrixWorld);
    box.union(tmp);
  });
  if (Number.isFinite(box.min.y)) {
    model.position.y -= box.min.y;
    model.position.x -= (box.min.x + box.max.x) * 0.5;
    model.position.z -= (box.min.z + box.max.z) * 0.5;
  }
}

/**
 * Skinned GLB character via GLTFLoader — face-camera + bar jump dance.
 */
export async function createGlbCharacter(opts: GlbCharOpts = {}): Promise<SculptGroup> {
  const kind = resolveKind(opts);
  const url = KIND_URL[kind];
  const style = opts.style ?? 0;
  const outfit = OUTFIT[style % OUTFIT.length]!;
  const faceYaw = FACE_CAMERA_YAW[kind] ?? 0;

  const pack: GltfPack =
    kind === "bar5"
      ? await (async () => {
          const fbxUrl = "/dj_fbx/5dance%2011.fbx";
          const { group, animations } = await loadFbx(fbxUrl);
          return {
            url: fbxUrl,
            scene: group,
            animations,
            gltf: { scene: group, animations } as GltfPack["gltf"],
          };
        })()
      : await loadGltf(url);
  const root = instantiateGltf(pack, {
    height: kind === "bar5" || kind === "freddie" ? undefined : 1.72 * (opts.scale ?? 1),
    scale: kind === "bar5" || kind === "freddie" ? 1 : undefined,
    ground: kind !== "bar5" && kind !== "freddie",
    yaw: faceYaw,
    tint: undefined,
    tintStrength: 0,
    noFrustumCull: false,
    cloneMaterials: !["miku", "lisa", "bar5", "gangster", "freddie", ...FLOOR_KINDS].includes(kind),
  });
  root.name = `glb-${kind}`;

  if (kind === "bar5") {
    fitBarCrew(root, 2.25 * (opts.scale ?? 1));
    paintBarCrew(root);
  }
  if (kind === "freddie") fitFreddieDuo(root, 1.82 * (opts.scale ?? 1));
  if (kind === "miku") paintMikuCharacter(root);
  if (kind === "chicken") paintChickenGuest(root);
  if (kind === "salsa") paintSalsaCouple(root);

  // Ensure every skinned mesh is visible and has vibrant PBR materials
  root.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (m.isSkinnedMesh) {
      if (kind === "bar5" && isBarCrewJunk(m.name)) {
        m.visible = false;
        return;
      }
      m.frustumCulled = true;
      m.visible = true;
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          mat.side = THREE.DoubleSide;
          mat.transparent = false;
          mat.opacity = 1;
          mat.depthWrite = true;
          mat.visible = true;
          // @ts-expect-error skinning flag for older three materials
          mat.skinning = true;
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
            const hair = /hair|kami|twin/i.test(mat.name);
            // Keep avatars matte so ACES + bloom don't blow them to white.
            if (kind === "miku") {
              mat.roughness = hair ? 0.38 : 0.62;
              mat.metalness = hair ? 0.06 : 0.04;
              mat.envMapIntensity = 0.55;
              if (!hair) {
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 0;
              } else {
                mat.emissiveIntensity = Math.min(mat.emissiveIntensity, 0.06);
              }
            } else if (kind === "bar5") {
              mat.envMapIntensity = 0.65;
            } else if (kind === "lisa") {
              mat.envMapIntensity = 0.7;
              mat.roughness = Math.max(mat.roughness ?? 0.5, 0.45);
              mat.metalness = Math.min(mat.metalness ?? 0.15, 0.18);
              mat.emissiveIntensity = Math.min(mat.emissiveIntensity, 0.04);
            } else if (kind === "chicken" || kind === "salsa") {
              mat.envMapIntensity = 0.4;
              mat.emissiveIntensity = 0;
            } else if (kind === "freddie" || kind === "gangster") {
              mat.envMapIntensity = 0.8;
              mat.emissiveIntensity = Math.min(mat.emissiveIntensity, 0.04);
            } else {
              mat.roughness = Math.max(mat.roughness ?? 0.55, 0.58);
              mat.metalness = Math.min(mat.metalness ?? 0.12, 0.12);
              mat.envMapIntensity = 0.5;
              mat.emissiveIntensity = Math.min(mat.emissiveIntensity, 0.03);
              const lum = 0.2126 * mat.color.r + 0.7152 * mat.color.g + 0.0722 * mat.color.b;
              if (!mat.map && lum > 0.45) mat.color.setHex(0x8a8278);
            }
          }
          mat.needsUpdate = true;
        }
      }
    }
  });

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 28),
    new THREE.MeshBasicMaterial({
      color: outfit,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      toneMapped: true,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.03;
  root.add(glow);

  const now = Date.now();
  const active = (opts.auraUntil ?? 0) > now || style === 2042;
  const tier = style === 2042 ? 4 : active ? opts.wingTier ?? 0 : 0;
  const isAngelFlight = style === 2042 || tier >= 4;

  let wingL: THREE.Group | undefined;
  let wingR: THREE.Group | undefined;
  if (isAngelFlight) {
    wingL = makeAngelFlightWingsGlb(-1);
    wingR = makeAngelFlightWingsGlb(1);
    wingL.position.set(-0.18, 1.25, -0.12);
    wingR.position.set(0.18, 1.25, -0.12);
    root.add(wingL, wingR);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.02, 8, 28),
      neon(0xffd700, 1.4),
    );
    halo.position.set(0, 1.82, 0);
    halo.rotation.x = Math.PI / 2.4;
    root.add(halo);
  } else if (tier >= 2) {
    wingL = makeWing(outfit, -1, tier);
    wingR = makeWing(outfit, 1, tier);
    wingL.position.set(-0.18, 1.2, -0.1);
    wingR.position.set(0.18, 1.2, -0.1);
    root.add(wingL, wingR);
  }

  const anim = createGltfMixer(root);
  const actions: THREE.AnimationAction[] = [];

  const rig = discoverDanceRig(root);
  const hasLimbs =
    rig.armL.length + rig.armR.length + rig.legL.length + rig.legR.length >= 4;
  const looseParts = collectLooseParts(root);

  const danceClip =
    kind === "freddie"
      ? (pack.animations ?? []).find((c) => /play/i.test(c.name)) ??
        pickDanceClip(pack.animations ?? [])
      : pickDanceClip(pack.animations ?? []);
  if (danceClip) {
    const played = anim.play(danceClip.name, {
      weight: 1,
      timeScale: 0.92 + (Math.abs(style) % 5) * 0.04,
    });
    if (played) {
      played.enabled = true;
      played.setLoop(THREE.LoopRepeat, Infinity);
      played.clampWhenFinished = false;
      played.time = Math.random() * Math.max(0.1, danceClip.duration);
      actions.push(played);
    }
  }

  const state = { dancing: opts.dancing ?? true };
  const phase = Math.random() * Math.PI * 2;
  const bpm = 118 + (Math.abs(style) % 6) * 2;
  const modelRoot =
    (root.userData.gltf as { model?: THREE.Object3D } | undefined)?.model ?? root;
  const baseModelY = modelRoot.position.y;
  const useClipDance = actions.length > 0;
  const lockToClip =
    kind === "lisa" || kind === "bar5" || kind === "gangster" || kind === "freddie";

  const runtime: GlbRuntime = {
    state,
    pivots: { model: modelRoot },
    sockets: { ground: root },
    labels: {
      model: url,
      kind,
      loader: "GLTFLoader",
      faceYaw: String(faceYaw),
      bones: String(
        rig.armL.length +
          rig.armR.length +
          rig.legL.length +
          rig.legR.length,
      ),
      mode: useClipDance ? "clip" : hasLimbs ? "procedural" : "mesh",
      clip: danceClip?.name ?? "",
    },
    setDancing(v: boolean) {
      state.dancing = v;
      actions.forEach((act) => {
        act.setEffectiveWeight(v ? 1 : 0.25);
        act.timeScale = v ? 0.95 + (Math.abs(style) % 4) * 0.05 : 0.35;
      });
    },
    dispose: () => {
      anim.stopAll();
    },
    tick(dt: number, t: number) {
      if (actions.length) anim.update(dt);

      const ph = t + phase;
      const beat = ph * ((bpm / 60) * Math.PI);
      const hop = bounce01(beat);
      const settle = 1 - hop;
      const sway = Math.sin(ph * 1.35);
      const swaySlow = Math.sin(ph * 0.7);
      const pulse = Math.sin(ph * 2.7);

      if (!state.dancing) {
        if (!useClipDance) {
          modelRoot.rotation.y = faceYaw;
          modelRoot.rotation.x = 0;
          modelRoot.rotation.z = 0;
          modelRoot.scale.set(1, 1, 1);
          for (const group of [
            rig.armL,
            rig.armR,
            rig.legL,
            rig.legR,
            rig.spine,
            rig.head,
            rig.hips,
          ]) {
            for (const s of group) s.obj.rotation.copy(s.rest);
          }
          for (const p of looseParts) {
            p.obj.position.copy(p.pos);
            p.obj.rotation.copy(p.rot);
            p.obj.scale.copy(p.scl);
          }
        }
        modelRoot.position.y = baseModelY;
        root.rotation.y = Number(root.userData.faceYaw ?? 0);
        glow.scale.setScalar(1);
        return;
      }

      if (useClipDance) {
        // Pole / planted clips must not hop or yaw — hands stay on the prop.
        if (lockToClip) {
          modelRoot.position.y = baseModelY;
          root.rotation.y = Number(root.userData.faceYaw ?? 0);
          glow.scale.setScalar(1);
        } else {
          modelRoot.position.y = baseModelY + hop * 0.035;
          root.rotation.y = Number(root.userData.faceYaw ?? 0) + swaySlow * 0.08;
          glow.scale.setScalar(1 + hop * 0.06);
        }
      } else if (hasLimbs) {
        // Overlapping body parts, delayed spine, weight-shift — not a lockstep hop
        const hipLead = ph * 1.45;
        const armLead = ph * 2.15 + 0.4;
        const headLead = ph * 0.85 - 0.25;
        const shift = Math.sin(hipLead);

        modelRoot.rotation.y = faceYaw + swaySlow * 0.1;
        modelRoot.rotation.z = shift * 0.045 + pulse * 0.015;
        modelRoot.rotation.x = Math.sin(ph * 1.6) * 0.03 - hop * 0.02;
        modelRoot.position.y = baseModelY + hop * 0.055;
        modelRoot.scale.y = 1 - settle * 0.018 + hop * 0.02;
        modelRoot.scale.x = 1 + settle * 0.012 - hop * 0.01;
        modelRoot.scale.z = modelRoot.scale.x;

        const armWave = Math.sin(armLead);
        const armWave2 = Math.sin(armLead * 0.5 + 1.1);
        applyBone(rig.armL, "upper", "x", armWave * 0.38 + hop * 0.08);
        applyBone(rig.armL, "upper", "z", 0.28 + armWave2 * 0.22 + hop * 0.12);
        applyBone(rig.armL, "lower", "x", 0.45 + bounce01(armLead + 0.3) * 0.35);
        applyBone(rig.armL, "hand", "x", Math.sin(armLead * 1.4) * 0.18);
        applyBone(rig.armR, "upper", "x", -armWave * 0.34 + hop * 0.1);
        applyBone(rig.armR, "upper", "z", -0.32 - Math.sin(armLead + 0.8) * 0.2);
        applyBone(rig.armR, "lower", "x", 0.42 + bounce01(armLead + 1.4) * 0.32);
        applyBone(rig.armR, "hand", "x", Math.sin(armLead * 1.4 + 1) * 0.16);

        const step = Math.sin(hipLead);
        applyBone(rig.legL, "upper", "x", -step * 0.22 - settle * 0.08 + hop * 0.04);
        applyBone(rig.legR, "upper", "x", step * 0.22 - settle * 0.08 + hop * 0.04);
        applyBone(rig.legL, "lower", "x", Math.max(0, -step) * 0.38 + settle * 0.12);
        applyBone(rig.legR, "lower", "x", Math.max(0, step) * 0.38 + settle * 0.12);

        for (const s of rig.hips) {
          s.obj.rotation.y = s.rest.y + shift * 0.16;
          s.obj.rotation.z = s.rest.z + Math.sin(hipLead + 0.2) * 0.06;
        }
        for (const s of rig.spine) {
          s.obj.rotation.y = s.rest.y + shift * 0.1;
          s.obj.rotation.x = s.rest.x + Math.sin(hipLead + 0.35) * 0.05 - hop * 0.02;
          s.obj.rotation.z = s.rest.z + pulse * 0.03;
        }
        for (const s of rig.head) {
          s.obj.rotation.y = s.rest.y + Math.sin(headLead) * 0.12;
          s.obj.rotation.x = s.rest.x + hop * 0.04 + Math.sin(headLead * 1.3) * 0.04;
        }
        glow.scale.setScalar(1 + hop * 0.08 + pulse * 0.02);
      } else if (looseParts.length) {
        // Multi-mesh statue (anime girl): each piece groves on its own delay
        modelRoot.rotation.y = faceYaw + swaySlow * 0.12;
        modelRoot.rotation.z = sway * 0.05;
        modelRoot.rotation.x = -hop * 0.03 + pulse * 0.02;
        modelRoot.position.y = baseModelY + hop * 0.07;
        modelRoot.scale.y = 1 - settle * 0.025 + hop * 0.02;
        modelRoot.scale.x = 1 + settle * 0.016;
        modelRoot.scale.z = modelRoot.scale.x;

        for (const p of looseParts) {
          const delay =
            p.role === "hair" ? 0.28 : p.role === "cloth" ? 0.16 : p.role === "feet" ? 0.02 : 0.1;
          const localHop = bounce01(beat - delay);
          const localSway = Math.sin(ph * 1.35 - delay);
          p.obj.position.copy(p.pos);
          p.obj.rotation.copy(p.rot);
          p.obj.scale.copy(p.scl);
          if (p.role === "hair") {
            p.obj.rotation.z += localSway * 0.08;
            p.obj.rotation.x += localHop * 0.05;
            p.obj.position.y += localHop * 0.012;
          } else if (p.role === "cloth") {
            p.obj.rotation.y += localSway * 0.05;
            p.obj.position.y += localHop * 0.008;
          } else if (p.role === "feet") {
            p.obj.position.y += localHop * 0.004;
          } else {
            p.obj.position.y += localHop * 0.01;
            p.obj.rotation.z += localSway * 0.03;
          }
        }
        glow.scale.setScalar(1 + hop * 0.08);
      } else {
        // Single static mesh: layered sway, not a rigid jump
        modelRoot.rotation.y = faceYaw + swaySlow * 0.14 + sway * 0.04;
        modelRoot.rotation.z = sway * 0.07 + pulse * 0.02;
        modelRoot.rotation.x = -hop * 0.04 + Math.sin(ph * 1.9) * 0.03;
        modelRoot.position.y = baseModelY + hop * 0.065;
        modelRoot.scale.y = 1 - settle * 0.028 + hop * 0.022;
        modelRoot.scale.x = 1 + settle * 0.016 - hop * 0.008;
        modelRoot.scale.z = modelRoot.scale.x;
        glow.scale.setScalar(1 + hop * 0.08 + pulse * 0.02);
      }

      if (wingL && wingR) {
        const flap = Math.sin(ph * 3.2) * 0.22 + hop * 0.08;
        wingL.rotation.y = flap;
        wingR.rotation.y = -flap;
      }
    },
  };

  return markFactory(root, `glb-${kind}`, "glb", runtime);
}

export function preloadGlbCharacters() {
  return preloadGltf([...DANCER_GLTF_URLS]);
}

export function listGlbModels(): { id: ClubModelId; url: string }[] {
  return (Object.keys(CLUB_GLTF) as ClubModelId[]).map((id) => ({
    id,
    url: CLUB_GLTF[id],
  }));
}

function makeWing(color: number, side: 1 | -1, tier: number) {
  const g = new THREE.Group();
  const baseCol = tier >= 4 ? 0xff6a00 : tier >= 3 ? 0xffe9a8 : color;
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const feather = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04 + t * 0.03, 0.35 + t * 0.35, 4, 8),
      neon(baseCol, 0.9),
    );
    feather.position.set(side * (0.1 + t * 0.08), 0.05 + t * 0.1, -0.06 - t * 0.04);
    feather.rotation.z = side * (0.35 + t * 0.5);
    feather.rotation.x = -0.2;
    g.add(feather);
  }
  return g;
}

function makeAngelFlightWingsGlb(side: 1 | -1) {
  const g = new THREE.Group();
  const feathers = 7;
  for (let i = 0; i < feathers; i++) {
    const t = i / (feathers - 1);
    const featherCol = i % 2 === 0 ? 0xffd700 : 0x00ffff;
    const feather = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045 + t * 0.035, 0.45 + t * 0.55, 6, 12),
      physical(featherCol, {
        metal: 0.9,
        rough: 0.1,
        emissive: featherCol,
        emInt: 0.6,
        clearcoat: 1.0,
      }),
    );
    feather.position.set(side * (0.12 + t * 0.12), 0.08 + t * 0.15, -0.08 - t * 0.06);
    feather.rotation.z = side * (0.35 + t * 0.55);
    feather.rotation.x = -0.15;
    g.add(feather);
  }

  const joint = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12),
    physical(0xd4af37, { metal: 0.95, rough: 0.1 }),
  );
  joint.position.set(side * 0.12, 0.35, -0.08);
  joint.rotation.z = Math.PI / 2;
  g.add(joint);

  return g;
}
