import type { ComponentType, CSSProperties, ReactNode, Ref } from "react";

// ─────────────────────────────────────────────────────────────────────────
// Items schema (L4 + L5 + L36 + L48)
// ─────────────────────────────────────────────────────────────────────────

export interface NavItem {
  kind?: "item";
  id: string;
  label: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  href?: string;
  onClick?: (event: React.MouseEvent) => void;
  badge?: number | string | NavBadgeConfig;
  match?: "exact" | "prefix";
  shortcut?: string;
  description?: string;
  accessory?: ReactNode;
  tooltipContent?: ReactNode;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  permission?: string;
  /**
   * v0.2.0 — When `true`, item is hidden in the filter pass unless the
   * sidebar's `isOwner` prop is also `true`. Default `false`. Works
   * alongside `permission` and `minMembers` — all three gates pass
   * independently (intersection per L46).
   */
  ownerOnly?: boolean;
  /**
   * v0.2.0 — When set, item is hidden unless sidebar's `currentMaxMembers`
   * prop is `>=` this value. Default unset (no min). Useful for plan-tier
   * gating (Members tab visible only when seat capacity ≥ N).
   */
  minMembers?: number;
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
  "data-testid"?: string;
}

export interface NavSection {
  kind: "section";
  id: string;
  title?: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  items: ReadonlyArray<NavItem>;
  permission?: string;
  hidden?: boolean;
}

export interface NavSeparator {
  kind: "separator";
  id?: string;
}

export type NavEntry = NavItem | NavSection | NavSeparator;
export type BasicNavItems = ReadonlyArray<NavItem>;
export type SidebarNavItems = ReadonlyArray<NavEntry>;

// ─────────────────────────────────────────────────────────────────────────
// NavContext discriminated union (v0.2.0 — L48 + I-6)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Discriminated union for app-shell context types — exported helper for
 * consumers building multi-tenant SaaS surfaces. Type-only export; library
 * does NOT ship a `useNavContext` hook because the URL→context derivation
 * is coupled to the consumer's router (Next.js, TanStack Router, plain
 * `location` — all different). Consumers type their derivation function
 * with `(): NavContext` and TypeScript narrows correctly across the
 * discriminant.
 *
 * Source of the 5-case shape: migration analysis §8.2 (the kasder
 * socialmedia-adv-nav-system app-shell). Consumers needing different
 * context shapes type their own; this is a documented helper, not
 * mandatory. R13 acknowledges the opinionated shape.
 */
export type NavContext =
  | { type: "personal" }
  | { type: "business"; slug: string; accountId: string; accountName: string }
  | { type: "platform"; accountId: string }
  | { type: "governance" }
  | { type: "cms"; mode: "platform" }
  | { type: "cms"; mode: "business"; slug: string; accountId: string; accountName: string };

// ─────────────────────────────────────────────────────────────────────────
// Link primitive (L10 + L15)
// ─────────────────────────────────────────────────────────────────────────

export interface NavLinkProps {
  href: string;
  className?: string;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string;
  "aria-disabled"?: boolean | "true" | "false" | undefined;
  "data-active"?: boolean;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  target?: string;
  rel?: string;
  tabIndex?: number;
  ref?: Ref<HTMLAnchorElement>;
  [key: `data-${string}`]: unknown;
}

export type NavLinkComponent = ComponentType<NavLinkProps>;

// ─────────────────────────────────────────────────────────────────────────
// Prefab part configs (L14, L15)
// ─────────────────────────────────────────────────────────────────────────

export type NavBadgeTone = "default" | "accent" | "destructive" | "muted" | "brand";

export interface NavBadgeConfig {
  /**
   * `null` = withheld (privacy / permission) — renders nothing, and the row's
   * accessible name is the plain label. A zero renders nothing unless `showZero`.
   */
  value: number | string | ReactNode | null;
  max?: number;
  variant?: "number" | "dot" | "pulse";
  /** Default `"destructive"`. `"brand"` reads `--brand` / `--brand-foreground`. */
  tone?: NavBadgeTone;
  /** Tone used instead of `tone` while the badge's row is the active item. */
  activeTone?: NavBadgeTone;
  position?: "inline-end" | "corner";
  showZero?: boolean;
  className?: string;
}

