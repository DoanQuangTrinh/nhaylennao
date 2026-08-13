export type LiveStatusState = "idle" | "connecting" | "live" | "error";

export type LiveStreamInfo = {
  platform: "tiktok" | "youtube" | "facebook" | "none";
  status: LiveStatusState;
  uniqueId: string | null;
  viewerCount: number;
  errorMessage: string | null;
  lastEventAt: number | null;
  eventsCount: number;
};

export type QueuedLiveEvent = {
  type: "chat" | "gift" | "member" | "like" | "follow" | "roomUser";
  platform: "tiktok";
  nickname?: string;
  text?: string;
  giftName?: string;
  diamondCount?: number;
  repeatCount?: number;
  likeCount?: number;
  viewerCount?: number;
};
