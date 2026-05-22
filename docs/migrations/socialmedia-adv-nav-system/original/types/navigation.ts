/**
 * Navigation system types.
 *
 * Defines the navigation context (derived from URL), nav items with
 * permission gates, and section groupings used by the sidebar and
 * bottom navbar.
 */

import type { LucideIcon } from "lucide-react";

// =============================================================================
// NAVIGATION CONTEXT
// =============================================================================

export type NavContextType = "personal" | "business" | "platform" | "governance" | "cms";

export interface PersonalNavContext {
  type: "personal";
}

export interface BusinessNavContext {
  type: "business";
  slug: string;
  accountId: string;
  accountName: string;
}

export interface PlatformNavContext {
  type: "platform";
  accountId: string;
}

export interface GovernanceNavContext {
  type: "governance";
}

export interface CmsPlatformNavContext {
  type: "cms";
  mode: "platform";
  accountId: string;
}

export interface CmsBusinessNavContext {
  type: "cms";
  mode: "business";
  slug: string;
  accountId: string;
  accountName: string;
}

export type CmsNavContext = CmsPlatformNavContext | CmsBusinessNavContext;

export type NavContext =
  | PersonalNavContext
  | BusinessNavContext
  | PlatformNavContext
  | GovernanceNavContext
  | CmsNavContext;

// =============================================================================
// NAVIGATION CONFIG
// =============================================================================

export interface NavItem {
  /** Unique key for React rendering */
  key: string;
  /** Display label */
  label: string;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** URL path. Supports {slug} placeholder for business context */
  href: string;
  /** Permission code required to see this item (Tier 1 hint). Omit = always visible */
  permission?: string;
  /** If true, user must be the owner to see this item */
  ownerOnly?: boolean;
  /** Minimum max_members required for this item to be visible. Omit = always visible */
  minMembers?: number;
  /** Match strategy for active state detection */
  activeMatch: "exact" | "prefix";
}

export interface NavSection {
  /** Section heading label */
  label: string;
  /** Items in this section */
  items: NavItem[];
}

export interface NavContextConfig {
  personal: NavSection[];
  business: NavSection[];
  platform: NavSection[];
  governance: NavSection[];
  cms_platform: NavSection[];
  cms_business: NavSection[];
}
