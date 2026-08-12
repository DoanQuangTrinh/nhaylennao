import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live-store-DpaoqF5F.js
var default_default = {
	id: "local-vi",
	label: "Local VI",
	language: "vi",
	showBrand: "Quán Bar Live",
	productBrand: "QuanBar",
	oneLiner: "Gõ 1 để vào sàn — tặng quà bắn pháo hoa.",
	mode: "club",
	banner: {
		"primary": "GÕ 1 ĐỂ VÀO SÀN",
		"secondary": "Gõ 0 để rời · dance · style · skin",
		"floorFull": "Sàn đầy rồi! Đợi lượt hoặc tặng quà để ưu tiên.",
		"giftCta": "Tặng quà = pháo hoa + TOP board",
		"fortunePrimary": "HỎI GÌ CŨNG ĐƯỢC — AI Master đọc số mệnh",
		"fortuneSecondary": "Comment câu hỏi của bạn ngay"
	},
	commands: {
		"join": [
			"1",
			"join",
			"vào"
		],
		"leave": [
			"0",
			"leave",
			"ra"
		],
		"dance": ["dance", "nhảy"],
		"style": ["style", "đổi"],
		"skin": ["skin"]
	},
	mc: {
		"enabled": true,
		"hypeIntervalSec": 180,
		"greet": [
			"Chào {name}! Vào sàn nào!",
			"Hey {name}, nhảy đi!",
			"{name} đã vào club!"
		],
		"thank": ["Cảm ơn {name} đã tặng {gift}!", "Wow {name} quá đã với {gift}!"],
		"hype": [
			"Gõ 1 để vào sàn nhảy!",
			"Sàn đang chờ bạn — type 1!",
			"Tặng quà để bắn pháo hoa!",
			"Ai dám nhảy tiếp không?"
		],
		"floorFull": ["Sàn đầy rồi bạn ơi, đợi chút nhé!"]
	},
	gifts: {
		"note": "TikTok diamond scale (approx): Rose=1, Finger Heart=5, GG=1, Perfume=20, Universe=1000+",
		"thresholds": [
			{
				"minValue": 1,
				"effect": "spark",
				"label": "Spark"
			},
			{
				"minValue": 10,
				"effect": "confetti",
				"label": "Confetti"
			},
			{
				"minValue": 50,
				"effect": "fireworks",
				"label": "Fireworks"
			},
			{
				"minValue": 200,
				"effect": "mega",
				"label": "Mega Blast"
			},
			{
				"minValue": 1e3,
				"effect": "legendary",
				"label": "Legendary"
			}
		]
	},
	gemini: { "systemInstruction": "Bạn là MC quán bar livestream Việt Nam. Nói ngắn, vui, năng lượng cao. Không dài dòng." },
	fortune: {
		"brand": "Tử Vi Live",
		"systemInstruction": "Bạn là AI Master đọc số mệnh, hơi roast nhẹ, trả lời ngắn 2-4 câu tiếng Việt.",
		"ctaBanner": "Comment câu hỏi — AI Master trả lời trong 10 giây",
		"demoLines": ["Hôm nay vận tình duyên của bạn hơi... lủng củng.", "Sự nghiệp đang mở — nhưng đừng khoe sớm."]
	},
	emptyFloor: {
		"autoDemo": true,
		"demoNames": [
			"Lan",
			"Minh",
			"Huy",
			"Trang",
			"Khoa"
		]
	},
	obs: {
		"portrait": "1080x1920",
		"landscape": "1920x1080",
		"overlayPath": "/overlay"
	},
	livePack: {
		"title": "Quán Bar Live — Gõ 1 vào sàn 🕺",
		"description": "Interactive bar overlay. Gõ 1 join, 0 leave, dance, tặng quà pháo hoa.",
		"pinned": "CÁCH CHƠI: Gõ 1 vào sàn · 0 rời · dance nhảy · tặng quà = pháo hoa",
		"first60s": "Chào mọi người! Gõ 1 để vào sàn ngay. Ai tặng quà đầu tiên mình bật pháo hoa!"
	}
};
var global_en_default = {
	id: "global-en",
	label: "Global EN",
	language: "en",
	showBrand: "Neon Club Live",
	productBrand: "QuanBar",
	oneLiner: "Free interactive nightclub — type 1 to join the floor. Gifts unlock fireworks.",
	mode: "club",
	banner: {
		"primary": "TYPE 1 TO JOIN THE FLOOR",
		"secondary": "Type 0 to leave · dance · style · skin",
		"floorFull": "Floor is full! Wait your turn — or gift to jump the line.",
		"giftCta": "Send a gift = fireworks + TOP board",
		"fortunePrimary": "ASK ANYTHING — AI Master roasts your fate",
		"fortuneSecondary": "Type your question in chat right now"
	},
	commands: {
		"join": [
			"1",
			"join",
			"j"
		],
		"leave": [
			"0",
			"leave",
			"l"
		],
		"dance": ["dance", "d"],
		"style": ["style", "s"],
		"skin": ["skin"]
	},
	mc: {
		"enabled": true,
		"hypeIntervalSec": 100,
		"greet": [
			"Welcome {name}! Hit the floor!",
			"Yo {name} just walked in — let's go!",
			"{name} is in the club! Type dance!",
			"Big welcome to {name}!",
			"{name} joined the neon floor!"
		],
		"thank": [
			"Thank you {name} for the {gift}!",
			"Fireworks for {name} — that {gift} hit different!",
			"{name} just lit up the club with {gift}!",
			"Huge love to {name} for {gift}!"
		],
		"hype": [
			"Type 1 to join the dance floor — free!",
			"Empty spot on the floor — type 1 right now!",
			"Send a gift and we drop fireworks!",
			"Who's next? Type 1 and own the floor!",
			"Club is open — type 1, dance, gift for FX!",
			"New viewers: type 1 to appear on stream!",
			"Gift ladder is live — climb the TOP board!",
			"Don't just watch — type 1 and join us!",
			"Savage energy only — type 1 or ask the AI Master!",
			"Fireworks unlock with gifts — make it rain!",
			"Style parade soon — type style to switch looks!",
			"First-timers: type 1. That's it. You're in."
		],
		"floorFull": ["Floor is packed! Gift to priority-queue, or wait for a spot."]
	},
	gifts: {
		"note": "Diamond psychology (TikTok-style units):\n• 1–9: Spark — small pop, name shoutout\n• 10–49: Confetti — screen confetti + MC thank\n• 50–199: Fireworks — full stage fireworks\n• 200–999: Mega Blast — camera shake + TOP boost\n• 1000+: Legendary — full takeover FX + sticky TOP\nYouTube Super Chat map: $1≈spark, $5≈confetti, $20≈fireworks, $50≈mega, $100+≈legendary.",
		"thresholds": [
			{
				"minValue": 1,
				"effect": "spark",
				"label": "Spark"
			},
			{
				"minValue": 10,
				"effect": "confetti",
				"label": "Confetti"
			},
			{
				"minValue": 50,
				"effect": "fireworks",
				"label": "Fireworks"
			},
			{
				"minValue": 200,
				"effect": "mega",
				"label": "Mega Blast"
			},
			{
				"minValue": 1e3,
				"effect": "legendary",
				"label": "Legendary"
			}
		]
	},
	gemini: { "systemInstruction": "You are the Neon Club Live nightclub MC for an international English livestream (SEA + US). Speak ONLY English. Keep every line short (1–2 sentences), funny, high-energy, and conversion-focused: push viewers to type 1 to join, dance, and send gifts for fireworks. Never use Vietnamese. Never lecture. Sound like a hype club host, not a podcast. Roast lightly, celebrate gifts loudly, welcome new names. If the floor is empty, sound busy and inviting — never admit the room is dead." },
	fortune: {
		"brand": "Savage Fortune Live",
		"systemInstruction": "You are the Savage Fortune Live AI Master. English only. Roast-friendly spiritual tarot vibe: witty, sharp, kind under the burn. Answer in 2–4 short spoken sentences. End with a hook (gift, follow, or next question). Never Vietnamese. Never medical/legal claims. Entertainment only.",
		"ctaBanner": "Drop your question — AI Master roasts your fate in 10 seconds",
		"demoLines": [
			"Your love life? Bold of you to ask on a public stream… but the cards say: stop texting first.",
			"Career looks spicy — but if you keep ghosting opportunities, the universe will ghost you back.",
			"Money energy is coming. Don't spend it on something that leaves before sunrise.",
			"Someone from your past is watching. Don't open that door unless you like chaos.",
			"Main character energy detected — now act like it. Type another question."
		]
	},
	emptyFloor: {
		"autoDemo": true,
		"demoNames": [
			"Aya",
			"Ken",
			"Mia",
			"Jay",
			"Rio",
			"Nova",
			"Leo",
			"Sky"
		]
	},
	obs: {
		"portrait": "1080x1920",
		"landscape": "1920x1080",
		"overlayPath": "/overlay"
	},
	livePack: {
		"title": "TYPE 1 TO JOIN 🕺 Free Interactive Nightclub | Neon Club Live",
		"description": "Free interactive nightclub on stream. Type 1 to join the floor. Type 0 to leave. Type dance. Gifts unlock fireworks. Welcome SEA + global fam — English only.",
		"pinned": "HOW TO PLAY → Type 1 = join floor · 0 = leave · dance = move · style/skin = look · GIFTS = fireworks + TOP board. New? Just type 1.",
		"first60s": "Yo family — Neon Club is LIVE! If you just walked in, type 1 right now and you appear on the dance floor. Free. No download. Type dance to move. Send any gift and we drop fireworks. Let's pack this floor in the next 60 seconds — type 1!"
	},
	secondaryMode: {
		"id": "fortune",
		"brand": "Savage Fortune Live",
		"oneLiner": "Ask anything — AI Master roasts your fate in 10 seconds.",
		"title": "Savage Fortune Live 🔮 AI roasts your fate in 10s | Ask anything"
	}
};
var profilesRegistry = {
	defaultProfile: "global-en",
	profiles: [{
		"id": "local-vi",
		"file": "default.json",
		"label": "Local VI",
		"description": "Vietnamese local audience — Quán Bar Live"
	}, {
		"id": "global-en",
		"file": "global-en.json",
		"label": "Global EN",
		"description": "English-first overseas — Neon Club Live + Savage Fortune"
	}]
};
var profileMap = {
	"local-vi": default_default,
	"global-en": global_en_default
};
function getProfile(id) {
	return profileMap[id] ?? profileMap["global-en"];
}
function listProfiles() {
	return profilesRegistry.profiles;
}
function resolveGiftEffect(profile, value) {
	const sorted = [...profile.gifts.thresholds].sort((a, b) => b.minValue - a.minValue);
	for (const t of sorted) if (value >= t.minValue) return {
		effect: t.effect,
		label: t.label
	};
	return {
		effect: "spark",
		label: "Spark"
	};
}
function fillTemplate(template, vars) {
	return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}
