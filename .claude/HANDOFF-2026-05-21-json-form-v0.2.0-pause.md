# HANDOFF — json-form v0.1.7 SHIPPED, v0.2.0 paused for fresh-session resume

**Date paused:** 2026-05-21
**Tip at pause:** `a6627a6` (PUSHED to master)
**Active branch:** `master`
**Working tree:** clean (only `.claude/scheduled_tasks.lock` untracked, gitignored)

---

## What's in master right now

```
a6627a6 fix(json-form): hydration whitespace in usage.tsx em-dash sequences
8ccab4e docs(json-form): v0.2.0 GATE 2 plan + v0.1.7 spotcheck + decision file + STATUS
1a1a0d6 feat(json-form): v0.1.5 → v0.1.7 — substrate-grade upgrade
1849225 feat(article-body-01): v0.2.1 — re-export ARTICLE_BODY_EMPTY_VALUE + type ArticleBodyValue
cfef7de fix(todo-tree): v0.1.3 — dnd-kit SSR hydration mismatch (useId for DndContext)
```

**Live registry artifacts** (post-deploy, verified 2026-05-21):
- `https://ilinxa-proui.vercel.app/r/json-form.json` — v0.1.7 (44 base files; 4 new since v0.1.6)
- `https://ilinxa-proui.vercel.app/r/article-body-01.json` — v0.2.1 (additive re-export)

**Path-b smoke (F-01 from v0.1.7 spotcheck) — CLOSED:**
- Ran `pnpm dlx shadcn@4.6.0 add @ilinxa/json-form @ilinxa/json-form-fixtures` from `e:/tmp/ilinxa-smoke-consumer/`
- Consumer-side `pnpm tsc --noEmit`: **0 errors in json-form OR article-body-01** (32 total errors, all pre-existing in flow-canvas-01/pdf-viewer/code-block/ui-calendar — unchanged from v0.1.6 baseline)
- `React.lazy(() => import("./json-form-devtools-body"))` preserved verbatim through the shadcn rewriter — the lazy chunk boundary survives. **New project-level rule:** dynamic-import paths use relative, never absolute aliases.
- Harness baseline reset clean after smoke.

---

## v0.2.0 — what's locked, ready to implement

**Plan:** [`docs/procomps/json-form-procomp/json-form-procomp-plan-v0.2.0.md`](../docs/procomps/json-form-procomp/json-form-procomp-plan-v0.2.0.md). All 7 Q-Ps locked (option (a) recommendations); 13 re-validation fixes folded inline (F-01–F-12 from re-audit pass).

### Scope (5 modified files, 0 new)

| File | Change | Est. LOC |
|---|---|---|
| `parts/field-wrapper.tsx` | Three-mode subscription gate (snapshot when renderer ∈ `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES` OR `dependsOn === []`; narrow watch when `dependsOn` non-empty; full-bag otherwise). The snapshot path drops the FieldWrapper-level `useWatch({ control })` entirely. **A2 — the perf cliff lifter.** | +25 / -5 net +20 |
| `hooks/use-json-form.ts` | Rewrite `mergeDefaultValues` to deep-merge via `setByPath` per leaf instead of shallow per-top-level-key replacement. **B1.** | +30 / -15 net +15 |
| `lib/validate-schema.ts` | Bump conditional-count warn threshold 50 → 200 (perf no longer scales with conditional count under the watch drop). | +1 / -1 |
| `usage.tsx` | New section "What changed in v0.2.0" — release-note explanation of the watch drop + deep-merge behavior. + 1 FAQ entry on deep-merge change. | +40 |
| `meta.ts` | Bump v0.1.7 → v0.2.0. Update features list. | +5 |

**Total v0.2.0 LOC:** ~85 across 5 files (all modified, 0 new).

### Commit chain (4 commits)

| # | Commit | Files | Verification |
|---|---|---|---|
| C1 | `feat(json-form): deep-merge defaultValues (B1)` | `use-json-form.ts` | tsc + lint; round-trip test: `mergeDefaultValues({ address: { country: 'US' } }, { address: { city: 'NYC' } })` → `{ address: { country: 'US', city: 'NYC' } }` |
| C2 | `feat(json-form): default-registry watch drop + dependsOn gate (A2)` | `field-wrapper.tsx`, `validate-schema.ts` | tsc + lint; React DevTools profiler verifies render-count drop on a 20-field form; backward-compat audit — existing demo schemas + fixtures all render visually identically |
| C3 | `docs(json-form): v0.2.0 release notes + FAQ` | `usage.tsx` | docs render clean in dev |
| C4 | `chore(json-form): bump v0.2.0 + registry.json + GATE 3 full checklist review` | `meta.ts`, `registry.json`, `reviews/2026-05-XX-v0.2.0-checklist.md`, decision file | full review + smoke + STATUS update |

