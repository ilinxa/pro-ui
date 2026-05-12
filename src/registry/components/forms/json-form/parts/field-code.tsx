"use client";

// Import from the specific file (not the barrel) so shadcn's path rewriter
// produces a consumer-side path that resolves. The barrel index.ts re-export
// works here by accident — code-block.tsx happens to export `CodeBlock` —
// but the explicit file path is the safe convention. See field-richtext.tsx.
import { CodeBlock } from "@/registry/components/code/code-block/code-block";
import type { FieldRenderer } from "../types";

/**
 * `code` field renderer — wraps `@ilinxa/code-block` in `mode='edit'`.
 *
 * Loaded lazily by `default-registry.ts`
 * (`React.lazy(() => import('../parts/field-code'))`) so the CodeMirror
 * chunk only ships when a form actually contains a `code` field.
 *
 * Therefore this MUST `export default`.
 *
 * ARIA: `code-block` doesn't expose `id` (CodeMirror takes over the
 * contenteditable element). Wrap in a `<div role="group">` with
 * `aria-labelledby` so the wrapper's label still announces correctly.
 */
const FieldCode: FieldRenderer = ({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  ariaProps,
}) => {
  const cfg = field.config?.code;
  const codeReadOnly = readOnly || disabled || cfg?.readOnly;

  return (
    <div
      role="group"
      aria-labelledby={ariaProps.labelledBy}
      aria-disabled={ariaProps["aria-disabled"]}
      aria-describedby={ariaProps["aria-describedby"]}
      data-aria-required={ariaProps["aria-required"] ? "true" : undefined}
      data-aria-invalid={ariaProps["aria-invalid"] ? "true" : undefined}
    >
      <CodeBlock
        mode="edit"
        value={typeof value === "string" ? value : ""}
        onChange={(args) => onChange(args.value)}
        readOnly={codeReadOnly}
        lang={field.lang}
        emptyMessage={field.placeholder}
        showLineNumbers
        showCopy
        ariaLabel={field.label ?? field.name}
      />
    </div>
  );
};

export default FieldCode;
