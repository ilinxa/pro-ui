"use client";

import { useMemo } from "react";
import type { FieldRenderer } from "../types";
import { useJsonFormContext } from "../json-form-context";
import { FieldWrapper } from "./field-wrapper";
import { FieldFallback } from "./field-fallback";

export interface JsonFormFieldProps {
  /** Field name to look up in the active schema. */
  name: string;
  /**
   * Optional override registry for this single field. Falls back to the
   * form-level merged registry (built from `<JsonForm fieldRegistry>`
   * spread over the default registry).
   */
  registry?: Record<string, FieldRenderer>;
}

/**
 * Standalone field renderer for fully-headless layouts. Looks up the field
 * by `name` in the current schema, resolves a renderer from the registry,
 * wraps it in `<FieldWrapper>`. Throws (dev) if the field isn't found.
 *
 * The form-level merged registry is exposed via `ctx.fieldRegistry`.
 */
export function JsonFormField({ name, registry }: JsonFormFieldProps) {
  const ctx = useJsonFormContext();
  const field = useMemo(
    () => ctx.schema.fields.find((f) => f.name === name),
    [ctx.schema.fields, name],
  );

  if (!field) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[json-form] <JsonFormField name="${name}"> — no field with this name in the current schema.`,
      );
    }
    return null;
  }

  const merged = registry ?? ctx.fieldRegistry;
  const renderer = merged[field.type] ?? FieldFallback;
  return <FieldWrapper field={field} renderer={renderer} />;
}

export default JsonFormField;
