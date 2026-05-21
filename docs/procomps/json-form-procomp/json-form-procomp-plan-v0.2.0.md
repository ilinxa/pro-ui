# json-form — procomp plan, v0.2.0

> Stage 2 delta plan for the **v0.1.6 → v0.1.7 → v0.2.0** progression. Substrate decisions and public-API foundation are inherited from [`json-form-procomp-plan.md`](./json-form-procomp-plan.md) (v0.1.0 plan, signed off and shipped); this file specifies ONLY the deltas.
>
> **Predecessor work:** v0.1.5 (cross-procomp `/types` fix + echo-guard + docs polish), v0.1.6 (narrow-deps `useConditional` + `useComputed`, `AbortController` in async options, submit focus-walk, requiredWhen eager trigger, number-input empty-state coercion to `undefined`, error-summary anchor focus, `onSubmitAttempt` + `onReady` + `translatable` flag).
>
> **What this plan is NOT:** a re-litigation of v0.1.0's substrate decisions. RHF + Zod v4 + path-trie compiler + extensible registry + object-shape callbacks all stand. This plan adds public surface and lifts the per-keystroke render ceiling without removing or renaming anything.

---

## Strategic frame

json-form is a **substrate-grade** component: rcif (rich-card-in-flow), todo-rich-card, planned cms-field-registry, planned cms-schemas, and any AI-driven UI surface all eventually flow through it. v0.1.x is correct but B+ on three axes: per-keystroke perf, narrow-deps hooks for headless consumers, and devtools. v0.2.0 closes those gaps. Backward compatibility is non-negotiable — every v0.1.x consumer keeps working at default settings.

Risk profile is hedged by **staging the bumps**:

- **v0.1.7** — *strictly additive*. New optional props, new exported hooks, new exported factory, new exported devtools component, internal compile-split refactor. **Zero behavioral change at default settings.**
- **v0.2.0** — *behavioral additions*. Default-registry watch drop (the perf cliff lifter) + deep-merge `defaultValues`. Each shipped under a release note + FAQ entry, each gated behind verification + smoke.

If v0.1.7 ships and runs without regression report for **≥7 days post-deploy OR at least one external consumer installs + path-b smokes clean** (whichever comes first), v0.2.0 lands. If anything in v0.1.7 surfaces a regression, v0.2.0 holds.

---

## Substrate decisions (locked)

Inherited from v0.1.0 plan unless overridden below.

| Decision | Choice | Source |
|---|---|---|
| Backward compatibility | **Strictly additive.** No public-API signature removals, no renames, no behavior change at defaults. | Strategic frame, this plan |
| Versioning policy | v0.1.6 → **v0.1.7** (additive-only) → **v0.2.0** (behavioral additions) | Strategic frame |
| New peer deps | **None** | Audit — all features built on existing RHF + React + Tailwind |
| Existing v0.1.x consumers' migration | **Zero required** for v0.1.7. For v0.2.0: deep-merge `defaultValues` and default-registry watch drop are auto-applied with documented release notes; no consumer code changes. | Audit — see Risk register |
| GATE 3 review template | **Full checklist** ([`review-checklist.md`](../../reviews/templates/review-checklist.md), 16 dimensions, ~90 min) for v0.2.0; spot-check ([`review-spotcheck.md`](../../reviews/templates/review-spotcheck.md)) acceptable for v0.1.7 | Component-readiness rule for broad-scope public-API minor bumps |
| Compile split memoization | `useMemo` per `useJsonForm` instance — two memos instead of one (Q-P6 locked) | Q-P6 locked recommendation |
| `dependsOn` semantics | `undefined` = full-bag (current); `[]` = subscribe to nothing; non-empty array = narrow subscription (Q-P1 locked) | Q-P1 locked recommendation |
| Default-registry whitelist mechanism | Internal `Set<string>` in `lib/default-registry.ts` — invisible to consumers, audited once by us (Q-P2 locked) | Q-P2 locked recommendation |
| `<JsonFormDevtools>` posture | Floating fixed-position panel (bottom-right, collapsible) + `inline` prop for explicit-placement opt-out (Q-P3 locked) | Q-P3 locked recommendation |
| Devtools enablement gate | `process.env.NODE_ENV !== "production"` default + `force` prop for prod-debug (Q-P4 locked) | Q-P4 locked recommendation |
| `defineFieldRenderer` shape | Returns a `FieldRenderer` directly — registry-shape compatible (Q-P5 locked) | Q-P5 locked recommendation |
| `useJsonFormFieldValue` typing | `<T = unknown>(name): T` — consumer-asserted generic, JSDoc-noted (Q-P7 locked) | Q-P7 locked recommendation |
| Devtools tree-shaking | `lazy()` + `process.env.NODE_ENV` guard — same pattern as `field-code`/`field-richtext` | Risk register, this plan |
| `dependsOn` schema-lint | `validateSchemaDev` extended to warn on `dependsOn` paths referencing non-existent field names | Risk register, this plan |
| Cross-procomp dep changes | **None.** v0.2.0 does not touch `article-body-01` (no new re-exports required); `code-block` integration unchanged. | Audit — internal-only refactor + new files |
| Bundle posture | Devtools panel body lazy-loaded via `React.lazy()` (only the ~10 LOC loader stub ships at the import boundary; the ~250 LOC body chunk loads on first render). In prod, the component returns `null` before triggering the lazy load, so the body chunk is never fetched. Consumer-side `{process.env.NODE_ENV !== "production" && <JsonFormDevtools />}` gates the import entirely for true bundler-level dead-code-elimination (documented in usage.tsx). New hooks + factory + compile-split are pure-TS additions ≤ 200 LOC combined; no measurable bundle impact at default-import paths. | Risk register, this plan |

