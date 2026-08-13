/**
 * Browser Client: Direct Connection to Google Gemini Realtime Multimodal Bidi WebSocket API
 * Endpoint: wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=API_KEY
 */

export const BIDI_GEMINI_MODELS = [
  { id: "gemini-2.5-flash-native-audio-preview-09-2025", name: "Gemini 2.5 Flash Native Audio Preview 09-2025" },
  { id: "gemini-2.5-flash-native-audio-latest", name: "Gemini 2.5 Flash Native Audio Latest" },
  { id: "gemini-2.5-flash-native-audio-preview-12-2025", name: "Gemini 2.5 Flash Native Audio Preview 12-2025" },
  { id: "gemini-2.5-flash-preview-native-audio-dialog", name: "Live / Native Audio (fallback id)" },
  { id: "gemini-3.1-flash-live-preview", name: "Gemini 3.1 Flash Live Preview" },
  { id: "gemini-3.5-live-translate-preview", name: "Gemini 3.5 Live Translate Preview" },
  { id: "gemini-live-2.5-flash-preview", name: "Live / Native Audio (fallback id)" },
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash Experimental" },
] as const;

type BidiHandlers = {
  onStatus?: (s: string) => void;
  onError?: (e: string) => void;
  onTranscript?: (t: string) => void;
};

let sock: WebSocket | null = null;
let micCtx: AudioContext | null = null;
let playCtx: AudioContext | null = null;
let processor: ScriptProcessorNode | null = null;
let micStream: MediaStream | null = null;
let playTime = 0;
let running = false;

async function parseWsData(data: any): Promise<any> {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  if (data instanceof ArrayBuffer) {
    try {
      const text = new TextDecoder().decode(data);
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  return null;
}

function downsampleTo16k(input: Float32Array, inRate: number): Int16Array {
  const ratio = inRate / 16000;
  const n = Math.max(1, Math.floor(input.length / ratio));
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)] ?? 0));
    out[i] = s < 0 ? (s * 0x8000) | 0 : (s * 0x7fff) | 0;
  }
  return out;
}

function i16ToB64(samples: Int16Array): string {
  const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

function playPcm24k(b64: string) {
  if (!playCtx) playCtx = new AudioContext({ sampleRate: 24000 });
  if (playCtx.state === "suspended") void playCtx.resume();
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const even = raw.byteLength - (raw.byteLength % 2);
  const samples = new Int16Array(raw.buffer, raw.byteOffset, even / 2);
  if (!samples.length) return;
  const buf = playCtx.createBuffer(1, samples.length, 24000);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < samples.length; i++) ch[i] = samples[i]! / 32768;
  const src = playCtx.createBufferSource();
  src.buffer = buf;
  src.connect(playCtx.destination);
  const now = playCtx.currentTime;
  if (playTime < now) playTime = now;
  src.start(playTime);
  playTime += buf.duration;
}

export function isGeminiBidiLive() {
  return running && !!sock && sock.readyState === WebSocket.OPEN;
}

