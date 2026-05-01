# newsletter-card-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [description](./newsletter-card-01-procomp-description.md) for what & why.
>
> **Migration origin:** [`docs/migrations/newsletter-card-01/`](../../migrations/newsletter-card-01/) — see [`analysis.md`](../../migrations/newsletter-card-01/analysis.md) for design DNA + 12 numbered rewrite items.

## Final API

```ts
// types.ts

export type NewsletterCardVariant = 'inline-form' | 'cta-only';

export type NewsletterCardTone = 'primary' | 'accent' | 'muted';

export type NewsletterCardStatus = 'idle' | 'pending' | 'success' | 'error';

export type NewsletterCardHeadingLevel = 'h2' | 'h3' | 'h4';

export interface NewsletterCardLabels {
  /** Headline. Default: 'Join our newsletter'. */
  title?: string;
  /** Body / description. Default: 'Latest updates, straight to your inbox.'. */
  body?: string;
  /** Email input placeholder. Default: 'Email address'. */
  placeholder?: string;
  /** Email input aria-label. Default: 'Email address'. */
  emailLabel?: string;
  /** Button text. Default: 'Subscribe'. */
  button?: string;
  /** Success message. Default: "Thanks! You're subscribed.". */
  successMessage?: string;
  /** Error message. Default: 'Something went wrong. Please try again.'. */
  errorMessage?: string;
}

export interface NewsletterCardProps {
  /** Visual variant. Default: 'inline-form'. */
  variant?: NewsletterCardVariant;

  /** Color tint. Default: 'primary'. */
  tone?: NewsletterCardTone;

  /** Heading semantic level. Default: 'h3'. */
  headingAs?: NewsletterCardHeadingLevel;

  // ─── Form state ────────────────────────────────────────────────
  /** Controlled email value. */
  value?: string;
  /** Uncontrolled initial email value. */
  defaultValue?: string;
  /** Email change callback. */
  onChange?: (value: string) => void;

  // ─── Submission ────────────────────────────────────────────────
  /** Submit handler. Return Promise to auto-track status. */
  onSubmit?: (email: string) => void | Promise<void>;

  // ─── Status ────────────────────────────────────────────────────
  /** Controlled status. If omitted, derives from onSubmit's return. */
  status?: NewsletterCardStatus;
  /** Status change callback (fires when internal status changes). */
  onStatusChange?: (status: NewsletterCardStatus) => void;

  // ─── i18n ──────────────────────────────────────────────────────
  labels?: NewsletterCardLabels;

  // ─── Theming ───────────────────────────────────────────────────
  className?: string;
  buttonClassName?: string;

  // ─── a11y ──────────────────────────────────────────────────────
  /** Override headline ID (used for aria-describedby on body). Default: useId(). */
  id?: string;
}
```

## File-by-file plan

```
src/registry/components/marketing/newsletter-card-01/
├── newsletter-card-01.tsx     # 1
├── parts/
│   ├── inline-form.tsx        # 2
│   └── cta-only.tsx           # 3
├── types.ts                   # 4
├── dummy-data.ts              # 5
├── demo.tsx                   # 6
├── usage.tsx                  # 7
├── meta.ts                    # 8
└── index.ts                   # 9
```

### 1. `newsletter-card-01.tsx` — root

