import {
  ControlEvent,
  createEulerClient,
  SignConfig,
  TikTokLiveConnection,
  UserOfflineError,
  WebcastEvent,
} from "tiktok-live-connector";
import type { LiveStreamInfo, LiveStatusState, QueuedLiveEvent } from "./livestream-types";

let activeTikTokConnection: TikTokLiveConnection | null = null;
let activeUniqueId: string | null = null;
let currentStatus: LiveStatusState = "idle";
let currentErrorMessage: string | null = null;
let currentViewerCount = 0;
let eventsCount = 0;
let lastEventAt: number | null = null;

const pendingEvents: QueuedLiveEvent[] = [];
const MAX_PENDING = 300;

function enqueueEvent(event: QueuedLiveEvent) {
  eventsCount += 1;
  lastEventAt = Date.now();
  pendingEvents.push(event);
  if (pendingEvents.length > MAX_PENDING) {
    pendingEvents.splice(0, pendingEvents.length - MAX_PENDING);
  }
}

export function snapshot(): LiveStreamInfo {
  return {
    platform: activeUniqueId ? "tiktok" : "none",
    status: currentStatus,
    uniqueId: activeUniqueId,
    viewerCount: currentViewerCount,
    errorMessage: currentErrorMessage,
    lastEventAt,
    eventsCount,
  };
}

export function drainEvents(): LiveStreamInfo & { events: QueuedLiveEvent[] } {
  const events = pendingEvents.splice(0, pendingEvents.length);
  return { ...snapshot(), events };
}

function nicknameOf(data: any): string {
  return (
    data?.user?.nickname ||
    data?.user?.displayId ||
    data?.user?.uniqueId ||
    data?.nickname ||
    data?.uniqueId ||
    data?.displayId ||
    "Viewer"
  );
}

function chatTextOf(data: any): string {
  const emotes = Array.isArray(data?.emotes)
    ? data.emotes
        .map((e: any) => e?.emote?.uniqueId || e?.uniqueId || "")
        .filter(Boolean)
        .join(" ")
    : "";
  return String(
    data?.content ||
      data?.comment ||
      data?.text ||
      data?.common?.describe ||
      emotes ||
      "",
  ).trim();
}

function bindConnectionEvents(conn: TikTokLiveConnection) {
  conn.on(WebcastEvent.CHAT, (data: any) => {
    const text = chatTextOf(data);
    if (!text) return;
    enqueueEvent({
      type: "chat",
      platform: "tiktok",
      nickname: nicknameOf(data),
      text,
    });
  });

  conn.on(WebcastEvent.GIFT, (data: any) => {
    const giftType = data?.giftType ?? data?.giftDetails?.giftType ?? data?.gift?.gift_type;
    if (giftType === 1 && !data?.repeatEnd) return;
    enqueueEvent({
      type: "gift",
      platform: "tiktok",
      nickname: nicknameOf(data),
      giftName:
        data?.giftName ||
        data?.extendedGiftInfo?.name ||
        data?.giftDetails?.giftName ||
        data?.gift?.name ||
        (data?.giftId != null ? `Gift ${data.giftId}` : "Gift"),
      diamondCount: Number(
        data?.diamondCount ??
          data?.extendedGiftInfo?.diamond_count ??
          data?.giftDetails?.diamondCount ??
          1,
      ),
      repeatCount: Number(data?.repeatCount || 1),
    });
  });

  conn.on(WebcastEvent.MEMBER, (data: any) => {
    enqueueEvent({
      type: "member",
      platform: "tiktok",
      nickname: nicknameOf(data),
    });
  });

  conn.on(WebcastEvent.LIKE, (data: any) => {
    enqueueEvent({
      type: "like",
      platform: "tiktok",
      nickname: nicknameOf(data),
      likeCount: Number(data?.likeCount || data?.totalLikeCount || 1),
    });
  });

  conn.on(WebcastEvent.FOLLOW, (data: any) => {
    enqueueEvent({
      type: "follow",
      platform: "tiktok",
      nickname: nicknameOf(data),
    });
  });

  conn.on(WebcastEvent.ROOM_USER, (data: any) => {
    const count = Number(data?.viewerCount ?? data?.total ?? data?.totalUser ?? 0);
    if (count > 0) {
      currentViewerCount = count;
      enqueueEvent({ type: "roomUser", platform: "tiktok", viewerCount: count });
    }
  });

  conn.on(ControlEvent.CONNECTED, () => {
    currentStatus = "live";
    currentErrorMessage = null;
  });

  conn.on(ControlEvent.DISCONNECTED, () => {
    if (currentStatus === "live") {
      currentStatus = "idle";
      currentErrorMessage = "Mất kết nối TikTok LIVE";
    }
  });

  conn.on(WebcastEvent.STREAM_END, () => {
    currentStatus = "idle";
    currentErrorMessage = "Buổi TikTok LIVE đã kết thúc";
  });

  conn.on(ControlEvent.ERROR, (err: any) => {
    const msg = err?.exception?.message || err?.message || String(err);
    if (currentStatus !== "live") {
      currentStatus = "error";
      currentErrorMessage = msg;
    }
  });
}

