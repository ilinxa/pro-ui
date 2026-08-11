import type { StoryItem } from "../types";

export interface ProgressBarsProps {
  items: StoryItem[];
  currentItemIndex: number;
  /** Current item progress percentage (0–100). */
  progress: number;
}

export function ProgressBars({ items, currentItemIndex, progress }: ProgressBarsProps) {
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
              className="h-full bg-white transition-[width] duration-100 ease-linear"
              style={{ width: `${width}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
