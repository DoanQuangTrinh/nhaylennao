import gsap from "gsap";
import * as THREE from "three";

/** Shared GSAP defaults for club motion */
gsap.defaults({ ease: "power2.out", overwrite: "auto" });

export { gsap };

/** Animate a Three.js Vector3 / Euler as a plain object (GSAP-friendly). */
export function gsapVec3(
  v: THREE.Vector3 | THREE.Euler,
  vars: gsap.TweenVars,
) {
  return gsap.to(v, vars);
}

/** Smooth camera intro: pull back into wide venue shot */
export function cameraVenueIntro(
  camera: THREE.PerspectiveCamera,
  target: { x: number; y: number; z: number },
  lookAt: THREE.Vector3,
  duration = 2.4,
) {
  const look = lookAt.clone();
  camera.position.set(target.x, target.y + 2.2, target.z + 4);
  camera.lookAt(look);

  const tl = gsap.timeline();
  tl.to(camera.position, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration,
    ease: "power3.out",
    onUpdate: () => camera.lookAt(look),
  });
  return tl;
}

/** Punch zoom on big gift */
export function cameraGiftPunch(camera: THREE.PerspectiveCamera, intensity = 1) {
  const z0 = camera.position.z;
  const y0 = camera.position.y;
  return gsap
    .timeline()
    .to(camera.position, {
      z: z0 - 1.2 * intensity,
      y: y0 - 0.25 * intensity,
      duration: 0.18,
      ease: "power2.in",
    })
    .to(camera.position, {
      z: z0,
      y: y0,
      duration: 0.55,
      ease: "elastic.out(1, 0.45)",
    });
}

/** Pulse emissive / scale on wing unlock */
export function pulseObject(obj: THREE.Object3D, scale = 1.15) {
  const s0 = obj.scale.x;
  return gsap
    .timeline()
    .to(obj.scale, { x: s0 * scale, y: s0 * scale, z: s0 * scale, duration: 0.2 })
    .to(obj.scale, { x: s0, y: s0, z: s0, duration: 0.45, ease: "elastic.out(1, 0.4)" });
}

/** LED strip color flicker via material */
export function pulseLed(mat: THREE.MeshBasicMaterial, colorA: string, colorB: string) {
  const proxy = { t: 0 };
  return gsap.to(proxy, {
    t: 1,
    duration: 0.6,
    repeat: 3,
    yoyo: true,
    onUpdate: () => {
      mat.color.set(proxy.t > 0.5 ? colorB : colorA);
    },
  });
}

/** Kill all club timelines safely */
export function killClubTweens(targets?: gsap.TweenTarget) {
  if (targets) gsap.killTweensOf(targets);
  else gsap.globalTimeline.clear();
}
