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
// Link primitive (L10 + L15)
// ─────────────────────────────────────────────────────────────────────────

export interface NavLinkProps {
  href: string;
  className?: string;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string;
  "data-active"?: boolean;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  target?: string;
  rel?: string;
  ref?: Ref<HTMLAnchorElement>;
  [key: `data-${string}`]: unknown;
}

export type NavLinkComponent = ComponentType<NavLinkProps>;

// ─────────────────────────────────────────────────────────────────────────
// Prefab part configs (L14, L15)
// ─────────────────────────────────────────────────────────────────────────

export interface NavBadgeConfig {
  value: number | string | ReactNode;
  max?: number;
  variant?: "number" | "dot" | "pulse";
  tone?: "default" | "accent" | "destructive" | "muted";
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

export interface NavUserMenuItem {
  kind: "item";
  icon?: ReactNode | ComponentType<{ className?: string }>;
  label: string;
  onClick?: (event: React.MouseEvent) => void;
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

export type SidebarNav01MobileOpenReason =
  | "trigger"
  | "item-click"
  | "outside-click"
  | "escape"
  | "imperative";

export interface SidebarNav01Handle {
  // Collapse
  toggleCollapse(): void;
  setCollapsed(next: boolean): void;
  isCollapsed(): boolean;

  // Mobile drawer
  openMobile(): void;
  closeMobile(): void;
  toggleMobile(): void;
  isMobileOpen(): boolean;

  // Section state
  toggleSection(sectionId: string): void;
  expandSection(sectionId: string): void;
  collapseSection(sectionId: string): void;
  expandAllSections(): void;
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
  getState(): SidebarNav01StateValue;
}

export interface SidebarNav01StateValue extends SidebarNav01Handle {
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

export type SidebarNav01EmptyReason =
  | "no-items"
  | "all-filtered-by-permission"
  | "all-hidden"
  | "all-filtered-by-loading";

// ─────────────────────────────────────────────────────────────────────────
// Render-prop slot arg shapes (L29)
// ─────────────────────────────────────────────────────────────────────────

export interface SidebarNav01RenderItemArgs {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  isFocused: boolean;
  isDisabled: boolean;
  sectionId: string | null;
  indexInSection: number;
  defaultRender: ReactNode;
}

export interface SidebarNav01RenderBadgeArgs {
  item: NavItem;
  badge: NavBadgeConfig;
  position: "inline-end" | "corner";
  defaultRender: ReactNode;
}

export interface SidebarNav01RenderTooltipContentArgs {
  item: NavItem;
  isActive: boolean;
}

export interface SidebarNav01RenderSectionArgs {
  section: NavSection;
  isCollapsed: boolean;
  visibleItemCount: number;
  defaultRender: ReactNode;
}

export interface SidebarNav01RenderLoadingArgs {
  isCollapsed: boolean;
  defaultRender: ReactNode;
}

export interface SidebarNav01RenderEmptyStateArgs {
  reason: SidebarNav01EmptyReason;
}

// ─────────────────────────────────────────────────────────────────────────
// Event arg shapes (L20)
// ─────────────────────────────────────────────────────────────────────────

export interface SidebarNav01EventArgs {
  collapsedChange: { collapsed: boolean };
  mobileOpenChange: { open: boolean; reason: SidebarNav01MobileOpenReason };
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
  footerMenuItemClick: { menuItem: NavUserMenuItem; event: React.MouseEvent };
  skipLinkActivated: { event: React.MouseEvent };
  mount: { initialState: SidebarNav01StateValue };
}

// ─────────────────────────────────────────────────────────────────────────
// Main component props (the full surface)
// ─────────────────────────────────────────────────────────────────────────

export interface SidebarNav01Props {
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
  onCollapsedChange?: (args: SidebarNav01EventArgs["collapsedChange"]) => void;

  // Mobile drawer (L8 + L24 + L44)
  defaultMobileOpen?: boolean;
  isMobileOpen?: boolean;
  onMobileOpenChange?: (args: SidebarNav01EventArgs["mobileOpenChange"]) => void;
  mobileBreakpoint?: "sm" | "md" | "lg" | "xl" | "2xl" | (string & {});
  mobileDrawerSide?: "left" | "right";
  autoCloseMobileOnNavigate?: boolean;

  // Lifted state (L30 — wins over individual props above)
  state?: SidebarNav01StateValue;

  // Layout
  side?: "left" | "right";
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
  renderItem?: (args: SidebarNav01RenderItemArgs) => ReactNode;
  renderBadge?: (args: SidebarNav01RenderBadgeArgs) => ReactNode;
  renderTooltipContent?: (args: SidebarNav01RenderTooltipContentArgs) => ReactNode;
  renderSection?: (args: SidebarNav01RenderSectionArgs) => ReactNode;
  renderLoading?: (args: SidebarNav01RenderLoadingArgs) => ReactNode;
  renderEmptyState?: (args: SidebarNav01RenderEmptyStateArgs) => ReactNode;

  // Loading
  loading?: boolean;

  // Events
  onItemClick?: (args: SidebarNav01EventArgs["itemClick"]) => void;
  onItemHover?: (args: SidebarNav01EventArgs["itemHover"]) => void;
  onItemFocus?: (args: SidebarNav01EventArgs["itemFocus"]) => void;
  onItemNavigate?: (args: SidebarNav01EventArgs["itemNavigate"]) => void;
  onActiveItemChange?: (args: SidebarNav01EventArgs["activeItemChange"]) => void;
  onSectionToggle?: (args: SidebarNav01EventArgs["sectionToggle"]) => void;
  onPermissionDenied?: (args: SidebarNav01EventArgs["permissionDenied"]) => void;
  onBrandClick?: (args: SidebarNav01EventArgs["brandClick"]) => void;
  onPrimaryActionClick?: (args: SidebarNav01EventArgs["primaryActionClick"]) => void;
  onFooterTriggerOpen?: (args: SidebarNav01EventArgs["footerTriggerOpen"]) => void;
  onFooterMenuItemClick?: (args: SidebarNav01EventArgs["footerMenuItemClick"]) => void;
  onSkipLinkActivated?: (args: SidebarNav01EventArgs["skipLinkActivated"]) => void;
  onMount?: (args: SidebarNav01EventArgs["mount"]) => void;
  onUnmount?: () => void;

  // Standard
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  id?: string;
  skipLinkTarget?: string;
  skipLinkLabel?: string;
  ref?: Ref<SidebarNav01Handle>;
}

// ─────────────────────────────────────────────────────────────────────────
// Companion component (L17)
// ─────────────────────────────────────────────────────────────────────────

export interface SidebarNav01TriggerProps {
  controls?: Ref<SidebarNav01Handle> | SidebarNav01Handle | null;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
  asChild?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Headless hook options (L16)
// ─────────────────────────────────────────────────────────────────────────

export interface UseSidebarNav01StateOptions {
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
}
