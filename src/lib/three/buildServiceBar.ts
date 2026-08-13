import * as THREE from "three";
import { BAR_STAFF_SLOTS, BAR_STATION } from "@/lib/config/stage-slots";

function pbr(
  color: number,
  opts: { metal?: number; rough?: number; emissive?: number; em?: number } = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metal ?? 0.18,
    roughness: opts.rough ?? 0.48,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.em ?? 0,
  });
}

/**
 * Full service bar: guest counter + raised staff deck + 4 empty stations.
 * Stations are marked so future bartender GLBs can stand on them.
 */
export function buildServiceBar(): THREE.Group {
  const root = new THREE.Group();
  root.name = "service-bar";

  const wood = pbr(0x2a1c14, { metal: 0.08, rough: 0.72 });
  const walnut = pbr(0x3a2618, { metal: 0.1, rough: 0.62 });
  const marble = pbr(0x1a1816, { metal: 0.55, rough: 0.18 });
  const brass = pbr(0xb8894a, { metal: 0.88, rough: 0.28, emissive: 0x5a3a18, em: 0.12 });
  const chrome = pbr(0xc8cdd6, { metal: 0.94, rough: 0.14 });
  const pad = pbr(0x1c1410, { metal: 0.35, rough: 0.4, emissive: 0x6a3a18, em: 0.16 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x1a1210,
    metalness: 0.15,
    roughness: 0.08,
    transparent: true,
    opacity: 0.38,
  });

  const width = 12.4;
  const cx = BAR_STATION.centerX;
  const frontZ = BAR_STATION.frontZ;
  const staffZ = BAR_STATION.staffZ;
  const staffY = BAR_STATION.staffY;

  // Raised staff work deck (behind counter)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width - 0.4, staffY, 1.55), walnut);
  deck.position.set(cx, staffY / 2, staffZ + 0.12);
  deck.receiveShadow = true;
  deck.castShadow = true;
  root.add(deck);

  const deckLip = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.04, 1.62), brass);
  deckLip.position.set(cx, staffY + 0.02, staffZ + 0.12);
  root.add(deckLip);

  // Guest-facing counter body
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, 0.78, 0.62), wood);
  body.position.set(cx, 0.39, frontZ - 0.06);
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  const face = new THREE.Mesh(new THREE.BoxGeometry(width - 0.08, 0.52, 0.05), pbr(0x241610, { metal: 0.22, rough: 0.45 }));
  face.position.set(cx, 0.34, frontZ + 0.26);
  root.add(face);

  const top = new THREE.Mesh(new THREE.BoxGeometry(width + 0.22, 0.07, 0.72), marble);
  top.position.set(cx, BAR_STATION.counterTopY, frontZ - 0.04);
  top.castShadow = true;
  top.receiveShadow = true;
  root.add(top);

  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, width - 0.5, 18), chrome);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(cx, 0.7, frontZ + 0.24);
  root.add(rail);

  const underLed = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.6, 0.03, 0.05),
    pbr(0xc48a42, { metal: 0.2, rough: 0.4, emissive: 0xc48a42, em: 0.7 }),
  );
  underLed.position.set(cx, 0.14, frontZ + 0.36);
  root.add(underLed);

  // Back bar / bottle wall
  const back = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, 2.15, 0.22), wood);
  back.position.set(cx, 1.2, staffZ - 0.62);
  back.castShadow = true;
  root.add(back);

  for (const hy of [1.55, 2.05]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.85, 0.05, 0.28), walnut);
    shelf.position.set(cx, hy, staffZ - 0.48);
    root.add(shelf);
  }

  const mirror = new THREE.Mesh(new THREE.BoxGeometry(width - 1.1, 0.85, 0.03), glass);
  mirror.position.set(cx, 1.82, staffZ - 0.52);
  root.add(mirror);

  const bottleCols = [0x7a1f1f, 0x1f4a2a, 0xc4a056, 0x2a3a6a, 0x5a2040, 0xd8c8a0, 0x8a5a18];
  for (let i = 0; i < 18; i++) {
    const h = 0.26 + (i % 5) * 0.035;
    const col = bottleCols[i % bottleCols.length]!;
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.04, h, 10),
      pbr(col, { metal: 0.18, rough: 0.22, emissive: col, em: 0.05 }),
    );
    const row = i < 9 ? 1.55 : 2.05;
    const ix = i % 9;
    bottle.position.set(-4.4 + ix * 1.1, row + h / 2 + 0.03, staffZ - 0.48);
    root.add(bottle);
  }

  // Four empty staff pads + brass number plates
  for (const slot of BAR_STAFF_SLOTS) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.035, 28), pad);
    disc.position.set(slot.x, staffY + 0.02, slot.z);
    disc.receiveShadow = true;
    disc.name = `bar-pad-${slot.id}`;
    disc.userData.staffSlot = slot;
    root.add(disc);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.012, 8, 28), brass);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(slot.x, staffY + 0.04, slot.z);
    root.add(ring);

    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.16), brass);
    plate.position.set(slot.x, staffY + 0.05, slot.z + 0.52);
    root.add(plate);
  }

  // Side columns
  for (const sx of [-1, 1] as const) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 0.22), walnut);
    col.position.set(sx * (width / 2 - 0.05), 1.1, frontZ - 0.15);
    col.castShadow = true;
    root.add(col);
  }

  root.userData.staffSlots = BAR_STAFF_SLOTS;
  return root;
}