export async function startGeminiBidi(
  apiKey: string,
  preferredModel: string = "gemini-2.5-flash-native-audio-preview-09-2025",
  handlers: BidiHandlers = {},
) {
  await stopGeminiBidi();
  const key = apiKey.trim();
  if (!key) throw new Error("Thiếu Gemini API key");

  // Build candidate models array: preferredModel first, followed by remaining models
  const candidates = [
    preferredModel,
    ...BIDI_GEMINI_MODELS.map((m) => m.id).filter((id) => id !== preferredModel),
  ];

  playCtx = new AudioContext({ sampleRate: 24000 });
  await playCtx.resume();
  playTime = 0;

  let lastError: Error | null = null;
  let connectedModel = "";

  for (const modelId of candidates) {
    try {
      const cleanModelId = modelId.startsWith("models/") ? modelId : `models/${modelId}`;
      handlers.onStatus?.(`Đang kết nối Gemini Live (${modelId})...`);

      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(key)}`;
      const ws = new window.WebSocket(url);
      sock = ws;

      await new Promise<void>((resolve, reject) => {
        let isResolved = false;

        const timeoutTimer = window.setTimeout(() => {
          if (!isResolved) {
            try {
              ws.close();
            } catch {
              /* ignore */
            }
            reject(new Error(`Timeout kết nối model ${modelId}`));
          }
        }, 10000);

        ws.onopen = () => {
          handlers.onStatus?.(`Đã kết nối WS, đang gửi Setup (${cleanModelId})...`);
          const setupMessage = {
            setup: {
              model: cleanModelId,
              generationConfig: {
                responseModalities: ["AUDIO", "TEXT"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Puck",
                    },
                  },
                },
              },
              systemInstruction: {
                parts: [
                  {
                    text: "Bạn là MC Bar quẩy cực kỳ năng động và cuồng nhiệt tại quán Bar Neon. Hãy trả lời các bình luận của khán giả siêu ngắn gọn (tối đa 1 câu), đầy năng lượng, hài hước và sôi động!",
                  },
                ],
              },
            },
          };
          ws.send(JSON.stringify(setupMessage));
        };

        ws.onerror = () => {
          if (!isResolved) {
            window.clearTimeout(timeoutTimer);
            reject(new Error(`Lỗi kết nối WebSocket với ${modelId}`));
          }
        };

        ws.onclose = (event) => {
          if (!isResolved) {
            window.clearTimeout(timeoutTimer);
            const reason = event.reason ? `: ${event.reason}` : ` (Mã: ${event.code})`;
            reject(new Error(`Model ${modelId} ngắt kết nối${reason}`));
          }
        };

        ws.onmessage = async (ev) => {
          const msg = await parseWsData(ev.data);
          if (!msg) return;

          if (msg.error) {
            if (!isResolved) {
              window.clearTimeout(timeoutTimer);
              reject(new Error(msg.error.message || `Lỗi setup model ${modelId}`));
            }
            return;
          }

          if (msg.setupComplete || msg.serverContent || Object.keys(msg).length > 0) {
            isResolved = true;
            window.clearTimeout(timeoutTimer);
            connectedModel = modelId;
            resolve();
          }
        };
      });

      // Break loop if connection succeeded
      break;
    } catch (err: any) {
      lastError = err;
      try {
        sock?.close();
      } catch {
        /* ignore */
      }
      sock = null;
    }
  }

  if (!sock || !connectedModel) {
    const errorMsg = lastError?.message || "Tất cả các mô hình Gemini Bidi đều không thể kết nối.";
    handlers.onError?.(errorMsg);
    throw new Error(errorMsg);
  }

  handlers.onStatus?.(`⚡ Gemini Live Bidi Connected: ${connectedModel}`);
  running = true;

  // Stream handler after setup
  sock.onmessage = async (ev) => {
    const msg = await parseWsData(ev.data);
    if (!msg) return;

    if (msg.serverContent) {
      const parts = msg.serverContent.modelTurn?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          playPcm24k(part.inlineData.data);
        }
        if (part.text) {
          handlers.onTranscript?.(part.text);
        }
      }

      if (msg.serverContent.interrupted) {
        playTime = playCtx?.currentTime ?? 0;
      }
    }
  };

  // Optional microphone audio streaming
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      video: false,
    });
    micCtx = new AudioContext();
    const src = micCtx.createMediaStreamSource(micStream);
    processor = micCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (!sock || sock.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      const pcm = downsampleTo16k(input, micCtx!.sampleRate);
      const audioFrame = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: "audio/pcm;rate=16000",
              data: i16ToB64(pcm),
            },
          ],
        },
      };
      sock.send(JSON.stringify(audioFrame));
    };
    const mute = micCtx.createGain();
    mute.gain.value = 0;
    src.connect(processor);
    processor.connect(mute);
    mute.connect(micCtx.destination);
  } catch {
    /* mic optional */
  }
}

export async function sendGeminiBidiText(text: string, apiKey?: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  if ((!sock || sock.readyState !== WebSocket.OPEN) && apiKey) {
    try {
      await startGeminiBidi(apiKey);
    } catch {
      /* ignore */
    }
  }

  if (sock?.readyState === WebSocket.OPEN) {
    const textMessage = {
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [{ text: trimmed }],
          },
        ],
        turnComplete: true,
      },
    };
    sock.send(JSON.stringify(textMessage));
  }
}

export async function stopGeminiBidi() {
  running = false;
  try {
    sock?.close();
  } catch {
    /* ignore */
  }
  sock = null;
  try {
    processor?.disconnect();
  } catch {
    /* ignore */
  }
  processor = null;
  micStream?.getTracks().forEach((t) => t.stop());
  micStream = null;
  try {
    await micCtx?.close();
  } catch {
    /* ignore */
  }
  micCtx = null;
}
