import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fillTemplate,
  getProfile,
  pickRandom,
  resolveGiftEffect,
} from "@/lib/config/profiles-data";
import type { ProfileConfig } from "@/lib/config/types";

import { BAR_MENU, VIP_TABLE_TIERS, type DrinkItem } from "@/lib/config/bar-data";
import { barBeatSynth, playBarSfx, type SfxType } from "@/lib/audio/audio-engine";
import { speakMcLine, unlockMcSpeech } from "@/lib/audio/mc-speech";
import { generateAiCommentReply } from "@/lib/ai/gemini-comment-reply";
import { parseAvatarCommand } from "@/lib/avatar/avatar-parser";

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

export type DrinkOrder = {
  id: string;
  userName: string;
  drink: DrinkItem;
  at: number;
};

export type VipGuest = {
  userName: string;
  tierId: "gold" | "platinum" | "diamond";
  points: number;
  tableName: string;
  assignedAt: number;
};

type LiveState = {
  profileId: string;
  mode: LiveMode;
  dancers: Dancer[];
  top: TopEntry[];
  gifts: GiftEvent[];
  mcLines: McLine[];
  drinkOrders: DrinkOrder[];
  vipGuests: VipGuest[];
  co2JetUntil: number;
  fireworkActiveUntil: number;
  laserScannerActive: boolean;
  barMusicGenre: "vinahouse" | "edm" | "synthwave" | "lounge";
  barMusicPlaying: boolean;
  barBpm: number;
  lastHypeAt: number;
  maxFloor: number;
  platformConnected: "none" | "tiktok" | "youtube" | "facebook" | "demo";
  mcAudioEnabled: boolean;
  autoDemo: boolean;
  aiReplyEnabled: boolean;
  geminiApiKey: string;
  geminiModel: string;
  cooldownMs: number;
  lastAiReplyAt: number;
  recentReplies: string[];
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
  setAiReplyEnabled: (on: boolean) => void;
  setGeminiApiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
  setCooldownMs: (ms: number) => void;
  processChat: (name: string, text: string, platform?: Dancer["platform"]) => void;
  join: (name: string, platform?: Dancer["platform"], isDemo?: boolean) => void;
  leave: (name: string) => void;
  dance: (name: string) => void;
  cycleStyle: (name: string) => void;
  cycleSkin: (name: string) => void;
  sendGift: (name: string, gift: string, value: number) => void;
  orderDrink: (name: string, drinkId: string) => void;
  triggerCo2Jet: (durationMs?: number) => void;
  triggerFirework: (durationMs?: number) => void;
  toggleLaserScanner: (v?: boolean) => void;
  setMusicGenre: (genre: "vinahouse" | "edm" | "synthwave" | "lounge") => void;
  toggleBarMusic: () => void;
  setBarBpm: (bpm: number) => void;
  triggerSfx: (type: SfxType) => void;
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
const MAX_FLOOR = 32;

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
  drinkOrders?: DrinkOrder[];
  vipGuests?: VipGuest[];
  co2JetUntil?: number;
  barMusicPlaying?: boolean;
  barBpm?: number;
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
  snapshot?: LiveSnapshot;
};

