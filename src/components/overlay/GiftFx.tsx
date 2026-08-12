import { useEffect, useState } from "react";
import { useLiveStore } from "@/lib/store/live-store";

type Particle = {
  id: string;
  left: number;
  color: string;
  delay: number;
  size: number;
};

const COLORS = ["#22d3ee", "#a855f7", "#f472b6", "#fbbf24", "#34d399", "#ff2d95"];

export function GiftFx() {
  const gifts = useLiveStore((s) => s.gifts);
  const latest = gifts[0];
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bursts, setBursts] = useState<{ id: string; x: number; y: number; color: string }[]>(
    [],
  );
  const [seen, setSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!latest || latest.id === seen) return;
    setSeen(latest.id);

    const count =
      latest.effect === "legendary"
        ? 48
        : latest.effect === "mega"
          ? 36
          : latest.effect === "fireworks"
            ? 28
            : latest.effect === "confetti"
              ? 20
              : 10;

    const parts: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: `${latest.id}-${i}`,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length]!,
      delay: Math.random() * 0.4,
      size: 6 + Math.random() * 10,
    }));
    setParticles(parts);

    if (["fireworks", "mega", "legendary"].includes(latest.effect)) {
      const b = Array.from({ length: latest.effect === "legendary" ? 5 : 3 }, (_, i) => ({
        id: `b-${latest.id}-${i}`,
        x: 20 + Math.random() * 60,
        y: 15 + Math.random() * 40,
        color: COLORS[i % COLORS.length]!,
      }));
      setBursts(b);
    }

    const t = window.setTimeout(() => {
      setParticles([]);
      setBursts([]);
    }, 2400);
    return () => window.clearTimeout(t);
  }, [latest, seen]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="fx-particle"
          style={{
            left: `${p.left}%`,
            top: "-5%",
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      {bursts.map((b) => (
        <span
          key={b.id}
          className="fx-burst"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            borderColor: b.color,
            boxShadow: `0 0 30px ${b.color}`,
          }}
        />
      ))}
      {latest && Date.now() - latest.at < 3000 && (
        <div className="absolute left-1/2 top-[28%] -translate-x-1/2 panel-card neon-border px-5 py-2 text-center">
          <p className="font-display text-sm text-accent">
            {latest.label.toUpperCase()}
          </p>
          <p className="text-xs text-fg">
            {latest.name} · {latest.gift} · {latest.value}
          </p>
        </div>
      )}
    </div>
  );
}
