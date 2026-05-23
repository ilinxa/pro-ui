"use client";

import { PanelLeft } from "lucide-react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";
import { useRichSidebarContextOrNull } from "../contexts/sidebar-nav-context";
import type { RichSidebarHandle, RichSidebarTriggerProps } from "../types";

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
 * (compose onto consumer's own element via Radix Slot).
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
      // eslint-disable-next-line no-console
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
    return <Slot.Root {...triggerProps}>{children}</Slot.Root>;
  }

  return (
    <button {...triggerProps}>
      {children ?? <PanelLeft className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
