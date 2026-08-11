import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResolvedStoryViewer01Labels } from "../types";

export interface NavArrowsProps {
  canPrev: boolean;
  onPrev: () => void;
  onNext: () => void;
  labels: ResolvedStoryViewer01Labels;
}

/**
 * Desktop-only story-level nav (← → between stories).
 * Hidden on mobile; tap zones cover same-story item nav there.
 */
export function NavArrows({ canPrev, onPrev, onNext, labels }: NavArrowsProps) {
  const base =
    "absolute top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white md:flex md:items-center md:justify-center";
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(base, "left-4")}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={!canPrev}
        aria-label={labels.prevStory}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(base, "right-4")}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label={labels.nextStory}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>
    </>
  );
}
