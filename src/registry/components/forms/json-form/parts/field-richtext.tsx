"use client";

// Import from specific files (not the barrel) so shadcn's path rewriter
// produces consumer-side paths that resolve correctly. The barrel index.ts
// re-exports from `./types`, but shadcn rewrites
// `@/registry/components/data/article-body-01` to
// `@/components/article-body-01/article-body-01` (a .tsx file) — which
// doesn't export the symbols at all. Direct file imports avoid the mangle.
import { ArticleBodyEditor } from "@/registry/components/data/article-body-01/article-body-01";
import {
  ARTICLE_BODY_EMPTY_VALUE,
  type ArticleBodyValue,
} from "@/registry/components/data/article-body-01/types";
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
