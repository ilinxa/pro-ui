"use client";

// Import everything from `rich-text-editor.tsx` (not `./types`, not the
// barrel `./index`). shadcn 4.6.0's path rewriter handles cross-procomp
// component-file paths correctly but mangles `/types` and `/index` to the
// CURRENT slug (F-S1 cross-procomp `/types` bug), which then breaks
// consumer-tsc. `rich-text-editor.tsx` re-exports the symbols we need at
// its tail, so all imports land on a path the rewriter preserves.
import {
  RichTextEditor,
  RICH_TEXT_EMPTY_VALUE,
  type RichTextValue,
} from "@/registry/components/data/rich-text-editor/rich-text-editor";
import type { FieldRenderer } from "../types";

/**
 * `richtext` field renderer — wraps `@ilinxa/rich-text-editor`'s
 * `<RichTextEditor>` in a Plate-based WYSIWYG.
 *
 * Loaded lazily by `default-registry.ts` so the Plate bundle (~165KB gzip)
 * only ships when a form actually contains a `richtext` field. Therefore
 * this MUST `export default`.
 *
 * Submitted value: `RichTextValue` (Plate JSON — `{ type, children }[]`).
 * Serialize with `serializeRichTextToHtml(value)` from
 * `@ilinxa/rich-text-editor` if you need HTML at an export boundary
 * (RSS / email / OG tags).
 *
 * ARIA: `RichTextEditor` doesn't expose `id` (Plate manages a
 * contenteditable internally). Wrap in a `role="group"` with
 * `aria-labelledby` so the wrapper's label binds.
 */
const FieldRichtext: FieldRenderer = ({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  ariaProps,
}) => {
  const cfg = field.config?.richText;
  const safe = isRichtextValue(value) ? value : RICH_TEXT_EMPTY_VALUE;

  return (
    <div
      role="group"
      aria-labelledby={ariaProps.labelledBy}
      aria-disabled={ariaProps["aria-disabled"]}
      aria-describedby={ariaProps["aria-describedby"]}
      data-aria-required={ariaProps["aria-required"] ? "true" : undefined}
      data-aria-invalid={ariaProps["aria-invalid"] ? "true" : undefined}
    >
      <RichTextEditor
        value={safe}
        onChange={(next) => onChange(next)}
        readOnly={readOnly || disabled}
        placeholder={field.placeholder}
        hideToolbar={cfg?.hideToolbar}
        autoFocus={cfg?.autoFocus ?? field.autoFocus}
      />
    </div>
  );
};

function isRichtextValue(v: unknown): v is RichTextValue {
  return Array.isArray(v);
}

export default FieldRichtext;
