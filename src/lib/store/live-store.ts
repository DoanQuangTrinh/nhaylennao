import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fillTemplate,
  getProfile,
  pickRandom,
  resolveGiftEffect,
} from "@/lib/config/profiles-data";
import type { ProfileConfig } from "@/lib/config/types";

export type Dancer = {
  id: string;
  name: string;
  platform: "tiktok" | "youtube" | "facebook" | "demo";
  style: number;
  skin: number;
  dancing: boolean;
  isDemo: boolean;
  joinedAt: number;
  wingTier: number;
  auraUntil: number;
  giftedTotal: number;
};

export type GiftEvent = {
  id: string;
  name: string;
  gift: string;
  value: number;
  effect: string;
  label: string;
  at: number;
};

export type TopEntry = {
  name: string;
  total: number;
};

export type LiveMode = "club" | "fortune";

export type McLine = {
  id: string;
  text: string;
  at: number;
};

type LiveState = {
  profileId: string;
  mode: LiveMode;
  dancers: Dancer[];
  top: TopEntry[];
  gifts: GiftEvent[];
  mcLines: McLine[];
  lastHypeAt: number;
  maxFloor: number;
  platformConnected: "none" | "tiktok" | "youtube" | "facebook" | "demo";
  mcAudioEnabled: boolean;
  autoDemo: boolean;
  bannerFlash: string | null;
  fortuneAnswer: string | null;
  eventLog: string[];
  syncRev: number;

  getProfile: () => ProfileConfig;
  setProfileId: (id: string) => void;
  setMode: (mode: LiveMode) => void;
  setPlatform: (p: LiveState["platformConnected"]) => void;
  setMcAudio: (on: boolean) => void;
  setAutoDemo: (on: boolean) => void;
  processChat: (name: string, text: string, platform?: Dancer["platform"]) => void;
  join: (name: string, platform?: Dancer["platform"], isDemo?: boolean) => void;
  leave: (name: string) => void;
  dance: (name: string) => void;
  cycleStyle: (name: string) => void;
  cycleSkin: (name: string) => void;
  sendGift: (name: string, gift: string, value: number) => void;
  pushMc: (text: string) => void;
  tickHype: () => void;
  ensureDemoFloor: () => void;
  clearFloor: () => void;
  askFortune: (name: string, question: string) => void;
  log: (msg: string) => void;
};

const CHANNEL = "quanbar-live-sync-v2";
const PERSIST_KEY = "quanbar-live-v4";
/** Lightweight key always written on mode/profile change — overlay polls this */
const META_KEY = "quanbar-live-meta";
const MAX_FLOOR = 12;

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeName(name: string) {
  return name.trim() || "Guest";
}

function cmdMatch(text: string, aliases: string[]) {
  const t = text.trim().toLowerCase();
  return aliases.some((a) => t === a.toLowerCase() || t.startsWith(a.toLowerCase() + " "));
}

function effectToWingTier(effect: string): number {
  switch (effect) {
    case "legendary":
      return 4;
    case "mega":
      return 3;
    case "fireworks":
      return 2;
    case "confetti":
      return 1;
    default:
      return 1;
  }
}

function effectAuraMs(effect: string): number {
  switch (effect) {
    case "legendary":
      return 90_000;
    case "mega":
      return 60_000;
    case "fireworks":
      return 45_000;
    case "confetti":
      return 30_000;
    default:
      return 18_000;
  }
}

function safePick(arr: string[] | undefined, fallback: string) {
  if (!arr || !arr.length) return fallback;
  return pickRandom(arr);
}

export function normalizeDancer(d: Partial<Dancer> & Pick<Dancer, "id" | "name">): Dancer {
  return {
    id: d.id,
    name: d.name,
    platform: d.platform ?? "demo",
    style: d.style ?? 0,
    skin: d.skin ?? 0,
    dancing: d.dancing ?? true,
    isDemo: d.isDemo ?? false,
    joinedAt: d.joinedAt ?? Date.now(),
    wingTier: d.wingTier ?? 0,
    auraUntil: d.auraUntil ?? 0,
    giftedTotal: d.giftedTotal ?? 0,
  };
}