async function closeActive() {
  if (!activeTikTokConnection) return;
  try {
    await activeTikTokConnection.disconnect();
  } catch {
    /* ignore */
  }
  activeTikTokConnection = null;
}

function wipeEulerKey() {
  SignConfig.apiKey = undefined;
  SignConfig.cachedInstance = undefined;
  if (SignConfig.baseOptions?.headers) {
    delete (SignConfig.baseOptions.headers as Record<string, unknown>)["x-api-key"];
    delete (SignConfig.baseOptions.headers as Record<string, unknown>)["X-Api-Key"];
    delete (SignConfig.baseOptions.headers as Record<string, unknown>)["Authorization"];
  }
}

function freshEulerClient() {
  wipeEulerKey();
  return createEulerClient();
}

function isInvalidEulerKeyError(err: unknown): boolean {
  const raw = String((err as any)?.exception?.message || (err as any)?.message || err || "");
  return /status 401|API Key is invalid|provided API Key/i.test(raw);
}

export async function connectTikTokLiveImpl(data: {
  uniqueId: string;
  sessionId?: string;
}): Promise<{ success: boolean; message: string }> {
  const rawId = String(data?.uniqueId || "")
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, "")
    .replace(/\/live\/?$/i, "")
    .split("?")[0]
    .trim();
  const sessionRaw = (data?.sessionId || "").trim();
  const sessionId = /^[a-f0-9]{16,}$/i.test(sessionRaw) ? sessionRaw : "";

  if (!rawId) {
    return { success: false, message: "Thiếu username TikTok LIVE (ví dụ: @username)" };
  }

  await closeActive();
  pendingEvents.length = 0;
  activeUniqueId = rawId;
  currentStatus = "connecting";
  currentErrorMessage = null;
  currentViewerCount = 0;

  const attempt = async () => {
    const eulerApiInstance = freshEulerClient();
    const connOptions: any = {
      processInitialData: false,
      enableExtendedGiftInfo: false,
      fetchRoomInfoOnConnect: true,
      eulerApiInstance,
      requestOptions: {
        timeout: 20000,
      },
    };
    if (sessionId) {
      connOptions.session = {
        cookie: {
          type: "cookie",
          value: {
            sessionId,
            ttTargetIdc: "alisg",
          },
        },
      };
    }

    const tiktokConn = new TikTokLiveConnection(rawId, connOptions);
    bindConnectionEvents(tiktokConn);

    const isLive = await tiktokConn.fetchIsLive().catch(() => null);
    if (isLive === false) {
      const offline = `Kênh @${rawId} hiện không đang LIVE. Bật TikTok LIVE rồi kết nối lại.`;
      const err = new Error(offline);
      (err as any).offline = true;
      throw err;
    }

    activeTikTokConnection = tiktokConn;
    return tiktokConn.connect();
  };

  try {
    let state;
    try {
      state = await attempt();
    } catch (err) {
      if ((err as any)?.offline) throw err;
      if (isInvalidEulerKeyError(err)) {
        await closeActive();
        wipeEulerKey();
        state = await attempt();
      } else {
        throw err;
      }
    }

    currentStatus = "live";
    currentErrorMessage = null;

    return {
      success: true,
      message: `Đã kết nối phòng LIVE @${rawId}${state?.roomId ? ` (room ${state.roomId})` : ""}`,
    };
  } catch (err: any) {
    await closeActive();
    wipeEulerKey();
    currentStatus = "error";

    const rawMsg = String(err?.exception?.message || err?.message || err || "");

    let msg = `Không thể kết nối TikTok LIVE (@${rawId}): `;
    if (err?.offline || err instanceof UserOfflineError || /isn't online|offline|LIVE_NOT_FOUND/i.test(rawMsg)) {
      msg = rawMsg.includes("không đang LIVE")
        ? rawMsg
        : `Kênh @${rawId} hiện không đang phát LIVE. Bật LIVE trên TikTok rồi bấm kết nối lại.`;
    } else if (isInvalidEulerKeyError(err)) {
      msg += "Máy chủ ký TikTok từ chối key. Tải lại trang (Ctrl+Shift+R) rồi bấm kết nối lại.";
    } else if (/Business plan|Premium|sign a request|SignatureMissing/i.test(rawMsg)) {
      msg += "Máy chủ ký TikTok từ chối. Thử lại sau vài giây.";
    } else if (/403|429|captcha|HTTPError/i.test(rawMsg)) {
      msg += "TikTok chặn request (403/captcha). Thử lại sau vài giây.";
    } else {
      msg += rawMsg || "Lỗi không xác định";
    }

    currentErrorMessage = msg;
    return { success: false, message: msg };
  }
}

export async function disconnectTikTokLiveImpl(): Promise<{ success: boolean }> {
  await closeActive();
  activeUniqueId = null;
  currentStatus = "idle";
  currentErrorMessage = null;
  currentViewerCount = 0;
  pendingEvents.length = 0;
  return { success: true };
}
