"use client";

import { memo, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EngagementBarSize,
  EngagementCount,
  EngagementReactionKind,
  ResolvedEngagementBarLabels,
} from "../types";
import { useDirection, type Direction } from "../hooks/use-direction";
import { touchTarget, useActionName } from "../lib/action-name";

export interface ReactionPickerProps {
  /** Ordered kind catalog. Picker renders one button per kind in order. */
  kinds: EngagementReactionKind[];
  /**
   * Shown counts per kind (`EngagementState.reactionCounts` from the bar). The picker reads this
   * map, not `kinds[i].count`. A missing or `null` entry renders no number.
   */
  mergedCounts: Record<string, EngagementCount>;
  /** Viewer's currently-selected kind key, or null. Highlights matching kind. */
  viewerReaction: string | null;
  /** Fires when viewer picks a kind, or null via the Remove button. */
  onSelect: (kind: string | null) => void;
  /** Required, fully-resolved labels (no undefined). */
  labels: ResolvedEngagementBarLabels;
  /** Count formatter. Default `String`. The bar passes its locale-aware formatter. */
  format?: (n: number) => string;
  /**
   * Arrow-key direction: in `"rtl"`, → moves to the previous kind. Default: the picker's own
   * direction after mount. The picker usually renders in a portal — pass the host's direction.
   */
  dir?: Direction;
  /** `"touch"`: every button gets a 44 x 44 px minimum hit area. */
  size?: EngagementBarSize;
  className?: string;
}

function KindButton({
  kind,
  count,
  isSelected,
  format,
  buttonRef,
  onSelect,
  onKeyDown,
  size,
}: {
  kind: EngagementReactionKind;
  count: EngagementCount;
  isSelected: boolean;
  format: (n: number) => string;
  buttonRef: (el: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  size?: EngagementBarSize;
}) {
  const showCount = count !== null && count > 0;
  const name = useActionName(showCount);
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-labelledby={name.labelledBy}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5",
        "motion-safe:transition-transform motion-safe:hover:scale-125",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-accent",
        touchTarget(size),
      )}
      style={kind.color ? { color: kind.color } : undefined}
    >
      <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center">
        {kind.icon}
      </span>
      <span id={name.labelId} className="sr-only">
        {kind.label}
      </span>
      {showCount ? (
        <span
          id={name.countId}
          className="text-[10px] font-medium tabular-nums leading-none text-muted-foreground"
        >
          {format(count)}
        </span>
      ) : null}
    </button>
  );
}

function ReactionPickerInner({
  kinds,
  mergedCounts,
  viewerReaction,
  onSelect,
  labels,
  format = String,
  dir,
  size,
  className,
}: ReactionPickerProps) {
  const groupRef = useRef<HTMLDivElement | null>(null);
  const direction = useDirection(groupRef, dir);
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const showRemove = viewerReaction !== null;
  const buttonCount = kinds.length + (showRemove ? 1 : 0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const backward = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      let target: number | null = null;
      if (e.key === forward) target = (index + 1) % buttonCount;
      else if (e.key === backward) target = (index - 1 + buttonCount) % buttonCount;
      else if (e.key === "Home") target = 0;
      else if (e.key === "End") target = buttonCount - 1;
      if (target === null) return;
      e.preventDefault();
      buttonsRef.current[target]?.focus();
    },
    [buttonCount, direction],
  );

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={labels.reactionPickerLabel}
      className={cn("flex items-center gap-1 p-1", className)}
    >
      {kinds.map((kind, index) => (
        <KindButton
          key={kind.key}
          kind={kind}
          count={mergedCounts[kind.key] ?? null}
          isSelected={kind.key === viewerReaction}
          format={format}
          buttonRef={(el) => {
            buttonsRef.current[index] = el;
          }}
          onSelect={() => onSelect(kind.key)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          size={size}
        />
      ))}
      {showRemove ? (
        <button
          ref={(el) => {
            buttonsRef.current[kinds.length] = el;
          }}
          type="button"
          aria-label={labels.removeReaction}
          onClick={() => onSelect(null)}
          onKeyDown={(e) => handleKeyDown(e, kinds.length)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground",
            "motion-safe:transition-colors hover:bg-destructive/10 hover:text-destructive",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            touchTarget(size),
          )}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export const ReactionPicker = memo(ReactionPickerInner);
ReactionPicker.displayName = "ReactionPicker";