- `"use client"` (uses hooks).
- Wrapped in `React.memo`.
- Computes default values for all optional props.
- Owns the email value state (uncontrolled) — `useState(defaultValue ?? '')`.
- Owns the status state (auto-derived) — `useState<NewsletterCardStatus>('idle')`.
- Resolves controlled-vs-uncontrolled email (consumer's `value` wins).
- Resolves controlled-vs-derived status.
- Defines `handleSubmit(e)`:
  - `e.preventDefault()`.
  - `setInternalStatus('pending')`.
  - `try { await onSubmit?.(email); setInternalStatus('success'); } catch { setInternalStatus('error'); }`.
- Computes `tonalClasses` from `tone` prop (frame + heading-tint).
- Computes resolved `labels` (merges user labels with defaults).
- Dispatches to `parts/inline-form.tsx` or `parts/cta-only.tsx`.

### 2. `parts/inline-form.tsx`

- `<div role="region" aria-labelledby={titleId} className={cn(toneClasses.frame, className)}>`
  - `<HeadingTag id={titleId} className={cn(toneClasses.heading, "text-lg font-serif font-bold mb-2")}>{labels.title}</HeadingTag>`
  - `<p id={bodyId} className="text-sm text-muted-foreground mb-4">{labels.body}</p>`
  - `<form onSubmit={handleSubmit} className="flex gap-2">`
    - `<Input type="email" required value={email} onChange={...} placeholder={labels.placeholder} aria-label={labels.emailLabel} aria-describedby={bodyId} aria-invalid={status === 'error'} className="flex-1" />`
    - `<Button type="submit" disabled={status === 'pending'} aria-busy={status === 'pending'} className={buttonClassName}>{labels.button}</Button>`
  - `</form>`
  - Status region: `<StatusMessage status={status} labels={labels} />`

### 3. `parts/cta-only.tsx`

- Same frame + heading + body.
- Replace `<form>` with `<Button onClick={() => onSubmit?.('')} className="w-full">{labels.button}</Button>`. (CTA-only fires onSubmit with empty string — semantic "user clicked CTA"; consumer handles the rest.)
- Status region same as inline-form.

### 4. `types.ts`

Already shown above.

### 5. `dummy-data.ts`

```ts
export const NEWSLETTER_CARD_DEMO_LABELS_TR = {
  title: "Bültenimize Katılın",
  body: "En güncel haberleri e-posta ile alın.",
  placeholder: "E-posta adresiniz",
  button: "Abone Ol",
  successMessage: "Teşekkürler! Aboneliğiniz tamamlandı.",
  errorMessage: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
};
```

Used by the "Custom labels" demo tab to validate i18n.

### 6. `demo.tsx`

4-tab demo:
1. **Inline form** — fake `onSubmit` with `setTimeout(resolve, 1000)` to show pending → success.
2. **CTA only** — alerts "Open signup modal" on click.
3. **Custom labels** — same as #1 with Turkish labels imported from `dummy-data`.
4. **Error state** — fake `onSubmit` with `setTimeout(reject, 800)` to show pending → error.

### 7. `usage.tsx`

Code blocks: minimal, custom labels, both variants, controlled vs uncontrolled value, custom tone.

### 8. `meta.ts`

```ts
{
  slug: 'newsletter-card-01',
  name: 'Newsletter Card 01',
  category: 'marketing',
  status: 'alpha',
  version: '0.1.0',
  description: 'Brand-tinted CTA card with email signup — inline-form or cta-only variant, controlled-or-uncontrolled email value, async-aware status tracking, full i18n.',
  // ...
}
```

### 9. `index.ts`

```ts
export { NewsletterCard01, default } from './newsletter-card-01';
export type {
  NewsletterCardLabels,
  NewsletterCardProps,
  NewsletterCardStatus,
  NewsletterCardTone,
  NewsletterCardVariant,
} from './types';
export { meta } from './meta';
```

---

## Dependencies

### Internal (pro-ui)
- `@/components/ui/input`
- `@/components/ui/button`
- `@/lib/utils` (`cn`)

### NPM
- `react`

### No new deps.

---

## Composition pattern

**Headless wrapping + presentational parts.** Root owns the form state machine; parts are stateless renderers receiving resolved props.

`HeadingTag = headingAs ?? 'h3'` resolved at the root for semantic control.

**No render-props, no compound API.** The 2-variant set is small enough that variant dispatch is sufficient.

---

## Client vs server

**Client component** — `"use client"` directive required because of `useState` (form state, status), `useId` (heading IDs), `useCallback` (handleSubmit), `React.memo`. Consistent with other pro-ui form components.

---

## Edge cases

| Case | Behavior |
|---|---|
| `onSubmit` not provided | Form renders but submit does nothing (no handler called); status stays `idle`. Useful for demo / preview. |
| `onSubmit` returns void (sync) | Status stays `idle` after submit. No auto-tracking. Consumer can drive status via the `status` prop if they want feedback. |
| `onSubmit` returns Promise | Status auto-tracks: `idle → pending → success` (resolve) or `idle → pending → error` (reject). |
| `status` prop provided | Overrides internal auto-tracking. Consumer fully drives. |
| Email value uncontrolled, no `defaultValue` | Empty string. |
| Email is empty + form submitted | HTML5 `required` blocks; browser shows native validation message. |
| Invalid email format | HTML5 `type="email"` blocks; browser shows native validation message. |
| `cta-only` variant + click | `onSubmit('')` fires; status auto-tracks if Promise. |
| Long email (200+ chars) | Input scrolls; no truncation. |
| Long button label | Button grows; row stays in single line via `flex gap-2 flex-1` on input. On very narrow viewports (~240px) the button may push down — acceptable. |
| RTL | `flex gap-2` reverses; otherwise no special handling. |
| Reduced motion | No motion in this component (no transitions on submit; status messages are instant). N/A. |

---

## Accessibility

- **`<form>` wrapping** — Enter in input submits.
- **Heading semantic level** via `headingAs` prop (default h3).
- **`aria-labelledby` / `aria-describedby`** wiring between heading, body, and the form-region.
- **Status region** — `aria-live="polite"` for success; `role="alert"` for error.
- **Button `aria-busy`** during pending.
- **Input `aria-invalid`** when status is error.
- **Focus management** — no focus stealing; native form submit behavior.

WCAG 2.1 AA target.

---

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean.
- [ ] `pnpm lint` clean.
- [ ] `pnpm build` clean — all routes prerendered including `/components/newsletter-card-01`.
- [ ] SSR returns 200 with all 4 demo tabs rendered.
- [ ] `/components` index lists the new entry.
- [ ] Visual sanity: brand tint visible in light + dark mode; form submits on Enter; status renders correctly.

---

## Risks & alternatives

### Risk 1: Status auto-tracking timing

If `onSubmit` resolves very quickly (e.g. < 50ms), the user may not see the pending state. **Acceptable** — fast network is a feature, not a bug. Consumers wanting forced delay add their own `await new Promise(r => setTimeout(r, 200))`.

### Risk 2: Form re-submission while pending

If a user clicks Subscribe twice quickly, the `disabled` Button blocks the second click. But if they hit Enter twice in the input, the form may submit twice. **Mitigation:** also disable the input during pending, OR wrap `handleSubmit` in a guard checking current status.

### Risk 3: Promise rejection silenced

`try/await/catch` silences the rejection — consumer's logging won't see it unless they re-throw. **Mitigation:** call `onSubmit` outside try, then `.catch(() => setStatus('error'))` — preserves the rejection for the consumer's chain.

### Alternatives considered

1. **Compound API** (`<NewsletterCard.Header>`, `<NewsletterCard.Body>`, `<NewsletterCard.Action>`). Rejected — too rigid for the small variant set; the 2 variants barely justify a single-variant prop.
2. **Three variants** (add `with-name-field` for name + email). Rejected — multi-field signup is out of v0.1 scope per description.
3. **Internal email validation** with a regex prop. Rejected — HTML5 baseline is sufficient; consumers wanting more bring Zod.
