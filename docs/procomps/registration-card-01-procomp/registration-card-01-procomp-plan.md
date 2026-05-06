# registration-card-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`registration-card-01-procomp-description.md`](./registration-card-01-procomp-description.md) for the what & why.

## Final API

### Public types

```ts
// src/registry/components/data/registration-card-01/types.ts

import type { ReactNode } from "react";
import type {
  RegistrationStatus,
} from "./lib/registration-status";

export type { RegistrationStatus };

export interface RegistrationCard01Labels {
  /** Default: "Capacity". Top-row left label above the bar. */
  capacityLabel?: ReactNode;
  /** Default: "spots left". Counter suffix when spots remain. */
  spotsLeftSuffix?: string;
  /** Default: "Sold out". Counter text when capacity reached. */
  spotsLeftFull?: string;
  /** Default: "registered". Bottom-row left counter suffix. */
  registeredSuffix?: string;
  /** Default: "capacity". Bottom-row right counter suffix. */
  capacitySuffix?: string;
  /** Default: "Register". Primary CTA when registration is open. */
  ctaRegister?: string;
  /** Default: "Sold out". Primary CTA when status === 'full'. */
  ctaSoldOut?: string;
  /** Default: "Closed". Primary CTA when status === 'closed'. */
  ctaClosed?: string;
  /** Default: "Registration unavailable". Primary CTA when no onRegister provided. */
  ctaUnavailable?: string;
  /** Default: "Share". Secondary share button label (when default share is rendered). */
  ctaShare?: string;
  /** aria-label on the progress bar. Default: "Registration capacity". */
  ariaLabel?: string;
}

export interface RegistrationCard01Props {
  /** Total seats / units. Optional — when absent, no-quota mode (bar hidden). */
  capacity?: number;
  /** Currently registered count. Optional — when absent, no-quota mode. */
  registered?: number;
  /** Explicitly close registration regardless of capacity. Default: false. */
  closed?: boolean;

  /** Override the auto-derived state. Rare — for preview / what-if. */
  statusOverride?: RegistrationStatus;

  // ─── Thresholds ─────────────────────────────────────────────────
  /** Percent (0–1) of capacity at which status flips to 'lastSpots'. Default: 0.8. */
  lastSpotsRatio?: number;
  /** Absolute spots-left count at which the counter color flips to text-destructive. Default: 10. */
  urgentSpotsCount?: number;

  // ─── Heading ─────────────────────────────────────────────────────
  /** Optional section heading. */
  heading?: string;
  /** Heading semantic level. Default: 'h3'. */
  headingAs?: "h2" | "h3" | "h4";

  // ─── Visual ──────────────────────────────────────────────────────
  /** Wrap in card chrome (`bg-card rounded-2xl p-6 border shadow-lg`). Default: true. */
  framed?: boolean;

  // ─── Actions ─────────────────────────────────────────────────────
  /** Primary CTA click handler. Optional — when omitted, CTA renders as disabled with `ctaUnavailable` label. */
  onRegister?: () => void;
  /** Default share-button click handler. When provided + `actions` NOT provided, renders an outline Share button. */
  onShare?: () => void;
  /** Custom action(s) slot — fully replaces the default share button. */
  actions?: ReactNode;

  /** Localized labels. */
  labels?: RegistrationCard01Labels;

  // ─── Style overrides ─────────────────────────────────────────────
  className?: string;
  headingClassName?: string;
  barClassName?: string;
  ctaClassName?: string;
}

/** Default English labels. */
export const DEFAULT_REGISTRATION_CARD_LABELS: Required<RegistrationCard01Labels> = {
  capacityLabel: "Capacity",
  spotsLeftSuffix: "spots left",
  spotsLeftFull: "Sold out",
  registeredSuffix: "registered",
  capacitySuffix: "capacity",
  ctaRegister: "Register",
  ctaSoldOut: "Sold out",
  ctaClosed: "Closed",
  ctaUnavailable: "Registration unavailable",
  ctaShare: "Share",
  ariaLabel: "Registration capacity",
};
```

### Public helper kernel

```ts
// src/registry/components/data/registration-card-01/lib/registration-status.ts

export type RegistrationStatus = "open" | "lastSpots" | "full" | "closed";

export interface DeriveRegistrationStatusOptions {
  capacity?: number;
  registered?: number;
  closed?: boolean;
  /** Default: 0.8 (80% of capacity). */
  lastSpotsRatio?: number;
}

/**
 * Pure function. Derives registration status from capacity + registered + closed flag.
 *
 * - `closed: true` always returns "closed"
 * - capacity / registered missing → "open" (no-quota mode)
 * - registered >= capacity → "full"
 * - registered/capacity >= lastSpotsRatio → "lastSpots"
 * - otherwise → "open"
 */
export function deriveRegistrationStatus(
  opts: DeriveRegistrationStatusOptions,
): RegistrationStatus;
```

