import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "info-list-01",
  name: "Info List 01",
  category: "data",

  description:
    "Card-framed icon-prefixed details list — vertical rows of icon + primary + optional secondary + optional action. Two variants (comfortable / compact), polymorphic per-row link, frame toggle, separator toggle, custom renderItem slot.",
  context:
    "Use for sidebar info cards on detail pages — Event Details, Contact, Address, Account Settings, Product Specs, Restaurant Info, Listing Attributes. Comfortable variant: stacked primary/secondary/action rows with separators (kasder Etkinlik Bilgileri pattern). Compact variant: inline single-line rows, no separators (kasder İletişim pattern). Migration origin: kasder kas-social-front-v0 events/[id]/page.tsx Etkinlik Bilgileri + İletişim sidebar cards.",
  features: [
    "Two variants — comfortable (stacked, separators, w-5 primary icon) and compact (inline, no separators, w-4 muted icon)",
    "Required icon + primary; optional secondary + action + href per item",
    "Polymorphic per-row link via linkComponent (default 'a') — works with tel: / mailto: / etc.",
    "Frame toggle (framed=true card chrome / framed=false bare)",
    "Separator toggle (auto-defaults per variant; overridable)",
    "Custom renderItem slot for full row takeover",
    "Optional section heading with configurable level (h2/h3/h4)",
    "Soft-failure on optional fields",
    "Empty state slot + labels.emptyText fallback",
    "i18n via labels object",
    "<ul role='list'> semantics + section aria-labelledby",
    "Compact variant intentionally ignores secondary + action (documented limitation)",
  ],
  tags: ["info-list-01", "details", "info", "list", "sidebar"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["thumb-list-01", "schedule-list-01", "article-meta-01"],
};
