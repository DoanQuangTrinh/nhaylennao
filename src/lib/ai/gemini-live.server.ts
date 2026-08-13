import WebSocket from "ws";

const GEMINI_WS =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

const MODELS = [
  "gemini-2.5-flash-preview-native-audio-dialog",
  "gemini-2.5-flash-native-audio-preview-12-2025",
  "gemini-2.5-flash-native-audio-preview-09-2025",
];

export type GeminiLiveStatus = {
  connected: boolean;
  model: string | null;
  error: string | null;
};

type SpeakJob = {
  text: string;
  resolve: (audioB64: string) => void;
  reject: (err: Error) => void;
};

let ws: WebSocket | null = null;
let ready = false;
let activeModel: string | null = null;
let lastError: string | null = null;
let activeKey = "";
const jobs: SpeakJob[] = [];
let current: { job: SpeakJob; chunks: Buffer[] } | null = null;

function parseMsg(raw: WebSocket.RawData): any {
  const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
  return JSON.parse(text);
}

function extractAudio(msg: any): Buffer | null {
  const parts = msg?.serverContent?.modelTurn?.parts;
  if (!Array.isArray(parts)) return null;
  const bits: Buffer[] = [];
  for (const part of parts) {
    const data = part?.inlineData?.data || part?.inline_data?.data;
    if (typeof data === "string" && data.length) {
      bits.push(Buffer.from(data, "base64"));
    }
  }
  if (!bits.length) return null;
  return Buffer.concat(bits);
}

function finishCurrent(err?: Error) {
  if (!current) return;
  const { job, chunks } = current;
  current = null;
  if (err) {
    job.reject(err);
    return;
  }
  if (!chunks.length) {
    job.reject(new Error("Gemini Live không trả audio"));
    return;
  }
  job.resolve(Buffer.concat(chunks).toString("base64"));
}

function pump() {
  if (current || !ready || !ws || ws.readyState !== WebSocket.OPEN) return;
  const job = jobs.shift();
  if (!job) return;
  current = { job, chunks: [] };
  const spoken = job.text.slice(0, 280);
  ws.send(
    JSON.stringify({
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [
              {
                text: `Đọc to nguyên văn câu sau, giọng MC quán bar tiếng Việt, hype, vui, không thêm câu hỏi, không giải thích:\n${spoken}`,
              },
            ],
          },
        ],
        turnComplete: true,
      },
    }),
  );
  setTimeout(() => {
    if (current?.job === job) {
      if (current.chunks.length) finishCurrent();
      else finishCurrent(new Error("Gemini Live timeout — không nhận audio"));
      pump();
    }
  }, 18000);
}

function attachSocket(socket: WebSocket) {
  ws = socket;
  socket.on("message", (raw) => {
    let msg: any;
    try {
      msg = parseMsg(raw);
    } catch {
      return;
    }
    if (msg.setupComplete) {
      ready = true;
      lastError = null;
      pump();
      return;
    }
    if (msg.error) {
      const text = msg.error?.message || JSON.stringify(msg.error);
      lastError = text;
      if (current) finishCurrent(new Error(text));
      return;
    }
    const audio = extractAudio(msg);
    if (audio && current) current.chunks.push(audio);
    if (msg?.serverContent?.turnComplete || msg?.serverContent?.generationComplete) {
      finishCurrent();
      pump();
    }
  });
  socket.on("error", (err) => {
    lastError = err.message;
    ready = false;
    if (current) finishCurrent(err);
  });
  socket.on("close", () => {
    ready = false;
    ws = null;
    if (current) finishCurrent(new Error("Gemini Live WS đã đóng"));
  });
}

function openSocket(apiKey: string, model: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `${GEMINI_WS}?key=${encodeURIComponent(apiKey)}`;
    const socket = new WebSocket(url);
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      reject(new Error("Không mở được WebSocket Gemini Live"));
    }, 12000);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          setup: {
            model: `models/${model}`,
            responseModalities: ["AUDIO"],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" },
                },
              },
            },
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: "Bạn là MC quán bar Neon Club. Chỉ đọc to đúng lời được giao, tiếng Việt, giọng hype, ngắn. Không hỏi lại.",
                },
              ],
            },
          },
        }),
      );
    });

    socket.on("message", (raw) => {
      if (settled) return;
      let msg: any;
      try {
        msg = parseMsg(raw);
      } catch {
        return;
      }
      if (msg.setupComplete) {
        settled = true;
        clearTimeout(timer);
        activeModel = model;
        attachSocket(socket);
        ready = true;
        lastError = null;
        resolve();
        return;
      }
      if (msg.error) {
        settled = true;
        clearTimeout(timer);
        try {
          socket.close();
        } catch {
          /* ignore */
        }
        reject(new Error(msg.error?.message || "Gemini Live setup lỗi"));
      }
    });

    socket.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    socket.on("close", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error("Gemini Live đóng trước khi setup xong"));
    });
  });
}

export async function connectGeminiLiveImpl(apiKey: string): Promise<GeminiLiveStatus> {
  const key = apiKey.trim();
  if (!key) {
    lastError = "Thiếu Gemini API Key";
    return { connected: false, model: null, error: lastError };
  }
  if (ready && ws && ws.readyState === WebSocket.OPEN && activeKey === key) {
    return { connected: true, model: activeModel, error: null };
  }
  try {
    if (ws) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      ws = null;
      ready = false;
    }
    activeKey = key;
    let last: Error | null = null;
    for (const model of MODELS) {
      try {
        await openSocket(key, model);
        return { connected: true, model: activeModel, error: null };
      } catch (err: any) {
        last = err instanceof Error ? err : new Error(String(err));
      }
    }
    lastError = last?.message || "Không kết nối được Gemini Live";
    return { connected: false, model: null, error: lastError };
  } catch (err: any) {
    lastError = err?.message || String(err);
    return { connected: false, model: null, error: lastError };
  }
}

export function getGeminiLiveStatusImpl(): GeminiLiveStatus {
  return {
    connected: !!(ready && ws && ws.readyState === WebSocket.OPEN),
    model: activeModel,
    error: lastError,
  };
}

export async function speakGeminiLiveImpl(
  text: string,
  apiKey?: string,
): Promise<{ success: boolean; audioBase64?: string; error?: string; model?: string | null }> {
  const spoken = text.replace(/^🎤\s*MC:\s*/i, "").trim();
  if (!spoken) return { success: false, error: "Thiếu câu để đọc" };

  const key = (apiKey || activeKey || process.env.GEMINI_API_KEY || "").trim();
  const status = await connectGeminiLiveImpl(key);
  if (!status.connected) {
    return { success: false, error: status.error || "Chưa kết nối Gemini Live", model: status.model };
  }

  try {
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      jobs.push({ text: spoken, resolve, reject });
      pump();
    });
    return { success: true, audioBase64, model: activeModel };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err), model: activeModel };
  }
}

export function disconnectGeminiLiveImpl() {
  ready = false;
  activeModel = null;
  if (current) finishCurrent(new Error("Đã ngắt Gemini Live"));
  while (jobs.length) jobs.shift()?.reject(new Error("Đã ngắt Gemini Live"));
  if (ws) {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }
  ws = null;
}
