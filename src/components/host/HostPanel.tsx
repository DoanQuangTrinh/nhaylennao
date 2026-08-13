import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
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
  Wine,
  Flame,
  Volume2,
  Zap,
  Play,
} from "lucide-react";
import { BAR_MENU } from "@/lib/config/bar-data";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getProfile, listProfiles } from "@/lib/config/profiles-data";
import { isGlbPreferred, setGlbPreferred } from "@/lib/img2threejs/glbPrefs";
import { initLiveSync, useLiveStore } from "@/lib/store/live-store";
import { cn } from "@/lib/utils";
import {
  connectTikTokLive,
  disconnectTikTokLive,
  pullTikTokLiveEvents,
} from "@/lib/live/livestream-service";
import { dispatchLiveEventToStore } from "@/lib/live/live-event-bridge";
import { setGeminiLiveKey, unlockMcSpeech } from "@/lib/audio/mc-speech";
import { connectGeminiLive, getGeminiLiveStatus } from "@/lib/ai/gemini-live";
import { BIDI_GEMINI_MODELS, isGeminiBidiLive, startGeminiBidi, stopGeminiBidi } from "@/lib/ai/gemini-bidi-client";
import { AVAILABLE_GEMINI_MODELS } from "@/lib/ai/gemini-comment-reply";

const DanceFloorClient = lazy(() =>
  import("@/components/overlay/DanceFloorClient").then((m) => ({
    default: m.DanceFloorClient,
  })),
);

const CharacterRoster = lazy(() =>
  import("@/components/host/CharacterRoster").then((m) => ({
    default: m.CharacterRoster,
  })),
);

const PROFILE_VI: Record<string, { title: string; hint: string }> = {
  "local-vi": {
    title: "Khán giả Việt",
    hint: "Livestream quán bar tiếng Việt",
  },
  "global-en": {
    title: "Khán giả quốc tế",
    hint: "Livestream tiếng Anh — Neon Club",
  },
};

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setOk(true);
            toast.success(`Đã sao chép: ${label}`);
            setTimeout(() => setOk(false), 1500);
          }}
        >
          {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          Chép
        </Button>
      </div>
      <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-bg/60 p-3 text-xs leading-relaxed text-fg">
        {value}
      </pre>
    </div>
  );
}

