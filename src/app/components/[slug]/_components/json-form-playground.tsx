"use client";

import { JsonForm } from "@/registry/components/forms/json-form";
import type { FormSchema } from "@/registry/components/forms/json-form";
import {
  STARTER_FORM_SCHEMA,
  validateFormSchema,
} from "../_lib/form-schema-schema";
import { JsonPlayground } from "./json-playground";

export function JsonFormPlayground() {
  return (
    <JsonPlayground<FormSchema>
      starter={STARTER_FORM_SCHEMA}
      editorLabel="FormSchema · JSON"
      validate={validateFormSchema}
      resultHint="submitted values (onSubmit payload)"
      renderPreview={(schema, setResult) => (
        <JsonForm
          schema={schema}
          onSubmit={({ values }) => setResult("Submitted", values)}
        />
      )}
    />
  );
}
