import { forwardRef, type ReactNode } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SwitcherItem } from "../types";
import { renderIcon } from "./render-icon";

interface SwitcherTriggerProps {
  /** Resolved active item (may be a fallback / first / etc.). */
  activeItem: SwitcherItem | null;
  /** Trigger ARIA label. Composed with active label per PQ4. */
  ariaLabel: string;
  /** ID of the listbox the trigger controls; set only while it is open (it isn't in the DOM before). */
  ariaControls?: string;
  /** When true, render icon-only 40x40 square; no label, no chevron (L10). */
  isCollapsed: boolean;
  /** Whether the popover is currently open (drives aria-expanded). */
  open: boolean;
  /** Whether the trigger is disabled (e.g., empty-items state). */
  disabled?: boolean;
  /** Pass-through className from props. */
  className?: string;
  /** Click handler (Popover.Trigger native). */
  onClick?: () => void;
}

/**
 * PQ4 — the legacy composed name ("Switch account context, current: Acme Corp").
 * Since v0.3.0 the assembly names the trigger with `labels.trigger(current)`; this
 * stays for the deprecated `aria-label` prop and for direct importers.
 */
export function composeSwitcherTriggerAriaLabel(
  ariaLabel: string,
  activeItem: SwitcherItem | null,
): string {
  return activeItem ? `${ariaLabel}, current: ${activeItem.label}` : ariaLabel;
}

/**
 * First user-perceived character of a label for the collapsed trigger — a whole
 * emoji or accented letter, never half a surrogate pair.
 */
export function firstGrapheme(label: string | undefined): string | undefined {
  if (!label) return undefined;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    // Grapheme boundaries are locale-independent (UAX #29 default rules) → the root locale, explicitly.
    const first = new Intl.Segmenter("und", { granularity: "grapheme" }).segment(label)[Symbol.iterator]().next();
    if (!first.done) return first.value.segment;
  }
  return Array.from(label)[0];
}

/**
 * Trigger button classes — two branches per `isCollapsed`:
 *   - expanded: full-width with icon + label + chevron, width drives popover
 *     width via --radix-popover-trigger-width
 *   - collapsed: 40x40 icon-only square; popover opens to the side
 *
 * v0.1.1 (F-cross-13 path-b): exported as a class builder because the
 * assembly no longer mounts a <button> via `<PopoverTrigger asChild>` —
 * Base UI's PopoverTrigger has no `asChild` (and the CLI's render-rewrite
 * breaks mixed consumers). The primitive trigger IS the button now:
 * account-switcher.tsx renders
 * `<PopoverTrigger className={switcherTriggerClassName(…)}>` with
 * `<SwitcherTriggerContent>` inside, passing only native DOM props across
 * the shadcn-primitive boundary.
 */
export function switcherTriggerClassName({
  isCollapsed,
  className,
}: {
  isCollapsed: boolean;
  className?: string;
}): string {
  if (isCollapsed) {
    return cn(
      "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors",
      "hover:bg-accent hover:text-accent-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    );
  }
  return cn(
    "inline-flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    className,
  );
}

/**
 * Inner trigger content (icon / initial / label / chevron), backend-neutral —
 * rendered inside whichever button element hosts the trigger.
 */
export function SwitcherTriggerContent({
  activeItem,
  isCollapsed,
}: {
  activeItem: SwitcherItem | null;
  isCollapsed: boolean;
}) {
  if (isCollapsed) {
    return activeItem?.icon ? (
      <>{renderIcon(activeItem.icon, "h-4 w-4") as ReactNode}</>
    ) : (
      <span className="text-xs font-medium uppercase">
        {firstGrapheme(activeItem?.label) ?? "?"}
      </span>
    );
  }
  return (
    <>
      {activeItem?.icon ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
          {renderIcon(activeItem.icon, "h-4 w-4") as ReactNode}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-start">
        {activeItem?.label ?? "—"}
      </span>
      <ChevronsUpDown
        className="ms-auto h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </>
  );
}

/**
 * Standalone trigger button — kept for API stability (the part file ships;
 * direct importers keep working). Since v0.3.0 it is a plain button with
 * `aria-haspopup="listbox"` (was `role="combobox"`), matching the assembly.
 * Since v0.1.1 the assembly no longer routes it through
 * `<PopoverTrigger asChild>` (F-cross-13) — see switcherTriggerClassName
 * above for the primitive-trigger path.
 */
export const SwitcherTrigger = forwardRef<HTMLButtonElement, SwitcherTriggerProps>(
  function SwitcherTrigger(
    { activeItem, ariaLabel, ariaControls, isCollapsed, open, disabled, className, onClick, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? ariaControls : undefined}
        aria-label={composeSwitcherTriggerAriaLabel(ariaLabel, activeItem)}
        disabled={disabled}
        onClick={onClick}
        className={switcherTriggerClassName({ isCollapsed, className })}
        {...rest}
      >
        <SwitcherTriggerContent activeItem={activeItem} isCollapsed={isCollapsed} />
      </button>
    );
  },
);
