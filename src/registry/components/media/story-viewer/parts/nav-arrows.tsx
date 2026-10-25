import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResolvedStoryViewer01Labels } from "../types";

export interface NavArrowsProps {
  canPrev: boolean;
  onPrev: () => void;
  onNext: () => void;
  labels: ResolvedStoryViewer01Labels;
  /** `"inside"` (default) sits over the card edges; `"outside"` sits beside the card. */
  placement?: "inside" | "outside";
}

/**
 * Desktop-only story-level nav (previous / next story).
 * Hidden on mobile; tap zones cover same-story item nav there.
 *
 * The chevrons mirror under `dir="rtl"` (the arrows already sit on the logical start / end sides).
 */
export function NavArrows({ canPrev, onPrev, onNext, labels, placement = "inside" }: NavArrowsProps) {
  const base =
    "absolute top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 rounded-full bg-media-overlay-foreground/10 text-media-overlay-foreground hover:bg-media-overlay-foreground/20 hover:text-media-overlay-foreground md:flex md:items-center md:justify-center";
  const outside = placement === "outside";
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(base, outside ? "-start-16" : "start-4")}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={!canPrev}
        aria-label={labels.prevStory}
        data-story-nav-arrow="prev"
      >
        <ChevronLeft className="h-8 w-8 rtl:-scale-x-100" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(base, outside ? "-end-16" : "end-4")}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label={labels.nextStory}
        data-story-nav-arrow="next"
      >
        <ChevronRight className="h-8 w-8 rtl:-scale-x-100" />
      </Button>
    </>
  );
}
