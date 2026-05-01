# newsletter-card-01 — migration analysis

> Extraction pass for [`docs/migrations/newsletter-card-01/`](./). Filled by the assistant after reading [`original/`](./original/) + [`source-notes.md`](./source-notes.md).
>
> **Family context:** smallest of 3 sub-extractions from kasder's `NewsMagazineGrid.tsx` (siblings: `category-cloud-01`, `filter-bar-01`). All three are general-purpose patterns (no `-news-` infix) reusable across news / blog / marketing / docs. They land in pro-ui as **independent components** so `grid-layout-news-01` can later compose them via slots.

---

## Design DNA to PRESERVE

### Frame

- **Brand-tinted container** — `bg-primary/5 border border-primary/20 rounded-2xl p-6`. The 5%-tint background + 20%-tint border is the core "this is a CTA, not regular content" signal.
- **Editorial header rhythm** — serif-bold title (`text-lg font-serif font-bold text-foreground mb-2`), then muted-small body (`text-sm text-muted-foreground mb-4`), then action.

### Two source variants

1. **Inline-form** (sidebar of `NewsMagazineGrid.tsx`): `<Input placeholder="E-posta adresiniz" /> + <Button>Abone Ol</Button>` in a `flex gap-2` row. Input flexes; button is fixed-width on the right.
2. **CTA-only** (sidebar of news detail page): `<Button className="w-full">Abone Ol</Button>` — no input. Implies the click leads to a sign-up flow elsewhere.

Both variants share the frame + header + body. Only the action area differs.

### Spacing

- Outer: `rounded-2xl p-6` (consistent with magazine sidebar block)
- Title→body: `mb-2`
- Body→action: `mb-4`

---

## Structural debt to REWRITE

| # | Source | Resolution |
|---|---|---|
| 1 | Hardcoded Turkish strings (title, body, placeholder, button) | `labels?: NewsletterCardLabels` prop with English defaults |
| 2 | No `<form>` wrapping input + button — Enter doesn't submit | Wrap in `<form onSubmit={...}>`; pass `e.preventDefault()`; call user's `onSubmit(email)` |
| 3 | No `onSubmit` handler | `onSubmit?: (email: string) => void \| Promise<void>` prop. If returns Promise, internal status auto-tracks pending → success/error |
| 4 | No status states (idle / pending / success / error) | `status?: NewsletterCardStatus` (controlled) OR derived from a Promise-returning `onSubmit` (uncontrolled) |
| 5 | No success/error UI | Inline message under the action (success: muted; error: destructive). Customizable via `labels.successMessage` / `labels.errorMessage` |
| 6 | No email validation | HTML5 `type="email"` baseline + `required`. Consumer-side validation through their own state if needed |
| 7 | Two source variants live in two separate inline JSX blocks | Single component, dispatch via `variant: 'inline-form' \| 'cta-only'` (default: `inline-form`) |
| 8 | Hardcoded `bg-primary/5 border-primary/20` tint | `tone?: 'primary' \| 'accent' \| 'muted'` prop (default: `primary`); resolves to corresponding token tint |
| 9 | Heading level locked to `<h3>` | `headingAs?: 'h2' \| 'h3' \| 'h4'` prop (default: `h3`) |
| 10 | No `aria-label` on input, no `aria-live` on status, no `aria-describedby` | Add: input `aria-label={labels.emailLabel}`; status in `<div aria-live="polite">`; error `<div role="alert">` |
| 11 | Email value is uncontrolled in source (no React `useState`) | Controlled-or-uncontrolled email value: `value` + `onChange` for controlled, `defaultValue` for uncontrolled. Mirrors React input convention |
| 12 | Button-color drift from screenshot (kasder's dark-navy vs pro-ui's lime) | Pro-ui defaults to `Button` (lime primary). Consumers wanting a different color use `buttonClassName` slot |

---

## Dependency audit

### Keep
- `react`
- `@/components/ui/input` (shadcn — already shipped)
- `@/components/ui/button` (shadcn — already shipped)
- `@/lib/utils` (`cn`)

### Drop
- N/A — newsletter card has no link in source.

### Add
- None. The card uses only existing pro-ui primitives.

---

## Dynamism gaps

| Gap | Resolution | Default |
|---|---|---|
| Hardcoded copy | `labels` object | English defaults |
| Action: form vs button | `variant` prop | `'inline-form'` |
| Tint color | `tone` prop | `'primary'` |
| Heading level | `headingAs` prop | `'h3'` |
| Email value | controlled `value` + `onChange` OR uncontrolled `defaultValue` | uncontrolled |
| Submit handler | `onSubmit` callback | none — required for interactive use |
| Status | `status` prop (controlled) OR derived from `onSubmit` returning Promise | derived |
| Status messages | `labels.successMessage` / `labels.errorMessage` | English defaults |
| Frame override | `className` slot | per-tone default |
| Button override | `buttonClassName` slot | none |

---

## Optimization gaps

- Component is small; no virtualization / memoization concerns.
- `React.memo` wrap on root for parity with content-card-news-01 (cheap, prevents re-renders if parent updates rapidly).

---

## Accessibility gaps

| Gap | Resolution |
|---|---|
| No `<form>` wrapping | Real `<form onSubmit>` so Enter submits |
| Input has no label | `aria-label` from `labels.emailLabel` |
| Status not announced | `aria-live="polite"` on status region; `role="alert"` on error |
| Button has no `aria-busy` during submit | `aria-busy={status === 'pending'}` on the Button |
| Heading level locked | `headingAs` prop |

WCAG 2.1 AA target.

---

## Proposed procomp scope

**Single component, sealed-folder, 2 variant parts.** Mirrors content-card-news-01 structure but smaller.

```
src/registry/components/marketing/newsletter-card-01/
├── newsletter-card-01.tsx     # root: variant dispatch + form state + memoization
├── parts/
│   ├── inline-form.tsx        # variant='inline-form' (input + button)
│   └── cta-only.tsx           # variant='cta-only' (button only)
├── types.ts                   # NewsletterCardProps, Labels, Status
├── dummy-data.ts              # demo defaults
├── demo.tsx                   # 4-tab demo
├── usage.tsx                  # consumer guide
├── meta.ts                    # ComponentMeta
└── index.ts                   # public exports
```

**File count:** 9. Smallest pro-component in the registry so far.

**Category:** `marketing` — first entry; unblocks future hero/testimonial/feature-grid components.

**Demo plan:** 4 tabs:
1. **Inline form** — default variant; demo wires `onSubmit` to a fake 1s setTimeout to show pending → success.
2. **CTA only** — button-only variant.
3. **Custom labels** — same component with Turkish labels (validates the i18n surface).
4. **Error state** — fake `onSubmit` that rejects to show the error message.

---

## Recommendation

**PROCEED.** Migration is small, well-scoped, low-risk:

- 2-variant set captures both source instances cleanly.
- 12 numbered rewrite items, each with a concrete resolution.
- Zero new dependencies.
- 9 files. First `marketing` category entry.
- Async-submit pattern (Promise-returning `onSubmit` → status auto-tracking) is reusable for future form-card patterns.

### Risks

1. **Status UX scope creep** — pending/success/error states grow the surface (messages, ARIA, button disabled). Mitigated by keeping status optional + auto-derived.
2. **`bg-primary/5` legibility on dark mode** — visual smoke test needed; spec calls for it but not yet verified.

**Sign-off recorded 2026-05-01.** Proceeding to procomp gate.