export interface NavBrandConfig {
  logo?: ReactNode | { src: string; alt?: string };
  label: string;
  href?: string;
  linkComponent?: NavLinkComponent;
}

export interface NavPrimaryActionConfig {
  icon: ReactNode | ComponentType<{ className?: string }>;
  label: string;
  onClick?: (event: React.MouseEvent) => void;
  href?: string;
  linkComponent?: NavLinkComponent;
  variant?: "default" | "outline" | "ghost" | "secondary";
  tone?: "default" | "accent" | "destructive";
}

/**
 * v0.3.0 — Event union for `NavUserMenuItem.onClick` callbacks. The underlying
 * primitive (`DropdownMenuItem.onSelect`) passes a plain `Event` for keyboard
 * activations and a `React.MouseEvent` for clicks. Use this alias to type
 * custom `onClick` handlers without spelling out the union:
 *
 * ```ts
 * const handler = (event: NavUserMenuItemSelectEvent) => {
 *   if (event instanceof MouseEvent) { console.log(event.clientX); }
 * };
 * ```
 */
export type NavUserMenuItemSelectEvent = Event | React.MouseEvent;

export interface NavUserMenuItem {
  kind: "item";
  icon?: ReactNode | ComponentType<{ className?: string }>;
  label: string;
  /**
   * v0.3.0 — widened from `React.MouseEvent` to `Event | React.MouseEvent` to
   * honestly type the event arg passed by Radix's `DropdownMenuItem.onSelect`
   * (which may be a plain `Event` or `MouseEvent` depending on input modality
   * and primitive vendor). v0.2.x consumers reading MouseEvent-only fields
   * (e.g. `event.clientX`) narrow with `if (event instanceof MouseEvent) { … }`
   * or cast at the call site.
   */
  onClick?: (event: NavUserMenuItemSelectEvent) => void;
  href?: string;
  linkComponent?: NavLinkComponent;
  variant?: "default" | "destructive";
  shortcut?: string;
  disabled?: boolean;
}

export interface NavUserConfig {
  user: {
    name: string;
    handle?: string;
    avatarUrl?: string;
    avatarFallback?: string;
    status?: "online" | "offline" | "busy" | "away" | "invisible";
  };
  menuItems: ReadonlyArray<NavUserMenuItem | { kind: "separator" }>;
  onTriggerOpen?: (args: { open: boolean }) => void;
}

// ─────────────────────────────────────────────────────────────────────────
// Events + state (L20 — object-args throughout)
// ─────────────────────────────────────────────────────────────────────────

export type AppSidebarMobileOpenReason =
  | "trigger"
  | "item-click"
  | "outside-click"
  | "escape"
  | "imperative";

export interface AppSidebarHandle {
  // Collapse
  toggleCollapse(): void;
  setCollapsed(next: boolean): void;
  isCollapsed(): boolean;

  // Mobile drawer
  // v0.3.0 (L54): optional `reason?` param propagates through to
  // `onMobileOpenChange.reason`. Default `"imperative"` preserves v0.2.x
  // call sites — `handle.closeMobile()` still works exactly as before.
  /** Open the mobile drawer. Optional `reason` reaches `onMobileOpenChange.reason`. Default `"imperative"`. */
  openMobile(reason?: AppSidebarMobileOpenReason): void;
  /** Close the mobile drawer. Optional `reason` reaches `onMobileOpenChange.reason`. Default `"imperative"`. */
  closeMobile(reason?: AppSidebarMobileOpenReason): void;
  /** Toggle the mobile drawer. Optional `reason` reaches `onMobileOpenChange.reason`. Default `"imperative"`. */
  toggleMobile(reason?: AppSidebarMobileOpenReason): void;
  isMobileOpen(): boolean;

