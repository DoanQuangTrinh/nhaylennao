import { r as __toESM } from "../_runtime.mjs";
import { R as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useLiveStore, n as initLiveSync, t as getProfile } from "./live-store-DpaoqF5F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/overlay-cuulPM8R.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SKINS = [
	"#22d3ee",
	"#a855f7",
	"#f472b6",
	"#34d399",
	"#fbbf24",
	"#f43f5e",
	"#60a5fa",
	"#e879f9"
];
function DanceFloor() {
	const dancers = useLiveStore((s) => s.dancers);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stage relative h-full w-full min-h-[320px]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stage-grid",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-bg/80 to-transparent" }),
			dancers.map((d, i) => {
				const count = Math.max(dancers.length, 1);
				const left = (i + .5) / count * 86 + 7;
				const color = SKINS[d.skin % SKINS.length];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `dancer ${d.dancing ? "dancing" : ""}`,
					style: {
						left: `${left}%`,
						transform: `translateX(-50%) scale(${.9 + d.style % 3 * .08})`,
						zIndex: 10 + i
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dancer-body",
						style: { background: color }
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "dancer-name text-fg",
						children: [d.isDemo ? "· " : "", d.name]
					})]
				}, d.id);
			}),
			dancers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 flex items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg tracking-widest text-muted text-glow",
					children: "WAITING FOR DANCERS"
				})
			})
		]
	});
}
var COLORS = [
	"#22d3ee",
	"#a855f7",
	"#f472b6",
	"#fbbf24",
	"#34d399",
	"#ff2d95"
];
function GiftFx() {
	const latest = useLiveStore((s) => s.gifts)[0];
	const [particles, setParticles] = (0, import_react.useState)([]);
	const [bursts, setBursts] = (0, import_react.useState)([]);
	const [seen, setSeen] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!latest || latest.id === seen) return;
		setSeen(latest.id);
		const count = latest.effect === "legendary" ? 48 : latest.effect === "mega" ? 36 : latest.effect === "fireworks" ? 28 : latest.effect === "confetti" ? 20 : 10;
		const parts = Array.from({ length: count }, (_, i) => ({
			id: `${latest.id}-${i}`,
			left: Math.random() * 100,
			color: COLORS[i % COLORS.length],
			delay: Math.random() * .4,
			size: 6 + Math.random() * 10
		}));
		setParticles(parts);
		if ([
			"fireworks",
			"mega",
			"legendary"
		].includes(latest.effect)) {
			const b = Array.from({ length: latest.effect === "legendary" ? 5 : 3 }, (_, i) => ({
				id: `b-${latest.id}-${i}`,
				x: 20 + Math.random() * 60,
				y: 15 + Math.random() * 40,
				color: COLORS[i % COLORS.length]
			}));
			setBursts(b);
		}
		const t = window.setTimeout(() => {
			setParticles([]);
			setBursts([]);
		}, 2400);
		return () => window.clearTimeout(t);
	}, [latest, seen]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-30 overflow-hidden",
		children: [
			particles.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "fx-particle",
				style: {
					left: `${p.left}%`,
					top: "-5%",
					width: p.size,
					height: p.size * 1.4,
					background: p.color,
					animationDelay: `${p.delay}s`
				}
			}, p.id)),
			bursts.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "fx-burst",
				style: {
					left: `${b.x}%`,
					top: `${b.y}%`,
					borderColor: b.color,
					boxShadow: `0 0 30px ${b.color}`
				}
			}, b.id)),
			latest && Date.now() - latest.at < 3e3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute left-1/2 top-[28%] -translate-x-1/2 panel-card neon-border px-5 py-2 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-sm text-accent",
					children: latest.label.toUpperCase()
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-fg",
					children: [
						latest.name,
						" · ",
						latest.gift,
						" · ",
						latest.value
					]
				})]
			})
		]
	});
}
function OverlayChrome() {
	const profileId = useLiveStore((s) => s.profileId);
	const mode = useLiveStore((s) => s.mode);
	const bannerFlash = useLiveStore((s) => s.bannerFlash);
	const fortuneAnswer = useLiveStore((s) => s.fortuneAnswer);
	const top = useLiveStore((s) => s.top);
	const dancers = useLiveStore((s) => s.dancers);
	const p = getProfile(profileId);
	const primary = mode === "fortune" ? p.banner.fortunePrimary : p.banner.primary;
	const secondary = mode === "fortune" ? p.banner.fortuneSecondary : p.banner.secondary;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card neon-border max-w-[70%] px-4 py-3 backdrop-blur-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-[10px] uppercase tracking-[0.25em] text-accent",
							children: mode === "fortune" ? p.fortune.brand : p.showBrand
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-xl font-bold leading-tight text-glow text-fg sm:text-2xl banner-pulse",
							children: bannerFlash ?? primary
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted sm:text-sm",
							children: secondary
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card min-w-[140px] px-3 py-2 backdrop-blur-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-[10px] uppercase tracking-widest text-accent-2",
						children: "TOP GIFTS"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-1 space-y-0.5",
						children: (top.length ? top : [{
							name: "—",
							total: 0
						}]).slice(0, 5).map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between gap-3 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "truncate text-fg",
								children: [
									i + 1,
									". ",
									t.name
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums text-accent",
								children: t.total
							})]
						}, t.name + i))
					})]
				})]
			}),
			mode === "fortune" && fortuneAnswer && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-xl panel-card neon-border px-5 py-4 text-center backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-[10px] uppercase tracking-widest text-warning",
					children: "AI Master"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm leading-relaxed text-fg sm:text-base",
					children: fortuneAnswer
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "panel-card px-3 py-2 backdrop-blur-md",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							"On floor: ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-fg",
								children: dancers.length
							}),
							" · ",
							p.banner.giftCta
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "panel-card px-3 py-2 text-right backdrop-blur-md",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xs uppercase tracking-wider text-accent",
						children: p.oneLiner
					})
				})]
			})
		]
	});
}
function OverlayPage() {
	const ensureDemoFloor = useLiveStore((s) => s.ensureDemoFloor);
	const tickHype = useLiveStore((s) => s.tickHype);
	(0, import_react.useEffect)(() => {
		const stop = initLiveSync();
		ensureDemoFloor();
		const hype = window.setInterval(() => tickHype(), 5e3);
		return () => {
			stop();
			window.clearInterval(hype);
		};
	}, [ensureDemoFloor, tickHype]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-screen w-screen overflow-hidden bg-transparent",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DanceFloor, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverlayChrome, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GiftFx, {})
		]
	});
}
//#endregion
export { OverlayPage as component };
