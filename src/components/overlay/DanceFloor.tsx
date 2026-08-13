import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useLiveStore, type Dancer } from "@/lib/store/live-store";
import {
  cameraGiftPunch,
  cameraVenueIntro,
  gsap,
} from "@/lib/3d/gsap-core";
import {
  createGlbCharacter,
  createHumanCharacter,
  createPhotoCharacter,
  getRuntime,
  isGlbPreferred,
  preloadGlbCharacters,
  enableShadows,
  type GlbModelKind,
} from "@/lib/img2threejs";
import { CLUB_GLTF, FLOOR_KINDS, preloadGltf } from "@/lib/three/gltf";
import { createStlCharacter } from "@/lib/three/stl";
import { buildClubVenue } from "@/lib/three/buildClubVenue";
import { createClubComposer } from "@/lib/three/postfx";
import { STAGE, getStage } from "@/lib/config/stage-slots";

type PersonRig = {
  id: string;
  root: THREE.Group;
  label: HTMLDivElement;
  targetX: number;
  targetZ: number;
  faceYaw: number;
  name: string;
  wingTier: number;
  auraUntil: number;
  style: number;
  skin: number;
  labelKey: string;
  source: "glb" | "procedural";
  hadWings: boolean;
};

function fingerprint(list: Dancer[]) {
  return list
    .map(
      (d) =>
        `${d.id}:${d.style}:${d.skin}:${d.dancing ? 1 : 0}:${d.wingTier}:${d.auraUntil}:${d.name}`,
    )
    .join("|");
}

function wingActive(
  d: { wingTier?: number; auraUntil?: number },
  now = Date.now(),
) {
  return (d.auraUntil ?? 0) > now && (d.wingTier ?? 0) >= 2;
}

function needsRebuild(rig: PersonRig, d: Dancer) {
  if (rig.style !== d.style || rig.skin !== d.skin) return true;
  const want = wingActive(d);
  if (want !== rig.hadWings) return true;
  if (want && rig.wingTier !== (d.wingTier ?? 0)) return true;
  return false;
}

function makeLabel(text: string, color: number) {
  const label = document.createElement("div");
  label.textContent = text;
  label.style.cssText = `
    position:absolute; transform:translate(-50%,-100%);
    white-space:nowrap; border-radius:999px; border:1px solid rgba(255,255,255,.45);
    background:rgba(0,0,0,.85); color:#fff; font:700 12px/1.4 "DM Sans",system-ui,sans-serif;
    padding:4px 12px; pointer-events:none; will-change:left,top;
    box-shadow:0 0 12px ${new THREE.Color(color).getStyle()}aa;
  `;
  return label;
}

type Props = { className?: string; preview?: boolean };

/**
 * OBS Neon Club venue — GLTFLoader characters + props, PBR floor,
 * soft shadows, UnrealBloom neon glow.
 */
const FLOOR_GLB_BY_NAME: Record<string, GlbModelKind> = {
  aya: "hipHop2",
  ken: "runningMan",
  mia: "samba",
};

const FLOOR_GLB_CYCLE: GlbModelKind[] = [...FLOOR_KINDS];

function kindForFloorDancer(name: string, index: number): GlbModelKind {
  return (
    FLOOR_GLB_BY_NAME[name.trim().toLowerCase()] ??
    FLOOR_GLB_CYCLE[Math.abs(index) % FLOOR_GLB_CYCLE.length]!
  );
}

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

