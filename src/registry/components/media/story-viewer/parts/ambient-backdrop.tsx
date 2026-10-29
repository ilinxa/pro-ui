"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Story, StoryBackdropContext, StoryItem } from "../types";

export interface AmbientBackdropProps {
  /** Only while the viewer is open. */
  open: boolean;
  story: Story;
  item: StoryItem;
  /** `"ambient"` draws the blurred item; anything else draws nothing of its own (the dialog overlay stays). */
  mode?: "dim" | "ambient";
  /** The image URL the stage loaded (`currentSrc`), once it loaded. */
  src?: string;
  /** The video poster, when the item is a video and has one. */
  poster?: string;
  isReady: boolean;
  /**
   * The current item is still loading (not ready, not unavailable). The image already shown stays
   * until the item is ready, so the change cross-fades instead of passing through the dim overlay.
   */
  loading?: boolean;
  reducedMotion: boolean;
  /** Wins over `mode`; rendered in the same layer (also under reduced motion). */
  renderBackdrop?: (story: Story, item: StoryItem, ctx: StoryBackdropContext) => React.ReactNode;
}

const FADE_MS = 300;
const noopSubscribe = () => () => {};

/**
 * 0.7.0 (SV-2) - desktop backdrop. A fixed, full-window layer portalled to `document.body`, BELOW
 * the dialog overlay (shadcn's overlay + content are `z-50`; this is `z-40`), click-through and
 * hidden from assistive tech, shown from `md` up (the card is full screen below that). Ambient mode
 * reuses the URL the stage already loaded - it never requests a neighbour's media.
 */
export function AmbientBackdrop({
  open,
  story,
  item,
  mode,
  src,
  poster,
  isReady,
  loading = false,
  reducedMotion,
  renderBackdrop,
}: AmbientBackdropProps) {
  const client = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const ambient = open && mode === "ambient" && !renderBackdrop && !reducedMotion;
  const url = ambient && isReady ? (item.type === "video" ? poster : src) : undefined;
  // While the next item loads, the image already shown holds (it is the item just left, never a
  // neighbour fetched for the backdrop); a ready item then cross-fades over it.
  const hold = ambient && loading;

  // Cross-fade: the previous image stays under the new one for one fade, then is dropped.
  const [layers, setLayers] = useState<string[]>([]);
  const [prevUrl, setPrevUrl] = useState<string | undefined>(undefined);
  if (!hold && prevUrl !== url) {
    setPrevUrl(url);
    setLayers(url ? (prevUrl && layers.includes(prevUrl) ? [prevUrl, url] : [url]) : []);
  }
  useEffect(() => {
    if (layers.length < 2) return;
    const t = window.setTimeout(() => setLayers((l) => l.slice(-1)), FADE_MS);
    return () => window.clearTimeout(t);
  }, [layers]);

  if (!client || !open) return null;

  let content: React.ReactNode = null;
  if (renderBackdrop) {
    content = renderBackdrop(story, item, { src, poster, isReady, reducedMotion });
  } else if (layers.length) {
    content = (
      <>
        {layers.map((layerUrl) => (
          <img
            key={layerUrl}
            src={layerUrl}
            alt=""
            draggable={false}
            data-story-backdrop-image=""
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl animate-in fade-in-0 duration-300"
          />
        ))}
        <div className="absolute inset-0 bg-media-overlay" />
      </>
    );
  }
  if (!content) return null;

  return createPortal(
    <div
      aria-hidden="true"
      data-story-backdrop=""
      className="pointer-events-none fixed inset-0 z-40 hidden overflow-hidden md:block"
    >
      {content}
    </div>,
    document.body,
  );
}
