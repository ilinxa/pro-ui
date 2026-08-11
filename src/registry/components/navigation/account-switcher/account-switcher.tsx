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
import {
  SwitcherTriggerContent,
  composeSwitcherTriggerAriaLabel,
  switcherTriggerClassName,
} from "./parts/switcher-trigger";
import type { AccountSwitcherProps, SwitcherItem } from "./types";

const DEFAULT_ARIA_LABEL = "Switch account context";

/**
 * Account Switcher — popover-with-switchable-items primitive.
 *
 * See [`docs/procomps/account-switcher-procomp/`](../../../../../docs/procomps/account-switcher-procomp/)
 * for description + plan + guide. Locks L1–L14, all PQs at default per
 * 2026-05-23 GATE 2 close.
 */
export function AccountSwitcher(props: AccountSwitcherProps) {
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
    componentName: "account-switcher",
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
      {/* v0.1.1 (F-cross-13 path-b): no `asChild` — Base UI's PopoverTrigger
          rejects it. The trigger IS the combobox button: both backends render
          a native <button> and pass native DOM props straight through. */}
      <PopoverTrigger
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={composeSwitcherTriggerAriaLabel(ariaLabel, activeItem)}
        className={switcherTriggerClassName({ isCollapsed, className })}
      >
        <SwitcherTriggerContent activeItem={activeItem} isCollapsed={isCollapsed} />
      </PopoverTrigger>
      <PopoverContent
        side={popoverSide}
        align="start"
        sideOffset={4}
        // No collisionPadding — Radix-only prop; Base UI's PopoverContent
        // rejects it (F-cross-13). Both backends still collision-flip.
        style={popoverWidthStyle}
        className={cn(
          "w-auto min-w-56 gap-0 p-1",
          // override the primitive's baked-in w-72; Radix exposes
          // --radix-popover-trigger-width, Base UI --anchor-width (F-cross-13)
          !isCollapsed && "w-(--radix-popover-trigger-width,var(--anchor-width))",
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
