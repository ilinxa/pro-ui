import type { ComponentType, ReactNode } from "react";

/**
 * Single item in the switcher list.
 *
 * Dual-entry items for the same conceptual account (e.g., business-mode +
 * cms-sub-mode of the same business) use distinct keys like `biz-acme` +
 * `cms-biz-acme`. Library enforces key uniqueness at render (L3 / Q2).
 */
export interface SwitcherItem {
  /** Stable unique key. Used for active resolution + React reconciliation. */
  key: string;
  /** Trigger + row label. Library does NOT i18n; consumer pre-translates. */
  label: string;
  /**
   * Optional icon. Library accepts both ReactNode (already-rendered JSX) and
   * ComponentType (lucide-react icons, custom icon components, etc.) so
   * consumers aren't forced into a single icon library (I-4). An avatar is a
   * ReactNode here — pair it with `itemSize="lg"`.
   */
  icon?: ReactNode | ComponentType<{ className?: string }>;
  /**
   * Optional href. The switcher fires `onSelect(item)` regardless of href —
   * consumer wires routing inside `onSelect` (router.push for SPA, anchor for
   * SSR fallbacks, or both). Library does not render `<a>` tags itself.
   */
  href?: string;
  /**
   * Id of the group this item renders under (see `AccountSwitcherProps.groups`).
   * Items without a group render first. An id missing from `groups` dev-warns and
   * renders the item ungrouped.
   */
  group?: string;
  /** Optional second line under the label (e.g. a role or a handle). Rows only — not the trigger. */
  description?: ReactNode;
}

/** A heading in the list. Order of `groups` = order of the groups on screen and for the keyboard. */
export interface SwitcherGroup {
  id: string;
  /** Heading text; it also names the group (`role="group"` + `aria-labelledby`). */
  label: ReactNode;
}

/**
 * Every user-facing string (consumer contract C2). Pass any subset — a missing or
 * `undefined` key keeps the default.
 */
export interface AccountSwitcherLabels {
  /**
   * The trigger's accessible name; `current` is the active item's label, or `null` when
   * nothing resolves (the disabled empty placeholder). Default:
   * `"Switch account context, current: <label>"` / `"Switch account context"`.
   */
  trigger?: (current: string | null) => string;
  /** The list's accessible name. Default: `"Switch account context"`. */
  list?: string;
  /** Text of the disabled placeholder shown when there are no items. Default: `"No items available"`. */
  empty?: string;
}

export const defaultAccountSwitcherLabels: Required<AccountSwitcherLabels> = {
  trigger: (current) =>
    current === null ? "Switch account context" : `Switch account context, current: ${current}`,
  list: "Switch account context",
  empty: "No items available",
};

/** State passed to `renderItem`. */
export interface SwitcherItemRenderState {
  /** The item is the active one (it carries `aria-selected="true"`). */
  active: boolean;
}

/**
 * Value applied to the active item's `aria-current` attribute. Default
 * `"true"` (generic active-state semantic, correct for a switcher per L14).
 * Consumers using the switcher as primary navigation pick `"page"`;
 * stepper-style usages pick `"step"`. Pass `false` to omit the attribute.
 */
export type AccountSwitcherAriaCurrent =
  | "true"
  | "page"
  | "step"
  | "location"
  | "date"
  | "time"
  | false;

/**
 * Side of the trigger the popover opens to when `isCollapsed` is true.
 * `"start"` / `"end"` follow the direction (`"end"` = right in LTR, left in RTL);
 * the physical values stay as they are. Default `"end"`.
 *
 * The popover still flips to the opposite side when it would not fit — the
 * primitive's collision handling always applies and is not configurable here.
 * For strict positioning, constrain the trigger's container instead.
 */
export type CollapsedPopoverSide = "start" | "end" | "right" | "left" | "top" | "bottom";

export interface AccountSwitcherProps {
  /** Ordered list. Consumer controls ordering (L2); `groups` then buckets it. */
  items: ReadonlyArray<SwitcherItem>;
  /**
   * Currently-active item's key. When null OR not found in items, falls
   * back to `fallbackActiveItem` (if provided) then to `items[0]`. Empty
   * items + no fallback → disabled placeholder button (L4, Q1).
   */
  activeKey: string | null;
  /** Fires on item click. Active-item clicks are no-ops at library level (L6). */
  onSelect: (item: SwitcherItem) => void;

  /** Shown in trigger when `activeKey` doesn't resolve (L4, I-1). */
  fallbackActiveItem?: SwitcherItem;
  /** Rendered below items, separated by divider when present (L5, Q7). Reachable with Tab from the list. */
  footerSlot?: ReactNode;
  /** When true, trigger collapses to icon-only mode (L10). */
  isCollapsed?: boolean;
  /** Side the popover opens to when `isCollapsed` is true. Default `"end"` (inline end). */
  collapsedPopoverSide?: CollapsedPopoverSide;
  /**
   * Text direction for the side and the popover content. Default: the trigger's
   * resolved direction (nearest `dir`, read after mount).
   */
  dir?: "ltr" | "rtl";
  /** Group headings + order. Items reference them through `item.group`. */
  groups?: ReadonlyArray<SwitcherGroup>;
  /** Row size. `"lg"` = 32 px icon / avatar box for a two-line row. Default `"default"`. */
  itemSize?: "default" | "lg";
  /**
   * Replaces a row's content (icon, label, description, check). The option element,
   * its roles, keyboard and selection stay the library's — don't render interactive
   * elements inside.
   */
  renderItem?: (item: SwitcherItem, state: SwitcherItemRenderState) => ReactNode;
  /** User-facing strings (C2). */
  labels?: AccountSwitcherLabels;
  /**
   * @deprecated Use `labels.list` and `labels.trigger`. Still honoured when those
   * aren't given: it names the list, and the trigger reads `"<aria-label>, current: <label>"`.
   */
  "aria-label"?: string;
  /** Value applied to active item's `aria-current`. Default `"true"` (L14). */
  ariaCurrent?: AccountSwitcherAriaCurrent;

  /**
   * Controlled-open state (L13). When provided, makes the popover controlled.
   * Pair with `onOpenChange` to receive state-change events. Switching between
   * controlled and uncontrolled (e.g., `open={undefined}` → `open={false}`)
   * fires a dev-mode warning — pick one mode at mount time.
   */
  open?: boolean;
  /** Initial open state for uncontrolled mode (L13). Default `false`. */
  defaultOpen?: boolean;
  /**
   * Fires when popover open state changes (L13). F-cross-13 typeof-guarded
   * internally — receives only `boolean`, never `unknown`.
   */
  onOpenChange?: (next: boolean) => void;

  /** Pass-through to trigger element (L1 surface contract). */
  className?: string;
}
