# `empty-state` — guide (Stage 3)

## When to use / when NOT to use

Use for any surface whose data set can be absent: empty tables/lists, zero search results, failed
fetches, offline, permission walls, first-run onboarding. The HOST detects the condition;
`EmptyState` only renders the answer. Do NOT use it as a loader (no spinner semantics), as an
error boundary, or as a real dropzone — `frame="dashed"` is a visual treatment only; wire actual
drag-and-drop with the future `media/dropzone` component.

## Composition patterns

- **Search-empty inside a data host:** `variant="search" size="sm"` in the table/grid body;
  primary action resets the host's filters.
- **Full-page walls:** `variant="permission" | "error"` with `size="lg"`, `headingLevel={1|2}` so
  the page outline stays honest.
- **First-run:** `variant="first-use"` (or `media` with your illustration) + primary CTA;
  the dashed decorative ring is variant-supplied, no config needed.
- **Read-only:** omit `action`/`secondaryAction` — the actions row (and every button/anchor)
  is absent from the DOM.
- **Action forms:** object `{ label, onClick | href, disabled }` covers the 90% case
  (`href` renders a `buttonVariants`-styled `<a>` — no `asChild`); pass a ReactNode for full
  control (async states, tooltips, menus).

## Gotchas

- `action={cond && {…}}` is safe: `false`/`""` are swallowed, the row does not mount.
- `media` replaces the icon tile entirely AND is NOT `aria-hidden` — you own its semantics:
  give a meaningful illustration alt text, or `alt=""`/`aria-hidden` it yourself if decorative.
- `role="status"`/`aria-live="polite"` apply only to `search`/`error`/`offline` (transient
  variants). Don't mount those variants statically at page load or AT will announce them.
- Entrance animation uses tw-animate-css utilities with inline `animation-fill-mode: both`
  (staggered elements would flash without it). `animated={false}` removes all of it; reduced
  motion is respected via `motion-safe:`.
- Copy is yours — variants change tone/iconography only, they ship no default text (i18n).

## Migration notes

None — first component of its kind here. `detail-panel` keeps its internal
`DetailPanelEmptyState` (panel-scoped); no cross-dependency in either direction.

## Open follow-ups

- None at v0.1.0 beyond review follow-ups (see `reviews/2026-08-12-v0.1.0-spotcheck.md`).
