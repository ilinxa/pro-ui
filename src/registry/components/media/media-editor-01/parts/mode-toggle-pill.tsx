"use client";

import { cn } from "@/lib/utils";
import type { ComposerMode, StoryComposer01Labels } from "../types";

export interface ModeTogglePillProps {
  mode: ComposerMode;
  visibleModes: ComposerMode[];
  labels: Required<StoryComposer01Labels>;
  onModeChange: (mode: ComposerMode) => void;
  className?: string;
}

const ORDER: ComposerMode[] = ["photo", "video", "text"];

/**
 * Plain-button segmented control. Deliberately NOT shadcn ToggleGroup — its
 * value model diverges between Radix (single: string) and Base UI (string[]),
 * an F-cross-13 carrier that breaks Base-UI consumers (filter-stack 0.1.1 /
 * calendar-01 v0.2.1 precedent: same swap). Re-tapping the active mode stays
 * a noop (ToggleGroup used to emit "" on re-tap; here we simply don't fire).
 */
export function ModeTogglePill({
  mode,
  visibleModes,
  labels,
  onModeChange,
  className,
}: ModeTogglePillProps) {
  if (visibleModes.length < 2) return null;

  const orderedVisible = ORDER.filter((m) => visibleModes.includes(m));

  return (
    <div
      role="group"
      className={cn(
        "inline-flex rounded-full bg-black/40 backdrop-blur-md p-1 text-white",
        className,
      )}
    >
      {orderedVisible.map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={active}
            aria-label={labelFor(m, labels)}
            onClick={() => {
              if (!active) onModeChange(m);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-white text-black"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            {labelFor(m, labels)}
          </button>
        );
      })}
    </div>
  );
}

function labelFor(
  mode: ComposerMode,
  labels: Required<StoryComposer01Labels>,
): string {
  switch (mode) {
    case "photo":
      return labels.modePhoto;
    case "video":
      return labels.modeVideo;
    case "text":
      return labels.modeText;
  }
}
