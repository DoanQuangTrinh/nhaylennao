import * as THREE from "three";
import { markFactory, type SculptGroup } from "./runtime";
import { enableShadows, neon, physical, std } from "./materials";

/** Bar counter — marble top, velvet face, chrome rail, bottles */
export function createBarCounter(): SculptGroup {
  const root = new THREE.Group();
  root.name = "barCounter";

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(14, 1.15, 1.1),
    std(0x5a3a28, { metal: 0.08, rough: 0.78, envMapIntensity: 0.5 }),
  );
  base.position.y = 0.58;
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.85, 0.14),
    physical(0x4a1835, {
      metal: 0.12,
      rough: 0.55,
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.7,
    }),
  );
  front.position.set(0, 0.52, 0.48);
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(14.4, 0.09, 1.3),
    physical(0x2a2838, {
      metal: 0.7,
      rough: 0.15,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.2,
    }),
  );
  top.position.y = 1.2;
  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 13.6, 16),
    physical(0xd0d4e0, {
      metal: 0.95,
      rough: 0.15,
      clearcoat: 0.6,
      envMapIntensity: 1.3,
    }),
  );
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, 0.98, 0.52);
  const underLed = new THREE.Mesh(
    new THREE.BoxGeometry(13.5, 0.04, 0.06),
    neon(0x22d3ee, 0.75),
  );
  underLed.position.set(0, 0.18, 0.55);
  root.add(base, front, top, rail, underLed);

  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.08, 0.42),
    std(0x3a2818, { metal: 0.1, rough: 0.7 }),
  );
  shelf.position.set(0, 1.9, -0.9);
  root.add(shelf);

  const cols = [0x9b2a2a, 0x2a5a3a, 0xd4b06a, 0x3a5a8a, 0x6a2a4a, 0xe0d0a8];
  for (let i = 0; i < 14; i++) {
    const h = 0.28 + (i % 4) * 0.04;
    const col = cols[i % cols.length]!;
    const b = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.048, h, 12),
      physical(col, {
        metal: 0.12,
        rough: 0.22,
        clearcoat: 0.7,
        clearcoatRoughness: 0.12,
        emissive: col,
        emInt: 0.06,
        envMapIntensity: 1.0,
        opacity: 0.95,
      }),
    );
    b.position.set(-4 + i * 0.62, 1.9 + h / 2 + 0.04, -0.9);
    root.add(b);
  }

  enableShadows(root);
  return markFactory(root, "bar-counter", "procedural", {
    sockets: { servePoint: top },
    labels: { role: "bar" },
  });
}

/** Neon BAR letters — controlled emissive for gentle bloom */
export function createNeonBarSign(): SculptGroup {
  const root = new THREE.Group();
  root.name = "neonBarSign";
  const add = (w: number, h: number, x: number, y: number, c: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), neon(c, 1.0));
    m.position.set(x, y, 0);
    m.castShadow = false;
    root.add(m);
  };
  add(0.14, 0.52, -1.15, 0, 0xff2d95);
  add(0.42, 0.14, -0.88, 0.21, 0xff2d95);
  add(0.42, 0.14, -0.88, 0, 0xff2d95);
  add(0.42, 0.14, -0.88, -0.21, 0xff2d95);
  add(0.14, 0.52, -0.28, 0, 0x22d3ee);
  add(0.14, 0.52, 0.18, 0, 0x22d3ee);
  add(0.46, 0.14, -0.05, 0.21, 0x22d3ee);
  add(0.14, 0.52, 0.6, 0, 0xff2d95);
  add(0.42, 0.14, 0.88, 0.21, 0xff2d95);
  add(0.42, 0.14, 0.88, 0, 0xff2d95);

  const light = new THREE.PointLight(0xff2d95, 10, 12, 1.5);
  light.position.set(0, 0, 0.9);
  root.add(light);

  return markFactory(root, "neon-bar-sign", "procedural", {
    tick(_dt, t) {
      light.intensity = 9 + Math.sin(t * 3.2) * 2;
    },
  });
}

