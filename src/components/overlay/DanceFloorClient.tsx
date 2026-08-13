import { lazy, Suspense, type ComponentProps } from "react";

/**
 * Client-only DanceFloor shell.
 * Avoids pulling three.js / GLTF into the SSR graph (was causing 500 + ECONNRESET).
 */
const DanceFloorLazy = lazy(async () => {
  const m = await import("./DanceFloor");
  return { default: m.DanceFloor };
});

type Props = ComponentProps<typeof DanceFloorLazy>;

function FloorFallback({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #1a0a2e 0%, #05050a 70%)",
      }}
      aria-hidden
    />
  );
}

export function DanceFloorClient(props: Props) {
  // SSR / first paint: dark shell only
  if (typeof window === "undefined") {
    return <FloorFallback className={props.className} />;
  }
  return (
    <Suspense fallback={<FloorFallback className={props.className} />}>
      <DanceFloorLazy {...props} />
    </Suspense>
  );
}
