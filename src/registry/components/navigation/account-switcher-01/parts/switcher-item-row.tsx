import type { AriaAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountSwitcherAriaCurrent, SwitcherItem } from "../types";
import { renderIcon } from "./render-icon";

interface SwitcherItemRowProps {
  item: SwitcherItem;
  isActive: boolean;
  ariaCurrent: AccountSwitcherAriaCurrent;
  onSelect: () => void;
}

/**
 * Single row inside the popover listbox. Renders icon (if present) + label
 * + Check trail (when active). Active rows are no-op on click (L6) —
 * actual handler in the main component already routes around them.
 *
 * `aria-current` resolution per L14 + PQ3 (data-active for CSS hooks
 * regardless of aria value).
 */
export function SwitcherItemRow({
  item,
  isActive,
  ariaCurrent,
  onSelect,
}: SwitcherItemRowProps) {
  return (
    <li role="presentation" className="contents">
      <button
        type="button"
        role="option"
        aria-selected={isActive || undefined}
        aria-current={resolveAriaCurrent(isActive, ariaCurrent)}
        data-active={isActive || undefined}
        onClick={onSelect}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none",
          isActive && "bg-accent/60 text-accent-foreground",
        )}
      >
        {item.icon ? (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground group-hover:text-foreground">
            {renderIcon(item.icon, "h-4 w-4") as ReactNode}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {isActive ? (
          <Check className="ml-auto h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
        ) : null}
      </button>
    </li>
  );
}

function resolveAriaCurrent(
  isActive: boolean,
  override: AccountSwitcherAriaCurrent,
): AriaAttributes["aria-current"] | undefined {
  if (!isActive) return undefined;
  if (override === false) return undefined;
  return override;
}
