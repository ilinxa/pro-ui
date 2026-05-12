import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "json-form",
  name: "Json Form",
  category: "forms",

  description:
    "Schema-driven form renderer — declarative field DSL compiled to Zod, 25 built-in field types (incl. richtext via Plate), extensible renderer registry, conditional + computed fields, RHF v7 + zod v4 substrate.",
  context:
    "Generic 'turn JSON into a form' substrate for back-office UIs, admin tools, and AI-tooling agents that drive UIs from schema. Hand-rolled forms (the properties-form pattern) remain the right choice for one-off, deeply-bespoke flows; json-form takes over when the same surface needs to render dozens of variants or be driven by a backend / LLM. Built on react-hook-form v7 + @hookform/resolvers/zod + zod v4. The field DSL compiles to a ZodObject at mount; consumer-provided `zodSchema` wins per-key (escape hatch). 24 v0.1.0 field types: text family (text/email/password/url/tel/textarea/number), choice family (select/multi-select/radio-group/checkbox/checkbox-group/switch), date/time (date/date-range/time/datetime), rich/composite (code via @ilinxa/code-block lazy-loaded, slider, rating), special (computed/hidden/section/divider). Conditional logic via an 11-operator Condition DSL plus function escape hatch — covers visibleWhen / enabledWhen / requiredWhen. Computed fields via pure `expression: '{firstName} {lastName}'` interpolation or `compute: (args) => ...` escape hatch. Renderer registry is extensible (`fieldRegistry` prop merges over defaults), plus a form-level `renderField` slot intercepts every field. Standalone parts exported (`<JsonFormField>`, `<JsonFormSubmitButton>`, etc.) for fully-headless layouts via `<JsonFormProvider>` + `useJsonForm()` factory. Object-shape callbacks throughout (F-cross-12).",
  features: [
    "Declarative field DSL — 24 built-in types, compiled to Zod at mount",
    "Conditional fields — 11-operator Condition DSL + function escape hatch covers visibleWhen / enabledWhen / requiredWhen",
    "Computed fields — pure `{interpolation}` template OR `compute: (args) => ...` function",
    "Extensible renderer registry — `fieldRegistry` spread + extend; `renderField` form-level slot",
    "Headless factory hook (`useJsonForm`) for fully-headless layouts via `<JsonFormProvider>` + standalone parts",
    "Imperative handle: submit / reset / setValue / getValue / setError / trigger / focus / isDirty / isValid / isSubmitting",
    "Cross-registry deps on `@ilinxa/code-block` (for `code`) and `@ilinxa/article-body-01` (for `richtext`), both lazy-loaded via `React.lazy`",
    "Consumer-supplied `zodSchema` escape hatch — wins per-key over the DSL-generated chain",
    "`onTouched` validation by default (error after first blur OR submit); overridable via `validationMode`",
    "Object-shape callbacks throughout (per F-cross-12)",
    "Accessibility: deterministic SSR-stable field ids (`useId()`), `ariaProps` bridge passed to every renderer for correct `id` / `aria-labelledby` / `aria-required` / `aria-invalid` / `aria-describedby` wiring across native form controls AND Popover-wrapped / group-style controls, role='alert' error summary with anchor links, focus moves to first error on submit failure",
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

  version: "0.1.4",
  status: "alpha",
  createdAt: "2026-05-12",
  updatedAt: "2026-05-13",

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
