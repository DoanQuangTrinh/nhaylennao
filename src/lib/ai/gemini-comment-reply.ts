import { createServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/config/profiles-data";

function templateKey(text: string): string {
  return text
    .replace(/@[\p{L}\p{N}_.]+/gu, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[✦★☆•·🎤]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function pickUnusedFallback(pool: string[], recent: string[]): string {
  const used = new Set(recent.slice(-2).map(templateKey));
  const fresh = pool.filter((line) => !used.has(templateKey(line)));
  const src = fresh.length ? fresh : pool;
  return src[Math.floor(Math.random() * src.length)]!;
}

export type AiReplyRequest = {
  name: string;
  comment: string;
  profileId?: string;
  customApiKey?: string;
  selectedModel?: string;
  recentReplies?: string[];
};

export type AiReplyResponse = {
  success: boolean;
  reply: string;
  provider: "gemini" | "xai" | "smart_fallback";
  modelUsed?: string;
  error?: string;
};

export const AVAILABLE_GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Khuyên dùng - Nhanh & Mới nhất)" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Thông minh - Sáng tạo cao)" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Thế hệ 2.0)" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Thế hệ 1.5 Ổn định)" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Thế hệ 1.5 Chuyên sâu)" },
];

/**
 * Server Function: Generates an automated Bar MC reply to audience comments via Google Gemini API
 * Includes recentReplies history to prevent repetitive phrasing.
 */
export const generateAiCommentReply = createServerFn({ method: "POST" })
  .validator((data: AiReplyRequest) => data)
  .handler(async ({ data }): Promise<AiReplyResponse> => {
    const { name, comment, profileId = "global-en", customApiKey, selectedModel, recentReplies = [] } = data;
    const cleanName = name.trim() || "Khách VIP";
    const cleanComment = comment.trim();

    if (!cleanComment) {
      return {
        success: false,
        reply: "",
        provider: "smart_fallback",
        error: "Comment text is empty",
      };
    }

    const profile = getProfile(profileId);
    const isVietnamese = profile.language === "vi" || /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(cleanComment);

    // Resolve API key
    const geminiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
    const xaiKey = process.env.XAI_API_KEY?.trim();

    const lastTwo = recentReplies.slice(-2);
    const avoidancePrompt =
      lastTwo.length > 0
        ? `\nLỊCH SỬ 2 CÂU MC VỪA PHÁN (CẤM lặp ý / lặp khuôn / lặp icon giống):\n1) "${lastTwo[0]}"${lastTwo[1] ? `\n2) "${lastTwo[1]}"` : ""}\nPhải viết câu MỚI hoàn toàn.`
        : "";

    // 1. Try Google Gemini API
    if (geminiKey) {
      const defaultModels = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
      const userSelected = selectedModel?.trim();
      const modelsToTry = userSelected
        ? [userSelected, ...defaultModels.filter((m) => m !== userSelected)]
        : defaultModels;

      for (const model of modelsToTry) {
        try {
          const prompt = isVietnamese
            ? `Bạn là một MC quẩy Bar / DJ Hype Man cực kỳ năng động, hài hước và thân thiện tại quán Bar Neon. Hãy viết 1 câu trả lời ngắn gọn (tối đa 20 từ) kèm icon sôi động để đáp lại bình luận của khán giả tên "${cleanName}".${avoidancePrompt}\nBình luận của khách: "${cleanComment}"\nTrả lời của MC Bar:`
            : `You are an energetic, witty, fun Nightclub MC / Hype Man. Write 1 short, high-energy response (max 20 words) with emojis to respond to live stream viewer "${cleanName}".${avoidancePrompt}\nViewer Comment: "${cleanComment}"\nMC Reply:`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  maxOutputTokens: 60,
                  temperature: 0.85,
                },
              }),
            },
          );

          if (res.ok) {
            const json = (await res.json()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            const rawReply = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (rawReply) {
              const cleanReply = rawReply.replace(/^["']|["']$/g, "").trim();
              return {
                success: true,
                reply: cleanReply,
                provider: "gemini",
                modelUsed: model,
              };
            }
          } else {
            console.warn(`[Gemini API - ${model}] Failed status ${res.status}. Falling back to next model...`);
          }
        } catch (err) {
          console.warn(`[Gemini API - ${model}] Fetch error. Falling back to next model...`, err);
        }
      }
    }

    // 2. Try xAI API if available
    if (xaiKey) {
      try {
        const prompt = isVietnamese
          ? `Bạn là MC Bar quẩy cực sung. Hãy viết 1 câu ngắn đáp lại khách tên "${cleanName}" vừa nói: "${cleanComment}". Thêm emoji.${avoidancePrompt}`
          : `You are a high-energy Bar MC. Write 1 short line to respond to "${cleanName}" saying: "${cleanComment}". Add emojis.${avoidancePrompt}`;

        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${xaiKey}`,
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 60,
            temperature: 0.85,
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const rawReply = json.choices?.[0]?.message?.content?.trim();
          if (rawReply) {
            return {
              success: true,
              reply: rawReply.replace(/^["']|["']$/g, "").trim(),
              provider: "xai",
            };
          }
        }
      } catch (err) {
        console.warn("[xAI API] Exception:", err);
      }
    }

    // 3. Smart Contextual Fallback Generator (if no API keys or offline)
    const fallbackVi = [
      `🔥 Cảm ơn @${cleanName}! Quán Bar đang quẩy cực cháy cùng nhịp nhạc nhé! 🚀`,
      `🎧 Yeahh @${cleanName}! Lên nhạc bung nóc cùng cả quầy Bar nào! 🥂`,
      `✨ Quá đã @${cleanName}! Chúc bạn có một đêm tiệc quẩy hết nấc nhé! 💃🎉`,
      `🍹 Cảm ơn @${cleanName} đã tương tác! Cụng ly 100% cùng mọi người nào! 🥂`,
      `💥 @${cleanName} vừa làm sàn nóng hơn rồi đó, giữ nhịp này luôn!`,
      `🥂 Spot-on @${cleanName}! DJ tua lại đoạn drop cho cả phòng nghe nè!`,
      `🕺 @${cleanName} vào sóng là bar tăng volume liền! Ai chưa lên sàn chat 1!`,
      `🌙 Đêm này có @${cleanName} là đủ vibe, quẩy tới sáng luôn!`,
    ];
    const fallbackEn = [
      `🔥 Thanks @${cleanName}! The floor is on fire right now! 🚀`,
      `🎧 Yeahh @${cleanName}! Turn up the beats and enjoy the vibe! 🥂`,
      `✨ Pure energy @${cleanName}! Let's dance all night long! 💃🎉`,
      `💥 @${cleanName} just raised the roof — keep that energy coming!`,
      `🥂 Love that @${cleanName}! DJ, loop that drop one more time!`,
    ];

    const pool = isVietnamese ? fallbackVi : fallbackEn;
    const picked = pickUnusedFallback(pool, lastTwo);

    return {
      success: true,
      reply: picked,
      provider: "smart_fallback",
      error: geminiKey || xaiKey ? undefined : "No Gemini/xAI API key configured — used smart fallback",
    };
  });
