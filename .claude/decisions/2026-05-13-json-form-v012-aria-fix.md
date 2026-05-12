---
date: 2026-05-13
session: json-form v0.1.2 ARIA-correctness + onValidationChange patch (same-day follow-up to v0.1.1)
phase: post-Phase-7 / GATE-3-rule era
type: patch-bump
commits: pending (this session)
components: json-form (v0.1.1 → v0.1.2; ARIA bridge + onValidationChange + select option.value coercion)
findings: none (carries v0.1.0 spotcheck verdict; F-R7 from v0.1.1 re-review deferred to v0.2)
status: open
---

# json-form v0.1.2 — ARIA-correctness via `FieldAriaProps` bridge + `onValidationChange` actually fires

## Trigger

After v0.1.1 shipped, ran a fresh critical re-review of the json-form codebase. The v0.1.0 GATE-3 spotcheck's rotating dimension was **Public API** — which mostly checked out — but **Accessibility was the actual load-bearing axis** for a form-rendering component. Two real findings surfaced:

- **F-R1 (High):** ARIA `label[htmlFor]` silently failing for ~half the field types.
- **F-R2 (High):** `onValidationChange` prop wired but never called.
- **F-R3 (Medium):** `field-select` non-combobox path coercing `option.value` to string permanently.

Plus three Low-severity findings (`JSON.stringify` memo keys, richtext defaultValue ergonomics, `'use client'` on default-registry — same as v0.1.0 F-03).

Decided to fix F-R1, F-R2, F-R3 in v0.1.2 before pushing to master, since F-R1 is a correctness issue (not polish).

## F-R1 — ARIA binding broken for Popover-wrapped + group-style fields

### The bug

v0.1.0's wrapper used `<Slot.Root>` from radix-ui to forward `id` + `aria-*` onto whatever single element the renderer returned:

```tsx
// v0.1.0 (broken for some renderers)
<label htmlFor={id}>...</label>
<Slot.Root id={id} aria-required aria-invalid aria-describedby>
  {rendered}
</Slot.Root>
```

This works for `<Input>` / `<Textarea>` / `<Checkbox>` / `<Switch>` — real form controls that accept `id` and which `label[htmlFor]` can target.

It **silently failed** for:

- **Popover-wrapped controls** (`field-date`, `field-datetime`, `field-date-range`, `field-select` combobox path): The renderer returns `<Popover>...</Popover>`. Radix `Popover.Root` is a context-only component that accepts only `open` / `defaultOpen` / `onOpenChange` / `modal` / `children` — it ignores everything else. `id` and `aria-*` props landed on a non-DOM element and were lost.
- **ARIA-roled groups** (`field-radio-group`, `field-checkbox-group`, `field-rating`): The renderer returns a `role="radiogroup"` or `role="group"` div. HTML `label[for]` only binds to native form controls (input, select, textarea, button) — not ARIA-roled divs. Even when `id` made it onto the group root, the label still didn't bind for screen readers.

Visual labels still displayed correctly. Sighted users saw the form fine. Screen-reader users got unlabelled controls for these field types.

### The fix

New `FieldAriaProps` shape passed through `FieldRendererArgs.ariaProps`:

```ts
export interface FieldAriaProps {
  /** Use on native form controls so `label[htmlFor]` binds correctly. */
  id: string;
  /** Use on group-style controls via `aria-labelledby`. */
  labelledBy: string;
  "aria-required"?: true;
  "aria-invalid"?: true;
  "aria-disabled"?: true;
  "aria-describedby"?: string;
}
```

Renderers attach the appropriate subset to the appropriate element:

- **Native form controls** — spread `id` + `aria-*` onto the input. Label `htmlFor={id}` binds via the native form-control association.
- **Popover triggers** — attach `id` to the `<PopoverTrigger asChild><Button>` — the Button is a real form control + the trigger. Label still binds.
- **Group roots** — attach `aria-labelledby={labelledBy}` to the `role="radiogroup"` / `role="group"` div. The label has an explicit `id={labelId}` so the labelledby reference works.

`FieldWrapper` now:
- Renders `<label id={labelId} htmlFor={controlId}>` (both attrs present; htmlFor is harmless on group-style controls since they ignore it).
- Drops the `<Slot.Root>` wrap entirely — renderers handle ARIA themselves.
- Computes `ariaProps` once per render and passes it via FieldRendererArgs.

