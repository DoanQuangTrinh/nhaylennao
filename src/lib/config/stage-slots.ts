/**
 * Shared stage / bar coordinates — venue geometry and talent spawn stay in sync.
 * +Z faces the audience / camera.
 */
export type StageSlot = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
};

export const STAGE = {
  dj: {
    id: "dj",
    name: "DJ",
    x: -8.55,
    y: 0.62,
    z: -1.1,
    yaw: 0.18,
    scale: 1.32,
  },
  mc: {
    id: "mc",
    name: "MC",
    x: 2.05,
    y: 0.56,
    z: -3.4,
    yaw: 0,
    scale: 1,
  },
  pole: {
    id: "lisa",
    name: "Lisa",
    x: 7.35,
    y: 0.5,
    z: 3.15,
    yaw: 0,
    scale: 1.24,
  },
  bartender: {
    id: "bar5",
    name: "VIP",
    x: 0,
    y: 3.32,
    z: -4.85,
    yaw: 0,
    scale: 1.02,
  },
  /** Flank the +X entrance, facing the room / camera (+Z). */
  guardL: {
    id: "guard-l",
    name: "Bảo vệ",
    x: 11.45,
    y: 0,
    z: 1.85,
    yaw: 0,
    scale: 1.18,
  },
  guardR: {
    id: "guard-r",
    name: "Bảo vệ",
    x: 11.45,
    y: 0,
    z: 5.15,
    yaw: 0,
    scale: 1.18,
  },
} as const satisfies Record<string, StageSlot>;

export const BAR_STATION = {
  centerX: 0,
  /** Guest-facing front of the counter */
  frontZ: -6.15,
  /** Staff work deck (behind the counter) */
  staffZ: -7.15,
  staffY: 0.52,
  counterTopY: 0.92,
  yaw: 0,
} as const;

/** Empty pads behind the bar — drop future staff GLBs here. */
export const BAR_STAFF_SLOTS: StageSlot[] = [
  { id: "bar-1", name: "Quầy 1", x: -3.85, y: BAR_STATION.staffY, z: BAR_STATION.staffZ, yaw: 0, scale: 1.08 },
  { id: "bar-2", name: "Quầy 2", x: -1.3, y: BAR_STATION.staffY, z: BAR_STATION.staffZ, yaw: 0, scale: 1.08 },
  { id: "bar-3", name: "Quầy 3", x: 1.3, y: BAR_STATION.staffY, z: BAR_STATION.staffZ, yaw: 0, scale: 1.08 },
  { id: "bar-4", name: "Quầy 4", x: 3.85, y: BAR_STATION.staffY, z: BAR_STATION.staffZ, yaw: 0, scale: 1.08 },
];
