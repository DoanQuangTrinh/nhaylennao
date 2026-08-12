import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useLiveStore, type Dancer } from "@/lib/store/live-store";
import {
  cameraGiftPunch,
  cameraVenueIntro,
  gsap,
} from "@/lib/3d/gsap-core";
import {
  createModelCharacter,
  getRuntime,
  isGlbPreferred,
  preloadGlbCharacters,
  enableShadows,
} from "@/lib/img2threejs";
import { buildClubVenue } from "@/lib/three/buildClubVenue";
import { createClubComposer } from "@/lib/three/postfx";

type PersonRig = {
  id: string;
  root: THREE.Group;
  label: HTMLDivElement;
  targetX: number;
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
export function DanceFloor({ className, preview = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);

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
    const preferGlb = isGlbPreferred();

    const boot = async () => {
      const w = Math.max(mount.clientWidth, 320);
      const h = Math.max(mount.clientHeight, 240);
      const dprCap = preview ? 1.25 : 1.5;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

      // ── Renderer: shadows + PCF soft + ACES ─────────────────────────────
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x0a0612, 1);
      mount.appendChild(renderer.domElement);
      Object.assign(renderer.domElement.style, {
        width: "100%",
        height: "100%",
        display: "block",
      });

      const camera = new THREE.PerspectiveCamera(
        preview ? 48 : 46,
        w / h,
        0.1,
        90,
      );
      const camTarget = preview
        ? { x: 0, y: 5.2, z: 16.5 }
        : { x: 0, y: 5.6, z: 17.5 };
      cameraVenueIntro(
        camera,
        camTarget,
        new THREE.Vector3(0, 1.5, -1.8),
        preview ? 1.2 : 2.0,
      );

      // ── Async GLB venue (characters/DJ/tables via GLTFLoader) ───────────
      const venue = await buildClubVenue(preview);
      if (!alive || !renderer) {
        return;
      }
      const { scene, rings, p1, p2, p3, spots, beams, tickables } = venue;

      // ── Post: EffectComposer + UnrealBloomPass ──────────────────────────
      fx = createClubComposer(renderer, scene, camera, {
        strength: 0.32,
        radius: 0.4,
        threshold: 0.78,
      });

      const clock = new THREE.Clock();
      const tmp = new THREE.Vector3();
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

      preloadGlbCharacters()
        .then(() => {
          if (!alive) return;
          glbReady = true;
          for (const rig of people.values()) removeRig(rig);
          people.clear();
          lastFp = "";
          needsSync = true;
        })
        .catch(() => {
          glbReady = false;
        });

      const removeRig = (rig: PersonRig) => {
        getRuntime(rig.root)?.dispose?.();
        gsap.killTweensOf(rig.root.scale);
        scene.remove(rig.root);
        rig.label.remove();
      };

      const spawnDancer = async (
        d: Dancer,
        index: number,
      ): Promise<PersonRig> => {
        const root = await createModelCharacter({
          style: d.style,
          skin: d.skin,
          dancing: d.dancing,
          wingTier: d.wingTier,
          auraUntil: d.auraUntil,
          role: "dancer",
          prefer: preferGlb ? "auto" : "fashion",
        });
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

      const syncPeople = (list: Dancer[]) => {
        const ids = new Set(list.map((d) => d.id));
        for (const [id, rig] of people) {
          if (!ids.has(id)) {
            removeRig(rig);
            people.delete(id);
          }
        }
        const spacing = Math.min(1.55, 6.4 / Math.max(list.length, 1));
        list.forEach((d, i) => {
          const idx = i;
          const targetX = (i - (list.length - 1) / 2) * spacing;
          const existing = people.get(d.id);
          if (existing) {
            if (needsRebuild(existing, d) && !pending.has(d.id)) {
              pending.add(d.id);
              void spawnDancer(d, idx).then((created) => {
                pending.delete(d.id);
                if (!alive) return;
                removeRig(existing);
                created.targetX = targetX;
                created.root.position.set(targetX, 0.12, 1.2);
                scene.add(created.root);
                labelLayer.appendChild(created.label);
                people.set(d.id, created);
              });
            } else {
              existing.targetX = targetX;
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
          void spawnDancer(d, idx).then((created) => {
            pending.delete(d.id);
            if (!alive) return;
            created.targetX = targetX;
            created.root.position.set(targetX, 0.12, 1.2);
            scene.add(created.root);
            labelLayer.appendChild(created.label);
            people.set(d.id, created);
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
        if (!alive || !fx) return;
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
          cameraGiftPunch(
            camera,
            g0.effect === "legendary"
              ? 1.3
              : g0.effect === "mega"
                ? 1.0
                : 0.65,
          );
          const s0 = fx.bloom.strength;
          gsap.fromTo(
            fx.bloom,
            { strength: Math.min(s0 + 0.25, 0.55) },
            { strength: s0, duration: 0.65, ease: "power2.out" },
          );
        }

        // Floor rings spin
        for (let i = 0; i < rings.length; i++) {
          rings[i]!.rotation.z = t * (0.12 + i * 0.04) * (i % 2 ? -1 : 1);
        }

        // Dynamic club lights
        p1.intensity = 5.5 + Math.sin(t * 1.4) * 1.2;
        p2.intensity = 5.0 + Math.cos(t * 1.2) * 1.0;
        p3.intensity = 4.0 + Math.sin(t * 1.0) * 0.8;
        p1.position.x = 4.5 + Math.sin(t * 0.6) * 1.2;
        p2.position.x = -4.5 + Math.cos(t * 0.5) * 1.2;

        // Spot sweeps
        for (let i = 0; i < spots.length; i++) {
          const sp = spots[i]!;
          const phase = t * (0.4 + i * 0.15) + i;
          sp.target.position.x = Math.sin(phase) * 3.5;
          sp.target.position.z = Math.cos(phase * 0.8) * 2.5;
          sp.target.updateMatrixWorld();
          sp.intensity = 18 + Math.sin(t * 1.6 + i) * 6;
        }

        // Ceiling beam sway
        for (let i = 0; i < beams.length; i++) {
          const b = beams[i]!;
          b.rotation.z = 0.15 + Math.sin(t * 0.9 + i) * 0.25;
          b.rotation.x = Math.sin(t * 0.7 + i * 0.5) * 0.12;
        }

        for (const obj of tickables) getRuntime(obj)?.tick?.(dt, t);

        const mw = mount.clientWidth;
        const mh = mount.clientHeight;
        for (const rig of people.values()) {
          getRuntime(rig.root)?.tick?.(dt, t);
          rig.root.position.x +=
            (rig.targetX - rig.root.position.x) * Math.min(1, dt * 8);
          if (Math.abs(rig.root.position.z - 1.2) > 0.001) {
            rig.root.position.z +=
              (1.2 - rig.root.position.z) * Math.min(1, dt * 6);
          }
          rig.root.position.y = 0.12;

          tmp.set(0, 1.95, 0);
          rig.root.localToWorld(tmp);
          tmp.project(camera);
          if (tmp.z >= 1) {
            if (rig.label.style.display !== "none")
              rig.label.style.display = "none";
          } else {
            if (rig.label.style.display !== "block")
              rig.label.style.display = "block";
            rig.label.style.left = `${((tmp.x * 0.5 + 0.5) * mw) | 0}px`;
            rig.label.style.top = `${((-tmp.y * 0.5 + 0.5) * mh) | 0}px`;
          }
        }

        fx.render();
      };
      tick();

      let resizePending = false;
      ro = new ResizeObserver(() => {
        if (resizePending || !renderer || !fx) return;
        resizePending = true;
        requestAnimationFrame(() => {
          resizePending = false;
          if (!alive || !renderer || !fx) return;
          const nw = Math.max(mount.clientWidth, 320);
          const nh = Math.max(mount.clientHeight, 240);
          const ndpr = Math.min(window.devicePixelRatio || 1, dprCap);
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setPixelRatio(ndpr);
          renderer.setSize(nw, nh, false);
          fx.resize(nw, nh, ndpr);
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
      for (const rig of people.values()) {
        getRuntime(rig.root)?.dispose?.();
        rig.label.remove();
      }
      people.clear();
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
  }, [preview]);

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
