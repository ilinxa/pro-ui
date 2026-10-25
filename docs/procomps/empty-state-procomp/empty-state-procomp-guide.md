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
- **Router links (`linkComponent`):** pass your router's `Link` and object actions with an `href`
  render through it, so navigation stays client-side. It receives `href`, `onClick`, `className`
  (the `buttonVariants` styling) and the label as `children`. Default is `"a"`; without it the
  markup is a plain anchor. No `asChild`. An `href`-based link (`next/link`) works as is:
  ```tsx
  <EmptyState title="No posts yet" linkComponent={Link}
    action={{ label: "Write a post", href: "/compose" }} />
  ```
  A router whose link takes `to` (react-router, TanStack Router) needs a small adapter, defined in
  a client module:
  ```tsx
  const ToLink = ({ href, ...rest }: { href: string } & Omit<LinkProps, "to">) => <Link to={href} {...rest} />;
  ```
  `EmptyState` is a client component, so from a Server Component pass a client-module reference
  (`next/link`, or the adapter above exported from a `"use client"` file), not a function defined
  in the server file.
- **ReactNode-link recipe:** a ReactNode action is rendered as-is, so a router link works with no
  prop, but it is unstyled (`buttonVariants` is not re-exported). Style it yourself, e.g.
  `action={<Link href="/compose" className="...">Write a post</Link>}`. Use the object form +
  `linkComponent` when you want the button styling or `disabled`.
- **Disabled link actions:** `{ label, href, disabled: true }` renders a disabled `<Button>` (real
  `disabled` semantics, no link role, `onClick` not fired) and never calls `linkComponent`.

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

- No open follow-ups beyond the review follow-ups (see `reviews/2026-08-12-v0.1.0-spotcheck.md`).
  Not implemented (no prop for it): `target` / `rel` on object actions, per-action `hidden`.
