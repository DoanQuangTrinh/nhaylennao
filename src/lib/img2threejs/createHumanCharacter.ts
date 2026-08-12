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
};

export type HumanRuntime = SculptRuntime & {
  setDancing: (v: boolean) => void;
  state: { dancing: boolean };
};

/**
 * Hierarchical fashion human — SOLID opaque colors so avatars stay readable under club lights/bloom.
 */
export function createHumanCharacter(opts: HumanOpts = {}): SculptGroup {
  const style = opts.style ?? 0;
  const skinI = opts.skin ?? 0;
  const role = opts.role ?? "dancer";
  const sc = opts.scale ?? 1;
  const outfit = OUTFIT[style % OUTFIT.length]!;
  const skinC = SKIN[skinI % SKIN.length]!;
  const hairC = HAIR[style % HAIR.length]!;
  const now = Date.now();
  const active = (opts.auraUntil ?? 0) > now;
  const tier = active ? opts.wingTier ?? 0 : 0;

  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.name = "hips";
  hips.position.y = 0.92;
  root.add(hips);

  const spine = new THREE.Group();
  spine.name = "spine";
  hips.add(spine);

  const legL = new THREE.Group();
  legL.name = "legL";
  legL.position.set(-0.12, 0, 0);
  const legR = new THREE.Group();
  legR.name = "legR";
  legR.position.set(0.12, 0, 0);
  hips.add(legL, legR);

  const pantCol = role === "bouncer" ? 0x1a1a28 : 0x1e1830;
  const thighGeo = new THREE.CapsuleGeometry(0.09, 0.34, 5, 10);
  const shinGeo = new THREE.CapsuleGeometry(0.075, 0.36, 5, 10);
  for (const leg of [legL, legR]) {
    const thigh = new THREE.Mesh(thighGeo, std(pantCol, { metal: 0.15, rough: 0.6 }));
    thigh.position.set(0, -0.22, 0);
    const shin = new THREE.Mesh(shinGeo, std(pantCol, { metal: 0.15, rough: 0.6 }));
    shin.position.set(0, -0.64, 0);
    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.13, 0.3),
      physical(role === "dancer" ? outfit : 0x15151e, {
        metal: 0.4,
        rough: 0.35,
        // tiny accent only — not bloom fuel
        emissive: role === "dancer" ? outfit : 0x000000,
        emInt: role === "dancer" ? 0.12 : 0,
        clearcoat: 0.25,
        envMapIntensity: 0.8,
      }),
    );
    boot.position.set(0, -0.92, 0.04);
    leg.add(thigh, shin, boot);
  }

  let bodyCol = outfit;
  if (role === "bouncer") bodyCol = 0x222230;
  if (role === "bartender") bodyCol = 0x241828;
  if (role === "dj") bodyCol = 0x201828;

  // Solid body — low emissive so faces/outfits stay visible
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(role === "bouncer" ? 0.25 : 0.21, 0.44, 6, 14),
    physical(bodyCol, {
      emissive: role === "dancer" ? outfit : bodyCol,
      emInt: role === "dancer" ? 0.18 : 0.05,
      metal: 0.25,
      rough: 0.42,
      clearcoat: 0.2,
      envMapIntensity: 0.9,
    }),
  );
  torso.position.y = 0.28;
  spine.add(torso);

  // Shoulder pads / jacket collar for silhouette
  if (role === "dancer") {
    for (const sx of [-1, 1] as const) {
      const pad = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 10, 10),
        std(outfit, { metal: 0.3, rough: 0.4, emissive: outfit, emInt: 0.15 }),
      );
      pad.position.set(sx * 0.22, 0.48, 0);
      spine.add(pad);
    }
  }

  if (role === "bartender") {
    const vest = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.42, 0.22),
      physical(0x120a18, { metal: 0.2, rough: 0.5, emissive: outfit, emInt: 0.08 }),
    );
    vest.position.set(0, 0.28, 0.05);
    spine.add(vest);
    const bow = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.04, 0.04),
      std(0xf0f0f5, { rough: 0.5 }),
    );
    bow.position.set(0, 0.48, 0.14);
    spine.add(bow);
  }

  if (role === "dj") {
    for (const sx of [-1, 1] as const) {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12),
        physical(0x1a1a22, { metal: 0.55, rough: 0.35, emissive: outfit, emInt: 0.15 }),
      );
      cup.rotation.z = Math.PI / 2;
      cup.position.set(sx * 0.18, 0.74, 0);
      spine.add(cup);
    }
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.015, 6, 16),
      std(0x1a1a22, { metal: 0.4, rough: 0.4 }),
    );
    band.position.set(0, 0.74, 0);
    band.rotation.x = Math.PI / 2;
    spine.add(band);
  }

  if (role === "bouncer") {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      std(0x111118, { metal: 0.5, rough: 0.4 }),
    );
    ear.position.set(0.16, 0.72, 0);
    spine.add(ear);
  }

  const head = new THREE.Group();
  head.name = "head";
  head.position.y = 0.74;
  spine.add(head);

  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 22, 22),
    std(skinC, { metal: 0.02, rough: 0.7, envMapIntensity: 0.35 }),
  );
  head.add(skull);

  // Nose for readable face
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 8, 8),
    std(skinC, { metal: 0.02, rough: 0.7 }),
  );
  nose.position.set(0, -0.01, 0.15);
  head.add(nose);

  for (const sx of [-1, 1] as const) {
    const eyeW = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 10, 10),
      std(0xf8fafc, { metal: 0.05, rough: 0.35 }),
    );
    eyeW.position.set(sx * 0.055, 0.025, 0.135);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 8, 8),
      std(0x0f172a, { metal: 0.2, rough: 0.4 }),
    );
    pupil.position.set(sx * 0.055, 0.025, 0.158);
    head.add(eyeW, pupil);
  }

  // Mouth
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.012, 0.02),
    std(0xa05050, { rough: 0.6 }),
  );
  mouth.position.set(0, -0.05, 0.145);
  head.add(mouth);

  const hairMat = std(hairC, { metal: 0.05, rough: 0.85 });
  const mode = style % 5;
  if (mode === 0) {
    const bob = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat,
    );
    bob.position.set(0, 0.08, -0.01);
    head.add(bob);
  } else if (mode === 1) {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairMat,
    );
    cap.position.y = 0.06;
    head.add(cap);
  } else if (mode === 2) {
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.165, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat,
    );
    top.position.set(0, 0.08, -0.02);
    const long = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.48, 5, 10), hairMat);
    long.position.set(0, -0.18, -0.12);
    head.add(top, long);
  } else if (mode === 3) {
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat,
    );
    top.position.y = 0.08;
    // side ponytail
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.35, 4, 8), hairMat);
    tail.position.set(0.12, -0.1, -0.08);
    tail.rotation.z = -0.4;
    head.add(top, tail);
  } else {
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat,
    );
    top.position.y = 0.08;
    head.add(top);
  }

  const armL = new THREE.Group();
  armL.name = "armL";
  armL.position.set(-0.3, 0.44, 0);
  const armR = new THREE.Group();
  armR.name = "armR";
  armR.position.set(0.3, 0.44, 0);
  spine.add(armL, armR);

  const sleeveMat =
    role === "bartender"
      ? std(0xf0f0f5, { rough: 0.65 })
      : std(bodyCol, { metal: 0.2, rough: 0.45 });
  for (const arm of [armL, armR]) {
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.3, 5, 10), sleeveMat);
    upper.position.set(0, -0.17, 0);
    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.05, 0.28, 5, 10),
      std(skinC, { rough: 0.7 }),
    );
    forearm.position.set(0, -0.5, 0);
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 10, 10),
      std(skinC, { rough: 0.7 }),
    );
    hand.position.set(0, -0.7, 0);
    arm.add(upper, forearm, hand);
  }

  if (role === "bartender") {
    const shaker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.048, 0.17, 12),
      physical(0xc0c8d0, { metal: 0.9, rough: 0.15, envMapIntensity: 1.3 }),
    );
    shaker.position.set(0, -0.85, 0.06);
    armR.add(shaker);
  }

  // Soft floor ring — MeshBasic low opacity so it does NOT trigger bloom washout
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(tier >= 2 ? 0.52 : 0.4, 32),
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
  if (tier >= 2) {
    wingL = makeWing(outfit, -1, tier);
    wingR = makeWing(outfit, 1, tier);
    spine.add(wingL, wingR);
  }
  if (tier >= 3) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.018, 8, 24),
      neon(tier >= 4 ? 0xffaa00 : 0xffe9a8, 1.1),
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
        hips.position.y = 0.92 + Math.abs(Math.sin(ph * 5.5)) * 0.06;
        hips.rotation.y = Math.sin(ph * 0.9) * 0.25;
        spine.rotation.z = Math.sin(ph * 2.8) * 0.04;
        const swing = Math.sin(ph * 6.0);
        armL.rotation.x = swing * 1.05;
        armR.rotation.x = -swing * 1.05;
        legL.rotation.x = -swing * 0.45;
        legR.rotation.x = swing * 0.45;
        if (wingL && wingR) {
          const flap = Math.sin(ph * (tier >= 4 ? 6 : 4.5)) * 0.28;
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
