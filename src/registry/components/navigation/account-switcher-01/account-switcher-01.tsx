"use client";

import { useCallback, useId, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useControllableState } from "./hooks/use-controllable-state";
import { enforceUniqueKeys } from "./lib/enforce-unique-keys";
import { resolveActiveItem } from "./lib/resolve-active-item";
import { EmptyPlaceholder } from "./parts/empty-placeholder";
import { SwitcherItemRow } from "./parts/switcher-item-row";
import { SwitcherTrigger } from "./parts/switcher-trigger";
import type { AccountSwitcher01Props, SwitcherItem } from "./types";

const DEFAULT_ARIA_LABEL = "Switch account context";

/**
 * Account Switcher — popover-with-switchable-items primitive.
 *
 * See [`docs/procomps/account-switcher-01-procomp/`](../../../../../docs/procomps/account-switcher-01-procomp/)
 * for description + plan + guide. Locks L1–L14, all PQs at default per
 * 2026-05-23 GATE 2 close.
 */
export function AccountSwitcher01(props: AccountSwitcher01Props) {
  const {
    items,
    activeKey,
    onSelect,
    fallbackActiveItem,
    footerSlot,
    isCollapsed = false,
    collapsedPopoverSide = "right",
    "aria-label": ariaLabel = DEFAULT_ARIA_LABEL,
    ariaCurrent = "true",
    open: openProp,
    defaultOpen,
    onOpenChange,
    className,
  } = props;

  const listboxId = useId();

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
    componentName: "account-switcher-01",
    valuePropName: "open",
  });

  // L3 + Q2 — dev-warn + strip duplicates once per items reference change.
  const dedupedItems = useMemo(() => enforceUniqueKeys(items), [items]);

  const activeResolution = useMemo(
    () => resolveActiveItem(dedupedItems, activeKey, fallbackActiveItem),
    [dedupedItems, activeKey, fallbackActiveItem],
  );

  const activeItem = activeResolution.kind === "empty" ? null : activeResolution.item;

  // F-cross-13 guard at the shadcn-primitive boundary. The consumer's
  // `onOpenChange` is shielded — `useControllableState` always calls it with
  // the validated `boolean`. Plan §10.
  const handlePrimitiveOpenChange = useCallback(
    (next: unknown) => {
      if (typeof next !== "boolean") return;
      setOpen(next);
    },
    [setOpen],
  );

  // L6 — active-item clicks close the popover but do NOT fire onSelect.
  const handleItemClick = useCallback(
    (item: SwitcherItem) => {
      if (item.key === activeItem?.key) {
        setOpen(false);
        return;
      }
      onSelect(item);
      setOpen(false);
    },
    [activeItem?.key, onSelect, setOpen],
  );

  // Empty-state branch (Q1)
  if (activeResolution.kind === "empty") {
    return (
      <EmptyPlaceholder
        ariaLabel={ariaLabel}
        isCollapsed={isCollapsed}
        className={className}
      />
    );
  }

  const popoverSide = isCollapsed ? collapsedPopoverSide : "bottom";
  const popoverWidthStyle = isCollapsed
    ? undefined
    : ({ width: "var(--radix-popover-trigger-width)" } as React.CSSProperties);

  return (
    <Popover open={open} onOpenChange={handlePrimitiveOpenChange}>
      <PopoverTrigger asChild>
        <SwitcherTrigger
          activeItem={activeItem}
          ariaLabel={ariaLabel}
          ariaControls={listboxId}
          isCollapsed={isCollapsed}
          open={open}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent
        side={popoverSide}
        align="start"
        sideOffset={4}
        collisionPadding={8}
        style={popoverWidthStyle}
        className={cn(
          "w-auto min-w-56 gap-0 p-1",
          // override the primitive's baked-in w-72
          !isCollapsed && "w-(--radix-popover-trigger-width)",
        )}
      >
        <ul id={listboxId} role="listbox" aria-label={ariaLabel} className="flex flex-col gap-0.5">
          {dedupedItems.map((item) => (
            <SwitcherItemRow
              key={item.key}
              item={item}
              isActive={item.key === activeItem?.key}
              ariaCurrent={ariaCurrent}
              onSelect={() => handleItemClick(item)}
            />
          ))}
        </ul>
        {footerSlot ? (
          <>
            <Separator className="my-1" />
            <div className="px-1 pb-1">{footerSlot}</div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
