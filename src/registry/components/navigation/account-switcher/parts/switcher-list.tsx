"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { SwitcherSection } from "../lib/order-items";
import type { AccountSwitcherProps, SwitcherItem } from "../types";
import { SwitcherItemRow } from "./switcher-item-row";

interface SwitcherListProps {
  id: string;
  label: string;
  sections: SwitcherSection[];
  /** Rendered order — what the arrow keys walk. */
  flat: SwitcherItem[];
  activeKey: string | null;
  ariaCurrent: NonNullable<AccountSwitcherProps["ariaCurrent"]>;
  itemSize: AccountSwitcherProps["itemSize"];
  renderItem: AccountSwitcherProps["renderItem"];
  onSelect: (item: SwitcherItem) => void;
}

const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);

/**
 * The listbox (APG listbox, roving focus): one Tab stop for the whole list — only
 * the current option is tabbable — ↓ / ↑ move (no wrap), Home / End jump, Enter /
 * Space select (native button). Escape is the popover's (closes, focus back on the
 * trigger). Groups render as `role="group"` labelled by their heading.
 *
 * Mounted only while the popover is open, so every open starts on the active item
 * (else the first).
 */
export function SwitcherList({
  id,
  label,
  sections,
  flat,
  activeKey,
  ariaCurrent,
  itemSize,
  renderItem,
  onSelect,
}: SwitcherListProps) {
  const headingIdBase = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());
  const [focusKey, setFocusKey] = useState<string | null>(null);

  // The tab stop: the last focused option while it still exists, else the active item, else the first.
  const has = (key: string | null) => key !== null && flat.some((i) => i.key === key);
  const currentKey = has(focusKey) ? focusKey : has(activeKey) ? activeKey : (flat[0]?.key ?? null);

  // Land focus on the tab stop when the list opens. Radix's auto-focus already picks it (the
  // only tabbable option); Base UI may focus the popup itself, so re-check after its own
  // initial-focus pass. Focus moves only from nowhere (<body>) or from the popup root — never
  // away from something the user (or an autofocusing footer) already focused.
  useEffect(() => {
    const focusStop = () => {
      const list = listRef.current;
      const stop = list?.querySelector<HTMLElement>('[role="option"][tabindex="0"]');
      if (!list || !stop) return;
      const active = document.activeElement;
      const popup = list.closest('[data-slot="popover-content"]') ?? list.parentElement;
      if (active && active !== document.body && active !== popup) return;
      stop.focus();
    };
    focusStop();
    const frame = requestAnimationFrame(focusStop);
    return () => cancelAnimationFrame(frame);
  }, []);

  // A live update removed the focused option: the browser drops focus to <body> and the arrow
  // keys stop working. Put focus back on the new tab stop.
  const focusedRemoved = focusKey !== null && !has(focusKey);
  useEffect(() => {
    if (!focusedRemoved || currentKey === null) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    optionRefs.current.get(currentKey)?.focus();
  }, [focusedRemoved, currentKey]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!NAV_KEYS.has(event.key)) return;
    const target = event.target as HTMLElement;
    if (target.getAttribute("role") !== "option") return;
    const index = flat.findIndex((i) => i.key === target.dataset.key);
    if (index === -1) return;
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? flat.length - 1
          : event.key === "ArrowDown"
            ? Math.min(index + 1, flat.length - 1)
            : Math.max(index - 1, 0);
    event.preventDefault();
    const next = flat[nextIndex];
    if (!next) return;
    setFocusKey(next.key);
    optionRefs.current.get(next.key)?.focus();
  };

  const renderRow = (item: SwitcherItem) => (
    <SwitcherItemRow
      key={item.key}
      ref={(el) => {
        if (el) optionRefs.current.set(item.key, el);
        else optionRefs.current.delete(item.key);
      }}
      item={item}
      isActive={item.key === activeKey}
      ariaCurrent={ariaCurrent}
      tabbable={item.key === currentKey}
      onFocus={() => setFocusKey(item.key)}
      itemSize={itemSize}
      renderItem={renderItem}
      onSelect={() => onSelect(item)}
    />
  );

  return (
    <div
      ref={listRef}
      id={id}
      role="listbox"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-0.5"
    >
      {sections.map((section, index) => {
        if (section.id === null) return section.items.map(renderRow);
        // Position, not the group id: an id with a space would split `aria-labelledby`.
        const headingId = `${headingIdBase}-g${index}`;
        return (
          <div key={section.id} role="group" aria-labelledby={headingId} className="flex flex-col gap-0.5">
            <div
              id={headingId}
              role="presentation"
              className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground"
            >
              {section.label}
            </div>
            {section.items.map(renderRow)}
          </div>
        );
      })}
    </div>
  );
}
