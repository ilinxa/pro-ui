"use client";

// Cross-procomp import via the `.tsx` component-file path (NOT `./types`, NOT
// the barrel) — the F-S1 precedent (`json-form/parts/field-richtext.tsx`).
// shadcn's path rewriter preserves the component-file path but mangles
// `/types` + `/index` to the current slug. `rich-text-editor.tsx` re-exports
// the symbols we need at its tail.
import {
  RichTextEditor,
  RICH_TEXT_EMPTY_VALUE,
  type RichTextValue,
} from "@/registry/components/data/rich-text-editor/rich-text-editor";
import type { ImageUploader } from "@/registry/components/data/rich-text-editor/rich-text-editor";

export interface BodySubstratePlateProps {
  value: RichTextValue;
  onChange: (next: RichTextValue) => void;
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
 * Richtext body substrate — wraps `@ilinxa/rich-text-editor`'s
 * `<RichTextEditor>` (Plate). MUST `export default` — `lib/substrates.tsx`
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
  const safe = Array.isArray(value) ? value : RICH_TEXT_EMPTY_VALUE;
  return (
    <div role="group" aria-labelledby={labelledBy}>
      <RichTextEditor
        value={safe}
        onChange={onChange}
        placeholder={placeholder ?? "Write the article…"}
        onImageUpload={onImageUpload}
      />
    </div>
  );
}