  // Section state
  toggleSection(sectionId: string): void;
  expandSection(sectionId: string): void;
  collapseSection(sectionId: string): void;
  /** Expand every section (clears the entire collapsed-set). */
  expandAllSections(): void;
  /**
   * Collapse every currently-VISIBLE section.
   *
   * v0.3.0 NOTE: operates on sections that survive the permission /
   * ownerOnly / minMembers filter pass — sections hidden by gates are not
   * touched. To collapse a section regardless of visibility, call
   * `collapseSection(id)` directly with its id.
   */
  collapseAllSections(): void;
  isSectionCollapsed(sectionId: string): boolean;

  // Items + active
  getItems(): ReadonlyArray<NavEntry>;
  getItemById(id: string): NavItem | undefined;
  getActiveItem(): NavItem | undefined;

  // Focus
  focusItem(id: string): void;
  focusFirstItem(): void;
  focusLastItem(): void;

  // Snapshot
  getState(): AppSidebarStateValue;
}

export interface AppSidebarStateValue extends AppSidebarHandle {
  collapsed: boolean;
  mobileOpen: boolean;
  collapsedSectionIds: ReadonlySet<string>;
  activeItemId: string | null;
  activeItem: NavItem | null;
  visibleEntries: ReadonlyArray<NavEntry>;
}

// ─────────────────────────────────────────────────────────────────────────
// Empty-state reason (L48)
// ─────────────────────────────────────────────────────────────────────────

export type AppSidebarEmptyReason =
  | "no-items"
  | "all-filtered-by-permission"
  | "all-hidden"
  | "all-filtered-by-loading";

// ─────────────────────────────────────────────────────────────────────────
// Render-prop slot arg shapes (L29)
// ─────────────────────────────────────────────────────────────────────────

export interface AppSidebarRenderItemArgs {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  isFocused: boolean;
  isDisabled: boolean;
  sectionId: string | null;
  indexInSection: number;
  defaultRender: ReactNode;
}

export interface AppSidebarRenderBadgeArgs {
  item: NavItem;
  badge: NavBadgeConfig;
  position: "inline-end" | "corner";
  defaultRender: ReactNode;
}

export interface AppSidebarRenderTooltipContentArgs {
  item: NavItem;
  isActive: boolean;
}

export interface AppSidebarRenderSectionArgs {
  section: NavSection;
  isCollapsed: boolean;
  visibleItemCount: number;
  defaultRender: ReactNode;
}

export interface AppSidebarRenderLoadingArgs {
  isCollapsed: boolean;
  defaultRender: ReactNode;
}

export interface AppSidebarRenderEmptyStateArgs {
  reason: AppSidebarEmptyReason;
}

// ─────────────────────────────────────────────────────────────────────────
// Event arg shapes (L20)
// ─────────────────────────────────────────────────────────────────────────

export interface AppSidebarEventArgs {
  collapsedChange: { collapsed: boolean };
  mobileOpenChange: { open: boolean; reason: AppSidebarMobileOpenReason };
  itemClick: { item: NavItem; isActive: boolean; event: React.MouseEvent };
  itemHover: { item: NavItem; event: React.MouseEvent };
  itemFocus: { item: NavItem; event: React.FocusEvent };
  itemNavigate: { item: NavItem };
  activeItemChange: { item: NavItem | null; previousItem: NavItem | null };
  sectionToggle: { section: NavSection; collapsed: boolean };
  permissionDenied: { item: NavItem; requiredPermission: string };
  brandClick: { event: React.MouseEvent };
  primaryActionClick: { event: React.MouseEvent };
  footerTriggerOpen: { open: boolean };
  // v0.3.0 (C4, F10): event widened to NavUserMenuItemSelectEvent to match
  // the widened NavUserMenuItem.onClick. Same callback chain — must be
  // self-consistent. Consumers narrow with `event instanceof MouseEvent`.
  footerMenuItemClick: { menuItem: NavUserMenuItem; event: NavUserMenuItemSelectEvent };
  skipLinkActivated: { event: React.MouseEvent };
  mount: { initialState: AppSidebarStateValue };
}

