"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface TooltipWrapperProps {
  content: ReactNode;
  children: ReactNode;
  side?: "right" | "top" | "bottom" | "left";
  disabled?: boolean;
  /** Hover show-delay in ms (keyboard focus shows immediately). Default 300. */
  delay?: number;
}

/** Gap between the wrapped element and the bubble (old Radix sideOffset parity). */
const SIDE_OFFSET_PX = 8;

type TooltipSide = NonNullable<TooltipWrapperProps["side"]>;

interface TooltipPosition {
  top: number;
  left: number;
}

function computePosition(rect: DOMRect, side: TooltipSide): TooltipPosition {
  switch (side) {
    case "left":
      return { top: rect.top + rect.height / 2, left: rect.left - SIDE_OFFSET_PX };
    case "top":
      return { top: rect.top - SIDE_OFFSET_PX, left: rect.left + rect.width / 2 };
    case "bottom":
      return { top: rect.bottom + SIDE_OFFSET_PX, left: rect.left + rect.width / 2 };
    case "right":
      return { top: rect.top + rect.height / 2, left: rect.right + SIDE_OFFSET_PX };
  }
}

const SIDE_TRANSFORM: Record<TooltipSide, string> = {
  right: "translateY(-50%)",
  left: "translate(-100%, -50%)",
  top: "translate(-50%, -100%)",
  bottom: "translateX(-50%)",
};

/**
 * Tooltip wrapper for collapsed-sidebar row labels.
 *
 * v0.3.2 (F-cross-13 path-b): the shadcn Tooltip primitive is GONE from this
 * wrapper. `children` is an arbitrary interactive element (nav link,
 * primary-action button) and BOTH backends render `TooltipTrigger` as a
 * native `<button>` — composing required `asChild` (Base UI rejects it) and
 * wrapping without it nests interactive elements inside a button. So this is
 * now a tiny local tooltip: a `position: fixed` bubble (escapes the nav
 * list's overflow clipping the same way the old Radix portal did), shown
 * after `delay` ms on hover / immediately on keyboard (:focus-visible)
 * focus, hidden on leave / blur / press / Escape / any scroll.
 * `aria-describedby` is cloned onto the child element. `delay` is honored
 * cross-backend via setTimeout — no Radix-only `delayDuration` anywhere.
 * Trade-offs vs Radix: no arrow, no collision flipping, no cross-tooltip
 * skip-delay grouping.
 *
 * When `disabled` is true (e.g., expanded sidebar mode), children render
 * without any wrapper element at all.
 */
export function TooltipWrapper({
  content,
  children,
  side = "right",
  disabled,
  delay = 300,
}: TooltipWrapperProps) {
  const tooltipId = useId();
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    // Parity with the old asChild path: a pointer-events-none child (disabled
    // nav row) never received hover, so its tooltip never opened.
    const child = el.firstElementChild;
    if (
      child instanceof HTMLElement &&
      getComputedStyle(child).pointerEvents === "none"
    ) {
      return;
    }
    setPosition(computePosition(el.getBoundingClientRect(), side));
  }, [side]);

  const hide = useCallback(() => {
    clearShowTimer();
    setPosition(null);
  }, [clearShowTimer]);

  // Fixed-position coords go stale the moment anything scrolls (Radix
  // repositioned via floating middleware; we simply dismiss). Capture phase
  // so the nav list's own scroll container is caught too.
  useEffect(() => {
    if (position === null) return;
    const onScroll = () => setPosition(null);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [position]);

  // Unmount — drop any pending show timer.
  useEffect(() => clearShowTimer, [clearShowTimer]);

  // `disabled` flipping true while shown (e.g. the rail expands under a
  // resting pointer) skips render below but keeps state — the stale bubble
  // would resurrect at old coords on the next collapse. Render-phase
  // adjustment (react.dev "adjusting state when a prop changes"); a pending
  // show-timer self-guards via the nulled wrapperRef, so only committed
  // position needs the reset.
  const [prevDisabled, setPrevDisabled] = useState(disabled);
  if (disabled !== prevDisabled) {
    setPrevDisabled(disabled);
    if (disabled) setPosition(null);
  }

  if (disabled) return <>{children}</>;

  // Wire aria-describedby onto the wrapped element itself (the focusable
  // thing), composing with any describedby it already carries. Non-element
  // children (arbitrary renderItem output) render unwired — best-effort.
  let describedChildren = children;
  if (isValidElement(children)) {
    const element = children as ReactElement<{ "aria-describedby"?: string }>;
    const existing = element.props["aria-describedby"];
    describedChildren = cloneElement(element, {
      "aria-describedby": existing ? `${existing} ${tooltipId}` : tooltipId,
    });
  }

  return (
    <span
      ref={wrapperRef}
      data-slot="rich-sidebar-tooltip-wrapper"
      className="relative block"
      onMouseEnter={() => {
        clearShowTimer();
        if (delay <= 0) {
          show();
          return;
        }
        showTimerRef.current = window.setTimeout(show, delay);
      }}
      onMouseLeave={hide}
      onFocus={(event) => {
        // Radix parity: keyboard focus opens instantly; mouse-press focus doesn't.
        const target = event.target as HTMLElement;
        if (typeof target.matches === "function" && target.matches(":focus-visible")) {
          show();
        }
      }}
      onBlur={hide}
      onPointerDown={hide}
      onKeyDown={(event) => {
        if (event.key === "Escape") hide();
      }}
    >
      {describedChildren}
      <span
        role="tooltip"
        id={tooltipId}
        data-side={side}
        style={
          position
            ? { top: position.top, left: position.left, transform: SIDE_TRANSFORM[side] }
            : undefined
        }
        className={cn(
          "pointer-events-none fixed z-50 w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background",
          position ? "inline-flex" : "hidden",
        )}
      >
        {content}
      </span>
    </span>
  );
}
