import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

// Route module stays tiny — routeTree.gen imports this for every page.
const OverlayPage = lazy(() => import("@/components/overlay/OverlayPage"));

function Boot() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#05050a] text-sm text-white/60">
      Opening club floor…
    </div>
  );
}

export const Route = createFileRoute("/overlay")({
  ssr: false,
  pendingComponent: Boot,
  component: () => (
    <Suspense fallback={<Boot />}>
      <OverlayPage />
    </Suspense>
  ),
  head: () => ({
    meta: [{ title: "Neon Club Live · 3D OBS Overlay" }],
  }),
});