function writeMeta(state: LiveState, rev: number) {
  if (typeof window === "undefined") return;
  try {
    const snap = buildSnapshot(state, rev);
    const meta: LiveMeta = {
      profileId: state.profileId,
      mode: state.mode,
      platformConnected: state.platformConnected,
      autoDemo: state.autoDemo,
      bannerFlash: state.bannerFlash,
      fortuneAnswer: state.fortuneAnswer,
      at: Date.now(),
      rev,
      snapshot: snap,
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
    return raw ? (JSON.parse(raw) as LiveMeta) : null;
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
    drinkOrders: state.drinkOrders,
    vipGuests: state.vipGuests,
    co2JetUntil: state.co2JetUntil,
    barMusicPlaying: state.barMusicPlaying,
    barBpm: state.barBpm,
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
      drinkOrders: [],
      vipGuests: [],
      co2JetUntil: 0,
      fireworkActiveUntil: 0,
      laserScannerActive: true,
      barMusicGenre: "vinahouse",
      barMusicPlaying: false,
      barBpm: 128,
      lastHypeAt: 0,
      maxFloor: MAX_FLOOR,
      platformConnected: "demo",
      mcAudioEnabled: true,
      autoDemo: true,
      aiReplyEnabled: true,
      geminiApiKey: "",
      geminiModel: "gemini-2.5-flash",
      cooldownMs: 3000,
      lastAiReplyAt: 0,
      recentReplies: [],
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
      setMcAudio: (mcAudioEnabled) => {
        if (mcAudioEnabled) unlockMcSpeech();
        set({ mcAudioEnabled });
      },
      setAutoDemo: (autoDemo) => {
        set({ autoDemo });
        flushLiveSync(true);
      },
      setAiReplyEnabled: (aiReplyEnabled) => set({ aiReplyEnabled }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setGeminiModel: (geminiModel) => set({ geminiModel }),
      setCooldownMs: (cooldownMs) => set({ cooldownMs }),

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
        if (get().mcAudioEnabled) {
          speakMcLine(text);
        }
        // banner is live UI — push immediately
        flushLiveSync(true);
        window.setTimeout(() => {
          if (get().bannerFlash === text) {
            set({ bannerFlash: null });
            flushLiveSync(true);
          }
        }, 4200);
      },

      join: (name, platform = "demo", isDemo = false) => {
        const n = normalizeName(name);
        const existing = get().dancers.find((d) => d.name.toLowerCase() === n.toLowerCase());
        if (existing) {
          if (isDemo && !existing.isDemo) return;
          existing.dancing = true;
          existing.joinedAt = Date.now();
          set({ dancers: [...get().dancers] });
          flushLiveSync(true);
          return;
        }

        const currentDancers = get().dancers;
        let nextDancers = [...currentDancers];

        if (nextDancers.length >= MAX_FLOOR) {
          const removeIdx = nextDancers.findIndex((d) => d.isDemo || (!d.giftedTotal && !d.wingTier));
          if (removeIdx >= 0) {
            nextDancers.splice(removeIdx, 1);
          } else {
            nextDancers.shift();
          }
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

        nextDancers.push(dancer);
        set({ dancers: nextDancers });
        flushLiveSync(true);

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

      orderDrink: (userName, drinkId) => {
        const n = normalizeName(userName);
        const drink = BAR_MENU.find((d) => d.id === drinkId || d.name.toLowerCase().includes(drinkId.toLowerCase())) || BAR_MENU[0]!;
        const order: DrinkOrder = {
          id: uid(),
          userName: n,
          drink,
          at: Date.now(),
        };

        // Ensure customer is on floor
        if (!get().dancers.some((d) => d.name.toLowerCase() === n.toLowerCase())) {
          get().join(n, "demo", false);
        }

        // Calculate VIP table status
        let vipGuests = get().vipGuests;
        const totalVipPoints = (get().dancers.find((d) => d.name.toLowerCase() === n.toLowerCase())?.giftedTotal || 0) + drink.vipPoints;

        let claimedTier = VIP_TABLE_TIERS.slice().reverse().find((t) => totalVipPoints >= t.minPoints);
        if (claimedTier) {
          const existingIdx = vipGuests.findIndex((v) => v.userName.toLowerCase() === n.toLowerCase());
          const newVip: VipGuest = {
            userName: n,
            tierId: claimedTier.id,
            points: totalVipPoints,
            tableName: claimedTier.tableName,
            assignedAt: Date.now(),
          };
          if (existingIdx >= 0) {
            vipGuests = [...vipGuests];
            vipGuests[existingIdx] = newVip;
          } else {
            vipGuests = [newVip, ...vipGuests].slice(0, 6);
          }
        }

        set((s) => ({
          drinkOrders: [order, ...s.drinkOrders].slice(0, 10),
          vipGuests,
        }));

        playBarSfx(drink.sfxKey);

        if (drink.category === "champagne_vip") {
          get().triggerCo2Jet(3000);
          get().pushMc(`🍾 VIP CHAMPAGNE! ${n} opened ${drink.name}! 🎉`);
        } else {
          get().pushMc(`${drink.icon} ${n} ordered ${drink.name}! Cheers!`);
        }

        get().log(`drink ${n} ordered ${drink.name}`);
        flushLiveSync(true);
      },

      triggerCo2Jet: (durationMs = 2500) => {
        const until = Date.now() + durationMs;
        set({ co2JetUntil: until });
        playBarSfx("co2");
        get().log(`CO2 Jet fired for ${durationMs}ms`);
        flushLiveSync(true);
      },

      triggerFirework: (durationMs = 4000) => {
        const until = Date.now() + durationMs;
        set({ fireworkActiveUntil: until });
        playBarSfx("firework");
        get().log(`VIP Pyrotechnics Firework fired for ${durationMs}ms`);
        flushLiveSync(true);
      },

      toggleLaserScanner: (v) => {
        const next = v !== undefined ? v : !get().laserScannerActive;
        set({ laserScannerActive: next });
        if (next) playBarSfx("laser");
        get().log(`Laser Scanner ${next ? "enabled" : "disabled"}`);
        flushLiveSync(true);
      },

      setMusicGenre: (genre) => {
        set({ barMusicGenre: genre });
        const bpmMap = { vinahouse: 140, edm: 128, synthwave: 120, lounge: 115 };
        get().setBarBpm(bpmMap[genre]);
        get().log(`Music genre switched to ${genre}`);
        flushLiveSync(true);
      },

      toggleBarMusic: () => {
        const next = !get().barMusicPlaying;
        set({ barMusicPlaying: next });
        if (next) {
          barBeatSynth.start(get().barBpm);
        } else {
          barBeatSynth.stop();
        }
        get().log(`music ${next ? "started" : "stopped"}`);
        flushLiveSync(true);
      },

      setBarBpm: (bpm) => {
        set({ barBpm: bpm });
        barBeatSynth.setBpm(bpm);
        get().log(`BPM set to ${bpm}`);
        flushLiveSync(true);
      },

      triggerSfx: (type) => {
        playBarSfx(type);
        get().log(`SFX triggered: ${type}`);
      },

      processChat: (name, text, platform = "demo") => {
        const p = get().getProfile();
        const raw = text.trim();
        if (!raw) return;

        const lower = raw.toLowerCase();

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

        // Custom Bar & Drink commands
        if (lower.startsWith("order ") || lower.startsWith("gọi ") || lower.startsWith("uống ")) {
          const drinkQuery = lower.replace(/^(order|gọi|uống)\s+/, "");
          get().orderDrink(name, drinkQuery);
          return;
        } else if (lower === "cheers" || lower === "cụng ly" || lower === "zô" || lower === "zo") {
          get().triggerSfx("cheers");
          get().pushMc(`🥂 ${normalizeName(name)} cheers with everyone!`);
          return;
        } else if (lower === "champagne" || lower === "sâm panh") {
          get().orderDrink(name, "moet_chandon");
          return;
        } else if (lower === "co2" || lower === "khói") {
          get().triggerCo2Jet(2500);
          return;
        } else if (lower === "firework" || lower === "pháo hoa" || lower === "phao hoa") {
          get().triggerFirework(4000);
          get().pushMc(`🎆 VIP PYROTECHNICS! ${normalizeName(name)} fired fireworks on stage! 🎉`);
          return;
        } else if (lower === "laser" || lower === "đèn laser") {
          get().toggleLaserScanner();
          return;
        } else if (lower === "vinahouse" || lower === "edm" || lower === "synthwave" || lower === "lounge") {
          get().setMusicGenre(lower as "vinahouse" | "edm" | "synthwave" | "lounge");
          return;
        } else if (lower === "angel" || lower === "2042" || lower === "thiên thần" || lower === "thien than") {
          const n = normalizeName(name);
          if (!get().dancers.some((d) => d.name.toLowerCase() === n.toLowerCase())) {
            get().join(n, platform, false);
          }
          set((s) => ({
            dancers: s.dancers.map((d) => (d.name.toLowerCase() === n.toLowerCase() ? { ...d, style: 2042, wingTier: 4 } : d)),
          }));
          get().pushMc(`🪽 ANGEL FLIGHT 2042! ${n} transformed into Cyber Angel on stage! ✨`);
          flushLiveSync(true);
          return;
        }

        // ---- 0. KIỂM TRA LỆNH TÙY CHỈNH AVATAR (skin 3, style robot, acc crown, tóc 2, áo 4, đổi hình...) ----
        const avatarPatch = parseAvatarCommand(raw);
        if (avatarPatch) {
          const n = normalizeName(name);
          if (!get().dancers.some((d) => d.name.toLowerCase() === n.toLowerCase())) {
            get().join(n, platform, false);
          }
          if (avatarPatch.random) {
            get().cycleStyle(n);
            get().cycleSkin(n);
          } else {
            set((s) => ({
              dancers: s.dancers.map((d) => {
                if (d.name.toLowerCase() !== n.toLowerCase()) return d;
                return {
                  ...d,
                  style: avatarPatch.style ? (avatarPatch.style === "robot" ? 1 : avatarPatch.style === "cool" ? 3 : 0) : d.style,
                  skin: avatarPatch.skin !== undefined ? avatarPatch.skin : d.skin,
                };
              }),
            }));
          }
          get().pushMc(`✨ Đã tùy chỉnh avatar 3D cho @${n}!`);
          get().log(`[Avatar Custom] @${n} updated avatar: ${JSON.stringify(avatarPatch)}`);
          flushLiveSync(true);
          return;
        }

        // ---- 1. KIỂM TRA LỌC PHÍM TẮT SỐ VÀ CÂU LỆNH LÊN SÀN (1, 1., 1!, số 1, lên sàn...) ----
        const numMatch = raw.match(/\b([1-5])\b/) || raw.match(/^([1-5])/);
        const isJoinCmd = /1|lên|len|vào|vao|nhảy|nhay|dance/i.test(raw);

        if (numMatch || isJoinCmd) {
          const num = numMatch ? numMatch[1] : "1";
          const n = normalizeName(name);
          if (num === "1" || isJoinCmd) {
            get().join(n, platform, false);
            get().pushMc(`🎮 @${n} phán Phím 1 -> Lên sàn nhảy bùng nổ! 💃`);
          } else if (num === "2") {
            get().cycleStyle(n);
            get().pushMc(`🎮 @${n} phán Phím 2 -> Đổi trang phục cực chất! ✨`);
          } else if (num === "3") {
            get().orderDrink(n, "vinahouse_cocktail");
            get().pushMc(`🎮 @${n} phán Phím 3 -> Gọi Cocktail quẩy! 🍸`);
          } else if (num === "4") {
            get().triggerCo2Jet(2500);
            get().pushMc(`🎮 @${n} phán Phím 4 -> Phun khói CO2 cháy sàn! 💨`);
          } else if (num === "5") {
            get().triggerFirework(4000);
            get().pushMc(`🎮 @${n} phán Phím 5 -> Bắn pháo hoa VIP! 🎆`);
          }
          get().log(`[Shortcut 3D] @${n} matched Key ${num} -> Join/Action`);
          return;
        }

        if (cmdMatch(raw, p.commands.join)) get().join(name, platform, false);
        else if (cmdMatch(raw, p.commands.leave)) get().leave(name);
        else if (cmdMatch(raw, p.commands.dance)) get().dance(name);
        else if (cmdMatch(raw, p.commands.style)) get().cycleStyle(name);
        else if (cmdMatch(raw, p.commands.skin)) get().cycleSkin(name);
        else {
          get().log(`chat ${name}: ${raw}`);
          if (get().aiReplyEnabled) {
            const now = Date.now();
            const { lastAiReplyAt, cooldownMs, recentReplies, geminiApiKey, geminiModel, profileId } = get();

            // ---- 2. KIỂM TRA COOLDOWN (KHỐNG CHẾ GIỮA 2 CÂU TRẢ LỜI) ----
            if (now - lastAiReplyAt < cooldownMs) {
              get().log(`⏳ [Cooldown] Bỏ qua comment của @${name} do chưa đủ ${cooldownMs / 1000}s`);
              return;
            }

            set({ lastAiReplyAt: now });

            unlockMcSpeech();
            generateAiCommentReply({
              data: {
                name,
                comment: raw,
                profileId,
                customApiKey: geminiApiKey,
                selectedModel: geminiModel,
                recentReplies: recentReplies.slice(-2),
              },
            })
              .then((res) => {
                if (res && res.success && res.reply) {
                  get().pushMc(`🎤 MC: ${res.reply}`);
                  set((s) => ({
                    recentReplies: [...s.recentReplies, res.reply].slice(-8),
                  }));
                  get().log(`[Gemini AI (${res.provider}${res.modelUsed ? ` - ${res.modelUsed}` : ""})] Replying @${name}: "${res.reply}"`);
                }
              })
              .catch((err) => {
                console.warn("[Gemini AI Reply Exception]", err);
              });
          }
        }
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
        geminiApiKey: s.geminiApiKey,
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
    if (data.drinkOrders != null) patch.drinkOrders = data.drinkOrders;
    if (data.vipGuests != null) patch.vipGuests = data.vipGuests;
    if (data.co2JetUntil != null) patch.co2JetUntil = data.co2JetUntil;
    if (data.barMusicPlaying != null) patch.barMusicPlaying = data.barMusicPlaying;
    if (data.barBpm != null) patch.barBpm = data.barBpm;
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
  if (meta.at <= lastMetaAt && meta.rev <= localRev && localRev > 0) return;

  lastMetaAt = meta.at;
  if (meta.snapshot) {
    applySnapshot(meta.snapshot);
  } else {
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
  }
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
