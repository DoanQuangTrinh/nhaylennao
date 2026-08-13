import { useLiveStore } from "@/lib/store/live-store";

export type LiveIncomingEvent =
  | { type: "chat"; nickname: string; text: string; platform: "tiktok" | "youtube" | "facebook" }
  | { type: "gift"; nickname: string; giftName: string; diamondCount: number; repeatCount: number; platform: "tiktok" | "youtube" | "facebook" }
  | { type: "member"; nickname: string; platform: "tiktok" | "youtube" | "facebook" }
  | { type: "like"; nickname: string; likeCount: number; platform: "tiktok" | "youtube" | "facebook" }
  | { type: "follow"; nickname: string; platform: "tiktok" | "youtube" | "facebook" }
  | { type: "roomUser"; viewerCount: number; platform: "tiktok" | "youtube" | "facebook" };

let memberJoinCount = 0;

/**
 * Handle incoming live stream events (TikTok / YouTube / Facebook) and dispatch them to the 3D bar scene store
 */
export function dispatchLiveEventToStore(event: LiveIncomingEvent) {
  const store = useLiveStore.getState();

  switch (event.type) {
    case "chat": {
      const { nickname, text, platform } = event;
      const line = (text || "").trim();
      if (!line) {
        store.log(`[${platform.toUpperCase()}] 💬 ${nickname}: (trống)`);
        break;
      }
      store.processChat(nickname, line, platform);
      store.log(`[${platform.toUpperCase()}] 💬 ${nickname}: ${line}`);
      break;
    }

    case "gift": {
      const { nickname, giftName, diamondCount, repeatCount, platform } = event;
      const totalCoins = (diamondCount || 1) * (repeatCount || 1);
      store.sendGift(nickname, giftName, totalCoins);
      store.log(`[${platform.toUpperCase()}] 🎁 ${nickname} tặng ${giftName} x${repeatCount} (${totalCoins} xu)`);
      break;
    }

    case "member": {
      const { nickname, platform } = event;
      store.join(nickname, platform, false);
      memberJoinCount += 1;
      // Greet only 1 out of every 10 joins to avoid speech spam!
      if (memberJoinCount % 10 === 0) {
        store.pushMc(`👋 Chào mừng @${nickname} cùng dàn quẩy mới vào phòng! 💃`);
      }
      store.log(`[${platform.toUpperCase()}] 🚶 ${nickname} vừa vào sàn (#${memberJoinCount})`);
      break;
    }

    case "like": {
      const { nickname, likeCount, platform } = event;
      store.triggerSfx("cheers");
      store.log(`[${platform.toUpperCase()}] ❤️ ${nickname} vừa thả ${likeCount} tim`);
      break;
    }

    case "follow": {
      const { nickname, platform } = event;
      store.join(nickname, platform, false);
      store.pushMc(`⭐ Cảm ơn @${nickname} vừa Follow kênh! Mở cánh Neon! ✨`);
      store.log(`[${platform.toUpperCase()}] ⭐ ${nickname} đã Follow`);
      break;
    }

    case "roomUser": {
      const { viewerCount } = event;
      store.log(`[LIVE STREAM] 👁️ Số người đang xem: ${viewerCount}`);
      break;
    }
  }
}
