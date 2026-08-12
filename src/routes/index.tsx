import { createFileRoute } from "@tanstack/react-router";
import { HostPanel } from "@/components/host/HostPanel";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "Neon Club Live · Host Control" }],
  }),
});

function HomePage() {
  return (
    <main className="min-h-screen bg-bg">
      <HostPanel />
    </main>
  );
}