function pickRandom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}
var CHANNEL = "quanbar-live-sync";
var MAX_FLOOR = 12;
function uid() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function normalizeName(name) {
	return name.trim() || "Guest";
}
function cmdMatch(text, aliases) {
	const t = text.trim().toLowerCase();
	return aliases.some((a) => t === a.toLowerCase() || t.startsWith(a.toLowerCase() + " "));
}
var useLiveStore = create()(persist((set, get) => ({
	profileId: "global-en",
	mode: "club",
	dancers: [],
	top: [],
	gifts: [],
	mcLines: [],
	lastHypeAt: 0,
	maxFloor: MAX_FLOOR,
	platformConnected: "demo",
	mcAudioEnabled: true,
	autoDemo: true,
	bannerFlash: null,
	fortuneAnswer: null,
	eventLog: [],
	getProfile: () => getProfile(get().profileId),
	setProfileId: (id) => {
		set({ profileId: id });
		const p = getProfile(id);
		get().pushMc(id === "global-en" ? "Global EN pack loaded — Neon Club Live is ready." : "Gói Local VI đã bật — Quán Bar Live sẵn sàng.");
		if (p.emptyFloor.autoDemo) get().ensureDemoFloor();
	},
	setMode: (mode) => {
		set({
			mode,
			fortuneAnswer: null
		});
		const p = get().getProfile();
		if (mode === "fortune") get().pushMc(p.language === "en" ? "Savage Fortune mode ON — drop your questions in chat." : "Chế độ tử vi bật — comment câu hỏi đi!");
		else get().pushMc(p.language === "en" ? "Club mode ON — type 1 to join the floor!" : "Chế độ club bật — gõ 1 vào sàn!");
	},
	setPlatform: (p) => set({ platformConnected: p }),
	setMcAudio: (on) => set({ mcAudioEnabled: on }),
	setAutoDemo: (on) => {
		set({ autoDemo: on });
		if (on) get().ensureDemoFloor();
	},
	log: (msg) => set((s) => ({ eventLog: [`${(/* @__PURE__ */ new Date()).toLocaleTimeString()} ${msg}`, ...s.eventLog].slice(0, 40) })),
	pushMc: (text) => {
		const line = {
			id: uid(),
			text,
			at: Date.now()
		};
		set((s) => ({
			mcLines: [line, ...s.mcLines].slice(0, 12),
			bannerFlash: text
		}));
		get().log(`MC: ${text}`);
		if (typeof window !== "undefined") window.setTimeout(() => {
			if (get().bannerFlash === text) set({ bannerFlash: null });
		}, 4500);
	},
	join: (name, platform = "demo", isDemo = false) => {
		const n = normalizeName(name);
		const p = get().getProfile();
		if (get().dancers.find((d) => d.name.toLowerCase() === n.toLowerCase())) {
			get().pushMc(p.language === "en" ? `${n} is already on the floor!` : `${n} đã ở trên sàn rồi!`);
			return;
		}
		if (get().dancers.length >= get().maxFloor) {
			get().pushMc(pickRandom(p.mc.floorFull));
			set({ bannerFlash: p.banner.floorFull });
			return;
		}
		const dancer = {
			id: uid(),
			name: n,
			platform,
			style: Math.floor(Math.random() * 6),
			skin: Math.floor(Math.random() * 8),
			dancing: true,
			isDemo,
			joinedAt: Date.now()
		};
		set((s) => ({ dancers: [...s.dancers, dancer] }));
		if (!isDemo) get().pushMc(fillTemplate(pickRandom(p.mc.greet), { name: n }));
		get().log(`${n} joined${isDemo ? " (demo)" : ""}`);
	},
	leave: (name) => {
		const n = normalizeName(name);
		set((s) => ({ dancers: s.dancers.filter((d) => d.name.toLowerCase() !== n.toLowerCase()) }));
		get().log(`${n} left`);
		if (get().autoDemo && get().dancers.filter((d) => !d.isDemo).length === 0) get().ensureDemoFloor();
	},
	dance: (name) => {
		const n = normalizeName(name);
		set((s) => ({ dancers: s.dancers.map((d) => d.name.toLowerCase() === n.toLowerCase() ? {
			...d,
			dancing: !d.dancing
		} : d) }));
		get().log(`${n} toggled dance`);
	},
	cycleStyle: (name) => {
		const n = normalizeName(name);
		set((s) => ({ dancers: s.dancers.map((d) => d.name.toLowerCase() === n.toLowerCase() ? {
			...d,
			style: (d.style + 1) % 6
		} : d) }));
	},
	cycleSkin: (name) => {
		const n = normalizeName(name);
		set((s) => ({ dancers: s.dancers.map((d) => d.name.toLowerCase() === n.toLowerCase() ? {
			...d,
			skin: (d.skin + 1) % 8
		} : d) }));
	},
	sendGift: (name, gift, value) => {
		const n = normalizeName(name);
		const p = get().getProfile();
		const { effect, label } = resolveGiftEffect(p, value);
		const ev = {
			id: uid(),
			name: n,
			gift,
			value,
			effect,
			label,
			at: Date.now()
		};
		set((s) => {
			const topMap = new Map(s.top.map((t) => [t.name.toLowerCase(), t]));
			const key = n.toLowerCase();
			const prev = topMap.get(key);
			topMap.set(key, {
				name: n,
				total: (prev?.total ?? 0) + value
			});
			const top = [...topMap.values()].sort((a, b) => b.total - a.total).slice(0, 10);
			return {
				gifts: [ev, ...s.gifts].slice(0, 20),
				top
			};
		});
		get().pushMc(fillTemplate(pickRandom(p.mc.thank), {
			name: n,
			gift: `${gift} (${label})`
		}));
		if (!get().dancers.some((d) => d.name.toLowerCase() === n.toLowerCase())) get().join(n, "demo", false);
	},
	processChat: (name, text, platform = "demo") => {
		const p = get().getProfile();
		const raw = text.trim();
		if (!raw) return;
		if (get().mode === "fortune") {
			if (!cmdMatch(raw, p.commands.join) && !cmdMatch(raw, p.commands.leave) && !cmdMatch(raw, p.commands.dance) && !cmdMatch(raw, p.commands.style) && !cmdMatch(raw, p.commands.skin)) {
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
		const line = pickRandom(get().getProfile().fortune.demoLines);
		const answer = `${normalizeName(name)}: ${line}`;
		set({ fortuneAnswer: answer });
		get().pushMc(answer);
		get().log(`Fortune Q from ${name}: ${question}`);
	},
	tickHype: () => {
		const p = get().getProfile();
		if (!p.mc.enabled) return;
		const now = Date.now();
		const interval = (p.mc.hypeIntervalSec || 100) * 1e3;
		if (now - get().lastHypeAt < interval) return;
		set({ lastHypeAt: now });
		if (get().mode === "fortune") get().pushMc(p.fortune.ctaBanner);
		else {
			const useGift = Math.random() > .55;
			get().pushMc(useGift ? p.banner.giftCta : pickRandom(p.mc.hype));
		}
	},
	ensureDemoFloor: () => {
		if (!get().autoDemo) return;
		const p = get().getProfile();
		if (get().dancers.filter((d) => !d.isDemo).length > 0) return;
		const demos = get().dancers.filter((d) => d.isDemo);
		if (demos.length >= 3) return;
		const names = p.emptyFloor.demoNames;
		const need = 3 - demos.length;
		for (let i = 0; i < need; i++) {
			const name = names[(demos.length + i) % names.length];
			if (!get().dancers.some((d) => d.name === name)) get().join(name, "demo", true);
		}
	},
	clearFloor: () => {
		set({
			dancers: [],
			gifts: []
		});
		get().log("Floor cleared");
		if (get().autoDemo) get().ensureDemoFloor();
	}
}), {
	name: "quanbar-live-v1",
	partialize: (s) => ({
		profileId: s.profileId,
		mode: s.mode,
		dancers: s.dancers,
		top: s.top,
		platformConnected: s.platformConnected,
		mcAudioEnabled: s.mcAudioEnabled,
		autoDemo: s.autoDemo,
		lastHypeAt: s.lastHypeAt
	})
}));
/** Cross-tab sync for host panel ↔ OBS overlay */
function initLiveSync() {
	if (typeof window === "undefined") return () => {};
	const bc = new BroadcastChannel(CHANNEL);
	let applying = false;
	const unsub = useLiveStore.subscribe((state) => {
		if (applying) return;
		bc.postMessage({
			profileId: state.profileId,
			mode: state.mode,
			dancers: state.dancers,
			top: state.top,
			gifts: state.gifts,
			mcLines: state.mcLines,
			bannerFlash: state.bannerFlash,
			fortuneAnswer: state.fortuneAnswer,
			platformConnected: state.platformConnected,
			mcAudioEnabled: state.mcAudioEnabled,
			autoDemo: state.autoDemo
		});
	});
	bc.onmessage = (ev) => {
		applying = true;
		useLiveStore.setState(ev.data);
		applying = false;
	};
	return () => {
		unsub();
		bc.close();
	};
}
//#endregion
export { useLiveStore as i, initLiveSync as n, listProfiles as r, getProfile as t };
