import { r as __toESM } from "../_runtime.mjs";
import { R as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-DrW3tuWO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", {
	variants: {
		variant: {
			default: "bg-primary text-primary-fg hover:bg-primary/90",
			secondary: "bg-surface-2 text-fg hover:bg-surface-3 border border-border",
			outline: "border border-border bg-transparent text-fg hover:bg-surface-2",
			ghost: "text-muted hover:text-fg hover:bg-surface-2",
			danger: "bg-danger text-white hover:bg-danger/90",
			neon: "bg-accent text-bg hover:bg-accent/90 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
		},
		size: {
			default: "h-10 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-12 rounded-xl px-6 text-base",
			icon: "h-10 w-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild, children, ...props }, ref) => {
	const classes = cn(buttonVariants({
		variant,
		size,
		className
	}));
	if (asChild && import_react.isValidElement(children)) {
		const child = children;
		return import_react.cloneElement(child, { className: cn(classes, child.props.className) });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: classes,
		ref,
		...props,
		children
	});
});
Button.displayName = "Button";
//#endregion
export { cn as n, Button as t };
