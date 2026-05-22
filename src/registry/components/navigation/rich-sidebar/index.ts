export { RichSidebar } from "./rich-sidebar";
export { RichSidebarTrigger } from "./parts/sidebar-nav-trigger";
export { NavBadge } from "./parts/nav-badge";
export { NavBrand } from "./parts/nav-brand";
export { NavPrimaryAction } from "./parts/nav-primary-action";
export { NavUser } from "./parts/nav-user";
export { useRichSidebarState } from "./hooks/use-sidebar-nav-state";

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
} from "./types";
