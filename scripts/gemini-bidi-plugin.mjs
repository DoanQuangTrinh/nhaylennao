import { WebSocketServer, WebSocket } from "ws";

const GEMINI_WS =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

const MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
];

function parseGemini(raw) {
  const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
  return JSON.parse(text);
}

function setupPayload(model) {
  return JSON.stringify({
    setup: {
      model: `models/${model}`,
      generationConfig: {
        responseModalities: ["AUDIO", "TEXT"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: "Bạn là Nam MC Bar & Nightclub số 1 Việt Nam - cực kỳ ngầu, cháy hết mình, quẩy sung và thần thái đỉnh cao! Khi đáp lời khán giả: Hãy phán bằng tiếng Việt siêu CHẤT, bùng nổ năng lượng, siêu ngắn gọn (chỉ 1 câu, tối đa 15 từ)!",
          },
        ],
      },
    },
  });
}

function openGemini(apiKey) {
  const key = apiKey || process.env.GEMINI_API_KEY || "";
  return new Promise((resolve, reject) => {
    const model = MODELS[0];
    const url = `${GEMINI_WS}?key=${encodeURIComponent(key)}`;
    const gemini = new WebSocket(url);
    let done = false;

    const fail = (err) => {
      if (done) return;
      done = true;
      try {
        gemini.close();
      } catch {
        /* ignore */
      }
      reject(err);
    };

    const timer = setTimeout(() => fail(new Error("Timeout mở WS Gemini")), 10000);

    gemini.on("open", () => {
      gemini.send(setupPayload(model));
    });

    gemini.on("message", (raw) => {
      if (done) return;
      let msg;
      try {
        msg = parseGemini(raw);
      } catch {
        return;
      }
      if (msg.setupComplete || msg.serverContent || Object.keys(msg).length > 0) {
        done = true;
        clearTimeout(timer);
        resolve({ gemini, model });
        return;
      }
      if (msg.error) fail(new Error(msg.error.message || "setup error"));
    });

    gemini.on("error", (err) => fail(err || new Error("ws error")));
    gemini.on("close", (code, reason) => {
      if (!done) {
        const reasonStr = reason ? reason.toString() : `Close code ${code}`;
        fail(new Error(`WebSocket đóng: ${reasonStr}`));
      }
    });
  });
}

function pipeClient(client, apiKey) {
  let gemini = null;
  let model = null;

  const sendClient = (obj) => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(obj));
  };

  openGemini(apiKey)
    .then((pair) => {
      gemini = pair.gemini;
      model = pair.model;
      sendClient({
        type: "setup_complete",
        model,
        input: "audio/pcm;rate=16000",
        output: "audio/pcm;rate=24000",
      });

      gemini.on("message", (raw) => {
        let msg;
        try {
          msg = parseGemini(raw);
        } catch {
          return;
        }
        if (msg.error) {
          sendClient({ type: "error", message: msg.error.message || JSON.stringify(msg.error) });
          return;
        }
        const parts = msg?.serverContent?.modelTurn?.parts;
        if (Array.isArray(parts)) {
          for (const part of parts) {
            const data = part?.inlineData?.data || part?.inline_data?.data;
            if (data) {
              sendClient({
                type: "audio",
                mimeType: "audio/pcm;rate=24000",
                data,
              });
            }
            if (part?.text) {
              sendClient({ type: "transcript", text: part.text });
            }
          }
        }
        const transcript =
          msg?.serverContent?.outputTranscription?.text ||
          msg?.serverContent?.inputTranscription?.text;
        if (transcript) sendClient({ type: "transcript", text: transcript });
        if (msg?.serverContent?.turnComplete) sendClient({ type: "turn_complete" });
        if (msg?.serverContent?.interrupted) sendClient({ type: "interrupted" });
      });

      gemini.on("close", () => {
        sendClient({ type: "closed" });
        try {
          client.close();
        } catch {
          /* ignore */
        }
      });
      gemini.on("error", (err) => {
        sendClient({ type: "error", message: err.message });
      });
    })
    .catch((err) => {
      sendClient({ type: "error", message: err.message || String(err) });
      try {
        client.close();
      } catch {
        /* ignore */
      }
    });

  client.on("message", (raw) => {
    if (!gemini || gemini.readyState !== WebSocket.OPEN) return;
    let msg;
    try {
      msg = JSON.parse(Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw));
    } catch {
      return;
    }
    if (msg.type === "audio" && msg.data) {
      gemini.send(
        JSON.stringify({
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "audio/pcm;rate=16000",
                data: msg.data,
              },
            ],
          },
        }),
      );
      return;
    }
    if (msg.type === "audio_end") {
      gemini.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      return;
    }
    if (msg.type === "text" && msg.text) {
      gemini.send(
        JSON.stringify({
          clientContent: {
            turns: [{ role: "user", parts: [{ text: String(msg.text) }] }],
            turnComplete: true,
          },
        }),
      );
    }
  });

  client.on("close", () => {
    try {
      gemini?.close();
    } catch {
      /* ignore */
    }
  });
}

export function geminiBidiPlugin() {
  return {
    name: "quanbar-gemini-bidi",
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true });
      const http = server.httpServer;
      if (!http) return;

      http.on("upgrade", (req, socket, head) => {
        const path = (req.url || "").split("?")[0];
        if (path !== "/api/gemini-bidi") return;
        wss.handleUpgrade(req, socket, head, (ws) => {
          const q = new URL(req.url || "/", "http://127.0.0.1");
          const key =
            q.searchParams.get("key") ||
            process.env.GEMINI_API_KEY ||
            "";
          if (!key) {
            ws.send(JSON.stringify({ type: "error", message: "Thiếu Gemini API key" }));
            ws.close();
            return;
          }
          pipeClient(ws, key);
        });
      });
    },
  };
}