// ─────────────────────────────────────────────────────────────────────────
// Labels (v0.5.0 — C2). Every user-facing string the sidebar renders.
// ─────────────────────────────────────────────────────────────────────────

export interface AppSidebarLabels {
  /** `aria-label` of the `<nav>` and the drawer title. Default "Main navigation". */
  navigation: string;
  /** Collapse toggle while collapsed. Default "Expand sidebar". */
  expandSidebar: string;
  /** Collapse toggle while expanded. Default "Collapse sidebar". */
  collapseSidebar: string;
  /** `AppSidebarTrigger` inside the sidebar's subtree. Default "Open navigation". */
  openNavigation: string;
  /** Drawer close button. Default "Close navigation". */
  closeNavigation: string;
  /** Skip link. Default "Skip to content". */
  skipToContent: string;
  /** Loading skeleton's accessible name. Default "Loading navigation items". */
  loading: string;
  /** User-menu trigger. Default `"{name} — open menu"`. */
  userMenu: (name: string) => string;
  /**
   * Accessible name of a row with a number / string badge — collapsed and
   * expanded alike. Default `"{label}, {value}"`. `value` is the raw badge value.
   */
  itemWithBadge: (label: string, value: number | string) => string;
  /** Accessible name of a row with a dot / pulse badge. Default `"{label}, new"`. */
  itemWithIndicator: (label: string) => string;
  /** Default empty-state copy per reason. */
  emptyState: Record<AppSidebarEmptyReason, { title: string; body?: string }>;
}

/** What the `labels` prop accepts: every key optional, `emptyState` per reason. */
export type AppSidebarLabelsInput = Partial<Omit<AppSidebarLabels, "emptyState">> & {
  emptyState?: Partial<AppSidebarLabels["emptyState"]>;
};

/** Where the sidebar sits. `start` / `end` follow the text direction; `left` / `right` are physical. */
export type AppSidebarSide = "start" | "end" | "left" | "right";

/** Which render of the chrome a part is in. */
export type AppSidebarMode = "desktop" | "mobile";

export interface AppSidebarTopSlotArgs {
  mode: AppSidebarMode;
  /** Always `false` in the drawer. */
  isCollapsed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Main component props (the full surface)
// ─────────────────────────────────────────────────────────────────────────

export interface AppSidebarProps {
  // Items
  items: ReadonlyArray<NavEntry>;

  // Active detection
  currentPath: string;
  isActive?: (item: NavItem, currentPath: string) => boolean;
  defaultMatch?: "exact" | "prefix";

  // Link primitive
  linkComponent?: NavLinkComponent;

  // Collapse (uncontrolled / controlled / lifted via state)
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  /**
   * Fired when the collapsed state changes.
   *
   * v0.3.0 NOTE: does NOT fire during localStorage rehydration on mount. The
   * persisted collapsed state is already reflected in the initial render via
   * the storage-read effect; firing the callback at that point would be
   * confusing (the consumer didn't request the change). The callback only
   * fires on user-initiated transitions: toggle button, controlled-prop
   * change, or imperative handle call (`handle.toggleCollapse()` /
   * `setCollapsed(next)`).
   */
  onCollapsedChange?: (args: AppSidebarEventArgs["collapsedChange"]) => void;

  // Mobile drawer (L8 + L24 + L44)
  defaultMobileOpen?: boolean;
  isMobileOpen?: boolean;
  onMobileOpenChange?: (args: AppSidebarEventArgs["mobileOpenChange"]) => void;
  mobileBreakpoint?: "sm" | "md" | "lg" | "xl" | "2xl" | (string & {});
  /** Default: same as `side`. `start` / `end` follow the text direction. */
  mobileDrawerSide?: AppSidebarSide;
  autoCloseMobileOnNavigate?: boolean;

  // Lifted state (L30 — wins over individual props above)
  state?: AppSidebarStateValue;

