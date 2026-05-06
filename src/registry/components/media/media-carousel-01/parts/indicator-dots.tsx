"use client";

import { cn } from "@/lib/utils";

interface IndicatorDotsProps {
  total: number;
  currentIndex: number;
  scrollTo: (index: number) => void;
  labels: { goToSlide: string };
}

export function IndicatorDots({
  total,
  currentIndex,
  scrollTo,
  labels,
}: IndicatorDotsProps) {
  return (
    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === currentIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`${labels.goToSlide} ${i + 1}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "w-4 bg-primary"
                : "w-1.5 bg-primary/40 hover:bg-primary/60",
            )}
          />
        );
      })}
    </div>
  );
}
