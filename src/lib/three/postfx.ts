import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

export type ClubComposer = {
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  resize: (w: number, h: number, dpr: number) => void;
  render: () => void;
  dispose: () => void;
};

/**
 * Club post stack — gentle bloom so neon edges glow without white-washing avatars.
 * Defaults: strength 0.11 · radius 0.26 · threshold 0.94
 * High threshold keeps avatars out of bloom; only neon lasers glow.
 */
export function createClubComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  opts: { strength?: number; radius?: number; threshold?: number } = {},
): ClubComposer {
  const size = new THREE.Vector2();
  renderer.getSize(size);
  const dpr = renderer.getPixelRatio();

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.setSize(size.x, size.y);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(size.x * dpr, size.y * dpr),
    opts.strength ?? 0.11,
    opts.radius ?? 0.26,
    opts.threshold ?? 0.94,
  );
  composer.addPass(bloom);

  const fxaa = new ShaderPass(FXAAShader);
  fxaa.material.uniforms["resolution"].value.set(
    1 / (size.x * dpr),
    1 / (size.y * dpr),
  );
  composer.addPass(fxaa);

  const output = new OutputPass();
  composer.addPass(output);

  return {
    composer,
    bloom,
    resize(w, h, nextDpr) {
      composer.setPixelRatio(nextDpr);
      composer.setSize(w, h);
      bloom.resolution.set(w * nextDpr, h * nextDpr);
      fxaa.material.uniforms["resolution"].value.set(
        1 / (w * nextDpr),
        1 / (h * nextDpr),
      );
    },
    render() {
      composer.render();
    },
    dispose() {
      composer.dispose();
    },
  };
}
