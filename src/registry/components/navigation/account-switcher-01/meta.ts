import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "account-switcher-01",
  name: "Account Switcher",
  category: "navigation",

  description:
    "Popover-with-switchable-items primitive: active context label + chevron trigger that opens a list of contexts to switch to, plus an arbitrary footer slot for create/request affordances.",
  context:
    "Every multi-tenant SaaS surface has the same widget at the top of its app-shell: a button labeled with the active workspace / account / project / sub-account / team that opens a list of switchable contexts. Linear, Notion, Vercel, Slack, GitHub, Figma — same shape, every time. `account-switcher-01` ships that pattern as a single primitive: active-context-aware popover with `fallbackActiveItem` so the trigger never mis-labels, controlled+uncontrolled open state from v0.1 (`open` / `defaultOpen` / `onOpenChange`), collapse-to-icon mode for slotting into `rich-sidebar`'s collapsed sidebar, and an arbitrary `footerSlot` so consumers drop in their own state-machine widgets without the library taking on their domain. Canonical occupant of `rich-sidebar` v0.2.0's new `topSlot`; works standalone in any context where 'current X + switchable other X's' is the UX.",
  features: [
    "Combobox-aria popover (matches Linear / Vercel / GitHub switchers)",
    "fallbackActiveItem for un-resolved active keys (avoids governance-mislabel bug from source)",
    "Controlled+uncontrolled open state from v0.1 (open / defaultOpen / onOpenChange)",
    "Programmable ariaCurrent (default 'true', overridable to 'page' / 'step' / etc.)",
    "Collapse-to-icon trigger mode for slotting into icon-only sidebars",
    "Arbitrary footerSlot — consumer drops Create / Request / Settings / sign-out anywhere",
    "Width-matches-trigger popover via --radix-popover-trigger-width",
    "Dev-warns: duplicate keys stripped; controlled↔uncontrolled transition flagged",
    "F-cross-13 pre-emption on Popover.onOpenChange from day one",
    "Domain-agnostic — zero auth/membership/router imports",
  ],
  tags: [
    "account-switcher",
    "workspace-switcher",
    "context-switcher",
    "popover",
    "combobox",
    "multi-tenant",
    "app-shell",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-23",
  updatedAt: "2026-05-23",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["popover", "separator"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["rich-sidebar"],
};
