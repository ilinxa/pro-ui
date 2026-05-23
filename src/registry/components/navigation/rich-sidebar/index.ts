export { RichSidebar } from "./rich-sidebar";
export { RichSidebarTrigger } from "./parts/sidebar-nav-trigger";
export { NavBadge } from "./parts/nav-badge";
export { NavBrand } from "./parts/nav-brand";
export { NavPrimaryAction } from "./parts/nav-primary-action";
export { NavUser } from "./parts/nav-user";
export { useRichSidebarState } from "./hooks/use-sidebar-nav-state";
export { useFilteredNavSections } from "./hooks/use-filtered-nav-sections";
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
  RichSidebarProps,
  RichSidebarHandle,
  RichSidebarStateValue,
  RichSidebarMobileOpenReason,
  RichSidebarEmptyReason,
  RichSidebarEventArgs,

  // Render-prop slot args
  RichSidebarRenderItemArgs,
  RichSidebarRenderBadgeArgs,
  RichSidebarRenderTooltipContentArgs,
  RichSidebarRenderSectionArgs,
  RichSidebarRenderLoadingArgs,
  RichSidebarRenderEmptyStateArgs,

  // Companion + hook options
  RichSidebarTriggerProps,
  UseRichSidebarStateOptions,

  // v0.2.0 — additive
  NavContext,
} from "./types";
