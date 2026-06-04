"use client";

// Cross-procomp import via the `.tsx` component-file path (NOT `./types`, NOT
// the barrel) — the F-S1 precedent (`json-form/parts/field-richtext.tsx`).
// shadcn's path rewriter preserves the component-file path but mangles
// `/types` + `/index` to the current slug. `article-body-01.tsx` re-exports
// the symbols we need at its tail.
import {
  ArticleBodyEditor,
  ARTICLE_BODY_EMPTY_VALUE,
  type ArticleBodyValue,
} from "@/registry/components/data/article-body-01/article-body-01";
import type { ImageUploader } from "@/registry/components/data/article-body-01/article-body-01";

export interface BodySubstratePlateProps {
  value: ArticleBodyValue;
  onChange: (next: ArticleBodyValue) => void;
  placeholder?: string;
  labelledBy?: string;
  /**
   * Optional inline-image uploader (`(file) => Promise<{ src }>`). Unwired in
   * v0.1 — the composer's media `uploader` is `ExportMetadata`-shaped (media-
   * export-specific), which is semantically wrong to fabricate for inline
   * article images. A dedicated body-image uploader prop is a v0.1.1 follow-up;
   * until then Plate falls back to its URL-prompt image insertion.
   */
  onImageUpload?: ImageUploader;
}

/**
 * Richtext body substrate — wraps `@ilinxa/article-body-01`'s
 * `<ArticleBodyEditor>` (Plate). MUST `export default` — `lib/substrates.tsx`
 * `React.lazy`-loads it so configs without a richtext body don't pay the
 * ~165 KB Plate chunk. Plate owns a contenteditable (no `id`), so the wrapper
 * binds via `role="group"` + `aria-labelledby`.
 */
export default function BodySubstratePlate({
  value,
  onChange,
  placeholder,
  labelledBy,
  onImageUpload,
}: BodySubstratePlateProps) {
  const safe = Array.isArray(value) ? value : ARTICLE_BODY_EMPTY_VALUE;
  return (
    <div role="group" aria-labelledby={labelledBy}>
      <ArticleBodyEditor
        value={safe}
        onChange={onChange}
        placeholder={placeholder ?? "Write the article…"}
        onImageUpload={onImageUpload}
      />
    </div>
  );
}
