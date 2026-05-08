import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "registration-card-01",
  name: "Registration Card 01",
  category: "data",

  description:
    "Card-framed registration status display — capacity progress + spots-left counter + status-aware primary CTA + optional share / actions slot. 4-state state machine (open / lastSpots / full / closed). Public helper kernel for status reuse outside the card.",
  context:
    "Use for event registration sidebars, course / webinar signup cards, training enrollment, conference tickets, beta / waitlist signups, fundraising goal cards. Architecturally independent of event timing — host owns date logic and passes `closed: true` when registration window has ended. Migration origin: kasder kas-social-front-v0 events/[id]/page.tsx Kayıt Durumu sidebar card. Composes naturally with event-card-01 helpers + share-bar-01 in the actions slot.",
  features: [
    "4-state state machine — open / lastSpots / full / closed",
    "Public helper kernel — deriveRegistrationStatus pure function",
    "Capacity progress bar + spots-left counter with destructive-color threshold",
    "Status-aware primary CTA (Register / Sold out / Closed / Unavailable)",
    "Default share button when onShare provided",
    "actions slot fully replaces the default share for richer clusters",
    "No-quota mode (capacity-less events) hides bar + counter rows",
    "Configurable thresholds — lastSpotsRatio (state machine) + urgentSpotsCount (counter color)",
    "statusOverride for preview / what-if states",
    "Optional heading with configurable level (h2/h3/h4, default h3)",
    "Frame toggle — framed=true card chrome with shadow-lg / framed=false bare",
    "i18n via 11-key labels object",
    "WCAG — Radix Progress role=progressbar + aria-valuenow + section aria-labelledby",
    "Architecturally INDEPENDENT of event-card-01's date-driven state machine (host composes)",
  ],
  tags: ["registration-card-01", "registration", "signup", "rsvp", "events"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["progress"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["event-card-01", "progress-timeline-01", "share-bar-01"],
};
