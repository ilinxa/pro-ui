import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "newsletter-card-01",
  name: "Newsletter Card 01",
  category: "marketing",

  description:
    "Brand-tinted CTA card with email signup — inline-form or cta-only variant, controlled-or-uncontrolled email value, async-aware status auto-tracking, full i18n, three tones (primary / accent / muted).",
  context:
    "First component in the marketing category. Drop-in CTA for sidebars / footers / heroes asking visitors to subscribe to a newsletter. Two source variants captured: inline-form (input + button, magazine-grid sidebar) and cta-only (button-only, news-detail-page sidebar). Form state is controlled-or-uncontrolled (mirrors React input convention); status is controlled-or-derived from a Promise-returning onSubmit. Migration origin: kasder kas-social-front-v0 NewsMagazineGrid.tsx + (platform)/news/[id]/page.tsx sidebar blocks. Composed by `grid-layout-news-01` and `detail-page-news-01` in the news-domain family.",
  features: [
    "2 visual variants — inline-form (input + button) and cta-only (full-width button only)",
    "3 tones — primary (lime tint default) / accent / muted, via `tone` prop",
    "Controlled-or-uncontrolled email value (value + onChange OR defaultValue)",
    "Controlled-or-derived status — pass `status` to drive externally OR return a Promise from `onSubmit` for auto-tracking idle → pending → success/error",
    "Localizable — `labels` prop covers title / body / placeholder / button / success / error messages with English defaults",
    "Form wrapping for Enter-to-submit; button disabled + aria-busy during pending; input disabled during pending",
    "Status region uses aria-live=polite (success) and role=alert (error)",
    "Heading semantic level configurable via `headingAs` (h2 | h3 | h4)",
    "React.memo wrapped — prevents re-renders when used in long feeds",
  ],
  tags: ["newsletter-card-01", "marketing", "cta", "form", "subscribe", "migration"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "input", "tabs"],
    npm: {},
    internal: [],
  },

  related: ["content-card-news-01"],
};
