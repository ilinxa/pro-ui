import { createElement, lazy } from "react";
import type { FieldRenderer, FieldRendererArgs } from "../types";

import { FieldText } from "../parts/field-text";
import { FieldTextarea } from "../parts/field-textarea";
import { FieldSelect } from "../parts/field-select";
import { FieldRadioGroup } from "../parts/field-radio-group";
import { FieldCheckbox } from "../parts/field-checkbox";
import { FieldCheckboxGroup } from "../parts/field-checkbox-group";
import { FieldSwitch } from "../parts/field-switch";
import { FieldDate } from "../parts/field-date";
import { FieldSlider } from "../parts/field-slider";
import { FieldRating } from "../parts/field-rating";
import { FieldComputed } from "../parts/field-computed";
import { FieldHidden } from "../parts/field-hidden";
import { FieldSection } from "../parts/field-section";
import { FieldDivider } from "../parts/field-divider";
import { FieldFallback } from "../parts/field-fallback";

// The `code` and `richtext` fields are lazy-loaded so the CodeMirror and
// Plate bundles only ship when a form actually contains one of those
// fields. The Suspense boundary lives in `FieldWrapper`.
const LazyFieldCode = lazy(() => import("../parts/field-code"));
const FieldCode: FieldRenderer = (args: FieldRendererArgs) =>
  createElement(LazyFieldCode, args);

const LazyFieldRichtext = lazy(() => import("../parts/field-richtext"));
const FieldRichtext: FieldRenderer = (args: FieldRendererArgs) =>
  createElement(LazyFieldRichtext, args);

/**
 * Built-in field renderer registry. Spread + extend in consumer code:
 *
 *   const myRegistry = { ...defaultJsonFormRegistry, "rich-text": MyRenderer };
 */
/**
 * v0.1.7 — internal whitelist of built-in field types whose renderers do NOT
 * read `args.allValues` reactively. Defined in v0.1.7 (defined-but-unused);
 * `field-wrapper.tsx` in v0.2.0 consults this set to skip the FieldWrapper-
 * level `useWatch({ control })` for whitelisted types — `allValues` then
 * comes from a `rhf.getValues()` snapshot taken at render time.
 *
 * Audit basis: every built-in renderer's source was checked for
 * `args.allValues` access on 2026-05-21. `computed`'s renderer destructures
 * only `field`, `value`, `onChange`, `disabled`, `ariaProps`; the values-
 * reading happens inside `useComputed()` via its own narrow `useWatch`
 * (independent of the FieldWrapper-level watch), so `computed` is in the
 * whitelist. `section` + `divider` are layout-only and never hit
 * FieldWrapper, but are included for completeness so the set covers every
 * registry slot.
 *
 * Consumer-registered renderers OVERRIDING built-in types are NOT in this
 * whitelist (the v0.2.0 check resolves on the FINAL renderer identity, not
 * on `field.type` alone). A custom renderer replacing `text` correctly
 * opts out of the watch drop unless the field also sets `dependsOn`.
 *
 * Drift mitigation: any future built-in renderer that adds `args.allValues`
 * access MUST be removed from this set in the same commit. A
 * `validate-meta-deps`-style lint scanning default-registry sources for
 * `args.allValues` access is planned for v0.2.0+1.
 */
export const BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES: ReadonlySet<string> =
  new Set([
    // text family
    "text",
    "email",
    "password",
    "url",
    "tel",
    "number",
    "textarea",
    // choice family
    "select",
    "multi-select",
    "radio-group",
    "checkbox",
    "checkbox-group",
    "switch",
    // date/time family
    "date",
    "date-range",
    "time",
    "datetime",
    // rich / composite
    "code",
    "slider",
    "rating",
    "richtext",
    // special
    "computed",
    "hidden",
    "section",
    "divider",
  ]);

export const defaultJsonFormRegistry: Record<string, FieldRenderer> = {
  // text family
  text: FieldText,
  email: FieldText,
  password: FieldText,
  url: FieldText,
  tel: FieldText,
  number: FieldText,
  textarea: FieldTextarea,
  // choice family
  select: FieldSelect,
  "multi-select": FieldSelect,
  "radio-group": FieldRadioGroup,
  checkbox: FieldCheckbox,
  "checkbox-group": FieldCheckboxGroup,
  switch: FieldSwitch,
  // date/time family
  date: FieldDate,
  "date-range": FieldDate,
  time: FieldDate,
  datetime: FieldDate,
  // rich / composite
  code: FieldCode,
  slider: FieldSlider,
  rating: FieldRating,
  richtext: FieldRichtext,
  // special
  computed: FieldComputed,
  hidden: FieldHidden,
  section: FieldSection,
  divider: FieldDivider,
  // fallback
  __fallback__: FieldFallback,
};