### v0.2.0 trigger status — SATISFIED

Both conditions in the locked staging plan are met:
- **External-consumer smoke clean:** ✅ Path-b smoke ran clean immediately post-deploy on 2026-05-21
- **≥7 days post-deploy:** Not needed since smoke landed clean; user chose option (b) — ship v0.2.0 next session

### Estimated effort

| Phase | Sessions |
|---|---|
| C1 + C2 (deep-merge + field-wrapper gate + threshold bump) | 0.75 |
| C3 + C4 (docs + full-checklist GATE 3 review + smoke + STATUS + decision) | 0.75 |
| **Total** | **~1.5 sessions** |

---

## Behavioral deltas (audit-backed safety)

### A2 — Default-registry watch drop

**Current (v0.1.7):** every FieldWrapper calls `useWatch({ control })` to populate `allValues` for the renderer. 20-field form = 20 re-renders per keystroke.

**v0.2.0 — three modes (per Q-P1):**
1. **Snapshot** (no watch) — when renderer type ∈ `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES` (25 types — already defined in `lib/default-registry.ts` at v0.1.7) OR `field.dependsOn === []`. `allValues` populated via `rhf.getValues()` at render.
2. **Narrow watch** — when `field.dependsOn` is non-empty. `useWatch({ control, name: dependsOn })`, rebuild via `setByPath`.
3. **Full-bag watch** (current behavior) — otherwise. Custom renderers without `dependsOn` keep legacy behavior.

**Why safe:** all 25 built-in renderers audited 2026-05-21 — none read `args.allValues` directly. `computed`'s renderer destructures only `{ field, value, onChange, disabled, ariaProps }`; the values-reading happens inside `useComputed()`'s own narrow `useWatch` independently of FieldWrapper. Custom renderers REPLACE built-in types in registry merge — whitelist check resolves on FINAL renderer identity (not `field.type` alone), so a custom renderer at the `text` slot correctly opts out unless it sets `dependsOn`.

**Expected delta** (20-field form, 5 conditionals, 1 keystroke):

| Cost | v0.1.7 | After v0.2.0 |
|---|---|---|
| FieldWrapper renders | 20 | 1–4 |
| `resolveConditionOrFn` calls | 0–1 (already narrow from v0.1.6) | 0–1 |
| Default-registry `useWatch` per field | 1 | 0 |

### B1 — Deep-merge `defaultValues`

**Current (v0.1.7):** `mergeDefaultValues` walks per-field `defaultValue` into a nested bag, then overlays form-level `defaultValues` via shallow per-top-level-key replacement. `formLevel = { address: { city: 'X' } }` REPLACES the entire `address` object, dropping any per-field nested defaults under `address.country`, `address.zip`, etc.

**v0.2.0:** form-level `defaultValues` walked via `setByPath` per leaf — every leaf overlays at exact leaf path, preserving sibling per-field defaults.

**Why safe:** audit (2026-05-21) found no demo schema, no fixture schema, no known internal consumer relies on the shallow-replace behavior. The semantic shift is "you get more of your nested per-field defaults preserved" — strictly an improvement.

**Release note + FAQ entry** in `usage.tsx` C3: *"If you were relying on `defaultValues = { address: {} }` to clear nested per-field defaults, you now need to be explicit per leaf: `defaultValues = { 'address.country': '' }` (RHF flat path) or pass an empty value per nested leaf."*

---

## GATE 3 review at C4 — full checklist, not spotcheck

v0.2.0 is a **public-API-touching minor bump with broad scope** per [`.claude/rules/component-readiness-review.md`](rules/component-readiness-review.md). Use [`docs/reviews/templates/review-checklist.md`](../docs/reviews/templates/review-checklist.md) (16 dimensions, ~90 min) + [`review-report.md`](../docs/reviews/templates/review-report.md). Author at `docs/procomps/json-form-procomp/reviews/2026-05-XX-v0.2.0-checklist.md`.

**Verdict bar:** `Pass` or `Pass with follow-ups`. Each follow-up tagged with owner + bump target.

### v0.1.7 spotcheck follow-ups carried forward (consider batching into v0.2.0)