export type LiveSnapshot = {
  type: "snapshot";
  rev: number;
  profileId: string;
  mode: LiveMode;
  dancers: Dancer[];
  top: TopEntry[];
  gifts: GiftEvent[];
  mcLines: McLine[];
  bannerFlash: string | null;
  fortuneAnswer: string | null;
  platformConnected: LiveState["platformConnected"];
  autoDemo: boolean;
};

type LiveMeta = {
  profileId: string;
  mode: LiveMode;
  platformConnected: LiveState["platformConnected"];
  autoDemo: boolean;
  bannerFlash: string | null;
  fortuneAnswer: string | null;
  at: number;
  rev: number;
};

function writeMeta(state: LiveState, rev: number) {
  if (typeof window === "undefined") return;
  try {
    const meta: LiveMeta = {
      profileId: state.profileId,
      mode: state.mode,
      platformConnected: state.platformConnected,
      autoDemo: state.autoDemo,
      bannerFlash: state.bannerFlash,
      fortuneAnswer: state.fortuneAnswer,
      at: Date.now(),
      rev,
    };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

function readMeta(): LiveMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LiveMeta;
  } catch {
    return null;
  }
}

function buildSnapshot(state: LiveState, rev: number): LiveSnapshot {
  return {
    type: "snapshot",
    rev,
    profileId: state.profileId,
    mode: state.mode,
    dancers: state.dancers,
    top: state.top,
    gifts: state.gifts,
    mcLines: state.mcLines,
    bannerFlash: state.bannerFlash,
    fortuneAnswer: state.fortuneAnswer,
    platformConnected: state.platformConnected,
    autoDemo: state.autoDemo,
  };
}

