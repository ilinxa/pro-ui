import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "json-form",
  name: "Json Form",
  category: "forms",

  description:
    "Schema-driven form renderer — declarative field DSL compiled to Zod, 25 built-in field types (incl. richtext via Plate), extensible renderer registry, conditional + computed fields, RHF v7 + zod v4 substrate. v0.2.0 lifts the per-keystroke render ceiling via a per-field subscription gate (default-registry watch drop + `dependsOn` opt-in) and deep-merges `defaultValues` per leaf.",
  context:
    "Generic 'turn JSON into a form' substrate for back-office UIs, admin tools, and AI-tooling agents that drive UIs from schema. Hand-rolled forms (the properties-form pattern) remain the right choice for one-off, deeply-bespoke flows; json-form takes over when the same surface needs to render dozens of variants or be driven by a backend / LLM. Built on react-hook-form v7 + @hookform/resolvers/zod + zod v4. The field DSL compiles to a ZodObject at mount via a two-stage pipeline (v0.1.7 — `compileStructural` is schema-keyed, `injectStrings` is strings-keyed); consumer-provided `zodSchema` wins per-key (escape hatch). 25 built-in field types: text family (text/email/password/url/tel/textarea/number), choice family (select/multi-select/radio-group/checkbox/checkbox-group/switch), date/time (date/date-range/time/datetime), rich/composite (code via @ilinxa/code-block lazy-loaded, slider, rating, richtext via @ilinxa/article-body-01 lazy-loaded), special (computed/hidden/section/divider). Conditional logic via an 11-operator Condition DSL plus function escape hatch — covers visibleWhen / enabledWhen / requiredWhen, all with v0.1.6 narrow-deps subscriptions. Computed fields via pure `expression: '{firstName} {lastName}'` interpolation or `compute: (args) => ...` escape hatch. Renderer registry is extensible (`fieldRegistry` prop merges over defaults), with typed authoring via `defineFieldRenderer<TValue, TConfig>(...)` (v0.1.7); the form-level `renderField` slot intercepts every field. Standalone parts exported (`<JsonFormField>`, `<JsonFormSubmitButton>`, `<JsonFormDevtools>`, etc.) for fully-headless layouts via `<JsonFormProvider>` + `useJsonForm()` factory + `useJsonFormFieldValue<T>(name)` / `useJsonFormFieldsValue<T>(names)` narrow-deps hooks (v0.1.7). v0.2.0 lifts the per-keystroke render ceiling: built-in default renderers (audited not to read `allValues`) skip the FieldWrapper-level subscription; `field.dependsOn` opts custom renderers into narrow-deps (`[]` = explicit no-watch; `['a','b']` = narrow watch). The whitelist check resolves on the FINAL renderer identity, so consumer-registered renderers at built-in slots correctly opt back into full-bag unless they declare `dependsOn`. Form-level `defaultValues` deep-merges per leaf instead of replacing per top-level key. Object-shape callbacks throughout (F-cross-12).",
  features: [
    "Declarative field DSL — 25 built-in types, compiled to Zod at mount",
    "Conditional fields — 11-operator Condition DSL + function escape hatch covers visibleWhen / enabledWhen / requiredWhen",
    "Computed fields — pure `{interpolation}` template OR `compute: (args) => ...` function",
    "Extensible renderer registry — `fieldRegistry` spread + extend; `renderField` form-level slot",
    "Typed renderer factory `defineFieldRenderer<TValue, TConfig>(...)` for narrowed custom-renderer authoring (v0.1.7)",
    "Headless narrow-deps hooks: `useJsonFormFieldValue<T>(name)` + `useJsonFormFieldsValue<T>(names)` for fully-custom layouts subscribing to one or more fields without re-rendering on unrelated changes (v0.1.7)",
    "`<JsonFormDevtools>` — floating-by-default panel with schema / values / conditionals / errors tabs; lazy-loaded body chunk + prod no-op return (v0.1.7)",
    "Per-field subscription gate — built-in default renderers skip the FieldWrapper-level watch (audited; identity-checked against the default registry); custom renderers opt in via `field.dependsOn` (`[]` = no watch, `['a','b']` = narrow watch, omitted = legacy full-bag) (v0.2.0)",
    "Deep-merge `defaultValues` per leaf — form-level overrides no longer drop sibling per-field defaults at shared parent paths (v0.2.0)",
    "Headless factory hook (`useJsonForm`) for fully-headless layouts via `<JsonFormProvider>` + standalone parts",
    "Imperative handle: submit / reset / setValue / getValue / setError / trigger / focus / isDirty / isValid / isSubmitting",
    "Cross-registry deps on `@ilinxa/code-block` (for `code`) and `@ilinxa/article-body-01` (for `richtext`), both lazy-loaded via `React.lazy`",
    "Consumer-supplied `zodSchema` escape hatch — wins per-key over the DSL-generated chain",
    "`onTouched` validation by default (error after first blur OR submit); overridable via `validationMode`",
    "Object-shape callbacks throughout (per F-cross-12)",
    "Accessibility: deterministic SSR-stable field ids (`useId()`), `ariaProps` bridge passed to every renderer for correct `id` / `aria-labelledby` / `aria-required` / `aria-invalid` / `aria-describedby` wiring across native form controls AND Popover-wrapped / group-style controls, role='alert' error summary with anchor links + setFocus, focus-walks to first focusable error on submit failure",
  ],
  tags: [
    "json-form",
    "form",
    "schema",
    "react-hook-form",
    "zod",
    "validation",
    "conditional",
    "computed",
    "richtext",
    "backend-driven",
    "headless",
  ],

  version: "0.2.4",
  status: "alpha",
  createdAt: "2026-05-12",
  updatedAt: "2026-05-21",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [
      "radio-group",
      "slider",
      "label",
      "input",
      "textarea",
      "select",
      "checkbox",
      "switch",
      "command",
      "popover",
      "calendar",
      "button",
      "separator",
      "badge",
    ],
    npm: {
      "react-hook-form": "^7.75.0",
      "@hookform/resolvers": "^5.2.2",
      zod: "^4.4.3",
      "lucide-react": "^1.11.0",
    },
    internal: ["code-block", "article-body-01"],
  },

  related: ["properties-form", "code-block", "article-body-01", "markdown-editor"],
};