function Section({
  step,
  title,
  hint,
  children,
}: {
  step?: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel-card p-5">
      <header className="mb-4">
        {step ? (
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            Bước {step}
          </p>
        ) : null}
        <h2 className="mt-1 text-base font-semibold text-fg">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      </header>
      {children}
    </section>
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
  const aiReplyEnabled = useLiveStore((s) => s.aiReplyEnabled);
  const geminiApiKey = useLiveStore((s) => s.geminiApiKey);
  const geminiModel = useLiveStore((s) => s.geminiModel);
  const cooldownMs = useLiveStore((s) => s.cooldownMs);
  const recentReplies = useLiveStore((s) => s.recentReplies);
  const setAiReplyEnabled = useLiveStore((s) => s.setAiReplyEnabled);
  const setGeminiApiKey = useLiveStore((s) => s.setGeminiApiKey);
  const setGeminiModel = useLiveStore((s) => s.setGeminiModel);
  const setCooldownMs = useLiveStore((s) => s.setCooldownMs);
  const mcLines = useLiveStore((s) => s.mcLines);
  const drinkOrders = useLiveStore((s) => s.drinkOrders);
  const barMusicPlaying = useLiveStore((s) => s.barMusicPlaying);
  const barBpm = useLiveStore((s) => s.barBpm);
  const laserScannerActive = useLiveStore((s) => s.laserScannerActive);
  const barMusicGenre = useLiveStore((s) => s.barMusicGenre);

  const setProfileId = useLiveStore((s) => s.setProfileId);
  const setMode = useLiveStore((s) => s.setMode);
  const setPlatform = useLiveStore((s) => s.setPlatform);
  const setMcAudio = useLiveStore((s) => s.setMcAudio);
  const setAutoDemo = useLiveStore((s) => s.setAutoDemo);
  const processChat = useLiveStore((s) => s.processChat);
  const sendGift = useLiveStore((s) => s.sendGift);
  const orderDrink = useLiveStore((s) => s.orderDrink);
  const triggerCo2Jet = useLiveStore((s) => s.triggerCo2Jet);
  const toggleBarMusic = useLiveStore((s) => s.toggleBarMusic);
  const setBarBpm = useLiveStore((s) => s.setBarBpm);
  const triggerSfx = useLiveStore((s) => s.triggerSfx);
  const triggerFirework = useLiveStore((s) => s.triggerFirework);
  const toggleLaserScanner = useLiveStore((s) => s.toggleLaserScanner);
  const setMusicGenre = useLiveStore((s) => s.setMusicGenre);
  const clearFloor = useLiveStore((s) => s.clearFloor);
  const ensureDemoFloor = useLiveStore((s) => s.ensureDemoFloor);
  const tickHype = useLiveStore((s) => s.tickHype);
  const pushMc = useLiveStore((s) => s.pushMc);

  const [simName, setSimName] = useState("Minh");
  const [simText, setSimText] = useState("1");
  const [customMcText, setCustomMcText] = useState("");
  const [giftName, setGiftName] = useState("Lan");
  const [giftValue, setGiftValue] = useState(50);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [tiktokId, setTiktokId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("quanbar-tiktok-id") || "";
  });
  const [geminiLiveOn, setGeminiLiveOn] = useState(false);
  const [geminiLiveModel, setGeminiLiveModel] = useState<string | null>(null);
  const [geminiLiveBusy, setGeminiLiveBusy] = useState(false);
  const [bidiMicOn, setBidiMicOn] = useState(false);
  const [bidiStatus, setBidiStatus] = useState("");
  const [tiktokSessionId, setTiktokSessionId] = useState("");
  const [tikToolsApiKey, setTikToolsApiKey] = useState("");
  const [liveStatus, setLiveStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveViewers, setLiveViewers] = useState(0);
  const [isConnectingLive, setIsConnectingLive] = useState(false);
  const [overlayUrl, setOverlayUrl] = useState("/overlay");
  const [useGlb, setUseGlb] = useState(true);
  const [floorKey, setFloorKey] = useState(0);
  const [gltfStatus, setGltfStatus] = useState("Sàn đang chờ…");
  const [showScripts, setShowScripts] = useState(false);

  const [charMode, setCharModeState] = useState<"stl" | "glb" | "human" | "photo">(
    () => {
      if (typeof window === "undefined") return "glb";
      const raw = window.localStorage.getItem("quanbar-char-mode");
      if (raw === "glb" || raw === "human" || raw === "photo" || raw === "stl") {
        return raw;
      }
      return "glb";
    },
  );

  const setCharMode = (mode: "stl" | "glb" | "human" | "photo") => {
    setCharModeState(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("quanbar-char-mode", mode);
    }
    setGlbPreferred(mode === "glb");
    setUseGlb(mode === "glb");
    setFloorKey((k) => k + 1);
    toast.success(
      mode === "glb"
        ? "Sàn dùng model nhảy Mixamo"
        : mode === "human"
          ? "Sàn dùng người đơn giản"
          : mode === "stl"
            ? "Sàn dùng file STL"
            : "Sàn dùng ảnh người",
    );
  };

  const p = useMemo(() => getProfile(profileId), [profileId]);
  const profiles = listProfiles();

  useEffect(() => {
    setOverlayUrl(`${window.location.origin}/overlay`);
    const preferred = isGlbPreferred();
    setUseGlb(preferred);
    if (window.localStorage.getItem("quanbar-use-glb") === null) {
      setGlbPreferred(true);
    }
    const stop = initLiveSync();
    ensureDemoFloor();
    const hype = window.setInterval(() => tickHype(), 15_000);
    let unprog: (() => void) | undefined;
    void import("@/lib/three/gltf").then(({ onGltfProgress }) => {
      unprog = onGltfProgress((url, loaded, total) => {
        const name = url.split("/").pop() ?? url;
        setGltfStatus(
          `Đang tải ${name}… ${total ? Math.round((loaded / total) * 100) : 0}%`,
        );
      });
    });
    return () => {
      stop();
      window.clearInterval(hype);
      unprog?.();
    };
  }, [ensureDemoFloor, tickHype]);

  useEffect(() => {
    if (tiktokId.trim()) {
      window.localStorage.setItem("quanbar-tiktok-id", tiktokId.trim());
    }
  }, [tiktokId]);

  useEffect(() => {
    if (geminiApiKey) setGeminiLiveKey(geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    void getGeminiLiveStatus().then((s) => {
      setGeminiLiveOn(!!s.connected);
      setGeminiLiveModel(s.model);
    });
  }, []);

  useEffect(() => {
    if (liveStatus !== "live") return;
    // If Tik.tools Cloud WebSocket is active, all events stream directly to browser.
    // Disable HTTP server polling completely to prevent server load & lag!
    if (tikToolsApiKey.trim()) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const snap = await pullTikTokLiveEvents();
        if (cancelled) return;
        if (snap.viewerCount) setLiveViewers(snap.viewerCount);
        for (const ev of snap.events || []) {
          if (ev.type === "chat") {
            dispatchLiveEventToStore({
              type: "chat",
              nickname: ev.nickname || "Viewer",
              text: ev.text || "",
              platform: "tiktok",
            });
          } else if (ev.type === "gift") {
            dispatchLiveEventToStore({
              type: "gift",
              nickname: ev.nickname || "Viewer",
              giftName: ev.giftName || "Gift",
              diamondCount: ev.diamondCount || 1,
              repeatCount: ev.repeatCount || 1,
              platform: "tiktok",
            });
          } else if (ev.type === "member") {
            dispatchLiveEventToStore({
              type: "member",
              nickname: ev.nickname || "Viewer",
              platform: "tiktok",
            });
          } else if (ev.type === "like") {
            dispatchLiveEventToStore({
              type: "like",
              nickname: ev.nickname || "Viewer",
              likeCount: ev.likeCount || 1,
              platform: "tiktok",
            });
          } else if (ev.type === "follow") {
            dispatchLiveEventToStore({
              type: "follow",
              nickname: ev.nickname || "Viewer",
              platform: "tiktok",
            });
          } else if (ev.type === "roomUser" && ev.viewerCount) {
            dispatchLiveEventToStore({
              type: "roomUser",
              viewerCount: ev.viewerCount,
              platform: "tiktok",
            });
          }
        }
        // Only update status if status changed to avoid re-render state loops
        if (snap.status !== "live" && (snap.status === "idle" || snap.status === "error")) {
          setLiveStatus(snap.status);
          if (snap.errorMessage) setLiveError(snap.errorMessage);
        }
      } catch {
        /* next tick */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 3500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [liveStatus, tikToolsApiKey]);

  const livePackText = [
    `TIÊU ĐỀ:\n${p.livePack.title}`,
    `MÔ TẢ:\n${p.livePack.description}`,
    `GHIM BÌNH LUẬN:\n${p.livePack.pinned}`,
    `KỊCH BẢN 60 GIÂY ĐẦU:\n${p.livePack.first60s}`,
  ].join("\n\n");

  const wingGifts = [
    { v: 10, label: "Phát sáng · 10", gift: "Sparkle" },
    { v: 50, label: "Cánh neon · 50", gift: "Rose Pack" },
    { v: 200, label: "Thiên thần · 200", gift: "Galaxy" },
    { v: 1000, label: "Phượng hoàng · 1000", gift: "Universe" },
  ];

  const chatCmds = [
    { cmd: "1", label: "Vào sàn" },
    { cmd: "0", label: "Rời sàn" },
    { cmd: "dance", label: "Nhảy" },
    { cmd: "style", label: "Đổi điệu" },
    { cmd: "skin", label: "Đổi hình" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">
      <header className="panel-card px-5 py-5 sm:px-7 sm:py-6">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">
          Quán Bar Live
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          Bảng điều khiển
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Mở màn hình livestream, tập khách vào sàn, bắn quà và hiệu ứng. Làm
          trên máy này — khán giả xem tab Overlay.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border bg-bg px-3 py-1 text-fg">
            Trên sàn: {dancers.length} người
          </span>
          <span className="rounded-full border border-border bg-bg px-3 py-1 text-fg">
            {useGlb ? "Model nhảy Mixamo" : "Người đơn giản"}
          </span>
          <span className="rounded-full border border-border bg-bg px-3 py-1 text-fg">
            {platformConnected === "none"
              ? "Chưa chọn nền tảng"
              : platformConnected === "demo"
                ? "Đang tập (Demo)"
                : `Nền tảng: ${platformConnected}`}
          </span>
        </div>
      </header>

      <Section
        step="1"
        title="Mở màn hình livestream (Overlay)"
        hint="Dán link vào OBS/TikTok Live Studio (Browser Source) hoặc mở cửa sổ Window Capture."
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-xs font-semibold text-emerald-400 w-32">Link TikTok Studio:</span>
            <code className="min-h-10 flex-1 overflow-x-auto rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 font-mono font-bold">
              http://localhost:8080/overlay.html
            </code>
            <Button
              size="sm"
              variant="neon"
              onClick={async () => {
                await navigator.clipboard.writeText("http://localhost:8080/overlay.html");
                toast.success("Đã chép link http://localhost:8080/overlay.html");
              }}
            >
              <Copy className="size-3.5" />
              Chép link TikTok
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-xs font-semibold text-muted w-32">Link IP LAN (.html):</span>
            <code className="min-h-10 flex-1 overflow-x-auto rounded-lg border border-border bg-bg px-3 py-2 text-xs text-accent font-mono">
              http://127.0.0.1:8080/overlay.html
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText("http://127.0.0.1:8080/overlay.html");
                toast.success("Đã chép link http://127.0.0.1:8080/overlay.html");
              }}
            >
              <Copy className="size-3.5" />
              Chép link 127.0.0.1
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
            <div className="text-xs text-muted">
              💡 <b>Mẹo TikTok LIVE Studio:</b> Nếu nhập URL bị báo "không hợp lệ", hãy bấm <b>"Mở cửa sổ Overlay"</b> bên cạnh, sau đó trên TikTok Studio chọn <b>Quay Cửa Sổ (Window Capture)</b> chọn cửa sổ Chrome đang mở Sàn 3D!
            </div>
            <Button variant="neon" size="sm" asChild>
              <a href="/overlay" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Mở cửa sổ Overlay (Tab riêng)
              </a>
            </Button>
          </div>
        </div>
      </Section>

      <section className="panel-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-fg">Sàn nhảy xem trước</h2>
            <p className="text-xs text-muted">{gltfStatus}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={charMode === "glb" ? "neon" : "secondary"}
              onClick={() => setCharMode("glb")}
            >
              Model nhảy
            </Button>
            <Button
              size="sm"
              variant={charMode === "human" ? "neon" : "secondary"}
              onClick={() => setCharMode("human")}
            >
              Người đơn giản
            </Button>
            <Button
              size="sm"
              variant={autoDemo ? "neon" : "secondary"}
              onClick={() => {
                setAutoDemo(!autoDemo);
                toast.success(
                  !autoDemo
                    ? "Sàn luôn có người mẫu khi vắng khách"
                    : "Đã tắt người mẫu tự động",
                );
              }}
            >
              <Users className="size-3.5" />
              {autoDemo ? "Giữ sàn đông" : "Sàn trống được"}
            </Button>
          </div>
        </div>
        <div className="h-[min(46vh,360px)] w-full">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center bg-bg text-xs text-muted">
                Đang mở sàn 3D…
              </div>
            }
          >
            <DanceFloorClient key={floorKey} preview className="h-full w-full" />
          </Suspense>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
          <Button size="sm" variant="outline" onClick={() => ensureDemoFloor()}>
            Thêm Aya · Ken · Mia
          </Button>
          <Button size="sm" variant="ghost" onClick={() => clearFloor()}>
            Dọn sàn
          </Button>
        </div>
      </section>

      <Section
        title="Kho nhân vật"
        hint="Xem từng model đang dùng trong source. Cảnh báo = mất texture / dễ trắng. Lỗi = không tải được."
      >
        <Suspense
          fallback={
            <p className="py-8 text-center text-sm text-muted">Đang mở kho nhân vật…</p>
          }
        >
          <CharacterRoster />
        </Suspense>
      </Section>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Section
            step="2"
            title="Khán giả xem bằng tiếng nào?"
            hint="Chọn một lần trước khi lên sóng."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {profiles.map((pr) => {
                const vi = PROFILE_VI[pr.id];
                return (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setProfileId(pr.id)}
                    className={cn(
                      "min-h-14 rounded-xl border px-4 py-3 text-left transition-colors",
                      profileId === pr.id
                        ? "border-accent bg-accent/10"
                        : "border-border bg-bg/40 hover:bg-surface-2",
                    )}
                  >
                    <p className="font-semibold text-fg">{vi?.title ?? pr.label}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {vi?.hint ?? pr.description}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={mode === "club" ? "neon" : "secondary"}
                onClick={() => setMode("club")}
              >
                <Disc3 className="size-4" />
                Quán bar
              </Button>
              <Button
                variant={mode === "fortune" ? "neon" : "secondary"}
                onClick={() => setMode("fortune")}
              >
                <Wand2 className="size-4" />
                Bói vui
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  ["demo", "Tập luyện"],
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
                    pushMc(`Nền tảng: ${label}`);
                  }}
                >
                  <Radio className="size-3.5" />
                  {label}
                </Button>
              ))}
              <Button
                size="sm"
                variant={mcAudioEnabled ? "neon" : "secondary"}
                onClick={() => setMcAudio(!mcAudioEnabled)}
              >
                <Mic className="size-3.5" />
                {mcAudioEnabled ? "Audio Gemini ON" : "Audio Gemini OFF"}
              </Button>
            </div>

            <div className="mt-5 rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-accent animate-pulse" />
                  <p className="text-sm font-semibold text-fg">Kết Nối Livestream Thực (TikTok LIVE / YouTube / FB)</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    liveStatus === "live"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : liveStatus === "connecting"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : liveStatus === "error"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : "bg-surface-2 text-muted border border-border",
                  )}
                >
                  <span className="size-2 rounded-full bg-current" />
                  {liveStatus === "live"
                    ? `Đang LIVE (@${tiktokId || "stream"})`
                    : liveStatus === "connecting"
                      ? "Đang kết nối…"
                      : liveStatus === "error"
                        ? "Lỗi kết nối"
                        : "Chưa kết nối"}
                </span>
              </div>

              <p className="text-xs text-muted leading-relaxed">
                Kênh phải đang phát LIVE. Nhập username (ví dụ @dj_remix_1997) rồi bấm kết nối — chat, quà, tim và follow sẽ hiện trên sàn 3D.
              </p>

              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-xs text-fg font-mono outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Nhập Username TikTok LIVE (ví dụ: @nguyenvana hoặc nguyenvana)"
                    value={tiktokId}
                    onChange={(e) => setTiktokId(e.target.value)}
                  />
                  {liveStatus === "live" ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        await disconnectTikTokLive();
                        setLiveStatus("idle");
                        toast.success("Đã ngắt kết nối TikTok LIVE");
                      }}
                    >
                      Ngắt kết nối
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="neon"
                      disabled={isConnectingLive}
                      onClick={async () => {
                        if (!tiktokId.trim()) {
                          toast.error("Vui lòng nhập Username TikTok LIVE");
                          return;
                        }
                        setIsConnectingLive(true);
                        setLiveStatus("connecting");
                        setLiveError(null);
                        try {
                          const res = await connectTikTokLive({
                            data: {
                              uniqueId: tiktokId,
                              sessionId: tiktokSessionId,
                            },
                          });
                          if (res && res.success) {
                            setLiveStatus("live");
                            setPlatform("tiktok");
                            toast.success(res.message || "Đã kết nối TikTok LIVE");
                          } else {
                            const msg =
                              res?.message ||
                              "Không thể kết nối TikTok LIVE (Kênh đang Offline hoặc sai Username)";
                            setLiveStatus("error");
                            setLiveError(msg);
                            toast.error(msg);
                          }
                        } catch (err: any) {
                          setLiveStatus("error");
                          setLiveError(err.message || String(err));
                          toast.error("Không thể kết nối TikTok LIVE");
                        } finally {
                          setIsConnectingLive(false);
                        }
                      }}
                    >
                      {isConnectingLive ? "Đang nối…" : "Kết nối TikTok LIVE"}
                    </Button>
                  )}
                </div>

                <input
                  type="password"
                  className="h-9 w-full rounded-lg border border-border bg-bg/60 px-3 text-xs text-fg font-mono outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Session ID TikTok (tùy chọn — để trống nếu không có)"
                  value={tiktokSessionId}
                  onChange={(e) => setTiktokSessionId(e.target.value)}
                />
              </div>

              {liveError ? (
                <p className="text-xs font-medium text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  ⚠️ {liveError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    dispatchLiveEventToStore({
                      type: "chat",
                      nickname: "KhánGiả123",
                      text: "Quán bar chất quá!",
                      platform: "tiktok",
                    });
                    toast.success("Giả lập chat TikTok");
                  }}
                >
                  💬 Test TikTok Chat
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    dispatchLiveEventToStore({
                      type: "gift",
                      nickname: "ĐạiGiaTikTok",
                      giftName: "Dragon Castle",
                      diamondCount: 500,
                      repeatCount: 1,
                      platform: "tiktok",
                    });
                    toast.success("Giả lập tặng quà 500 xu (Cánh Phượng Hoàng)");
                  }}
                >
                  🎁 Test Quà VIP (500 xu)
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    dispatchLiveEventToStore({
                      type: "follow",
                      nickname: "FanCứng",
                      platform: "tiktok",
                    });
                    toast.success("Giả lập Follow TikTok");
                  }}
                >
                  ⭐ Test Follow
                </Button>
              </div>
            </div>
          </Section>

          <Section
            step="3"
            title="Tập khách vào sàn"
            hint="Giả lập chat của khán giả. Gõ 1 = vào nhảy, 0 = ra về."
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="h-11 flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                placeholder="Tên khách"
                aria-label="Tên khách"
              />
              <input
                className="h-11 flex-[2] rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Tin nhắn (1 = vào sàn)"
                aria-label="Tin nhắn chat"
                onKeyDown={(e) => {
                  if (e.key === "Enter") processChat(simName, simText);
                }}
              />
              <Button onClick={() => processChat(simName, simText)}>Gửi</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {chatCmds.map((c) => (
                <Button
                  key={c.cmd}
                  size="sm"
                  variant="secondary"
                  onClick={() => processChat(simName, c.cmd)}
                >
                  {c.label}
                </Button>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-accent" />
                  <p className="text-sm font-semibold text-fg">MC Bar AI (Google Gemini API)</p>
                </div>
                <Button
                  size="sm"
                  variant={aiReplyEnabled ? "neon" : "secondary"}
                  onClick={() => {
                    setAiReplyEnabled(!aiReplyEnabled);
                    toast.success(
                      !aiReplyEnabled
                        ? "Đã BẬT tự động trả lời Comment bằng Gemini AI"
                        : "Đã TẮT tự động trả lời Comment",
                    );
                  }}
                >
                  {aiReplyEnabled ? "Đang BẬT Auto AI Reply" : "TẮT Auto AI Reply"}
                </Button>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Tự động dùng Google Gemini AI làm MC Bar sôi động, trả lời bình luận của khán giả ngay khi có comment trong phòng livestream!
              </p>

              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-fg">⏳ Cooldown giữa các câu trả lời:</span>
                  {(
                    [
                      [2000, "2s"],
                      [3000, "3s (Chuẩn)"],
                      [5000, "5s"],
                      [8000, "8s"],
                    ] as const
                  ).map(([ms, label]) => (
                    <button
                      key={ms}
                      type="button"
                      onClick={() => {
                        setCooldownMs(ms);
                        toast.success(`Đã đặt Cooldown AI: ${label}`);
                      }}
                      className={cn(
                        "rounded px-2 py-1 text-xs font-mono transition-colors",
                        cooldownMs === ms
                          ? "bg-accent text-bg font-bold"
                          : "bg-surface-2 text-muted hover:text-fg",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3.5 space-y-2 border-t border-border/40 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
                    🎙️ Model Gemini Live / Native Audio (Bidi):
                  </label>
                  <span className="text-[10px] text-muted">Tự động chọn model tiếp theo nếu lỗi</span>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {BIDI_GEMINI_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setGeminiModel(m.id);
                        toast.success(`Đã chọn mô hình Bidi: ${m.name}`);
                      }}
                      className={cn(
                        "rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-all flex items-center justify-between",
                        geminiModel === m.id
                          ? "border-accent bg-accent/20 text-fg font-bold shadow-sm"
                          : "border-border/60 bg-bg/40 text-muted hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      <span className="truncate pr-1 font-mono text-[11px]">{m.id}</span>
                      {geminiModel === m.id ? (
                        <span className="flex-none text-[9px] uppercase font-extrabold text-accent bg-accent/15 px-1.5 py-0.5 rounded">
                          Đang chọn
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <label className="text-xs font-medium text-fg" htmlFor="gemini-key">
                  Gemini API Key (Tùy chọn nhập key riêng nếu muốn):
                </label>
                <div className="flex gap-2">
                  <input
                    id="gemini-key"
                    type="password"
                    className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-xs text-fg font-mono outline-none focus:ring-2 focus:ring-ring"
                    placeholder="AIzaSy... (Để trống nếu dùng Key hệ thống sẵn có)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setGeminiApiKey(apiKeyInput);
                      setGeminiLiveKey(apiKeyInput);
                      toast.success("Đã lưu Gemini API Key!");
                    }}
                  >
                    Lưu Key
                  </Button>
                  <Button
                    size="sm"
                    variant={geminiLiveOn ? "neon" : "secondary"}
                    disabled={geminiLiveBusy}
                    onClick={async () => {
                      unlockMcSpeech();
                      setGeminiLiveBusy(true);
                      try {
                        const key = apiKeyInput.trim() || geminiApiKey;
                        if (key) {
                          setGeminiApiKey(key);
                          setGeminiLiveKey(key);
                        }
                        const res = await connectGeminiLive({ data: { apiKey: key } });
                        setGeminiLiveOn(!!res.connected);
                        setGeminiLiveModel(res.model);
                        if (res.connected) {
                          toast.success(`Gemini Live Audio: ${res.model || "connected"}`);
                        } else {
                          toast.error(res.error || "Không kết nối Gemini Live");
                        }
                      } catch (err: any) {
                        toast.error(err?.message || "Lỗi Gemini Live");
                      } finally {
                        setGeminiLiveBusy(false);
                      }
                    }}
                  >
                    {geminiLiveBusy ? "Đang nối WS…" : geminiLiveOn ? "Live Audio ON" : "Nối Gemini Live WS"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted">
                  WebSocket <span className="font-mono">BidiGenerateContent</span> + API key · mic PCM 16kHz → model trả audio PCM 24kHz.
                  {geminiLiveOn ? ` MC text: ${geminiLiveModel || "native audio"}.` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={bidiMicOn ? "danger" : "neon"}
                    disabled={geminiLiveBusy}
                    onClick={async () => {
                      unlockMcSpeech();
                      const key = apiKeyInput.trim() || geminiApiKey;
                      if (bidiMicOn || isGeminiBidiLive()) {
                        await stopGeminiBidi();
                        setBidiMicOn(false);
                        setBidiStatus("Mic đã tắt");
                        toast.success("Đã tắt mic Native Audio");
                        return;
                      }
                      if (!key) {
                        toast.error("Dán Gemini API Key rồi bấm Nối mic");
                        return;
                      }
                      setGeminiApiKey(key);
                      setGeminiLiveKey(key);
                      setGeminiLiveBusy(true);
                      try {
                        await startGeminiBidi(key, geminiModel || "gemini-2.5-flash-native-audio-preview-09-2025", {
                          onStatus: (s) => setBidiStatus(s),
                          onError: (e) => {
                            setBidiStatus(e);
                            toast.error(e);
                          },
                          onTranscript: (t) => setBidiStatus(t),
                        });
                        setBidiMicOn(true);
                        toast.success("Mic 16kHz → Gemini Live → loa 24kHz");
                      } catch (err: any) {
                        setBidiMicOn(false);
                        toast.error(err?.message || "Không mở được BidiGenerateContent");
                      } finally {
                        setGeminiLiveBusy(false);
                      }
                    }}
                  >
                    {bidiMicOn ? "Tắt mic Dialog" : "Bật mic Dialog 16kHz"}
                  </Button>
                  {bidiStatus ? (
                    <span className="text-[11px] font-mono text-accent">{bidiStatus}</span>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3">
                <p className="text-xs font-semibold text-accent">🎮 Phím Tắt 3D Khán Giả (Bỏ qua Gemini token):</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Khán giả gõ số <code className="text-accent font-mono">1-5</code> sẽ lập tức kích hoạt hiệu ứng 3D trực tiếp mà không tiêu tốn Token Gemini:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-fg">
                  <span className="rounded bg-surface-2 px-2 py-0.5 font-mono">1: Vô sàn nhảy</span>
                  <span className="rounded bg-surface-2 px-2 py-0.5 font-mono">2: Đổi đồ</span>
                  <span className="rounded bg-surface-2 px-2 py-0.5 font-mono">3: Gọi Cocktail</span>
                  <span className="rounded bg-surface-2 px-2 py-0.5 font-mono">4: Phun CO2</span>
                  <span className="rounded bg-surface-2 px-2 py-0.5 font-mono">5: Bắn Pháo Hoa VIP</span>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-border/60 bg-bg/70 p-3">
                <p className="text-xs font-semibold text-accent">🔥 Thử nghiệm MC AI trả lời ngay:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      unlockMcSpeech();
                      if (!mcAudioEnabled) setMcAudio(true);
                      processChat("Thùy Trang", "Nhạc Vinahouse nghe cháy quá MC ơi!");
                    }}
                  >
                    "Nhạc cháy quá!"
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      unlockMcSpeech();
                      if (!mcAudioEnabled) setMcAudio(true);
                      processChat("Hùng", "Quán bar đẹp xuất sắc luôn!");
                    }}
                  >
                    "Bar đẹp quá!"
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => processChat("Quỳnh", "1")}
                  >
                    Test Phím "1"
                  </Button>
                </div>

                <div className="mt-3 space-y-2 border-t border-border/40 pt-2.5">
                  <p className="text-xs font-medium text-fg">Gửi text trực tiếp ➔ Gemini Live phát giọng MC ra loa:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="h-9 flex-1 rounded-lg border border-border bg-bg px-3 text-xs text-fg outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Nhập câu MC nói (ví dụ: Quẩy lên anh em ơi!)..."
                      value={customMcText}
                      onChange={(e) => setCustomMcText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customMcText.trim()) {
                          unlockMcSpeech();
                          if (!mcAudioEnabled) setMcAudio(true);
                          pushMc(customMcText.trim());
                          toast.success("Đã gửi text -> Gemini Live phản hồi giọng nói phát loa");
                          setCustomMcText("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="neon"
                      disabled={!customMcText.trim()}
                      onClick={() => {
                        unlockMcSpeech();
                        if (!mcAudioEnabled) setMcAudio(true);
                        pushMc(customMcText.trim());
                        toast.success("Đã gửi text -> Gemini Live phản hồi giọng nói phát loa");
                        setCustomMcText("");
                      }}
                    >
                      <Sparkles className="mr-1 size-3.5" />
                      Gửi text 🔊
                    </Button>
                  </div>
                </div>
              </div>

              {recentReplies.length > 0 ? (
                <div className="mt-3 rounded-lg border border-border/40 bg-bg/40 p-3">
                  <p className="text-xs font-medium text-muted">
                    Lịch sử 2 câu AI MC đã phán gần nhất (tránh trùng câu):
                  </p>
                  <div className="mt-2 space-y-1 max-h-24 overflow-auto font-mono text-xs text-fg/80">
                    {recentReplies.slice(-2).map((r, i) => (
                      <p key={i} className="truncate">✦ {r}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-xl border border-border bg-bg/50 p-4">
              <p className="text-sm font-semibold text-fg">Tặng quà (mở cánh)</p>
              <p className="mt-1 text-xs text-muted">
                Quà càng lớn, cánh càng đẹp trên overlay.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted" htmlFor="gift-name">
                    Người tặng
                  </label>
                  <input
                    id="gift-name"
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
                    value={giftName}
                    onChange={(e) => setGiftName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" htmlFor="gift-value">
                    Xu
                  </label>
                  <input
                    id="gift-value"
                    type="number"
                    className="mt-1 h-11 w-28 rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
                    value={giftValue}
                    onChange={(e) => setGiftValue(Number(e.target.value) || 1)}
                  />
                </div>
                <Button
                  onClick={() => {
                    sendGift(giftName, "Rose Pack", giftValue);
                    toast.success(`${giftName} vừa tặng ${giftValue} xu`);
                  }}
                >
                  <Gift className="size-4" />
                  Tặng quà
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
                      toast.success(`${g.label} cho ${giftName}`);
                    }}
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Gọi đồ uống" hint="Bấm món — khách trên sàn được phục vụ.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BAR_MENU.map((drink) => (
                <button
                  key={drink.id}
                  type="button"
                  onClick={() => {
                    orderDrink(simName, drink.id);
                    toast.success(`Phục vụ ${drink.name} cho ${simName}`);
                  }}
                  className="flex min-h-16 flex-col justify-between rounded-xl border border-border bg-bg/50 p-3 text-left hover:border-accent/50 hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Wine className="size-4 text-muted" />
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-accent">
                      {drink.priceCoins} xu
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-semibold leading-tight text-fg">
                      {drink.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                      {drink.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {drinkOrders.length > 0 ? (
              <div className="mt-4 rounded-xl border border-border bg-bg/60 p-3">
                <p className="mb-2 text-xs font-medium text-muted">Đơn vừa gọi</p>
                <div className="max-h-28 space-y-1.5 overflow-auto">
                  {drinkOrders.slice(0, 4).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between text-xs text-fg"
                    >
                      <span className="font-semibold">{o.userName}</span>
                      <span className="text-muted">{o.drink.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Section>

          <Section title="Nhạc và hiệu ứng sân khấu">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { id: "vinahouse", label: "Vinahouse" },
                  { id: "edm", label: "EDM" },
                  { id: "synthwave", label: "Synthwave" },
                  { id: "lounge", label: "Lounge" },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setMusicGenre(g.id);
                    toast.success(`Nhạc: ${g.label}`);
                  }}
                  className={cn(
                    "min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold",
                    barMusicGenre === g.id
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-bg/50 text-fg hover:bg-surface-2",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant={barMusicPlaying ? "neon" : "secondary"}
                onClick={() => toggleBarMusic()}
              >
                {barMusicPlaying ? (
                  <Volume2 className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {barMusicPlaying ? "Đang phát beat" : "Bật beat"}
              </Button>
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-bg/60 px-3 text-xs text-muted">
                Nhịp {barBpm}
                <input
                  type="range"
                  min={115}
                  max={150}
                  value={barBpm}
                  onChange={(e) => setBarBpm(Number(e.target.value))}
                  className="w-24 accent-accent"
                  aria-label="Tốc độ nhạc"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => triggerSfx("cheers")}>
                Cụng ly
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => triggerSfx("champagne")}
              >
                Nổ sâm panh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => triggerSfx("applause")}
              >
                Vỗ tay
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => triggerSfx("dj_scratch")}
              >
                DJ scratch
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="neon"
                onClick={() => {
                  triggerCo2Jet(3500);
                  toast.success("Phun khói CO2");
                }}
              >
                <Flame className="size-4" />
                Phun khói
              </Button>
              <Button
                variant="neon"
                onClick={() => {
                  triggerFirework(4500);
                  triggerSfx("firework");
                  toast.success("Pháo hoa");
                }}
              >
                <Sparkles className="size-4" />
                Pháo hoa
              </Button>
              <Button
                variant={laserScannerActive ? "neon" : "secondary"}
                onClick={() => {
                  toggleLaserScanner();
                  triggerSfx("laser");
                  toast.success(laserScannerActive ? "Tắt laser" : "Bật laser");
                }}
              >
                <Zap className="size-4" />
                {laserScannerActive ? "Laser đang bật" : "Bật laser"}
              </Button>
            </div>
          </Section>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Section title="Bảng TOP quà">
            <ol className="space-y-2">
              {top.length === 0 ? (
                <li className="text-sm text-muted">Chưa có quà. Bấm tặng quà để thử.</li>
              ) : (
                top.map((t, i) => (
                  <li key={t.name} className="flex justify-between text-sm text-fg">
                    <span>
                      {i + 1}. {t.name}
                    </span>
                    <span className="tabular-nums text-accent">{t.total}</span>
                  </li>
                ))
              )}
            </ol>
          </Section>

          <Section title="Lời MC">
            <ul className="max-h-40 space-y-2 overflow-auto">
              {mcLines.length === 0 ? (
                <li className="text-sm text-muted">MC chưa nói gì.</li>
              ) : (
                mcLines.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-lg border border-border/60 bg-bg/40 px-3 py-2 text-xs text-fg"
                  >
                    {l.text}
                  </li>
                ))
              )}
            </ul>
          </Section>

          <Section title="Nhật ký">
            <ul className="max-h-36 space-y-1 overflow-auto font-mono text-xs text-muted">
              {eventLog.length === 0 ? (
                <li>Chưa có sự kiện.</li>
              ) : (
                eventLog.map((e, i) => <li key={i}>{e}</li>)
              )}
            </ul>
          </Section>

          <section className="panel-card p-5">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowScripts((v) => !v)}
            >
              <div>
                <h2 className="text-base font-semibold text-fg">Kịch bản lên sóng</h2>
                <p className="mt-1 text-sm text-muted">
                  Tiêu đề, mô tả, bình luận ghim — chép dán sang TikTok.
                </p>
              </div>
              <span className="text-xs text-accent">
                {showScripts ? "Thu gọn" : "Mở"}
              </span>
            </button>
            {showScripts ? (
              <div className="mt-4 space-y-3">
                <Button
                  size="sm"
                  variant="neon"
                  onClick={async () => {
                    await navigator.clipboard.writeText(livePackText);
                    toast.success("Đã chép cả kịch bản");
                  }}
                >
                  <Copy className="size-3.5" />
                  Chép tất cả
                </Button>
                <CopyBlock label="Tiêu đề livestream" value={p.livePack.title} />
                <CopyBlock label="Mô tả" value={p.livePack.description} />
                <CopyBlock label="Bình luận ghim" value={p.livePack.pinned} />
                <CopyBlock
                  label="Kịch bản 60 giây đầu"
                  value={p.livePack.first60s}
                />
                <Button variant="outline" size="sm" asChild>
                  <a href="/content">Xem thêm tài liệu</a>
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
