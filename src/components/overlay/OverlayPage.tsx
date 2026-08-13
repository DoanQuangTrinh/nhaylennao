import { useEffect } from "react";
import { BarMenuOverlay } from "@/components/overlay/BarMenuOverlay";
import { DanceFloorClient } from "@/components/overlay/DanceFloorClient";
import { GiftFx } from "@/components/overlay/GiftFx";
import { OverlayChrome } from "@/components/overlay/OverlayChrome";
import { initLiveSync, useLiveStore } from "@/lib/store/live-store";

export default function OverlayPage() {
  const ensureDemoFloor = useLiveStore((s) => s.ensureDemoFloor);
  const tickHype = useLiveStore((s) => s.tickHype);

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
    <main className="relative h-screen w-screen overflow-hidden bg-[#05050a]">
      <DanceFloorClient className="absolute inset-0 h-full w-full" />
      <OverlayChrome />
      <BarMenuOverlay />
      <GiftFx />
    </main>
  );
}
