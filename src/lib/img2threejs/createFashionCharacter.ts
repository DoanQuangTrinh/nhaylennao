/**
 * img2threejs fashion humanoid
 * -----------------------------
 * Reference: src/assets/img2threejs/refs/fashion-models-ref.png
 *   row1 — glossy red hoodie jacket + mini dress + black tights + heels
 *   row2 — black / patterned cocktail dress
 *   row3 — casual denim + shirt
 *
 * Stylized-high (not photogrammetry): complete multi-part body, face landmarks,
 * layered clothing, PBR cloth/skin, dance-ready pivots. Approximate from single
 * multi-view sheet — hidden topology inferred.
 *
 * Factory returns THREE.Group + userData.sculptRuntime (img2threejs contract).
 */
import * as THREE from "three";
import { markFactory, type SculptGroup, type SculptRuntime } from "./runtime";
import { enableShadows, OUTFIT } from "./materials";

export type FashionOpts = {
  /** 0 red jacket · 1 black dress · 2 print dress · 3 casual male · 4 casual female · 5 neon club */
  outfit?: number;
  skin?: number;
  dancing?: boolean;
  wingTier?: number;
  auraUntil?: number;
  scale?: number;
  role?: "dancer" | "dj" | "bartender" | "bouncer" | "guest";
};

export type FashionRuntime = SculptRuntime & {
  setDancing: (v: boolean) => void;
  state: { dancing: boolean };
};

// ── Palette from reference sheet ────────────────────────────────────────────
const SKIN = [
  0xf0c8a8, 0xe8b890, 0xd4a070, 0xc48858, 0xf5d4b8, 0xe0a878, 0xb87850, 0x8a5a38,
];
const HAIR = [
  0x1a1018, 0x2a1810, 0x1c1420, 0x3a2818, 0x0e0a10, 0x4a3020, 0x1a2030, 0x2a1020,
];

const OUTFITS = [
  // 0 red glossy hoodie set (row 1)
  {
    body: 0xc41828,
    accent: 0x8a0a18,
    pants: 0x0a0a10,
    shoes: 0x101018,
    gloss: true,
    gender: "f" as const,
    kind: "redJacket" as const,
  },
  // 1 black mini dress (row 2 left)
  {
    body: 0x121018,
    accent: 0x2a2435,
    pants: 0xf0c8a8,
    shoes: 0x3a2818,
    gloss: true,
    gender: "f" as const,
    kind: "blackDress" as const,
  },
  // 2 print dress (row 2 right)
  {
    body: 0xd8d4d0,
    accent: 0x2a2a32,
    pants: 0xf0c8a8,
    shoes: 0x5a4030,
    gloss: false,
    gender: "f" as const,
    kind: "printDress" as const,
  },
  // 3 casual male (row 3)
  {
    body: 0xc8c0b0,
    accent: 0x3a6890,
    pants: 0x2a4060,
    shoes: 0xf0f0f5,
    gloss: false,
    gender: "m" as const,
    kind: "casualM" as const,
  },
  // 4 casual female jacket (row 3 right)
  {
    body: 0x6a4038,
    accent: 0x4a2820,
    pants: 0x2a4060,
    shoes: 0xc8b0a0,
    gloss: false,
    gender: "f" as const,
    kind: "casualF" as const,
  },
  // 5 neon club remix
  {
    body: 0x22d3ee,
    accent: 0xc084fc,
    pants: 0x14101f,
    shoes: 0x22d3ee,
    gloss: true,
    gender: "f" as const,
    kind: "neon" as const,
  },
  // 6 pink club
  {
    body: 0xf472b6,
    accent: 0xc084fc,
    pants: 0x14101f,
    shoes: 0xf472b6,
    gloss: true,
    gender: "f" as const,
    kind: "neon" as const,
  },
  // 7 gold club
  {
    body: 0xfbbf24,
    accent: 0xf472b6,
    pants: 0x14101f,
    shoes: 0xfbbf24,
    gloss: true,
    gender: "f" as const,
    kind: "neon" as const,
  },
];

