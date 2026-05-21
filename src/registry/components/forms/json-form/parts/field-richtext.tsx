"use client";

import { useCallback, useMemo, useRef } from "react";
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
 *
 * v0.2.2 — controlled-mode echo guard (React #185 fix). RHF emits a new
 * `value` reference on every state change, even when the content hasn't
 * changed. `ArticleBodyEditor`'s internal sync effect uses reference
 * equality (`controlledValue !== lastSyncedValueRef.current`) and would
 * loop: new ref → `editor.tf.setValue` → Plate emits onChange → another
 * new ref → setValue → ... maxing out React's update budget. The fix is
 * the canonical three-defenses pattern: stable `value` ref keyed on content
 * (so identity tracks content, not RHF's per-render churn) + stable
 * `onChange` callback. Surfaced 2026-05-21 in the Rich Fields demo tab
 * after v0.2.0 substrate changes; the latent loop in `ArticleBodyEditor`'s
 * ref-equality echo guard is the root cause and is best fixed there in a
 * future `article-body-01` bump, but this guard contains it at the
 * consumer (json-form) layer.
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

  const stableValue = useStableRichtextValue(value);
  const stableOnChange = useCallback(
    (next: ArticleBodyValue) => onChange(next),
    [onChange],
  );

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
        value={stableValue}
        onChange={stableOnChange}
        readOnly={readOnly || disabled}
        placeholder={field.placeholder}
        hideToolbar={cfg?.hideToolbar}
        autoFocus={cfg?.autoFocus ?? field.autoFocus}
      />
    </div>
  );
};

/**
 * Returns a reference-stable `ArticleBodyValue` that flips identity only
 * when the value's serialized content changes. Breaks the controlled-mode
 * echo loop where RHF's per-render fresh refs would otherwise trigger
 * `ArticleBodyEditor`'s reference-equality sync effect to fire setValue
 * on every render.
 */
function useStableRichtextValue(value: unknown): ArticleBodyValue {
  const candidate: ArticleBodyValue = isRichtextValue(value)
    ? value
    : ARTICLE_BODY_EMPTY_VALUE;
  const lastKeyRef = useRef<string>("");
  const lastValueRef = useRef<ArticleBodyValue>(candidate);

  return useMemo(() => {
    const key = serializeRichtextKey(candidate);
    if (key === lastKeyRef.current && lastValueRef.current) {
      return lastValueRef.current;
    }
    lastKeyRef.current = key;
    lastValueRef.current = candidate;
    return candidate;
    // `candidate` is the only meaningful input; the refs are intentional
    // intermediate state. ESLint can't see through the equality bridge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);
}

function isRichtextValue(v: unknown): v is ArticleBodyValue {
  return Array.isArray(v);
}

/** Content-stable hash key for an `ArticleBodyValue` tree. Stringify is
 * adequate for Plate JSON (no functions, no cycles); for large documents
 * this is O(n) but Plate trees are small enough that the cost is below
 * a keystroke's frame budget. */
function serializeRichtextKey(value: ArticleBodyValue): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(Math.random());
  }
}

export default FieldRichtext;
