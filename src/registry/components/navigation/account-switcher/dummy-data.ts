import { createElement } from "react";
import { Building2, Globe, Settings2, ShieldCheck, User } from "lucide-react";
import type { AccountSwitcherLabels, SwitcherItem } from "./types";

/**
 * Realistic multi-context fixture covering all 5 categories from the
 * source's NavContext union (personal / business / platform / governance /
 * cms-business). Demonstrates dual-entry pattern (`biz-acme` + `cms-biz-acme`
 * share the conceptual account but have distinct keys per L3).
 */
export const ACCOUNT_SWITCHER_DUMMY_ITEMS: ReadonlyArray<SwitcherItem> = [
  {
    key: "personal",
    label: "Personal",
    icon: User,
    href: "/home",
  },
  {
    key: "biz-acme",
    label: "Acme Corp",
    icon: Building2,
    href: "/bconsole/acme/dashboard",
  },
  {
    key: "biz-globex",
    label: "Globex Industries",
    icon: Building2,
    href: "/bconsole/globex/dashboard",
  },
  {
    key: "cms-biz-acme",
    label: "Acme Corp · CMS",
    icon: Settings2,
    href: "/cconsole/business/acme/dashboard",
  },
  {
    key: "platform",
    label: "Platform",
    icon: Globe,
    href: "/pconsole/dashboard",
  },
  {
    key: "governance",
    label: "Governance",
    icon: ShieldCheck,
    href: "/gconsole/dashboard",
  },
];

export const ACCOUNT_SWITCHER_DUMMY_ACTIVE_KEY: string | null = "biz-acme";

/** Initials avatar for the `itemSize="lg"` fixtures (no image URLs — fixtures must not 404). */
function initials(text: string) {
  return createElement(
    "span",
    {
      "aria-hidden": true,
      className:
        "flex size-full items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground",
    },
    text,
  );
}

/**
 * "Post as" / context picker in three groups — personal, businesses the user manages,
 * platform console (staff) — each with an avatar, a name and a one-line description.
 * Pair with `ACCOUNT_SWITCHER_DUMMY_GROUPS` and `itemSize="lg"`.
 */
export const ACCOUNT_SWITCHER_DUMMY_GROUPED_ITEMS: ReadonlyArray<SwitcherItem> = [
  { key: "me", label: "Ayşe Yılmaz", description: "@ayse · personal", icon: initials("AY"), group: "personal" },
  { key: "biz-kahve", label: "Kahve Durağı", description: "Owner · 3 locations", icon: initials("KD"), group: "business" },
  { key: "biz-atolye", label: "Atölye 34", description: "Editor", icon: initials("A3"), group: "business" },
  { key: "console", label: "Platform console", description: "Staff · moderation", icon: Globe, group: "platform" },
];

/** The same items with Turkish descriptions (descriptions are host data, not labels). */
const DESCRIPTIONS_TR: Record<string, string> = {
  me: "@ayse · kişisel",
  "biz-kahve": "Sahip · 3 şube",
  "biz-atolye": "Editör",
  console: "Personel · moderasyon",
};

export const ACCOUNT_SWITCHER_DUMMY_GROUPED_ITEMS_TR: ReadonlyArray<SwitcherItem> =
  ACCOUNT_SWITCHER_DUMMY_GROUPED_ITEMS.map((item) => ({ ...item, description: DESCRIPTIONS_TR[item.key] }));

export const ACCOUNT_SWITCHER_DUMMY_GROUPS = [
  { id: "personal", label: "Personal" },
  { id: "business", label: "Businesses" },
  { id: "platform", label: "Platform" },
] as const;

/** Turkish labels (C2) — every user-facing string overridden. */
export const ACCOUNT_SWITCHER_DUMMY_LABELS_TR: Required<AccountSwitcherLabels> = {
  trigger: (current) => (current === null ? "Hesap değiştir" : `Hesap değiştir, şu anki: ${current}`),
  list: "Hesaplar",
  empty: "Hesap yok",
};

export const ACCOUNT_SWITCHER_DUMMY_GROUPS_TR = [
  { id: "personal", label: "Kişisel" },
  { id: "business", label: "İşletmeler" },
  { id: "platform", label: "Platform" },
] as const;

/** Arabic items for the RTL demo. */
export const ACCOUNT_SWITCHER_DUMMY_ITEMS_AR: ReadonlyArray<SwitcherItem> = [
  { key: "me", label: "سارة أحمد", description: "حساب شخصي", icon: User, group: "personal" },
  { key: "biz-qahwa", label: "مقهى الزاوية", description: "مالكة", icon: Building2, group: "business" },
  { key: "biz-warsha", label: "ورشة الفن", description: "محررة", icon: Building2, group: "business" },
];

export const ACCOUNT_SWITCHER_DUMMY_GROUPS_AR = [
  { id: "personal", label: "شخصي" },
  { id: "business", label: "الأعمال" },
] as const;

export const ACCOUNT_SWITCHER_DUMMY_LABELS_AR: Required<AccountSwitcherLabels> = {
  trigger: (current) => (current === null ? "تبديل الحساب" : `تبديل الحساب، الحالي: ${current}`),
  list: "الحسابات",
  empty: "لا توجد حسابات",
};

/**
 * Fallback shown when the consumer-provided `activeKey` doesn't resolve to
 * any item (I-1; avoids the source's governance-mislabel bug). Demos use it
 * to show the trigger never crashes on bad input.
 */
export const ACCOUNT_SWITCHER_DUMMY_FALLBACK: SwitcherItem = {
  key: "fallback",
  label: "Select a context",
  icon: User,
};
