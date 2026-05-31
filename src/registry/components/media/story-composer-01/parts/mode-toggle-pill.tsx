"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(next) => {
        // ToggleGroup emits "" when the active item is re-tapped — ignore.
        if (next && orderedVisible.includes(next as ComposerMode)) {
          onModeChange(next as ComposerMode);
        }
      }}
      className={cn(
        "inline-flex rounded-full bg-black/40 backdrop-blur-md p-1 text-white",
        className,
      )}
    >
      {orderedVisible.map((m) => (
        <ToggleGroupItem
          key={m}
          value={m}
          aria-label={labelFor(m, labels)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase",
            "text-white/70 data-[state=on]:bg-white data-[state=on]:text-black",
            "hover:bg-white/10 hover:text-white",
            "data-[state=on]:hover:bg-white data-[state=on]:hover:text-black",
            "transition-colors",
          )}
        >
          {labelFor(m, labels)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
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
