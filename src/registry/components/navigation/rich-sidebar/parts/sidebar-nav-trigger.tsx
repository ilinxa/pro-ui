"use client";

import { cloneElement, isValidElement } from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRichSidebarContextOrNull } from "../contexts/sidebar-nav-context";
import type { RichSidebarHandle, RichSidebarTriggerProps } from "../types";

type SlotCloneProps = React.HTMLAttributes<HTMLElement> & {
  type?: "button";
  children?: React.ReactNode;
};

/**
 * Minimal local slot (v0.3.1 — replaces the former `radix-ui` Slot import,
 * which was undeclared in meta/registry.json AND forbidden by the validator;
 * it broke module resolution on Base-UI consumers). Clones the single child
 * element and merges the trigger props onto it: `className` joined, `style`
 * merged (child wins), event handlers composed (child first, then trigger),
 * any other overlapping prop child-wins. The child's own `ref` is preserved
 * by `cloneElement` — no ref is ever passed in `triggerProps`.
 */
function SlotClone({ children, ...slotProps }: SlotCloneProps) {
  if (!isValidElement(children)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[rich-sidebar] <RichSidebarTrigger asChild> expects a single React element child — got none. Rendering nothing.",
      );
    }
    return null;
  }
  const childProps = children.props as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...slotProps };
  for (const key of Object.keys(slotProps)) {
    const slotValue = (slotProps as Record<string, unknown>)[key];
    const childValue = childProps[key];
    if (childValue === undefined) continue;
    if (/^on[A-Z]/.test(key) && typeof slotValue === "function" && typeof childValue === "function") {
      merged[key] = (...args: unknown[]) => {
        (childValue as (...a: unknown[]) => void)(...args);
        (slotValue as (...a: unknown[]) => void)(...args);
      };
    } else if (key === "className") {
      merged[key] = cn(slotValue as string | undefined, childValue as string | undefined);
    } else if (key === "style") {
      merged[key] = {
        ...(slotValue as React.CSSProperties),
        ...(childValue as React.CSSProperties),
      };
    } else {
      merged[key] = childValue;
    }
  }
  return cloneElement(children, merged);
}

/**
 * Companion trigger — mount in your app header to open the mobile drawer.
 *
 * Resolution order (L17 + L40):
 *   1. Explicit `controls` ref/handle (escape hatch) — wins
 *   2. Nearest RichSidebarContext (works when trigger is a DESCENDANT
 *      of <RichSidebar>; siblings can't read it because the context
 *      provider sits inside the sidebar's own render tree)
 *   3. Neither → dev-only console.warn + no-op
 *
 * Resolution happens at CLICK TIME, not render time, because the ref's
 * `.current` populates after the sidebar's `useImperativeHandle` runs
 * (post-mount). Resolving at render time would see `null` on first paint.
 *
 * Visual: hamburger icon (PanelLeft) — opens the drawer. Closing is
 * handled by the drawer's own SheetContent close-X (shipped by shadcn's
 * Sheet primitive) + Esc + outside-click. The trigger button itself
 * does NOT flip its icon based on drawer state — keeps the component
 * stateless and avoids the cross-tree re-render problem for v0.1.
 * A future RichSidebarProvider wrapper will enable trigger state
 * reflection across React subtrees if needed.
 *
 * Override the icon entirely via `children` (custom node) or `asChild`
 * (compose onto consumer's own element via the local SlotClone above).
 */
export function RichSidebarTrigger({
  controls,
  className,
  children,
  "aria-label": ariaLabel,
  asChild = false,
}: RichSidebarTriggerProps) {
  const ctx = useRichSidebarContextOrNull();

  const handleClick = () => {
    // Resolve handle at click time (not render time) — ref.current may
    // still be null on first render before useImperativeHandle runs.
    let resolved: RichSidebarHandle | null = null;
    if (controls) {
      if (typeof controls === "object" && controls !== null && "current" in controls) {
        resolved = (controls as React.RefObject<RichSidebarHandle | null>).current;
      } else {
        resolved = controls as RichSidebarHandle;
      }
    }
    if (!resolved && ctx) {
      resolved = ctx.handle;
    }
    if (resolved) {
      // v0.3.0 (C2, L54 + Q25): companion trigger always identifies as
      // "trigger" so consumers wiring onMobileOpenChange to analytics can
      // distinguish hamburger taps from other close paths.
      resolved.toggleMobile("trigger");
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[rich-sidebar] <RichSidebarTrigger> clicked with no <RichSidebar> in context and no `controls` prop — no-op.",
      );
    }
  };

  const sidebarId = ctx?.sidebarId;

  const triggerProps = {
    type: "button" as const,
    onClick: handleClick,
    "aria-controls": sidebarId,
    "aria-haspopup": "dialog" as const,
    "aria-label": ariaLabel ?? "Open navigation",
    className: cn(
      !asChild &&
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className,
    ),
  };

  if (asChild) {
    return <SlotClone {...triggerProps}>{children}</SlotClone>;
  }

  return (
    <button {...triggerProps}>
      {children ?? <PanelLeft className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
