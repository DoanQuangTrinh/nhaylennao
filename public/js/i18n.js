/**
 * Lightweight EN/VI strings for legacy overlay embeds.
 * Host panel + React overlay use config profiles (Global EN / Local VI).
 */
(function (global) {
  const dict = {
    en: {
      type1: "TYPE 1 TO JOIN THE FLOOR",
      leave: "Type 0 to leave",
      giftCta: "Send a gift = fireworks + TOP board",
      fortuneCta: "Drop your question — AI Master roasts your fate in 10 seconds",
      brandClub: "Neon Club Live",
      brandFortune: "Savage Fortune Live",
    },
    vi: {
      type1: "GÕ 1 ĐỂ VÀO SÀN",
      leave: "Gõ 0 để rời",
      giftCta: "Tặng quà = pháo hoa + TOP board",
      fortuneCta: "Comment câu hỏi — AI Master trả lời trong 10 giây",
      brandClub: "Quán Bar Live",
      brandFortune: "Tử Vi Live",
    },
  };

  function t(lang, key) {
    const L = dict[lang] || dict.en;
    return L[key] || dict.en[key] || key;
  }

  global.QuanBarI18n = { dict, t };
})(typeof window !== "undefined" ? window : globalThis);
