"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavButtonsProps {
  scrollPrev: () => void;
  scrollNext: () => void;
  labels: { previousSlide: string; nextSlide: string };
  /** False at the first slide when the carousel is not (effectively) looping. Default true. */
  canPrev?: boolean;
  /** False at the last slide when the carousel is not (effectively) looping. Default true. */
  canNext?: boolean;
  /** Vertical centre in px, measured from the top; default is the middle of the whole carousel. */
  centerY?: number;
}

/**
 * A disabled end stays focusable (`aria-disabled`, no-op click, disabled look) so focus is not
 * dropped to <body> and a click cannot fall through to the slide beneath.
 *
 * Previous sits at the inline start, next at the inline end; the chevrons flip under `rtl:`
 * (the track sets `dir` on its root when the direction comes from a prop). An explicit
 * `dir="ltr"` inside an RTL page undoes the flip: Tailwind `rtl:` also matches any descendant
 * of a `[dir=rtl]` ancestor, so the root carries `data-dir` for the override.
 */
export function NavButtons({
  scrollPrev,
  scrollNext,
  labels,
  canPrev = true,
  canNext = true,
  centerY,
}: NavButtonsProps) {
  const style = centerY === undefined ? undefined : { top: centerY };
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1/2 start-2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:opacity-40 rtl:rotate-180 group-data-[dir=ltr]/media-carousel:rotate-0"
        style={style}
        aria-disabled={!canPrev ? "true" : undefined}
        onClick={canPrev ? scrollPrev : undefined}
        aria-label={labels.previousSlide}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1/2 end-2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:opacity-40 rtl:rotate-180 group-data-[dir=ltr]/media-carousel:rotate-0"
        style={style}
        aria-disabled={!canNext ? "true" : undefined}
        onClick={canNext ? scrollNext : undefined}
        aria-label={labels.nextSlide}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </>
  );
}
