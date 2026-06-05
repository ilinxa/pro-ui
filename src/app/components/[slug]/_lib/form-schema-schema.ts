import { z } from "zod";
import type { FormSchema } from "@/registry/components/forms/json-form";

/**
 * Validation schema for the json-form playground. Mirrors the JSON-expressible
 * part of a `FormSchema` — `fields` + `meta` — and returns the ORIGINAL parsed
 * JSON on success (full fidelity; zod is used only for error messages).
 *
 * Function-valued schema keys (`validate`, `zodSchema`, an `options` resolver,
 * `compute`, …) can't live in JSON, so the playground covers the declarative
 * subset: field type, label, placeholder, declarative `validators`, static
 * `options`, `visibleWhen` (Condition object form), layout hints, etc.
 */

const fieldDef = z.object({
  name: z.string().min(1, "a field needs a non-empty `name`"),
  type: z.string().min(1, "a field needs a `type`"),
});

export const formSchemaSchema = z.object({
  fields: z.array(fieldDef).min(1, "`fields` must list at least one field"),
  meta: z
    .object({
      id: z.string().optional(),
      version: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

export type ValidateFormSchemaResult =
  | { ok: true; value: FormSchema }
  | { ok: false; error: string };

export function validateFormSchema(text: string): ValidateFormSchemaResult {
  if (!text.trim()) return { ok: false, error: "Write a FormSchema to begin." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Invalid JSON — ${(e as Error).message}` };
  }
  const res = formSchemaSchema.safeParse(parsed);
  if (!res.success) {
    const first = res.error.issues[0];
    const path = first.path.join(".");
    return {
      ok: false,
      error: path ? `${path} — ${first.message}` : first.message,
    };
  }
  // Use the original parsed JSON, not res.data, so unmodelled field keys survive.
  return { ok: true, value: parsed as FormSchema };
}

/** Pre-loaded starter — a representative form covering several field types,
 *  declarative validators, and static select options. */
export const STARTER_FORM_SCHEMA = `{
  "fields": [
    {
      "name": "fullName",
      "type": "text",
      "label": "Full name",
      "placeholder": "Ada Lovelace",
      "validators": { "required": "Your name is required." }
    },
    {
      "name": "email",
      "type": "email",
      "label": "Email",
      "placeholder": "you@example.com",
      "validators": { "required": true, "email": "Enter a valid email." }
    },
    {
      "name": "role",
      "type": "select",
      "label": "Role",
      "placeholder": "Pick one",
      "options": [
        { "value": "designer", "label": "Designer" },
        { "value": "engineer", "label": "Engineer" },
        { "value": "pm", "label": "Product manager" }
      ]
    },
    {
      "name": "experience",
      "type": "number",
      "label": "Years of experience",
      "min": 0,
      "max": 50
    },
    { "name": "remote", "type": "switch", "label": "Open to remote work" },
    {
      "name": "bio",
      "type": "textarea",
      "label": "Short bio",
      "placeholder": "Tell us about yourself…",
      "rows": 4,
      "validators": { "maxLength": { "value": 280, "message": "Keep it under 280 characters." } }
    }
  ]
}
`;
