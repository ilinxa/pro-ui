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
  /** ID of the listbox the trigger controls (jsx-a11y combobox requirement). */
  ariaControls: string;
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
 * The trigger button. Two branches per `isCollapsed`:
 *   - expanded: full-width with icon + label + chevron, width drives popover
 *     width via --radix-popover-trigger-width
 *   - collapsed: 40x40 icon-only square; popover opens to the side
 *
 * PQ4: composed aria-label includes the active item label when one resolves
 * ("Switch account context, current: Acme Corp").
 */
export const SwitcherTrigger = forwardRef<HTMLButtonElement, SwitcherTriggerProps>(
  function SwitcherTrigger(
    { activeItem, ariaLabel, ariaControls, isCollapsed, open, disabled, className, onClick, ...rest },
    ref,
  ) {
    const composedAriaLabel = activeItem
      ? `${ariaLabel}, current: ${activeItem.label}`
      : ariaLabel;

    if (isCollapsed) {
      return (
        <button
          ref={ref}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={ariaControls}
          aria-label={composedAriaLabel}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...rest}
        >
          {activeItem?.icon ? (
            renderIcon(activeItem.icon, "h-4 w-4") as ReactNode
          ) : (
            <span className="text-xs font-medium uppercase">
              {activeItem?.label?.charAt(0) ?? "?"}
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={ariaControls}
        aria-label={composedAriaLabel}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "inline-flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...rest}
      >
        {activeItem?.icon ? (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
            {renderIcon(activeItem.icon, "h-4 w-4") as ReactNode}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-left">
          {activeItem?.label ?? "—"}
        </span>
        <ChevronsUpDown
          className="ml-auto h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </button>
    );
  },
);
