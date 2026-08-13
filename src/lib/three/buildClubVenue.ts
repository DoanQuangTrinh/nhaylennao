/**
 * High-quality Neon Club venue — GLTFLoader props + PBR floor + club lights.
 * Characters, DJ booth, tables, bar, speakers all load as .glb.
 */
import * as THREE from "three";
import { createGlbProp } from "@/lib/three/createGlbProp";
import { preloadGltf } from "@/lib/three/gltf";
import { VENUE_GLTF, VENUE_PRELOAD_URLS } from "@/lib/three/venueCatalog";
import { getRuntime, markFactory, type SculptGroup } from "@/lib/img2threejs";
import { STAGE, BAR_STAFF_SLOTS, type StageSlot } from "@/lib/config/stage-slots";
import { buildServiceBar } from "@/lib/three/buildServiceBar";

export type ClubVenue = {
  scene: THREE.Scene;
  rings: THREE.Mesh[];
  p1: THREE.PointLight;
  p2: THREE.PointLight;
  p3: THREE.PointLight;
  spots: THREE.SpotLight[];
  beams: THREE.Mesh[];
  tickables: SculptGroup[];
  co2Group: THREE.Group;
  gridTiles: THREE.Mesh[];
  fireworkGroup: THREE.Group;
  lasers: THREE.Object3D[];
  followSpot: THREE.SpotLight;
  followTarget: THREE.Object3D;
  staffSlots: StageSlot[];
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

function makeDiscoEnv(): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#05050a");
  sky.addColorStop(0.32, "#16141e");
  sky.addColorStop(0.52, "#2a1830");
  sky.addColorStop(0.72, "#1c1420");
  sky.addColorStop(1, "#4a3218");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  const blobs: Array<[number, number, number, string]> = [
    [36, 48, 56, "#5eefff"],
    [118, 54, 48, "#ff7ab8"],
    [198, 46, 52, "#c4a0ff"],
    [72, 92, 40, "#ffd56a"],
    [176, 90, 36, "#ff4d9a"],
    [240, 62, 34, "#5dffb0"],
    [10, 70, 28, "#7ad7ff"],
  ];
  for (const [x, y, r, col] of blobs) {
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, col);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeShaftTexture() {
  const w = 64;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const along = y / (h - 1);
    const fade = Math.pow(1 - along, 1.45) * (along < 0.04 ? along / 0.04 : 1);
    for (let x = 0; x < w; x++) {
      const u = (x / (w - 1)) * 2 - 1;
      const radial = Math.exp(-u * u * 11);
      const a = Math.max(0, Math.min(255, radial * fade * 255));
      const i = (y * w + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = a;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeSpotTexture() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,0.95)");
  grd.addColorStop(0.28, "rgba(255,255,255,0.35)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function discoAddMat(color: number, opacity: number, map?: THREE.Texture) {
  return new THREE.MeshBasicMaterial({
    color,
    map: map ?? null,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
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
  // Overlay only — preview strip must not start a 10-file download on first paint
  if (!preview) {
    preloadGltf([...VENUE_PRELOAD_URLS]).catch((e) =>
      console.warn("[venue] preload warning", e),
    );
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0908);
  scene.fog = new THREE.FogExp2(0x0b0908, 0.012);

  const tickables: SculptGroup[] = [];

  scene.add(new THREE.AmbientLight(0x2e2830, 0.38));
  scene.add(new THREE.HemisphereLight(0xe8e4f4, 0x16141c, 0.52));

  const key = new THREE.DirectionalLight(0xffe8d4, 1.32);
  key.position.set(3.5, 12, 9);
  key.castShadow = !preview;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -16;
  key.shadow.camera.right = 16;
  key.shadow.camera.top = 16;
  key.shadow.camera.bottom = -16;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x8aa0b8, 0.28);
  rim.position.set(-8, 6, -6);
  scene.add(rim);

  const spots: THREE.SpotLight[] = [];
  const spotConfigs: Array<{
    color: number;
    pos: [number, number, number];
    target: [number, number, number];
    intensity: number;
    angle: number;
  }> = [
    { color: 0xfff1d6, pos: [2.2, 8.2, 5.5], target: [0.6, 0, 1.2], intensity: 26, angle: Math.PI / 7 },
    { color: 0xffe0b0, pos: [-2.4, 8.0, 5.2], target: [-0.6, 0, 1.2], intensity: 22, angle: Math.PI / 7 },
    { color: 0xffc078, pos: [0, 7.6, -2.2], target: [0, 1.15, -6.4], intensity: 20, angle: Math.PI / 5.5 },
  ];
  for (const sc of spotConfigs) {
    const spot = new THREE.SpotLight(sc.color, sc.intensity, 28, sc.angle, 0.55, 1.25);
    spot.position.set(...sc.pos);
    spot.castShadow = false;
    const tgt = new THREE.Object3D();
    tgt.position.set(...sc.target);
    scene.add(tgt);
    spot.target = tgt;
    scene.add(spot);
    spots.push(spot);
  }

  const followTarget = new THREE.Object3D();
  followTarget.position.set(0, 1.3, 1.2);
  scene.add(followTarget);
  const followSpot = new THREE.SpotLight(0xfff4dc, 18, 20, Math.PI / 9, 0.38, 1.1);
  followSpot.position.set(0, 7.4, 7.2);
  followSpot.target = followTarget;
  followSpot.castShadow = false;
  scene.add(followSpot);

  const p1 = new THREE.PointLight(0xffc078, 4.1, 13, 1.7);
  p1.position.set(4.2, 2.8, -5.8);
  scene.add(p1);
  const p2 = new THREE.PointLight(0xffa85c, 3.7, 13, 1.7);
  p2.position.set(-4.2, 2.7, -5.8);
  scene.add(p2);
  const p3 = new THREE.PointLight(0xffe0b0, 3.3, 12, 1.7);
  p3.position.set(0, 3.4, -6.5);
  scene.add(p3);
  const barFill = new THREE.SpotLight(0xffe4c8, 14, 12, Math.PI / 6, 0.5, 1.3);
  barFill.position.set(0, 5.8, -4.2);
  const barAim = new THREE.Object3D();
  barAim.position.set(0, 4.3, -4.9);
  scene.add(barAim);
  barFill.target = barAim;
  scene.add(barFill);

  const djKey = new THREE.SpotLight(0xffe0b0, 24, 16, Math.PI / 7.5, 0.42, 1.2);
  djKey.position.set(STAGE.dj.x + 0.35, 7.3, STAGE.dj.z + 2.6);
  const djAim = new THREE.Object3D();
  djAim.position.set(STAGE.dj.x, STAGE.dj.y + 1.45, STAGE.dj.z);
  scene.add(djAim);
  djKey.target = djAim;
  scene.add(djKey);
  const djFill = new THREE.SpotLight(0x7ad7ff, 11, 12, Math.PI / 8, 0.5, 1.4);
  djFill.position.set(STAGE.dj.x - 1.8, 6.2, STAGE.dj.z + 1.4);
  djFill.target = djAim;
  scene.add(djFill);
  const djPoint = new THREE.PointLight(0x88e0ff, 2.4, 5.5, 1.6);
  djPoint.position.set(STAGE.dj.x, STAGE.dj.y + 2.1, STAGE.dj.z + 0.6);
  scene.add(djPoint);

  const mcKey = new THREE.SpotLight(0xffe8c8, 24, 15, Math.PI / 7.5, 0.42, 1.2);
  mcKey.position.set(STAGE.mc.x + 0.3, 7.3, STAGE.mc.z + 3.1);
  const mcAim = new THREE.Object3D();
  mcAim.position.set(STAGE.mc.x, STAGE.mc.y + 1.5, STAGE.mc.z);
  scene.add(mcAim);
  mcKey.target = mcAim;
  scene.add(mcKey);

  const poleKey = new THREE.SpotLight(0xffb0c8, 28, 15, Math.PI / 8, 0.4, 1.15);
  poleKey.position.set(STAGE.pole.x - 0.3, 7.4, STAGE.pole.z + 3.2);
  const poleAim = new THREE.Object3D();
  poleAim.position.set(STAGE.pole.x, STAGE.pole.y + 1.55, STAGE.pole.z);
  scene.add(poleAim);
  poleKey.target = poleAim;
  scene.add(poleKey);

  const doorKey = new THREE.SpotLight(0xffe4c4, 22, 16, Math.PI / 6.5, 0.46, 1.2);
  doorKey.position.set(8.4, 5.9, 3.5);
  const doorAim = new THREE.Object3D();
  doorAim.position.set(11.4, 1.25, 3.5);
  scene.add(doorAim);
  doorKey.target = doorAim;
  scene.add(doorKey);
  const doorFill = new THREE.PointLight(0xffd8a8, 3.1, 8, 1.45);
  doorFill.position.set(11.3, 2.15, 3.5);
  scene.add(doorFill);

  const gridTiles: THREE.Mesh[] = [];
  const cols = preview ? 7 : 9;
  const rows = preview ? 6 : 8;
  const tile = 1.28;
  const gap = 0.08;
  const floorW = cols * tile + (cols - 1) * gap;
  const floorD = rows * tile + (rows - 1) * gap;
  const originZ = 0.55;

  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(floorW + 0.4, 0.1, floorD + 0.4),
    pbr(0x05050a, { metal: 0.55, rough: 0.28, emissive: 0x141428, em: 0.18 }),
  );
  tray.position.set(0, 0.01, originZ);
  tray.receiveShadow = true;
  scene.add(tray);

  const tileGeo = new THREE.BoxGeometry(tile, 0.042, tile);
  const startX = -floorW / 2 + tile / 2;
  const startZ = originZ - floorD / 2 + tile / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c - (cols - 1) / 2;
      const cz = r - (rows - 1) / 2;
      const dist = Math.hypot(cx, cz);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x07070d,
        metalness: 0.88,
        roughness: 0.14,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.08,
      });
      const mesh = new THREE.Mesh(tileGeo, mat);
      mesh.position.set(startX + c * (tile + gap), 0.055, startZ + r * (tile + gap));
      mesh.receiveShadow = true;
      mesh.userData.phase = dist * 0.55 + c * 0.18 + r * 0.12;
      mesh.userData.hue0 = (c * 0.07 + r * 0.09) % 1;
      gridTiles.push(mesh);
      scene.add(mesh);
    }
  }

  const seamGeoH = new THREE.BoxGeometry(floorW + 0.04, 0.018, 0.035);
  const seamGeoV = new THREE.BoxGeometry(0.035, 0.018, floorD + 0.04);
  for (let i = 0; i <= rows; i++) {
    const seam = new THREE.Mesh(
      seamGeoH,
      neonMat(i % 2 ? 0x22d3ee : 0xf472b6, 0.55),
    );
    seam.position.set(0, 0.068, startZ - tile / 2 - gap / 2 + i * (tile + gap));
    scene.add(seam);
  }
  for (let i = 0; i <= cols; i++) {
    const seam = new THREE.Mesh(
      seamGeoV,
      neonMat(i % 2 ? 0xa78bfa : 0x22d3ee, 0.55),
    );
    seam.position.set(startX - tile / 2 - gap / 2 + i * (tile + gap), 0.068, originZ);
    scene.add(seam);
  }

  const railA = neonMat(0x22d3ee, 0.7);
  const railB = neonMat(0xf472b6, 0.65);
  const rails: Array<[number, number, number, number, THREE.MeshStandardMaterial]> = [
    [0, originZ - floorD / 2 - 0.09, floorW + 0.28, 0.045, railA],
    [0, originZ + floorD / 2 + 0.09, floorW + 0.28, 0.045, railB],
    [-floorW / 2 - 0.09, originZ, 0.045, floorD + 0.28, railB],
    [floorW / 2 + 0.09, originZ, 0.045, floorD + 0.28, railA],
  ];
  for (const [x, z, w, d, mat] of rails) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), mat);
    rail.position.set(x, 0.08, z);
    scene.add(rail);
  }

  const roomFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 32),
    pbr(0x08080e, { metal: 0.1, rough: 0.84 }),
  );
  roomFloor.rotation.x = -Math.PI / 2;
  roomFloor.position.y = -0.02;
  roomFloor.receiveShadow = true;
  scene.add(roomFloor);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(32, 8, 0.4),
    pbr(0x161210, { metal: 0.08, rough: 0.78 }),
  );
  backWall.position.set(0, 4, -8.5);
  backWall.receiveShadow = true;
  scene.add(backWall);

  for (const sx of [-1, 1] as const) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 8, 22),
      pbr(0x14110f, { metal: 0.07, rough: 0.8 }),
    );
    wall.position.set(sx * 15, 4, -1);
    wall.receiveShadow = true;
    scene.add(wall);
  }

  const beams: THREE.Mesh[] = [];
  const steel = pbr(0x2a2622, { metal: 0.72, rough: 0.38 });
  for (let i = 0; i < 5; i++) {
    if (i === 2) continue;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 9), steel);
    beam.position.set(-4 + i * 2, 7.15, 0.4);
    scene.add(beam);
    beams.push(beam);
  }

  // Raised VIP EDM floor (mezzanine)
  const mez = new THREE.Mesh(
    new THREE.BoxGeometry(14.2, 0.18, 5.2),
    pbr(0x07070d, { metal: 0.72, rough: 0.22, emissive: 0x141428, em: 0.12 }),
  );
  mez.position.set(0, 3.18, -5.35);
  mez.receiveShadow = true;
  mez.castShadow = true;
  scene.add(mez);
  const mezRail = neonMat(0x22d3ee, 0.55);
  const mezRailB = neonMat(0xf472b6, 0.5);
  for (const [x, z, w, d, mat] of [
    [0, -2.82, 14.4, 0.05, mezRail],
    [0, -7.88, 14.4, 0.05, mezRailB],
    [-7.15, -5.35, 0.05, 5.3, mezRailB],
    [7.15, -5.35, 0.05, 5.3, mezRail],
  ] as const) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mat);
    rail.position.set(x, 3.3, z);
    scene.add(rail);
  }
  const mezCols = 7;
  const mezRows = 3;
  const mzTile = 1.55;
  const mzGap = 0.07;
  const mzW = mezCols * mzTile + (mezCols - 1) * mzGap;
  const mzD = mezRows * mzTile + (mezRows - 1) * mzGap;
  const mzGeo = new THREE.BoxGeometry(mzTile, 0.04, mzTile);
  const mz0x = -mzW / 2 + mzTile / 2;
  const mz0z = -5.35 - mzD / 2 + mzTile / 2;
  for (let r = 0; r < mezRows; r++) {
    for (let c = 0; c < mezCols; c++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x080810,
        metalness: 0.86,
        roughness: 0.16,
        emissive: 0xa78bfa,
        emissiveIntensity: 0.1,
      });
      const tile = new THREE.Mesh(mzGeo, mat);
      tile.position.set(mz0x + c * (mzTile + mzGap), 3.29, mz0z + r * (mzTile + mzGap));
      tile.receiveShadow = true;
      tile.userData.phase = r * 0.5 + c * 0.22;
      tile.userData.hue0 = 0.2 + c * 0.08;
      gridTiles.push(tile);
      scene.add(tile);
    }
  }

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
    if (preview) return null;
    try {
      const prop = await createGlbProp(url, {
        height: opts.height,
        scale: opts.scale,
        yaw: opts.yaw ?? 0,
        ground: true,
        noFrustumCull: false,
        cloneMaterials: false,
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

  scene.add(buildServiceBar());

  // Neon BAR sign
  place(VENUE_GLTF.neonBarSign, {
    x: 0,
    z: -8.05,
    height: 1.1,
    y: 0,
  }).then((sign) => {
    if (sign) sign.position.y = 4.15;
  });

  // DJ booth sits on the tall riser
  place(VENUE_GLTF.djBooth, {
    x: STAGE.dj.x,
    y: STAGE.dj.y,
    z: STAGE.dj.z + 0.35,
    height: 1.55,
    rotY: STAGE.dj.yaw,
  });

  // Chrome dance pole — Lisa orbits local origin of KickPole clip
  {
    const px = STAGE.pole.x;
    const pz = STAGE.pole.z;
    const py = STAGE.pole.y;
    const chrome = new THREE.MeshStandardMaterial({
      color: 0xd8dee8,
      metalness: 0.96,
      roughness: 0.12,
      envMapIntensity: 1.6,
    });
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.82, py, 32),
      pbr(0x161216, { metal: 0.55, rough: 0.4 }),
    );
    base.position.set(px, py / 2, pz);
    base.receiveShadow = true;
    base.castShadow = true;
    scene.add(base);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.03, 8, 32), pbr(0xb8894a, { metal: 0.85, rough: 0.28 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(px, py + 0.02, pz);
    scene.add(rim);
    const shaftH = 3.55;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, shaftH, 24), chrome);
    shaft.position.set(px, py + shaftH / 2, pz);
    shaft.castShadow = true;
    scene.add(shaft);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.042, 0.07, 16), chrome);
    cap.position.set(px, py + shaftH + 0.03, pz);
    scene.add(cap);
  }

  // Disco ball + volumetric rays + floor gobos
  const lasers: THREE.Object3D[] = [];
  void (async () => {
    try {
      const ball = await createGlbProp(VENUE_GLTF.discoBall, {
        height: 1.52,
        ground: true,
        spinY: 0.42,
        cloneMaterials: false,
        idleClip: /./,
      });
      const hanger = new THREE.Group();
      hanger.name = "disco-hanger";
      hanger.position.set(0, 6.55, 0.35);
      ball.position.set(0, 0, 0);
      hanger.add(ball);

      const cableH = 1.48;
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.013, cableH, 8),
        pbr(0x2c2c34, { metal: 0.78, rough: 0.38 }),
      );
      cable.position.y = 0.82 + cableH / 2;
      hanger.add(cable);
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.055, 0.012, 8, 16),
        pbr(0xb8c0cc, { metal: 0.92, rough: 0.22 }),
      );
      hook.position.y = 0.78;
      hanger.add(hook);

      const env = makeDiscoEnv();
      const colorLights: THREE.MeshStandardMaterial[] = [];
      ball.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const srcs = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const next = srcs.map((raw) => {
          if (
            !(
              raw instanceof THREE.MeshStandardMaterial ||
              raw instanceof THREE.MeshPhysicalMaterial
            )
          )
            return raw;
          raw.envMap = env;
          if (/color-light/i.test(raw.name)) {
            const em = raw.emissive.clone();
            if (em.getHex() === 0) em.setHex(0x22d3ee);
            raw.color.copy(em);
            raw.emissive.copy(em);
            raw.emissiveIntensity = 2.15;
            raw.metalness = 0.12;
            raw.roughness = 0.32;
            raw.envMapIntensity = 0.45;
            raw.toneMapped = false;
            colorLights.push(raw);
            return raw;
          }
          if (/metal/i.test(raw.name)) {
            const phys = new THREE.MeshPhysicalMaterial({
              color: 0xe8eef8,
              map: raw.map,
              normalMap: raw.normalMap,
              metalnessMap: raw.metalnessMap,
              roughnessMap: raw.roughnessMap,
              envMap: env,
              metalness: 1,
              roughness: 0.06,
              envMapIntensity: 2.45,
              clearcoat: 1,
              clearcoatRoughness: 0.05,
              emissive: new THREE.Color(0x152030),
              emissiveIntensity: 0.22,
            });
            return phys;
          }
          if (/plast/i.test(raw.name)) {
            raw.color.setHex(0x16161c);
            raw.metalness = 0.28;
            raw.roughness = 0.42;
            raw.envMapIntensity = 0.5;
          }
          raw.needsUpdate = true;
          return raw;
        });
        mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
      });

      const shaftTex = makeShaftTexture();
      const spotTex = makeSpotTexture();
      const rayColors = [0x9aeeff, 0xffb0d4, 0xd4c0ff, 0xffe08a, 0xff8ec8, 0xb8fff0];
      const rays = new THREE.Group();
      rays.name = "disco-rays";
      const down = new THREE.Vector3(0, -1, 0);
      const dir = new THREE.Vector3();
      const shaftMats: THREE.MeshBasicMaterial[] = [];
      const goboHits: Array<{ x: number; z: number; color: number }> = [];
      const originY = 6.55 + 0.68;
      const count = 12;
      for (let i = 0; i < count; i++) {
        const u = (i + 0.5) / count;
        const phi = Math.acos(0.18 + 0.72 * u);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        dir.set(Math.sin(phi) * Math.cos(theta), -Math.cos(phi) - 0.22, Math.sin(phi) * Math.sin(theta)).normalize();
        const col = rayColors[i % rayColors.length]!;
        const len = 7.6 + (i % 3) * 0.55;
        const width = i % 4 === 0 ? 0.2 : 0.13;
        const geo = new THREE.PlaneGeometry(width, len);
        geo.translate(0, -len / 2, 0);
        const mat = discoAddMat(col, i % 4 === 0 ? 0.42 : 0.28, shaftTex);
        const a = new THREE.Mesh(geo, mat);
        const b = new THREE.Mesh(geo, mat);
        b.rotation.y = Math.PI / 2;
        const beam = new THREE.Group();
        beam.add(a, b);
        beam.quaternion.setFromUnitVectors(down, dir);
        beam.position.copy(dir).multiplyScalar(0.52);
        rays.add(beam);
        lasers.push(beam);
        shaftMats.push(mat);
        if (dir.y < -0.35) {
          const tHit = (0.05 - originY) / dir.y;
          if (tHit > 1.2 && tHit < 11) {
            goboHits.push({ x: dir.x * tHit, z: dir.z * tHit, color: col });
          }
        }
      }
      rays.position.y = 0.68;
      ball.add(rays);
      lasers.push(rays);

      const sparkleMats: THREE.MeshBasicMaterial[] = [];
      const sparkGeo = new THREE.SphereGeometry(0.01, 5, 5);
      for (let i = 0; i < 10; i++) {
        const a = Math.acos(1 - 2 * ((i + 0.4) / 10));
        const b = Math.PI * (1 + Math.sqrt(5)) * i;
        const mat = discoAddMat(0xfff6e4, 0.35);
        const sp = new THREE.Mesh(sparkGeo, mat);
        sp.position.set(
          Math.sin(a) * Math.cos(b) * 0.56,
          0.7 + Math.cos(a) * 0.48,
          Math.sin(a) * Math.sin(b) * 0.56,
        );
        ball.add(sp);
        lasers.push(sp);
        sparkleMats.push(mat);
      }

      const floorFx = new THREE.Group();
      floorFx.name = "disco-gobos";
      floorFx.position.set(0, 0.05, 0.35);
      const goboGeo = new THREE.PlaneGeometry(0.55, 0.55);
      for (const hit of goboHits.slice(0, 8)) {
        const disc = new THREE.Mesh(goboGeo, discoAddMat(hit.color, 0.22, spotTex));
        disc.rotation.x = -Math.PI / 2;
        disc.position.set(hit.x, 0, hit.z);
        floorFx.add(disc);
        lasers.push(disc);
      }
      scene.add(floorFx);

      const glow = new THREE.PointLight(0xfff1d6, 2.6, 10, 1.7);
      glow.position.y = 0.7;
      ball.add(glow);
      const orbitCols = [0x7ad7ff, 0xf472b6, 0xfbbf24];
      for (let i = 0; i < 3; i++) {
        const pl = new THREE.PointLight(orbitCols[i], 1.15, 6.8, 1.8);
        const a = (i / 3) * Math.PI * 2;
        pl.position.set(Math.cos(a) * 0.9, 0.55, Math.sin(a) * 0.9);
        ball.add(pl);
      }

      scene.add(hanger);
      const ballRt = getRuntime(ball);
      tickables.push(
        markFactory(hanger, "disco-rig", "hybrid", {
          tick(dt, t) {
            ballRt?.tick?.(dt, t);
            hanger.rotation.z = Math.sin(t * 0.48) * 0.028;
            hanger.rotation.x = Math.cos(t * 0.36) * 0.02;
            floorFx.rotation.y = ball.rotation.y;
            const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
            for (const m of colorLights) m.emissiveIntensity = 1.55 + pulse * 0.55;
            for (let i = 0; i < sparkleMats.length; i++) {
              sparkleMats[i]!.opacity = 0.08 + 0.38 * Math.abs(Math.sin(t * 4.2 + i * 1.8));
            }
            for (let i = 0; i < shaftMats.length; i++) {
              const base = i % 4 === 0 ? 0.42 : 0.28;
              shaftMats[i]!.opacity = base * (0.88 + 0.12 * Math.sin(t * 1.1 + i));
            }
          },
        }),
      );
    } catch (e) {
      console.warn("[venue] Disco Ball load error", e);
    }
  })();

  // Speakers — keep the +X stack off the entrance
  place(VENUE_GLTF.speakerStack, { x: -11, z: 1.5, height: 2.1, rotY: 0.4 });
  place(VENUE_GLTF.speakerStack, { x: 11.2, z: -2.2, height: 2.1, rotY: -0.4 });


  // High-top tables around floor
  const highTops: Array<[number, number, number]> = [
    [3.6, 5.1, 0.4],
    [6.2, -1.5, -0.3],
    [-5.8, 3.5, -0.5],
    [8, 0.5, Math.PI],
    [-6.5, 0.2, 0.8],
  ];
  for (const [x, z, rot] of highTops) {
    place(VENUE_GLTF.highTop, { x, z, height: 1.1, rotY: rot });
  }

  // Lounge tables + chairs
  const lounges: Array<[number, number]> = [
    [9, -4],
    [-9.5, -4.5],
    [7.4, 6.4],
  ];
  for (const [x, z] of lounges) {
    place(VENUE_GLTF.loungeTable, { x, z, height: 0.6 });
    if (preview) continue;
  }

  // Entrance / doors — do not await; venue must return before any GLB finishes
  place(VENUE_GLTF.entranceDoors, {
    x: 12.5,
    z: 3.5,
    height: 3.2,
    rotY: -Math.PI / 2,
  });
  const doorPad = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.08, 4.6),
    pbr(0x1a1614, { metal: 0.35, rough: 0.48 }),
  );
  doorPad.position.set(11.4, 0.04, 3.5);
  doorPad.receiveShadow = true;
  scene.add(doorPad);
  const doorTrim = new THREE.Mesh(
    new THREE.BoxGeometry(2.42, 0.03, 4.62),
    pbr(0xb8894a, { metal: 0.78, rough: 0.32, emissive: 0x5a3a18, em: 0.08 }),
  );
  doorTrim.position.set(11.4, 0.085, 3.5);
  scene.add(doorTrim);

  const djRiser = new THREE.Mesh(
    new THREE.BoxGeometry(3.15, STAGE.dj.y, 2.35),
    pbr(0x1c1814, { metal: 0.38, rough: 0.46 }),
  );
  djRiser.position.set(STAGE.dj.x, STAGE.dj.y / 2, STAGE.dj.z + 0.15);
  djRiser.receiveShadow = true;
  djRiser.castShadow = true;
  scene.add(djRiser);
  const djTrim = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.04, 2.4),
    pbr(0x7ad7ff, { metal: 0.55, rough: 0.28, emissive: 0x3ec4ff, em: 0.28 }),
  );
  djTrim.position.set(STAGE.dj.x, STAGE.dj.y + 0.02, STAGE.dj.z + 0.15);
  scene.add(djTrim);

  const mcStage = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, STAGE.mc.y, 3.35),
    pbr(0x1a1612, { metal: 0.32, rough: 0.5 }),
  );
  mcStage.position.set(STAGE.mc.x, STAGE.mc.y / 2, STAGE.mc.z);
  mcStage.receiveShadow = true;
  mcStage.castShadow = true;
  scene.add(mcStage);
  const mcTrim = new THREE.Mesh(
    new THREE.BoxGeometry(6.45, 0.04, 3.4),
    pbr(0xb8894a, { metal: 0.82, rough: 0.3, emissive: 0x5a3a18, em: 0.1 }),
  );
  mcTrim.position.set(STAGE.mc.x, STAGE.mc.y + 0.02, STAGE.mc.z);
  scene.add(mcTrim);

  // ── CO2 Cannon Jet Particle System ───────────────────────────────
  const co2Group = new THREE.Group();
  const particleCount = preview ? 60 : 90;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    // Cannon nozzles at stage left (-4, 0.2, -1) and stage right (4, 0.2, -1)
    const side = i % 2 === 0 ? -4 : 4;
    positions[i * 3] = side + (Math.random() - 0.5) * 0.4;
    positions[i * 3 + 1] = 0.2 + Math.random() * 0.2;
    positions[i * 3 + 2] = -1 + (Math.random() - 0.5) * 0.4;

    velocities[i * 3] = (Math.random() - 0.5) * 1.5;
    velocities[i * 3 + 1] = 6 + Math.random() * 5; // upward blast
    velocities[i * 3 + 2] = 2 + Math.random() * 3; // forward blast
  }

  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.35,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const co2Points = new THREE.Points(geom, mat);
  co2Group.add(co2Points);
  co2Group.userData = { velocities, mat, active: false };
  scene.add(co2Group);

  // ── VIP 3D Fountain Pyrotechnics System ──────────────────────────────
  const fireworkGroup = new THREE.Group();
  const fwCount = preview ? 80 : 140;
  const fwGeom = new THREE.BufferGeometry();
  const fwPositions = new Float32Array(fwCount * 3);
  const fwVelocities = new Float32Array(fwCount * 3);
  const fwColors = new Float32Array(fwCount * 3);

  const pyroColors = [
    new THREE.Color(0xffd700), // Gold
    new THREE.Color(0xff1493), // Pink
    new THREE.Color(0x00ffff), // Cyan
    new THREE.Color(0xff4500), // Orange
  ];

  for (let i = 0; i < fwCount; i++) {
    fwPositions[i * 3] = (Math.random() - 0.5) * 6;
    fwPositions[i * 3 + 1] = 0.5 + Math.random() * 0.5;
    fwPositions[i * 3 + 2] = -4 + (Math.random() - 0.5) * 2;

    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 5.5;
    fwVelocities[i * 3] = Math.cos(angle) * speed;
    fwVelocities[i * 3 + 1] = 5.0 + Math.random() * 6.0;
    fwVelocities[i * 3 + 2] = Math.sin(angle) * speed;

    const c = pyroColors[i % pyroColors.length]!;
    fwColors[i * 3] = c.r;
    fwColors[i * 3 + 1] = c.g;
    fwColors[i * 3 + 2] = c.b;
  }

  fwGeom.setAttribute("position", new THREE.BufferAttribute(fwPositions, 3));
  fwGeom.setAttribute("color", new THREE.BufferAttribute(fwColors, 3));

  const fwMat = new THREE.PointsMaterial({
    size: 0.38,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const fwPoints = new THREE.Points(fwGeom, fwMat);
  fireworkGroup.add(fwPoints);
  fireworkGroup.userData = { velocities: fwVelocities, mat: fwMat, active: false };
  scene.add(fireworkGroup);

  // VIP Champagne Ice Bucket Props on Lounge Tables
  const vipBucketMat = pbr(0xd4af37, { metal: 0.9, rough: 0.1, em: 0.4, emissive: 0xfacc15 });
  for (const [x, z] of lounges) {
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 16), vipBucketMat);
    bucket.position.set(x, 0.6 + 0.175, z);
    scene.add(bucket);

    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 12), neonMat(0x22c55e, 0.8));
    bottle.position.set(x, 0.6 + 0.35, z);
    scene.add(bottle);
  }

  return {
    scene,
    rings: [],
    p1,
    p2,
    p3,
    spots,
    beams,
    tickables,
    co2Group,
    gridTiles,
    fireworkGroup,
    lasers,
    followSpot,
    followTarget,
    staffSlots: BAR_STAFF_SLOTS,
  };
}
