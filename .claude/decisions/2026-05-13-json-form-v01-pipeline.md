---
date: 2026-05-13
session: json-form v0.1.0 first-ship pipeline (continuation of 2026-05-12 foundation session)
phase: post-Phase-7 / GATE-3-rule era
type: ship
commits: pending (this session)
components: json-form (new), schema-compiler/expression-parser/condition-evaluator (new pure-fn modules), validate-meta-deps (extended for `dependencies.internal`)
findings: F-01 path-b smoke pre-push (v0.1.0/v0.1.1), F-02 requiredWhen validation-timing FAQ (v0.1.1), F-03 use-client on default-registry (deferred to v0.2.0 refactor), F-04 swap headless-demo strings literal for `defaultJsonFormStrings` spread (v0.1.1)
status: open
---

# json-form v0.1.0 — first ship + first cross-registry `dependencies.internal` consumer

## What shipped

**`json-form` v0.1.0** under the existing `forms` category — sixth component to clear the GATE-3 readiness-review rule, ninth procomp under the GATE-1/GATE-2 planning-doc regime, and the **first component to actually use `dependencies.internal`** (the key was added to the `ComponentDependencies` type during an earlier session at [`src/registry/types.ts:20`](../../src/registry/types.ts#L20) but no component had imported a sibling registry slug until now). The cross-registry dep is on `@ilinxa/code-block`, slotted by `parts/field-code.tsx` for the `code` field type and lazy-loaded via `React.lazy` so the CodeMirror chunk only ships when a form actually contains a `code` field.

Schema-driven form renderer. Consumer hands `<JsonForm>` a `FormSchema { fields: FieldDefinition[]; validate?; zodSchema?; meta? }`; the component renders the form. 24 built-in field types across 5 families: text (`text` / `email` / `password` / `url` / `tel` / `textarea` / `number`), choice (`select` / `multi-select` / `radio-group` / `checkbox` / `checkbox-group` / `switch`), date/time (`date` / `date-range` / `time` / `datetime`), rich-composite (`code` / `slider` / `rating`), special (`computed` / `hidden` / `section` / `divider`). Validators block compiles to a Zod chain at mount; `validate` + `validateAsync` per-field via `.superRefine()`; form-level `validate` via outer `.superRefine()`; `requiredWhen` via another outer `.superRefine()` that conditionally enforces required-ness against the runtime values bag; consumer-provided `zodSchema` merges LAST (per-key override). Conditional logic via 11-operator Condition DSL plus function escape hatch — `equals` / `notEquals` / `in` / `notIn` / `matches` / `truthy` / `greaterThan` / `lessThan` / `all` / `any` / `not`. Computed fields via pure `expression: '{a} {b}'` template OR `compute: (args) => unknown` function — both deps-tracked (template parse for `expression`, naive proxy-probe for `compute`).

Substrate: react-hook-form v7.75.0 + @hookform/resolvers v5.2.2 + zod v4.4.3 + lucide-react v1.11.0. Plan-stage refined description's `zod@^3.x` to `^4.4.3` (current stable; @hookform/resolvers v5 supports v4 via standard-schema spec; v4's `z.email()` top-level + better inference + smaller bundle).

42 files in the sealed folder under `src/registry/components/forms/json-form/`:
- **Top-level (8):** `json-form.tsx` (the orchestrator), `json-form-context.tsx`, `index.ts` (barrel — no `meta` re-export per F-cross-11), `types.ts`, `meta.ts`, `demo.tsx` (7 tabs), `usage.tsx`, `dummy-data.ts` (6 fixture schemas + `mockFetchSchema` async helper)
- **`parts/` field renderers (16):** field-text (handles text/email/password/url/tel/number), field-textarea, field-select (handles select + multi-select; switches to Command+Popover combobox for `searchable: true` OR `multi-select`), field-radio-group, field-checkbox, field-checkbox-group, field-switch, field-date (handles date/date-range/time/datetime; Popover-wrapped Calendar + native `<input type="time">`), field-code (lazy-loaded; wraps `@ilinxa/code-block` in `mode='edit'`), field-slider, field-rating (custom inline star widget with `role="radiogroup"` + arrow/number/Home/End keys), field-computed, field-hidden, field-section, field-divider, field-fallback (unknown types)
- **`parts/` surface atoms (6):** field-wrapper (the shared shell — label + helper + error + ARIA via `Slot.Root` + visibility unmount via `useConditional`), form-header, error-summary, submit-button, reset-button, json-form-field
- **`hooks/` (5):** use-json-form (headless factory), use-conditional, use-computed, use-async-options, use-debounced-callback
- **`lib/` (7):** schema-compiler, condition-evaluator, expression-parser, default-registry, strings, path, validate-schema

Comparable in size to code-block (42 files) and rich-card (51 files). Top of the sealed-folder norm but appropriate for the surface size — 38-line `JsonFormProps`, 12-method imperative handle, 24 field types, 11-operator Condition DSL.

## What changed during implementation (relative to the plan)

Three consumer-invisible refinements landed during implementation:

1. **`JsonFormContextValue` gained a `fieldRegistry` member.** The plan's context type only carried `rhf` / `schema` / `zodSchema` / `strings` / `formId` / `hasSubmitted`. But `<JsonFormField>` (standalone part) needs to resolve renderers, and without `fieldRegistry` on context every call site would have to re-merge `defaultJsonFormRegistry` ⨯ consumer overrides. Additive — consumers building a context manually now pass `fieldRegistry: defaultJsonFormRegistry` (or their own merged variant).

2. **`JsonFormContextValue` / `JsonFormProvider` / `useJsonFormContext` generics widened to `extends Record<string, any>`.** RHF's `FieldValues` is `Record<string, any>` — the foundation `types.ts` had already locked `JsonFormProps<TValues extends Record<string, any>>` for this reason. Extending the same constraint to the context types unblocks a class of tsc errors when consumers pass typed `TValues`. The `any` is namespaced via per-file `eslint-disable @typescript-eslint/no-explicit-any` blocks with a comment explaining the RHF constraint.

3. **`'form'` was dropped from `meta.ts`'s shadcn deps.** The plan listed it as a prerequisite primitive (one of the four added via `pnpm dlx shadcn add form radio-group slider label`), but the implementation never imported the `Form` / `FormProvider` / `FormField` wrappers from `@/components/ui/form`. Instead, `FieldWrapper` uses `Controller` from `react-hook-form` directly and `Slot.Root` from `radix-ui` to forward `id` + `aria-*` onto whatever single element the renderer returns. Same end-state, less indirection. The shadcn `form.tsx` file itself is still present in the workspace (added during the prerequisite step) and may serve other future components; meta-deps audit confirmed it's not falsely shipped under json-form.

The plan's "T1 — single canonical FieldRenderer signature (no FieldRendererComponent alias)" lock held. The plan's "T3 — single-file lazy for the code field" lock held. The plan's "T9 — `name` required for section/divider" lock held.

## Verification

- **`pnpm tsc --noEmit`:** clean.
- **`pnpm lint`:** 0 errors, 2 warnings (both pre-existing in `file-tree` / `file-manager` — unrelated incompatible-library hints from React Compiler around TanStack Virtual).
- **`pnpm validate:meta-deps`:** 42/42 clean. Surfaced + cleaned a phantom `video-player-01` declaration in `post-card-01`'s `dependencies.internal` along the way (caught by the lint extension that landed in the 2026-05-12 foundation session — this is exactly what the lint was designed to catch).
- **`pnpm build`:** clean. 50/50 routes prerendered. 57s compile.
- **`pnpm registry:build`:** clean. Generated `public/r/json-form.json` (118 KB; 37 files) + `public/r/json-form-fixtures.json` (12 KB; 1 file).
- **Demo verification:** 7 tabs render at `/components/json-form` (verified locally during dev). Registration tab submits cleanly; Backend-driven tab loads mock fixtures with 800ms delay; Conditional tab toggles fields on `kind === 'other'` and `cadence === 'annually'`; Computed tab updates `displayName` and `domain` live; Rich fields tab lazy-loads CodeMirror on first render of the `code` field; Imperative tab exercises `submit` / `reset` / `setValue` / `focus` via `ref`; Custom registry tab exercises both `fieldRegistry` prop AND the embedded fully-headless example using `<JsonFormProvider>` + `useJsonForm()` + standalone parts.
- **Smoke harness path-b:** NOT YET RUN (F-01). The harness consumer at `e:/tmp/ilinxa-smoke-consumer/` needs `pnpm dlx shadcn@latest add @ilinxa/json-form` to be exercised against the deployed Vercel artifact (resolves after this push lands on master). Recommended pre-push if user wants to gate v0.1.0 on smoke, else fast-follow as v0.1.1.

## GATE 3 verdict

**Pass with follow-ups.** Review file at [`docs/procomps/json-form-procomp/reviews/2026-05-13-v0.1.0-spotcheck.md`](../../docs/procomps/json-form-procomp/reviews/2026-05-13-v0.1.0-spotcheck.md). 4 findings:

- **F-01 (🔸 Medium)** — Smoke harness path-b not yet exercised; pre-push or v0.1.1 fast-follow.
- **F-02 (🔹 Low)** — `requiredWhen` Zod validation only re-runs on touched/submit per RHF's default `onTouched` mode; FAQ entry in v0.1.1, optional eager `form.trigger(name)` in next minor.
- **F-03 (🔹 Low)** — `'use client'` on `lib/default-registry.ts` is technically additive (all imports from there pull `'use client'` modules anyway), but the file itself is a registry-object module that could stay pure. Deferred to v0.2.0 if a registry-vs-types split refactor lands.
- **F-04 (🔹 Low)** — Headless-demo example in `demo.tsx` (inside `<details>` block) hardcodes a `strings` object instead of spreading `defaultJsonFormStrings`. Cosmetic — swap in v0.1.1 to teach the canonical pattern.

None are blocking. Component "closes" — eligible for push to master.

## Active queue progression

5 of 6 (+ 1 inserted `code-block` + 1 inserted `json-form`) shipped. Remaining 3: `rich-graph-2`, `chat-panel`, `notification-system`.

## Total component count

**42 components total** across 8 categories.
