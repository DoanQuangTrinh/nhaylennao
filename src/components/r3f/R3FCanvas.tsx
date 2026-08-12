import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Transparent so it can layer over imperative Three canvas */
  transparent?: boolean;
  camera?: { position?: [number, number, number]; fov?: number };
  dpr?: [number, number];
};

/**
 * Shared R3F entry — use for FX layers, Spline hosts, or full scenes.
 * Keep dpr capped for OBS/stream performance.
 */
export function R3FCanvas({
  children,
  className,
  transparent = true,
  camera = { position: [0, 2, 8], fov: 45 },
  dpr = [1, 1.5],
}: Props) {
  return (
    <div className={cn("relative h-full w-full", className)}>
      <Canvas
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: transparent,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        camera={{
          position: camera.position ?? [0, 2, 8],
          fov: camera.fov ?? 45,
          near: 0.1,
          far: 100,
        }}
        style={{ background: transparent ? "transparent" : "#100a14" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, transparent ? 0 : 1);
        }}
      >
        <Suspense fallback={null}>
          {children}
          <Preload all />
          <AdaptiveDpr pixelated />
        </Suspense>
      </Canvas>
    </div>
  );
}