### Exported names

```ts
// index.ts
export { default as RegistrationCard01 } from "./registration-card-01";
export type {
  RegistrationCard01Props,
  RegistrationCard01Labels,
  RegistrationStatus,
} from "./types";
export { DEFAULT_REGISTRATION_CARD_LABELS } from "./types";
export {
  deriveRegistrationStatus,
  type DeriveRegistrationStatusOptions,
} from "./lib/registration-status";
export { meta } from "./meta";
```

## File-by-file plan

8 files. Sealed-folder.

```
src/registry/components/data/registration-card-01/
├── registration-card-01.tsx         # 1 — root
├── lib/
│   └── registration-status.ts       # 2 — public kernel
├── types.ts                         # 3
├── dummy-data.ts                    # 4
├── demo.tsx                         # 5
├── usage.tsx                        # 6
├── meta.ts                          # 7
└── index.ts                         # 8
```

### 1. `registration-card-01.tsx` — root

- `"use client"` directive.
- `React.memo` at export.
- Resolves defaults (`closed ?? false`, `framed ?? true`, `headingAs ?? "h3"`, `lastSpotsRatio ?? 0.8`, `urgentSpotsCount ?? 10`).
- `headingId` via `useId` (only used when heading present).
- Derives state via `useMemo` — `effectiveStatus = statusOverride ?? deriveRegistrationStatus({ capacity, registered, closed, lastSpotsRatio })`.
- Computes:
  - `hasQuota = capacity != null && registered != null`
  - `spotsLeft = hasQuota ? capacity - registered : null`
  - `percent = hasQuota ? (registered / capacity) * 100 : 0`
  - `isUrgent = hasQuota && spotsLeft != null && spotsLeft <= urgentSpotsCount && spotsLeft > 0`
- CTA dispatch:
  ```ts
  function getCtaConfig(status, hasOnRegister, labels) {
    if (!hasOnRegister) return { label: labels.ctaUnavailable, variant: "secondary" as const, disabled: true };
    if (status === "full")    return { label: labels.ctaSoldOut,     variant: "secondary" as const, disabled: true };
    if (status === "closed")  return { label: labels.ctaClosed,      variant: "secondary" as const, disabled: true };
    return { label: labels.ctaRegister, variant: "default" as const, disabled: false };
  }
  ```
- Renders:
  ```tsx
  <section
    aria-labelledby={heading ? headingId : undefined}
    className={cn(
      framed && "bg-card rounded-2xl p-6 border border-border/50 shadow-lg",
      className,
    )}
  >
    {heading && (
      <HeadingTag id={headingId} className={cn("text-lg font-semibold text-foreground mb-4", headingClassName)}>
        {heading}
      </HeadingTag>
    )}

    {hasQuota && (
      <div className={cn("mb-6", barClassName)}>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">{labels.capacityLabel}</span>
          <span className={cn("font-medium", isUrgent ? "text-destructive" : "text-foreground")}>
            {spotsLeft != null && spotsLeft > 0
              ? `${spotsLeft} ${labels.spotsLeftSuffix}`
              : labels.spotsLeftFull}
          </span>
        </div>
        <Progress value={percent} className="h-3" aria-label={labels.ariaLabel} />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{registered} {labels.registeredSuffix}</span>
          <span>{capacity} {labels.capacitySuffix}</span>
        </div>
      </div>
    )}

    <Button
      className={cn("w-full", ctaClassName)}
      size="lg"
      variant={cta.variant}
      disabled={cta.disabled}
      onClick={cta.disabled ? undefined : onRegister}
    >
      {cta.label}
    </Button>

    {actions ? (
      <div className="mt-3">{actions}</div>
    ) : onShare ? (
      <Button variant="outline" className="w-full mt-3 gap-2" onClick={onShare}>
        <Share2 aria-hidden="true" className="w-4 h-4" />
        {labels.ctaShare}
      </Button>
    ) : null}
  </section>
  ```

### 2. `lib/registration-status.ts` — public kernel

