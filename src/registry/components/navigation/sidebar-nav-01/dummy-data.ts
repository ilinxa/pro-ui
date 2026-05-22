import type { NavEntry } from "./types";

/**
 * Dummy data — kasder-style recipe + a sectioned variant.
 * Used by demo.tsx (docs site) AND ships via the `sidebar-nav-01-fixtures`
 * registry sibling so consumers can paste-and-go.
 */

// Flat list (kasder-style)
export const SIDEBAR_NAV_01_DUMMY_ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Ana Sayfa", href: "/social/home" },
  { id: "explore", label: "Keşfet", href: "/social/explore" },
  { id: "chat", label: "Mesajlar", href: "/social/chat", badge: 3 },
  { id: "notif", label: "Bildirimler", href: "/social/notifications", badge: 5 },
  { id: "prof", label: "Profil", href: "/social/profile" },
  { id: "biz", label: "İşletme", href: "/social/business" },
];

// Sectioned variant — demonstrates groups + separators + collapsible
export const SIDEBAR_NAV_01_DUMMY_SECTIONED: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/" },
  { id: "inbox", label: "Inbox", href: "/inbox", badge: 12 },
  { kind: "separator", id: "sep-1" },
  {
    kind: "section",
    id: "workspace",
    title: "Workspace",
    collapsible: true,
    items: [
      { id: "projects", label: "Projects", href: "/projects" },
      { id: "team", label: "Team", href: "/team" },
      { id: "docs", label: "Docs", href: "/docs" },
    ],
  },
  {
    kind: "section",
    id: "admin",
    title: "Admin",
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { id: "settings", label: "Settings", href: "/admin/settings" },
      { id: "billing", label: "Billing", href: "/admin/billing" },
    ],
  },
];

export const SIDEBAR_NAV_01_DUMMY_CURRENT_PATH = "/social/home";
