import type { MediaCarouselItem } from "./types";

/**
 * Sample carousel — a "re-edit" seed shape (remote URLs, no local blobs), as a
 * CMS would hydrate an existing post's media. Mixed photo + video proves the
 * collection doesn't separate kinds. Items have NO `blob`/`editorState`, so the
 * carousel treats them as unedited remote sources.
 *
 * Square (1:1) image sources so the demo's `aspect="auto"` resolves to a clean
 * 1:1 frame.
 */
export const dummyCarouselItems: MediaCarouselItem[] = [
  {
    id: "seed-1",
    kind: "image",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&h=1080&fit=crop",
    width: 1080,
    height: 1080,
    fileName: "ridge-light.jpg",
  },
  {
    id: "seed-2",
    kind: "image",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1080&h=1080&fit=crop",
    width: 1080,
    height: 1080,
    fileName: "city-dusk.jpg",
  },
  {
    id: "seed-3",
    kind: "video",
    url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    width: 1280,
    height: 720,
    fileName: "clip.mp4",
  },
  {
    id: "seed-4",
    kind: "image",
    url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1080&h=1080&fit=crop",
    width: 1080,
    height: 1080,
    fileName: "press.jpg",
  },
];
