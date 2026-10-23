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
import type { AppSidebarLabels, NavEntry } from "./types";

/**
 * Dummy data — kasder-style recipe + a sectioned variant.
 * Used by demo.tsx (docs site) AND ships via the `app-sidebar-fixtures`
 * registry sibling so consumers can paste-and-go.
 */

// Flat list (kasder-style)
export const SIDEBAR_NAV_DUMMY_ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/social/home", icon: Home },
  { id: "explore", label: "Explore", href: "/social/explore", icon: Compass },
  { id: "chat", label: "Messages", href: "/social/chat", icon: MessageCircle, badge: 3 },
  { id: "notif", label: "Notifications", href: "/social/notifications", icon: Bell, badge: 5 },
  { id: "prof", label: "Profile", href: "/social/profile", icon: User },
  { id: "biz", label: "Business", href: "/social/business", icon: Briefcase },
];

// Sectioned variant — demonstrates groups + separators + collapsible
export const SIDEBAR_NAV_DUMMY_SECTIONED: ReadonlyArray<NavEntry> = [
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

export const SIDEBAR_NAV_DUMMY_CURRENT_PATH = "/social/home";

// ── v0.5.0 demo data ──────────────────────────────────────────────────────

/** Turkish label set — every `AppSidebarLabels` key. */
export const SIDEBAR_LABELS_TR: AppSidebarLabels = {
  navigation: "Ana gezinme",
  expandSidebar: "Kenar çubuğunu genişlet",
  collapseSidebar: "Kenar çubuğunu daralt",
  openNavigation: "Gezinmeyi aç",
  closeNavigation: "Gezinmeyi kapat",
  skipToContent: "İçeriğe geç",
  loading: "Gezinme öğeleri yükleniyor",
  userMenu: (name) => `${name} — menüyü aç`,
  itemWithBadge: (label, value) => `${label}, ${value} yeni`,
  itemWithIndicator: (label) => `${label}, yeni`,
  emptyState: {
    "no-items": { title: "Öğe yok", body: "Gezinmeyi doldurmak için `items` verin." },
    "all-filtered-by-permission": { title: "Görünür öğe yok", body: "Tüm öğeler izinlere göre süzüldü." },
    "all-hidden": { title: "Tüm öğeler gizli" },
    "all-filtered-by-loading": { title: "Öğe yok", body: "Yükleme öğesiz tamamlandı." },
  },
};

/** Arabic label set — every `AppSidebarLabels` key. */
export const SIDEBAR_LABELS_AR: AppSidebarLabels = {
  navigation: "التنقل الرئيسي",
  expandSidebar: "توسيع الشريط الجانبي",
  collapseSidebar: "طيّ الشريط الجانبي",
  openNavigation: "فتح التنقل",
  closeNavigation: "إغلاق التنقل",
  skipToContent: "انتقل إلى المحتوى",
  loading: "جارٍ تحميل عناصر التنقل",
  userMenu: (name) => `${name} — فتح القائمة`,
  itemWithBadge: (label, value) => `${label}، ${value} جديد`,
  itemWithIndicator: (label) => `${label}، جديد`,
  emptyState: {
    "no-items": { title: "لا توجد عناصر", body: "مرّر `items` لملء التنقل." },
    "all-filtered-by-permission": { title: "لا شيء مرئي", body: "تمت تصفية كل العناصر حسب الأذونات." },
    "all-hidden": { title: "كل العناصر مخفية" },
    "all-filtered-by-loading": { title: "لا توجد عناصر", body: "انتهى التحميل دون عناصر." },
  },
};

/** RTL nav: numeric badge, dot badge. */
export const SIDEBAR_NAV_DUMMY_RTL: ReadonlyArray<NavEntry> = [
  { id: "home", label: "الرئيسية", href: "/social/home", icon: Home },
  { id: "chat", label: "الرسائل", href: "/social/chat", icon: MessageCircle, badge: 7 },
  { id: "notif", label: "الإشعارات", href: "/social/notifications", icon: Bell, badge: { value: 1, variant: "dot" } },
  { id: "prof", label: "الملف الشخصي", href: "/social/profile", icon: User },
];

/** Badge showcase: number, dot, withheld (null), large count, brand tone with activeTone. */
export const SIDEBAR_NAV_DUMMY_BADGES: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Ana sayfa", href: "/social/home", icon: Home, badge: { value: 4, tone: "destructive", activeTone: "brand" } },
  { id: "chat", label: "Mesajlar", href: "/social/chat", icon: MessageCircle, badge: 1284 },
  { id: "notif", label: "Bildirimler", href: "/social/notifications", icon: Bell, badge: { value: 1, variant: "dot" } },
  { id: "inbox", label: "Gelen kutusu", href: "/social/inbox", icon: Inbox, badge: { value: null } },
  { id: "prof", label: "Profil", href: "/social/profile", icon: User },
];
