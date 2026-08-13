/**
 * Avatar Command Parser imported from QuanBar-Open
 * Supports live chat commands:
 * - "skin 0-7" / "màu da 3"
 * - "hair 0-7" / "tóc 2"
 * - "outfit 0-7" / "áo 4" / "màu 4"
 * - "face 0-5" / "mặt 1"
 * - "style human|robot|meme|cat|alien|cool"
 * - "body default|tall|chibi"
 * - "acc none|hat|crown|headphones|glasses|cap" / "phụ kiện crown"
 * - "avatar random" / "đổi hình"
 */

export const AVATAR_STYLES = ["human", "robot", "meme", "cat", "alien", "cool"] as const;
export const AVATAR_BODIES = ["default", "tall", "chibi"] as const;
export const AVATAR_ACCESSORIES = ["none", "hat", "crown", "headphones", "glasses", "cap"] as const;

export const SKIN_COUNT = 8;
export const HAIR_COUNT = 8;
export const OUTFIT_COUNT = 8;
export const FACE_COUNT = 6;

export type AvatarConfigPatch = {
  skin?: number;
  hair?: number;
  outfit?: number;
  face?: number;
  style?: string;
  body?: string;
  accessory?: string;
  random?: boolean;
};

function clampInt(v: string | number, max: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(max - 1, n));
}

export function parseAvatarCommand(text: string): AvatarConfigPatch | null {
  const t = String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return null;

  if (t === "avatar random" || t === "random avatar" || t === "doi hinh" || t === "đổi hình" || t === "ramdom") {
    return { random: true };
  }

  let m: RegExpMatchArray | null;

  m = t.match(/^(skin|mau da|màu da)\s+(\d+)$/);
  if (m) return { skin: clampInt(m[2]!, SKIN_COUNT) };

  m = t.match(/^(hair|toc|tóc)\s+(\d+)$/);
  if (m) return { hair: clampInt(m[2]!, HAIR_COUNT) };

  m = t.match(/^(outfit|ao|áo|color|mau|màu)\s+(\d+)$/);
  if (m) return { outfit: clampInt(m[2]!, OUTFIT_COUNT) };

  m = t.match(/^(face|mat|mặt)\s+(\d+)$/);
  if (m) return { face: clampInt(m[2]!, FACE_COUNT) };

  m = t.match(/^(style|kieu|kiểu)\s+(\w+)$/);
  if (m && AVATAR_STYLES.includes(m[2] as any)) return { style: m[2] };

  m = t.match(/^(body|dang|dáng)\s+(\w+)$/);
  if (m && AVATAR_BODIES.includes(m[2] as any)) return { body: m[2] };

  m = t.match(/^(acc|phu kien|phụ kiện|accessory)\s+(\w+)$/);
  if (m) {
    const acc = m[2] === "none" || m[2] === "0" ? "none" : m[2]!;
    if (AVATAR_ACCESSORIES.includes(acc as any)) return { accessory: acc };
  }

  return null;
}
