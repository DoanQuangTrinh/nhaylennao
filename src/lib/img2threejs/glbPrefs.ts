/**
 * Client prefs for GLB dancers — no three.js import (safe for SSR/host panel).
 */

/** Detect SwiftShader / software WebGL where skinned GLB often renders invisible */
export function isSoftwareWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl =
      (c.getContext("webgl") as WebGLRenderingContext | null) ||
      (c.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return true;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info") as {
      UNMASKED_RENDERER_WEBGL: number;
    } | null;
    const renderer = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    return /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(
      renderer,
    );
  } catch {
    return false;
  }
}

/**
 * User preference. Default ON.
 * localStorage quanbar-use-glb = "0" | "1"
 */
export function isGlbPreferred(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.localStorage.getItem("quanbar-use-glb");
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setGlbPreferred(on: boolean) {
  try {
    window.localStorage.setItem("quanbar-use-glb", on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** True when we should actually spawn skinned GLB (pref ON and GPU ok, or force) */
export function shouldUseGlb(force = false): boolean {
  if (force) return true;
  if (!isGlbPreferred()) return false;
  if (isSoftwareWebGL()) return false;
  return true;
}
