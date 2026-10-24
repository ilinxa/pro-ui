import type { AriaAttributes, ReactNode, Ref } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountSwitcherAriaCurrent, AccountSwitcherProps, SwitcherItem } from "../types";
import { renderIcon } from "./render-icon";

interface SwitcherItemRowProps {
  item: SwitcherItem;
  isActive: boolean;
  ariaCurrent: AccountSwitcherAriaCurrent;
  onSelect: () => void;
  /** Roving tab stop: only the list's current option is tabbable (APG listbox). */
  tabbable?: boolean;
  onFocus?: () => void;
  itemSize?: AccountSwitcherProps["itemSize"];
  renderItem?: AccountSwitcherProps["renderItem"];
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Single option inside the popover listbox. Renders icon (if present) + label
 * (+ description) + Check trail (when active), or the host's `renderItem`
 * content. Active rows are no-op on select (L6) — the handler in the main
 * component routes around them. A native `<button>` keeps Enter / Space
 * activation; arrow keys are the list's job (`switcher-list.tsx`).
 *
 * `aria-current` resolution per L14 + PQ3 (data-active for CSS hooks
 * regardless of aria value).
 */
export function SwitcherItemRow({
  item,
  isActive,
  ariaCurrent,
  onSelect,
  tabbable = true,
  onFocus,
  itemSize = "default",
  renderItem,
  ref,
}: SwitcherItemRowProps) {
  const lg = itemSize === "lg";
  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isActive}
      aria-current={resolveAriaCurrent(isActive, ariaCurrent)}
      data-active={isActive || undefined}
      data-key={item.key}
      tabIndex={tabbable ? 0 : -1}
      onClick={onSelect}
      onFocus={onFocus}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-sm transition-colors",
        lg && "gap-3 py-2",
        "hover:bg-accent hover:text-accent-foreground",
        // Keyboard focus gets an inset ring as well — hover and the active row share the accent
        // background, so the background alone can't say which row has focus.
        "focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        isActive && "bg-accent/60 text-accent-foreground",
      )}
    >
      {renderItem ? (
        renderItem(item, { active: isActive })
      ) : (
        <>
          {item.icon ? (
            <span
              className={cn(
                "flex shrink-0 items-center justify-center text-muted-foreground group-hover:text-foreground",
                lg
                  ? "size-8 overflow-hidden rounded-full [&>img]:size-full [&>img]:object-cover"
                  : "h-4 w-4",
              )}
            >
              {renderIcon(item.icon, lg ? "size-5" : "h-4 w-4") as ReactNode}
            </span>
          ) : null}
          {item.description ? (
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{item.label}</span>
              <span className="truncate text-xs text-muted-foreground">{item.description}</span>
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          )}
          {isActive ? (
            <Check className="ms-auto h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
          ) : null}
        </>
      )}
    </button>
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
