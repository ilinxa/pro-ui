# json-form v0.1.0 — implementation handoff (session pause 2026-05-12)

> **Resume in a fresh session.** This doc captures everything the next session needs to load context fast and continue without re-opening locked decisions.

## State at pause

**Foundation layer DONE.** Field renderers + integration + verification + docs REMAINING.

- ✅ GATE 1 (description) signed off
- ✅ GATE 2 (plan) signed off
- ✅ Prerequisite primitives + npm deps installed
- ✅ `validate-meta-deps.mjs` lint extension (+ surfaced + fixed real drift in `post-card-01`)
- ✅ Component folder scaffolded (`src/registry/components/forms/json-form/`)
- ✅ `types.ts` (complete public API surface)
- ✅ All 6 `lib/` pure functions (strings, path, expression-parser, condition-evaluator, validate-schema, schema-compiler)
- ✅ All 5 `hooks/` files (use-debounced-callback, use-conditional, use-computed, use-async-options, use-json-form)
- ⬜ `parts/` — 22 files (16 field renderers + 6 surface atoms)
- ⬜ Top-level: `json-form-context.tsx`, `json-form.tsx` (replace stub), `lib/default-registry.ts`, `index.ts` (replace stub)
- ⬜ Metadata: `meta.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx` (all replace stubs)
- ⬜ Registration: `manifest.ts` (3 lines) + `registry.json` (base + fixtures items)
- ⬜ Verification: tsc + lint + meta-deps + build + demo + smoke harness (path-b consumer-tsc)
- ⬜ Docs: `guide.md` + GATE 3 spot-check review + STATUS.md + decision file

## Documents to load first

In order:

1. [`docs/procomps/json-form-procomp/json-form-procomp-description.md`](../docs/procomps/json-form-procomp/json-form-procomp-description.md) — GATE 1, 709 lines, all 44 open questions resolved
2. [`docs/procomps/json-form-procomp/json-form-procomp-plan.md`](../docs/procomps/json-form-procomp/json-form-procomp-plan.md) — GATE 2, 764 lines, exact file-by-file plan with T1–T9 + P-01–P-14 locked
3. This handoff

The plan's "File-by-file plan" table is the source of truth for what each remaining file does.

## Files modified this session (outside json-form/)

- `scripts/validate-meta-deps.mjs` — extended with `dependencies.internal` lint (scans `@ilinxa/<slug>`, `@/registry/components/<cat>/<slug>`, and raw-relative `../../<slug>` patterns; skips `_template` / `_shared` siblings)
- `src/components/ui/form.tsx` — manually authored (radix-nova style doesn't ship Form; new-york-v4 source used, Label import re-pointed)
- `src/components/ui/radio-group.tsx`, `slider.tsx`, `label.tsx` — added via `pnpm dlx shadcn@latest add`
- `package.json` + `pnpm-lock.yaml` — added `react-hook-form@^7.75.0`, `@hookform/resolvers@^5.2.2`, `zod@^4.4.3`
- `src/registry/components/data/post-card-01/meta.ts` — removed phantom `video-player-01` from `dependencies.internal` (drift cleanup surfaced by the new lint)

## tsc state

5 errors remaining, **all expected** — they're in scaffolder stub files (`json-form.tsx`, `demo.tsx`) that reference the OLD `JsonFormProps { title, description }` shape. They disappear when the stubs are replaced with real impl. The foundation files themselves are type-clean.

## Key implementation decisions baked in

- `TValues extends Record<string, any>` (not `unknown`) — required to satisfy RHF's `FieldValues` constraint
- `useConditional` + `useComputed` subscribe to the **full** values bag in v0.1.0 (narrow-deps deferred to v0.2 per P-06) — keeps under the ~50-conditional perf ceiling
- `applyRequired` in `schema-compiler` accepts `ZodTypeAny` (not the narrower union) because `z.coerce.number()` returns `ZodCoercedNumber`, incompatible with `ZodString | ZodNumber`
- Form primitive's import path is `@/components/ui/form` (project alias), not `@/registry/new-york-v4/ui/label` (canonical source's path)
- `dependencies.internal` in `meta.ts` was confirmed to already exist in `ComponentDependencies` type (`src/registry/types.ts:20`); json-form is the first to actually USE it

