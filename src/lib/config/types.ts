export type GiftEffect = "spark" | "confetti" | "fireworks" | "mega" | "legendary";

export type GiftThreshold = {
  minValue: number;
  effect: GiftEffect;
  label: string;
};

export type ProfileConfig = {
  id: string;
  label: string;
  language: "en" | "vi";
  showBrand: string;
  productBrand: string;
  oneLiner: string;
  mode: "club" | "fortune";
  banner: {
    primary: string;
    secondary: string;
    floorFull: string;
    giftCta: string;
    fortunePrimary: string;
    fortuneSecondary: string;
  };
  commands: {
    join: string[];
    leave: string[];
    dance: string[];
    style: string[];
    skin: string[];
  };
  mc: {
    enabled: boolean;
    hypeIntervalSec: number;
    greet: string[];
    thank: string[];
    hype: string[];
    floorFull: string[];
  };
  gifts: {
    note: string;
    thresholds: GiftThreshold[];
  };
  gemini: {
    systemInstruction: string;
  };
  fortune: {
    brand: string;
    systemInstruction: string;
    ctaBanner: string;
    demoLines: string[];
  };
  emptyFloor: {
    autoDemo: boolean;
    demoNames: string[];
  };
  obs: {
    portrait: string;
    landscape: string;
    overlayPath: string;
  };
  livePack: {
    title: string;
    description: string;
    pinned: string;
    first60s: string;
  };
  secondaryMode?: {
    id: string;
    brand: string;
    oneLiner: string;
    title: string;
  };
};

export type ProfileMeta = {
  id: string;
  file: string;
  label: string;
  description: string;
};

export type ProfilesRegistry = {
  defaultProfile: string;
  profiles: ProfileMeta[];
};