function skinMat(c: number) {
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.62,
    metalness: 0.02,
    envMapIntensity: 0.4,
  });
}

function clothMat(c: number, gloss: boolean, em = 0) {
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: gloss ? 0.22 : 0.55,
    metalness: gloss ? 0.35 : 0.08,
    clearcoat: gloss ? 0.85 : 0.1,
    clearcoatRoughness: gloss ? 0.12 : 0.5,
    emissive: em ? c : 0x000000,
    emissiveIntensity: em,
    envMapIntensity: gloss ? 1.1 : 0.6,
  });
}

function hairMat(c: number) {
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.55,
    metalness: 0.08,
  });
}

function add(parent: THREE.Object3D, mesh: THREE.Mesh, x = 0, y = 0, z = 0) {
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Complete fashion humanoid (~1.70 m) with face landmarks, layered outfit, limbs.
 * Designed from multi-view fashion sheet — club-ready dance pivots.
 */
export function createFashionCharacter(opts: FashionOpts = {}): SculptGroup {
  const outfitI = opts.outfit ?? 0;
  const skinI = opts.skin ?? 0;
  const role = opts.role ?? "dancer";
  const sc = opts.scale ?? 1;
  const of = OUTFITS[outfitI % OUTFITS.length]!;
  // Role overrides for staff
  let bodyCol = of.body;
  let accent = of.accent;
  let pantsCol = of.pants;
  let shoesCol = of.shoes;
  let gloss = of.gloss;
  let gender = of.gender;
  let kind = of.kind;
  if (role === "bouncer") {
    bodyCol = 0x1a1a24;
    accent = 0x101018;
    pantsCol = 0x0e0e14;
    shoesCol = 0x0a0a10;
    gloss = false;
    gender = "m";
    kind = "casualM";
  } else if (role === "bartender") {
    bodyCol = 0xf0f0f5;
    accent = 0x1a1020;
    pantsCol = 0x14101c;
    shoesCol = 0x101018;
    gloss = false;
  } else if (role === "dj") {
    bodyCol = 0x18122a;
    accent = OUTFIT[outfitI % OUTFIT.length]!;
    pantsCol = 0x101018;
    shoesCol = 0x22d3ee;
    gloss = true;
  }

  const skinC = SKIN[skinI % SKIN.length]!;
  const hairC = HAIR[outfitI % HAIR.length]!;
  const isMale = gender === "m" || role === "bouncer";
  const HH = 0.215; // head height unit ≈ 21.5 cm → ~1.72 m @ 8 heads
  const now = Date.now();
  const active = (opts.auraUntil ?? 0) > now;
  const tier = active ? opts.wingTier ?? 0 : 0;

  const root = new THREE.Group();
  root.name = "fashionCharacter";

  // ── Rig pivots (action-ready) ────────────────────────────────────────────
  const hips = new THREE.Group();
  hips.name = "hips";
  hips.position.y = 0.95;
  root.add(hips);

  const spine = new THREE.Group();
  spine.name = "spine";
  hips.add(spine);

  const chest = new THREE.Group();
  chest.name = "chest";
  chest.position.y = 0.22;
  spine.add(chest);

  const neck = new THREE.Group();
  neck.name = "neck";
  neck.position.y = 0.38;
  chest.add(neck);

  const head = new THREE.Group();
  head.name = "head";
  head.position.y = 0.12;
  neck.add(head);

  const armL = new THREE.Group();
  armL.name = "armL";
  armL.position.set(-0.2, 0.32, 0);
  chest.add(armL);
  const armR = new THREE.Group();
  armR.name = "armR";
  armR.position.set(0.2, 0.32, 0);
  chest.add(armR);

  const legL = new THREE.Group();
  legL.name = "legL";
  legL.position.set(-0.1, 0, 0);
  hips.add(legL);
  const legR = new THREE.Group();
  legR.name = "legR";
  legR.position.set(0.1, 0, 0);
  hips.add(legR);

  const sm = skinMat(skinC);
  const cloth = clothMat(bodyCol, gloss, kind === "neon" ? 0.12 : 0);
  const clothAccent = clothMat(accent, gloss);
  const pantM = clothMat(pantsCol, kind === "redJacket");
  const shoeM = clothMat(shoesCol, true);
  const hm = hairMat(hairC);

  // ── HEAD (landmarks: eyes 0.45 HH from crown, adult human) ───────────────
  const skullW = isMale ? 0.17 : 0.155;
  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(skullW, 28, 24),
    sm,
  );
  // slight vertical squash for fashion proportion
  skull.scale.set(1, 1.08, 0.92);
  add(head, skull, 0, 0.02, 0);

  // jaw / chin
  const jaw = new THREE.Mesh(
    new THREE.SphereGeometry(skullW * 0.72, 16, 14),
    sm,
  );
  jaw.scale.set(0.95, 0.7, 0.85);
  add(head, jaw, 0, -0.06, 0.02);

  // ears
  for (const sx of [-1, 1] as const) {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 10, 10),
      sm,
    );
    ear.scale.set(0.55, 1.1, 0.7);
    add(head, ear, sx * (skullW + 0.01), 0.0, -0.01);
  }

  // brow ridge
  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(skullW * 1.35, 0.018, 0.04),
    sm,
  );
  add(head, brow, 0, 0.04, 0.1);

  // eyes — whites + iris + pupil + lid
  for (const sx of [-1, 1] as const) {
    const white = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f8, roughness: 0.35 }),
    );
    white.scale.set(1, 0.85, 0.7);
    add(head, white, sx * 0.048, 0.015, 0.125);

    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x3a5a78,
        roughness: 0.3,
        metalness: 0.1,
      }),
    );
    add(head, iris, sx * 0.048, 0.015, 0.145);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.4 }),
    );
    add(head, pupil, sx * 0.048, 0.015, 0.158);

    // upper lid
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.45),
      sm,
    );
    lid.rotation.x = 0.15;
    add(head, lid, sx * 0.048, 0.028, 0.12);
  }

  // nose
  const noseBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.05, 0.035),
    sm,
  );
  add(head, noseBridge, 0, -0.01, 0.14);
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), sm);
  add(head, noseTip, 0, -0.035, 0.155);

  // lips
  const upperLip = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.012, 0.022),
    new THREE.MeshStandardMaterial({
      color: 0xc06070,
      roughness: 0.45,
    }),
  );
  add(head, upperLip, 0, -0.065, 0.135);
  const lowerLip = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.014, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0xb05060,
      roughness: 0.45,
    }),
  );
  add(head, lowerLip, 0, -0.078, 0.132);

  // ── HAIR (bun / long / short by outfit) ──────────────────────────────────
  if (!isMale) {
    // crown cap
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(skullW * 1.05, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hm,
    );
    add(head, cap, 0, 0.05, -0.01);

    if (kind === "redJacket" || kind === "blackDress" || kind === "printDress") {
      // high bun (row 1 reference)
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 14), hm);
      add(head, bun, 0, 0.14, -0.04);
      const bun2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), hm);
      add(head, bun2, 0, 0.18, -0.05);
      // side strands
      for (const sx of [-1, 1] as const) {
        const strand = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.018, 0.12, 4, 8),
          hm,
        );
        strand.rotation.z = sx * 0.35;
        add(head, strand, sx * 0.1, -0.02, 0.02);
      }
    } else if (kind === "casualF") {
      // long straight
      const long = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.09, 0.55, 6, 12),
        hm,
      );
      add(head, long, 0, -0.2, -0.1);
    } else {
      const ponytail = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.04, 0.35, 5, 10),
        hm,
      );
      ponytail.rotation.x = 0.4;
      add(head, ponytail, 0, 0.0, -0.14);
    }
  } else {
    // short male crop
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(skullW * 1.02, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hm,
    );
    add(head, cap, 0, 0.05, -0.01);
    // fringe
    const fringe = new THREE.Mesh(
      new THREE.BoxGeometry(skullW * 1.4, 0.03, 0.05),
      hm,
    );
    add(head, fringe, 0, 0.06, 0.1);
  }

  // neck mesh
  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.1, 12),
    sm,
  );
  add(neck, neckMesh, 0, 0, 0);

  // ── TORSO / OUTFIT ───────────────────────────────────────────────────────
  const torsoW = isMale ? 0.2 : 0.17;
  const torsoH = isMale ? 0.38 : 0.36;

  if (kind === "redJacket" || kind === "neon") {
    // mini dress base
    const dress = new THREE.Mesh(
      new THREE.CylinderGeometry(torsoW * 0.85, torsoW * 1.05, torsoH * 0.7, 16),
      cloth,
    );
    add(chest, dress, 0, -0.05, 0);

    // glossy hoodie body
    const jacket = new THREE.Mesh(
      new THREE.CylinderGeometry(torsoW * 1.05, torsoW * 1.15, torsoH * 0.85, 18),
      cloth,
    );
    add(chest, jacket, 0, 0.05, 0.01);

    // hood (back)
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      cloth,
    );
    hood.scale.set(1.1, 0.85, 0.9);
    add(chest, hood, 0, 0.32, -0.06);

    // zipper strip
    const zip = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, torsoH * 0.75, 0.02),
      clothMat(0xc8c8d0, true),
    );
    add(chest, zip, 0, 0.02, 0.12);

    // waist belt of dress
    const belt = new THREE.Mesh(
      new THREE.TorusGeometry(torsoW * 0.95, 0.015, 8, 24),
      clothAccent,
    );
    belt.rotation.x = Math.PI / 2;
    add(chest, belt, 0, -0.18, 0);

    // skirt flare
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(torsoW * 0.9, torsoW * 1.25, 0.22, 16),
      cloth,
    );
    add(hips, skirt, 0, -0.12, 0);
  } else if (kind === "blackDress" || kind === "printDress") {
    const dress = new THREE.Mesh(
      new THREE.CylinderGeometry(torsoW * 0.9, torsoW * 1.2, torsoH + 0.15, 18),
      cloth,
    );
    add(chest, dress, 0, -0.08, 0);
    // sleeves puff (print dress has short sleeves)
    if (kind === "printDress") {
      for (const sx of [-1, 1] as const) {
        const sleeve = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 12, 10),
          clothAccent,
        );
        add(chest, sleeve, sx * 0.18, 0.28, 0);
      }
      // print pattern decals (simple panels)
      for (let i = 0; i < 4; i++) {
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(0.08, 0.12),
          new THREE.MeshStandardMaterial({
            color: i % 2 ? 0x2a2a32 : 0x8a8890,
            roughness: 0.6,
            side: THREE.DoubleSide,
          }),
        );
        const a = (i / 4) * Math.PI * 2;
        panel.position.set(Math.sin(a) * 0.14, -0.05, Math.cos(a) * 0.14);
        panel.lookAt(0, -0.05, 0);
        chest.add(panel);
      }
    } else {
      // deep neckline plate
      const neckline = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.12, 0.04),
        sm,
      );
      add(chest, neckline, 0, 0.22, 0.1);
    }
  } else {
    // casual shirt
    const shirt = new THREE.Mesh(
      new THREE.CylinderGeometry(torsoW * 1.0, torsoW * 1.05, torsoH, 16),
      cloth,
    );
    add(chest, shirt, 0, 0.0, 0);
    if (isMale) {
      // collar
      for (const sx of [-1, 1] as const) {
        const col = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.04, 0.06),
          cloth,
        );
        col.rotation.z = sx * -0.4;
        add(chest, col, sx * 0.05, 0.28, 0.08);
      }
      // button line
      for (let i = 0; i < 4; i++) {
        const btn = new THREE.Mesh(
          new THREE.SphereGeometry(0.01, 8, 8),
          clothMat(0xe8e8f0, true),
        );
        add(chest, btn, 0, 0.18 - i * 0.08, 0.115);
      }
    } else {
      // open jacket
      for (const sx of [-1, 1] as const) {
        const flap = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, torsoH * 0.9, 0.04),
          cloth,
        );
        add(chest, flap, sx * 0.1, 0.0, 0.1);
      }
    }
  }

  // shoulders
  for (const sx of [-1, 1] as const) {
    const sh = new THREE.Mesh(
      new THREE.SphereGeometry(isMale ? 0.07 : 0.06, 12, 10),
      kind === "redJacket" || kind === "neon" ? cloth : sm,
    );
    add(chest, sh, sx * (torsoW + 0.02), 0.3, 0);
  }

  // ── ARMS ─────────────────────────────────────────────────────────────────
  for (const [arm, side] of [
    [armL, -1],
    [armR, 1],
  ] as const) {
    const upper = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, isMale ? 0.28 : 0.26, 5, 10),
      kind === "blackDress" || kind === "printDress" ? sm : cloth,
    );
    add(arm, upper, 0, -0.16, 0);

    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.038, 0.24, 5, 10),
      sm,
    );
    add(arm, forearm, 0, -0.48, 0);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), sm);
    hand.scale.set(0.85, 1, 1.15);
    add(arm, hand, 0, -0.68, 0.01);

    // sleeve cuff for jacket
    if (kind === "redJacket" || kind === "neon" || kind === "casualF") {
      const cuff = new THREE.Mesh(
        new THREE.TorusGeometry(0.048, 0.012, 6, 14),
        clothAccent,
      );
      cuff.rotation.x = Math.PI / 2;
      add(arm, cuff, 0, -0.32, 0);
    }

    if (role === "bartender" && side === 1) {
      const shaker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.04, 0.14, 12),
        clothMat(0xc0c8d0, true),
      );
      add(arm, shaker, 0, -0.82, 0.04);
    }
    if (role === "dj") {
      // headphone cup
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12),
        clothMat(accent, true, 0.15),
      );
      cup.rotation.z = Math.PI / 2;
      // attach later on head via neck — put on head group instead
    }
    void side;
  }

  if (role === "dj") {
    for (const sx of [-1, 1] as const) {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.035, 12),
        clothMat(accent, true, 0.2),
      );
      cup.rotation.z = Math.PI / 2;
      add(head, cup, sx * 0.16, 0.0, 0);
    }
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.012, 6, 20),
      clothMat(0x1a1a22, false),
    );
    band.rotation.x = Math.PI / 2;
    add(head, band, 0, 0.05, 0);
  }

  // ── LEGS ─────────────────────────────────────────────────────────────────
  for (const leg of [legL, legR]) {
    if (kind === "redJacket" || kind === "neon") {
      // tights
      const thigh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.07, 0.32, 5, 10),
        pantM,
      );
      add(leg, thigh, 0, -0.22, 0);
      const shin = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.055, 0.34, 5, 10),
        pantM,
      );
      add(leg, shin, 0, -0.62, 0);
      // heel
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.22), shoeM);
      add(leg, foot, 0, -0.9, 0.04);
      const heel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 0.08, 8),
        shoeM,
      );
      add(leg, heel, 0, -0.94, -0.06);
    } else if (kind === "blackDress" || kind === "printDress") {
      // bare legs + heels
      const thigh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.07, 0.32, 5, 10),
        sm,
      );
      add(leg, thigh, 0, -0.22, 0);
      const shin = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.055, 0.34, 5, 10),
        sm,
      );
      add(leg, shin, 0, -0.62, 0);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.2), shoeM);
      add(leg, foot, 0, -0.9, 0.04);
      const heel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.018, 0.09, 8),
        shoeM,
      );
      add(leg, heel, 0, -0.95, -0.05);
    } else {
      // jeans
      const thigh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.08, 0.34, 5, 10),
        pantM,
      );
      add(leg, thigh, 0, -0.22, 0);
      const shin = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.07, 0.36, 5, 10),
        pantM,
      );
      add(leg, shin, 0, -0.64, 0);
      // flare bottom for jeans
      const flare = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.1, 0.12, 12),
        pantM,
      );
      add(leg, flare, 0, -0.85, 0);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.24), shoeM);
      add(leg, foot, 0, -0.95, 0.03);
    }
  }

  // ── Wings (gift tier) ────────────────────────────────────────────────────
  let wingL: THREE.Group | undefined;
  let wingR: THREE.Group | undefined;
  if (tier >= 2) {
    wingL = makeWing(bodyCol, -1, tier);
    wingR = makeWing(bodyCol, 1, tier);
    chest.add(wingL, wingR);
  }
  if (tier >= 3) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.015, 8, 24),
      neonLine(tier >= 4 ? 0xffaa00 : 0xffe9a8, 1.0),
    );
    halo.position.set(0, 0.22, 0);
    halo.rotation.x = Math.PI / 2.3;
    head.add(halo);
  }

  // floor ring (basic, no bloom wash)
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 28),
    new THREE.MeshBasicMaterial({
      color: bodyCol,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.02;
  root.add(glow);

  root.scale.setScalar(sc);
  enableShadows(root, true, true);

  // Ground feet: hips at 0.95 → legs go to ~0 → with heels y≈-0.95 relative to hips
  // Total character height check: head top ≈ hips 0.95 + spine + chest 0.22 + neck + head ≈ 1.7

  const state = { dancing: opts.dancing ?? true };
  const phase = Math.random() * Math.PI * 2;

  const runtime: FashionRuntime = {
    state,
    pivots: { hips, spine, chest, head, armL, armR, legL, legR, neck },
    sockets: {
      headTop: head,
      handL: armL,
      handR: armR,
      ground: root,
      back: chest,
    },
    labels: {
      factory: "fashion",
      outfit: kind,
      ref: "fashion-models-ref.png",
      gender: isMale ? "m" : "f",
    },
    setDancing(v: boolean) {
      state.dancing = v;
    },
    tick(_dt: number, t: number) {
      const ph = t + phase;
      if (state.dancing) {
        hips.position.y = 0.95 + Math.abs(Math.sin(ph * 5.2)) * 0.055;
        hips.rotation.y = Math.sin(ph * 0.85) * 0.28;
        spine.rotation.z = Math.sin(ph * 2.6) * 0.05;
        chest.rotation.x = Math.sin(ph * 2.2) * 0.04;
        const swing = Math.sin(ph * 5.8);
        armL.rotation.x = swing * 1.1;
        armR.rotation.x = -swing * 1.1;
        armL.rotation.z = 0.15 + Math.sin(ph * 3) * 0.08;
        armR.rotation.z = -0.15 - Math.sin(ph * 3) * 0.08;
        legL.rotation.x = -swing * 0.48;
        legR.rotation.x = swing * 0.48;
        head.rotation.y = Math.sin(ph * 0.7) * 0.12;
        if (wingL && wingR) {
          const flap = Math.sin(ph * (tier >= 4 ? 6 : 4.5)) * 0.3;
          wingL.rotation.y = flap;
          wingR.rotation.y = -flap;
        }
      }
      glow.scale.setScalar(1 + Math.sin(ph * 2.4) * 0.05);
    },
  };

  return markFactory(root, `fashion-${kind}-${role}`, "procedural", runtime);
}

function neonLine(color: number, intensity: number) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.35,
    roughness: 0.35,
  });
}

function makeWing(color: number, side: 1 | -1, tier: number) {
  const g = new THREE.Group();
  const baseCol = tier >= 4 ? 0xff6a00 : tier >= 3 ? 0xffe9a8 : color;
  const feathers = tier >= 4 ? 5 : 4;
  for (let i = 0; i < feathers; i++) {
    const t = i / (feathers - 1);
    const feather = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.035 + t * 0.025, 0.32 + t * 0.32, 4, 8),
      neonLine(baseCol, 0.85),
    );
    feather.position.set(side * (0.08 + t * 0.07), 0.02 + t * 0.08, -0.05 - t * 0.03);
    feather.rotation.z = side * (0.35 + t * 0.48);
    feather.rotation.x = -0.2;
    g.add(feather);
  }
  g.position.set(side * 0.18, 0.15, -0.08);
  return g;
}