  // Layout
  /**
   * v0.5.0 — default `"start"` (left in LTR, right in RTL). `"left"` /
   * `"right"` keep their v0.4 meaning.
   */
  side?: AppSidebarSide;
  /** Text direction. Default: the element's computed `direction`, read after mount. */
  dir?: "ltr" | "rtl";
  collapsedWidth?: string;
  expandedWidth?: string;
  transitionDuration?: string;
  activeVariant?: "fill" | "left-bar" | "right-bar" | "outline" | "subtle";

  // Sections (L48-b)
  autoExpandActiveSection?: boolean;
  defaultCollapsedSectionIds?: ReadonlyArray<string>;
  keepEmptySections?: boolean;

  // Active item view (L48-c)
  autoScrollActiveIntoView?: boolean;

  // Persistence (L23)
  storageKey?: string;

  // Permissions (L22)
  permissions?: ReadonlySet<string>;

  // Slots — named (L14)
  headerSlot?: ReactNode;
  brandSlot?: ReactNode;
  brand?: NavBrandConfig;
  navAccessorySlot?: ReactNode;
  primaryActionSlot?: ReactNode;
  primaryAction?: NavPrimaryActionConfig;
  footerSlot?: ReactNode;
  footer?: NavUserConfig;
  drawerHeaderSlot?: ReactNode;

  // Slots — render-prop (L13)
  renderItem?: (args: AppSidebarRenderItemArgs) => ReactNode;
  renderBadge?: (args: AppSidebarRenderBadgeArgs) => ReactNode;
  renderTooltipContent?: (args: AppSidebarRenderTooltipContentArgs) => ReactNode;
  renderSection?: (args: AppSidebarRenderSectionArgs) => ReactNode;
  renderLoading?: (args: AppSidebarRenderLoadingArgs) => ReactNode;
  renderEmptyState?: (args: AppSidebarRenderEmptyStateArgs) => ReactNode;

  // Loading
  loading?: boolean;

  // Events
  onItemClick?: (args: AppSidebarEventArgs["itemClick"]) => void;
  onItemHover?: (args: AppSidebarEventArgs["itemHover"]) => void;
  onItemFocus?: (args: AppSidebarEventArgs["itemFocus"]) => void;
  onItemNavigate?: (args: AppSidebarEventArgs["itemNavigate"]) => void;
  onActiveItemChange?: (args: AppSidebarEventArgs["activeItemChange"]) => void;
  onSectionToggle?: (args: AppSidebarEventArgs["sectionToggle"]) => void;
  onPermissionDenied?: (args: AppSidebarEventArgs["permissionDenied"]) => void;
  onBrandClick?: (args: AppSidebarEventArgs["brandClick"]) => void;
  onPrimaryActionClick?: (args: AppSidebarEventArgs["primaryActionClick"]) => void;
  onFooterTriggerOpen?: (args: AppSidebarEventArgs["footerTriggerOpen"]) => void;
  onFooterMenuItemClick?: (args: AppSidebarEventArgs["footerMenuItemClick"]) => void;
  onSkipLinkActivated?: (args: AppSidebarEventArgs["skipLinkActivated"]) => void;
  onMount?: (args: AppSidebarEventArgs["mount"]) => void;
  onUnmount?: () => void;

  // v0.5.0 — strings (C2)
  /** Partial override merged over `DEFAULT_APP_SIDEBAR_LABELS`. */
  labels?: AppSidebarLabelsInput;
  /** Badge count formatter (C3). Default: `value > max ? "{max}+" : String(value)`. */
  formatBadgeCount?: (value: number, max: number) => string;

  // v0.5.0 — drawer chrome (AS3)
  /** Extra classes on the drawer panel (`SheetContent`). */
  drawerClassName?: string;
  /** Inline style on the drawer panel — e.g. CSS variables for the drawer only. */
  drawerStyle?: CSSProperties;

  // Standard
  className?: string;
  /**
   * Inline style on the desktop `<nav>`. CSS variables set here win over
   * ancestor declarations; ancestors win over the built-in defaults.
   */
  style?: CSSProperties;
  "aria-label"?: string;
  id?: string;
  skipLinkTarget?: string;
  skipLinkLabel?: string;
  ref?: Ref<AppSidebarHandle>;

