/** MC voice: Gemini Live native audio only. No browser TTS. */

import { isGeminiBidiLive, sendGeminiBidiText } from "@/lib/ai/gemini-bidi-client";
import { speakGeminiLive } from "@/lib/ai/gemini-live";

let audioCtx: AudioContext | null = null;
let geminiKey = "";

export function setGeminiLiveKey(key: string) {
  geminiKey = key.trim();
}

export function hasGeminiVoice() {
  return geminiKey.length > 0;
}

function stripForSpeech(raw: string): string {
  return raw
    .replace(/^🎤\s*MC:\s*/i, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, " ")
    .replace(/[✦★☆•·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor({ sampleRate: 24000 });
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function playPcm24k(base64: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) {
        resolve();
        return;
      }
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const dataView = new DataView(bytes.buffer);
      const numSamples = Math.floor(len / 2);
      if (numSamples <= 0) {
        resolve();
        return;
      }

      const buf = ctx.createBuffer(1, numSamples, 24000);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < numSamples; i++) {
        const sample = dataView.getInt16(i * 2, true);
        ch[i] = sample / 32768.0;
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.onended = () => resolve();
      src.start();
    } catch (e) {
      console.error("[mc-speech] playPcm24k error:", e);
      resolve();
    }
  });
}

export function unlockMcSpeech() {
  getAudioCtx();
}

/** Speak only through Gemini Live. Silent if no key or request fails. */
export function speakMcLine(text: string, _lang = "vi-VN") {
  if (typeof window === "undefined") return;
  const spoken = stripForSpeech(text);
  if (!spoken) return;
  unlockMcSpeech();

  if (isGeminiBidiLive()) {
    void sendGeminiBidiText(spoken, geminiKey);
    return;
  }

  if (!geminiKey) return;

  void (async () => {
    try {
      const res = await speakGeminiLive({ data: { text: spoken, apiKey: geminiKey } });
      if (res?.success && res.audioBase64) await playPcm24k(res.audioBase64);
    } catch {
      /* no default voice */
    }
  })();
}

export function isMcSpeechUnlocked() {
  return !!audioCtx;
}
