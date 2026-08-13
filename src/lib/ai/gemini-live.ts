import { createServerFn } from "@tanstack/react-start";

export type GeminiLiveStatus = {
  connected: boolean;
  model: string | null;
  error: string | null;
};

export const connectGeminiLive = createServerFn({ method: "POST" })
  .validator((data: { apiKey?: string }) => data)
  .handler(async ({ data }): Promise<GeminiLiveStatus> => {
    const { connectGeminiLiveImpl } = await import("./gemini-live.server");
    const key = data?.apiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || "";
    return connectGeminiLiveImpl(key);
  });

export const getGeminiLiveStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<GeminiLiveStatus> => {
    const { getGeminiLiveStatusImpl } = await import("./gemini-live.server");
    return getGeminiLiveStatusImpl();
  },
);

export const speakGeminiLive = createServerFn({ method: "POST" })
  .validator((data: { text: string; apiKey?: string }) => data)
  .handler(async ({ data }) => {
    const { speakGeminiLiveImpl } = await import("./gemini-live.server");
    return speakGeminiLiveImpl(data.text, data.apiKey);
  });

export const disconnectGeminiLive = createServerFn({ method: "POST" }).handler(async () => {
  const { disconnectGeminiLiveImpl } = await import("./gemini-live.server");
  disconnectGeminiLiveImpl();
  return { success: true };
});
