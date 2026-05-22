export { SidebarNav01 } from "./sidebar-nav-01";
export { SidebarNav01Trigger } from "./parts/sidebar-nav-trigger";
export { NavBadge } from "./parts/nav-badge";
export { NavBrand } from "./parts/nav-brand";
export { NavPrimaryAction } from "./parts/nav-primary-action";
export { NavUser } from "./parts/nav-user";
export { useSidebarNav01State } from "./hooks/use-sidebar-nav-state";

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
  SidebarNav01Props,
  SidebarNav01Handle,
  SidebarNav01StateValue,
  SidebarNav01MobileOpenReason,
  SidebarNav01EmptyReason,
  SidebarNav01EventArgs,

  // Render-prop slot args
  SidebarNav01RenderItemArgs,
  SidebarNav01RenderBadgeArgs,
  SidebarNav01RenderTooltipContentArgs,
  SidebarNav01RenderSectionArgs,
  SidebarNav01RenderLoadingArgs,
  SidebarNav01RenderEmptyStateArgs,

  // Companion + hook options
  SidebarNav01TriggerProps,
  UseSidebarNav01StateOptions,
} from "./types";
