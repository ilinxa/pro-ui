import { z } from "zod";
import type { ComposerConfig } from "@/registry/components/media/content-composer-01";

/**
 * Validation schema for the content-composer-01 playground. It mirrors
 * `ComposerConfig` closely enough to give precise, line-relevant errors — but the
 * playground passes the ORIGINAL parsed JSON to the composer (not zod's output),
 * so unmodelled slotConfig keys (a json-form field's `rows` / `options` /
 * `validators`, etc.) survive at full fidelity. Default object mode allows + ignores
 * extra keys, so the schema validates without stripping anything the user needs.
 */

const publishMode = z.enum(["draft", "publish", "schedule"]);
const presentation = z.enum(["inline", "dialog", "auto"]);

const fieldDef = z.object({
  name: z.string().min(1, "a field needs a non-empty `name`"),
  type: z.string().min(1, "a field needs a `type`"),
});

const formSchema = z.object({
  fields: z.array(fieldDef).min(1, "`schema.fields` must list at least one field"),
});

const validationRule = z.object({
  field: z.string().min(1),
  minLength: z.number().optional(),
  mediaRequired: z.boolean().optional(),
  message: z.string().min(1),
});

const stepValidation = z.object({
  mode: z.enum(["all-fields-valid", "custom"]),
  rules: z.array(validationRule).optional(),
});

const baseStep = {
  id: z.string().min(1, "step `id` is required"),
  title: z.string().min(1, "step `title` is required"),
  validation: stepValidation.optional(),
  optional: z.boolean().optional(),
  visibleWhen: z.unknown().optional(),
};

const metadataStep = z.object({
  ...baseStep,
  slot: z.literal("metadataFields"),
  slotConfig: z.object({
    columns: z.union([z.literal(1), z.literal(2)]).optional(),
    schema: formSchema,
  }),
});

const bodyStep = z.object({
  ...baseStep,
  slot: z.literal("bodySlot"),
  slotConfig: z.object({
    substrate: z.enum(["plate", "plaintext"]),
    fieldName: z.string().min(1),
    placeholder: z.string().optional(),
  }),
});

const mediaStep = z.object({
  ...baseStep,
  slot: z.literal("mediaSlot"),
  slotConfig: z.object({
    fieldName: z.string().min(1),
    enabledModes: z.array(z.string()),
    enabledTools: z.array(z.string()),
    mediaSources: z.array(z.string()),
    aspect: z.string().min(1),
    presentation: presentation.optional(),
    cropAspects: z.array(z.string()).optional(),
    maxFileSizeMb: z.number().optional(),
  }),
});

const carouselStep = z.object({
  ...baseStep,
  slot: z.literal("mediaCarouselSlot"),
  slotConfig: z.object({
    fieldName: z.string().min(1),
    maxItems: z.number().optional(),
    maxFileSizeMb: z.number().optional(),
    accept: z.array(z.enum(["image", "video"])).optional(),
    aspect: z.string().optional(),
    enabledTools: z.array(z.string()).optional(),
  }),
});

const step = z.discriminatedUnion("slot", [
  metadataStep,
  bodyStep,
  mediaStep,
  carouselStep,
]);

export const composerConfigSchema = z.object({
  id: z.string().min(1, "`id` is required"),
  version: z.string().min(1, "`version` is required"),
  title: z.string().min(1, "`title` is required"),
  adapterId: z.string().min(1, "`adapterId` is required"),
  steps: z.array(step).min(1, "at least one step is required"),
  publishModes: z.array(publishMode).min(1, "list at least one publish mode"),
  presentation: presentation.optional(),
  autosave: z
    .object({ enabled: z.boolean(), debounceMs: z.number().optional() })
    .optional(),
});

export type ValidateResult =
  | { ok: true; value: ComposerConfig }
  | { ok: false; error: string };

/** Parse + validate the editor text. Returns the ORIGINAL parsed object on
 *  success (full fidelity — zod is used only for error messages). */
export function validateComposerConfig(text: string): ValidateResult {
  if (!text.trim()) return { ok: false, error: "Write a ComposerConfig to begin." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Invalid JSON — ${(e as Error).message}` };
  }
  const res = composerConfigSchema.safeParse(parsed);
  if (!res.success) {
    const first = res.error.issues[0];
    const path = first.path.join(".");
    return {
      ok: false,
      error: path ? `${path} — ${first.message}` : first.message,
    };
  }
  // Use the original parsed JSON, not res.data, so unmodelled keys survive.
  return { ok: true, value: parsed as ComposerConfig };
}

/** Pre-loaded starter — a working multi-media post (carousel) + caption, wired to
 *  the playground adapter so Publish/Save assemble a visible result item. */
export const STARTER_CONFIG = `{
  "id": "playground-post",
  "version": "1.0.0",
  "title": "Playground Post",
  "adapterId": "playground",
  "presentation": "inline",
  "autosave": { "enabled": true, "debounceMs": 800 },
  "publishModes": ["draft", "publish"],
  "steps": [
    {
      "id": "media",
      "title": "Media",
      "slot": "mediaCarouselSlot",
      "slotConfig": {
        "fieldName": "media",
        "maxItems": 10,
        "accept": ["image", "video"],
        "aspect": "auto",
        "enabledTools": ["crop", "filters", "adjust"]
      },
      "validation": {
        "mode": "custom",
        "rules": [
          { "field": "media", "mediaRequired": true, "message": "Add at least one photo or video." }
        ]
      }
    },
    {
      "id": "caption",
      "title": "Caption",
      "slot": "metadataFields",
      "slotConfig": {
        "columns": 1,
        "schema": {
          "fields": [
            {
              "name": "caption",
              "type": "textarea",
              "label": "Caption",
              "placeholder": "What's happening?",
              "rows": 3,
              "validators": { "required": "Write a caption." }
            },
            { "name": "tags", "type": "tags", "label": "Hashtags" }
          ]
        }
      },
      "validation": { "mode": "all-fields-valid" }
    }
  ]
}
`;
