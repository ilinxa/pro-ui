import { Building2, Globe, Settings2, ShieldCheck, User } from "lucide-react";
import type { SwitcherItem } from "./types";

/**
 * Realistic multi-context fixture covering all 5 categories from the
 * source's NavContext union (personal / business / platform / governance /
 * cms-business). Demonstrates dual-entry pattern (`biz-acme` + `cms-biz-acme`
 * share the conceptual account but have distinct keys per L3).
 */
export const ACCOUNT_SWITCHER_01_DUMMY_ITEMS: ReadonlyArray<SwitcherItem> = [
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

export const ACCOUNT_SWITCHER_01_DUMMY_ACTIVE_KEY: string | null = "biz-acme";

/**
 * Fallback shown when the consumer-provided `activeKey` doesn't resolve to
 * any item (I-1; avoids the source's governance-mislabel bug). Demos use it
 * to show the trigger never crashes on bad input.
 */
export const ACCOUNT_SWITCHER_01_DUMMY_FALLBACK: SwitcherItem = {
  key: "fallback",
  label: "Select a context",
  icon: User,
};
