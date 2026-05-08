# Review checklist — `<slug>` v<version>

> **How to use:** Copy this file to `docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-checklist.md`. Tick boxes as you verify each item. Add inline notes for failures — they become findings in the report. **Don't skip dimensions** — record N/A explicitly with a one-line reason if a dimension genuinely doesn't apply.

---

## Header

- **Component:** `<slug>`
- **Category:** `<data | feedback | forms | layout | marketing | media>`
- **Version under review:** `<version>`
- **Reviewer:** `<name>`
- **Date:** `<YYYY-MM-DD>`
- **Git SHA:** `<short SHA>`
- **Scope:** `<full | targeted | spot-check>`
- **Reference:** [review-guide.md](../../../reviews/review-guide.md) — see each dimension for what to check, why, and good/bad signals.

---

## 1. Procomp planning docs

- [ ] description.md exists, signed off
- [ ] plan.md exists, signed off
- [ ] guide.md exists, current
- [ ] description §5 archetypes match what `demo.tsx` exercises
- [ ] description out-of-scope list still accurate
- [ ] plan-stage decisions still honored in code (note any drift)
- [ ] guide reads consumer-shaped, not implementer-shaped
- [ ] guide code snippets compile against current public API
- [ ] v0.2+ components have explicit "v0.x update" sections in each doc
- [ ] (if migrated) description has `> Migration origin: docs/migrations/<slug>/` line

**Notes:**

---

## 2. Public API (`<slug>.tsx` props + `types.ts`)

- [ ] Openness vs sealedness — slots / callbacks / polymorphic / public helpers where plausible consumer needs
- [ ] Component renders meaningfully with zero props
- [ ] Discriminated unions for variants (no bag-of-flags)
- [ ] `onBefore*` interceptor chains for mutation gating where applicable
- [ ] Public helpers exported (`<SLUG>_*` constants, utilities)
- [ ] No `any` in public types; generics where they buy real safety
- [ ] Stable-identity rules documented for callback / object / array props
- [ ] Naming consistent: verbs for callbacks, nouns for slots, `xxxRenderer` for registry entries
- [ ] Future-proof: next obvious feature can be added without breaking
- [ ] Optional props have documented defaults

**Notes:**

---

## 3. Component code (sealed folder)

- [ ] Folder shape conforms to `data-table`: `<slug>.tsx`, `parts/`, `hooks/`, `types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`
- [ ] Imports limited to allowlist: `react`, `@/components/ui/*`, `@/lib/utils`, declared third-party. **No `next/*`**, no app contexts
- [ ] No dead code (unused vars, commented blocks, `// removed` placeholders)
- [ ] No half-finished `// TODO later` without tracked follow-up
- [ ] Comments only when WHY is non-obvious — no WHAT comments
- [ ] No premature abstraction (3 similar lines beats a generic helper)
- [ ] `useCallback` / `useMemo` only where stable identity matters
- [ ] Module-scope hoisting for things that must never re-create per render
- [ ] `parts/` decomposition purposeful (not over- or under-decomposed)
- [ ] No swallowed errors (`catch (e) {}`)
- [ ] `'use client'` only where actually needed
- [ ] Root `<slug>.tsx` reasonably sized (~< 300 lines or with clear reason)

**Notes:**

---

## 4. Demo + usage

- [ ] Demo covers every archetype description §5 promised
- [ ] Demo dataset is realistic, heterogeneous (empty, locked, cap, deep, long, narrow, etc.)
- [ ] Demo exercises extensibility (custom renderer / port / column / etc.)
- [ ] Usage page reads like docs (intro, props table, snippets, "when to use vs alternatives")
- [ ] `dummy-data.ts` exported via the fixtures registry item
- [ ] Both light and dark mode look intentional
- [ ] No console errors / warnings during demo run
- [ ] No lorem ipsum in prominent demo copy
- [ ] `usage.tsx` is not a copy of `demo.tsx`

**Notes:**

---

## 5. Dependencies

- [ ] `meta.ts.shadcnDependencies` matches every `@/components/ui/*` import
- [ ] `meta.ts.dependencies` matches every external npm import
- [ ] `registry.json.registryDependencies` mirrors `meta.ts`
- [ ] No unused deps (declared but not imported)
- [ ] Each external package's weight is justified
- [ ] Version pins explicit (no `*` or `latest`)
- [ ] License compatible (MIT / Apache-2 / ISC); flagged in guide if not
- [ ] Internal sibling-component deps declared via `registryDependencies`

**Notes:**

---

## 6. Design system

- [ ] Fonts: Onest / JetBrains Mono only (no Inter / Geist / system)
- [ ] Accent: signal-lime, paired with near-black `--primary-foreground`
- [ ] Light bg: never pure-white; raised surfaces lift above `--background`
- [ ] Dark bg: graphite-cool, not warm-grey
- [ ] Tailwind v4 syntax: `bg-linear-*`, `wrap-break-word`, `grayscale-N` (no v3 leftovers)
- [ ] No forbidden patterns: pure-white page bg, purple-on-white, neon lime
- [ ] One reveal per page — no per-section reveal cascade
- [ ] Spacing rhythm consistent (4 / 8 / 12 / 16 ladder)
- [ ] Light + dark visual parity — both feel intentional
- [ ] Component-scoped CSS uses namespace pattern (`--xy-*` / `--<slug>-*`)

**Notes:**

---

## 7. Accessibility

