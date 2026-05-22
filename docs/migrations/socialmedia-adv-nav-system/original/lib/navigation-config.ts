/**
 * Data-driven navigation configuration.
 *
 * Defines menu items for each context (personal, business, platform)
 * with permission gates. The `useFilteredNav` hook filters items
 * based on the user's membership permissions.
 */

import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Compass,
  FileText,
  Globe,
  Heart,
  Home,
  Image,
  Key,
  LayoutDashboard,
  MessageCircle,
  Newspaper,
  ScrollText,
  Search,
  Settings,
  Shield,
  User,
  Users,
  Users2,
} from "lucide-react";

import type { NavContext, NavContextConfig } from "@/types/navigation";

// =============================================================================
// NAV CONFIG
// =============================================================================

export const NAV_CONFIG: NavContextConfig = {
  personal: [
    {
      label: "Main",
      items: [
        { key: "home", label: "Home", icon: Home, href: "/home", activeMatch: "exact" },
        { key: "explore", label: "Explore", icon: Compass, href: "/explore", activeMatch: "prefix" },
        { key: "network", label: "Network", icon: Users2, href: "/network", activeMatch: "prefix" },
        {
          key: "notifications",
          label: "Notifications",
          icon: Bell,
          href: "/notifications",
          activeMatch: "prefix",
        },
        { key: "chat", label: "Chat", icon: MessageCircle, href: "/chat", activeMatch: "prefix" },
        {
          key: "activity",
          label: "Activity",
          icon: ArrowLeftRight,
          href: "/activity",
          activeMatch: "prefix",
        },
      ],
    },
    {
      label: "Account",
      items: [
        { key: "profile", label: "Profile", icon: User, href: "/profile", activeMatch: "prefix" },
        { key: "settings", label: "Settings", icon: Settings, href: "/settings", activeMatch: "exact" },
        { key: "sessions", label: "Security", icon: Shield, href: "/sessions", activeMatch: "exact" },
      ],
    },
  ],

  business: [
    {
      label: "Overview",
      items: [
        {
          key: "biz-dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/bconsole/{slug}/dashboard",
          activeMatch: "exact",
        },
        {
          key: "biz-profile",
          label: "Profile",
          icon: User,
          href: "/bconsole/{slug}/profile",
          activeMatch: "exact",
        },
      ],
    },
    {
      label: "Team",
      items: [
        {
          key: "biz-members",
          label: "Members",
          icon: Users,
          href: "/bconsole/{slug}/members",
          permission: "can_view_members",
          minMembers: 2,
          activeMatch: "prefix",
        },
        {
          key: "biz-chat",
          label: "Chat",
          icon: MessageCircle,
          href: "/bconsole/{slug}/chat",
          activeMatch: "prefix",
        },
      ],
    },
    {
      label: "Network",
      items: [
        {
          key: "biz-followers",
          label: "Followers",
          icon: Heart,
          href: "/bconsole/{slug}/network/followers",
          permission: "can_manage_followers",
          activeMatch: "prefix",
        },
        {
          key: "biz-connections",
          label: "Connections",
          icon: Users2,
          href: "/bconsole/{slug}/network/connections",
          permission: "can_manage_connections",
          activeMatch: "prefix",
        },
      ],
    },
    {
      label: "Content",
      items: [
        {
          key: "biz-forms",
          label: "Forms",
          icon: FileText,
          href: "/bconsole/{slug}/forms",
          permission: "can_create_form",
          activeMatch: "prefix",
        },
        {
          key: "biz-cms-console",
          label: "CMS Console",
          icon: Newspaper,
          href: "/cconsole/{slug}/sites",
          permission: "can_view_cms_content",
          activeMatch: "prefix",
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          key: "biz-transactions",
          label: "Transactions",
          icon: ScrollText,
          href: "/bconsole/{slug}/transactions",
          permission: "can_view_transactions",
          activeMatch: "prefix",
        },
        {
          key: "biz-audit",
          label: "Audit Log",
          icon: BarChart3,
          href: "/bconsole/{slug}/audit",
          permission: "can_view_audit_logs",
          activeMatch: "prefix",
        },
        {
          key: "biz-settings",
          label: "Settings",
          icon: Settings,
          href: "/bconsole/{slug}/settings",
          permission: "can_view_settings",
          activeMatch: "exact",
        },
      ],
    },
  ],

  platform: [
    {
      label: "Overview",
      items: [
        {
          key: "plat-dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/pconsole/dashboard",
          activeMatch: "exact",
        },
        {
          key: "plat-profile",
          label: "Profile",
          icon: User,
          href: "/pconsole/profile",
          activeMatch: "exact",
        },
      ],
    },
    {
      label: "Communication",
      items: [
        {
          key: "plat-chat",
          label: "Chat",
          icon: MessageCircle,
          href: "/pconsole/chat",
          activeMatch: "prefix",
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          key: "plat-businesses",
          label: "Businesses",
          icon: Building2,
          href: "/pconsole/businesses",
          permission: "can_view_businesses",
          activeMatch: "prefix",
        },
        {
          key: "plat-approved-creators",
          label: "Approved Creators",
          icon: Building2,
          href: "/pconsole/approved-creators",
          permission: "can_approve_business_creation",
          activeMatch: "prefix",
        },
        {
          key: "plat-members",
          label: "Members",
          icon: Users,
          href: "/pconsole/members",
          permission: "can_view_members",
          minMembers: 2,
          activeMatch: "prefix",
        },
        {
          key: "plat-cms-console",
          label: "CMS Console",
          icon: Newspaper,
          href: "/cconsole/sites",
          permission: "can_create_cms_site",
          activeMatch: "prefix",
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          key: "plat-transactions",
          label: "Transactions",
          icon: ScrollText,
          href: "/pconsole/transactions",
          permission: "can_view_transactions",
          activeMatch: "prefix",
        },
        {
          key: "plat-audit",
          label: "Audit Log",
          icon: BarChart3,
          href: "/pconsole/audit",
          permission: "can_view_audit_logs",
          activeMatch: "prefix",
        },
        {
          key: "plat-settings",
          label: "Settings",
          icon: Settings,
          href: "/pconsole/settings",
          permission: "can_view_settings",
          activeMatch: "exact",
        },
      ],
    },
  ],

  // ===========================================================================
  // GOVERNANCE CONSOLE
  // ===========================================================================

  governance: [
    {
      label: "Governance",
      items: [
        {
          key: "gov-dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/gconsole/dashboard",
          activeMatch: "exact",
        },
        {
          key: "gov-businesses",
          label: "Businesses",
          icon: Building2,
          href: "/gconsole/businesses",
          permission: "can_view_businesses",
          activeMatch: "prefix",
        },
        {
          key: "gov-members",
          label: "Members",
          icon: Users,
          href: "/gconsole/members",
          permission: "can_view_members",
          activeMatch: "prefix",
        },
        {
          key: "gov-approved-creators",
          label: "Approved Creators",
          icon: Shield,
          href: "/gconsole/approved-creators",
          permission: "can_approve_business_creation",
          activeMatch: "prefix",
        },
        {
          key: "gov-audit",
          label: "Audit Log",
          icon: BarChart3,
          href: "/gconsole/audit",
          permission: "can_view_audit_logs",
          activeMatch: "prefix",
        },
        {
          key: "gov-transactions",
          label: "Transactions",
          icon: ArrowLeftRight,
          href: "/gconsole/transactions",
          permission: "can_view_all_transactions",
          activeMatch: "prefix",
        },
      ],
    },
  ],

  // ===========================================================================
  // CMS CONSOLE — PLATFORM MODE
  // ===========================================================================

  cms_platform: [
    {
      label: "Content",
      items: [
        {
          key: "cms-p-sites",
          label: "Sites",
          icon: Globe,
          href: "/cconsole/sites",
          permission: "can_create_cms_site",
          activeMatch: "prefix",
        },
        {
          key: "cms-p-templates",
          label: "Templates",
          icon: FileText,
          href: "/cconsole/templates",
          permission: "can_create_cms_template",
          activeMatch: "prefix",
        },
        {
          key: "cms-p-media",
          label: "Media",
          icon: Image,
          href: "/cconsole/media",
          permission: "can_upload_cms_media",
          activeMatch: "prefix",
        },
        {
          key: "cms-p-api-keys",
          label: "API Keys",
          icon: Key,
          href: "/cconsole/api-keys",
          permission: "can_create_cms_api_key",
          activeMatch: "prefix",
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          key: "cms-p-businesses",
          label: "Businesses",
          icon: Building2,
          href: "/cconsole/businesses",
          permission: "can_manage_business_cms",
          activeMatch: "prefix",
        },
      ],
    },
  ],

  // ===========================================================================
  // CMS CONSOLE — BUSINESS MODE
  // ===========================================================================

  cms_business: [
    {
      label: "Content",
      items: [
        {
          key: "cms-b-sites",
          label: "Sites",
          icon: Globe,
          href: "/cconsole/{slug}/sites",
          permission: "can_view_cms_content",
          activeMatch: "prefix",
        },
        {
          key: "cms-b-media",
          label: "Media",
          icon: Image,
          href: "/cconsole/{slug}/media",
          permission: "can_upload_cms_media",
          activeMatch: "prefix",
        },
        {
          key: "cms-b-api-keys",
          label: "API Keys",
          icon: Key,
          href: "/cconsole/{slug}/api-keys",
          permission: "can_create_cms_api_key",
          activeMatch: "prefix",
        },
      ],
    },
    {
      label: "Templates",
      items: [
        {
          key: "cms-b-catalog",
          label: "Template Catalog",
          icon: Search,
          href: "/cconsole/{slug}/catalog",
          permission: "can_activate_cms_template",
          activeMatch: "prefix",
        },
        {
          key: "cms-b-library",
          label: "My Templates",
          icon: BookOpen,
          href: "/cconsole/{slug}/library",
          permission: "can_activate_cms_template",
          activeMatch: "prefix",
        },
      ],
    },
  ],
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Resolve {slug} placeholder in href for business or CMS business context.
 */
export function resolveHref(href: string, context: NavContext): string {
  if (context.type === "business") {
    return href.replace("{slug}", context.slug);
  }
  if (context.type === "cms" && context.mode === "business") {
    return href.replace("{slug}", context.slug);
  }
  return href;
}

/**
 * Check if a pathname matches a nav item's href.
 */
export function isNavActive(pathname: string, href: string, match: "exact" | "prefix"): boolean {
  return match === "exact" ? pathname === href : pathname.startsWith(href);
}
