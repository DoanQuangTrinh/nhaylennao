import {
  Component,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/** Default public Spline demo scene — replace with your Neon Club .splinecode */
export const DEFAULT_SPLINE_SCENE =
  "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode";

type SplineProps = { scene: string; style?: CSSProperties };

type Props = {
  scene?: string;
  className?: string;
  forceFallback?: boolean;
};

class SplineErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { err: boolean }
> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.err) return null;
    return this.props.children;
  }
}

function NeonFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full min-h-[160px] items-center justify-center overflow-hidden rounded-xl bg-[#0a0612]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(34,211,238,0.28),transparent_55%),radial-gradient(circle_at_70%_60%,rgba(244,114,182,0.24),transparent_50%)]" />
      <div className="relative size-28">
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-pink-500 opacity-90" />
        <div className="absolute inset-3 rounded-full bg-[#0a0612]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[11px] font-bold tracking-[0.28em] text-cyan-300">
            NEON
          </span>
        </div>
      </div>
      <p className="absolute bottom-2.5 left-0 right-0 text-center text-[10px] text-muted">
        GSAP · Three.js · R3F · Spline
      </p>
    </div>
  );
}

/**
 * Spline brand surface for host panel / hero.
 * Loads @splinetool/react-spline; falls back to neon orb if CDN fails.
 */
export function SplineBrand({
  scene = DEFAULT_SPLINE_SCENE,
  className,
  forceFallback = false,
}: Props) {
  const [failed, setFailed] = useState(forceFallback);
  const [SplineComp, setSplineComp] = useState<ComponentType<SplineProps> | null>(
    null,
  );

  useEffect(() => {
    if (forceFallback) return;
    let alive = true;
    import("@splinetool/react-spline")
      .then((m) => {
        if (alive) setSplineComp(() => m.default as ComponentType<SplineProps>);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    import("@splinetool/runtime").catch(() => {});
    return () => {
      alive = false;
    };
  }, [forceFallback]);

  if (failed || !SplineComp) {
    return <NeonFallback className={className} />;
  }

  return (
    <div
      className={cn(
        "relative h-full min-h-[180px] w-full overflow-hidden rounded-xl bg-[#0a0612]",
        className,
      )}
    >
      <SplineErrorBoundary onError={() => setFailed(true)}>
        <Suspense fallback={<NeonFallback />}>
          <SplineComp scene={scene} style={{ width: "100%", height: "100%" }} />
        </Suspense>
      </SplineErrorBoundary>
    </div>
  );
}
