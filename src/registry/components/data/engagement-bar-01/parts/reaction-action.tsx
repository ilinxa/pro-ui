"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Smile } from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type {
  EngagementAction,
  EngagementBar01Variant,
  EngagementBarLabels,
  EngagementLocalAction,
  EngagementState,
} from "../types";
import { ReactionPicker } from "./reaction-picker";

const LONG_PRESS_MS = 350;
const POINTER_MOVE_TOLERANCE_SQ = 100; // (10px)^2

type ReactionActionData = Extract<EngagementAction, { kind: "reaction" }>;

interface ReactionActionProps {
  action: ReactionActionData;
  variant: EngagementBar01Variant;
  state: EngagementState;
  dispatch: React.Dispatch<EngagementLocalAction>;
  format: (n: number) => string;
  labels: Required<Omit<EngagementBarLabels, "formatCount">>;
  actionClassName?: string;
}

function ReactionActionInner({
  action,
  variant,
  state,
  dispatch,
  format,
  labels,
  actionClassName,
}: ReactionActionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Long-press detection refs.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const downPos = useRef({ x: 0, y: 0 });

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      // Capture so subsequent pointermove / pointerup events keep firing on
      // this button even if the user drags off. Without this, long-press would
      // continue running on a button the user has already left (per E7).
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Older browsers / non-pointer-capable inputs — silently degrade.
      }
      longPressFired.current = false;
      downPos.current = { x: e.clientX, y: e.clientY };
      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true;
        setPickerOpen(true);
      }, LONG_PRESS_MS);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (longPressTimer.current === null) return;
      const dx = e.clientX - downPos.current.x;
      const dy = e.clientY - downPos.current.y;
      if (dx * dx + dy * dy > POINTER_MOVE_TOLERANCE_SQ) {
        cancelLongPress();
      }
    },
    [cancelLongPress],
  );

  const isControlled = action.viewerReaction !== undefined;

  const handleIconClick = useCallback(() => {
    // Long-press suppression: if the long-press timer already fired the picker
    // open, swallow the trailing click so tap-clear doesn't ALSO run.
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    cancelLongPress();

    const viewer = state.viewerReaction;
    const clearOnTap = action.clearOnTap ?? true;

    // F-01 lock matrix:
    //   viewer = null  →  open picker (any clearOnTap)
    //   viewer = set, clearOnTap = true  →  clear (dispatch null + microtask onSelect(null))
    //   viewer = set, clearOnTap = false →  open picker
    if (viewer !== null && clearOnTap) {
      if (!isControlled) {
        dispatch({ kind: "reaction-select", reactionKind: null });
      }
      // Defense 1 — microtask-deferred consumer notify.
      queueMicrotask(() => {
        action.onSelect?.(null);
      });
    } else {
      setPickerOpen(true);
    }
  }, [cancelLongPress, state.viewerReaction, action, isControlled, dispatch]);

  const handlePick = useCallback(
    (kind: string | null) => {
      setPickerOpen(false);
      // No-op if same kind (matches reducer's same-kind guard at line 187).
      if (kind === state.viewerReaction) return;
      if (!isControlled) {
        dispatch({ kind: "reaction-select", reactionKind: kind });
      }
      // Defense 1 — microtask-deferred consumer notify.
      queueMicrotask(() => {
        action.onSelect?.(kind);
      });
    },
    [state.viewerReaction, isControlled, dispatch, action],
  );

  // Resolve display values per Q-PP-5.
  const currentKind = action.kinds.find((k) => k.key === state.viewerReaction);
  const displayColor = currentKind?.color;
  const triggerAriaLabel = currentKind?.label ?? labels.react;

  // Q-PP-4 source-of-truth — merged counts for the picker.
  const mergedCounts = useMemo<Record<string, number>>(() => {
    const live = state.reactionCounts ?? {};
    return action.kinds.reduce<Record<string, number>>((acc, k) => {
      acc[k.key] = live[k.key] ?? k.count;
      return acc;
    }, {});
  }, [state.reactionCounts, action.kinds]);

  // Q-PP-5 visibility rule — count hides only when totalCount===0 AND viewer===null.
  const totalCount = state.reactionTotalCount ?? 0;
  const showCount = totalCount > 0 || state.viewerReaction !== null;
  const splitCount = !!action.onCountClick;

  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";

  // Icon node — viewer's current kind icon when set, neutral Smile otherwise.
  const iconNode = currentKind ? (
    <span
      className={cn("flex items-center justify-center", iconSizeClass)}
      style={displayColor ? { color: displayColor } : undefined}
    >
      {currentKind.icon}
    </span>
  ) : (
    <Smile className={cn(iconSizeClass, "transition-transform")} />
  );

  // We use `<PopoverAnchor>` instead of `<PopoverTrigger>` because Trigger
  // composes its built-in `onOpenToggle` click handler with ours via Slot
  // merge — so EVERY click would toggle the popover open state regardless
  // of our tap-matrix decisions (e.g. tap-clear would also open the picker).
  // Anchor is positioning-only with no click handler; our code is the sole
  // driver of `pickerOpen`. We must therefore set aria-haspopup / aria-expanded
  // / aria-controls manually (Anchor doesn't supply them).
  const triggerButton = (
    <button
      type="button"
      aria-pressed={state.viewerReaction !== null}
      aria-label={triggerAriaLabel}
      aria-haspopup="dialog"
      aria-expanded={pickerOpen}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onClick={handleIconClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors",
        "hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "select-none touch-none",
        state.viewerReaction !== null && "text-foreground",
        // E10 — match like-action convention: non-split mode merges actionClassName
        // into the button directly (no wrapping div).
        !splitCount && actionClassName,
      )}
    >
      {iconNode}
      {showCount && !splitCount ? (
        <span className="text-sm font-medium tabular-nums" aria-live="polite">
          {format(totalCount)}
        </span>
      ) : null}
    </button>
  );

  const countButton =
    splitCount && showCount ? (
      <button
        type="button"
        onClick={action.onCountClick}
        aria-label={labels.openReactionsPanel}
        className={cn(
          "rounded text-sm font-medium tabular-nums text-foreground transition-colors",
          "hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {format(totalCount)}
      </button>
    ) : null;

  const popover = (
    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
      <PopoverAnchor asChild>{triggerButton}</PopoverAnchor>
      <PopoverContent className="w-auto" align="start">
        <ReactionPicker
          kinds={action.kinds}
          mergedCounts={mergedCounts}
          viewerReaction={state.viewerReaction}
          onSelect={handlePick}
          labels={labels}
        />
      </PopoverContent>
    </Popover>
  );

  // Variant layouts mirror like-action's structure.
  // E10 — non-split returns the popover bare (button carries actionClassName);
  // split wraps in an outer div with actionClassName to host both popover + countButton.
  if (variant === "stacked") {
    if (splitCount) {
      return (
        <div
          className={cn(
            "flex flex-col items-center gap-0.5",
            actionClassName,
          )}
        >
          {popover}
          {countButton}
        </div>
      );
    }
    return popover;
  }

  // default + compact horizontal.
  if (splitCount) {
    return (
      <div className={cn("flex items-center gap-2 pr-2", actionClassName)}>
        {popover}
        {countButton}
      </div>
    );
  }

  return popover;
}

export const ReactionAction = memo(ReactionActionInner);
ReactionAction.displayName = "ReactionAction";
