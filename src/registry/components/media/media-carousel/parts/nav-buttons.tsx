"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavButtonsProps {
  scrollPrev: () => void;
  scrollNext: () => void;
  labels: { previousSlide: string; nextSlide: string };
}

/**
 * Previous sits at the inline start, next at the inline end; the chevrons flip under `rtl:`
 * (the track sets `dir` on its root when the direction comes from a prop). An explicit
 * `dir="ltr"` inside an RTL page undoes the flip: Tailwind `rtl:` also matches any descendant
 * of a `[dir=rtl]` ancestor, so the root carries `data-dir` for the override.
 */
export function NavButtons({ scrollPrev, scrollNext, labels }: NavButtonsProps) {
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1/2 start-2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 rtl:rotate-180 group-data-[dir=ltr]/media-carousel:rotate-0"
        onClick={scrollPrev}
        aria-label={labels.previousSlide}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1/2 end-2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 rtl:rotate-180 group-data-[dir=ltr]/media-carousel:rotate-0"
        onClick={scrollNext}
        aria-label={labels.nextSlide}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </>
  );
}
