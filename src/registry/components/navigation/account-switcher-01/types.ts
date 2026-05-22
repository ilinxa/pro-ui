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
   * consumers aren't forced into a single icon library (I-4).
   */
  icon?: ReactNode | ComponentType<{ className?: string }>;
  /**
   * Optional href. The switcher fires `onSelect(item)` regardless of href —
   * consumer wires routing inside `onSelect` (router.push for SPA, anchor for
   * SSR fallbacks, or both). Library does not render `<a>` tags itself.
   */
  href?: string;
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
 * Defaults to `"right"` (collision-aware auto-flip applied by Radix Popover).
 * Override to `"left"` for right-edge sidebars, etc. (PQ1).
 */
export type CollapsedPopoverSide = "right" | "left" | "top" | "bottom";

export interface AccountSwitcher01Props {
  /** Ordered list. Consumer controls ordering (L2). */
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
  /** Rendered below items, separated by divider when present (L5, Q7). */
  footerSlot?: ReactNode;
  /** When true, trigger collapses to icon-only mode (L10). */
  isCollapsed?: boolean;
  /** Side the popover opens to when `isCollapsed` is true. Default `"right"` (PQ1). */
  collapsedPopoverSide?: CollapsedPopoverSide;
  /** Trigger ARIA label. Default `"Switch account context"` (L12). */
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
