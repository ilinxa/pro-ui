# `properties-form` — v0.1 Plan (Stage 2)

> **Status:** **DRAFT 2026-04-29.** Awaiting user validate pass. Per the project working pattern: draft → validate → re-validate → sign-off. Q-Ps below are in **Recommendation:** form; convert to **Locked:** on sign-off.
> **Slug:** `properties-form` · **Category:** `forms` · **Tier:** 1 (generic; no graph dependency)
> **Parent description:** [properties-form-procomp-description.md](properties-form-procomp-description.md) (signed off 2026-04-28)
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (independent at the registry level per [decision #35](../../systems/graph-system/graph-system-description.md))

---

## 1. Inherited inputs (one paragraph)

Builds against [properties-form description §8 locked decisions](properties-form-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) (10 questions; Q2 + Q5 revised on review) and [§8.5 plan-stage tightenings](properties-form-procomp-description.md#85-plan-stage-tightenings-surfaced-during-description-review) (4 surfaced). Inherits system constraints: [decision #6](../../systems/graph-system/graph-system-description.md) (DetailPanel Edit is inline), [#17](../../systems/graph-system/graph-system-description.md) (origin field is the host's concern, not properties-form's — properties-form is generic over entity shape), [#23](../../systems/graph-system/graph-system-description.md) (mixed-permission rendering is the architectural anchor — §6.2 of description), [#25](../../systems/graph-system/graph-system-description.md) (per-component permission resolver — own resolver inside properties-form), [#35](../../systems/graph-system/graph-system-description.md) (Tier 1 independence — no Tier 1 imports another at the registry level), [#37](../../systems/graph-system/graph-system-description.md) (design-system mandate — Onest + JetBrains Mono, OKLCH only). Prior art: [rich-card](../rich-card-procomp/) (counter-based dirty tracking; permission-tooltip pattern; sync-only validation per Q14 of rich-card's plan; ~200-400 LoC build-from-scratch state mgmt).

---

## 2. v0.1 scope summary

The deliverable is a single Tier 1 pro-component at `src/registry/components/forms/properties-form/`. Surface area:

- **Six built-in field types** — `string`, `number`, `boolean`, `date`, `select`, `textarea`. Native `<input type="date">` per [Q1 lock](properties-form-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28); shadcn `Calendar` upgrade in v0.2.
- **Read mode + Edit mode** with a default of `"read"` per [Q9 lock](properties-form-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28); edit mode requires `onChange` (runtime dev-only `console.error` if missing per Q6).
- **3-state per-field permission** (`editable` / `read-only` / `hidden`) per [Q4 lock](properties-form-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) with `permissionReason` tooltip on read-only.
- **Layered permission resolver**: declarative `field.permission` → host predicate `resolvePermission` → default `editable`. Predicate escape hatch parallels rich-card's pattern.
- **Sync-only validation** in two layers: per-field `validate(value, allValues)` runs on every commit; form-level `validate(values)` runs on submit. Async deferred to v0.2 per description §3.
- **Dirty tracking** — counter-based (`version` increments on every commit; `cleanVersion` snapshots on `markClean`/mount/successful submit; `isDirty = version !== cleanVersion`). Same shape as rich-card.
- **Async `onSubmit`** with field-disable + 200ms-delayed spinner + `aria-busy` semantics + first-error focus on `{ ok: false, errors }`.
- **Custom field renderer slot** (`field.renderer`) for non-built-in types and visual customization.
- **Generic component** parameterized as `<PropertiesForm<T>>`; loose `Record<string, unknown>` default per [Q2 lock](properties-form-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28).
- **Imperative ref handle** (`isDirty`, `markClean`, `reset`, `focusField`, `submit`).
- **ARIA contract** — `<label>` association, `aria-required`, `aria-invalid`, `aria-describedby`, focus management on submit failure.
- **Bundle ≤ 30KB** (per description success #7); zero heavy form-library dependencies.

**Doesn't ship in v0.1** (per description §3): async validation, multi-step wizards, conditional `visible` fields, sections / collapsibles, two-column layouts, file uploads, rich-text fields, schema introspection, form persistence, cross-field linking. All v0.2+ are designed as additive — none change the v0.1 API.

**Implementation budget:** ~2–3 weeks focused (per description Stage 2 estimate from HANDOFF.md §5).

---

## 3. Final v0.1 API (locked)

Builds out [description §5](properties-form-procomp-description.md#5-rough-api-sketch) into final shapes.

### 3.1 Field schema

```ts
type FieldType = "string" | "number" | "boolean" | "date" | "select" | "textarea";
type FieldPermission = "editable" | "read-only" | "hidden";

interface PropertiesFormField {
  key: string;                                          // opaque per Q3 lock
  type: FieldType;
  label: string;
  description?: string;                                  // helper text below label
  required?: boolean;
  options?: ReadonlyArray<{ value: string; label: string }>;  // select-only
  placeholder?: string;                                  // string / number / textarea
  permission?: FieldPermission;                          // default: "editable"
  permissionReason?: string;                             // tooltip on read-only
  validate?: (value: unknown, allValues: Record<string, unknown>) => string | undefined;
  renderer?: ComponentType<FieldRendererProps>;          // slot
}
```

`key` is opaque per [Q3 lock](properties-form-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) — properties-form does NOT resolve dotted paths (`annotations.priority`). Hosts flatten/unflatten at the boundary. `lib/flatten.ts` ships a helper utility; importing it is optional.

### 3.2 FieldRendererProps (Q-P2)

```ts
interface FieldRendererProps<V = unknown> {
  value: V;
  onChange: (value: V) => void;
  field: PropertiesFormField;                            // full field config
  allValues: Record<string, unknown>;                    // for cross-field reads
  mode: "read" | "edit";                                 // current form mode
  error: string | undefined;                             // current error if any
  disabled: boolean;                                     // submit-pending OR resolver returned read-only
  fieldId: string;                                       // stable id for label-association
  errorId: string;                                       // stable id for `aria-describedby`
}
```

Custom renderers receive everything they need to render either mode and to wire ARIA. The `fieldId` + `errorId` come from properties-form's id factory so custom renderers participate in the same a11y graph as built-ins.

### 3.3 Component props

```ts
interface PropertiesFormProps<T extends Record<string, unknown> = Record<string, unknown>> {
  // Schema + values
  schema: ReadonlyArray<PropertiesFormField>;
  values: T;

  // Mode (default "read" per Q9)
  mode?: "read" | "edit";
  onModeChange?: (mode: "read" | "edit") => void;        // optional; host-controlled toggle

  // Lifecycle (controlled per Q6)
  onChange?: (values: T) => void;                        // required when mode === "edit"
  onSubmit?: (values: T) => Promise<{ ok: boolean; errors?: Record<string, string> }>;
  onCancel?: () => void;

  // Permission + validation
  resolvePermission?: (field: PropertiesFormField, values: T) => FieldPermission | undefined;
  validate?: (values: T) => Record<string, string> | undefined;  // form-level

  // Action surface
  showSubmitActions?: boolean;                           // default true
  submitLabel?: string;                                  // default "Save" (Q-P10)
  cancelLabel?: string;                                  // default "Cancel"

  // ARIA
  ariaLabel?: string;                                    // for the form element
  className?: string;
}
```

### 3.4 Imperative ref handle

```ts
interface PropertiesFormHandle {
  isDirty(): boolean;
  markClean(): void;
  reset(): void;                                          // restores cleanSnapshot + clears errors per Q8
  focusField(key: string): void;                          // see Q-P4
  submit(): Promise<{ ok: boolean; errors?: Record<string, string> }>;  // mirrors onSubmit per Q-P1
}
```

### 3.5 What's NOT on the API

- No `defaultValues` (controlled-only per Q6; uncontrolled is a v0.2 additive prop).
- No async validation hook (v0.2).
- No conditional `visible` predicate (v0.2; will live alongside `permission`).
- No section / group config (v0.2).
- No layout prop (v0.2; v0.1 is single-column flat).

---

## 4. State model

The from-scratch state surface per [Q10 lock](properties-form-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) (~200-400 LoC budget). Single `useReducer` per Q-P5; one source of truth for the form's local state, with `values` mirrored from props.

### 4.1 Internal state shape

```ts
interface FormState {
  errors: Record<string, string>;                         // per-field errors (sync validation results)
  formError: string | undefined;                          // form-level error (from validate(values))
  pending: boolean;                                       // true during async onSubmit
  showSpinner: boolean;                                   // true after 200ms delay (Q-P6)
  version: number;                                        // increments on every value commit
  cleanVersion: number;                                   // snapshot at markClean / mount / successful submit
  cleanSnapshot: Record<string, unknown>;                 // values at last cleanVersion
  submitAttempted: boolean;                               // true after first submit; gates summary visibility
}
```

`values` itself is NOT in state — it's read from props (controlled-only per Q6). `onChange(nextValues)` is dispatched on every field commit; the host echoes back via the next render.

### 4.2 Actions

```ts
type FormAction =
  | { type: "field-changed"; key: string; value: unknown; nextValues: Record<string, unknown>; error: string | undefined }
  | { type: "field-blurred"; key: string; error: string | undefined }
  | { type: "submit-started" }
  | { type: "submit-spinner-show" }                       // fires after 200ms
  | { type: "submit-succeeded"; cleanSnapshot: Record<string, unknown> }
  | { type: "submit-failed"; errors: Record<string, string>; formError?: string }
  | { type: "mark-clean"; cleanSnapshot: Record<string, unknown> }
  | { type: "reset"; cleanSnapshot: Record<string, unknown> }
  | { type: "mode-changed"; mode: "read" | "edit" };       // controls error visibility
```

`field-changed` is the hot path: per-field validate runs in the dispatch caller (the field-row component), the result is included in the action, the reducer updates `errors[key]` and increments `version`. Per-field validation is sync — any throw is caught at the caller and converted to a `validator-error` string, mirroring rich-card's `safeCall` pattern.

### 4.3 Dirty tracking

- `version` increments on every `field-changed` (any value commit, even back to original).
- `cleanVersion` is set to `version` on: mount, `markClean()`, `submit-succeeded`.
- `isDirty()` returns `state.version !== state.cleanVersion`.
- This matches rich-card's pattern exactly (counter-based, intentionally coarse — a value typed and reverted still leaves the form "dirty"; the alternative is structural-diff which is heavier than needed for v0.1).

### 4.4 Mode-toggle behavior matrix (Q-P7)

| Transition | Trigger | Errors | Dirty | Behavior |
|---|---|---|---|---|
| read → edit | host or default action | preserved | preserved | continue editing where left off; previous errors stay surfaced |
| edit → read | Cancel | cleared | reset to clean | `reset()` runs; values reset to `cleanSnapshot`; errors cleared |
| edit → read | Save success | cleared | reset to clean | `markClean()` runs; cleanSnapshot updates to current values |
| edit → read | host externally | preserved | preserved | host's choice; no automatic cleanup |

Cancel-driven and Save-driven transitions run cleanup; host-driven transitions don't (host owns the policy).

---

## 5. Permission resolver (own implementation per [decision #25](../../systems/graph-system/graph-system-description.md))

Layered, first-match-wins, parallel to rich-card's resolver shape but simpler (3 layers, not 7).

### 5.1 Resolution order

```
1. host predicate `resolvePermission(field, values)` — returns FieldPermission | undefined
   ↳ undefined defers to next layer
2. declarative `field.permission`                       — default if absent
3. fallback `"editable"`
```

Implementation: `lib/resolve-permission.ts` exports `resolveFieldPermission(field, values, hostResolver?)` that returns `FieldPermission`. Called once per field per render (memoized at the field-row level via `useMemo` keyed on field + values).

### 5.2 Re-evaluation timing (Q-P9)

Permission resolves on every render of the field row. If `resolvePermission` returns `"read-only"` mid-edit while the user is typing, the in-flight value is **preserved in props but the input is disabled** (no automatic revert). The host owns the data; if it wants to discard the in-flight edit, it controls `values` and clears that key. Trade-off: simpler than auto-revert; a small UX edge case (user sees their typed value frozen as read-only display) — acceptable for v0.1.

### 5.3 Permission UX

- `editable` — typed input rendered.
- `read-only` — formatted value rendered (same `lib/format-value.ts` as read mode); `permission-tooltip.tsx` (port from rich-card) shows `permissionReason` on hover/focus; `aria-readonly="true"` on the wrapper.
- `hidden` — field omitted from DOM entirely (no wrapper, no aria-hidden, no label). Submit values omit the key only if the host omits it from `values`; properties-form does not strip hidden keys from submit (host owns shape).

---

## 6. Validation pipeline

Sync only; two layers; runs in this order:

### 6.1 Per-field validation

- Fires on every `field-changed` dispatch (every value commit).
- Result stored in `state.errors[key]`.
- Inline error renders below the field (`<FieldError>` — see §8) when `state.submitAttempted || state.errors[key]` is truthy.
- Pre-submit: errors render only after first submit attempt OR if the field has been blurred-with-error (Q-P8 details below).
- A throw in the user's `validate` is caught at the field-row caller and converted to a generic error: `"Validation error — see console"`. Logs the throw to console in dev. Mirrors rich-card's `safeCall` posture.

### 6.2 Form-level validation

- Fires only on submit attempts (NOT on every change — would surface "form is invalid" prematurely).
- Result merged into `state.errors` (union; per-field errors take precedence on key collision).
- Form-level error string (`state.formError`) renders in the error summary at the top.

### 6.3 Submit gating

```
submit() →
  set pending; clear formError
  run all field-validate(value, allValues) → collect errors
  run form-level validate(values) → merge errors
  if any errors:
    dispatch submit-failed
    focus first error (Q-P8)
    return { ok: false, errors }
  else:
    schedule 200ms spinner-show timer
    await onSubmit(values)
    if ok: dispatch submit-succeeded(values as cleanSnapshot)
    if !ok: dispatch submit-failed(result.errors); focus first error
    return result
```

The 200ms spinner timer (Q-P6) is cancelled if `onSubmit` resolves first — fast submissions never flicker.

---

## 7. Field type rendering

Each built-in renders via a small `parts/field-<type>.tsx` component that takes `FieldRendererProps`. Read mode and edit mode share the parts file; the `mode` prop flips behavior.

### 7.1 Per-type spec (read mode left, edit mode right)

| Type | Read | Edit |
|---|---|---|
| `string` | `<span>{value}</span>` (truncate via Tailwind) | shadcn `<Input>` |
| `number` | `<span class="font-mono tabular-nums">{value}</span>` (right-aligned) | shadcn `<Input type="number">` |
| `boolean` | `<Check>` / `<X>` lucide icon | shadcn `<Switch>` |
| `date` | ISO formatted (`YYYY-MM-DD`) in mono | native `<input type="date">` (per Q1 lock) |
| `select` | `<span>{matchedOption?.label ?? value}</span>` | shadcn `<Select>` |
| `textarea` | `<p class="whitespace-pre-wrap">{value}</p>` (max-h with scroll) | shadcn `<Textarea>` |

Read-mode formatting lives in `lib/format-value.ts`; same module is reused inside `field-row.tsx` for the `read-only` permission case.

### 7.2 Custom renderer slot

Hosts opt out of built-in rendering by setting `field.renderer`. The slot receives [FieldRendererProps](#32-fieldrendererprops-q-p2) and is responsible for both modes if it overrides. Examples (informal, in usage docs):

- **Color picker:** `renderer` returns a swatch (`mode="read"`) or shadcn `<Input type="color">` (`mode="edit"`).
- **Multi-select / tags:** see Q-P3 below.
- **Entity-picker integration:** the host wires `<EntityPicker>` (Tier 1) inside the renderer — but properties-form does NOT import entity-picker per [decision #35](../../systems/graph-system/graph-system-description.md).

### 7.3 Array / multiselect via renderer (Q-P3)

v0.1 has no `array` built-in type; arrays go through `renderer`. Plan ships a usage-docs example:

```tsx
{
  key: "tags",
  type: "string",                              // type ignored when renderer present
  label: "Tags",
  renderer: TagsInput,                         // host-supplied
}
```

Plan stage adds `field.type` is **advisory only when `renderer` is set** — properties-form does not validate that `value` matches `type` for renderer-overridden fields.

---

## 8. Files and parts

### 8.1 File-by-file plan

```
src/registry/components/forms/properties-form/
├── properties-form.tsx                # main component (forwardRef; reducer wiring)
├── types.ts                           # FieldType, FieldPermission, PropertiesFormField,
│                                       #   PropertiesFormProps, PropertiesFormHandle, FieldRendererProps,
│                                       #   FormState, FormAction
├── parts/
│   ├── field-row.tsx                  # dispatch container — resolves permission, picks renderer or built-in,
│   │                                   #   wires label + error
│   ├── field-string.tsx
│   ├── field-number.tsx
│   ├── field-boolean.tsx
│   ├── field-date.tsx
│   ├── field-select.tsx
│   ├── field-textarea.tsx
│   ├── field-error.tsx                # inline error renderer with aria-describedby wiring
│   ├── error-summary.tsx              # form-top summary with anchor links to first-error
│   ├── permission-tooltip.tsx         # read-only tooltip; ported from rich-card
│   └── submit-actions.tsx             # default Save / Cancel button row
├── hooks/
│   ├── use-form-reducer.ts            # the single useReducer + dispatch wrapper
│   ├── use-submit-spinner.ts          # 200ms-delayed spinner timer
│   └── use-id-factory.ts              # stable fieldId / errorId per field
├── lib/
│   ├── resolve-permission.ts          # 3-layer resolver
│   ├── validate.ts                    # per-field + form-level orchestration
│   ├── format-value.ts                # read-mode formatting per type
│   └── flatten.ts                     # optional Q3 helper for nested objects
├── dummy-data.ts                      # 4 fixtures: editable, read-only, mixed, custom-renderer
├── demo.tsx                           # 5 demos per success #9 (single page, internal switch)
├── usage.tsx                          # consumer-facing patterns + tags-input example
├── meta.ts                            # registry meta
└── index.ts                           # PropertiesForm + types + flatten util re-export
```

**File count: 22.** Within the Tier 1 size envelope (rich-card v0.1 was 26 files; workspace was 26).

### 8.2 Build order within v0.1

Three internal phases, each ~3–5 days:

**Phase A — types + state + resolver (foundational; ~3 days):**
- `types.ts` — full type surface
- `lib/resolve-permission.ts` + `lib/validate.ts` + `lib/format-value.ts`
- `hooks/use-form-reducer.ts` — reducer + actions
- Unit-testable in isolation when Vitest lands; v0.1 verification is demo-driven.

**Phase B — rendering (~5 days):**
- `parts/field-row.tsx` — the dispatch container
- 6 built-in field-type parts
- `parts/field-error.tsx`, `parts/permission-tooltip.tsx`, `parts/error-summary.tsx`, `parts/submit-actions.tsx`
- `properties-form.tsx` — main component wiring everything

**Phase C — integration + demo (~3 days):**
- `demo.tsx` (5 sub-demos), `dummy-data.ts`, `usage.tsx`, `meta.ts`, `index.ts`
- Verify `tsc + lint + build` clean
- Verify each success-criteria demo works

---

## 9. ARIA contract

Per description success #6.

| Element | ARIA |
|---|---|
| `<form>` root | `role="form"` (implicit), `aria-label={ariaLabel}`, `aria-busy={pending}` |
| Field wrapper | `<div>` (not `<fieldset>` — no nested grouping in v0.1) |
| Field label | native `<label htmlFor={fieldId}>` |
| Required field label | `aria-required="true"` on input + visual `*` |
| Read-only field | `aria-readonly="true"` on the wrapper + tooltip linked via `aria-describedby` |
| Hidden field | omitted from DOM (not `aria-hidden`) |
| Per-field error | `role="alert"` + `id={errorId}`; input has `aria-invalid="true"` + `aria-describedby={errorId}` |
| Form-level summary | `role="alert"` at form top; clicking a summary entry focuses the corresponding field |
| Submit pending | `aria-busy="true"` on form; submit button has `aria-disabled="true"`; spinner is `aria-hidden="true"` (status announced via `aria-busy` change) |

Focus management on submit failure: first invalid field receives focus via `focusField(firstErrorKey)` after the dispatch; matches description success #4.

---

## 10. Edge cases (locked)

| Case | Handling |
|---|---|
| Schema changes mid-life (different `key` set) | Properties-form is generic over schema; React renders new field-rows. State `errors` may stale-reference removed keys; reducer runs a key-pruning pass on `field-changed` dispatch (cheap; one Object.keys call). |
| Field declared as `select` without `options` | Dev-only `console.error` on first render; renders empty `<Select>` to avoid crash. |
| Field declared as `date` with a non-ISO `value` | Read mode renders the raw string; edit mode shows browser's "invalid date" UX. Document in usage. |
| Renderer throws | React error boundary in `field-row.tsx` catches; renders `<FieldError>` with "Custom renderer crashed — see console"; field becomes interactive in next render. |
| `onChange` missing in edit mode | Dev-only `console.error` per Q6; values are read but commits become no-ops (host can't react, so the form effectively becomes read-only-with-typing-allowed). |
| Submit promise rejects (not just `{ ok: false }`) | Caught at the dispatch site; converted to `submit-failed` with `formError: "Submit failed: " + err.message`. Logs to console in dev. |
| `submit()` called while `pending: true` | Returns the in-flight promise (no new submit). Prevents double-submit. |
| `reset()` called while `pending: true` | Cancels spinner timer; dispatches `reset` (errors cleared, values reset to cleanSnapshot via `onChange`). The in-flight `onSubmit` promise still resolves; result is ignored. |
| `markClean()` called with errors present | Snapshots current values as cleanSnapshot; errors are NOT cleared (intentional — markClean is a dirty-tracking op, not an error-clearing op). |
| `focusField(key)` for hidden field | No-op per Q-P4; dev-only `console.warn` in dev. |
| `focusField(key)` for read-only field | Focuses the read-display wrapper (`tabIndex={0}` added on read-only wrapper for this case) per Q-P4. |
| `focusField(key)` for unknown field | Dev-only `console.error`; no-op. |

---

## 11. Performance + bundle

### 11.1 Performance

The form is small by design (typically 5-30 fields). Optimizations:

- Field-row components are React.memo'd on `(value, error, mode, permission, fieldId)` — only fields whose props change re-render on value commits.
- Permission resolver is `useMemo`'d in `field-row.tsx` keyed on `field + values` — runs once per render, not per field-row.
- `format-value.ts` is pure; no caching needed at this scale.
- Submit spinner timer: single `setTimeout` cleared in cleanup; no rAF or interval.

No virtualization; not needed at form scale. If real consumers push past 100 fields, revisit in v0.2.

### 11.2 Bundle audit

Budget: **≤ 30KB minified + gzipped** per description success #7.

Realistic breakdown:
- Component code: ~12-18KB (200-400 LoC state + 6 field types + parts + lib + hooks)
- shadcn primitives consumed: `Input`, `Select`, `Switch`, `Textarea`, `Tooltip`, `Button` — all already in the registry's `src/components/ui/`; counted as zero (shared by every component).
- `lucide-react` icons: tree-shaken; ~2KB for `Check` + `X` + `AlertCircle` (error icon).
- Total realistic: **~14-20KB**, ceiling 30KB providing comfortable headroom.

Wired via `size-limit` (or equivalent) at v0.1 implementation start — same posture as force-graph v0.1 plan §17.5 #3.

---

## 12. Risks & alternatives

### 12.1 Risks

| Risk | Mitigation |
|---|---|
| `from-scratch` state implementation grows past 800 LoC | Q10 lock has explicit re-evaluation trigger. Plan stage budgets 200-400 LoC; if implementation exceeds 600 LoC, halt and reconsider RHF migration. |
| Mixed-permission case (§6.2) doesn't compose cleanly with detail-panel's mode toggle | Both Q9 default-mode-read and Q-P7 mode-toggle matrix were designed against this case. v0.3 of force-graph is the integration test. If issues surface there, properties-form v0.2 amends. |
| Custom renderers diverge on a11y wiring | `FieldRendererProps` exposes `fieldId` + `errorId` so renderers can wire matching ARIA. Usage docs ship the tags-input example demonstrating the pattern. |
| Native `<input type="date">` UX inconsistency with shadcn-styled fields | Documented; v0.2 swap to shadcn `Calendar` is API-preserving. |
| React Compiler interactions with reducer + memo'd field-rows | useReducer is compiler-safe; React.memo with explicit equality is supported. Smoke test with compiler enabled at end of phase B. |

### 12.2 Alternatives considered, rejected

- **react-hook-form** as substrate. Rejected per Q10 — ~10KB additional bundle for a state surface that's genuinely simple at our scale; we own a11y wiring directly.
- **Schema-first with Zod-like validators baked in.** Rejected — couples the component to a specific validator library; user's `validate` callback is sufficient and Zod-friendly.
- **Discriminated-union props for read vs edit.** Rejected per Q6 — type pain (every consumer would need conditional types) outweighs the runtime check; dev-only console.error covers the wrong-mode-no-onChange case.
- **Two-way `values` (uncontrolled with `defaultValues`).** Rejected per Q6 — controlled-only is the v0.1 scope; uncontrolled is additive in v0.2 if needed.
- **Sections / fieldsets in v0.1.** Rejected per description §3 — flat layout is enough for the v0.3 integration; sections ship in v0.2.

---

## 13. Resolved plan-stage questions (recommendations; lock on sign-off)

10 Q-Ps. **High-impact:** Q-P5 (state implementation), Q-P7 (mode-toggle matrix), Q-P9 (resolver re-evaluation). **Medium:** Q-P1 (handle.submit return), Q-P2 (FieldRendererProps), Q-P6 (spinner timing), Q-P8 (error focus). **Low:** Q-P3 (array via renderer), Q-P4 (focusField edge cases), Q-P10 (action labels).

### Q-P1 (from description §8.5 #1) — `PropertiesFormHandle.submit()` return type
**Recommendation: mirror `onSubmit`'s `Promise<{ ok, errors? }>`.** Imperative submitters need the result to act on it (toast on fail, navigate on success). Returning `Promise<void>` would force them to subscribe to side channels.
**Impact:** medium. **Trade-off:** none — strictly an API tightening.

### Q-P2 (from description §8.5 #2) — `FieldRendererProps` shape
**Recommendation: lock as in [§3.2](#32-fieldrendererprops-q-p2):** `{ value, onChange, field, allValues, mode, error, disabled, fieldId, errorId }`. The two id fields are added beyond description §8.5's predicted shape so custom renderers can participate in a11y consistently with built-ins.
**Impact:** medium. **Trade-off:** slightly larger props object; worth it for a11y.

### Q-P3 (from description §8.5 #3) — Array / multiselect via renderer
**Recommendation: explicit usage-docs example (tags-input).** No new built-in type in v0.1. Document in `usage.tsx` that `field.type` is advisory when `renderer` is set; properties-form doesn't validate value↔type compatibility for renderer fields.
**Impact:** low. **Trade-off:** none.

### Q-P4 (from description §8.5 #4) — `focusField(key)` on hidden / read-only / unknown
**Recommendation: hidden = silent no-op (dev-only `console.warn`); read-only = focus the read-display wrapper (`tabIndex={0}` added); unknown key = `console.error` no-op.**
**Impact:** low. **Trade-off:** read-only focus requires adding `tabIndex={0}` on read-only wrapper — minor a11y win (keyboard users can land on it via Tab anyway).

### Q-P5 (NEW) — Internal state: single useReducer vs split useStates
**Recommendation: single `useReducer` (§4.2 actions).** Mirrors rich-card's pattern; single source of truth; reducer is unit-testable in isolation when Vitest lands; explicit actions are easier to reason about than a web of useState setters cross-coupling.
**Impact:** high — touches the core implementation shape.
**Trade-off:** slightly more boilerplate up front than 3-4 useStates; pays back at the first non-trivial action (submit-flow with multiple state transitions). Alternatives considered: split `useState` (rejected — mode + dirty + errors + pending interact too much), Zustand (rejected — overkill for component-local state, adds dep).

### Q-P6 (NEW) — 200ms spinner-show timing
**Recommendation: `setTimeout` in a `useEffect` keyed on `pending` transition; clear on unmount or when `pending` flips to false.** When the timer fires, dispatch `submit-spinner-show`. If `onSubmit` resolves before 200ms, the timer is cleared and the spinner never renders — fast submits don't flicker.
**Impact:** medium. **Trade-off:** none; this is the standard "delay-show" pattern.

### Q-P7 (NEW) — Mode-toggle dirty-state behavior
**Recommendation: matrix in [§4.4](#44-mode-toggle-behavior-matrix-q-p7).** Cancel runs `reset()`; Save success runs `markClean()`; host-driven mode flips do nothing (host owns policy). read→edit preserves errors + dirty so the user picks up where they left off.
**Impact:** high — affects every editing surface in the system (force-graph v0.3, future rich-card refactor).
**Trade-off:** locking the matrix means hosts can't customize per-transition. If real consumers want, a `onModeChange(mode, defaultBehavior) => Promise` hook is additive in v0.2.

### Q-P8 (NEW) — Error visibility + first-error focus
**Recommendation: errors render only after `submitAttempted: true` OR after a field has been blurred-with-error.** Pre-submit typing doesn't surface errors mid-keystroke. On submit failure, focus moves to first error via `focusField(firstErrorKey)` after the `submit-failed` dispatch.
**Impact:** medium. **Trade-off:** the alternative (errors surface on every keystroke) is more "responsive" but is widely considered noisy a11y practice. Industry default is post-submit + on-blur.

### Q-P9 (NEW) — Permission resolver re-evaluation
**Recommendation: per-render at the field-row level, memoized via `useMemo` on `field + values`.** Permission can react to value changes (`resolvePermission(field, values)` is the signature). Mid-edit permission flip from `editable` to `read-only` preserves the in-flight value in props but disables the input — no auto-revert. Host owns data.
**Impact:** high — defines mid-edit semantics for the mixed-permission showcase (§6.2 of description).
**Trade-off:** users could theoretically see their typing "frozen" as read-only display if permission flips while typing. Acceptable for v0.1; rare in practice (host typically computes permission from origin which doesn't change mid-session).

### Q-P10 (NEW) — Default action button labels + slot
**Recommendation: hardcoded `"Save"` / `"Cancel"` in v0.1 with `submitLabel` / `cancelLabel` props for override.** Localization is a v0.2+ concern via slot-able `submitActions` prop (host renders own action bar via `showSubmitActions: false`).
**Impact:** low. **Trade-off:** non-English consumers must override per-instance; acceptable for v0.1 since `showSubmitActions: false` already covers full custom action bars.

## 13.5 Plan-stage refinements (surfaced during draft)

These bake into implementation but worth flagging:

1. **`flatten.ts` is opt-in.** Hosts may not need it (e.g., settings forms with flat shapes). Index re-exports it as a named utility; importing is opt-in to keep tree-shaking friendly.
2. **`field.type` advisory under `renderer`.** When `renderer` is set, properties-form does NOT validate that `value` matches `type`. Documented in usage; `field.type` is metadata for the host's introspection, not a runtime contract.
3. **Submit-pending double-submit guard.** `submit()` while `pending: true` returns the in-flight promise (edge case in §10). Prevents Save-button-mash from queuing duplicate `onSubmit` invocations.
4. **`reset()` cancels in-flight submit.** If submit is pending and `reset()` is called, the spinner timer cancels and the reset dispatch fires immediately. The in-flight `onSubmit` promise still resolves; the `submit-succeeded`/`submit-failed` dispatch is suppressed (reducer guards on a `submit-id` token to prevent stale dispatch from a cancelled submit). Plan locks the token mechanism in implementation.
5. **`useMemo` keyed on `(field, values)` for permission resolution.** `field` reference stability is the host's responsibility (memoize or define schema at module scope). If schema is recreated every render, memoization breaks — document in usage.
6. **shadcn primitives consumed list locked.** `Input`, `Select`, `Switch`, `Textarea`, `Tooltip`, `Button`. If any are missing from `src/components/ui/`, run `pnpm dlx shadcn@latest add <name>` at implementation start before scaffolding the component.
7. **`error-summary.tsx` anchor link uses `fieldId` from id-factory.** Clicking a summary entry calls `focusField(key)` (which resolves to the `fieldId` element); does NOT use anchor URLs (avoids history pollution).

---

## 14. Definition of "done" for THIS document (stage gate)

- [ ] User reviewed §1–§12 (the locked plan body) and §13 (resolved Q-Ps + §13.5 refinements).
- [ ] All 10 plan-stage questions resolved (Q-P1 to Q-P10).
- [ ] User said **"plan approved"** (or equivalent) — Stage 3 (implementation via `pnpm new:component forms/properties-form`) unlocks.
- [ ] On sign-off, convert `Recommendation:` → `**Locked: X.**`; flip status header; update [system §9 sub-doc map](../../systems/graph-system/graph-system-description.md#9-sub-document-map) to mark `properties-form` plan ✓ signed off; commit per project pattern (`docs(procomps/properties-form): sign off v0.1 plan; <refinements>`).

The plan is signed off when both v0.1 implementation can begin AND the `force-graph` v0.3 plan-lock cascade unlocks (it's the first of the two plans gating v0.3 — `detail-panel` is the other; `force-graph` v0.3 plan can author once both Tier 1 plans lock).

---

*End of v0.1 plan draft. Pause for user validate pass per project cadence (draft → validate → re-validate → sign off → commit).*
