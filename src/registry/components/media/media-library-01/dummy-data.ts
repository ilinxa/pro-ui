import type { MediaNode } from "./types";

/** A fixed past instant offset from a stable base (avoids Date.now at module load). */
function relativeIso({ hours = 0, days = 0 }: { hours?: number; days?: number }): string {
  const base = new Date("2026-06-09T12:00:00.000Z").getTime();
  return new Date(base - (hours * 3600 + days * 86400) * 1000).toISOString();
}

function img(
  id: string,
  name: string,
  sizeKb: number,
  days: number,
  picsum: string,
): MediaNode {
  return {
    id,
    name,
    type: "file",
    ext: name.split(".").pop(),
    mimeType: "image/jpeg",
    size: sizeKb * 1000,
    width: 1600,
    height: 1066,
    modifiedAt: relativeIso({ days }),
    url: `https://picsum.photos/${picsum}/1600/1066`,
    thumbnailUrl: `https://picsum.photos/${picsum}/600/400`,
  };
}

/**
 * Sample library mirroring the reference CMS "Media library" surface: a few
 * folders + root files spanning the previewable types. Folders use
 * `children: undefined` to exercise lazy loading via `onLoadChildren`.
 */
export const MEDIA_LIBRARY_NODES: MediaNode[] = [
  { id: "f-photos", name: "Photos", type: "folder", modifiedAt: relativeIso({ hours: 2 }), children: undefined },
  { id: "f-brand", name: "Brand & logos", type: "folder", modifiedAt: "2026-03-24T10:00:00.000Z", children: undefined },
  { id: "f-docs", name: "Documents", type: "folder", modifiedAt: relativeIso({ days: 3 }), children: undefined },
  { id: "f-video", name: "Video", type: "folder", modifiedAt: relativeIso({ days: 8 }), children: undefined },
  {
    id: "file-hero",
    name: "hero-home.jpg",
    type: "file",
    ext: "jpg",
    mimeType: "image/jpeg",
    size: 2_415_000,
    width: 2400,
    height: 1350,
    modifiedAt: relativeIso({ hours: 5 }),
    url: "https://picsum.photos/id/1018/2400/1350",
    thumbnailUrl: "https://picsum.photos/id/1018/640/360",
  },
  {
    id: "file-og",
    name: "og-card.png",
    type: "file",
    ext: "png",
    mimeType: "image/png",
    size: 845_000,
    width: 1200,
    height: 630,
    modifiedAt: relativeIso({ days: 1 }),
    url: "https://picsum.photos/id/1025/1200/630",
    thumbnailUrl: "https://picsum.photos/id/1025/600/315",
  },
  {
    id: "file-favicon",
    name: "favicon.png",
    type: "file",
    ext: "png",
    mimeType: "image/png",
    size: 18_400,
    width: 512,
    height: 512,
    modifiedAt: relativeIso({ days: 2 }),
    url: "https://picsum.photos/id/1062/512/512",
    thumbnailUrl: "https://picsum.photos/id/1062/256/256",
  },
];

/** Children resolved lazily by the demo's `onLoadChildren`. */
export const MEDIA_LIBRARY_CHILDREN: Record<string, MediaNode[]> = {
  "f-photos": [
    img("p1", "beach-sunset.jpg", 1080, 3, "id/1015"),
    img("p2", "mountains.jpg", 1480, 6, "id/1016"),
    img("p3", "city-night.jpg", 990, 12, "id/1019"),
  ],
  "f-brand": [
    {
      id: "b-readme",
      name: "brand-guidelines.md",
      type: "file",
      ext: "md",
      mimeType: "text/markdown",
      size: 4200,
      modifiedAt: "2026-03-24T10:00:00.000Z",
      url:
        "data:text/markdown," +
        encodeURIComponent(
          "# Brand guidelines\n\n## Logo\nUse the **signal-lime** mark on near-black.\n\n- Min size: 24px\n- Clear space: 1× cap height\n",
        ),
    },
    {
      id: "b-tokens",
      name: "tokens.json",
      type: "file",
      ext: "json",
      mimeType: "application/json",
      size: 1200,
      modifiedAt: "2026-03-22T10:00:00.000Z",
      url:
        "data:application/json," +
        encodeURIComponent(
          JSON.stringify({ accent: "oklch(0.80 0.20 132)", font: "Onest", radius: 12 }, null, 2),
        ),
    },
  ],
  "f-docs": [
    {
      id: "d-notes",
      name: "release-notes.txt",
      type: "file",
      ext: "txt",
      mimeType: "text/plain",
      size: 820,
      modifiedAt: relativeIso({ days: 3 }),
      url:
        "data:text/plain," +
        encodeURIComponent("Release 2.4\n- Media library ships\n- Drive-style previews\n"),
    },
    {
      id: "d-report",
      name: "annual-report.pdf",
      type: "file",
      ext: "pdf",
      mimeType: "application/pdf",
      size: 1_240_000,
      modifiedAt: relativeIso({ days: 4 }),
      url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    },
  ],
  "f-video": [
    {
      id: "v1",
      name: "promo.mp4",
      type: "file",
      ext: "mp4",
      mimeType: "video/mp4",
      size: 8_400_000,
      modifiedAt: relativeIso({ days: 8 }),
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
  ],
};

export const MEDIA_LIBRARY_STORAGE = { used: 12_800_000_000, total: 50_000_000_000 };
