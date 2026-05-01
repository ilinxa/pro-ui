# newsletter-card-01 — procomp guide

> Stage 3.

## When to use

- Marketing landing pages, blog sidebars, docs footers, content hubs — anywhere you want an email-capture CTA.
- When you need a brand-tinted block visually distinct from regular content cards.
- When you want consistent async-aware UX (pending → success/error) without writing it from scratch.

## When NOT to use

- **Multi-field signup forms** — use a custom form. This card is "drop email + go".
- **Inline opt-in checkboxes / preference toggles** — out of scope.
- **Modal / takeover signup flows** — wrap a custom form in your own Dialog.
- **Anonymous beacon CTAs without email capture** — use the `cta-only` variant if you want a button-only card; for non-card affordances use a plain `<Button>`.

## Composition patterns

### Async submission with auto-tracking

```tsx
<NewsletterCard01
  onSubmit={async (email) => {
    await api.subscribe(email);
  }}
/>
```

A Promise-returning `onSubmit` auto-tracks status: `idle → pending → success` (or `error`). The card disables the input + button during pending and shows the appropriate status message.

### Controlled status (external mutation library)

```tsx
const mutation = useMutation(...);

<NewsletterCard01
  status={mutation.isPending ? "pending" : mutation.isSuccess ? "success" : mutation.isError ? "error" : "idle"}
  onSubmit={(email) => mutation.mutate(email)}
/>
```

### Controlled email value

For form libraries (React Hook Form, Tanstack Form), drive the email value externally:

```tsx
<NewsletterCard01
  value={form.email}
  onChange={(email) => form.setEmail(email)}
  onSubmit={form.submit}
/>
```

### CTA-only variant (button-only)

```tsx
<NewsletterCard01
  variant="cta-only"
  labels={{ button: "Sign up" }}
  onSubmit={() => router.push("/signup")}
/>
```

The `cta-only` variant fires `onSubmit('')` (empty string) since no email is captured here. Use it for "open signup flow elsewhere" patterns.

## Gotchas

### Promise vs void onSubmit

If `onSubmit` returns void (sync), status doesn't auto-track and stays `idle`. To get pending/success/error UX, your handler MUST return a Promise. Wrap synchronous logic in `Promise.resolve()` if needed.

### Status `disabled` cascades

While `status === 'pending'`, both the input and button are disabled. If you need a different disabled behavior (e.g. always-disabled preview mode), the v0.1 API doesn't support it — defer to v0.2 or wrap the card.

### Tone color in dark mode

`bg-primary/5` is calibrated for light mode. In dark mode, the lime primary lifts to `oklch(0.86 0.18 132)` and `/5` opacity reads as a subtle yellow-green tint. The `border-primary/20` border keeps the frame visible. Visually verify both modes during your QA pass.

### Re-submission while pending

The Button is disabled during pending so a click can't double-fire. But the Enter key in the input fires the form's submit handler regardless of disabled state — the `handleSubmit` wrapper guards against re-entry by checking `status === 'pending'`.

## Migration notes

Supersedes the kasder `kas-social-front-v0` newsletter blocks (in `NewsMagazineGrid.tsx` sidebar + `(platform)/news/[id]/page.tsx` sidebar). The migration:

- **Preserved:** brand-tinted frame, serif headline, muted body, two visual variants.
- **Rewrote:** all Turkish strings → labels prop + English defaults; `<form>` wrapping for Enter-to-submit; controlled-or-uncontrolled state machine; async-aware status with ARIA semantics; `tone` prop for variations.
- **Added:** success/error status messages; three-tone palette; controlled status; aria-live + role=alert + aria-busy.

Originals at [`docs/migrations/newsletter-card-01/original/`](../../migrations/newsletter-card-01/original/).

## Open follow-ups

- v0.2: `disabled` prop for read-only preview mode.
- v0.2: alternate variant with name + email (multi-field).
- v0.2: success-replaces-card option (the card transforms into a thank-you state instead of showing inline message).
- v0.3: built-in email-validation regex prop (today: HTML5 `type="email"` only).
