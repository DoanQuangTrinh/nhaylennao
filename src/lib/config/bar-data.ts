export type DrinkCategory = "cocktail" | "shot_beer" | "champagne_vip" | "soft_drink";

export type DrinkItem = {
  id: string;
  name: string;
  category: DrinkCategory;
  priceCoins: number;
  description: string;
  glowColor: number; // Hex code for 3D lighting
  sfxKey: "cheers" | "champagne" | "drink";
  icon: string;
  vipPoints: number;
};

export const BAR_MENU: DrinkItem[] = [
  // Cocktails
  {
    id: "mojito",
    name: "Classic Mojito",
    category: "cocktail",
    priceCoins: 50,
    description: "Rum, chanh tươi, lá bạc hà mát lạnh",
    glowColor: 0x10b981, // Emerald green
    sfxKey: "cheers",
    icon: "🍹",
    vipPoints: 10,
  },
  {
    id: "espresso_martini",
    name: "Espresso Martini",
    category: "cocktail",
    priceCoins: 80,
    description: "Vodka kết hợp vị Espresso đậm đà",
    glowColor: 0xd97706, // Amber
    sfxKey: "cheers",
    icon: "🍸",
    vipPoints: 15,
  },
  {
    id: "sex_on_the_beach",
    name: "Sex on the Beach",
    category: "cocktail",
    priceCoins: 75,
    description: "Vodka, Peach Schnapps & nước ép nam việt quất",
    glowColor: 0xec4899, // Pink
    sfxKey: "cheers",
    icon: "🍹",
    vipPoints: 12,
  },
  {
    id: "long_island",
    name: "Long Island Iced Tea",
    category: "cocktail",
    priceCoins: 99,
    description: "Sự kết hợp mạnh mẽ của 5 loại rượu nền",
    glowColor: 0xef4444, // Red
    sfxKey: "cheers",
    icon: "🥃",
    vipPoints: 20,
  },

  // Shots & Beer
  {
    id: "tequila_shot",
    name: "Tequila Gold Shot",
    category: "shot_beer",
    priceCoins: 30,
    description: "Shot Tequila Gold kèm muối và chanh",
    glowColor: 0xf59e0b, // Amber Gold
    sfxKey: "drink",
    icon: "🥃",
    vipPoints: 5,
  },
  {
    id: "jager_bomb",
    name: "Jäger Bomb",
    category: "shot_beer",
    priceCoins: 45,
    description: "Jägermeister thả trực tiếp vào ly Red Bull",
    glowColor: 0x8b5cf6, // Purple
    sfxKey: "drink",
    icon: "💣",
    vipPoints: 8,
  },
  {
    id: "heineken_silver",
    name: "Heineken Silver Cold",
    category: "shot_beer",
    priceCoins: 25,
    description: "Bia Heineken ướp lạnh tuyệt hảo",
    glowColor: 0x22c55e, // Green
    sfxKey: "cheers",
    icon: "🍺",
    vipPoints: 5,
  },

  // Champagne VIP
  {
    id: "moet_chandon",
    name: "Moët & Chandon Imperial",
    category: "champagne_vip",
    priceCoins: 500,
    description: "Chai Sâm Panh Pháp cao cấp dành cho đại gia",
    glowColor: 0xfacc15, // Bright Gold
    sfxKey: "champagne",
    icon: "🍾",
    vipPoints: 100,
  },
  {
    id: "dom_perignon",
    name: "Dom Pérignon Vintage",
    category: "champagne_vip",
    priceCoins: 1200,
    description: "Đỉnh cao Champagne quý tộc — Nổ pháo hoa & CO2 toàn sàn",
    glowColor: 0x38bdf8, // Neon Cyan
    sfxKey: "champagne",
    icon: "👑",
    vipPoints: 300,
  },
  {
    id: "champagne_tower",
    name: "Tháp Champagne Huyền Thoại",
    category: "champagne_vip",
    priceCoins: 2500,
    description: "Tháp rượu 7 tầng phát sáng chiếu toàn bộ quầy bar & sân khấu",
    glowColor: 0xa855f7, // Royal Purple
    sfxKey: "champagne",
    icon: "🥂",
    vipPoints: 600,
  },

  // Soft Drinks
  {
    id: "red_bull",
    name: "Red Bull Energy",
    category: "soft_drink",
    priceCoins: 15,
    description: "Nước tăng lực bứt phá năng lượng nhảy suốt đêm",
    glowColor: 0x3b82f6, // Blue
    sfxKey: "drink",
    icon: "⚡",
    vipPoints: 2,
  },
];

export type VipTableTier = {
  id: "gold" | "platinum" | "diamond";
  name: string;
  minPoints: number;
  badge: string;
  color: string;
  tableName: string;
};

export const VIP_TABLE_TIERS: VipTableTier[] = [
  {
    id: "gold",
    name: "Bàn VIP Gold",
    minPoints: 50,
    badge: "🌟 VIP Gold",
    color: "#f59e0b",
    tableName: "Bàn Lounge 01",
  },
  {
    id: "platinum",
    name: "Bàn VIP Platinum",
    minPoints: 150,
    badge: "💎 VIP Platinum",
    color: "#06b6d4",
    tableName: "Bàn Center Stage",
  },
  {
    id: "diamond",
    name: "Bàn VIP Diamond King",
    minPoints: 400,
    badge: "👑 VIP Diamond King",
    color: "#a855f7",
    tableName: "Sân Khấu Chủ Bar",
  },
];