function scatterSlot(
  id: string,
  occupied: Array<{ x: number; z: number }>,
  aspectRatio = "9:16",
): { x: number; z: number; yaw: number } {
  const isMobile = aspectRatio === "9:16";
  const maxX = isMobile ? 2.7 : 4.7;
  const minZ = isMobile ? 0.6 : 0.35;
  const maxZ = isMobile ? 4.8 : 3.8;
  const stageCfg = getStage(aspectRatio);

  let x = 0;
  let z = 1.2;
  let yaw = 0;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const a = hash01(`${id}:x:${attempt}`);
    const b = hash01(`${id}:z:${attempt}`);
    x = (a - 0.5) * (maxX * 2);
    z = minZ + b * (maxZ - minZ);
    const farBooth = (x - stageCfg.dj.x) ** 2 + (z - stageCfg.dj.z) ** 2 > 3.2;
    const farMc = (x - stageCfg.mc.x) ** 2 + (z - stageCfg.mc.z) ** 2 > 2.5;
    const farPole = (x - stageCfg.pole.x) ** 2 + (z - stageCfg.pole.z) ** 2 > 2.5;
    const clear = occupied.every((p) => (p.x - x) ** 2 + (p.z - z) ** 2 > 1.4);
    if (farBooth && farMc && farPole && clear) break;
  }
  yaw = isMobile ? (hash01(`${id}:yaw`) - 0.5) * 0.4 : hash01(`${id}:yaw`) * Math.PI * 2;
  return { x, z, yaw };
}