export const useLiveStore = create<LiveState>()(
  persist(
    (set, get) => ({
      profileId: "global-en",
      mode: "club",
      dancers: [],
      top: [],
      gifts: [],
      mcLines: [],
      lastHypeAt: 0,
      maxFloor: MAX_FLOOR,
      platformConnected: "demo",
      mcAudioEnabled: false,
      autoDemo: true,
      bannerFlash: null,
      fortuneAnswer: null,
      eventLog: [],
      syncRev: 0,

      getProfile: () => getProfile(get().profileId),

      setProfileId: (id) => {
        if (get().profileId === id) return;
        set({ profileId: id });
        flushLiveSync(true);
      },

      setMode: (mode) => {
        if (get().mode === mode) return;
        set({ mode });
        flushLiveSync(true);
      },

      setPlatform: (platformConnected) => {
        set({ platformConnected });
        flushLiveSync(true);
      },
      setMcAudio: (mcAudioEnabled) => set({ mcAudioEnabled }),
      setAutoDemo: (autoDemo) => {
        set({ autoDemo });
        flushLiveSync(true);
      },

      log: (msg) =>
        set((s) => ({
          eventLog: [`${new Date().toLocaleTimeString()} ${msg}`, ...s.eventLog].slice(0, 30),
        })),

      pushMc: (text) => {
        if (!text) return;
        set((s) => ({
          mcLines: [{ id: uid(), text, at: Date.now() }, ...s.mcLines].slice(0, 8),
          bannerFlash: text,
        }));
        // banner is live UI — push immediately
        flushLiveSync(true);
        window.setTimeout(() => {
          if (get().bannerFlash === text) {
            set({ bannerFlash: null });
            flushLiveSync(true);
          }
        }, 4200);

        if (get().mcAudioEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            const u = new SpeechSynthesisUtterance(text);
            const p = get().getProfile();
            u.lang = p.language === "vi" ? "vi-VN" : "en-US";
            u.rate = 1.05;
            if (!window.speechSynthesis.speaking) {
              window.speechSynthesis.speak(u);
            }
          } catch {
            /* ignore */
          }
        }
      },

      join: (name, platform = "demo", isDemo = false) => {
        const n = normalizeName(name);
        const existing = get().dancers.find((d) => d.name.toLowerCase() === n.toLowerCase());
        if (existing) {
          if (isDemo && !existing.isDemo) return;
          if (!existing.dancing) get().dance(n);
          return;
        }
        if (get().dancers.length >= get().maxFloor) {
          get().log(`Floor full — ${n} wait`);
          return;
        }
        const dancer = normalizeDancer({
          id: uid(),
          name: n,
          platform,
          style: Math.floor(Math.random() * 8),
          skin: Math.floor(Math.random() * 8),
          dancing: true,
          isDemo,
          joinedAt: Date.now(),
        });
        set((s) => ({ dancers: [...s.dancers, dancer] }));
        if (!isDemo) {
          const p = get().getProfile();
          get().pushMc(
            fillTemplate(safePick(p.mc.greet, "Welcome {name}!"), { name: n }),
          );
        }
        get().log(`${isDemo ? "demo" : "join"} ${n}`);
      },

      leave: (name) => {
        const n = normalizeName(name);
        set((s) => ({
          dancers: s.dancers.filter((d) => d.name.toLowerCase() !== n.toLowerCase()),
        }));
        get().log(`leave ${n}`);
        if (get().autoDemo && get().dancers.filter((d) => !d.isDemo).length === 0) {
          get().ensureDemoFloor();
        }
      },

      dance: (name) => {
        const n = normalizeName(name);
        set((s) => ({
          dancers: s.dancers.map((d) =>
            d.name.toLowerCase() === n.toLowerCase()
              ? d.dancing
                ? d
                : { ...d, dancing: true }
              : d,
          ),
        }));
      },

      cycleStyle: (name) => {
        const n = normalizeName(name);
        set((s) => ({
          dancers: s.dancers.map((d) =>
            d.name.toLowerCase() === n.toLowerCase()
              ? { ...d, style: (d.style + 1) % 8 }
              : d,
          ),
        }));
      },

      cycleSkin: (name) => {
        const n = normalizeName(name);
        set((s) => ({
          dancers: s.dancers.map((d) =>
            d.name.toLowerCase() === n.toLowerCase()
              ? { ...d, skin: (d.skin + 1) % 8 }
              : d,
          ),
        }));
      },

      sendGift: (name, gift, value) => {
        const n = normalizeName(name);
        const p = get().getProfile();
        const { effect, label } = resolveGiftEffect(p, value);
        const wingTier = effectToWingTier(effect);
        const auraMs = effectAuraMs(effect);
        const now = Date.now();
        const key = n.toLowerCase();

        if (!get().dancers.some((d) => d.name.toLowerCase() === key)) {
          get().join(n, "demo", false);
        }

        const ev: GiftEvent = {
          id: uid(),
          name: n,
          gift,
          value,
          effect,
          label,
          at: now,
        };

        set((s) => {
          const topMap = new Map(s.top.map((t) => [t.name.toLowerCase(), t]));
          const prev = topMap.get(key);
          topMap.set(key, { name: n, total: (prev?.total ?? 0) + value });
          const top = [...topMap.values()].sort((a, b) => b.total - a.total).slice(0, 10);

          const dancers = s.dancers.map((d) => {
            if (d.name.toLowerCase() !== key) return d;
            return {
              ...d,
              dancing: true,
              giftedTotal: (d.giftedTotal ?? 0) + value,
              wingTier: Math.max(d.wingTier ?? 0, wingTier),
              auraUntil: Math.max(d.auraUntil ?? 0, now + auraMs),
            };
          });

          return {
            gifts: [ev, ...s.gifts].slice(0, 12),
            top,
            dancers,
          };
        });

        get().pushMc(
          fillTemplate(safePick(p.mc.thank, "Thank you {name} for the {gift}!"), {
            name: n,
            gift: `${gift} (${label})`,
          }),
        );

        if (wingTier >= 2) {
          const line =
            wingTier >= 4
              ? `✦ LEGENDARY — ${n} spreads PHOENIX WINGS!`
              : wingTier >= 3
                ? `✦ MEGA — ${n} unlocked ANGEL WINGS!`
                : `✦ ${n} got neon wings on the floor!`;
          window.setTimeout(() => get().pushMc(line), 80);
        }

        get().log(`gift ${n} ${gift} ${value} → wings ${wingTier}`);
      },

      processChat: (name, text, platform = "demo") => {
        const p = get().getProfile();
        const raw = text.trim();
        if (!raw) return;

        if (get().mode === "fortune") {
          if (
            !cmdMatch(raw, p.commands.join) &&
            !cmdMatch(raw, p.commands.leave) &&
            !cmdMatch(raw, p.commands.dance) &&
            !cmdMatch(raw, p.commands.style) &&
            !cmdMatch(raw, p.commands.skin)
          ) {
            get().askFortune(name, raw);
            return;
          }
        }

        if (cmdMatch(raw, p.commands.join)) get().join(name, platform, false);
        else if (cmdMatch(raw, p.commands.leave)) get().leave(name);
        else if (cmdMatch(raw, p.commands.dance)) get().dance(name);
        else if (cmdMatch(raw, p.commands.style)) get().cycleStyle(name);
        else if (cmdMatch(raw, p.commands.skin)) get().cycleSkin(name);
        else get().log(`chat ${name}: ${raw}`);
      },

      askFortune: (name, question) => {
        const p = get().getProfile();
        const line = safePick(p.fortune?.demoLines, "The neon says yes.");
        const answer = `${normalizeName(name)}: ${line}`;
        set({ fortuneAnswer: answer });
        get().pushMc(answer);
        get().log(`Fortune Q from ${name}: ${question}`);
      },

      tickHype: () => {
        const p = get().getProfile();
        if (!p.mc.enabled) return;
        const now = Date.now();
        const interval = Math.max((p.mc.hypeIntervalSec || 100) * 1000, 45_000);
        if (now - get().lastHypeAt < interval) return;
        set({ lastHypeAt: now });
        const useGift = Math.random() > 0.55;
        get().pushMc(
          useGift
            ? p.banner?.giftCta || safePick(p.mc.hype, "Type 1 to join!")
            : safePick(p.mc.hype, "Type 1 to join!"),
        );
      },

      ensureDemoFloor: () => {
        if (!get().autoDemo) return;
        const real = get().dancers.filter((d) => !d.isDemo);
        if (real.length > 0) return;
        const demos = get().dancers.filter((d) => d.isDemo);
        if (demos.length >= 3) return;
        const names = ["Aya", "Ken", "Mia"];
        const existing = new Set(get().dancers.map((d) => d.name));
        const add: Dancer[] = [];
        for (const name of names) {
          if (existing.has(name)) continue;
          if (get().dancers.length + add.length >= 3) break;
          add.push(
            normalizeDancer({
              id: uid(),
              name,
              platform: "demo",
              style: add.length * 2,
              skin: add.length,
              dancing: true,
              isDemo: true,
              joinedAt: Date.now(),
            }),
          );
        }
        if (add.length) set((s) => ({ dancers: [...s.dancers, ...add] }));
      },

      clearFloor: () => {
        set({ dancers: [], gifts: [] });
        get().log("floor cleared");
      },
    }),
    {
      name: PERSIST_KEY,
      partialize: (s) => ({
        profileId: s.profileId,
        mode: s.mode,
        platformConnected: s.platformConnected,
        mcAudioEnabled: s.mcAudioEnabled,
        autoDemo: s.autoDemo,
      }),
    },
  ),
);

