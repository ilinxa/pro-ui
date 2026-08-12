# `empty-state` — pro-component plan (Stage 2)

> **GATE 2 target.** Implements the signed-off description. Single-unit widget — sealed
> `data-table` shape, no `parts/`, compound rule exempt (recorded C0).

## Final API

```tsx
// types.ts
export type EmptyStateVariant =
  | "default" | "search" | "error" | "offline" | "permission" | "first-use";
export type EmptyStateSize = "sm" | "md" | "lg";

export interface EmptyStateActionConfig {
  label: string;
  onClick?: () => void;
  href?: string;                     // renders <Button asChild-free> wrapping <a> internally? NO —
                                     // renders a plain <a> styled via buttonVariants (F-cross-13:
                                     // no asChild on custom surfaces)
  disabled?: boolean;
}
export type EmptyStateAction = EmptyStateActionConfig | React.ReactNode;

export interface EmptyStateProps {
  variant?: EmptyStateVariant;       // default: "default"
  size?: EmptyStateSize;             // default: "md"
  icon?: React.ReactNode;            // falls back to per-variant lucide default
  media?: React.ReactNode;           // illustration slot; when set, icon (and halo) not rendered
  title: React.ReactNode;            // required; ReactNode for i18n/markup freedom
  description?: React.ReactNode;
  action?: EmptyStateAction;         // primary; object → <Button>, node → rendered as-is
  secondaryAction?: EmptyStateAction;// object → <Button variant="outline">
  hint?: React.ReactNode;            // footer micro-copy row
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6; // default 3
  animated?: boolean;                // default true; false disables entrance reveal
  frame?: "none" | "dashed" | "card";// default "none"; dashed = classic dropzone-style border,
                                     // card = raised bg-card surface
  className?: string;
}
```

Named export `EmptyState` (PascalCase of slug). `Demo`/`Usage` default exports.

## Visual spec (designer-skill pass, tokens only)

- **Icon treatment:** 12/14/16 (sm/md/lg × size-*) tile — `rounded-xl` at sm (proportional radius
  on the 48px tile; C5 F4 doc-sync), `rounded-2xl` at md/lg — `bg-muted text-muted-foreground`,
  `ring-1 ring-border`; behind it an absolutely-positioned radial **bloom** (`--primary` at ~12%
  alpha via `color-mix`) for `default`/`first-use`; `error` swaps tile text to `text-destructive`;
  others stay neutral. `first-use` adds a dashed decorative ring (`border-dashed border-primary/30`,
  slow spin, disabled under reduced motion + when `animated={false}`).
- **Type:** title `font-semibold text-foreground` (sm: text-sm / md: text-base / lg: text-xl,
  `text-balance`); description `text-muted-foreground text-pretty` one step down; hint
  `text-xs text-muted-foreground/80`.
- **Layout:** centered column, `max-w-sm|md|lg` per size, paddings py-6/py-10/py-16; actions row
  wraps (`flex-wrap justify-center gap-2`).
- **Motion:** one orchestrated entrance via **tw-animate-css** utilities
  (`motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2`) with 60ms
  stagger (delay utilities) across tile → title → description → actions → hint. NOT the app-level
  `reveal-up` keyframe — it lives in `src/app/globals.css` and never reaches consumers (P-F5).
- **Variant default icons (lucide):** default `Inbox` · search `SearchX` · error `TriangleAlert` ·
  offline `WifiOff` · permission `Lock` · first-use `Sparkles`.
- No hex/rgb literals; both themes via tokens only.

## File-by-file

| File | Content |
|---|---|
| `empty-state.tsx` | `"use client"`; `EmptyState` + internal `renderAction(action, kind)` helper (object → `<Button>`/`<Button variant="outline">`, `href` object-form → `<a className={cn(buttonVariants(...))}>`; node → as-is); variant icon/tone maps; size maps (cva) |
| `types.ts` | as above |
| `dummy-data.ts` | per-variant sample copy + a small inline SVG illustration node for the media demo |
| `demo.tsx` | tabs (SwipeTabsList): Variants (2×3 matrix, md) · Sizes (sm/md/lg row, search) · Read-only (no actions — I2 proof) · Illustration (media + first-use) · Frames (dashed + card) |
| `usage.tsx` | prose + copy-pasteable block: data-table search-empty host example |
| `meta.ts` | all ComponentMeta fields; `artifactBudgetKB: 20`; deps: shadcn `button`; npm `lucide-react` |
| `index.ts` | export `EmptyState` + all types; **never `meta`** |

## Dependencies

- shadcn: `button` (+ `buttonVariants` escape hatch — already exported by the primitive).
- npm: `lucide-react` (^1.11.0 — repo-verified in package.json; peer-exists check satisfied, no new packages).
- internal: none. No `next/*`, no app contexts.

## Composition pattern

Single presentational unit with slot props (`icon`/`media`/`title`/`description`/`hint` ReactNode,
`action` union). No context, no hooks beyond none — stateless; host owns all state. cva for
size/variant class maps.

