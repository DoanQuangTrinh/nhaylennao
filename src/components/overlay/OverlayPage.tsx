import { useEffect } from "react";
import { BarMenuOverlay } from "@/components/overlay/BarMenuOverlay";
import { DanceFloorClient } from "@/components/overlay/DanceFloorClient";
import { GiftFx } from "@/components/overlay/GiftFx";
import { OverlayChrome } from "@/components/overlay/OverlayChrome";
import { initLiveSync, useLiveStore } from "@/lib/store/live-store";

export default function OverlayPage() {
  const ensureDemoFloor = useLiveStore((s) => s.ensureDemoFloor);
  const tickHype = useLiveStore((s) => s.tickHype);
  const aspectRatio = useLiveStore((s) => s.aspectRatio || "9:16");

  useEffect(() => {
    const stop = initLiveSync();
    ensureDemoFloor();
    const hype = window.setInterval(() => tickHype(), 15_000);
    return () => {
      stop();
      window.clearInterval(hype);
    };
  }, [ensureDemoFloor, tickHype]);

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#05050a]">
      <div
        className={`relative transition-all duration-300 ${
          aspectRatio === "9:16"
            ? "aspect-[9/16] h-full max-h-screen w-auto shadow-2xl border border-white/10"
            : aspectRatio === "4:3"
              ? "aspect-[4/3] h-full max-h-screen w-auto shadow-2xl border border-white/10"
              : "h-full w-full"
        }`}
      >
        <DanceFloorClient className="absolute inset-0 h-full w-full" />
        <OverlayChrome />
        <BarMenuOverlay />
        <GiftFx />
      </div>
    </main>
  );
}
