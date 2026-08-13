import { useLiveStore } from "@/lib/store/live-store";
import { getProfile } from "@/lib/config/profiles-data";

export function OverlayChrome() {
  // Narrow selectors — avoid re-render on every dancer position-unrelated churn
  const profileId = useLiveStore((s) => s.profileId);
  const mode = useLiveStore((s) => s.mode);
  const bannerFlash = useLiveStore((s) => s.bannerFlash);
  const fortuneAnswer = useLiveStore((s) => s.fortuneAnswer);
  const top = useLiveStore((s) => s.top);
  const floorCount = useLiveStore((s) => s.dancers.length);
  const p = getProfile(profileId);

  const primary =
    mode === "fortune" ? p.banner.fortunePrimary : p.banner.primary;
  const secondary =
    mode === "fortune" ? p.banner.fortuneSecondary : p.banner.secondary;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="panel-card neon-border max-w-full px-3.5 py-2.5 backdrop-blur-md sm:max-w-[70%]">
          <p className="font-display text-[9px] uppercase tracking-[0.25em] text-accent sm:text-[10px]">
            {mode === "fortune" ? p.fortune.brand : p.showBrand}
          </p>
          <h1 className="font-display text-lg font-bold leading-tight text-glow text-fg sm:text-2xl">
            {bannerFlash ?? primary}
          </h1>
          <p className="mt-0.5 text-[11px] text-muted sm:mt-1 sm:text-sm">{secondary}</p>
        </div>

        <div className="panel-card max-w-[170px] self-end px-3 py-1.5 backdrop-blur-md sm:min-w-[140px] sm:self-auto sm:py-2">
          <p className="font-display text-[9px] uppercase tracking-widest text-accent-2 sm:text-[10px]">
            TOP GIFTS
          </p>
          <ol className="mt-0.5 space-y-0.5 sm:mt-1">
            {(top.length ? top : [{ name: "—", total: 0 }]).slice(0, 3).map((t, i) => (
              <li key={`${t.name}-${i}`} className="flex justify-between gap-2 text-[11px] sm:gap-3 sm:text-xs">
                <span className="truncate text-fg">
                  {i + 1}. {t.name}
                </span>
                <span className="tabular-nums text-accent">{t.total}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {mode === "fortune" && fortuneAnswer && (
        <div className="mx-auto max-w-xl panel-card neon-border px-5 py-4 text-center backdrop-blur-md">
          <p className="font-display text-[10px] uppercase tracking-widest text-warning">
            AI Master
          </p>
          <p className="mt-1 text-sm leading-relaxed text-fg sm:text-base">
            {fortuneAnswer}
          </p>
        </div>
      )}

      <div className="flex items-end justify-between gap-3">
        <div className="panel-card px-3 py-2 backdrop-blur-md">
          <p className="text-xs text-muted">
            On floor: <span className="font-semibold text-fg">{floorCount}</span>
            {" · "}
            {p.banner.giftCta}
          </p>
        </div>
        <div className="panel-card px-3 py-2 text-right backdrop-blur-md">
          <p className="font-display text-xs uppercase tracking-wider text-accent">
            {p.oneLiner}
          </p>
        </div>
      </div>
    </div>
  );
}
