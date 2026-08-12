import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Disc3,
  ExternalLink,
  Gift,
  Mic,
  Radio,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DanceFloor } from "@/components/overlay/DanceFloor";
import { getProfile, listProfiles } from "@/lib/config/profiles-data";
import { isGlbPreferred, setGlbPreferred } from "@/lib/img2threejs";
import { CLUB_GLTF, getGltfProgress, onGltfProgress, preloadGltf } from "@/lib/three/gltf";
import { initLiveSync, useLiveStore } from "@/lib/store/live-store";
import { cn } from "@/lib/utils";

function CopyBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [ok, setOk] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setOk(true);
            toast.success(`${label} copied`);
            setTimeout(() => setOk(false), 1500);
          }}
        >
          {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          Copy
        </Button>
      </div>
      <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-bg/60 p-3 text-xs leading-relaxed text-fg">
        {value}
      </pre>
    </div>
  );
}

export function HostPanel() {
  const profileId = useLiveStore((s) => s.profileId);
  const mode = useLiveStore((s) => s.mode);
  const dancers = useLiveStore((s) => s.dancers);
  const top = useLiveStore((s) => s.top);
  const eventLog = useLiveStore((s) => s.eventLog);
  const platformConnected = useLiveStore((s) => s.platformConnected);
  const mcAudioEnabled = useLiveStore((s) => s.mcAudioEnabled);
  const autoDemo = useLiveStore((s) => s.autoDemo);
  const mcLines = useLiveStore((s) => s.mcLines);

  const setProfileId = useLiveStore((s) => s.setProfileId);
  const setMode = useLiveStore((s) => s.setMode);
  const setPlatform = useLiveStore((s) => s.setPlatform);
  const setMcAudio = useLiveStore((s) => s.setMcAudio);
  const setAutoDemo = useLiveStore((s) => s.setAutoDemo);
  const processChat = useLiveStore((s) => s.processChat);
  const sendGift = useLiveStore((s) => s.sendGift);
  const clearFloor = useLiveStore((s) => s.clearFloor);
  const ensureDemoFloor = useLiveStore((s) => s.ensureDemoFloor);
  const tickHype = useLiveStore((s) => s.tickHype);
  const pushMc = useLiveStore((s) => s.pushMc);

  const [simName, setSimName] = useState("Alex");
  const [simText, setSimText] = useState("1");
  const [giftName, setGiftName] = useState("Sam");
  const [giftValue, setGiftValue] = useState(50);
  const [overlayUrl, setOverlayUrl] = useState("/overlay");
  const [showStackDemos, setShowStackDemos] = useState(false);
  const [useGlb, setUseGlb] = useState(true);
  const [floorKey, setFloorKey] = useState(0);
  const [gltfStatus, setGltfStatus] = useState("GLTFLoader idle");
  const [gltfBusy, setGltfBusy] = useState(false);

  const p = useMemo(() => getProfile(profileId), [profileId]);
  const profiles = listProfiles();

  useEffect(() => {
    setOverlayUrl(`${window.location.origin}/overlay`);
    const preferred = isGlbPreferred();
    setUseGlb(preferred);
    // ensure key exists so overlay tabs share default ON
    if (window.localStorage.getItem("quanbar-use-glb") === null) {
      setGlbPreferred(true);
    }
    const stop = initLiveSync();
    ensureDemoFloor();
    const hype = window.setInterval(() => tickHype(), 15_000);
    const unprog = onGltfProgress((url, loaded, total) => {
      const name = url.split("/").pop() ?? url;
      setGltfStatus(`Loading ${name}… ${total ? Math.round((loaded / total) * 100) : 0}%`);
    });
    return () => {
      stop();
      window.clearInterval(hype);
      unprog();
    };
  }, [ensureDemoFloor, tickHype]);

  const livePackText = [
    `TITLE:\n${p.livePack.title}`,
    `DESCRIPTION:\n${p.livePack.description}`,
    `PINNED COMMENT:\n${p.livePack.pinned}`,
    `FIRST 60s SCRIPT:\n${p.livePack.first60s}`,
  ].join("\n\n");

  const checklist = [
    {
      ok: platformConnected !== "none",
      label: "Connect platform (or use Demo for rehearsal)",
    },
    { ok: true, label: `OBS browser source → ${overlayUrl}` },
    {
      ok: true,
      label: `Resolution: portrait ${p.obs.portrait} or landscape ${p.obs.landscape}`,
    },
    {
      ok: autoDemo,
      label: "Empty-room demo floor ON (floor never looks dead)",
    },
    {
      ok: profileId === "global-en",
      label: "Global EN profile active for overseas live",
    },
  ];

  const wingGifts = [
    { v: 10, label: "Glow · 10", gift: "Sparkle" },
    { v: 50, label: "Neon wings · 50", gift: "Rose Pack" },
    { v: 200, label: "Angel · 200", gift: "Galaxy" },
    { v: 1000, label: "Phoenix · 1000", gift: "Universe" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header className="panel-card neon-border overflow-hidden">
        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary/20 blur-3xl" />
          <p className="font-display text-xs uppercase tracking-[0.3em] text-accent">
            QuanBar · Host Control
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            {p.showBrand}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{p.oneLiner}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-bg/50 px-3 py-1 text-xs text-fg">
              Profile: {p.label}
            </span>
            <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent">
              Three.js GLTFLoader
            </span>
            <span className="rounded-full border border-border bg-bg/50 px-3 py-1 text-xs text-fg">
              Avatars: {useGlb ? "GLB skinned" : "procedural"}
            </span>
            <span className="rounded-full border border-border bg-bg/50 px-3 py-1 text-xs text-fg">
              Floor: {dancers.length}
            </span>
          </div>
        </div>
      </header>

      <section className="panel-card overflow-hidden neon-border">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              3D venue + GLTF
            </h2>
            <p className="text-xs text-muted">{gltfStatus}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={gltfBusy}
              onClick={async () => {
                setGltfBusy(true);
                setGltfStatus("Preloading Soldier.glb + Xbot.glb…");
                try {
                  await preloadGltf([CLUB_GLTF.soldier, CLUB_GLTF.xbot, CLUB_GLTF.robot]);
                  const st = getGltfProgress();
                  setGltfStatus(
                    `Cache ready · ${st.ready} pack(s) · Soldier + Xbot + Robot`,
                  );
                  toast.success("GLTF models cached");
                } catch (e) {
                  setGltfStatus("GLTF preload failed");
                  toast.error(String(e));
                } finally {
                  setGltfBusy(false);
                }
              }}
            >
              Preload GLB
            </Button>
            <Button
              size="sm"
              variant={useGlb ? "neon" : "secondary"}
              onClick={() => {
                const next = !useGlb;
                setGlbPreferred(next);
                setUseGlb(next);
                setFloorKey((k) => k + 1);
                toast.message(
                  next
                    ? "GLB skinned ON — uses GLTFLoader (reload overlay)"
                    : "Procedural humans ON",
                );
              }}
            >
              {useGlb ? "GLB avatars ON" : "GLB avatars OFF"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/overlay" target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                Full overlay
              </a>
            </Button>
          </div>
        </div>
        <div className="h-[min(48vh,380px)] w-full">
          <DanceFloor key={floorKey} preview className="h-full w-full" />
        </div>
      </section>

      <section className="panel-card p-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-accent">
          GLTF asset paths
        </h2>
        <pre className="mt-2 overflow-auto rounded-lg border border-border bg-bg/50 p-3 font-mono text-[11px] text-muted">
{`public/models/Soldier.glb · Xbot.glb · RobotExpressive.glb  (dancers)
public/models/DjBooth.glb · BarCounter.glb · HighTop.glb
public/models/LoungeTable.glb · SpeakerStack.glb · SheenChair.glb
public/models/NeonBarSign.glb · EntranceDoors.glb · BoomBox.glb

// code
import { loadGltf, instantiateGltf, createGltfMixer } from "@/lib/three/gltf";
import { createGlbProp } from "@/lib/three/createGlbProp";

const pack = await loadGltf("/models/Soldier.glb");
const root = instantiateGltf(pack, { height: 1.72, ground: true });
const anim = createGltfMixer(root);
anim.play("Idle");`}
        </pre>
        <p className="mt-2 text-[11px] text-muted">
          Drop more <code className="text-fg">.glb</code> into{" "}
          <code className="text-fg">public/models/</code> then{" "}
          <code className="text-fg">createGlbProp(url)</code>.
        </p>
      </section>

      <section className="panel-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              R3F / Spline demos
            </h2>
            <p className="text-xs text-muted">Off by default (extra WebGL).</p>
          </div>
          <Button
            size="sm"
            variant={showStackDemos ? "neon" : "secondary"}
            onClick={() => setShowStackDemos((v) => !v)}
          >
            {showStackDemos ? "Hide demos" : "Show demos"}
          </Button>
        </div>
        {showStackDemos && <StackDemos />}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="panel-card p-5">
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              Live profile
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {profiles.map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => setProfileId(pr.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-colors",
                    profileId === pr.id
                      ? "border-accent bg-accent/10 neon-border"
                      : "border-border bg-bg/40 hover:bg-surface-2",
                  )}
                >
                  <p className="font-semibold text-fg">{pr.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{pr.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={mode === "club" ? "neon" : "secondary"}
                onClick={() => setMode("club")}
              >
                <Disc3 className="size-4" />
                Club mode
              </Button>
              <Button
                variant={mode === "fortune" ? "neon" : "secondary"}
                onClick={() => setMode("fortune")}
              >
                <Wand2 className="size-4" />
                Fortune mode
              </Button>
            </div>
          </section>

          <section className="panel-card p-5">
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              Global Live Checklist
            </h2>
            <ul className="mt-3 space-y-2">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-start gap-2 text-sm">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      c.ok
                        ? "bg-success/20 text-success"
                        : "bg-warning/20 text-warning",
                    )}
                  >
                    {c.ok ? "✓" : "!"}
                  </span>
                  <span className="text-fg">{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(overlayUrl);
                  toast.success("Overlay URL copied");
                }}
              >
                <Copy className="size-3.5" />
                Copy overlay URL
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/overlay" target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open overlay
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/content">
                  <Sparkles className="size-3.5" />
                  Content pack
                </a>
              </Button>
            </div>
          </section>

          <section className="panel-card p-5">
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              Connect & MC
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["demo", "Demo / Rehearsal"],
                  ["tiktok", "TikTok"],
                  ["youtube", "YouTube"],
                  ["facebook", "Facebook"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  size="sm"
                  variant={platformConnected === id ? "default" : "secondary"}
                  onClick={() => {
                    setPlatform(id);
                    pushMc(
                      p.language === "en"
                        ? `Platform set: ${label}`
                        : `Nền tảng: ${label}`,
                    );
                  }}
                >
                  <Radio className="size-3.5" />
                  {label}
                </Button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={mcAudioEnabled ? "neon" : "secondary"}
                onClick={() => setMcAudio(!mcAudioEnabled)}
              >
                <Mic className="size-3.5" />
                MC audio {mcAudioEnabled ? "ON" : "OFF"}
              </Button>
              <Button
                size="sm"
                variant={autoDemo ? "neon" : "secondary"}
                onClick={() => setAutoDemo(!autoDemo)}
              >
                <Users className="size-3.5" />
                Auto-demo floor {autoDemo ? "ON" : "OFF"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => ensureDemoFloor()}>
                Fill demo dancers
              </Button>
              <Button size="sm" variant="ghost" onClick={() => clearFloor()}>
                Clear floor
              </Button>
            </div>
          </section>

          <section className="panel-card p-5">
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              Chat / gift simulator
            </h2>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                placeholder="Username"
              />
              <input
                className="h-10 flex-[2] rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Chat message"
                onKeyDown={(e) => {
                  if (e.key === "Enter") processChat(simName, simText);
                }}
              />
              <Button onClick={() => processChat(simName, simText)}>Send</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["1", "0", "dance", "style", "skin"].map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant="secondary"
                  onClick={() => processChat(simName, c)}
                >
                  {c}
                </Button>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Gift → wings
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted">Gifter</label>
                  <input
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
                    value={giftName}
                    onChange={(e) => setGiftName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Value</label>
                  <input
                    type="number"
                    className="mt-1 h-10 w-28 rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
                    value={giftValue}
                    onChange={(e) => setGiftValue(Number(e.target.value) || 1)}
                  />
                </div>
                <Button
                  variant="default"
                  onClick={() => sendGift(giftName, "Rose Pack", giftValue)}
                >
                  <Gift className="size-4" />
                  Send gift
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {wingGifts.map((g) => (
                  <Button
                    key={g.v}
                    size="sm"
                    variant={g.v >= 200 ? "neon" : "secondary"}
                    onClick={() => {
                      setGiftValue(g.v);
                      sendGift(giftName, g.gift, g.v);
                      toast.success(`${g.label} → ${giftName}`);
                    }}
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="panel-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm uppercase tracking-wider text-accent">
                Copy live pack
              </h2>
              <Button
                size="sm"
                variant="neon"
                onClick={async () => {
                  await navigator.clipboard.writeText(livePackText);
                  toast.success("Full live pack copied");
                }}
              >
                <Copy className="size-3.5" />
                Copy all
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              <CopyBlock label="Stream title" value={p.livePack.title} />
              <CopyBlock label="Description" value={p.livePack.description} />
              <CopyBlock label="Pinned comment" value={p.livePack.pinned} />
              <CopyBlock label="First 60s host script" value={p.livePack.first60s} />
            </div>
          </section>

          <section className="panel-card p-5">
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              MC feed
            </h2>
            <ul className="mt-3 max-h-40 space-y-2 overflow-auto">
              {mcLines.length === 0 && (
                <li className="text-xs text-muted">No lines yet.</li>
              )}
              {mcLines.map((l) => (
                <li
                  key={l.id}
                  className="rounded-lg border border-border/60 bg-bg/40 px-3 py-2 text-xs text-fg"
                >
                  {l.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-card p-5">
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              TOP board
            </h2>
            <ol className="mt-2 space-y-1">
              {top.length === 0 && (
                <li className="text-xs text-muted">No gifts yet.</li>
              )}
              {top.map((t, i) => (
                <li key={t.name} className="flex justify-between text-sm">
                  <span>
                    {i + 1}. {t.name}
                  </span>
                  <span className="tabular-nums text-accent">{t.total}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel-card p-5">
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              Event log
            </h2>
            <ul className="mt-2 max-h-36 space-y-1 overflow-auto font-mono text-[11px] text-muted">
              {eventLog.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function StackDemos() {
  const [mods, setMods] = useState<{
    R3FCanvas: typeof import("@/components/r3f/R3FCanvas").R3FCanvas;
    ClubScene: typeof import("@/components/overlay/ClubScene").ClubScene;
    SplineBrand: typeof import("@/components/r3f/SplineBrand").SplineBrand;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      import("@/components/r3f/R3FCanvas"),
      import("@/components/overlay/ClubScene"),
      import("@/components/r3f/SplineBrand"),
    ]).then(([a, b, c]) => {
      if (alive)
        setMods({
          R3FCanvas: a.R3FCanvas,
          ClubScene: b.ClubScene,
          SplineBrand: c.SplineBrand,
        });
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!mods) {
    return <p className="mt-3 text-xs text-muted">Loading demos…</p>;
  }
  const { R3FCanvas, ClubScene, SplineBrand } = mods;
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <div className="h-[200px] overflow-hidden rounded-xl border border-border">
        <R3FCanvas transparent={false} camera={{ position: [0, 2.2, 6.5], fov: 42 }}>
          <ClubScene />
        </R3FCanvas>
      </div>
      <div className="h-[200px] overflow-hidden rounded-xl border border-border">
        <SplineBrand className="h-full rounded-none" forceFallback />
      </div>
    </div>
  );
}
