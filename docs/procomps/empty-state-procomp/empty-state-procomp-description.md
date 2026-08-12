# `empty-state` — pro-component description (Stage 1)

> **GATE 1 target.** Category: `feedback`. Single-unit widget (compound rule exempt).

## Problem

Every app surface that can be empty (no results, no data yet, error, permission wall, first-use)
needs a designed answer, and today each consumer hand-rolls a `div` with an icon and a sad
sentence — inconsistent spacing, no action affordances, no illustration slot, no dark-mode
discipline. shadcn/ui ships no empty-state primitive. The library's own demos fake it ad hoc.
`detail-panel` carries a panel-scoped internal empty state, but nothing general-purpose exists.

## In scope

- One `EmptyState` component: icon OR illustration slot · title · description · primary +
  secondary action slots · optional footer hint (e.g. "or press ⌘K").
- **Semantic variants** that change tone + default iconography: `default` (no data yet) ·
  `search` (no results — implies a "clear filters" affordance) · `error` (something failed —
  implies retry) · `offline` · `permission` (locked content) · `first-use` (onboarding tone).
- Three sizes (`sm` inline/card-level, `md` section, `lg` full-page) controlling type scale,
  icon scale, spacing.
- Capability-gated affordances: omit `action`/`secondaryAction` → buttons absent (read-only falls
  out for free).
- Decorative treatment for the icon (soft ring/halo per design tokens), signal-lime accent
  discipline, both themes.
- A11y: semantic heading level prop, `role="status"` for transient variants (search/error),
  reduced-motion-safe entrance.

## Out of scope

- Data fetching / state detection — the HOST decides when it's empty; this renders the answer.
- Illustration artwork library (consumer supplies; we ship lucide-icon defaults per variant).
- Skeleton/loading states (loaders are a different component; `status` here is not a spinner).
- Error boundary logic (pairs with, does not implement).
- Replacing `DetailPanelEmptyState` — detail-panel keeps its internal part; no cross-dependency
  either direction (precedent: decision #35 composition-at-host).

## Target consumers

Dashboards (empty tables/lists), search/filter surfaces (filter-bar, data-table, file-manager
hosts), media grids (media-library), first-run onboarding pages, error pages. Also our own docs
demos, replacing ad-hoc placeholders.

## Rough API sketch

```tsx
<EmptyState
  variant="search"            // default | search | error | offline | permission | first-use
  size="md"                   // sm | md | lg
  icon={<SearchX />}          // ReactNode; falls back to variant default icon
  media={<img … />}           // replaces icon entirely when present (illustration slot)
  title="No results for “gantt”"
  description="Try a different term or clear the active filters."
  action={{ label: "Clear filters", onClick }}      // or ReactNode for full control
  secondaryAction={{ label: "Browse all", onClick }}
  hint={<>or press <Kbd>⌘K</Kbd></>}
  headingLevel={3}
/>
```

## Example usages

1. `data-table` host renders `<EmptyState variant="search" size="sm" …/>` inside the table body
   when the filtered row set is empty; "Clear filters" resets the host's filter state.
2. Full-page 404-adjacent surface: `<EmptyState variant="permission" size="lg" …/>` with a
   "Request access" primary action and "Back to dashboard" secondary.
3. First-run media grid: `<EmptyState variant="first-use" media={<Illustration/>} …/>` with
   "Upload your first file" primary action.

## Success criteria

- Installable via `@ilinxa/empty-state`; consumer tsc 0; renders with zero required props beyond
  `title`.
- All 6 variants × 3 sizes render coherently in both themes without consumer CSS.
- Actions absent when handlers absent; keyboard-reachable when present.
- Docs demo shows at least: variant matrix, action-less read-only case, illustration case.

## Open questions (resolved in-loop, delegated mode)

1. **`action` as object or ReactNode?** → Both (union). Object form keeps the 90% case terse;
   ReactNode escape hatch preserves dynamicity primacy. *(Recommended + adopted.)*
2. **Ship per-variant default copy?** → No. Copy is host-domain; defaults would fight i18n.
   Variant defaults cover icon + tone only. *(Adopted.)*
3. **`role="status"`/`aria-live` always?** → Only for `search`/`error`/`offline` (transient,
   state-change-driven); static walls (`permission`, `first-use`) stay plain landmarks —
   announcing them on mount is noise. *(Adopted.)*

## Self-adversarial pass (C1 findings)

- **D-F1 (scope):** first draft had `illustrationLibrary` bundled — cut; artwork is consumer
  domain, keeps artifact small (out-of-scope line added).
- **D-F2 (overlap):** must state the `DetailPanelEmptyState` relationship explicitly or a future
  session "deduplicates" them wrongly — added to out-of-scope.
- **D-F3 (API honesty):** `hint` as string-only would be re-opened within a week (Kbd markup) —
  widened to ReactNode per dynamicity-primacy rule.

**GATE 1: signed off — delegated mode (recorded in loop state doc).**