## Client vs server

`"use client"` — object-form actions carry `onClick`. Component holds no state; safe under React
Compiler.

## Edge cases

Title-only render (minimum props) · both actions absent (no actions row in DOM) · `media` +
`icon` both set (media wins, icon ignored) · long title/description (text-balance/pretty,
max-w clamps) · `hint` without actions · `animated={false}` (SSR-stable, no reveal classes) ·
RTL: pure centered column — direction-neutral; no logical-property hazards.

## Accessibility

- Heading = real `h{headingLevel}` (default h3) so empties participate in the outline.
- `role="status"` + `aria-live="polite"` ONLY for `search`/`error`/`offline` (transient); static
  walls stay plain (mount announcement = noise).
- Decorative tile/bloom/ring `aria-hidden`; object-form actions are real `<Button>`s (keyboard
  free); reduced-motion disables all animation.

## Registry-item plan

| Item | files[] (all `registry:component`, target `components/empty-state/…`) |
|---|---|
| `empty-state` | `empty-state.tsx` · `types.ts` · `index.ts` |
| `empty-state-fixtures` | + `dummy-data.ts` (registryDependencies: `empty-state`) |

`registryDependencies`: `["button"]` (from shipped imports — demo/usage/meta excluded).
npm `dependencies`: `["lucide-react"]`. Never ship `demo.tsx`/`usage.tsx`/`meta.ts`.
**Size estimate:** ~13KB shipped source × 1.13 ≈ 15KB artifact vs `artifactBudgetKB: 20`. OK.

## Invariants (C5 review + C6 verification targets)

| # | Invariant |
|---|---|
| I1 | `<EmptyState title="…"/>` alone renders — no actions row, no hint row, no empty wrappers in DOM |
| I2 | Handlers absent → zero `<button>`/`<a>` elements rendered (capability-gating) |
| I3 | `media` set → icon tile + bloom absent from DOM |
| I4 | `role="status"`/`aria-live` present for search/error/offline; ABSENT for default/permission/first-use |
| I5 | `headingLevel={2}` renders `<h2>`; default renders `<h3>` |
| I6 | All 6 variants × 3 sizes, both themes, token classes only (grep: no `#`, `rgb(`, `bg-white`) |
| I-neg | Base item install w/o fixtures compiles + renders in consumer (fixtures truly optional) |

## Blast radius

| Surface | Change |
|---|---|
| `src/registry/manifest.ts` | +3 lines (feedback siblings) |
| `registry.json` | +2 items |
| `.claude/STATUS.md` | row + count 63→64 |
| `docs/component-versions.md` · llms/README catalog | regenerated (never hand-edit) |
| `docs/procomps/empty-state-procomp/` | trio + loop state + review |
| smoke consumer SLUGS list | +1 (`e:/tmp/ilinxa-smoke-consumer`) |

## Risks & alternatives

- **Union action prop** adds a type guard vs pure-ReactNode simplicity — accepted for terseness
  of the 90% case (description Q1).
- Considered variant-specific components (`SearchEmpty`, `ErrorEmpty`) — rejected: 6× API surface,
  no added capability.
- `frame="dashed"` may tempt dropzone misuse (real dropzone = future `media/dropzone` roadmap
  item) — guide doc will draw the line.

## Self-adversarial plan pass (C2 findings)

- **P-F1:** first draft used `asChild` for `href` actions — F-cross-13 carrier; replaced with
  `buttonVariants` + `<a>` escape hatch (locked pattern).
- **P-F2:** `animated` default-true + SSR — reveal classes are pure CSS (no JS timing), so no
  hydration mismatch; verified approach against existing `reveal-up` usage in app pages.
- **P-F3:** `role="status"` on ALL variants (first draft) reversed per description Q3 — static
  walls stay silent; matrix written into I4.
- **P-F4:** fixtures item initially included the SVG illustration inside `dummy-data.ts` only —
  kept, but demo must import it from dummy-data (not duplicate inline) so the fixtures item stays
  the single source of sample content.
- **P-F5 (portability):** entrance animation switched from app-level `reveal-up` (consumer never
  gets the keyframe — silent degradation, page-hero precedent noted for docs-site-leaning
  components) to tw-animate-css utilities, which shadcn consumers carry. Verified both precedents
  exist in-registry before deciding.

**GATE 2: signed off — delegated mode (recorded in loop state doc). Scaffolding unlocked.**

## Slices (C3)

| # | Slice | Owner |
|---|---|---|
| 1 | `types.ts` + `empty-state.tsx` + `index.ts` (core) | implementer A (Sonnet 5) |
| 2 | `dummy-data.ts` + `demo.tsx` + `usage.tsx` + `meta.ts` | implementer A, second pass (same agent — small component, sequential slices beat cross-agent API drift) |
| 3 | manifest + registry.json + validators | coordinator |
