import { useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";
import type { ResolvedStoryViewer01Labels, StoryItem } from "../types";
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
  /**
   * 0.6.2 - author name + resolved labels. When both are given the CURRENT segment is the one
   * `progressbar`, named by `labels.position(author, index, total)`; the other segments are
   * `aria-hidden`. Without them (the cube ghost faces) every segment is `aria-hidden`.
   */
  author?: string;
  labels?: ResolvedStoryViewer01Labels;
}

export function ProgressBars({
  items,
  currentItemIndex,
  progress,
  smooth = false,
  author,
  labels,
}: ProgressBarsProps) {
  return (
    // 0.6.2 - z-30: above the header (z-20), whose gradient scrim would otherwise paint over the bars.
    <div className="absolute inset-x-0 top-0 z-30 flex gap-1 p-2" data-story-progress="">
      {items.map((item, idx) => {
        const width =
          idx < currentItemIndex
            ? 100
            : idx === currentItemIndex
              ? progress
              : 0;
        const isCurrent = idx === currentItemIndex && !!labels && author !== undefined;
        const a11y = isCurrent
          ? ({
              role: "progressbar",
              "aria-label": labels.position(author, idx, items.length),
              "aria-valuemin": 0,
              "aria-valuemax": 100,
              "aria-valuenow": Math.round(width),
            } as const)
          : ({ "aria-hidden": true } as const);
        return (
          <div
            key={item.id}
            // 0.6.2 - a soft scrim-coloured shadow so a white bar still reads on a white photo.
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-media-overlay-foreground/30 shadow-[0_0_3px] shadow-media-overlay"
            {...a11y}
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
