import type { ProfileConfig, ProfilesRegistry } from "./types";

import defaultJson from "../../../config/default.json";
import globalEnJson from "../../../config/global-en.json";
import profilesJson from "../../../config/profiles.json";

export const profilesRegistry = profilesJson as ProfilesRegistry;

export const profileMap: Record<string, ProfileConfig> = {
  "local-vi": defaultJson as ProfileConfig,
  "global-en": globalEnJson as ProfileConfig,
};

export function getProfile(id: string): ProfileConfig {
  return profileMap[id] ?? profileMap["global-en"]!;
}

export function listProfiles() {
  return profilesRegistry.profiles;
}

export function resolveGiftEffect(
  profile: ProfileConfig,
  value: number,
): { effect: string; label: string } {
  const sorted = [...profile.gifts.thresholds].sort((a, b) => b.minValue - a.minValue);
  for (const t of sorted) {
    if (value >= t.minValue) return { effect: t.effect, label: t.label };
  }
  return { effect: "spark", label: "Spark" };
}

export function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
