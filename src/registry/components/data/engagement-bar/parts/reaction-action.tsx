"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type {
  EngagementAction,
  EngagementBarVariant,
  EngagementState,
  ResolvedEngagementBarLabels,
} from "../types";
import type { Direction } from "../hooks/use-direction";
import { DISABLED_ACTION_CLASS, useActionName } from "../lib/action-name";
import { ReactionPicker } from "./reaction-picker";

const LONG_PRESS_MS = 350;
const POINTER_MOVE_TOLERANCE_SQ = 100; // (10px)^2

type ReactionActionData = Extract<EngagementAction, { kind: "reaction" }>;

export interface ReactionActionProps {
  action: ReactionActionData;
  variant: EngagementBarVariant;
  /** Shown state (`viewerReaction`, `reactionCounts`, `reactionTotalCount` are read). */
  state: EngagementState;
  /**
   * Select / clear path. The bar passes its `selectReaction` (gating, handler, optimistic
   * overlay); this part calls it microtask-deferred (Defense 1).
   */
  onSelect: (kind: string | null) => void;
  format: (n: number) => string;
  labels: ResolvedEngagementBarLabels;
  /** Direction for the picker's arrow keys + its portal content. Default `"ltr"`. */
  dir?: Direction;
  /** Fires when the picker opens / closes (changes only, plus a close on unmount while open). */
  onPickerOpenChange?: (open: boolean) => void;
  actionClassName?: string;
}

