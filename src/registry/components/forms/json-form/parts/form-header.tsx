"use client";

import { useJsonFormContext } from "../json-form-context";

/**
 * Renders the form's `meta.title` + `meta.description` chrome at the top of
 * the form. Hidden by default if `meta` is absent or `showSchemaHeader` is
 * `false` (handled by `<JsonForm>`). Exported as a standalone atom so
 * consumers building fully-headless layouts can place it themselves.
 */
export function FormHeader() {
  const ctx = useJsonFormContext();
  const meta = ctx.schema.meta;
  if (!meta?.title && !meta?.description) return null;

  return (
    <header className="flex flex-col gap-1 pb-2">
      {meta.title ? (
        <h2 className="text-base font-semibold text-foreground">
          {meta.title}
        </h2>
      ) : null}
      {meta.description ? (
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      ) : null}
    </header>
  );
}

export default FormHeader;
