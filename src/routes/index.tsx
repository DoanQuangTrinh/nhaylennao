import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// HostPanel pulls the 3D stack. Keep it out of the route module so the first
// HTML/JS for "/" can ship without waiting on three.js.
const HostPanel = lazy(() =>
  import("@/components/host/HostPanel").then((m) => ({ default: m.HostPanel })),
);

function BootScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
      {label}
    </div>
  );
}

export const Route = createFileRoute("/")({
  ssr: false,
  pendingComponent: () => <BootScreen label="Đang mở bảng điều khiển…" />,
  component: HomePage,
  head: () => ({
    meta: [{ title: "Quán Bar Live · Điều khiển" }],
  }),
});

function HomePage() {
  return (
    <main className="min-h-screen bg-bg">
      <Suspense fallback={<BootScreen label="Đang mở bảng điều khiển…" />}>
        <HostPanel />
      </Suspense>
    </main>
  );
}
