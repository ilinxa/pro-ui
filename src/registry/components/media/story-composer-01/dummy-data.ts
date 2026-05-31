import type {
  PublishedStory,
  StickerOption,
  StickerSet,
} from "./types";

// Re-export runtime defaults so docs-site demos that import from
// dummy-data still have access to them. Production base ships the
// originals in lib/defaults.ts.
export {
  DEFAULT_TEXT_GRADIENTS,
  DEFAULT_FONTS,
  DEFAULT_COLOR_PRESETS,
  type GradientPreset,
} from "./lib/defaults";

// ─── Sample consumer-supplied sticker set (demo only) ───────────────────

const sampleSticker: (id: string, alt: string) => StickerOption = (
  id,
  alt,
) => ({
  id,
  src: `https://placehold.co/256x256/lime/black.png?text=${encodeURIComponent(alt)}`,
  alt,
  width: 256,
  height: 256,
});

export const SAMPLE_BRAND_STICKERS: StickerSet = {
  id: "ilinxa-brand",
  label: "Ilinxa",
  stickers: [
    sampleSticker("brand-logo", "Logo"),
    sampleSticker("brand-tag", "Tag"),
    sampleSticker("brand-arrow", "Arrow"),
    sampleSticker("brand-star", "Star"),
  ],
};

// ─── Sample upload destination (demo only — never hit at runtime) ───────

export const SAMPLE_UPLOAD_URL = "https://example.com/upload/story";

// ─── Sample PublishedStory shape (for usage docs) ───────────────────────

export const SAMPLE_PUBLISHED_STORY: PublishedStory = {
  id: "story-demo-1",
  createdAt: "2026-05-31T12:00:00.000Z",
  items: [
    {
      id: "item-1",
      type: "image",
      src: "https://example.com/uploads/story-demo-1.jpg",
      duration: 5,
    },
  ],
};
