import { useEffect, useState } from "react";
import { useLiveStore } from "@/lib/store/live-store";
import { VIP_TABLE_TIERS } from "@/lib/config/bar-data";
import { Wine, Crown, Sparkles, Flame } from "lucide-react";

export function BarMenuOverlay() {
  const drinkOrders = useLiveStore((s) => s.drinkOrders);
  const vipGuests = useLiveStore((s) => s.vipGuests);
  const co2JetUntil = useLiveStore((s) => s.co2JetUntil);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const latestOrder = drinkOrders[0];
  const isCo2Active = co2JetUntil > now;

  return (
    <aside aria-label="Nightclub overlay widgets" className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center gap-3 px-4">
      {/* CO2 Cannon Jet Active Blast Banner */}
      {isCo2Active && (
        <div className="flex animate-bounce items-center gap-2 rounded-full border border-cyan-400/60 bg-cyan-950/80 px-5 py-2 text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.6)] backdrop-blur-md">
          <Flame className="h-5 w-5 animate-pulse text-cyan-400" />
          <span className="font-extrabold tracking-wider text-sm">💨 CO2 STAGE BLAST ACTIVE!</span>
          <Sparkles className="h-5 w-5 animate-spin text-cyan-300" />
        </div>
      )}

      {/* Latest Drink Order Alert Banner */}
      {latestOrder && now - latestOrder.at < 8000 && (
        <div className="flex animate-pulse items-center gap-3 rounded-2xl border border-amber-500/50 bg-neutral-950/85 px-4 py-2.5 shadow-[0_0_20px_rgba(245,158,11,0.4)] backdrop-blur-md">
          <span className="text-2xl">{latestOrder.drink.icon}</span>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs uppercase tracking-wide">
              <Wine className="h-3.5 w-3.5" /> Bar Order Served!
            </div>
            <div className="font-extrabold text-sm text-white">
              <span className="text-amber-300">{latestOrder.userName}</span> ordered{" "}
              <span className="text-cyan-300">{latestOrder.drink.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Active VIP Lounge Guests Badge */}
      {vipGuests.length > 0 && (
        <div className="absolute right-4 top-0 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-950/80 px-3 py-1 text-purple-200 text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] backdrop-blur-md">
            <Crown className="h-3.5 w-3.5 text-amber-400" /> VIP Lounge ({vipGuests.length})
          </div>
          <div className="flex flex-col gap-1 max-w-[220px]">
            {vipGuests.slice(0, 3).map((v) => {
              const tier = VIP_TABLE_TIERS.find((t) => t.id === v.tierId);
              return (
                <div
                  key={v.userName}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/75 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
                >
                  <span className="font-semibold truncate text-amber-200">{v.userName}</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: `${tier?.color || "#f59e0b"}25`, color: tier?.color || "#f59e0b" }}
                  >
                    {tier?.badge || "VIP"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