```ts
export type RegistrationStatus = "open" | "lastSpots" | "full" | "closed";

export interface DeriveRegistrationStatusOptions {
  capacity?: number;
  registered?: number;
  closed?: boolean;
  lastSpotsRatio?: number;
}

export function deriveRegistrationStatus(
  opts: DeriveRegistrationStatusOptions,
): RegistrationStatus {
  if (opts.closed === true) return "closed";

  const { capacity, registered } = opts;
  if (capacity == null || registered == null) return "open";

  if (registered >= capacity) return "full";

  const ratio = capacity === 0 ? 1 : registered / capacity;
  const threshold = opts.lastSpotsRatio ?? 0.8;
  if (ratio >= threshold) return "lastSpots";

  return "open";
}
```

Pure JS. No React imports. Tree-shakeable. Public.

### 3. `types.ts`

All public types (shown above).

### 4. `dummy-data.ts`

```ts
export const dummyRegistrationOpen = {
  capacity: 500,
  registered: 142,
};

export const dummyRegistrationLastSpots = {
  capacity: 500,
  registered: 423, // 84.6% — triggers lastSpots
};

export const dummyRegistrationUrgent = {
  capacity: 100,
  registered: 95, // 5 spots left — triggers urgent (destructive color)
};

export const dummyRegistrationFull = {
  capacity: 50,
  registered: 50,
};

export const dummyRegistrationClosed = {
  capacity: 200,
  registered: 87,
  closed: true,
};

export const dummyRegistrationNoQuota = {
  // no capacity / no registered — open, no bar
};

export const trLabels: RegistrationCard01Labels = {
  capacityLabel: "Kontenjan",
  spotsLeftSuffix: "yer kaldı",
  spotsLeftFull: "Dolu",
  registeredSuffix: "kayıtlı",
  capacitySuffix: "kapasite",
  ctaRegister: "Hemen Kayıt Ol",
  ctaSoldOut: "Kontenjan Dolu",
  ctaClosed: "Etkinlik Sona Erdi",
  ctaUnavailable: "Kayıt yapılamıyor",
  ctaShare: "Paylaş",
  ariaLabel: "Kayıt kontenjanı",
};
```

### 5. `demo.tsx`

5-tab demo, shadcn `Tabs`:

1. **Default (TR)** — kasder Kayıt Durumu verbatim with `dummyRegistrationLastSpots` (423/500) + Turkish labels + `onRegister` console-log + `onShare` console-log
2. **All states** — 5 cards stacked: open / lastSpots / urgent (destructive count) / full / closed — each with same labels for visual comparison
3. **No-quota** — capacity-less mode with just CTA + share (no bar)
4. **Custom actions** — `actions` slot with calendar + save + share cluster (replaces default share)
5. **Bare** — `framed=false` + no heading

### 6. `usage.tsx`

Code blocks: minimal usage, all 4 states, no-quota mode, custom actions, custom thresholds, public helper kernel, fundraising-relabeled example, deterministic state for tests.

### 7. `meta.ts`

```ts
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
  dependencies: { shadcn: ["progress", "tabs"], npm: { "lucide-react": "^0.x" }, internal: [] },
  related: ["event-card-01", "progress-timeline-01", "share-bar-01"],
};
```

### 8. `index.ts`

Public exports as shown above.

## Dependencies

### Internal (pro-ui)

- `@/components/ui/progress` — already installed (event-card-01 first user)
- `@/components/ui/button` — already installed
- `@/lib/utils` — `cn()`

### NPM

- `react`
- `lucide-react` — `Share2` icon for the default share button

### Forbidden

- `next/*`, `framer-motion`, date library
- **NOT** event-card-01 — sealed-folder rule. Status concerns are independent.

## Composition pattern

Single-file root component (no `parts/` — small enough that splitting would over-engineer). Helper kernel in `lib/`. Same shape as progress-timeline-01.

## Edge cases

