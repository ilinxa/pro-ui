import type { StickerOption, StickerSet } from "../types";

/**
 * Built-in emoji stickers (Q-P9a — inline data URLs in TS).
 *
 * Implemented as SVG-text data URLs rather than base64 PNGs:
 *   - Each sticker is ~180 bytes vs ~3-5KB for an equivalent PNG.
 *   - Vector — scales infinitely with Transformer.
 *   - Renders consistently regardless of host emoji-font (the SVG inlines
 *     the unicode codepoint and the browser renders with its system emoji).
 *
 * Total payload for the 36 stickers below: ~6KB → no measurable bundle
 * bloat (well under the ~80KB ceiling that would trigger a switch to
 * the separate-PNG-files pattern from description §15 Q-P9b).
 */

function emojiSticker(id: string, emoji: string, alt: string): StickerOption {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><text x="128" y="170" font-size="200" text-anchor="middle">${emoji}</text></svg>`;
  return {
    id,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    alt,
    width: 256,
    height: 256,
  };
}

const FACES: StickerOption[] = [
  emojiSticker("smile", "😀", "Smile"),
  emojiSticker("laugh", "😂", "Laugh"),
  emojiSticker("heart-eyes", "😍", "Heart eyes"),
  emojiSticker("kiss", "😘", "Kiss"),
  emojiSticker("cool", "😎", "Cool"),
  emojiSticker("wink", "😉", "Wink"),
  emojiSticker("thinking", "🤔", "Thinking"),
  emojiSticker("party", "🥳", "Party"),
  emojiSticker("sleepy", "😴", "Sleepy"),
];

const HEARTS: StickerOption[] = [
  emojiSticker("heart-red", "❤️", "Red heart"),
  emojiSticker("heart-orange", "🧡", "Orange heart"),
  emojiSticker("heart-yellow", "💛", "Yellow heart"),
  emojiSticker("heart-green", "💚", "Green heart"),
  emojiSticker("heart-blue", "💙", "Blue heart"),
  emojiSticker("heart-purple", "💜", "Purple heart"),
  emojiSticker("heart-black", "🖤", "Black heart"),
  emojiSticker("heart-broken", "💔", "Broken heart"),
  emojiSticker("heart-sparkle", "💖", "Sparkle heart"),
];

const SYMBOLS: StickerOption[] = [
  emojiSticker("fire", "🔥", "Fire"),
  emojiSticker("star", "⭐", "Star"),
  emojiSticker("sparkles", "✨", "Sparkles"),
  emojiSticker("crown", "👑", "Crown"),
  emojiSticker("rocket", "🚀", "Rocket"),
  emojiSticker("rainbow", "🌈", "Rainbow"),
  emojiSticker("sun", "☀️", "Sun"),
  emojiSticker("moon", "🌙", "Moon"),
  emojiSticker("lightning", "⚡", "Lightning"),
];

const HANDS: StickerOption[] = [
  emojiSticker("thumbs-up", "👍", "Thumbs up"),
  emojiSticker("clap", "👏", "Clap"),
  emojiSticker("raised-hands", "🙌", "Raised hands"),
  emojiSticker("peace", "✌️", "Peace"),
  emojiSticker("ok-hand", "👌", "OK hand"),
  emojiSticker("muscle", "💪", "Muscle"),
  emojiSticker("pray", "🙏", "Pray"),
  emojiSticker("wave", "👋", "Wave"),
  emojiSticker("point-up", "☝️", "Point up"),
];

export const BUILT_IN_STICKER_SETS: StickerSet[] = [
  { id: "faces", label: "Faces", stickers: FACES },
  { id: "hearts", label: "Hearts", stickers: HEARTS },
  { id: "symbols", label: "Symbols", stickers: SYMBOLS },
  { id: "hands", label: "Hands", stickers: HANDS },
];

/**
 * Merge consumer-supplied sticker sets with the built-in catalog.
 * `replace=true` → consumer set wins entirely.
 */
export function resolveStickerSets(
  consumer: StickerSet[] | undefined,
  replace: boolean,
): StickerSet[] {
  if (replace) return consumer ?? [];
  if (!consumer || consumer.length === 0) return BUILT_IN_STICKER_SETS;
  return [...BUILT_IN_STICKER_SETS, ...consumer];
}
