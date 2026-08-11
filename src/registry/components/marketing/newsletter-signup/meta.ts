import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "newsletter-signup",
  name: "Newsletter Signup",
  category: "marketing",

  description:
    "Newsletter signup card — inline email form or CTA-only variant, async status tracking, three tones, full i18n.",
  context:
    "First component in the marketing category. Drop-in CTA for sidebars / footers / heroes asking visitors to subscribe to a newsletter. Two source variants captured: inline-form (input + button, magazine-grid sidebar) and cta-only (button-only, news-detail-page sidebar). Form state is controlled-or-uncontrolled (mirrors React input convention); status is controlled-or-derived from a Promise-returning onSubmit. Migration origin: kasder kas-social-front-v0 NewsMagazineGrid.tsx + (platform)/news/[id]/page.tsx sidebar blocks. Composed by `magazine-layout` and `detail-page-news-01` in the news-domain family.",
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
  tags: ["newsletter-signup", "marketing", "cta", "form", "subscribe", "migration"],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "input"],
    npm: {},
    internal: [],
  },

  related: ["news-card"],
};
