import type { StoryItem } from "../types";

export interface ProgressBarsProps {
  items: StoryItem[];
  currentItemIndex: number;
  /** Current item progress percentage (0–100). */
  progress: number;
  /**
   * Media-driven progress (~4 Hz updates): ease the current bar's width so it
   * doesn't visibly step. Applies to the current bar only, so the reset on an
   * item change is never animated.
   */
  smooth?: boolean;
}

export function ProgressBars({ items, currentItemIndex, progress, smooth = false }: ProgressBarsProps) {
  return (
    <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-2">
      {items.map((item, idx) => {
        const width =
          idx < currentItemIndex
            ? 100
            : idx === currentItemIndex
              ? progress
              : 0;
        return (
          <div
            key={item.id}
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(width)}
          >
            <div
              className={
                smooth && idx === currentItemIndex
                  ? "h-full bg-white transition-[width] duration-250 ease-linear"
                  : "h-full bg-white transition-[width] duration-100 ease-linear"
              }
              style={{ width: `${width}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
