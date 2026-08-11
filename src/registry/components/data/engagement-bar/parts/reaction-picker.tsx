"use client";

import { memo, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EngagementBarLabels,
  EngagementReactionKind,
} from "../types";

export interface ReactionPickerProps {
  /** Ordered kind catalog. Picker renders one button per kind in order. */
  kinds: EngagementReactionKind[];
  /**
   * Live merged counts per Q-PP-4 source-of-truth rule. Parent computes
   * `state.reactionCounts[k.key] ?? k.count` for each kind and passes the
   * resolved map here. Picker reads this directly — does not consult
   * `kinds[i].count` for display (that's seed-only).
   */
  mergedCounts: Record<string, number>;
  /** Viewer's currently-selected kind key, or null. Highlights matching kind. */
  viewerReaction: string | null;
  /** Fires when viewer picks a kind, or null via the Remove button. */
  onSelect: (kind: string | null) => void;
  /** Required, fully-resolved labels (no undefined). */
  labels: Required<Omit<EngagementBarLabels, "formatCount">>;
  className?: string;
}

function ReactionPickerInner({
  kinds,
  mergedCounts,
  viewerReaction,
  onSelect,
  labels,
  className,
}: ReactionPickerProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const showRemove = viewerReaction !== null;
  const buttonCount = kinds.length + (showRemove ? 1 : 0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = (index + 1) % buttonCount;
        buttonsRef.current[next]?.focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = (index - 1 + buttonCount) % buttonCount;
        buttonsRef.current[prev]?.focus();
      }
    },
    [buttonCount],
  );

  return (
    <div
      role="group"
      aria-label={labels.reactionPickerLabel}
      className={cn("flex items-center gap-1 p-1", className)}
    >
      {kinds.map((kind, index) => {
        const isSelected = kind.key === viewerReaction;
        const count = mergedCounts[kind.key] ?? 0;
        return (
          <button
            key={kind.key}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            aria-label={kind.label}
            aria-pressed={isSelected}
            onClick={() => onSelect(kind.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5",
              "transition-transform hover:scale-125",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected && "bg-accent",
            )}
            style={kind.color ? { color: kind.color } : undefined}
          >
            <span className="flex h-6 w-6 items-center justify-center">
              {kind.icon}
            </span>
            {count > 0 ? (
              <span className="text-[10px] font-medium tabular-nums leading-none text-muted-foreground">
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
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
            "transition-colors hover:bg-destructive/10 hover:text-destructive",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export const ReactionPicker = memo(ReactionPickerInner);
ReactionPicker.displayName = "ReactionPicker";
