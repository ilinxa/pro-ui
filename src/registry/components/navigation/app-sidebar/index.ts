export { AppSidebar } from "./app-sidebar";
export { AppSidebarTrigger } from "./parts/sidebar-nav-trigger";
export { NavBadge } from "./parts/nav-badge";
export { NavBrand } from "./parts/nav-brand";
export { NavPrimaryAction } from "./parts/nav-primary-action";
export { NavUser } from "./parts/nav-user";
export { useAppSidebarState } from "./hooks/use-sidebar-nav-state";
export { useFilteredNavSections } from "./hooks/use-filtered-nav-sections";
// v0.5.0
export { useAppSidebarMode } from "./contexts/sidebar-nav-context";
export { DEFAULT_APP_SIDEBAR_LABELS } from "./lib/labels";
export { APP_SIDEBAR_CSS_VARS } from "./lib/derive-css-vars";
export type { AppSidebarCssVar } from "./lib/derive-css-vars";
export type { UseFilteredNavSectionsOpts } from "./hooks/use-filtered-nav-sections";

export type {
  // Items schema
  NavItem,
  NavSection,
  NavSeparator,
  NavEntry,
  BasicNavItems,
  SidebarNavItems,

  // Link primitive
  NavLinkProps,
  NavLinkComponent,

  // Prefab part configs
  NavBadgeConfig,
  NavBrandConfig,
  NavPrimaryActionConfig,
  NavUserMenuItem,
  NavUserMenuItemSelectEvent, // v0.3.0 (L56) — event arg type for NavUserMenuItem.onClick
  NavUserConfig,

  // Main component
  AppSidebarProps,
  AppSidebarHandle,
  AppSidebarStateValue,
  AppSidebarMobileOpenReason,
  AppSidebarEmptyReason,
  AppSidebarEventArgs,

  // Render-prop slot args
  AppSidebarRenderItemArgs,
  AppSidebarRenderBadgeArgs,
  AppSidebarRenderTooltipContentArgs,
  AppSidebarRenderSectionArgs,
  AppSidebarRenderLoadingArgs,
  AppSidebarRenderEmptyStateArgs,

  // Companion + hook options
  AppSidebarTriggerProps,
  UseAppSidebarStateOptions,

  // v0.2.0 — additive
  NavContext,

  // v0.5.0 — additive
  AppSidebarLabels,
  AppSidebarLabelsInput,
  AppSidebarSide,
  AppSidebarMode,
  AppSidebarTopSlotArgs,
  NavBadgeTone,
} from "./types";
