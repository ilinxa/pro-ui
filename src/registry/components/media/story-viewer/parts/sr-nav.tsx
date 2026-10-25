import type { ResolvedStoryViewer01Labels, Story } from "../types";

export interface SrNavProps {
  story: Story;
  itemIndex: number;
  onPrev: () => void;
  onNext: () => void;
  labels: ResolvedStoryViewer01Labels;
}

/**
 * 0.6.0 (SV15) - previous / next ITEM buttons for assistive technology, on every viewport (the
 * tap zones are `aria-hidden` touch affordances). Visually hidden but focusable (a focused one
 * becomes visible so sighted keyboard users see where focus is).
 */
export function SrNav({ story, itemIndex, onPrev, onNext, labels }: SrNavProps) {
  const cls =
    "sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-14 focus-visible:z-30 focus-visible:rounded-full focus-visible:bg-media-overlay focus-visible:px-3 focus-visible:py-1 focus-visible:text-xs focus-visible:text-media-overlay-foreground";
  return (
    <div data-story-sr-nav="" className="contents">
      <button
        type="button"
        className={`${cls} focus-visible:start-4`}
        onClick={onPrev}
        data-story-sr-nav-prev=""
      >
        {labels.prevItem}
      </button>
      <button
        type="button"
        className={`${cls} focus-visible:end-4`}
        onClick={onNext}
        data-story-sr-nav-next=""
      >
        {labels.nextItem}
      </button>
      <span aria-live="polite" aria-atomic="true" className="sr-only" data-story-position="">
        {labels.position(story.username, itemIndex, story.items.length)}
      </span>
    </div>
  );
}
