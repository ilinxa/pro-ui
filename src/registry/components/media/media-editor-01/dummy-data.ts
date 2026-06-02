// Editor-shaped fixtures (C12) — ships via the `media-editor-01-fixtures`
// registry item (sibling to the base) so consumers can `pnpm dlx shadcn add`
// the fixtures and get a working seed without authoring their own.
//
// What's here:
//   - Sample initial sources for news-hero (16:9) and chat (1:1 / 9:16) demos.
//   - One small consumer-provided StickerSet illustrating the extension point
//     — the library ships 36 built-in stickers via BUILT_IN_STICKER_SETS;
//     this set demonstrates how a brand can layer a few custom stickers on
//     top via the `stickerSets` prop.

import type { InitialSource, StickerSet } from "./types";

// ─── Sample initial sources ───────────────────────────────────────────

/** 16:9 landscape image suitable for the news-hero demo (CMS hero re-edit). */
export const SAMPLE_HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&auto=format&fit=crop";

/** 1:1 square image suitable for the chat / DM photo demo. */
export const SAMPLE_CHAT_IMAGE_URL =
  "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=1200&auto=format&fit=crop";

/** Ready-to-pass InitialSource for the news-hero demo tab. */
export const SAMPLE_HERO_INITIAL_SOURCE: InitialSource = {
  kind: "url",
  url: SAMPLE_HERO_IMAGE_URL,
  mode: "photo",
};

/** Ready-to-pass InitialSource for the chat demo tab. */
export const SAMPLE_CHAT_INITIAL_SOURCE: InitialSource = {
  kind: "url",
  url: SAMPLE_CHAT_IMAGE_URL,
  mode: "photo",
};

// ─── Sample consumer-provided StickerSet ──────────────────────────────

function svgStickerDataUrl(label: string, fill: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">` +
    `<rect x="16" y="16" width="224" height="224" rx="32" fill="${fill}"/>` +
    `<text x="128" y="160" font-size="80" font-family="Onest, system-ui, sans-serif" ` +
    `font-weight="700" text-anchor="middle" fill="#fff">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * A tiny example "brand pack" of consumer-provided stickers. Pass alongside
 * the built-in sets via the `stickerSets` prop on MediaEditor01.
 *
 * The library merges consumer sets with `BUILT_IN_STICKER_SETS` — pass an
 * empty array to drop the built-ins entirely, or this array to layer one
 * brand pack on top.
 */
export const SAMPLE_BRAND_STICKERS: StickerSet = {
  id: "brand-pack-01",
  label: "Brand",
  stickers: [
    {
      id: "brand-logo",
      src: svgStickerDataUrl("LX", "oklch(0.55 0.20 264)"),
      alt: "ilinxa logo",
      width: 256,
      height: 256,
    },
    {
      id: "brand-new",
      src: svgStickerDataUrl("NEW", "oklch(0.78 0.20 132)"),
      alt: "New badge",
      width: 256,
      height: 256,
    },
    {
      id: "brand-hot",
      src: svgStickerDataUrl("HOT", "oklch(0.62 0.22 25)"),
      alt: "Hot badge",
      width: 256,
      height: 256,
    },
  ],
};