export function DanceFloor({ className, preview = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);
  const [prefTick, setPrefTick] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "quanbar-char-mode" || e.key === "quanbar-use-glb") {
        setPrefTick((n) => n + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    const labelLayer = labelLayerRef.current;
    if (!mount || !labelLayer) return;

    let alive = true;
    let raf = 0;
    let ro: ResizeObserver | null = null;
    let unsub: (() => void) | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let fx: ReturnType<typeof createClubComposer> | null = null;

    const people = new Map<string, PersonRig>();
    const talent = new Map<string, PersonRig>();
    const preferGlb = isGlbPreferred();

    const boot = async () => {
      const w = Math.max(mount.clientWidth, 320);
      const h = Math.max(mount.clientHeight, 240);
      const dprCap = preview ? 1 : 1.25;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

      renderer = new THREE.WebGLRenderer({
        antialias: !preview,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      renderer.shadowMap.enabled = !preview;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.98;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x0b0908, 1);
      mount.appendChild(renderer.domElement);
      Object.assign(renderer.domElement.style, {
        width: "100%",
        height: "100%",
        display: "block",
      });

      const aspect = w / h;
      const defaultFov = preview ? 42 : 38;
      const initialFov =
        aspect < 1.0
          ? Math.min(70, Math.max(54, 2 * Math.atan(Math.tan((defaultFov * Math.PI) / 360) / aspect) * (180 / Math.PI)))
          : defaultFov;
      const camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.1, 140);

      const lookAt =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("look")
          : null;
      const isPortrait = aspect < 1.0;
      const homePos =
        lookAt === "door"
          ? new THREE.Vector3(8.05, 2.35, 6.55)
          : lookAt === "mc"
            ? new THREE.Vector3(2.05, 2.65, 3.35)
            : lookAt === "ball"
              ? new THREE.Vector3(1.15, 6.35, 4.85)
              : preview
                ? new THREE.Vector3(0, 6.6, isPortrait ? 22.5 : 19)
                : new THREE.Vector3(0, isPortrait ? 8.2 : 7.15, isPortrait ? 25.5 : 21.4);
      const homeLook =
        lookAt === "door"
          ? new THREE.Vector3(11.45, 1.25, 3.5)
          : lookAt === "mc"
            ? new THREE.Vector3(STAGE.mc.x, STAGE.mc.y + 1.15, STAGE.mc.z)
            : lookAt === "ball"
              ? new THREE.Vector3(0, 7.05, 0.35)
              : new THREE.Vector3(0, 1.35, 0.6);
      cameraVenueIntro(
        camera,
        { x: homePos.x, y: homePos.y, z: homePos.z },
        homeLook,
        preview ? 1.0 : 1.6,
      );

      // ── Async GLB venue (characters/DJ/tables via GLTFLoader) ───────────
      const venue = await buildClubVenue(preview);
      if (!alive || !renderer) {
        return;
      }
      const { scene, rings, p1, p2, p3, spots, beams, tickables, followSpot, followTarget } =
        venue;

      fx = preview
        ? null
        : createClubComposer(renderer, scene, camera, {
            strength: 0.11,
            radius: 0.26,
            threshold: 0.94,
          });

      const clock = new THREE.Clock();
      const tmp = new THREE.Vector3();
      const tileHue = new THREE.Color();
      const lookNow = homeLook.clone();
      const lookGoal = homeLook.clone();
      const posGoal = homePos.clone();
      let focusedId: string | null = null;
      let focusUntil = 0;
      let pendingFocusName: string | null = null;
      let nextSpotlightAt = 16 + Math.random() * 5;
      let lastSpotlightId: string | null = null;
      let giftLockUntil = 2.1;
      let lastGiftId: string | null = null;
      let lastFp = "";
      let needsSync = true;
      let glbReady = false;
      let wingCheck = 0;
      const pending = new Set<string>();

      const seed: Dancer[] = ["Aya", "Ken", "Mia"].map((name, i) => ({
        id: `seed-${i}`,
        name,
        platform: "demo" as const,
        style: i * 2,
        skin: i,
        dancing: true,
        isDemo: true,
        joinedAt: Date.now(),
        wingTier: 0,
        auraUntil: 0,
        giftedTotal: 0,
      }));

      glbReady = true;

      const removeRig = (rig: PersonRig) => {
        getRuntime(rig.root)?.dispose?.();
        gsap.killTweensOf(rig.root.scale);
        scene.remove(rig.root);
        rig.label.remove();
      };

      const charMode = (typeof window !== "undefined" ? window.localStorage.getItem("quanbar-char-mode") : null) as "glb" | "stl" | "human" | "photo" | null;
      const preferMode = charMode || "glb";

      const spawnDancer = async (
        d: Dancer,
        index: number,
      ): Promise<PersonRig> => {
        const style = d.style !== 0 ? d.style : index;
        const common = {
          style,
          skin: d.skin,
          dancing: true as const,
          wingTier: d.wingTier,
          auraUntil: d.auraUntil,
          role: "dancer" as const,
        };
        const wantGlb = preferGlb || preferMode === "glb" || preferMode !== "human";
        const kind = kindForFloorDancer(d.name, index);

        let root;
        if (wantGlb && preferMode !== "stl") {
          try {
            root = await createGlbCharacter({ ...common, kind });
          } catch (e) {
            console.warn("[floor] GLB spawn failed", kind, e);
            root = createHumanCharacter(common);
          }
        } else if (preferMode === "stl") {
          try {
            root = await createStlCharacter({
              url: "/3d/15.stl",
              dancing: true,
              scale: 1,
              role: "dancer",
            });
          } catch {
            root = await createGlbCharacter({ ...common, kind });
          }
        } else {
          root = createHumanCharacter(common);
        }
        const meta = (
          root.userData as { img2threejs?: { source?: string } }
        ).img2threejs;
        const source: "glb" | "procedural" =
          meta?.source === "glb" ? "glb" : "procedural";

        enableShadows(root, true, true);
        const finalScale = 1.12;
        root.scale.setScalar(0.01);
        gsap.to(root.scale, {
          x: finalScale,
          y: finalScale,
          z: finalScale,
          duration: 0.45,
          ease: "back.out(1.6)",
          delay: Math.min(index * 0.05, 0.3),
        });

        const now = Date.now();
        const active = wingActive(d, now);
        const tier = active ? d.wingTier || 0 : 0;
        const badge =
          tier >= 4
            ? "🔥 "
            : tier >= 3
              ? "✦ "
              : tier >= 2
                ? "🪽 "
                : d.isDemo
                  ? "· "
                  : "";
        const labelKey = `${badge}${d.name}`;
        const label = makeLabel(
          labelKey,
          tier >= 4 ? 0xff6a00 : 0x22d3ee,
        );

        return {
          id: d.id,
          root,
          label,
          targetX: 0,
          targetZ: 1.2,
          faceYaw: 0,
          name: d.name,
          wingTier: d.wingTier ?? 0,
          auraUntil: d.auraUntil ?? 0,
          style: d.style,
          skin: d.skin,
          labelKey,
          source,
          hadWings: active,
        };
      };

      const spawnTalent = async (
        id: string,
        name: string,
        kind: GlbModelKind,
        x: number,
        z: number,
        color: number,
        opts: { y?: number; scale?: number; yaw?: number } = {},
      ) => {
        try {
          const scale = opts.scale ?? (id === "dj" ? 1.06 : 1.1);
          const root = await createGlbCharacter({
            kind,
            dancing: true,
            style: id === "dj" ? 2 : 4,
            scale,
          });
          if (!alive) {
            getRuntime(root)?.dispose?.();
            return;
          }
          enableShadows(root, true, true);
          root.position.set(x, opts.y ?? 0.28, z);
          root.userData.faceYaw = opts.yaw ?? 0;
          scene.add(root);
          const label = makeLabel(name, color);
          labelLayer.appendChild(label);
          talent.set(id, {
            id,
            root,
            label,
            targetX: x,
            targetZ: z,
            faceYaw: opts.yaw ?? 0,
            name,
            wingTier: 0,
            auraUntil: 0,
            style: 0,
            skin: 0,
            labelKey: name,
            source: "glb",
            hadWings: false,
          });
          console.info("[floor] talent ok", id, kind);
        } catch (e) {
          console.warn("[floor] talent spawn failed", name, e);
        }
      };

      if (!preview) {
        const stage = getStage(useLiveStore.getState().aspectRatio);
        void spawnTalent("dj", "DJ", "miku", stage.dj.x, stage.dj.z, 0x7ad7ff, {
          y: stage.dj.y,
          scale: stage.dj.scale,
          yaw: stage.dj.yaw,
        });
        void spawnTalent("mc", "MC", "freddie", stage.mc.x, stage.mc.z, 0xffe4b0, {
          y: stage.mc.y,
          scale: stage.mc.scale,
          yaw: stage.mc.yaw,
        });
        void spawnTalent("lisa", "Lisa", "lisa", stage.pole.x, stage.pole.z, 0xff8ab8, {
          y: stage.pole.y,
          scale: stage.pole.scale,
          yaw: stage.pole.yaw,
        });
        void spawnTalent("bar5", "VIP", "bar5", stage.bartender.x, stage.bartender.z, 0xa78bfa, {
          y: stage.bartender.y,
          scale: stage.bartender.scale,
          yaw: stage.bartender.yaw,
        });
        void spawnTalent("guard-l", "Bảo vệ", "gangster", stage.guardL.x, stage.guardL.z, 0xc4a574, {
          y: stage.guardL.y,
          scale: stage.guardL.scale,
          yaw: stage.guardL.yaw,
        });
        void spawnTalent("guard-r", "Bảo vệ", "gangster", stage.guardR.x, stage.guardR.z, 0xc4a574, {
          y: stage.guardR.y,
          scale: stage.guardR.scale,
          yaw: stage.guardR.yaw,
        });
      }

      const syncPeople = (list: Dancer[]) => {
        const ids = new Set(list.map((d) => d.id));
        for (const [id, rig] of people) {
          if (!ids.has(id)) {
            removeRig(rig);
            people.delete(id);
          }
        }
        list.forEach((d, i) => {
          const idx = i;
          const existing = people.get(d.id);
          const occupied = [...people.values()]
            .filter((p) => p.id !== d.id)
            .map((p) => ({ x: p.targetX, z: p.targetZ }));
          const slot = existing
            ? { x: existing.targetX, z: existing.targetZ, yaw: existing.faceYaw }
            : scatterSlot(d.id, occupied, useLiveStore.getState().aspectRatio);
          const place = (created: PersonRig) => {
            created.targetX = slot.x;
            created.targetZ = slot.z;
            created.faceYaw = slot.yaw;
            created.root.userData.faceYaw = slot.yaw;
            created.root.position.set(slot.x, 0.12, slot.z);
            created.root.rotation.y = slot.yaw;
          };
          if (existing) {
            const shouldBeGlb = preferGlb || preferMode === "glb" || preferMode !== "human";
            const wrongSource = shouldBeGlb && existing.source !== "glb";
            if ((wrongSource || needsRebuild(existing, d)) && !pending.has(d.id)) {
              pending.add(d.id);
              void spawnDancer(d, idx)
                .then((created) => {
                  pending.delete(d.id);
                  if (!alive) return;
                  removeRig(existing);
                  place(created);
                  scene.add(created.root);
                  labelLayer.appendChild(created.label);
                  people.set(d.id, created);
                })
                .catch((e) => {
                  pending.delete(d.id);
                  console.warn("[floor] rebuild failed", d.name, e);
                });
            } else {
              const rt = getRuntime(existing.root) as
                | { setDancing?: (v: boolean) => void }
                | undefined;
              rt?.setDancing?.(d.dancing);
              existing.wingTier = d.wingTier ?? 0;
              existing.auraUntil = d.auraUntil ?? 0;
            }
            return;
          }
          if (pending.has(d.id)) return;
          pending.add(d.id);
          void spawnDancer(d, idx)
            .then((created) => {
              pending.delete(d.id);
              if (!alive) return;
              place(created);
              scene.add(created.root);
              labelLayer.appendChild(created.label);
              people.set(d.id, created);
            })
            .catch((e) => {
              pending.delete(d.id);
              console.warn("[floor] spawn failed", d.name, e);
            });
        });

        // labels
        for (const d of list) {
          const rig = people.get(d.id);
          if (!rig) continue;
          const now = Date.now();
          const active = wingActive(d, now);
          const tier = active ? d.wingTier || 0 : 0;
          const badge =
            tier >= 4
              ? "🔥 "
              : tier >= 3
                ? "✦ "
                : tier >= 2
                  ? "🪽 "
                  : d.isDemo
                    ? "· "
                    : "";
          const key = `${badge}${d.name}`;
          if (rig.labelKey !== key) {
            rig.labelKey = key;
            rig.label.textContent = key;
          }
        }
      };

      unsub = useLiveStore.subscribe(() => {
        const s = useLiveStore.getState();
        const list = s.dancers.length ? s.dancers : seed;
        const fp =
          fingerprint(list) +
          `|g:${s.gifts[0]?.id ?? ""}|glb:${glbReady ? 1 : 0}`;
        if (fp !== lastFp) {
          lastFp = fp;
          needsSync = true;
        }
      });

      syncPeople(
        useLiveStore.getState().dancers.length
          ? useLiveStore.getState().dancers
          : seed,
      );
      needsSync = false;

      const tick = () => {
        if (!alive || !renderer) return;
        raf = requestAnimationFrame(tick);
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;

        if (needsSync) {
          needsSync = false;
          const list = useLiveStore.getState().dancers;
          syncPeople(list.length ? list : seed);
        }

        wingCheck += dt;
        if (wingCheck > 0.6) {
          wingCheck = 0;
          for (const d of useLiveStore.getState().dancers) {
            const rig = people.get(d.id);
            if (rig && needsRebuild(rig, d)) {
              needsSync = true;
              lastFp = "";
              break;
            }
          }
        }

        const g0 = useLiveStore.getState().gifts[0];
        if (g0 && g0.id !== lastGiftId) {
          lastGiftId = g0.id;
          pendingFocusName = g0.name;
          focusUntil = t + 4.8;
          giftLockUntil = t + 0.28;
          cameraGiftPunch(
            camera,
            g0.effect === "legendary"
              ? 1.3
              : g0.effect === "mega"
                ? 1.0
                : 0.65,
          );
          nextSpotlightAt = Math.max(nextSpotlightAt, t + 16);
          if (fx) {
            const s0 = fx.bloom.strength;
            gsap.fromTo(
              fx.bloom,
              { strength: Math.min(s0 + 0.05, 0.18) },
              { strength: s0, duration: 0.65, ease: "power2.out" },
            );
          }
        }

        for (const tile of venue.gridTiles) {
          const mat = tile.material as THREE.MeshStandardMaterial;
          if (!mat.emissive) continue;
          const wave = 0.5 + 0.5 * Math.sin(t * 1.55 + Number(tile.userData.phase ?? 0));
          const hue = 0.52 + 0.36 * ((Number(tile.userData.hue0 ?? 0) + t * 0.045) % 1);
          tileHue.setHSL(hue, 0.9, 0.52);
          mat.emissive.copy(tileHue);
          mat.emissiveIntensity = 0.07 + wave * 0.2;
        }

        p1.intensity = 3.1 + Math.sin(t * 0.35) * 0.25;
        p2.intensity = 2.7 + Math.cos(t * 0.32) * 0.22;
        p3.intensity = 2.3 + Math.sin(t * 0.28) * 0.18;

        for (let i = 0; i < spots.length; i++) {
          const sp = spots[i]!;
          const phase = t * 0.12 + i * 1.7;
          sp.target.position.x = Math.sin(phase) * 0.85;
          sp.target.position.z = 1.1 + Math.cos(phase * 0.7) * 0.45;
          sp.target.updateMatrixWorld();
          sp.intensity = (i === 2 ? 15 : 23) + Math.sin(t * 0.4 + i) * 1.4;
        }

        void beams;

        // CO2 Jet Blast Animation
        if (venue.co2Group) {
          const co2Until = useLiveStore.getState().co2JetUntil;
          const isCo2Active = co2Until > Date.now();
          const co2Points = venue.co2Group.children[0] as THREE.Points | undefined;
          if (co2Points && co2Points.material) {
            const mat = co2Points.material as THREE.PointsMaterial;
            if (isCo2Active) {
              mat.opacity = Math.min(0.85, mat.opacity + dt * 5.0);
              const posAttr = co2Points.geometry.attributes.position as THREE.BufferAttribute;
              const posArray = posAttr.array as Float32Array;
              const vels = venue.co2Group.userData.velocities as Float32Array;

              for (let i = 0; i < posArray.length / 3; i++) {
                posArray[i * 3 + 1] += vels[i * 3 + 1]! * dt;
                posArray[i * 3 + 2] += vels[i * 3 + 2]! * dt;

                // reset particles when flying out
                if (posArray[i * 3 + 1]! > 7) {
                  const side = i % 2 === 0 ? -4 : 4;
                  posArray[i * 3] = side + (Math.random() - 0.5) * 0.4;
                  posArray[i * 3 + 1] = 0.2;
                  posArray[i * 3 + 2] = -1;
                }
              }
              posAttr.needsUpdate = true;
            } else {
              mat.opacity = Math.max(0, mat.opacity - dt * 2.5);
            }
          }
        }

        // VIP Pyrotechnics Firework Particle Animation
        if (venue.fireworkGroup) {
          const fwUntil = useLiveStore.getState().fireworkActiveUntil;
          const isFwActive = fwUntil > Date.now();
          const fwPoints = venue.fireworkGroup.children[0] as THREE.Points | undefined;
          if (fwPoints && fwPoints.material) {
            const mat = fwPoints.material as THREE.PointsMaterial;
            if (isFwActive) {
              mat.opacity = Math.min(0.9, mat.opacity + dt * 6.0);
              const posAttr = fwPoints.geometry.attributes.position as THREE.BufferAttribute;
              const posArray = posAttr.array as Float32Array;
              const vels = venue.fireworkGroup.userData.velocities as Float32Array;

              for (let i = 0; i < posArray.length / 3; i++) {
                posArray[i * 3] += vels[i * 3]! * dt;
                posArray[i * 3 + 1] += vels[i * 3 + 1]! * dt;
                posArray[i * 3 + 2] += vels[i * 3 + 2]! * dt;
                vels[i * 3 + 1]! -= 4.0 * dt;

                if (posArray[i * 3 + 1]! < 0.2 || posArray[i * 3 + 1]! > 8) {
                  posArray[i * 3] = (Math.random() - 0.5) * 6;
                  posArray[i * 3 + 1] = 0.5;
                  posArray[i * 3 + 2] = -4 + (Math.random() - 0.5) * 2;
                  vels[i * 3 + 1] = 5.0 + Math.random() * 6.0;
                }
              }
              posAttr.needsUpdate = true;
            } else {
              mat.opacity = Math.max(0, mat.opacity - dt * 2.0);
            }
          }
        }

        if (venue.lasers.length) {
          const lasersOn = useLiveStore.getState().laserScannerActive;
          for (const l of venue.lasers) l.visible = lasersOn;
        }

        for (const obj of tickables) getRuntime(obj)?.tick?.(dt, t);

        const mw = mount.clientWidth;
        const mh = mount.clientHeight;
        const projectRig = (rig: PersonRig, pinFloor: boolean) => {
          getRuntime(rig.root)?.tick?.(dt, t);
          if (pinFloor) {
            rig.root.position.x +=
              (rig.targetX - rig.root.position.x) * Math.min(1, dt * 8);
            rig.root.position.z +=
              (rig.targetZ - rig.root.position.z) * Math.min(1, dt * 8);
            rig.root.position.y = 0.12;
          }

          tmp.set(0, 1.95, 0);
          rig.root.localToWorld(tmp);
          tmp.project(camera);
          const featured = rig.id === focusedId;
          if (tmp.z >= 1) {
            if (rig.label.style.display !== "none")
              rig.label.style.display = "none";
          } else {
            if (rig.label.style.display !== "block")
              rig.label.style.display = "block";
            rig.label.style.left = `${((tmp.x * 0.5 + 0.5) * mw) | 0}px`;
            rig.label.style.top = `${((-tmp.y * 0.5 + 0.5) * mh) | 0}px`;
            rig.label.style.transform = featured
              ? "translate(-50%, -100%) scale(1.18)"
              : "translate(-50%, -100%) scale(1)";
            rig.label.style.borderColor = featured
              ? "rgba(255,236,180,.95)"
              : "rgba(255,255,255,.45)";
            if (featured) {
              rig.label.style.boxShadow = "0 0 18px rgba(255,220,140,.7)";
            }
          }
        };
        for (const rig of people.values()) projectRig(rig, true);
        for (const rig of talent.values()) projectRig(rig, false);

        const roster = [...people.values()];
        const crowd = roster.length;
        let span = 2;
        for (const rig of roster) {
          span = Math.max(span, Math.abs(rig.root.position.x), Math.abs(rig.targetX));
        }
        const pull = Math.min(10, Math.max(0, crowd - 3) * 0.85 + Math.max(0, span - 2.4) * 1.1);
        const widePos = homePos.clone();
        widePos.y += pull * 0.28;
        widePos.z += pull;

        if (pendingFocusName) {
          const hit = roster.find(
            (r) => r.name.toLowerCase() === pendingFocusName!.toLowerCase(),
          );
          if (hit) {
            focusedId = hit.id;
            pendingFocusName = null;
          }
        }
        if (t >= focusUntil) {
          focusedId = null;
          pendingFocusName = null;
        }

        if (
          t >= giftLockUntil &&
          t >= focusUntil &&
          t >= nextSpotlightAt &&
          roster.length
        ) {
          const live = useLiveStore.getState().dancers.filter((d) => !d.isDemo);
          const liveIds = new Set(live.map((d) => d.id));
          const preferred =
            liveIds.size > 0
              ? roster.filter((r) => liveIds.has(r.id))
              : roster;
          const pool = preferred.filter((r) => r.id !== lastSpotlightId);
          const src = pool.length ? pool : preferred;
          const pick = src[(Math.random() * src.length) | 0];
          if (pick) {
            focusedId = pick.id;
            lastSpotlightId = pick.id;
            pendingFocusName = null;
            focusUntil = t + 6.2;
            nextSpotlightAt = t + 19 + Math.random() * 4;
            cameraGiftPunch(camera, 0.42);
          } else {
            nextSpotlightAt = t + 20;
          }
        }

        const featured = focusedId
          ? (people.get(focusedId) ?? null)
          : null;
        if (featured) {
          const x = featured.root.position.x;
          const z = featured.root.position.z;
          posGoal.set(x * 0.22, preview ? 3.0 : 3.2, preview ? 8.8 : 9.8);
          lookGoal.set(x, 1.28, z);
          followTarget.position.set(x, 1.25, z);
          followSpot.position.set(x * 0.2, 6.8, z + 5.2);
          followSpot.intensity = preview ? 16 : 26;
        } else {
          posGoal.copy(widePos);
          lookGoal.copy(homeLook);
          followTarget.position.set(0, 1.3, 1.2);
          followSpot.position.set(0, 8.2, 8);
          followSpot.intensity = 8;
        }
        followSpot.target.updateMatrixWorld();

        if (t >= giftLockUntil) {
          const k = 1 - Math.exp(-dt * 2.35);
          camera.position.lerp(posGoal, k);
          lookNow.lerp(lookGoal, k);
          camera.lookAt(lookNow);
        }

        if (fx) fx.render();
        else renderer?.render(scene, camera);
      };
      tick();

      let resizePending = false;
      ro = new ResizeObserver(() => {
        if (resizePending || !renderer) return;
        resizePending = true;
        requestAnimationFrame(() => {
          resizePending = false;
          if (!alive || !renderer) return;
          const nw = Math.max(mount.clientWidth, 320);
          const nh = Math.max(mount.clientHeight, 240);
          const ndpr = Math.min(window.devicePixelRatio || 1, dprCap);
          const newAspect = nw / nh;
          camera.aspect = newAspect;
          const defaultFov = preview ? 42 : 38;
          camera.fov =
            newAspect < 1.0
              ? Math.min(70, Math.max(54, 2 * Math.atan(Math.tan((defaultFov * Math.PI) / 360) / newAspect) * (180 / Math.PI)))
              : defaultFov;
          camera.updateProjectionMatrix();
          renderer.setPixelRatio(ndpr);
          renderer.setSize(nw, nh, false);
          fx?.resize(nw, nh, ndpr);
        });
      });
      ro.observe(mount);
    };

    void boot().catch((e) => console.error("[DanceFloor] boot failed", e));

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      unsub?.();
      ro?.disconnect();
      for (const rig of [...people.values(), ...talent.values()]) {
        getRuntime(rig.root)?.dispose?.();
        rig.label.remove();
      }
      people.clear();
      talent.clear();
      if (fx) {
        gsap.killTweensOf(fx.bloom);
        fx.dispose();
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentElement === mount) {
          mount.removeChild(renderer.domElement);
        }
      }
    };
  }, [preview, prefTick]);

  return (
    <div
      className={
        className ?? "relative h-full w-full min-h-[320px] bg-[#0a0612]"
      }
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div ref={mountRef} className="absolute inset-0" />
      <div
        ref={labelLayerRef}
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      />
    </div>
  );
}