## Fresh-session opening prompt

Paste this into the new conversation:

```
continue json-form v0.1.0 implementation. read .claude/HANDOFF-2026-05-12-json-form-impl.md
for state, then load the description + plan docs. all architectural decisions
are locked — proceed with parts/ + integration + verification + docs.
no GATE re-opening; just execute the plan.
```

## Next-session sequence (mechanical from here)

1. **`parts/field-wrapper.tsx`** FIRST — shared shell every field renderer consumes (label + helper + error + ARIA wiring + visibility unmount logic via `useConditional`)
2. **16 field renderers** in `parts/` — match the substrate table in plan §"parts/ — field renderers"
3. **6 surface atoms** in `parts/` — form-header, error-summary, submit-button, reset-button, field-wrapper (done in step 1), json-form-field
4. **`json-form-context.tsx`** — React context + `useJsonFormContext()` hook
5. **`lib/default-registry.ts`** — 16 entries; `React.lazy(() => import('../parts/field-code'))` for the `code` field
6. **`json-form.tsx`** — replace stub; composes Provider + RHF FormProvider + `<form>` + resolver chain (renderField → fieldRegistry → default)
7. **`index.ts`** — replace stub; barrel exports (NO `meta` re-export per F-cross-11)
8. **`meta.ts`** — replace stub; full ComponentMeta with `dependencies.internal: ["code-block"]`
9. **`dummy-data.ts`** — 6 fixture schemas (registrationFormSchema, contactFormSchema, conditionalFormSchema, computedFormSchema, richFieldsFormSchema, adminUserFormSchema) + `mockFetchSchema` async helper (per P-13)
10. **`demo.tsx`** — 7 tabs (registration, backend-driven, conditional, computed+sections, rich-fields, imperative API, custom registry)
11. **`usage.tsx`** — usage doc with validators table, conditional examples, hook usage, a11y notes, value-shape table, FAQ
12. **`manifest.ts`** — 3-line edit (scaffolder printed exact lines)
13. **`registry.json`** — base item (sealed-folder source files) + `json-form-fixtures` sibling (dummy-data only); locked target convention
14. **`pnpm tsc + lint + validate:meta-deps + build`** all clean
15. **Demo verification** at `/components/json-form` — all 7 tabs render + interact
16. **Smoke harness** — install in `e:/tmp/ilinxa-smoke-consumer/`, run `pnpm tsc --noEmit`
17. **`docs/procomps/json-form-procomp/json-form-procomp-guide.md`** — consumer-facing
18. **GATE 3 review** at `docs/procomps/json-form-procomp/reviews/2026-05-XX-v0.1.0-spotcheck.md` — rotating dim recommended: **Public API**
19. **STATUS.md** — Components table row + Recent activity pointer + Active queue strikethrough
20. **`.claude/decisions/2026-05-XX-json-form-v01-pipeline.md`** — per-decision file
21. Commit + push (only if user explicitly asks)

## Estimated effort remaining

Per the plan: ~3-4 focused sessions. Field renderers are the bulk (16 files); each is ~30-80 LOC of shadcn-primitive wrapping with consistent FieldRenderer signature. Integration is small but fiddly. Verification is run-and-fix cycles.

## Verification checkpoints

Run after each phase:

- After `parts/` written: `pnpm tsc --noEmit` should be clean (5 stub errors will remain until top-level files replace stubs)
- After top-level replaces stubs: tsc should be FULLY clean
- After `meta.ts` + `manifest.ts`: `pnpm validate:meta-deps json-form` should be clean
- After `registry.json` updated: `pnpm registry:build` should generate `public/r/json-form.json` + `public/r/json-form-fixtures.json`
- Before declaring done: `pnpm build` + manual demo verification + smoke harness path-b
