import type { NavEntry } from "./types";

/**
 * Dummy data — kasder-style recipe.
 * Used by demo.tsx (docs site) AND ships via the `sidebar-nav-01-fixtures`
 * registry sibling so consumers can paste-and-go.
 */
export const SIDEBAR_NAV_01_DUMMY_ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Ana Sayfa", href: "/social/home" },
  { id: "explore", label: "Keşfet", href: "/social/explore" },
  { id: "chat", label: "Mesajlar", href: "/social/chat", badge: 3 },
  { id: "notif", label: "Bildirimler", href: "/social/notifications", badge: 5 },
  { id: "prof", label: "Profil", href: "/social/profile" },
  { id: "biz", label: "İşletme", href: "/social/business" },
];

export const SIDEBAR_NAV_01_DUMMY_CURRENT_PATH = "/social/home";
