"use client";

import { useCallback, useEffect, useId, useMemo, useRef, type KeyboardEvent } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useControllableState } from "./hooks/use-controllable-state";
import { useDirection, type Direction } from "./hooks/use-direction";
import { enforceUniqueKeys } from "./lib/enforce-unique-keys";
import { orderItems } from "./lib/order-items";
import { resolveActiveItem } from "./lib/resolve-active-item";
import { EmptyPlaceholder } from "./parts/empty-placeholder";
import { SwitcherList } from "./parts/switcher-list";
import { SwitcherTriggerContent, switcherTriggerClassName } from "./parts/switcher-trigger";
import {
  defaultAccountSwitcherLabels,
  type AccountSwitcherLabels,
  type AccountSwitcherProps,
  type CollapsedPopoverSide,
  type SwitcherItem,
} from "./types";

/**
 * Labels over defaults (C2). The deprecated `aria-label` sits between them: it names
 * the list and builds the legacy trigger name unless `labels` sets those. An
 * `undefined` value never erases a default.
 */
function resolveLabels(
  labels: AccountSwitcherLabels | undefined,
  ariaLabel: string | undefined,
): Required<AccountSwitcherLabels> {
  const resolved = { ...defaultAccountSwitcherLabels };
  if (ariaLabel !== undefined) {
    resolved.list = ariaLabel;
    resolved.trigger = (current) => (current === null ? ariaLabel : `${ariaLabel}, current: ${current}`);
  }
  if (labels?.trigger !== undefined) resolved.trigger = labels.trigger;
  if (labels?.list !== undefined) resolved.list = labels.list;
  if (labels?.empty !== undefined) resolved.empty = labels.empty;
  return resolved;
}

/** `start` / `end` → the physical side for the resolved direction. */
function physicalSide(side: CollapsedPopoverSide, dir: Direction): "top" | "right" | "bottom" | "left" {
  if (side === "start") return dir === "rtl" ? "right" : "left";
  if (side === "end") return dir === "rtl" ? "left" : "right";
  return side;
}

/**
 * Account Switcher — popover-with-switchable-items primitive.
 *
 * See [`docs/procomps/account-switcher-procomp/`](../../../../../docs/procomps/account-switcher-procomp/)
 * for description + plan + guide. Locks L1–L14 (L1 + L7 revised in v0.3.0 — see the
 * loop doc), all PQs at default per 2026-05-23 GATE 2 close.
 */
export function AccountSwitcher(props: AccountSwitcherProps) {
  const {
    items,
    activeKey,
    onSelect,
    fallbackActiveItem,
    footerSlot,
    isCollapsed = false,
    collapsedPopoverSide = "end",
    dir: dirProp,
    groups,
    itemSize = "default",
    renderItem,
    labels: labelsProp,
    "aria-label": ariaLabel,
    ariaCurrent = "true",
    open: openProp,
    defaultOpen,
    onOpenChange,
    className,
  } = props;

  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dir = useDirection(triggerRef, dirProp);
  const labels = useMemo(() => resolveLabels(labelsProp, ariaLabel), [labelsProp, ariaLabel]);

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
    componentName: "account-switcher",
    valuePropName: "open",
  });

  // L3 + Q2 — dev-warn + strip duplicates once per items reference change.
  const dedupedItems = useMemo(() => enforceUniqueKeys(items), [items]);
  const ordered = useMemo(() => orderItems(dedupedItems, groups), [dedupedItems, groups]);

  // Dev-warn grouping mistakes once per change of the message — an inline `groups` literal
  // re-runs the memo every render, but the effect only re-runs when the text differs.
  const problemText = ordered.problems.join(" ");
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !problemText) return;
    console.warn(`[account-switcher] ${problemText}`);
  }, [problemText]);

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

  // AW1 — ↓ / ↑ on the closed trigger open the list (the popover primitive has no key handling).
  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (open || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
      // Plain or Alt+arrow only (APG) — leave Ctrl / Meta / Shift combos to the app.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return;
      event.preventDefault();
      setOpen(true);
    },
    [open, setOpen],
  );

  // Empty-state branch (Q1)
  if (activeResolution.kind === "empty") {
    return (
      <EmptyPlaceholder
        // Same direction context as the trigger: `useDirection` resolves once after mount, so a
        // switcher that mounts empty (items still loading) must still read its direction.
        ref={triggerRef}
        ariaLabel={labels.trigger(null)}
        emptyText={labels.empty}
        isCollapsed={isCollapsed}
        className={className}
      />
    );
  }

  const popoverSide = isCollapsed ? physicalSide(collapsedPopoverSide, dir) : "bottom";

  return (
    <Popover open={open} onOpenChange={handlePrimitiveOpenChange}>
      {/* v0.1.1 (F-cross-13 path-b): no `asChild` — Base UI's PopoverTrigger
          rejects it. The trigger IS the button: both backends render a native
          <button> and pass native DOM props straight through. v0.3.0: a listbox
          button (was role="combobox" — focus moves into the list, so the footer
          stays reachable with Tab). */}
      <PopoverTrigger
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={labels.trigger(activeResolution.item.label)}
        onKeyDown={handleTriggerKeyDown}
        className={switcherTriggerClassName({ isCollapsed, className })}
      >
        <SwitcherTriggerContent activeItem={activeItem} isCollapsed={isCollapsed} />
      </PopoverTrigger>
      <PopoverContent
        side={popoverSide}
        align="start"
        sideOffset={4}
        // The content is portaled to <body>: carry the direction so an RTL section
        // of an LTR page still gets an RTL list.
        dir={dir}
        // Radix renders the content as role="dialog"; a dialog needs a name.
        aria-label={labels.list}
        // No collisionPadding — Radix-only prop; Base UI's PopoverContent
        // rejects it (F-cross-13). Both backends still collision-flip.
        className={cn(
          "gap-0 p-1",
          // Expanded: width = trigger width exactly, class only (no inline style — it would beat
          // the class and leave Base UI content-sized; no min-width — it made the list wider than
          // a narrow sidebar trigger). Radix exposes --radix-popover-trigger-width, Base UI
          // --anchor-width (F-cross-13). Collapsed: content-sized with a 14rem floor.
          isCollapsed ? "w-auto min-w-56" : "w-(--radix-popover-trigger-width,var(--anchor-width))",
        )}
      >
        <SwitcherList
          id={listboxId}
          label={labels.list}
          sections={ordered.sections}
          flat={ordered.flat}
          activeKey={activeResolution.item.key}
          ariaCurrent={ariaCurrent}
          itemSize={itemSize}
          renderItem={renderItem}
          onSelect={handleItemClick}
        />
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
