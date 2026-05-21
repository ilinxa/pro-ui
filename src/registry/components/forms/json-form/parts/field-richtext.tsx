"use client";

// Import everything from `article-body-01.tsx` (not `./types`, not the
// barrel `./index`). shadcn 4.6.0's path rewriter handles cross-procomp
// component-file paths correctly but mangles `/types` and `/index` to the
// CURRENT slug (F-S1 cross-procomp `/types` bug), which then breaks
// consumer-tsc. `article-body-01.tsx` re-exports the symbols we need at
// its tail, so all imports land on a path the rewriter preserves.
import {
  ArticleBodyEditor,
  ARTICLE_BODY_EMPTY_VALUE,
  type ArticleBodyValue,
} from "@/registry/components/data/article-body-01/article-body-01";
import type { FieldRenderer } from "../types";

/**
 * `richtext` field renderer — wraps `@ilinxa/article-body-01`'s
 * `<ArticleBodyEditor>` in a Plate-based WYSIWYG.
 *
 * Loaded lazily by `default-registry.ts` so the Plate bundle (~165KB gzip)
 * only ships when a form actually contains a `richtext` field. Therefore
 * this MUST `export default`.
 *
 * Submitted value: `ArticleBodyValue` (Plate JSON — `{ type, children }[]`).
 * Serialize with `serializeArticleBodyToHtml(value)` from
 * `@ilinxa/article-body-01` if you need HTML at an export boundary
 * (RSS / email / OG tags).
 *
 * ARIA: `ArticleBodyEditor` doesn't expose `id` (Plate manages a
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
  const safe = isRichtextValue(value) ? value : ARTICLE_BODY_EMPTY_VALUE;

  return (
    <div
      role="group"
      aria-labelledby={ariaProps.labelledBy}
      aria-disabled={ariaProps["aria-disabled"]}
      aria-describedby={ariaProps["aria-describedby"]}
      data-aria-required={ariaProps["aria-required"] ? "true" : undefined}
      data-aria-invalid={ariaProps["aria-invalid"] ? "true" : undefined}
    >
      <ArticleBodyEditor
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

function isRichtextValue(v: unknown): v is ArticleBodyValue {
  return Array.isArray(v);
}

export default FieldRichtext;
