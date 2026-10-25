import { useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";
import type { StoryItem } from "../types";
import { useStoryProgress } from "../hooks/use-story-progress";
import {
  selectProgress,
  type ProgressSelection,
  type ProgressStore,
} from "../lib/progress-store";

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
    <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-2">
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
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-media-overlay-foreground/30"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(width)}
          >
            <div
              className={
                smooth && idx === currentItemIndex
                  ? "h-full bg-media-overlay-foreground transition-[width] duration-250 ease-linear"
                  : "h-full bg-media-overlay-foreground transition-[width] duration-100 ease-linear"
              }
              style={{ width: `${width}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Subscribe to the live progress of the current item (re-renders only the caller). */
function useLiveProgress(store: ProgressStore, selection: ProgressSelection): number {
  const { itemKey, isReady, mediaDriven } = selection;
  return useSyncExternalStore(
    store.subscribe,
    () => selectProgress(store.get(), { itemKey, isReady, mediaDriven }),
    () => 0,
  );
}

export interface LiveProgressBarsProps extends Omit<ProgressBarsProps, "progress"> {
  store: ProgressStore;
  selection: ProgressSelection;
}

/**
 * 0.6.0 (SV18) — the default bars, subscribed to the progress store: a 50 ms tick
 * re-renders THIS component only, never the viewer root.
 */
export function LiveProgressBars({ store, selection, ...rest }: LiveProgressBarsProps) {
  const progress = useLiveProgress(store, selection);
  return <ProgressBars {...rest} progress={progress} />;
}

export interface LiveProgressSlotProps {
  store: ProgressStore;
  selection: ProgressSelection;
  /** Called with the live percentage on every change. */
  children: (progress: number) => ReactNode;
}

/** Same subscription for a `renderProgress` slot, so the slot keeps receiving live values. */
export function LiveProgressSlot({ store, selection, children }: LiveProgressSlotProps) {
  return <>{children(useLiveProgress(store, selection))}</>;
}

export interface ProgressDriverProps {
  store: ProgressStore;
  isOpen: boolean;
  isPaused: boolean;
  itemKey: string;
  itemDurationMs: number;
  onComplete: () => void;
  /** Forwarded to `useStoryProgress` (hand-over from media progress after a mid-play error). */
  seedPct?: number;
}

/**
 * 0.6.0 (SV18) — runs the item timer (`useStoryProgress`) in its own component so
 * the per-tick state lives here, and publishes the value to the store. Renders
 * nothing.
 */
export function ProgressDriver({
  store,
  isOpen,
  isPaused,
  itemKey,
  itemDurationMs,
  onComplete,
  seedPct,
}: ProgressDriverProps) {
  const pct = useStoryProgress({ isOpen, isPaused, itemKey, itemDurationMs, onComplete, seedPct });
  useLayoutEffect(() => {
    store.setTimer(itemKey, pct);
  }, [store, itemKey, pct]);
  return null;
}
