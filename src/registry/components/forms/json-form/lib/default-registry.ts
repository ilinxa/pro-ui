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
