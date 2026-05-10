"use client";

import type { MarqueeRect } from "../hooks/use-marquee";

interface FileManagerMarqueeProps {
  rect: MarqueeRect | null;
}

/**
 * Visual rectangle drawn during marquee selection. Positioned absolutely
 * relative to the scroll container; consumer must place it inside a
 * `position: relative` ancestor (the content pane handles this).
 */
export function FileManagerMarquee(props: FileManagerMarqueeProps) {
  const { rect } = props;
  if (!rect) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-10 rounded-sm border border-primary bg-primary/15"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}
