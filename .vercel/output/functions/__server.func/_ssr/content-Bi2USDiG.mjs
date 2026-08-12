import { R as require_jsx_runtime, _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Button } from "./button-DrW3tuWO.mjs";
import { c as FileText, m as ArrowLeft, p as BookOpen } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/content-Bi2USDiG.js
var import_jsx_runtime = require_jsx_runtime();
var DOCS = [
	{
		slug: "BRAND",
		title: "Brand voice",
		desc: "Neon Club Live + Savage Fortune rules"
	},
	{
		slug: "STREAM_TITLES",
		title: "Stream titles",
		desc: "30+ EN titles for Club & Fortune"
	},
	{
		slug: "THUMBNAIL_TEXT",
		title: "Thumbnail text",
		desc: "Short overlay texts for thumbs"
	},
	{
		slug: "HOST_SCRIPTS",
		title: "Host scripts",
		desc: "0-viewer to 60-min rundowns"
	},
	{
		slug: "CHAT_GAMES",
		title: "Chat games",
		desc: "Mini-games with existing commands"
	},
	{
		slug: "SHORTS_PIPELINE",
		title: "Shorts pipeline",
		desc: "12–25s clip system"
	},
	{
		slug: "POSTING_CALENDAR_14_DAYS",
		title: "14-day calendar",
		desc: "Live slots + 3 shorts/day"
	},
	{
		slug: "PLATFORM_PLAYBOOK",
		title: "Platform playbook",
		desc: "TikTok-first growth"
	},
	{
		slug: "OBS_SETUP_GLOBAL",
		title: "OBS setup",
		desc: "International presentation"
	},
	{
		slug: "PINNED_AND_BIO",
		title: "Pinned & bio",
		desc: "Bio, about, end-screen CTA"
	}
];
function ContentIndex() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-bg px-4 py-8 sm:px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					asChild: true,
					className: "mb-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Back to host panel"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card neon-border p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xs uppercase tracking-[0.25em] text-accent",
							children: "content/global-en"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 font-display text-2xl font-bold text-fg sm:text-3xl",
							children: "Global EN Live Pack"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Operator-ready scripts, titles, calendar, and OBS setup for overseas English livestreams. Files also live on disk under content/global-en/."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-6 space-y-2",
					children: DOCS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/content/$slug",
						params: { slug: d.slug },
						className: "panel-card flex items-start gap-3 p-4 transition-colors hover:border-accent/40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mt-0.5 size-5 shrink-0 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold text-fg",
							children: d.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: d.desc
						})] })]
					}) }, d.slug))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 flex items-center gap-2 text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-3.5" }), "Tip: open these on a second screen while live."]
				})
			]
		})
	});
}
//#endregion
export { ContentIndex as component };