function ReactionActionInner({
  action,
  variant,
  state,
  onSelect,
  format,
  labels,
  dir = "ltr",
  onPickerOpenChange,
  actionClassName,
}: ReactionActionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Report picker open / close to the host: on change only (never on mount), and a close if the
  // bar unmounts while the picker is up so a host's pause reason cannot stick.
  const onPickerOpenChangeRef = useRef(onPickerOpenChange);
  useEffect(() => {
    onPickerOpenChangeRef.current = onPickerOpenChange;
  });
  const reportedOpenRef = useRef(false);
  useEffect(() => {
    if (reportedOpenRef.current === pickerOpen) return;
    reportedOpenRef.current = pickerOpen;
    onPickerOpenChangeRef.current?.(pickerOpen);
  }, [pickerOpen]);
  useEffect(
    () => () => {
      if (reportedOpenRef.current) {
        reportedOpenRef.current = false;
        onPickerOpenChangeRef.current?.(false);
      }
    },
    [],
  );
  const disabled = !!action.disabled;

  // Long-press detection refs.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const downPos = useRef({ x: 0, y: 0 });

  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  });

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);
  // A pending long-press must never fire after unmount.
  useEffect(() => cancelLongPress, [cancelLongPress]);

  // A pointer that left (scroll took over) leaves no long-press behind.
  const handlePointerCancel = useCallback(() => {
    cancelLongPress();
    longPressFired.current = false;
  }, [cancelLongPress]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      // Only the main mouse button starts a long-press.
      if (e.pointerType === "mouse" && e.button !== 0) return;
      // A second pointer while one is pending (pinch, two fingers) is not a long-press:
      // cancel instead of leaving the first finger's timer running.
      if (longPressTimer.current !== null) {
        cancelLongPress();
        return;
      }
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
        longPressTimer.current = null;
        if (disabledRef.current) return;
        longPressFired.current = true;
        setPickerOpen(true);
      }, LONG_PRESS_MS);
    },
    [disabled, cancelLongPress],
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

  // The trigger allows panning (`touch-manipulation`), so a long-press on touch can raise the
  // native context menu — suppress it only while a long-press is running or has just fired.
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (longPressTimer.current !== null || longPressFired.current) e.preventDefault();
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && disabled) return;
      setPickerOpen(open);
    },
    [disabled],
  );

  const handleIconClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // PopoverTrigger's built-in onClick fires alongside ours (Slot mergeProps
    // composes both handlers; Radix's `setOpen(!open)` toggle runs after our
    // handler returns). We override Radix's toggle via `queueMicrotask` when
    // our tap-matrix doesn't want it to fire — the microtask runs after Radix's
    // state update commits, so our `setPickerOpen(...)` is the final value.
    // This avoids the F-cross-13 mismatch (Base UI doesn't export PopoverAnchor)
    // while still suppressing Radix's auto-toggle when needed.
    if (disabled) {
      queueMicrotask(() => setPickerOpen(false));
      return;
    }

    // Long-press suppression: the timer already opened the picker. Radix's
    // trailing click would close it; force it back open.
    // A keyboard click (detail 0) never follows a long-press — ignore a stale flag.
    const fromLongPress = longPressFired.current && e.detail !== 0;
    longPressFired.current = false;
    if (fromLongPress) {
      queueMicrotask(() => setPickerOpen(true));
      return;
    }
    cancelLongPress();

    const viewer = state.viewerReaction;
    const clearOnTap = action.clearOnTap ?? true;

    // F-01 lock matrix:
    //   viewer = null  →  open picker (any clearOnTap) — Radix toggles for us
    //   viewer = set, clearOnTap = true  →  clear (microtask onSelect(null)) —
    //     Radix toggles open, we override to closed
    //   viewer = set, clearOnTap = false →  open picker — Radix toggles for us
    if (viewer !== null && clearOnTap) {
      // Defense 1 — microtask-deferred select + override Radix's auto-toggle.
      // Both queued in the same microtask for consistency.
      queueMicrotask(() => {
        onSelect(null);
        setPickerOpen(false);
      });
    }
    // Else: Radix's PopoverTrigger toggle handles opening the picker. We
    // don't call setPickerOpen here.
  }, [disabled, cancelLongPress, state.viewerReaction, action.clearOnTap, onSelect]);

  const handlePick = useCallback(
    (kind: string | null) => {
      setPickerOpen(false);
      if (kind === state.viewerReaction) return;
      // Defense 1 — microtask-deferred select.
      queueMicrotask(() => {
        onSelect(kind);
      });
    },
    [state.viewerReaction, onSelect],
  );

  // Resolve display values per Q-PP-5.
  const currentKind = action.kinds.find((k) => k.key === state.viewerReaction);
  const displayColor = currentKind?.color;
  const triggerLabel = currentKind?.label ?? labels.react;

  // Q-PP-5 visibility rule — count hides when withheld, or when total is 0 AND viewer is null.
  const totalCount = state.reactionTotalCount;
  const showCount =
    totalCount !== null && (totalCount > 0 || state.viewerReaction !== null);
  const splitCount = !!action.onCountClick;

  const triggerName = useActionName(showCount && !splitCount);
  const countName = useActionName(true);

  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";

  // Icon node — viewer's current kind icon when set, neutral Smile otherwise.
  const iconNode = currentKind ? (
    <span
      aria-hidden="true"
      className={cn("flex items-center justify-center", iconSizeClass)}
      style={displayColor ? { color: displayColor } : undefined}
    >
      {currentKind.icon}
    </span>
  ) : (
    <Smile aria-hidden="true" className={cn(iconSizeClass, "motion-safe:transition-transform")} />
  );

  const countButton =
    splitCount && showCount ? (
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          action.onCountClick?.();
        }}
        aria-labelledby={countName.labelledBy}
        aria-disabled={disabled || undefined}
        className={cn(
          "rounded text-sm font-medium tabular-nums text-foreground motion-safe:transition-colors",
          "hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          DISABLED_ACTION_CLASS,
        )}
      >
        <span id={countName.labelId} className="sr-only">
          {labels.openReactionsPanel}
        </span>
        <span id={countName.countId}>{format(totalCount)}</span>
      </button>
    ) : null;

  // F-cross-13 deeper: Base UI's PopoverTrigger doesn't accept `asChild` (it
  // uses a `render` prop pattern instead). Radix DOES accept asChild. Cross-
  // compatible solution: render PopoverTrigger DIRECTLY as the button (both
  // libraries render it as a `<button>` by default + pass through props).
  const popover = (
    <Popover open={pickerOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        aria-pressed={state.viewerReaction !== null}
        aria-labelledby={triggerName.labelledBy}
        aria-disabled={disabled || undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={cancelLongPress}
        onPointerCancel={handlePointerCancel}
        onContextMenu={handleContextMenu}
        onClick={handleIconClick}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium motion-safe:transition-colors",
          "hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          // Pan + pinch stay available, so a swipe that starts here scrolls the page (EB5).
          "select-none touch-manipulation [-webkit-touch-callout:none]",
          state.viewerReaction !== null && "text-foreground",
          DISABLED_ACTION_CLASS,
          // E10 — non-split mode merges actionClassName into the trigger button.
          !splitCount && actionClassName,
        )}
      >
        {iconNode}
        <span id={triggerName.labelId} className="sr-only">
          {triggerLabel}
        </span>
        {showCount && !splitCount ? (
          <span
            id={triggerName.countId}
            className="text-sm font-medium tabular-nums"
            aria-live="polite"
          >
            {format(totalCount)}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto"
        align="start"
        dir={dir}
        aria-label={labels.reactionPickerLabel}
      >
        <ReactionPicker
          kinds={action.kinds}
          mergedCounts={state.reactionCounts ?? {}}
          viewerReaction={state.viewerReaction}
          onSelect={handlePick}
          labels={labels}
          format={format}
          dir={dir}
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
      <div className={cn("flex items-center gap-2 pe-2", actionClassName)}>
        {popover}
        {countButton}
      </div>
    );
  }

  return popover;
}

export const ReactionAction = memo(ReactionActionInner);
ReactionAction.displayName = "ReactionAction";