- [ ] Keyboard nav: every interactive surface reachable + operable
- [ ] No keyboard traps
- [ ] ARIA roles + labels where semantics aren't obvious
- [ ] Live regions announce async state
- [ ] Focus rings visible in both modes
- [ ] Focus management on dynamic mounts (popover open / close)
- [ ] Reduced-motion respected (`prefers-reduced-motion`)
- [ ] Color contrast: AA for body, 3:1 for interactive
- [ ] Screen-reader pass: drag / drop / select / expand all narrate
- [ ] Disabled states perceivable (`aria-disabled` + visual + cursor)

**Notes:**

---

## 8. Performance

- [ ] `React.memo` on parts re-rendered in lists
- [ ] Stable identity for props crossing memo boundaries
- [ ] Module-scope constants for heavy maps (xyflow `nodeTypes`, dnd-kit sensors, regex)
- [ ] Narrow store selectors (no `useStore(s => s)`)
- [ ] Virtualization / `onlyRenderVisibleElements` for N > ~100
- [ ] No O(n²) walks per render
- [ ] Stress demo exists for high-N components and runs at 60fps
- [ ] No render loops
- [ ] No `console.log` in render path
- [ ] Bundle weight reasonable (`pnpm build` per-route size noted below)

**Bundle size:** `<value>` <!-- e.g. "page bundle 218KB, demo route 412KB" -->

**Notes:**

---

## 9. Registry distribution

- [ ] Two items in `registry.json`: base + `<slug>-fixtures`
- [ ] Locked target convention: `type: "registry:component"`, `target: "components/<slug>/<sub-path>"` for every file
- [ ] Excluded files: `demo.tsx`, `usage.tsx`, `meta.ts` not in `files`
- [ ] `pnpm registry:build` regenerates `public/r/<slug>.json` cleanly
- [ ] Smoke install (`pnpm dlx shadcn@latest add @ilinxa/<slug>` in tmp consumer) works
- [ ] `registryDependencies` lists internal sibling deps
- [ ] `description` matches `meta.ts.description` and doc-site card
- [ ] `pnpm vercel-build` succeeds locally

**Notes:**

---

## 10. Meta + manifest sync

- [ ] `meta.ts.version` reflects reality
- [ ] `meta.ts.status` honest (alpha / beta / stable)
- [ ] `meta.ts.tags` searchable, not slug-fragments
- [ ] `meta.ts.description` matches doc-site + `registry.json`
- [ ] Registered in `manifest.ts.REGISTRY` (3 imports per component)
- [ ] `STATUS.md` Components table row current
- [ ] `STATUS.md` Recent decisions mentions latest bump
- [ ] `docs/component-versions.md` snapshot in sync
- [ ] `meta.ts.updatedAt` current

**Notes:**

---

## 11. UI copy / text

- [ ] Empty states are real sentences, not "No data"
- [ ] Error / warn messages actionable (cause + next step)
- [ ] Button labels verb-first
- [ ] Tooltips terse, non-redundant with visible label
- [ ] Placeholder text explains format (not "Enter X")
- [ ] No lorem ipsum in prominent copy
- [ ] Pluralization correct ("1 item" / "2 items")
- [ ] Sentence case for in-product UI
- [ ] Brand names spelled correctly (xyflow, shadcn lowercase; React, TypeScript capitalized)
- [ ] No "TODO copy" left in shipped strings
- [ ] No "Click here"

**Notes:**

---

## 12. Verification

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean (or pre-existing warnings explicitly listed below)
- [ ] `pnpm build` clean
- [ ] `pnpm registry:build` clean
- [ ] Docs-site detail page renders at `/components/<slug>` without runtime errors
- [ ] Browser validation: light + dark, narrow + wide, all interactive paths
- [ ] (Full review) Smoke install in tmp consumer works
- [ ] Console clean during demo interaction (no warnings, errors, key warnings, hydration mismatches)

**Pre-existing warnings (if any):**

**Notes:**

---

## 13. Migration provenance (if applicable)

- [ ] N/A — greenfield component <!-- check this OR all items below -->
- [ ] `docs/migrations/<slug>/` exists with `original/` + `source-notes.md` + `analysis.md`
- [ ] `analysis.md` signed off before code began
- [ ] `analysis.md` covers four gap categories: deps, dynamism, optimization, a11y
- [ ] Description has `> Migration origin` one-liner
- [ ] Design DNA preserved (visual identity recognizable)
- [ ] Structural debt rewritten (not preserved)
- [ ] Tailwind v3 → v4 translations applied
- [ ] No leftover `next/*` imports
- [ ] No leftover app-context imports

**Notes:**

---

## 14. Cross-component coherence

- [ ] Renderer-registry pattern (if used) consistent with workspace / kanban / flow-canvas shape
- [ ] Naming: `<slug>-NN` suffix vs bare slug intentional
- [ ] Public-helper export naming follows `<SLUG>_*` convention
- [ ] Theming variables in `globals.css`, follow `--<slug>-*` / `--xy-*` namespace
- [ ] Sealed-folder shape matches `data-table`
- [ ] Category assignment correct (primary purpose, not visual placement)
- [ ] Status convention (alpha / beta) consistent with sibling components
- [ ] Shared primitives declared the same way as siblings

**Notes:**

---

## Tally

- **Total items:** 133 (across 14 dimensions)
- **Ticked:** `<count>`
- **N/A (with reason):** `<count>`
- **Failed (becomes a finding):** `<count>`

> Once the checklist is complete, write the narrative report at `<YYYY-MM-DD>-v<version>-review.md` using [`templates/review-report.md`](review-report.md).
