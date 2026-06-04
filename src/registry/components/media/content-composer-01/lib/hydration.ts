import type {
  FieldDefinition,
  FormSchema,
  FieldOptionsResolver,
} from "@/registry/components/forms/json-form/json-form";

/**
 * Config hydration layer (QP-6). A `ComposerConfig` stays a pure `.json` file
 * only while its json-form fragment is purely declarative. Function-valued
 * escape-hatches (`validate` / `validateAsync` / `compute` / async `options` /
 * the FN arm of `visibleWhen`/`enabledWhen`/`requiredWhen`) can't live in JSON.
 * This layer re-attaches them onto a deserialized `FormSchema` (by field name)
 * BEFORE the schema reaches `<JsonForm>`, and strips them back out to recover
 * the pure JSON shape (round-trip invariant).
 *
 * The OBJECT form of a `Condition` survives JSON, so `visibleWhen` etc. only
 * need hydration when authored as a function. `expression` (string) survives;
 * `compute` is its fn escape-hatch.
 *
 * The news v0.1 config needs ZERO hydration entries — `slug` uses
 * `expression: "{title}"` and `sensitivity.reason` uses the Condition OBJECT
 * form. The seam exists for future `post`/`event`/`project` configs.
 */

/** The fn arm of json-form's `ConditionOrFn` (the OBJECT arm survives JSON). */
export type ConditionFn = (args: { values: Record<string, unknown> }) => boolean;

export interface FieldHydration {
  validate?: FieldDefinition["validate"];
  validateAsync?: FieldDefinition["validateAsync"];
  compute?: FieldDefinition["compute"];
  options?: FieldOptionsResolver;
  visibleWhen?: ConditionFn;
  enabledWhen?: ConditionFn;
  requiredWhen?: ConditionFn;
}

export interface SchemaHydration {
  validate?: FormSchema["validate"];
  zodSchema?: FormSchema["zodSchema"];
}

export interface ComposerConfigHydration {
  /** keyed by `field.name` */
  fields: Record<string, FieldHydration>;
  __schema__?: SchemaHydration;
}

/**
 * Re-attach function escape-hatches onto a deserialized `FormSchema`, by field
 * name. Pure. Called BEFORE the schema reaches `<JsonForm>` (so RHF/Zod see the
 * real fns). Returns `plain` unchanged when there is no hydration.
 */
export function hydrateSchema(
  plain: FormSchema,
  hydration?: ComposerConfigHydration,
): FormSchema {
  if (!hydration) return plain;
  const fields = plain.fields.map((f) => {
    const h = hydration.fields[f.name];
    return h ? { ...f, ...h } : f;
  });
  const sh = hydration.__schema__;
  return {
    ...plain,
    fields,
    ...(sh?.validate ? { validate: sh.validate } : {}),
    ...(sh?.zodSchema ? { zodSchema: sh.zodSchema } : {}),
  };
}

/**
 * Inverse — strip all function keys to recover the pure JSON shape. Round-trip
 * invariant: `stripHydration(hydrateSchema(plain, h)).plain` ≡ `plain` (object-
 * form conditions + static-array options are preserved on the plain field).
 */
export function stripHydration(schema: FormSchema): {
  plain: FormSchema;
  hydration: ComposerConfigHydration;
} {
  const hydration: ComposerConfigHydration = { fields: {} };

  const plainFields: FieldDefinition[] = schema.fields.map((f) => {
    const {
      validate,
      validateAsync,
      compute,
      options,
      visibleWhen,
      enabledWhen,
      requiredWhen,
      ...rest
    } = f;

    const fh: FieldHydration = {};
    if (typeof validate === "function") fh.validate = validate;
    if (typeof validateAsync === "function") fh.validateAsync = validateAsync;
    if (typeof compute === "function") fh.compute = compute;
    if (typeof options === "function") fh.options = options;
    if (typeof visibleWhen === "function") fh.visibleWhen = visibleWhen;
    if (typeof enabledWhen === "function") fh.enabledWhen = enabledWhen;
    if (typeof requiredWhen === "function") fh.requiredWhen = requiredWhen;
    if (Object.keys(fh).length > 0) hydration.fields[f.name] = fh;

    // Carry the serializable arms back onto the plain field.
    const plainField: FieldDefinition = { ...rest };
    if (visibleWhen && typeof visibleWhen !== "function")
      plainField.visibleWhen = visibleWhen;
    if (enabledWhen && typeof enabledWhen !== "function")
      plainField.enabledWhen = enabledWhen;
    if (requiredWhen && typeof requiredWhen !== "function")
      plainField.requiredWhen = requiredWhen;
    if (options && typeof options !== "function") plainField.options = options;
    return plainField;
  });

  const sh: SchemaHydration = {};
  const { validate: schemaValidate, zodSchema, ...schemaRest } = schema;
  if (typeof schemaValidate === "function") sh.validate = schemaValidate;
  if (zodSchema) sh.zodSchema = zodSchema;
  if (sh.validate || sh.zodSchema) hydration.__schema__ = sh;

  return { plain: { ...schemaRest, fields: plainFields }, hydration };
}
