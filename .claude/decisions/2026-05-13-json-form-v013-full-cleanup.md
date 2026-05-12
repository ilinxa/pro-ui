---
date: 2026-05-13
session: json-form v0.1.3 — "fully cleaned" — closes all v0.1.2 review tail findings
phase: post-Phase-7 / GATE-3-rule era
type: patch-bump
commits: pending (this session)
components: json-form (v0.1.2 → v0.1.3; F-R4 + F-R5 + F-R6 + F-R7 + v0.1.0 F-04 cleanup)
findings: none — component is "fully cleaned" at v0.1.3
status: open
---

# json-form v0.1.3 — full cleanup, no open follow-ups

## Trigger

User asked: "did you apply all fixes?" — answer was no, only the three highest-severity findings had landed in v0.1.2. The four tail items (F-R4 Medium + F-R5/F-R6/F-R7 Low) plus a leftover v0.1.0 follow-up (F-04: demo's headless example hardcoded a strings literal) were deferred. User: "fix all and make sure this is fully cleaned." This bump closes all of them in one patch.

## F-R4 — `hasSubmitted` causing wide context re-renders

### The problem

`hasSubmitted` lived on the main `JsonFormContextValue` memo. The first time a user submits the form, `setHasSubmitted(true)` flipped it from false to true → memo invalidated → every field consuming the main context re-rendered. Cost is "minor today" (one cascade per form session) but inflates the re-render footprint and would compound if combined with a high-frequency value subscription later.

### The fix

Split into a narrow `JsonFormSubmittedContext` that lives **alongside** the main `JsonFormContext`. The provider takes `hasSubmitted` as a sibling prop:

```tsx
<JsonFormProvider value={ctx} hasSubmitted={hasSubmitted}>
  ...
</JsonFormProvider>
```

The provider renders BOTH contexts. The main `ctx` memo no longer depends on `hasSubmitted` → first-submit flip doesn't invalidate it → field consumers don't re-render.

New `useJsonFormHasSubmitted()` accessor for parts that ONLY care about post-submit state. `useJsonFormContext()` continues to merge the flag in (`{ ...ctx, hasSubmitted }`) for compat, so existing consumer code reading `ctx.hasSubmitted` keeps working — but it still triggers a re-render on flip because of the merge. Only the narrow accessor is fully isolated.

`<JsonFormErrorSummary>` updated to use `useJsonFormHasSubmitted()` directly. It's the only standalone part that depends on the flag.

## F-R5 — `JSON.stringify` memo keys

### The problem

Both `useConditional` and `useComputed` used `JSON.stringify(values)` as a memo dep. The `valuesKey` helper wrapped it in try/catch and returned `Object.keys(values).length` on serialization failure. The catch fallback is a silent freeze: if values are circular (DOM refs, function values, observables), the memo locks to a stale value and never reacts.

### The fix

Dropped the value-derived dep entirely in both hooks:

- **`useConditional`** — compute the three booleans (visible/enabled/required) inline. The body is bounded by Condition tree depth, well under 50 (per the O1 plan lock). Memoize ONLY the returned object on the boolean identities, so identity stability for `{ visible, enabled, required }` is preserved when nothing changed.
- **`useComputed`** — drop the outer `useMemo` too. The body is `interpolate(parsed, values)` OR `field.compute({ values })` — both O(n) on values. The caller in `field-computed.tsx` has its own `value !== computed` effect-guard so referential instability of the return value isn't a correctness problem.

Net: no more JSON.stringify; no more silent staleness on circular refs; the hot path is the same complexity as before (was already running the body every render under the JSON.stringify-keyed memo).

## F-R6 — richtext defaultValue ergonomics

### The problem

When a consumer didn't set `defaultValue` on a `richtext` field, the renderer fell back to `ARTICLE_BODY_EMPTY_VALUE` for display but RHF tracked the value as `undefined`. On submit, the consumer got `undefined` for that field — discrepancy with the visual state. Fix is doc-level: tell consumers to set the canonical default themselves.

### The fix

Re-exported `ARTICLE_BODY_EMPTY_VALUE` from `@ilinxa/article-body-01` as `JSON_FORM_RICHTEXT_EMPTY_VALUE` from json-form's barrel — single import for consumers. usage.tsx value-shape table now mentions it directly in the richtext row: "Default to `JSON_FORM_RICHTEXT_EMPTY_VALUE` when no initial content."

The re-export was alphabetized after the strings exports. No behavior change in the field renderer itself.

## F-R7 — `'use client'` on `lib/default-registry.ts`

### The problem

The file carried `"use client"` but it's a plain ref-bag (a `Record<string, FieldRenderer>` plus two `React.lazy` calls). `React.lazy` and `createElement` work on both server and client. The boundary is correctly carried by the `parts/*` modules it imports — those are `"use client"` and Next bundles them accordingly. Having `"use client"` on the registry itself was redundant and pulled the file into the client bundle unnecessarily.

### The fix

Removed the `"use client"` directive. Verified `pnpm build` still passes — Next correctly traces the client boundary through the `parts/*` imports. The registry file itself can now sit on the server-graph boundary if needed.

## Bonus — v0.1.0 F-04 cleanup

The headless-demo example in `demo.tsx` (inside the `<details>` block on the Custom registry tab) hardcoded an 18-key `strings` literal. v0.1.0 spotcheck flagged it (F-04 Low). v0.1.2 fixed F-04's parent file (typecheck issues with the bridge) but left the literal in place. Now swapped for the canonical `{ ...defaultJsonFormStrings }` spread — teaches the right consumer pattern.

The headless example also now wires up `hasSubmitted` via the new sibling-prop API to exercise that path end-to-end.

## Verification

- **`pnpm tsc --noEmit`:** clean.
- **`pnpm lint`:** 0 errors, 2 warnings (pre-existing in `file-tree` / `file-manager`, unrelated).
- **`pnpm validate:meta-deps`:** 42/42 clean.
- **`pnpm build`:** clean. 50/50 routes prerendered.
- **`pnpm registry:build`:** clean.

## GATE 3 — skipped per the rule

Patch bump, additive only (`useJsonFormHasSubmitted` new export; `JSON_FORM_RICHTEXT_EMPTY_VALUE` new export; `<JsonFormProvider>` gains an optional `hasSubmitted` sibling prop). Existing consumers continue to work. v0.1.0 spotcheck verdict (Pass with follow-ups) carries forward — except now there are no open follow-ups for json-form.

## Outstanding pre-push items

Only one remains: **smoke harness path-b** (F-01 from v0.1.0 spotcheck). This needs the registry artifact deployed to Vercel before it can be exercised. Run after first push, then fast-follow if it surfaces anything.

## Component state

**`json-form` v0.1.3** is fully cleaned. All four severities of every finding identified across v0.1.0 spotcheck + v0.1.1 re-review + v0.1.2 re-review now either:
- ✅ Fixed in the corresponding patch bump (v0.1.0 F-02/F-03 → reviewed-only; F-04 → fixed in v0.1.3; F-R1/F-R2/F-R3 → v0.1.2; F-R4/F-R5/F-R6/F-R7 → v0.1.3)
- ⏳ Smoke-harness-blocked (F-01, deferred to post-deploy)

## Total component count

**42 components** across 8 categories (unchanged; v0.1.3 is a bump).