  // ───────────────────────────────────────────────────────────────────────
  // v0.2.0 — additive expansion (L41–L52). Zero breaking changes for v0.1.x
  // consumers; every new prop is optional and defaults to v0.1 behavior.
  // ───────────────────────────────────────────────────────────────────────

  /**
   * v0.2.0 — Slot above the brand row. Geographically distinct from v0.1's
   * `headerSlot` (which is INSIDE the brand row, to the LEFT of brand).
   * Hierarchy top → bottom: `topSlot` → `headerSlot` → `brandSlot` →
   * `navAccessorySlot`. Consumer Fragment-stacks if multiple widgets
   * needed (L41). Canonical occupant: `<AccountSwitcher>`.
   */
  topSlot?: ReactNode | ((args: AppSidebarTopSlotArgs) => ReactNode);

  /**
   * v0.2.0 — Map of placeholder values for href substitution. When present,
   * every `{key}` substring in any `NavItem.href` is replaced with
   * `templateValues[key]` via `String.prototype.replaceAll`. Items whose
   * href has no `{...}` placeholders render unchanged. Combines with
   * `resolveHref` — `resolveHref` wins when both provided (L43).
   *
   * Dev-warns when an href references a `{xxx}` placeholder not present
   * in the map (only at the substitution site; tree-shaken in prod).
   */
  hrefTemplateValues?: Record<string, string>;

  /**
   * v0.2.0 — Escape-hatch callback for href resolution. When provided,
   * wins precedence over `hrefTemplateValues`. Called per item per render
   * — should be a stable function (`useCallback`). Return value is the
   * final href string (strict `string`; consumer suppresses href by
   * removing the item from `items`).
   */
  resolveHref?: (
    item: NavItem,
    templateValues: Record<string, string> | undefined,
  ) => string;

  /**
   * v0.2.0 — Whether the current user is an owner. Fed into the filter
   * pass; default `false` → all `ownerOnly` items hidden. Raw scalar, not
   * opaque membership object (L52).
   */
  isOwner?: boolean;

  /**
   * v0.2.0 — Current plan-tier seat capacity. Fed into the filter pass;
   * default `Infinity` → all `minMembers` items visible.
   */
  currentMaxMembers?: number;

  /**
   * v0.2.0 — When `true`, bypass the three permission gates (`permission`
   * / `ownerOnly` / `minMembers`) at BOTH section AND item levels (Finding
   * 4 — prevents "section disappears, items remain" inconsistency).
   * `hidden: true` is still respected (Q21). Use case: personal-context
   * shortcuts, admin overrides, debug views.
   */
  bypassFiltering?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Companion component (L17)
// ─────────────────────────────────────────────────────────────────────────

export interface AppSidebarTriggerProps {
  controls?: Ref<AppSidebarHandle> | AppSidebarHandle | null;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
  asChild?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Headless hook options (L16)
// ─────────────────────────────────────────────────────────────────────────

export interface UseAppSidebarStateOptions {
  defaultCollapsed?: boolean;
  defaultMobileOpen?: boolean;
  defaultCollapsedSectionIds?: ReadonlyArray<string>;
  items?: ReadonlyArray<NavEntry>;
  currentPath?: string;
  isActive?: (item: NavItem, currentPath: string) => boolean;
  defaultMatch?: "exact" | "prefix";
  permissions?: ReadonlySet<string>;
  storageKey?: string;
  autoExpandActiveSection?: boolean;
  /** v0.5.0 — forwarded to the filter pass (same meaning as the `AppSidebar` props). */
  keepEmptySections?: boolean;
  /** v0.5.0 — forwarded to the filter pass. Default `false` (ownerOnly items hidden). */
  isOwner?: boolean;
  /** v0.5.0 — forwarded to the filter pass. Default `Infinity`. */
  currentMaxMembers?: number;
  /** v0.5.0 — forwarded to the filter pass. */
  bypassFiltering?: boolean;
}