14 renderers updated:
- Native controls (Input/Textarea/Checkbox/Switch + non-combobox Select trigger): `id` + `aria-*` direct.
- Popover triggers (date/datetime/date-range + combobox Select Button): same, applied to the Button trigger.
- Group roots (radio-group/rating): `aria-labelledby` + sparse `aria-*` (groups support `aria-disabled` / `aria-describedby` but NOT `aria-required` / `aria-invalid` per ARIA spec — caught by eslint-plugin-jsx-a11y).
- Custom widgets (code/richtext/checkbox-group): wrap in `role="group"` with `aria-labelledby` + `aria-disabled` + `aria-describedby`; surface `aria-required` / `aria-invalid` as `data-aria-*` for CSS targeting since they're not ARIA-valid on `role="group"`.
- Computed: `id` on the `<output>` + `aria-labelledby` for clarity (output is implicitly `role="status"`).
- Slider: `id` + `aria-labelledby` (Radix Slider Root supports both).
- Fallback: `id` + `aria-labelledby` + `aria-describedby` (it's `role="alert"`, not a control).

## F-R2 — `onValidationChange` never called

### The bug

`ChangeBridge` (the internal component that bridges RHF state changes to consumer callbacks) had a literal `void onValidationChange;` — a no-op. The prop was declared in `JsonFormProps`, documented in usage.tsx, and never called with real data.

### The fix

`ChangeBridge` now subscribes to `useFormState()` for `isValid` + `errors`. When either changes, it computes a flat-error map and fires `onValidationChange({ isValid, errors })`. Uses a stable identity-key guard (`isValid:errorCount:errorPaths`) to avoid firing on every render when only a referentially-different `errors` object passes through unchanged.

```tsx
useEffect(() => {
  if (!onValidationChange) return;
  const flat = flattenRhfErrors(errors as Record<string, unknown>);
  const errorKey = `${Object.keys(flat).length}:${Object.keys(flat).join(",")}`;
  const last = lastValidity.current;
  if (last && last.isValid === isValid && last.errorKey === errorKey) return;
  lastValidity.current = { isValid, errorKey };
  onValidationChange({ isValid, errors: flat });
}, [isValid, errors, onValidationChange]);
```

Reuses the existing `flattenRhfErrors` helper that the submit-error path uses, so the error shape consumers receive from `onValidationChange` matches what they get from `onSubmitError`.

## F-R3 — `field-select` non-combobox path coercing option.value to string

### The bug

shadcn `Select` only accepts string values. The renderer was doing `value={String(value)}` (forward coercion, OK) and `onValueChange={(v) => onChange(v)}` (no reverse coercion — bug). If the consumer's option was `{ value: 42, label: "..." }`, the submitted value became `"42"` (string), not `42` (number). `field-radio-group` had a `coerceOptionValue` lookup that handled this; `field-select` didn't.

### The fix

Added the same `coerceOptionValue(raw, options)` lookup to field-select. Now both renderers preserve the original option.value type through the string round-trip.

## Verification

- **`pnpm tsc --noEmit`:** clean.
- **`pnpm lint`:** 0 errors, 2 warnings (pre-existing in `file-tree` / `file-manager`, unrelated). The ARIA changes initially surfaced 6 jsx-a11y warnings ("aria-required not supported by role group") that informed the data-attr fallback for code/richtext/checkbox-group.
- **`pnpm validate:meta-deps`:** 42/42 clean.
- **`pnpm build`:** clean. 50/50 routes prerendered.
- **`pnpm registry:build`:** clean. `public/r/json-form.json` regenerated.

## GATE 3 — skipped per the rule

Patch bump (`v0.1.1 → v0.1.2`, non-breaking, no public-API touch beyond the additive `ariaProps` on `FieldRendererArgs`). v0.1.0 spotcheck verdict (Pass with follow-ups) carries forward.

Consumers with custom field renderers will need to update them to consume `ariaProps` to retain accessibility — but their existing renderers continue to function (just without ARIA wiring, same state as before v0.1.2). Technically additive on the API surface, but ergonomically a soft bump for accessibility-conscious consumers. Documented in usage.tsx (existing "Custom field types" section).

## Process note

The v0.1.0 spotcheck verdict was correct procedurally (Pass with follow-ups), but the rotating dimension was poorly chosen. **Public API** caught the shape questions (which were already validated by GATE 2 plan review). **Accessibility** would have been the right rotating dim for a form-rendering component — and would have caught F-R1 immediately. Lesson: pick the rotating dimension based on what's **likely to be wrong** for the component's risk profile, not what's **easiest to verify**. For json-form, A11y was load-bearing; should have been chosen.

This isn't a process change; the readiness-review rule already says "Pick the dimension most likely to surface real signal for THIS component" and "Document why the rotating dim was chosen (1 sentence)." The v0.1.0 reviewer (me) just picked wrong. Worth carrying as a soft norm: **for any component primarily concerned with input or interaction, default the rotating dim to A11y unless you have a stronger candidate**.

## Total component count

**42 components** across 8 categories (unchanged; v0.1.2 is a bump).
