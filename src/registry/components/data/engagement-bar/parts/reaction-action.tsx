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
  EngagementActionEvent,
  EngagementBarSize,
  EngagementBarVariant,
  EngagementState,
  ResolvedEngagementBarLabels,
} from "../types";
import type { Direction } from "../hooks/use-direction";
import { DISABLED_ACTION_CLASS, touchTarget, useActionName } from "../lib/action-name";
import { ReactionPicker } from "./reaction-picker";

const LONG_PRESS_MS = 350;
const POINTER_MOVE_TOLERANCE_SQ = 100; // (10px)^2
// A hover-opened picker closes this long after the pointer leaves both trigger and picker.
const HOVER_CLOSE_GRACE_MS = 300;

type TimerRef = { current: ReturnType<typeof setTimeout> | null };
function clearTimer(ref: TimerRef) {
  if (ref.current !== null) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

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
  /** Bar-level `hideZeroCounts`: a total of exactly 0 renders no count. */
  hideZeroCounts?: boolean;
  /** Bar-level `size`: `"touch"` gives the trigger and count button a 44 x 44 px hit area. */
  size?: EngagementBarSize;
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
  hideZeroCounts = false,
  size,
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

  // tapAction "primary" (0.8.0): the primary kind is `primaryKey`, else the first kind.
  const tapPrimary = action.tapAction === "primary";
  const hoverOpenDelay = action.hoverOpenDelay;
  const primaryKind = action.kinds.find((k) => k.key === action.primaryKey) ?? action.kinds[0];
  const primaryKeyUnknown =
    tapPrimary &&
    action.primaryKey !== undefined &&
    !action.kinds.some((k) => k.key === action.primaryKey);
  const warnedPrimaryRef = useRef(false);
  useEffect(() => {
    if (!primaryKeyUnknown || warnedPrimaryRef.current || process.env.NODE_ENV === "production") return;
    warnedPrimaryRef.current = true;
    console.warn(
      `[EngagementBar] reaction primaryKey "${action.primaryKey}" matches no kinds[].key; using "${action.kinds[0]?.key}".`,
    );
  }, [primaryKeyUnknown, action.primaryKey, action.kinds]);

  // Hover opening: timers + whether the CURRENT open came from hover (only those close on leave).
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpenedRef = useRef(false);
  const pickerOpenRef = useRef(false);
  // A primary tap must not open the picker: the trigger still toggles on that same click, so its
  // open request is ignored for the duration of the click. The flag is set in the capture phase,
  // before any bubble `onClick` — Radix runs ours first, Base UI may run its own toggle first.
  const ignoreOpenRef = useRef(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // Handing focus back after a hover open reads as "focus outside" to the popover, which then asks
  // to close: that one request is ignored.
  const handingBackRef = useRef(false);
  useEffect(() => {
    pickerOpenRef.current = pickerOpen;
    if (!pickerOpen) {
      hoverOpenedRef.current = false;
      clearTimer(closeTimer);
    }
  }, [pickerOpen]);
  useEffect(
    () => () => {
      clearTimer(hoverTimer);
      clearTimer(closeTimer);
    },
    [],
  );

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
        hoverOpenedRef.current = false;
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
      if (open && (disabled || ignoreOpenRef.current)) return;
      if (!open && handingBackRef.current) return;
      setPickerOpen(open);
    },
    [disabled],
  );

  const handleClickCapture = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!tapPrimary || disabled) return;
      // The click that ends a long-press keeps the picker it opened.
      if (longPressFired.current && e.detail !== 0) return;
      ignoreOpenRef.current = true;
      // Cleared after the whole click has been dispatched (a task, not a microtask): a browser runs
      // microtasks between React's capture and bubble listeners, before the trigger's own toggle.
      setTimeout(() => {
        ignoreOpenRef.current = false;
      }, 0);
    },
    [tapPrimary, disabled],
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
    hoverOpenedRef.current = false;
    clearTimer(hoverTimer);

    if (tapPrimary) {
      // A tap toggles the primary kind through the same microtask-deferred path as a pick (the
      // trigger's own open request was already blocked in the capture phase).
      const next = state.viewerReaction === null ? primaryKind?.key : null;
      queueMicrotask(() => {
        if (next !== undefined) onSelect(next);
      });
      return;
    }

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
  }, [
    disabled,
    cancelLongPress,
    state.viewerReaction,
    action.clearOnTap,
    onSelect,
    tapPrimary,
    primaryKind?.key,
  ]);

  const scheduleHoverClose = useCallback(() => {
    if (!hoverOpenedRef.current) return;
    clearTimer(closeTimer);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      hoverOpenedRef.current = false;
      setPickerOpen(false);
    }, HOVER_CLOSE_GRACE_MS);
  }, []);

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (hoverOpenDelay === undefined || disabled || e.pointerType !== "mouse") return;
      clearTimer(closeTimer);
      if (pickerOpenRef.current || hoverTimer.current !== null) return;
      hoverTimer.current = setTimeout(() => {
        hoverTimer.current = null;
        if (disabledRef.current || pickerOpenRef.current) return;
        hoverOpenedRef.current = true;
        // The picker takes focus when it opens; a hover is not a request to move focus, so hand it
        // back (no Radix-only onOpenAutoFocus — F-cross-13). Two frames: after the content mounted
        // and focused itself.
        const before = document.activeElement;
        setPickerOpen(true);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const active = document.activeElement;
            if (!active || !contentRef.current?.contains(active)) return;
            handingBackRef.current = true;
            if (before instanceof HTMLElement && before !== document.body && before.isConnected) {
              before.focus({ preventScroll: true });
            } else if (active instanceof HTMLElement) {
              active.blur();
            }
            setTimeout(() => {
              handingBackRef.current = false;
            }, 0);
          }),
        );
      }, Math.max(0, hoverOpenDelay));
    },
    [hoverOpenDelay, disabled],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse") return;
      clearTimer(hoverTimer);
      scheduleHoverClose();
    },
    [scheduleHoverClose],
  );

  const handleContentPointerEnter = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") clearTimer(closeTimer);
  }, []);

  // Primary mode: the keyboard reaches the picker without a tap (Enter / Space are the tap).
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!tapPrimary || disabled) return;
      const opensPicker =
        e.key === "ArrowUp" || e.key === "ContextMenu" || (e.shiftKey && e.key === "F10");
      if (!opensPicker) return;
      e.preventDefault();
      if (e.key !== "ArrowUp") {
        // The ContextMenu key / Shift+F10 also fire a native `contextmenu` (on keyup on Windows),
        // which would open the browser menu over the picker.
        const swallow = (event: Event) => event.preventDefault();
        window.addEventListener("contextmenu", swallow, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("contextmenu", swallow, { capture: true }), 1000);
      }
      hoverOpenedRef.current = false;
      clearTimer(hoverTimer);
      setPickerOpen(true);
    },
    [tapPrimary, disabled],
  );

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
  // Idle, primary mode: the trigger shows (and is named by) the primary kind.
  const idleKind = tapPrimary ? primaryKind : undefined;
  const triggerLabel = currentKind?.label ?? idleKind?.label ?? labels.react;

  // Q-PP-5 visibility rule — count hides when withheld, or when total is 0 AND viewer is null.
  const totalCount = state.reactionTotalCount;
  const showCount =
    totalCount !== null &&
    (totalCount > 0 || (state.viewerReaction !== null && !hideZeroCounts));
  const splitCount = !!action.onCountClick;

  const triggerName = useActionName(showCount && !splitCount);
  const countName = useActionName(true);

  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";

  // Icon node: the viewer's kind icon when set, the primary kind's when idle in primary mode,
  // neutral Smile otherwise.
  const iconNode = idleKind && !currentKind ? (
    <span aria-hidden="true" className={cn("flex items-center justify-center", iconSizeClass)}>
      {idleKind.icon}
    </span>
  ) : currentKind ? (
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
        onClick={(event: EngagementActionEvent) => {
          if (disabled) return;
          action.onCountClick?.(event);
        }}
        aria-labelledby={countName.labelledBy}
        aria-expanded={action.countExpanded}
        aria-controls={action.countExpanded === true ? action.countControls : undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          "rounded text-sm font-medium tabular-nums text-foreground motion-safe:transition-colors",
          "hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          touchTarget(size, true),
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
        onKeyDown={handleKeyDown}
        // Primary mode: the keys that reach the picker without a tap.
        aria-keyshortcuts={tapPrimary ? "ArrowUp Shift+F10" : undefined}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClickCapture={handleClickCapture}
        onClick={handleIconClick}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium motion-safe:transition-colors",
          "hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          // Pan + pinch stay available, so a swipe that starts here scrolls the page (EB5).
          "select-none touch-manipulation [-webkit-touch-callout:none]",
          state.viewerReaction !== null && "text-foreground",
          touchTarget(size),
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
        ref={contentRef}
        className="w-auto"
        align="start"
        dir={dir}
        aria-label={labels.reactionPickerLabel}
        onPointerEnter={handleContentPointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <ReactionPicker
          kinds={action.kinds}
          mergedCounts={state.reactionCounts ?? {}}
          viewerReaction={state.viewerReaction}
          onSelect={handlePick}
          labels={labels}
          format={format}
          dir={dir}
          size={size}
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
