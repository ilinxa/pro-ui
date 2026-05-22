"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";
import { useSidebarNav01ContextOrNull } from "../contexts/sidebar-nav-context";
import type { SidebarNav01Handle, SidebarNav01TriggerProps } from "../types";

/**
 * Companion trigger — mount in your app header to toggle the mobile drawer.
 *
 * Resolution order (L17 + L40):
 *   1. Explicit `controls` ref/handle (escape hatch) — wins
 *   2. Nearest SidebarNav01Context (default — auto-connects when trigger is
 *      anywhere in the same React tree as <SidebarNav01>)
 *   3. Neither → renders disabled + dev-only console.warn
 *
 * Default icon swap: PanelLeftClose (open) ↔ PanelLeft (closed) per Q2 lock.
 * Consumer can override via `children` (custom icon/text) or `asChild`
 * (compose onto consumer's own element via Radix Slot).
 *
 * NOTE: This component does NOT auto-hide on desktop (PQ12 closure).
 * Consumer wraps with `lg:hidden` (or matching mobileBreakpoint) where
 * they mount it.
 */
export function SidebarNav01Trigger({
  controls,
  className,
  children,
  "aria-label": ariaLabel,
  asChild = false,
}: SidebarNav01TriggerProps) {
  const ctx = useSidebarNav01ContextOrNull();

  // Resolve the handle — explicit `controls` wins; else context
  let resolvedHandle: SidebarNav01Handle | null = null;
  if (controls) {
    if (
      typeof controls === "object" &&
      controls !== null &&
      "current" in controls
    ) {
      resolvedHandle = (controls as React.RefObject<SidebarNav01Handle | null>)
        .current;
    } else {
      resolvedHandle = controls as SidebarNav01Handle;
    }
  }
  if (!resolvedHandle && ctx) {
    resolvedHandle = ctx.handle;
  }

  const mobileOpen = resolvedHandle?.isMobileOpen() ?? false;
  const sidebarId = ctx?.sidebarId;

  // R6 + L17: if neither wired, render disabled + dev warn
  if (!resolvedHandle) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[sidebar-nav-01] <SidebarNav01Trigger> rendered with no <SidebarNav01> in context and no `controls` prop — renders disabled.",
      );
    }
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md opacity-50",
          className,
        )}
      >
        <PanelLeft className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  const handleClick = () => resolvedHandle.toggleMobile();

  const triggerProps = {
    type: "button" as const,
    onClick: handleClick,
    "aria-controls": sidebarId,
    "aria-expanded": mobileOpen,
    "aria-haspopup": "dialog" as const,
    "aria-label":
      ariaLabel ?? (mobileOpen ? "Close navigation" : "Open navigation"),
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
      {children ?? (
        mobileOpen ? (
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        ) : (
          <PanelLeft className="h-4 w-4" aria-hidden="true" />
        )
      )}
    </button>
  );
}
