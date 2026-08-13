import * as THREE from "three";
import { markFactory, type SculptGroup, type SculptRuntime } from "./runtime";
import { enableShadows, HAIR, neon, OUTFIT, physical, SKIN, std } from "./materials";

export type HumanOpts = {
  style?: number;
  skin?: number;
  name?: string;
  dancing?: boolean;
  wingTier?: number;
  auraUntil?: number;
  role?: "dancer" | "dj" | "bartender" | "bouncer" | "guest";
  scale?: number;
  isAngelFlight?: boolean;
};

export type HumanRuntime = SculptRuntime & {
  setDancing: (v: boolean) => void;
  state: { dancing: boolean };
};

/**
 * Realistic Hierarchical Human & Cyber Angel Character Factory for QuanBar Nightclub.
 * Renders Angel Flight 2042 mecha cyber wings, metallic armor, smooth human proportions,
 * detailed facial features, and natural dancing animations.
 */
export function createHumanCharacter(opts: HumanOpts = {}): SculptGroup {
  const style = opts.style ?? 0;
  const skinI = opts.skin ?? 0;
  const role = opts.role ?? "dancer";
  const sc = opts.scale ?? 1;
  const isAngelFlight = opts.isAngelFlight || style === 2042 || (style % 6 === 0 && role === "dancer");

  const outfit = isAngelFlight ? 0xf8fafc : OUTFIT[style % OUTFIT.length]!;
  const skinC = SKIN[skinI % SKIN.length]!;
  const hairC = isAngelFlight ? 0xf8fafc : HAIR[style % HAIR.length]!;

  const now = Date.now();
  const active = (opts.auraUntil ?? 0) > now || isAngelFlight;
  const tier = isAngelFlight ? 4 : active ? opts.wingTier ?? 0 : 0;

  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.name = "hips";
  hips.position.y = 0.92;
  root.add(hips);

  const spine = new THREE.Group();
  spine.name = "spine";
  hips.add(spine);

  // ── Lower Body & Legs ───────────────────────────────────────────────────
  const legL = new THREE.Group();
  legL.name = "legL";
  legL.position.set(-0.11, 0, 0);

  const legR = new THREE.Group();
  legR.name = "legR";
  legR.position.set(0.11, 0, 0);
  hips.add(legL, legR);

  let pantCol = role === "bouncer" ? 0x181824 : role === "bartender" ? 0x12101b : 0x1a162b;
  if (style % 2 === 1 && role === "dancer") pantCol = outfit; // matching tights / pants

  const thighGeo = new THREE.CapsuleGeometry(0.088, 0.35, 8, 16);
  const shinGeo = new THREE.CapsuleGeometry(0.072, 0.37, 8, 16);

  for (const leg of [legL, legR]) {
    const thigh = new THREE.Mesh(thighGeo, std(pantCol, { metal: 0.1, rough: 0.55 }));
    thigh.position.set(0, -0.22, 0);

    const shin = new THREE.Mesh(shinGeo, std(pantCol, { metal: 0.1, rough: 0.55 }));
    shin.position.set(0, -0.64, 0);

    // Realistic High Heel / Boots / Sneakers
    const bootColor = role === "dancer" ? outfit : 0x111118;
    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.12, 0.28),
      physical(bootColor, {
        metal: 0.5,
        rough: 0.25,
        emissive: role === "dancer" ? outfit : 0x000000,
        emInt: role === "dancer" ? 0.12 : 0,
        clearcoat: 0.4,
        envMapIntensity: 1.0,
      }),
    );
    boot.position.set(0, -0.91, 0.04);

    leg.add(thigh, shin, boot);
  }

  // ── Torso & Clothing ────────────────────────────────────────────────────
  let bodyCol = outfit;
  if (role === "bouncer") bodyCol = 0x1c1c28;
  if (role === "bartender") bodyCol = 0x221a2c;
  if (role === "dj") bodyCol = 0x1f182c;

  // Smooth realistic torso contour
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(role === "bouncer" ? 0.26 : 0.205, 0.45, 8, 18),
    physical(bodyCol, {
      emissive: role === "dancer" ? outfit : bodyCol,
      emInt: role === "dancer" ? 0.15 : 0.04,
      metal: 0.2,
      rough: 0.45,
      clearcoat: 0.3,
      envMapIntensity: 0.95,
    }),
  );
  torso.position.y = 0.28;
  spine.add(torso);

  // Metallic Belt & Buckle
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(role === "bouncer" ? 0.27 : 0.21, role === "bouncer" ? 0.27 : 0.21, 0.05, 24),
    physical(0x111115, { metal: 0.8, rough: 0.2 }),
  );
  belt.position.y = 0.04;
  spine.add(belt);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.04),
    physical(0xd4af37, { metal: 0.9, rough: 0.1, emissive: 0xfacc15, emInt: 0.2 }),
  );
  buckle.position.set(0, 0.04, 0.21);
  spine.add(buckle);

  // Fashion Role Details (Jacket pads, Vest, Headphones, Bowtie)
  if (role === "dancer") {
    for (const sx of [-1, 1] as const) {
      const pad = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 12, 12),
        std(outfit, { metal: 0.4, rough: 0.3, emissive: outfit, emInt: 0.2 }),
      );
      pad.position.set(sx * 0.22, 0.48, 0);
      spine.add(pad);
    }
  }

  if (role === "bartender") {
    const vest = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.42, 0.23),
      physical(0x150d1e, { metal: 0.2, rough: 0.5 }),
    );
    vest.position.set(0, 0.28, 0.05);
    spine.add(vest);

    const bow = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.04, 0.04),
      std(0xf0f0f5, { rough: 0.4 }),
    );
    bow.position.set(0, 0.48, 0.14);
    spine.add(bow);
  }

  if (role === "dj") {
    // DJ Headphones around neck
    for (const sx of [-1, 1] as const) {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16),
        physical(0x1a1a24, { metal: 0.7, rough: 0.2, emissive: outfit, emInt: 0.3 }),
      );
      cup.rotation.z = Math.PI / 2;
      cup.position.set(sx * 0.18, 0.72, 0);
      spine.add(cup);
    }
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.016, 8, 24),
      std(0x1a1a24, { metal: 0.5, rough: 0.3 }),
    );
    band.position.set(0, 0.72, 0);
    band.rotation.x = Math.PI / 2;
    spine.add(band);
  }

  // ── Head & Detailed Face Landmarks ──────────────────────────────────────
  const head = new THREE.Group();
  head.name = "head";
  head.position.y = 0.75;
  spine.add(head);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.085, 0.12, 16),
    std(skinC, { metal: 0.02, rough: 0.65 }),
  );
  neck.position.y = -0.07;
  head.add(neck);

  // Skull
  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.155, 28, 28),
    std(skinC, { metal: 0.02, rough: 0.68, envMapIntensity: 0.4 }),
  );
  head.add(skull);

  // Nose with Bridge
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.022, 0.06, 12),
    std(skinC, { metal: 0.02, rough: 0.68 }),
  );
  nose.position.set(0, -0.01, 0.155);
  nose.rotation.x = Math.PI / 10;
  head.add(nose);

  // Realistic Eyes (Sclera + Iris + Pupil)
  for (const sx of [-1, 1] as const) {
    const eyeW = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 12, 12),
      std(0xf8fafc, { metal: 0.05, rough: 0.2 }),
    );
    eyeW.position.set(sx * 0.052, 0.025, 0.135);

    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 10, 10),
      std(style % 2 === 0 ? 0x2563eb : 0x78350f, { metal: 0.3, rough: 0.2 }),
    );
    iris.position.set(sx * 0.052, 0.025, 0.155);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 8, 8),
      std(0x0a0a0f, { metal: 0.1, rough: 0.1 }),
    );
    pupil.position.set(sx * 0.052, 0.025, 0.165);

    // Eyebrows
    const eyebrow = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.008, 0.015),
      std(hairC, { rough: 0.9 }),
    );
    eyebrow.position.set(sx * 0.052, 0.065, 0.145);
    eyebrow.rotation.z = -sx * 0.08;

    head.add(eyeW, iris, pupil, eyebrow);
  }

  // Soft Realistic Lips
  const lipColor = style % 2 === 0 ? 0xec4899 : 0x9f1239;
  const mouth = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.012, 0.045, 6, 12),
    std(lipColor, { rough: 0.45 }),
  );
  mouth.rotation.z = Math.PI / 2;
  mouth.position.set(0, -0.05, 0.148);
  head.add(mouth);

  // 3D Ears
  for (const sx of [-1, 1] as const) {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 10, 10),
      std(skinC, { rough: 0.68 }),
    );
    ear.scale.set(0.4, 0.9, 0.6);
    ear.position.set(sx * 0.155, 0.01, 0.02);
    head.add(ear);
  }

  // ── 3D Anime Hairstyles ──────────────────────────────────────────────────
  const hairMat = std(hairC, { metal: 0.1, rough: 0.7, clearcoat: 0.3 });
  const mode = style % 5;

  if (mode === 0) {
    // Anime Twin-Tails with Hair Ribbons
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.165, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat,
    );
    top.position.set(0, 0.07, -0.01);
    head.add(top);

    for (const sx of [-1, 1] as const) {
      const pigtail = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.45, 8, 16), hairMat);
      pigtail.position.set(sx * 0.16, -0.12, -0.06);
      pigtail.rotation.z = sx * 0.25;

      const ribbon = new THREE.Mesh(
        new THREE.TorusGeometry(0.045, 0.012, 8, 16),
        std(outfit, { emissive: outfit, emInt: 0.3 }),
      );
      ribbon.position.set(sx * 0.15, 0.06, -0.05);
      head.add(pigtail, ribbon);
    }
  } else if (mode === 1) {
    // K-Pop Idol Undercut & Layered Bangs
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.08, 0.23),
      hairMat,
    );
    top.position.set(0, 0.15, 0.02);

    const fringe = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.05, 0.08),
      hairMat,
    );
    fringe.position.set(0, 0.11, 0.12);
    fringe.rotation.x = 0.2;
    head.add(top, fringe);
  } else if (mode === 2) {
    // Silver White Long Anime Hair (with side bangs)
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.168, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat,
    );
    top.position.set(0, 0.07, -0.02);

    for (const sx of [-1, 1] as const) {
      const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.52, 8, 16), hairMat);
      strand.position.set(sx * 0.12, -0.22, 0.03);
      head.add(strand);
    }
    head.add(top);
  } else if (mode === 3) {
    // High Anime Ponytail
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat,
    );
    top.position.y = 0.07;
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.45, 8, 16), hairMat);
    tail.position.set(0, 0.06, -0.18);
    tail.rotation.x = -Math.PI / 3.8;
    head.add(top, tail);
  } else {
    // Anime Princess Cut (Hime Cut)
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.165, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat,
    );
    top.position.y = 0.07;

    for (const sx of [-1, 1] as const) {
      const himeBang = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.06), hairMat);
      himeBang.position.set(sx * 0.12, -0.08, 0.11);
      head.add(himeBang);
    }
    head.add(top);
  }

  // ── Arms & Hands ────────────────────────────────────────────────────────
  const armL = new THREE.Group();
  armL.name = "armL";
  armL.position.set(-0.29, 0.44, 0);

  const armR = new THREE.Group();
  armR.name = "armR";
  armR.position.set(0.29, 0.44, 0);
  spine.add(armL, armR);

  const sleeveMat = role === "bartender" ? std(0xf0f0f5, { rough: 0.55 }) : std(bodyCol, { metal: 0.15, rough: 0.5 });

  for (const arm of [armL, armR]) {
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.31, 6, 12), sleeveMat);
    upper.position.set(0, -0.17, 0);

    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.048, 0.29, 6, 12),
      std(skinC, { rough: 0.68 }),
    );
    forearm.position.set(0, -0.5, 0);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 12, 12),
      std(skinC, { rough: 0.68 }),
    );
    hand.scale.set(0.8, 1.1, 0.6);
    hand.position.set(0, -0.7, 0);

    arm.add(upper, forearm, hand);
  }

  if (role === "bartender") {
    const shaker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.048, 0.17, 16),
      physical(0xc0c8d0, { metal: 0.95, rough: 0.1, envMapIntensity: 1.4 }),
    );
    shaker.position.set(0, -0.82, 0.06);
    armR.add(shaker);
  }

  // Soft Floor Aura Ring
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(tier >= 2 ? 0.55 : 0.42, 32),
    new THREE.MeshBasicMaterial({
      color: tier >= 4 ? 0xff6a00 : outfit,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.025;
  root.add(glow);

  let wingL: THREE.Group | undefined;
  let wingR: THREE.Group | undefined;
  if (isAngelFlight) {
    wingL = makeAngelFlightWings(-1);
    wingR = makeAngelFlightWings(1);
    spine.add(wingL, wingR);
  } else if (tier >= 2) {
    wingL = makeWing(outfit, -1, tier);
    wingR = makeWing(outfit, 1, tier);
    spine.add(wingL, wingR);
  }

  if (tier >= 3 || isAngelFlight) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.02, 8, 28),
      neon(0xffd700, 1.4),
    );
    halo.position.set(0, 0.98, 0);
    halo.rotation.x = Math.PI / 2.4;
    spine.add(halo);
  }

  root.scale.setScalar(sc);
  enableShadows(root, true, true);

  const state = { dancing: opts.dancing ?? true };
  const phase = Math.random() * Math.PI * 2;

  const runtime: HumanRuntime = {
    state,
    pivots: { hips, spine, head, armL, armR, legL, legR },
    sockets: { headTop: head, handL: armL, handR: armR, ground: root },
    setDancing(v: boolean) {
      state.dancing = v;
    },
    tick(_dt: number, t: number) {
      const ph = t + phase;
      if (state.dancing) {
        const hop = Math.max(0, Math.sin(ph * 5.1));
        const bounce = hop * hop;
        const shift = Math.sin(ph * 1.4);
        hips.position.y = 0.92 + bounce * 0.05;
        hips.rotation.y = shift * 0.18;
        hips.rotation.z = shift * 0.05;
        spine.rotation.z = Math.sin(ph * 2.1 + 0.3) * 0.05;
        spine.rotation.x = -bounce * 0.04;
        head.rotation.y = Math.sin(ph * 0.85) * 0.1;
        head.rotation.x = bounce * 0.04;

        const arm = Math.sin(ph * 2.2 + 0.4);
        armL.rotation.x = arm * 0.55 + bounce * 0.15;
        armL.rotation.z = 0.25 + Math.sin(ph * 1.6) * 0.18;
        armR.rotation.x = -arm * 0.5 + bounce * 0.12;
        armR.rotation.z = -0.28 - Math.sin(ph * 1.6 + 0.7) * 0.16;
        legL.rotation.x = -shift * 0.22 - (1 - bounce) * 0.06;
        legR.rotation.x = shift * 0.22 - (1 - bounce) * 0.06;

        if (wingL && wingR) {
          const flap = Math.sin(ph * (isAngelFlight ? 6.5 : tier >= 4 ? 6 : 4.5)) * 0.32;
          wingL.rotation.y = flap;
          wingR.rotation.y = -flap;
        }
      }
      glow.scale.setScalar(1 + Math.sin(ph * 2.5) * 0.05);
    },
  };

  return markFactory(root, `human-${role}`, "procedural", runtime);
}

function makeWing(color: number, side: 1 | -1, tier: number) {
  const g = new THREE.Group();
  const baseCol = tier >= 4 ? 0xff6a00 : tier >= 3 ? 0xffe9a8 : color;
  const feathers = tier >= 4 ? 5 : 4;
  for (let i = 0; i < feathers; i++) {
    const t = i / (feathers - 1);
    const feather = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04 + t * 0.03, 0.35 + t * 0.35, 4, 8),
      neon(baseCol, 0.9),
    );
    feather.position.set(side * (0.1 + t * 0.08), 0.05 + t * 0.1, -0.06 - t * 0.04);
    feather.rotation.z = side * (0.35 + t * 0.5);
    feather.rotation.x = -0.2;
    g.add(feather);
  }
  g.position.set(side * 0.2, 0.35, -0.1);
  return g;
}

function makeAngelFlightWings(side: 1 | -1) {
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

  g.position.set(side * 0.22, 0.38, -0.12);
  return g;
}