---

## v0.1.7 — additive scope

### Final API additions (deltas only)

```ts
// types.ts — additions to existing surface

/** Field DSL — opt-in narrow-deps for custom renderers reading `allValues`. */
export interface FieldDefinition {
  // ... existing fields unchanged ...

  /**
   * **v0.1.7 — typed metadata + schema-lint validation only. The runtime
   * watch-gating that honors this flag ships in v0.2.0.** Set the flag in
   * v0.1.7 to make schemas forward-compatible; perf wins materialize on
   * v0.2.0 upgrade.
   *
   * Once v0.2.0 lands, declares which field names this renderer's
   * `allValues` access depends on. The wrapper subscribes to ONLY these
   * names instead of the full values bag.
   *
   * - `undefined` (default) → full-bag subscription (current v0.1.x behavior)
   * - `[]` → no subscription; renderer receives a static `rhf.getValues()`
   *   snapshot under `allValues`. Use this when the renderer doesn't read
   *   `allValues` at all (the most common case for custom renderers).
   * - `['a', 'b']` → narrow subscription; `allValues` is rebuilt from the
   *   watched names only via `setByPath`.
   *
   * Built-in default-registry renderers (`text`, `radio-group`, `checkbox`,
   * etc.) auto-skip the subscription per an internal whitelist in v0.2.0 —
   * declare `dependsOn` only on custom renderers, or to override the
   * whitelist for a specific field.
   */
  dependsOn?: ReadonlyArray<string>;
}

// hooks/use-json-form-field-value.ts — new exports

/**
 * Narrow-deps single-field watch. Pure ergonomic wrapper around RHF's
 * `useWatch` scoped to one path.
 *
 * The generic `<T>` is consumer-asserted — RHF values aren't statically
 * known, so this is a typed assertion, not a guarantee.
 */
export function useJsonFormFieldValue<T = unknown>(name: string): T;

/**
 * Narrow-deps multi-field watch. Returns a path-keyed bag with only the
 * named fields rehydrated (via `setByPath`).
 *
 * The generic `<T>` is consumer-asserted (same caveat as
 * `useJsonFormFieldValue`) — RHF values aren't statically known.
 */
export function useJsonFormFieldsValue<
  T extends Record<string, unknown> = Record<string, unknown>,
>(names: ReadonlyArray<string>): T;

// lib/define-field-renderer.ts — new export

/**
 * Typed factory for custom field renderers. Narrows `value` and
 * `field.config` to consumer-declared types; emits a stable display name
 * for `<JsonFormDevtools>` rendering.
 */
export function defineFieldRenderer<TValue = unknown, TConfig = unknown>(
  config: {
    /** Optional display name for devtools panel ("MyColorRenderer"). */
    displayName?: string;
    impl: (args: NarrowedRendererArgs<TValue, TConfig>) => ReactNode;
  },
): FieldRenderer;

/** Internal narrowed-args type used by the factory's `impl` callback. */
interface NarrowedRendererArgs<TValue, TConfig>
  extends Omit<FieldRendererArgs, "value" | "field"> {
  value: TValue;
  field: FieldDefinition & { config?: { [key: string]: TConfig } };
}

// parts/json-form-devtools.tsx — new export

export interface JsonFormDevtoolsProps {
  /** Render inline instead of as a floating panel. */
  inline?: boolean;
  /** Force-enable in production builds (default: dev-only). */
  force?: boolean;
  /** Override the default keyboard shortcut (default: Ctrl+Shift+J). */
  shortcut?: string;
  className?: string;
}

export function JsonFormDevtools(props: JsonFormDevtoolsProps): ReactNode;
```

