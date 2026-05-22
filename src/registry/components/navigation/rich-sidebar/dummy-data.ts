import {
  Bell,
  Briefcase,
  Compass,
  CreditCard,
  FileText,
  FolderKanban,
  Home,
  Inbox,
  MessageCircle,
  Settings,
  User,
  Users,
} from "lucide-react";
import type { NavEntry } from "./types";

/**
 * Dummy data — kasder-style recipe + a sectioned variant.
 * Used by demo.tsx (docs site) AND ships via the `rich-sidebar-fixtures`
 * registry sibling so consumers can paste-and-go.
 */

// Flat list (kasder-style)
export const SIDEBAR_NAV_01_DUMMY_ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/social/home", icon: Home },
  { id: "explore", label: "Explore", href: "/social/explore", icon: Compass },
  { id: "chat", label: "Messages", href: "/social/chat", icon: MessageCircle, badge: 3 },
  { id: "notif", label: "Notifications", href: "/social/notifications", icon: Bell, badge: 5 },
  { id: "prof", label: "Profile", href: "/social/profile", icon: User },
  { id: "biz", label: "Business", href: "/social/business", icon: Briefcase },
];

// Sectioned variant — demonstrates groups + separators + collapsible
export const SIDEBAR_NAV_01_DUMMY_SECTIONED: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/", icon: Home },
  { id: "inbox", label: "Inbox", href: "/inbox", icon: Inbox, badge: 12 },
  { kind: "separator", id: "sep-1" },
  {
    kind: "section",
    id: "workspace",
    title: "Workspace",
    collapsible: true,
    items: [
      { id: "projects", label: "Projects", href: "/projects", icon: FolderKanban },
      { id: "team", label: "Team", href: "/team", icon: Users },
      { id: "docs", label: "Docs", href: "/docs", icon: FileText },
    ],
  },
  {
    kind: "section",
    id: "admin",
    title: "Admin",
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
      { id: "billing", label: "Billing", href: "/admin/billing", icon: CreditCard },
    ],
  },
];

export const SIDEBAR_NAV_01_DUMMY_CURRENT_PATH = "/social/home";