// ── Cross-tab live sync (host panel ↔ /overlay OBS) ─────────────────────────

let bc: BroadcastChannel | null = null;
let bcUsers = 0;
let applyingRemote = false;
let bcTimer: number | null = null;
let lastPayload = "";
let localRev = 0;
let unsubStore: (() => void) | null = null;
let storageHandler: ((e: StorageEvent) => void) | null = null;
let bcHandler: ((ev: MessageEvent) => void) | null = null;
let pollTimer: number | null = null;
let lastMetaAt = 0;

function applySnapshot(data: Partial<LiveSnapshot> & { type?: string; at?: number; rev?: number }) {
  applyingRemote = true;
  try {
    const incomingRev = typeof data.rev === "number" ? data.rev : localRev + 1;
    localRev = Math.max(localRev + 1, incomingRev);
    const patch: Partial<LiveState> = { syncRev: localRev };

    if (data.profileId != null) patch.profileId = data.profileId;
    if (data.mode != null) patch.mode = data.mode as LiveMode;
    if (data.dancers != null) {
      patch.dancers = data.dancers.map((d) => normalizeDancer(d as Dancer));
    }
    if (data.top != null) patch.top = data.top;
    if (data.gifts != null) patch.gifts = data.gifts;
    if (data.mcLines != null) patch.mcLines = data.mcLines;
    if ("bannerFlash" in data) patch.bannerFlash = data.bannerFlash ?? null;
    if ("fortuneAnswer" in data) patch.fortuneAnswer = data.fortuneAnswer ?? null;
    if (data.platformConnected != null) {
      patch.platformConnected = data.platformConnected as LiveState["platformConnected"];
    }
    if (data.autoDemo != null) patch.autoDemo = data.autoDemo;

    useLiveStore.setState(patch);

    const s = useLiveStore.getState();
    lastPayload = JSON.stringify({
      profileId: s.profileId,
      mode: s.mode,
      d: s.dancers.map((x) => x.id),
      g: s.gifts[0]?.id,
      m: s.mcLines[0]?.id,
      bf: s.bannerFlash,
      fa: s.fortuneAnswer,
    });
    if (typeof data.at === "number") lastMetaAt = data.at;
  } finally {
    queueMicrotask(() => {
      applyingRemote = false;
    });
  }
}