### File-by-file (v0.1.7)

| File | Operation | Est. LOC |
|---|---|---|
| `types.ts` | + `dependsOn?: ReadonlyArray<string>` on `FieldDefinition`; + `JsonFormDevtoolsProps`; + `NarrowedRendererArgs` (internal) | +35 |
| `lib/schema-compiler.ts` | refactor: extract `compileStructural(schema)` (slow, schema-keyed) + `injectStrings(zod, strings)` (fast, strings-keyed); `compileSchema(schema, strings)` becomes the composition wrapper. `compileSchema` is internal-only (not exported from `index.ts`), so this is purely an internal cleanup — no external API contract to preserve. The split unblocks the two-memo pattern in `useJsonForm`. | +60 / -25 net +35 |
| `hooks/use-json-form.ts` | rewire `useMemo` to split: `useMemo(() => compileStructural(schema), [schema])` + `useMemo(() => injectStrings(structural, strings), [structural, strings])`. Strings-only consumer overrides (locale switch, error-message customization) no longer trigger the trie rebuild. | +15 / -3 net +12 |
| `hooks/use-json-form-field-value.ts` | **NEW** — `useJsonFormFieldValue<T>(name)` + `useJsonFormFieldsValue(names)`. Both wrap RHF `useWatch({ control, name: ... })` against the active form context (resolved via `useJsonFormContext().rhf.control`). Multi-field variant rebuilds a path-keyed bag via `setByPath` (mirrors the use-conditional pattern from v0.1.6). | +60 |
| `lib/define-field-renderer.ts` | **NEW** — typed factory. Returns the `impl` as `FieldRenderer` (no runtime narrowing — TS-only sugar) with `displayName` attached as a non-enumerable property for devtools rendering. | +35 |
| `parts/json-form-devtools.tsx` | **NEW** — loader stub (~60 LOC). Holds the `JsonFormDevtools` component, `JsonFormDevtoolsProps`, the `React.lazy(() => import("./json-form-devtools-body"))` boundary, the prod no-op gate, and the `Suspense fallback={null}` wrapping. Ships in the main bundle. | +60 |
| `parts/json-form-devtools-body.tsx` | **NEW** — panel body (~250 LOC). Reads `useJsonFormContext()` (`schema`, `zodSchema`, `formId`, `rhf`) + `useFormState({ control })` (errors) + `useWatch({ control })` (values, devtools-only so the subscription cost is OK). Four tabs: Schema (collapsible JSON), Values (live RHF values), Conditionals (per-field visible/enabled/required booleans, each row uses `useConditional` so narrow-deps applies), Errors. Inline OR floating posture (forwarded via the loader stub's `inline` prop). Keyboard shortcut listener (default `Ctrl+Shift+J`, forwarded via `shortcut` prop) toggles open/closed. Lives in its own file so `React.lazy()` can chunk it — body only fetches when the component mounts to a non-null state. | +250 |
| `lib/default-registry.ts` | + `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES: Set<string>` exported as a frozen-internal constant. All 25 built-in types from the default registry added per audit (`section` + `divider` included for completeness even though they never hit FieldWrapper). Used by `field-wrapper.tsx` in v0.2.0; in v0.1.7 it's defined but unused (the gate-on-whitelist behavior ships in v0.2.0). Defining it now keeps v0.2.0's diff small. | +15 |
| `lib/validate-schema.ts` | + new check: walk each field's `dependsOn` (if defined), warn on any name not matching `schema.fields[i].name` exactly. Match is dot-path-as-flat-string — `dependsOn: ['address.city']` matches a field whose `name === 'address.city'`. Fields declared via nested `defaultValue` shapes (e.g., `{ name: 'address', defaultValue: { city: '…' } }`) WON'T satisfy the lint for `'address.city'` — consumers must add individual entries per leaf to declare them lint-visible (documented). Single extra `for` loop ~10 LOC. | +12 |
| `index.ts` | + `useJsonFormFieldValue`, `useJsonFormFieldsValue`, `defineFieldRenderer`, `JsonFormDevtools` exports. + `JsonFormDevtoolsProps` type. | +10 |
| `usage.tsx` | + 3 new sections: `dependsOn` (custom renderer perf opt-in), `<JsonFormDevtools>` (dev panel walkthrough), `defineFieldRenderer<T>` (typed authoring). + FAQ entry on compile-split (mostly invisible — for advanced consumers using `compileSchema` directly). | +120 |
| `demo.tsx` | + new tab "Devtools + perf" demonstrating: (a) `<JsonFormDevtools>` inline panel beside the form; (b) a custom renderer using `defineFieldRenderer<string>` with `dependsOn: ['otherField']`; (c) a perf-comparison side-by-side of two identical 20-field forms — one with the default behavior, one with `dependsOn` on every custom renderer — showing the React DevTools profiler render-count delta. | +90 |
| `meta.ts` | bump `version: "0.1.7"`, `updatedAt: "2026-05-XX"`, expand `features` with 4 new entries (dependsOn opt-in, narrow-deps hooks, defineFieldRenderer factory, devtools panel), expand `description` accordingly | +5 |
| `registry.json` | + 4 new files in json-form item: `lib/define-field-renderer.ts`, `hooks/use-json-form-field-value.ts`, `parts/json-form-devtools.tsx`, `parts/json-form-devtools-body.tsx`. (`lib/flatten-errors.ts` was added in v0.1.6 and is already present.) The 4-file count reflects the devtools stub + body split — `React.lazy()` requires a separate module for the body chunk. | +4 |

**Total new code:** ~740 LOC across 14 files (4 new files, 10 modified). Re-add: 35 + 35 + 12 + 60 + 35 + 60 + 250 + 15 + 12 + 10 + 120 + 90 + 5 + 4 = 743. (Pre-fix total was ~690 / 13 files / 3 new — the devtools split into stub + body added 1 file; the body's 250-LOC chunk replaces the original ~260-LOC single-file estimate, so net deltas: +1 file, +~50 LOC vs the original plan number.)

### Commit chain (v0.1.7)

| # | Commit | Scope | Verification |
|---|---|---|---|
| C1 | feat(json-form): compile-split refactor (A3) | `schema-compiler.ts`, `use-json-form.ts` | tsc + lint clean; `compileSchema` is internal-only so no external contract to preserve; the two-memo cache validated via a render-count probe on a strings-only override |
| C2 | feat(json-form): `dependsOn` typed prop + schema-lint warn (A1 type-only) | `types.ts`, `validate-schema.ts` | tsc + lint clean; dev-warn fires on dangling `dependsOn` reference |
| C3 | feat(json-form): `useJsonFormFieldValue` + `useJsonFormFieldsValue` (C1) | `hooks/use-json-form-field-value.ts`, `index.ts` | tsc + lint clean; runtime smoke from demo |
| C4 | feat(json-form): `defineFieldRenderer` factory (C2) | `lib/define-field-renderer.ts`, `index.ts` | tsc + lint clean |
| C5 | feat(json-form): `<JsonFormDevtools>` panel (C3) | `parts/json-form-devtools.tsx`, `index.ts` | tsc + lint clean; bundle analyzer confirms the lazy panel-body chunk is absent from prod entry chunks (loader stub may remain unless consumer-side import is conditional) |
| C6 | docs(json-form): v0.1.7 usage + demo updates | `usage.tsx`, `demo.tsx` | docs render clean; perf-comparison demo verified in browser |
| C7 | chore(json-form): bump v0.1.7 + registry.json + spotcheck | `meta.ts`, `registry.json`, `reviews/2026-05-XX-v0.1.7-spotcheck.md` | full producer verification chain + path-b smoke harness pass |

Each commit ships green tsc + lint + meta-deps + registry-build. Path-b smoke runs at C7 against the deployed Vercel artifact post-push.

---

## v0.2.0 — behavioral scope

### Behavioral deltas

#### A2 — Default-registry watch drop (the perf cliff)

**Current behavior (v0.1.x):** every `FieldWrapper` calls `useWatch({ control })` to populate `allValues` for the renderer, regardless of whether the renderer reads it. Result: every field re-renders on every keystroke anywhere in the form.

**v0.2.0 behavior:** `FieldWrapper` resolves the subscription mode in this order — gates aligned with Q-P1's three semantic states:

1. **Snapshot mode (no watch)** — when EITHER the resolved renderer type is in `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES` (built-in default whitelist) OR `field.dependsOn` is defined-and-empty (`[]`). `allValues` is populated via `rhf.getValues()` at render time. No re-render on other-field changes.
2. **Narrow watch** — when `field.dependsOn` is a non-empty array. `useWatch({ control, name: dependsOn })` returns positional values, rebuilt into a path-keyed bag via `setByPath`. Re-renders only when one of the listed fields changes.
3. **Full-bag watch (current behavior)** — otherwise. Preserves v0.1.x behavior for custom renderers that haven't opted in.

Custom renderers REPLACE built-in types in the registry merge, so the whitelist check resolves on the FINAL renderer identity (looked up via `registry[field.type]`), not on `field.type` alone. A custom renderer at the `text` slot correctly OPTS OUT of the watch drop unless it explicitly sets `dependsOn`.

**Why this is safe:**
- Default renderer audit (completed 2026-05-21): every built-in default renderer was checked for `args.allValues` access. **None of the 25 built-in renderers reads `args.allValues` directly.** `computed`'s renderer destructures only `field`, `value`, `onChange`, `disabled`, `ariaProps`; the values-reading happens INSIDE `useComputed()` via its own narrow `useWatch` (already optimized in v0.1.6), which is independent of the FieldWrapper-level watch. All 25 types therefore enter `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES`: `text`, `email`, `password`, `url`, `tel`, `number`, `textarea`, `select`, `multi-select`, `radio-group`, `checkbox`, `checkbox-group`, `switch`, `date`, `date-range`, `time`, `datetime`, `slider`, `rating`, `code`, `richtext`, `computed`, `hidden`, `section`, `divider` (`section`/`divider` are layout-only and never hit FieldWrapper, but listing them keeps the set complete). The 24-types-in-v0.1.0 figure from the v0.1.0 plan reflects pre-`richtext`; `richtext` was added in v0.1.1.
- Only consumer-extensible registry slots can read `args.allValues` reactively. Those slots ride the full-bag watch by default — opt-in to perf via `dependsOn`.
- Consumer-registered custom renderers OVERRIDE built-in types; the whitelist check resolves on the FINAL renderer identity (looked up via `registry[field.type]`), so a custom renderer replacing `text` correctly opts out of the watch drop.
- `dependsOn` provides a per-field opt-back-in for the rare case where a consumer-custom renderer wants narrow-deps without the renderer-identity check.

**Expected perf delta** (measured on a 20-field form with 5 conditionals, 1 keystroke):

| Cost | Today (v0.1.6) | After v0.2.0 |
|---|---|---|
| FieldWrapper renders | 20 | 1–4 (only fields whose `useConditional`/`useComputed` narrow-deps reference the typed field re-render) |
| `resolveConditionOrFn` calls | 0–1 (already narrow-deps from v0.1.6) | 0–1 (unchanged) |
| Zod resolver runs | 1 | 1 |
| Default-registry `useWatch` subscriptions per FieldWrapper | 1 (full-bag) | 0 (snapshot via `getValues()`) |

The 50-conditional dev-warn in `validateSchemaDev` is **demoted to 200-conditional** (still useful as a sanity check, but no longer a perf cliff at 50 — render count no longer scales with conditional count under the watch-drop).

#### B1 — Deep-merge `defaultValues`

**Current behavior (v0.1.x):** `mergeDefaultValues` walks per-field `defaultValue` into a nested bag, then overlays form-level `defaultValues` via shallow per-top-level-key replacement. Result: `formLevel = { address: { city: 'X' } }` replaces the entire `address` object, dropping any per-field nested defaults under `address.country`, `address.zip`, etc.

**v0.2.0 behavior:** form-level `defaultValues` is walked via `setByPath` per leaf — every leaf value in `defaultValues` overlays the per-field nested bag at the exact leaf path, preserving sibling per-field defaults.

**Why this is safe:**
- Audit (completed 2026-05-21): no demo schema, no fixture schema, and no known internal consumer relies on the shallow-replace behavior. The semantic shift is "you get more of your nested per-field defaults preserved" — strictly an improvement for any consumer pattern using nested addresses, contact info, etc.
- Documented in v0.2.0 release notes + FAQ entry: "If you were relying on `defaultValues = { address: {} }` to clear nested per-field defaults, you now need to be explicit per leaf: `defaultValues = { 'address.country': '' }` (RHF flat path) or pass an empty `address` per nested leaf."

### File-by-file (v0.2.0)

| File | Operation | Est. LOC |
|---|---|---|
| `parts/field-wrapper.tsx` | resolve the subscription mode (per Q-P1's three semantic states): (1) **snapshot** — when renderer type ∈ `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES` OR `field.dependsOn` is defined-and-empty (`[]`) → `getValues()` snapshot, no watch; (2) **narrow watch** — when `field.dependsOn` is non-empty → `useWatch({ control, name: dependsOn })`, rebuild via `setByPath`; (3) **full-bag watch** — otherwise, current v0.1.x behavior. Snapshot mode drops the FieldWrapper-level `allValues` re-render trigger entirely. | +30 / -5 net +25 |
| `hooks/use-json-form.ts` | rewrite `mergeDefaultValues` — use `setByPath` per leaf instead of shallow per-top-level-key replacement. Add a small `walkLeaves(obj, prefix, fn)` helper. | +30 / -15 net +15 |
| `lib/validate-schema.ts` | tweak: bump the conditional-count warning threshold from 50 → 200 (post-v0.2.0 the per-keystroke render count no longer scales with conditional count). | +1 / -1 |
| `usage.tsx` | + section: "What changed in v0.2.0" — release-note-style explanation of the watch drop + deep-merge behavior. + 1 FAQ entry on the deep-merge change. | +40 |
| `meta.ts` | bump `version: "0.2.0"`, `updatedAt: "2026-05-XX"`. Update `features` list to reflect the perf cliff lift and deep-merge default semantics. | +5 |

**Total v0.2.0 code:** ~85 LOC across 5 files (all modified).

### Commit chain (v0.2.0)

| # | Commit | Scope | Verification |
|---|---|---|---|
| C1 | feat(json-form): deep-merge defaultValues (B1) | `use-json-form.ts` | tsc + lint clean; round-trip test: `mergeDefaultValues({ address: { country: 'US' } }, { address: { city: 'NYC' } })` returns `{ address: { country: 'US', city: 'NYC' } }` |
| C2 | feat(json-form): default-registry watch drop + dependsOn gate (A2) | `field-wrapper.tsx`, `validate-schema.ts` | tsc + lint clean; React DevTools profiler verifies render-count drop on 20-field form; backward-compat audit: existing demo schemas + fixtures all render visually identically |
| C3 | docs(json-form): v0.2.0 release notes + FAQ | `usage.tsx` | docs render clean |
| C4 | chore(json-form): bump v0.2.0 + registry.json + GATE 3 full checklist review | `meta.ts`, `registry.json`, `reviews/2026-05-XX-v0.2.0-checklist.md`, decision file | full review + smoke + STATUS update |

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| `useJsonFormFieldValue<T>` consumer mis-types a path → silent type-assertion failure | 🔸 Medium | JSDoc warns that the generic is consumer-asserted. Runtime returns `unknown` shape regardless; only the TS narrowing is consumer-trusted. |
| Devtools panel imported in prod accidentally (consumer forgets `process.env.NODE_ENV` guard at their layer) | 🔸 Medium | Two-layer mitigation: (a) internal `React.lazy()` boundary keeps the ~250 LOC panel body in a separate chunk that's never fetched if the component returns null first; (b) internal `if (process.env.NODE_ENV === "production" && !force) return null;` makes the prod render a no-op. The loader stub (~10 LOC) still ships unless the consumer-side import is conditional — usage.tsx documents the conditional-import pattern for consumers who want zero stub bytes in prod. Bundle analyzer step in the v0.1.7 spotcheck verifies the panel-body chunk is absent from prod entry chunks. |
| Default-registry whitelist drift — a future built-in renderer reads `allValues` but author forgets to remove it from the set | ⚠️ High | Add a `validate-meta-deps`-style lint check at v0.2.0 + 1: scan default-registry renderer source files for `args.allValues` access, surface a tracker error if a whitelisted renderer reads it. Until then: hand-audit per renderer-change PR + a unit-test stub. |
| `dependsOn` consumer footgun — lists a non-existent path | 🔹 Low | `validateSchemaDev` warns on dangling `dependsOn` reference in v0.1.7 (lands at C2 of the v0.1.7 chain). |
| Compile split breaks `schema.zodSchema` consumer-merge | 🔸 Medium | Test path: `compileStructural` returns base zod, `injectStrings` decorates messages, the consumer-merge step (existing v0.1.x code) runs LAST per existing precedent. Verified in compiler spec walk-through (this plan). |
| `<JsonFormDevtools>` keyboard-shortcut conflicts with consumer app's existing shortcut | 🔹 Low | Default `Ctrl+Shift+J` overridable via `shortcut` prop. Document in usage.tsx. |
| F-cross-13 carriers in devtools panel | 🔸 Medium → 🔹 Low | Devtools uses Buttons + Inputs + plain HTML only — no Select / Checkbox / Tooltip / Popover. Audit complete; no shadcn-primitive Radix↔Base UI divergence carriers present. |
| Deep-merge `defaultValues` surprises a consumer relying on shallow-replace | 🔹 Low | Audit (2026-05-21) found no shipping consumer with that pattern. Documented in v0.2.0 release notes + FAQ. |
| Downstream procomp consumers break on v0.2.0 | 🔸 Medium | rcif uses json-form for its port editor (confirmed). Other downstream consumers (todo-rich-card, planned cms-* surfaces) audited at v0.2.0 C4 verification step — grep each procomp's source for `JsonForm` / `useJsonForm` / `JsonFormProvider` imports, confirm each uses default-registry renderers OR sets explicit `dependsOn`. Smoke harness runs `pnpm dlx shadcn@4.6.0 add @ilinxa/json-form` AND each downstream consumer slug, then consumer-side `pnpm tsc --noEmit`, gating C4 sign-off. |

---

## Open Q-Ps (locked recommendations, user can flip)

#### Q-P1 — `dependsOn` semantics on empty-array → **LOCKED: option (a)**

`undefined` = full-bag; `[]` = subscribe to nothing (renderer doesn't read `allValues`); `['a','b']` = narrow subscription. Three distinct states; matches React's `useEffect` deps mental model.

#### Q-P2 — Default-registry whitelist mechanism → **LOCKED: option (a)**

Internal `Set<string>` in `lib/default-registry.ts`. Invisible to consumers; audited once by us.

#### Q-P3 — `<JsonFormDevtools>` rendering posture → **LOCKED: option (a)**

Floating fixed-position panel (bottom-right, collapsible) by default. Toggle via `Ctrl+Shift+J`. `<JsonFormDevtools inline />` for inline-block placement.

#### Q-P4 — Devtools enablement gate → **LOCKED: option (a)**

`process.env.NODE_ENV !== "production"` automatic + `force` prop for the rare prod-debug case.

#### Q-P5 — `defineFieldRenderer` shape → **LOCKED: option (a)**

Returns `FieldRenderer` directly. Registry-shape compatible. Type-narrowing only.

#### Q-P6 — Compile split memoization cache → **LOCKED: option (a)**

`useMemo` per `useJsonForm` instance. WeakMap optimization deferred until benchmarks show multi-mount churn.

#### Q-P7 — `useJsonFormFieldValue` typing → **LOCKED: option (a)**

`useJsonFormFieldValue<T = unknown>(name: string): T`. JSDoc-noted consumer-asserted generic.

---

## Sign-off

> **Awaiting user sign-off.** Once confirmed:
> 1. Author the v0.1.7 + v0.2.0 changes per the commit chains above.
> 2. v0.1.7 ships first; ride ≥7 days post-deploy OR until one external consumer installs + path-b smokes clean (whichever comes first).
> 3. If clean, v0.2.0 ships next.

### What the v0.1.7 implementation PR will contain (in order)

1. C1 — `schema-compiler.ts` refactored (compile split); `use-json-form.ts` rewired.
2. C2 — `types.ts` adds `dependsOn`; `validate-schema.ts` adds the dangling-reference warning.
3. C3 — `hooks/use-json-form-field-value.ts` created (both hooks); `index.ts` exports them.
4. C4 — `lib/define-field-renderer.ts` created; `index.ts` exports it.
5. C5 — `parts/json-form-devtools.tsx` created; `index.ts` exports it.
6. C6 — `usage.tsx` adds 3 new sections; `demo.tsx` adds the perf-comparison + devtools tab.
7. C7 — `meta.ts` v0.1.7 (version bump + features list expansion + context paragraph refresh), `registry.json` adds the 4 new files (`lib/define-field-renderer.ts`, `hooks/use-json-form-field-value.ts`, `parts/json-form-devtools.tsx`, `parts/json-form-devtools-body.tsx`; `lib/flatten-errors.ts` was already added in v0.1.6), spotcheck review file authored, decision file authored, STATUS.md updated, smoke harness run against deployed artifact.

### What the v0.2.0 implementation PR will contain (in order)

1. C1 — `use-json-form.ts` `mergeDefaultValues` rewritten via `setByPath` per leaf.
2. C2 — `parts/field-wrapper.tsx` gated `useWatch` (per-field-type-whitelist + `dependsOn` opt-in); `validate-schema.ts` conditional-count threshold bumped to 200.
3. C3 — `usage.tsx` v0.2.0 release notes + FAQ entry.
4. C4 — `meta.ts` v0.2.0, full-checklist review file authored at `reviews/2026-05-XX-v0.2.0-checklist.md`, decision file authored, STATUS.md updated, smoke harness run including rcif + todo-rich-card downstream verification.

### Estimated effort

| Phase | Sessions |
|---|---|
| v0.1.7 — compile split + types + new hooks + factory (C1–C4) | 0.75 |
| v0.1.7 — devtools panel (C5) | 1.5 |
| v0.1.7 — docs + demo (C6) | 0.5 |
| v0.1.7 — verify + spotcheck + smoke (C7) | 0.5 |
| **v0.1.7 subtotal** | **~3.25 sessions** |
| v0.2.0 — deep-merge + field-wrapper gate + threshold (C1–C2) | 0.75 |
| v0.2.0 — docs + full-checklist review + smoke (C3–C4) | 0.75 |
| **v0.2.0 subtotal** | **~1.5 sessions** |
| **Total** | **~4.75 sessions** |

After v0.2.0's GATE 3 verdict ≥ "Pass with follow-ups", json-form is at production-grade A+ — perf cliff lifted, headless layer complete, devtools shipped, every existing consumer keeps working unchanged.