| Case | Behavior |
|---|---|
| `capacity == null` AND `registered == null` | No-quota mode: bar + counter rows hidden; status = "open" (or "closed" if `closed: true`); CTA + actions still render |
| `capacity != null` XOR `registered != null` (only one provided) | Treated as no-quota (both must be present for capacity logic) |
| `capacity === 0` | Treated as `full` (registered ≥ capacity = 0) |
| `registered > capacity` | Spots-left clamps to 0; status = "full"; bar at 100% |
| `closed: true` + `registered < capacity` | Status = "closed" (closed wins over capacity) |
| `closed: true` + `registered >= capacity` | Status = "closed" (still closed; not "full") |
| `onRegister` not provided | CTA renders disabled with `ctaUnavailable` label; `aria-disabled` |
| `onRegister` provided + status=`full`/`closed` | CTA renders disabled; `onClick` is `undefined` (defensive — disabled button shouldn't fire onClick anyway) |
| `onShare` provided + `actions` provided | `actions` wins (full takeover) |
| `onShare` not provided + `actions` not provided | No secondary button row rendered |
| `lastSpotsRatio` < 0 or > 1 | No clamping; passed straight to derive function. Documented edge. |
| `urgentSpotsCount` negative | Counter never flips destructive (reasonable; `spotsLeft <= -1` is impossible). |
| Heading missing | Section has no `aria-labelledby`; no heading element |
| `framed: false` | Card chrome dropped; section renders naked |
| `statusOverride` provided | Wins over derived status; affects CTA label + variant + disabled |
| RTL | Counter rows are `flex justify-between` — correct in RTL; no directional icons in default content |

## Accessibility

- Wraps `<section aria-labelledby={headingId}>` when heading is supplied; heading id from `useId`.
- Inner Radix `Progress` renders `role="progressbar"` + `aria-valuemin=0` / `aria-valuemax=100` / `aria-valuenow={percent}`.
- `aria-label={labels.ariaLabel}` on the bar (default "Registration capacity").
- Primary CTA — shadcn Button handles `disabled` → `aria-disabled` automatically.
- Share2 icon `aria-hidden`; share button accessible-name = `labels.ctaShare`.
- Heading level: `h3` default (this is a sidebar card, typically nested under the page's main `h2`).
- Counter rows are `<span>` text (no `<dl>` semantics — the data is informal label/value, not a definition list).

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean (1 pre-existing rich-card warning OK)
- [ ] `pnpm build` clean — `/components/registration-card-01` prerendered
- [ ] SSR returns 200 with all 5 demo tab triggers
- [ ] `/components` index lists the new entry
- [ ] All 5 states demo renders different visuals (CTA label/variant/disabled differs across states)
- [ ] Helper-only import works: `import { deriveRegistrationStatus } from "@/registry/components/data/registration-card-01"` typechecks without React imports

## Risks & alternatives

### Risk 1: Sealed-folder rule means `EVENT_STATUS_CONFIG` from event-card-01 isn't reusable here

The kasder source uses event-card-01's status to derive the registration CTA. Pro-comp can't import across components. **Mitigation:** registration-card-01 has its own simpler 4-state machine; host integrates the two at page level (passes `closed: getEventStatus(event) === "expired"` etc.). Documented in description. The two state machines have different concerns — event lifecycle vs registration window — and separating them is architecturally cleaner.

### Risk 2: Default share button might be too narrow for some consumers

The default ships ONE outline button with `Share2` icon + "Share" label. Consumers wanting Twitter / LinkedIn / WhatsApp / Email shares need `actions` slot with `share-bar-01`. **Mitigation:** documented + the actions slot is the explicit escape hatch; share-bar-01 is one of the related components.

### Risk 3: `onRegister` undefined renders as "Registration unavailable" — might surprise

Consumers building admin / preview UIs without a real handler get this fallback. **Mitigation:** `ctaUnavailable` label is overridable; consumers who want the CTA fully hidden can use `actions` slot with their own button.

### Risk 4: `closed` boolean might not capture all close-reasons

Future consumers might want different copy for "expired" vs "manually closed" vs "scheduled close." **Mitigation:** v0.2 candidate — accept `closedReason: string` to drive an alternate label. v0.1 ships with one boolean + `ctaClosed` label override per consumer context.

### Alternatives considered

1. **Cross-import event-card-01's `EVENT_STATUS_CONFIG`** — rejected (sealed-folder rule).
2. **Merge into event-card-01 as a "registration variant"** — rejected (different layout, different interaction model — separate component is honest).
3. **Required `onRegister` prop** — rejected; preview/admin contexts want to render the card without a real handler.
4. **Compound API** (`<RegistrationCard.Bar />` / `<RegistrationCard.CTA />`) — rejected; data-driven props are simpler for the 99% case.
5. **Generic over event shape** — rejected; the props ARE the input, no need for a generic type parameter.
6. **Built-in `setInterval` for live capacity polling** — rejected; consumer owns data layer.

## Open follow-ups (post v0.1)

- v0.2: `closedReason` for richer close-state context
- v0.2: built-in countdown timer for time-bound registrations (would compose `progress-timeline-01` internally? — sealed-folder forbids it; alternative: render-prop slot for countdown content)
- v0.2: optional waitlist mode (`onJoinWaitlist` callback when full)
- v0.2: tier-pricing variant for paid events (different shape, possibly a sibling component)
