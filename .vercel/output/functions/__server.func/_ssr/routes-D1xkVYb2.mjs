import { r as __toESM } from "../_runtime.mjs";
import { R as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as cn, t as Button } from "./button-DrW3tuWO.mjs";
import { a as Radio, d as Copy, f as Check, i as Sparkles, l as ExternalLink, n as Users, o as Mic, s as Gift, t as WandSparkles, u as Disc3 } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as useLiveStore, n as initLiveSync, r as listProfiles, t as getProfile } from "./live-store-DpaoqF5F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D1xkVYb2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CopyBlock({ label, value }) {
	const [ok, setOk] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold uppercase tracking-wider text-muted",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				type: "button",
				onClick: async () => {
					await navigator.clipboard.writeText(value);
					setOk(true);
					toast.success(`${label} copied`);
					setTimeout(() => setOk(false), 1500);
				},
				children: [ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), "Copy"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "max-h-28 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-bg/60 p-3 text-xs leading-relaxed text-fg",
			children: value
		})]
	});
}
function HostPanel() {
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
	const [simName, setSimName] = (0, import_react.useState)("Alex");
	const [simText, setSimText] = (0, import_react.useState)("1");
	const [giftName, setGiftName] = (0, import_react.useState)("Sam");
	const [giftValue, setGiftValue] = (0, import_react.useState)(50);
	const [overlayUrl, setOverlayUrl] = (0, import_react.useState)("/overlay");
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const p = (0, import_react.useMemo)(() => getProfile(profileId), [profileId]);
	const profiles = listProfiles();
	(0, import_react.useEffect)(() => {
		setHydrated(true);
		setOverlayUrl(`${window.location.origin}/overlay`);
		const stop = initLiveSync();
		ensureDemoFloor();
		const hype = window.setInterval(() => tickHype(), 5e3);
		return () => {
			stop();
			window.clearInterval(hype);
		};
	}, [ensureDemoFloor, tickHype]);
	const livePackText = [
		`TITLE:\n${p.livePack.title}`,
		`DESCRIPTION:\n${p.livePack.description}`,
		`PINNED COMMENT:\n${p.livePack.pinned}`,
		`FIRST 60s SCRIPT:\n${p.livePack.first60s}`
	].join("\n\n");
	const checklist = [
		{
			ok: platformConnected !== "none",
			label: "Connect platform (or use Demo for rehearsal)"
		},
		{
			ok: mcAudioEnabled,
			label: "MC audio enabled (TTS / AI MC in OBS)"
		},
		{
			ok: true,
			label: `OBS browser source → ${hydrated ? overlayUrl : "/overlay"}`
		},
		{
			ok: true,
			label: `Resolution: portrait ${p.obs.portrait} or landscape ${p.obs.landscape}`
		},
		{
			ok: autoDemo,
			label: "Empty-room demo floor ON (floor never looks dead)"
		},
		{
			ok: profileId === "global-en",
			label: "Global EN profile active for overseas live"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "panel-card neon-border overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative px-5 py-6 sm:px-8 sm:py-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary/20 blur-3xl" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -bottom-12 left-1/3 size-40 rounded-full bg-accent/15 blur-3xl" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xs uppercase tracking-[0.3em] text-accent",
							children: "QuanBar · Host Control"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl",
							children: p.showBrand
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-2xl text-sm text-muted sm:text-base",
							children: p.oneLiner
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full border border-border bg-bg/50 px-3 py-1 text-xs text-fg",
									children: ["Profile: ", p.label]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full border border-border bg-bg/50 px-3 py-1 text-xs text-fg",
									children: ["Mode: ", mode === "club" ? "Neon Club" : p.fortune.brand]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full border border-border bg-bg/50 px-3 py-1 text-xs text-fg",
									children: [
										"Hype every ",
										p.mc.hypeIntervalSec,
										"s"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full border border-border bg-bg/50 px-3 py-1 text-xs text-fg",
									children: ["Floor: ", dancers.length]
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6 lg:col-span-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-card p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-sm uppercase tracking-wider text-accent",
									children: "Live profile"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 grid gap-2 sm:grid-cols-2",
									children: profiles.map((pr) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setProfileId(pr.id),
										className: cn("rounded-xl border px-4 py-3 text-left transition-colors", profileId === pr.id ? "border-accent bg-accent/10 neon-border" : "border-border bg-bg/40 hover:bg-surface-2"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-fg",
											children: pr.label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-0.5 text-xs text-muted",
											children: pr.description
										})]
									}, pr.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: mode === "club" ? "neon" : "secondary",
										onClick: () => setMode("club"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Disc3, { className: "size-4" }), "Club mode"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: mode === "fortune" ? "neon" : "secondary",
										onClick: () => setMode("fortune"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "size-4" }), "Fortune mode"]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-card p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-sm uppercase tracking-wider text-accent",
									children: "Global Live Checklist"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 space-y-2",
									children: checklist.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-start gap-2 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", c.ok ? "bg-success/20 text-success" : "bg-warning/20 text-warning"),
											children: c.ok ? "✓" : "!"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-fg",
											children: c.label
										})]
									}, c.label))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex flex-wrap gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											onClick: async () => {
												await navigator.clipboard.writeText(overlayUrl);
												toast.success("Overlay URL copied");
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), "Copy overlay URL"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											size: "sm",
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: "/overlay",
												target: "_blank",
												rel: "noreferrer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), "Open overlay"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											size: "sm",
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: "/content",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), "Content pack"]
											})
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-card p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-sm uppercase tracking-wider text-accent",
									children: "Connect & MC"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 flex flex-wrap gap-2",
									children: [
										["demo", "Demo / Rehearsal"],
										["tiktok", "TikTok"],
										["youtube", "YouTube"],
										["facebook", "Facebook"]
									].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: platformConnected === id ? "default" : "secondary",
										onClick: () => {
											setPlatform(id);
											pushMc(p.language === "en" ? `Platform set: ${label}` : `Nền tảng: ${label}`);
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-3.5" }), label]
									}, id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex flex-wrap gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: mcAudioEnabled ? "neon" : "secondary",
											onClick: () => setMcAudio(!mcAudioEnabled),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-3.5" }),
												"MC audio ",
												mcAudioEnabled ? "ON" : "OFF"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: autoDemo ? "neon" : "secondary",
											onClick: () => setAutoDemo(!autoDemo),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3.5" }),
												"Auto-demo floor ",
												autoDemo ? "ON" : "OFF"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => ensureDemoFloor(),
											children: "Fill demo dancers"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => clearFloor(),
											children: "Clear floor"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => {
												useLiveStore.setState({ lastHypeAt: 0 });
												tickHype();
											},
											children: "Fire hype line now"
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-card p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-sm uppercase tracking-wider text-accent",
									children: "Chat / gift simulator"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted",
									children: [
										"Rehearse commands before going live. Commands:",
										" ",
										p.commands.join.join("/"),
										" join · ",
										p.commands.leave.join("/"),
										" leave ·",
										" ",
										p.commands.dance[0],
										" · ",
										p.commands.style[0],
										" · ",
										p.commands.skin[0]
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex flex-col gap-2 sm:flex-row",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring",
											value: simName,
											onChange: (e) => setSimName(e.target.value),
											placeholder: "Username"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "h-10 flex-[2] rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring",
											value: simText,
											onChange: (e) => setSimText(e.target.value),
											placeholder: "Chat message",
											onKeyDown: (e) => {
												if (e.key === "Enter") processChat(simName, simText);
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											onClick: () => processChat(simName, simText),
											children: "Send"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 flex flex-wrap gap-2",
									children: [
										"1",
										"0",
										"dance",
										"style",
										"skin"
									].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "secondary",
										onClick: () => processChat(simName, c),
										children: c
									}, c))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex flex-col gap-2 sm:flex-row sm:items-end",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-xs text-muted",
												children: "Gifter"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												className: "mt-1 h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring",
												value: giftName,
												onChange: (e) => setGiftName(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-xs text-muted",
											children: "Value (diamonds)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											className: "mt-1 h-10 w-28 rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-ring",
											value: giftValue,
											onChange: (e) => setGiftValue(Number(e.target.value) || 1)
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "default",
											onClick: () => sendGift(giftName, "Rose Pack", giftValue),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "size-4" }), "Send gift FX"]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 whitespace-pre-wrap text-[11px] leading-relaxed text-muted",
									children: p.gifts.note
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6 lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-card p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-sm uppercase tracking-wider text-accent",
									children: "Copy live pack"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "neon",
									onClick: async () => {
										await navigator.clipboard.writeText(livePackText);
										toast.success("Full live pack copied");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), "Copy all"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBlock, {
										label: "Stream title",
										value: p.livePack.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBlock, {
										label: "Description",
										value: p.livePack.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBlock, {
										label: "Pinned comment",
										value: p.livePack.pinned
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBlock, {
										label: "First 60s host script",
										value: p.livePack.first60s
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-card p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-sm uppercase tracking-wider text-accent",
								children: "MC feed"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-3 max-h-48 space-y-2 overflow-auto",
								children: [mcLines.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "text-xs text-muted",
									children: "No lines yet — send a chat or fire hype."
								}), mcLines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "rounded-lg border border-border/60 bg-bg/40 px-3 py-2 text-xs text-fg",
									children: l.text
								}, l.id))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-card p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-sm uppercase tracking-wider text-accent",
								children: "TOP board"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
								className: "mt-2 space-y-1",
								children: [top.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "text-xs text-muted",
									children: "No gifts yet."
								}), top.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										i + 1,
										". ",
										t.name
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular-nums text-accent",
										children: t.total
									})]
								}, t.name))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel-card p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-sm uppercase tracking-wider text-accent",
								children: "Event log"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 max-h-40 space-y-1 overflow-auto font-mono text-[11px] text-muted",
								children: eventLog.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: e }, i))
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "pb-8 text-center text-xs text-muted",
				children: [
					"Product: QuanBar · Show brand: ",
					p.showBrand,
					" · Secondary: ",
					p.fortune.brand,
					" ·",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "text-accent underline-offset-2 hover:underline",
						href: "/content",
						children: "content/global-en pack"
					})
				]
			})
		]
	});
}
function HomePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HostPanel, {})
	});
}
//#endregion
export { HomePage as component };
