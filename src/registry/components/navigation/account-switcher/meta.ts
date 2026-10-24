import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "account-switcher",
  name: "Account Switcher",
  category: "navigation",

  description:
    "Popover account and context switcher — active label trigger, switchable context list, and a footer slot for create or request actions.",
  context:
    "Every multi-tenant SaaS surface has the same widget at the top of its app-shell: a button labeled with the active workspace / account / project / sub-account / team that opens a list of switchable contexts. Linear, Notion, Vercel, Slack, GitHub, Figma — same shape, every time. `account-switcher` ships that pattern as a single primitive: active-context-aware popover with `fallbackActiveItem` so the trigger never mis-labels, controlled+uncontrolled open state from v0.1 (`open` / `defaultOpen` / `onOpenChange`), collapse-to-icon mode for slotting into `app-sidebar`'s collapsed sidebar, and an arbitrary `footerSlot` so consumers drop in their own state-machine widgets without the library taking on their domain. Canonical occupant of `app-sidebar` v0.2.0's new `topSlot`; works standalone in any context where 'current X + switchable other X's' is the UX.",
  features: [
    "Listbox popup with full keyboard support — one Tab stop, ↑ / ↓ / Home / End, Enter / Space, ↓ on the trigger opens (APG listbox, roving focus)",
    "Typed `labels` (trigger name as a function of the current item, list name, empty text)",
    "Groups with headings, a description line, avatar-sized rows (`itemSize=\"lg\"`) and `renderItem`",
    "RTL: collapsed popover opens toward the inline end; the portaled list carries the section's direction",
    "fallbackActiveItem for un-resolved active keys (avoids governance-mislabel bug from source)",
    "Controlled+uncontrolled open state from v0.1 (open / defaultOpen / onOpenChange)",
    "Programmable ariaCurrent (default 'true', overridable to 'page' / 'step' / etc.)",
    "Collapse-to-icon trigger mode for slotting into icon-only sidebars",
    "Arbitrary footerSlot — consumer drops Create / Request / Settings / sign-out anywhere",
    "Width-matches-trigger popover on both shadcn backends (Radix / Base UI anchor-width var)",
    "Dev-warns: duplicate keys stripped; controlled↔uncontrolled transition flagged",
    "F-cross-13 pre-emption on Popover.onOpenChange from day one",
    "F-cross-13 path-b: no asChild — PopoverTrigger IS the listbox button (native DOM props only)",
    "Domain-agnostic — zero auth/membership/router imports",
  ],
  tags: [
    "account-switcher",
    "workspace-switcher",
    "context-switcher",
    "popover",
    "listbox",
    "multi-tenant",
    "app-shell",
  ],

  version: "0.3.0",
  status: "alpha",
  artifactBudgetKB: 48,
  createdAt: "2026-05-23",
  updatedAt: "2026-10-24",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["popover", "separator"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["app-sidebar"],
};
