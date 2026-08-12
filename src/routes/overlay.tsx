import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DanceFloor } from "@/components/overlay/DanceFloor";
import { GiftFx } from "@/components/overlay/GiftFx";
import { OverlayChrome } from "@/components/overlay/OverlayChrome";
import { initLiveSync, useLiveStore } from "@/lib/store/live-store";

export const Route = createFileRoute("/overlay")({
  component: OverlayPage,
  head: () => ({
    meta: [{ title: "Neon Club Live · 3D OBS Overlay" }],
  }),
});

function OverlayPage() {
  const ensureDemoFloor = useLiveStore((s) => s.ensureDemoFloor);
  const tickHype = useLiveStore((s) => s.tickHype);

  useEffect(() => {
    const stop = initLiveSync();
    ensureDemoFloor();
    // Hype is throttled inside tickHype (≥45s) — poll infrequently
    const hype = window.setInterval(() => tickHype(), 15_000);
    return () => {
      stop();
      window.clearInterval(hype);
    };
  }, [ensureDemoFloor, tickHype]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#05050a]">
      {/* Single WebGL context only — dual R3F canvas was causing stutter */}
      <DanceFloor className="absolute inset-0 h-full w-full" />
      <OverlayChrome />
      <GiftFx />
    </main>
  );
}
