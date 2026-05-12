"use client";

import { useEffect } from "react";
import type { FieldRenderer } from "../types";

/**
 * Fallback renderer for unknown field types. Renders an inline error
 * placeholder and warns once per mount in dev.
 */
export const FieldFallback: FieldRenderer = ({ field, ariaProps }) => {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    console.warn(
      `[json-form] No renderer registered for field type "${field.type}" ` +
        `(field "${field.name}"). Register one via the \`fieldRegistry\` prop ` +
        `or use one of the built-in types.`,
    );
  }, [field.type, field.name]);

  return (
    <div
      id={ariaProps.id}
      role="alert"
      aria-labelledby={ariaProps.labelledBy}
      aria-describedby={ariaProps["aria-describedby"]}
      className="inline-flex w-full items-center gap-2 rounded-md border border-dashed border-destructive/40 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive"
    >
      <span aria-hidden>⚠</span>
      <span>
        Unknown field type <code className="font-mono">{field.type}</code>
      </span>
    </div>
  );
};

export default FieldFallback;