function postSnapshot() {
  if (applyingRemote) return;
  try {
    localRev += 1;
    const state = useLiveStore.getState();
    const snap = buildSnapshot(state, localRev);
    // Always write meta so overlay can poll even if BC is blocked
    writeMeta(state, localRev);

    const key = JSON.stringify({
      profileId: snap.profileId,
      mode: snap.mode,
      d: snap.dancers.map((x) => `${x.id}:${x.style}:${x.wingTier}:${x.auraUntil}`),
      g: snap.gifts[0]?.id,
      m: snap.mcLines[0]?.id,
      bf: snap.bannerFlash,
      fa: snap.fortuneAnswer,
      p: snap.platformConnected,
      a: snap.autoDemo,
    });
    if (key === lastPayload) return;
    lastPayload = key;

    bc?.postMessage(snap);
  } catch {
    /* ignore */
  }
}

/** Immediate or debounced broadcast to other tabs/windows */
export function flushLiveSync(immediate = false) {
  if (typeof window === "undefined" || applyingRemote) return;
  if (bcTimer != null) {
    window.clearTimeout(bcTimer);
    bcTimer = null;
  }
  if (immediate) {
    postSnapshot();
    return;
  }
  bcTimer = window.setTimeout(() => {
    bcTimer = null;
    postSnapshot();
  }, 40);
}