| # | Severity | Title | Recommended action in v0.2.0 |
|---|---|---|---|
| F-02 | 🔹 Low | `dependsOn` JSDoc — spell out the v0.1.7-only schema-lint effect more explicitly | Update JSDoc when adding the v0.2.0 runtime-watch-gating behavior — replace the "ships in v0.2.0" framing with descriptive prose |
| F-03 | 🔹 Low | `<JsonFormDevtools>` Provider-constraint doc + soft-warning fallback | Add a try/catch around `useJsonFormContext()` in the devtools body that renders a "Place this inside a `<JsonForm>` or `<JsonFormProvider>`" warning panel instead of throwing |
| F-04 | 🔹 Low | `defineFieldRenderer` config-key tighter narrowing | Defer further unless real-consumer feedback drives it; document the current shape in usage.tsx |
| F-05 | 🔹 Low | `prettyReplacer` BigInt handling in devtools body | Add `if (typeof value === "bigint") return value.toString() + "n"` to the replacer in `parts/json-form-devtools-body.tsx` (~1 LOC) |

F-01 is already CLOSED.

---

## Risk register (carried from plan)

| Risk | Severity | Mitigation |
|---|---|---|
| Default-registry whitelist drift — future built-in renderer reads `allValues` but author forgets to remove it from the set | ⚠️ High | Add a `validate-meta-deps`-style lint check at v0.2.0 + 1: scan default-registry renderer source files for `args.allValues` access; surface a tracker error if a whitelisted renderer reads it. Until then: hand-audit per renderer-change PR. |
| `dependsOn === []` consumer footgun (renderer DOES read `allValues` but sets `[]` anyway) | 🔸 Medium | Schema-lint warns on dangling refs (v0.1.7) but doesn't lint the empty-array case. Document in usage.tsx that `dependsOn: []` means "renderer doesn't read `allValues`". |
| Compile split breaks `schema.zodSchema` consumer-merge | 🔸 Medium | Test path: `compileStructural` returns base zod, `injectStrings` decorates messages, the consumer-merge step (existing v0.1.x code) runs LAST per existing precedent. Verified in compiler spec walk-through at v0.1.7 ship; no change in v0.2.0. |
| Downstream procomp consumers break on v0.2.0 | 🔸 Medium | rcif uses json-form for its port editor (confirmed). Other downstream consumers (todo-rich-card, planned cms-*) — audit at v0.2.0 C4 verification: grep each procomp's source for `JsonForm` / `useJsonForm` / `JsonFormProvider` imports, confirm each uses default-registry renderers OR sets explicit `dependsOn`. Smoke harness runs `pnpm dlx shadcn@4.6.0 add @ilinxa/json-form` AND each downstream consumer slug, then consumer-side `pnpm tsc --noEmit`, gating C4 sign-off. |

---

## On resume — first 5 minutes

1. Read this HANDOFF + [`docs/procomps/json-form-procomp/json-form-procomp-plan-v0.2.0.md`](../docs/procomps/json-form-procomp/json-form-procomp-plan-v0.2.0.md) (the plan is the source of truth).
2. Check git tip vs `a6627a6` — confirm nothing landed since pause.
3. Verify `pnpm tsc --noEmit` clean from pre-implementation baseline.
4. Start C1 (`use-json-form.ts` deep-merge rewrite).

**Do NOT re-scope the plan** — it's locked. If something feels off after this pause, surface it as a finding in the v0.2.0 GATE 3 review, not as a plan revision.

---

## Cross-reference

- Decision file: [`.claude/decisions/2026-05-21-json-form-v0.1.5-through-v0.1.7-substrate-upgrade.md`](decisions/2026-05-21-json-form-v0.1.5-through-v0.1.7-substrate-upgrade.md)
- v0.1.7 spotcheck: [`docs/procomps/json-form-procomp/reviews/2026-05-21-v0.1.7-spotcheck.md`](../docs/procomps/json-form-procomp/reviews/2026-05-21-v0.1.7-spotcheck.md)
- Auto-memory: [`memory/project_json_form_v01_to_v02_progression.md`](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_json_form_v01_to_v02_progression.md)
- Consumer guide (now refreshed for v0.1.7 surface): [`docs/procomps/json-form-procomp/json-form-procomp-guide.md`](../docs/procomps/json-form-procomp/json-form-procomp-guide.md)
- Component-versions tracking: [`docs/component-versions.md`](../docs/component-versions.md) (json-form added to the forms category table; v0.1.7 Highlights entry authored)
