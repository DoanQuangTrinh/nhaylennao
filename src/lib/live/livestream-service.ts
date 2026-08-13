import { createServerFn } from "@tanstack/react-start";
import type { LiveStreamInfo, QueuedLiveEvent } from "./livestream-types";

export type { LiveStatusState, LiveStreamInfo, QueuedLiveEvent } from "./livestream-types";

export const getLiveStreamStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveStreamInfo> => {
    const { snapshot } = await import("./tiktok-live.server");
    return snapshot();
  },
);

export const pullTikTokLiveEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveStreamInfo & { events: QueuedLiveEvent[] }> => {
    const { drainEvents } = await import("./tiktok-live.server");
    return drainEvents();
  },
);

export const connectTikTokLive = createServerFn({ method: "POST" })
  .validator((data: { uniqueId: string; sessionId?: string; tikToolsApiKey?: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const { connectTikTokLiveImpl } = await import("./tiktok-live.server");
    return connectTikTokLiveImpl(data);
  });

export const disconnectTikTokLive = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean }> => {
    const { disconnectTikTokLiveImpl } = await import("./tiktok-live.server");
    return disconnectTikTokLiveImpl();
  },
);