function pullMetaIfNewer() {
  if (applyingRemote) return;
  const meta = readMeta();
  if (!meta) return;
  if (meta.at <= lastMetaAt && meta.rev <= localRev) return;

  const cur = useLiveStore.getState();
  const modeDiff = meta.mode !== cur.mode;
  const profileDiff = meta.profileId !== cur.profileId;
  const bannerDiff = meta.bannerFlash !== cur.bannerFlash;
  const fortuneDiff = meta.fortuneAnswer !== cur.fortuneAnswer;
  if (!modeDiff && !profileDiff && !bannerDiff && !fortuneDiff) {
    lastMetaAt = Math.max(lastMetaAt, meta.at);
    return;
  }

  applySnapshot({
    type: "snapshot",
    rev: meta.rev,
    at: meta.at,
    profileId: meta.profileId,
    mode: meta.mode,
    platformConnected: meta.platformConnected,
    autoDemo: meta.autoDemo,
    bannerFlash: meta.bannerFlash,
    fortuneAnswer: meta.fortuneAnswer,
  });
  lastMetaAt = meta.at;
}

export function initLiveSync() {
  if (typeof window === "undefined") return () => {};

  bcUsers += 1;

  if (!bc) {
    try {
      bc = new BroadcastChannel(CHANNEL);
    } catch {
      bc = null;
    }
  }

  if (!unsubStore) {
    unsubStore = useLiveStore.subscribe(() => {
      if (applyingRemote) return;
      flushLiveSync(false);
    });
  }

  if (!bcHandler) {
    bcHandler = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "hello") {
        if (!applyingRemote) postSnapshot();
        return;
      }

      if (data.type === "snapshot") {
        const cur = useLiveStore.getState();
        // Always accept if UI-critical fields differ
        const criticalDiff =
          data.mode !== cur.mode ||
          data.profileId !== cur.profileId ||
          data.bannerFlash !== cur.bannerFlash ||
          data.fortuneAnswer !== cur.fortuneAnswer ||
          (data.gifts?.[0]?.id ?? null) !== (cur.gifts[0]?.id ?? null) ||
          (data.dancers?.length ?? 0) !== cur.dancers.length;

        if (
          typeof data.rev === "number" &&
          data.rev <= localRev &&
          data.rev > 0 &&
          !criticalDiff
        ) {
          return;
        }
        applySnapshot(data as LiveSnapshot);
      }
    };
    bc?.addEventListener("message", bcHandler);
  }

  if (!storageHandler) {
    storageHandler = (e: StorageEvent) => {
      if (applyingRemote) return;
      if (e.key === META_KEY) {
        pullMetaIfNewer();
        return;
      }
      if (e.key !== PERSIST_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as { state?: Partial<LiveState> };
        const st = parsed.state;
        if (!st) return;
        const cur = useLiveStore.getState();
        if (st.mode === cur.mode && st.profileId === cur.profileId) return;
        applySnapshot({
          type: "snapshot",
          rev: localRev + 1,
          mode: (st.mode as LiveMode) ?? cur.mode,
          profileId: st.profileId ?? cur.profileId,
          platformConnected: st.platformConnected as LiveState["platformConnected"],
          autoDemo: st.autoDemo,
        });
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", storageHandler);
  }

  // Poll meta every 400ms — bulletproof for OBS browser source / flaky BC
  if (pollTimer == null) {
    pollTimer = window.setInterval(() => pullMetaIfNewer(), 400);
  }

  // Seed meta + ask peers
  writeMeta(useLiveStore.getState(), localRev);
  try {
    bc?.postMessage({ type: "hello", at: Date.now() });
  } catch {
    /* ignore */
  }
  window.setTimeout(() => {
    if (!applyingRemote) postSnapshot();
  }, 60);

  return () => {
    bcUsers = Math.max(0, bcUsers - 1);
    if (bcUsers > 0) return;

    if (bcTimer != null) {
      window.clearTimeout(bcTimer);
      bcTimer = null;
    }
    if (pollTimer != null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
    unsubStore?.();
    unsubStore = null;
    if (bc && bcHandler) bc.removeEventListener("message", bcHandler);
    bcHandler = null;
    if (storageHandler) window.removeEventListener("storage", storageHandler);
    storageHandler = null;
    bc?.close();
    bc = null;
  };
}