/** Multi-deck DJ booth */
export function createDjBooth(): SculptGroup {
  const root = new THREE.Group();
  root.name = "djBooth";

  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 1.05, 1.1),
    physical(0x12101a, { metal: 0.4, rough: 0.45, clearcoat: 0.25, envMapIntensity: 0.8 }),
  );
  desk.position.y = 0.9;
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(3.15, 0.06, 1.18),
    physical(0xc8ccd8, { metal: 0.85, rough: 0.18, clearcoat: 0.5, envMapIntensity: 1.2 }),
  );
  top.position.y = 1.45;
  root.add(desk, top);

  const platters: THREE.Mesh[] = [];
  for (const dx of [-0.85, 0.85]) {
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.08, 0.72),
      physical(0x0a0a12, { metal: 0.45, rough: 0.4 }),
    );
    deck.position.set(dx, 1.52, 0.05);
    const platter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.03, 32),
      physical(0x1a1a28, {
        metal: 0.65,
        rough: 0.25,
        emissive: 0x22d3ee,
        emInt: 0.2,
        envMapIntensity: 1.0,
      }),
    );
    platter.position.set(dx, 1.58, 0.12);
    platters.push(platter);
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.02, 0.04),
      neon(dx < 0 ? 0x22d3ee : 0xf472b6, 0.85),
    );
    led.position.set(dx, 1.56, -0.22);
    root.add(deck, platter, led);
  }

  const mixer = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.06, 0.65),
    physical(0x101018, {
      metal: 0.35,
      rough: 0.4,
      emissive: 0xc084fc,
      emInt: 0.12,
    }),
  );
  mixer.position.set(0, 1.52, 0.05);
  root.add(mixer);

  for (const sx of [-1, 1] as const) {
    const sp = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.6, 0.55),
      std(0x101018, { metal: 0.2, rough: 0.75 }),
    );
    sp.position.set(sx * 2.0, 0.85, -0.6);
    const cone = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 24),
      physical(0x555568, { metal: 0.5, rough: 0.4, envMapIntensity: 0.9 }),
    );
    cone.position.set(sx * 2.0, 1.1, -0.3);
    root.add(sp, cone);
  }

  enableShadows(root);
  return markFactory(root, "dj-booth", "procedural", {
    sockets: { mixPosition: top },
    tick(_dt, t) {
      for (const p of platters) p.rotation.y = t * 2.5;
    },
  });
}

export function createSpeakerStack(): SculptGroup {
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.9, 0.65),
    std(0x101018, { metal: 0.15, rough: 0.8 }),
  );
  body.position.y = 0.95;
  const woofer = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 28),
    physical(0x333348, { metal: 0.35, rough: 0.5 }),
  );
  woofer.position.set(0, 0.7, 0.34);
  const tweeter = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 20),
    physical(0x555568, { metal: 0.45, rough: 0.4 }),
  );
  tweeter.position.set(0, 1.35, 0.34);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), neon(0x22d3ee, 0.8));
  led.position.set(0, 1.75, 0.34);
  root.add(body, woofer, tweeter, led);
  enableShadows(root);
  return markFactory(root, "speaker-stack", "procedural", {
    tick(_dt, t) {
      const s = 1 + Math.sin(t * 8) * 0.03;
      woofer.scale.setScalar(s);
    },
  });
}

export function createHighTop(): SculptGroup {
  const root = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.06, 24),
    physical(0x5a3a28, {
      metal: 0.12,
      rough: 0.4,
      clearcoat: 0.55,
      clearcoatRoughness: 0.25,
      envMapIntensity: 0.9,
    }),
  );
  top.position.y = 1.05;
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 1.02, 12),
    physical(0xc0c4d0, { metal: 0.9, rough: 0.22, envMapIntensity: 1.1 }),
  );
  leg.position.y = 0.51;
  root.add(top, leg);
  enableShadows(root);
  return markFactory(root, "high-top", "procedural", {});
}

export function createEntranceDoors(): SculptGroup {
  const root = new THREE.Group();
  for (const sz of [-0.7, 0.7]) {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.6, 1.15),
      physical(0x1a1020, { metal: 0.3, rough: 0.45, envMapIntensity: 0.7 }),
    );
    door.position.set(0, 1.35, sz);
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 1.4),
      physical(0x88aacc, {
        metal: 0.05,
        rough: 0.08,
        opacity: 0.4,
        clearcoat: 0.8,
        envMapIntensity: 1.2,
      }),
    );
    glass.position.set(-0.07, 1.6, sz);
    glass.rotation.y = -Math.PI / 2;
    root.add(door, glass);
  }
  const exit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 1.0), neon(0x22ff88, 0.9));
  exit.position.set(-0.1, 3.0, 0);
  root.add(exit);
  enableShadows(root, true, true);
  return markFactory(root, "entrance-doors", "procedural", {});
}
