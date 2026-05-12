import { z } from "zod";
import type { ZodObject, ZodTypeAny } from "zod";
import type { FieldDefinition, FieldValidators, FormSchema, JsonFormStrings } from "../types";
import { resolveConditionOrFn } from "./condition-evaluator";
import { formatErrorTemplate } from "./strings";
import { isValueField } from "./validate-schema";
import { getByPath } from "./path";

/**
 * Compile a `FormSchema` into a `ZodObject` ready for the RHF resolver.
 *
 * Pipeline (per plan):
 *   1. Walk value-carrying fields and build a per-field Zod chain from
 *      `field.validators` + base type.
 *   2. Group fields by dot-path roots and build a nested ZodObject via
 *      a path-trie.
 *   3. Apply `field.validate` (sync) + `field.validateAsync` via
 *      `.superRefine()` on the leaf type (the resolver evaluates these
 *      after the structural validators).
 *   4. Apply form-level `schema.validate` via a final outer `.superRefine()`.
 *   5. Apply `requiredWhen` via another outer `.superRefine()` that checks
 *      visibility-aware required-ness against the runtime values bag.
 *   6. Merge `schema.zodSchema` LAST — consumer-provided keys overwrite
 *      DSL-generated ones (M-03 / T8 lock).
 */
export function compileSchema(
  schema: FormSchema,
  strings: JsonFormStrings,
): ZodObject<Record<string, ZodTypeAny>> {
  // 1. Build flat leaf map: 'path' → ZodType
  const leaves = new Map<string, ZodTypeAny>();
  for (const field of schema.fields) {
    if (!isValueField(field)) continue;
    leaves.set(field.name, buildFieldZod(field, strings));
  }

  // 2. Nested ZodObject via path-trie
  let zod = buildNestedZodObject(leaves);

  // 3. Per-field custom sync + async validators via outer .superRefine
  zod = applyCustomValidators(zod, schema.fields);

  // 4. Form-level validate
  if (schema.validate) {
    const formValidate = schema.validate;
    zod = zod.superRefine((values, ctx) => {
      const errors = formValidate({ values: values as Record<string, unknown> });
      if (!errors) return;
      for (const [path, message] of Object.entries(errors)) {
        ctx.addIssue({
          code: "custom",
          path: path.split("."),
          message,
        });
      }
    }) as ZodObject<Record<string, ZodTypeAny>>;
  }

  // 5. requiredWhen — conditional required
  zod = applyRequiredWhen(zod, schema.fields, strings);

  // 6. Merge consumer's zodSchema — consumer wins per-key
  if (schema.zodSchema) {
    zod = mergeZodSchemas(zod, schema.zodSchema);
  }

  return zod;
}

// ─── Per-field base Zod construction ─────────────────────────────────────────

function buildFieldZod(field: FieldDefinition, strings: JsonFormStrings): ZodTypeAny {
  const v = field.validators ?? {};
  let chain: ZodTypeAny;

  switch (field.type) {
    case "text":
    case "email":
    case "password":
    case "url":
    case "tel":
    case "textarea":
    case "code": {
      let s = z.string();
      // built-in format checks derived from type
      if (field.type === "email") {
        s = s.email(extractMessage(v.email, strings.errorTemplates.email));
      }
      if (field.type === "url") {
        s = s.url(extractMessage(v.url, strings.errorTemplates.url));
      }
      // declared validators
      if (v.minLength != null) {
        const { value, message } = normalizeNumeric(v.minLength, strings.errorTemplates.minLength);
        s = s.min(value, formatErrorTemplate(message, { n: value }));
      }
      if (v.maxLength != null) {
        const { value, message } = normalizeNumeric(v.maxLength, strings.errorTemplates.maxLength);
        s = s.max(value, formatErrorTemplate(message, { n: value }));
      }
      if (v.pattern != null) {
        const { value, message } = normalizePattern(v.pattern, strings.errorTemplates.pattern);
        try {
          const re = new RegExp(value);
          s = s.regex(re, message);
        } catch {
          // invalid regex — leave the field non-strictly-validated
        }
      }
      if (v.email && field.type !== "email") {
        s = s.email(extractMessage(v.email, strings.errorTemplates.email));
      }
      if (v.url && field.type !== "url") {
        s = s.url(extractMessage(v.url, strings.errorTemplates.url));
      }
      chain = applyRequired(s, v, strings);
      break;
    }

    case "number":
    case "slider":
    case "rating": {
      // z.coerce.number handles the <input> string→number conversion
      let n = z.coerce.number();
      if (v.min != null) {
        const { value, message } = normalizeNumeric(v.min, strings.errorTemplates.min);
        n = n.gte(Number(value), formatErrorTemplate(message, { n: value }));
      }
      if (v.max != null) {
        const { value, message } = normalizeNumeric(v.max, strings.errorTemplates.max);
        n = n.lte(Number(value), formatErrorTemplate(message, { n: value }));
      }
      chain = applyRequired(n, v, strings);
      break;
    }

    case "checkbox":
    case "switch":
      chain = applyRequiredBoolean(z.boolean(), v, strings);
      break;

    case "select":
    case "radio-group":
      chain = applyRequiredUnknown(z.unknown(), v, strings);
      break;

    case "multi-select":
    case "checkbox-group":
      chain = applyRequiredArray(z.array(z.unknown()), v, strings);
      break;

    case "date":
    case "time":
    case "datetime":
      chain = applyRequired(z.string(), v, strings);
      break;

    case "richtext":
      // Plate `Value` = `Array<TElement | TText>`. Required = at least one
      // node that contains non-empty text (we can't strict-check the inner
      // shape without pulling platejs into the compiler, so a permissive
      // array check + a custom-validate hook covers it).
      chain = applyRequiredRichtext(v, strings);
      break;

    case "date-range":
      chain = applyRequiredUnknown(
        z.object({ start: z.string(), end: z.string() }),
        v,
        strings,
      );
      break;

    case "computed":
    case "hidden":
      // Carry value through; only `required` matters (e.g., CSRF token).
      chain = applyRequiredUnknown(z.unknown(), v, strings);
      break;

    default:
      // unknown/consumer-registered type → permissive default
      chain = applyRequiredUnknown(z.unknown(), v, strings);
  }

  return chain;
}

// ─── Required-handling per base type ─────────────────────────────────────────

function applyRequired(s: ZodTypeAny, v: FieldValidators, strings: JsonFormStrings): ZodTypeAny {
  if (!v.required) {
    if (s instanceof z.ZodString) return s.optional().or(z.literal(""));
    return s.optional();
  }
  const message = typeof v.required === "string" ? v.required : strings.errorTemplates.required;
  if (s instanceof z.ZodString) {
    return (s as z.ZodString).min(1, message);
  }
  // For numbers (incl. ZodCoercedNumber) and other types, the resolver
  // already rejects undefined values when not made optional.
  return s.refine((val) => val !== undefined && val !== null && val !== "", { message });
}

function applyRequiredBoolean(s: z.ZodBoolean, v: FieldValidators, strings: JsonFormStrings): ZodTypeAny {
  if (!v.required) return s.optional();
  const message = typeof v.required === "string" ? v.required : strings.errorTemplates.required;
  return s.refine((val) => val === true, { message });
}

function applyRequiredUnknown<T extends ZodTypeAny>(s: T, v: FieldValidators, strings: JsonFormStrings): ZodTypeAny {
  if (!v.required) return s.optional();
  const message = typeof v.required === "string" ? v.required : strings.errorTemplates.required;
  return s.refine((val) => val !== undefined && val !== null && val !== "", { message });
}

function applyRequiredArray(s: z.ZodArray<ZodTypeAny>, v: FieldValidators, strings: JsonFormStrings): ZodTypeAny {
  if (!v.required) return s.optional();
  const message = typeof v.required === "string" ? v.required : strings.errorTemplates.required;
  return s.min(1, message);
}

function applyRequiredRichtext(v: FieldValidators, strings: JsonFormStrings): ZodTypeAny {
  const base = z.array(z.unknown());
  if (!v.required) return base.optional();
  const message = typeof v.required === "string" ? v.required : strings.errorTemplates.required;
  // Required = non-empty after stripping the "single empty paragraph" default.
  return base.refine((nodes) => richtextHasContent(nodes as unknown[]), { message });
}

function richtextHasContent(nodes: unknown[]): boolean {
  if (!Array.isArray(nodes) || nodes.length === 0) return false;
  // Walk leaf `text` props; consider empty if every text node is whitespace-only.
  function visit(n: unknown): boolean {
    if (n == null || typeof n !== "object") return false;
    const obj = n as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text.trim().length > 0;
    const children = obj.children;
    if (Array.isArray(children)) return children.some(visit);
    return false;
  }
  return nodes.some(visit);
}

// ─── Validator normalization helpers ─────────────────────────────────────────

type NumericValidator = number | string | { value: number | string; message: string };

function normalizeNumeric(
  raw: NumericValidator,
  defaultMessage: string,
): { value: number; message: string } {
  if (typeof raw === "object") {
    return { value: Number(raw.value), message: raw.message };
  }
  return { value: Number(raw), message: defaultMessage };
}

type PatternValidator = string | { value: string; message: string };

function normalizePattern(raw: PatternValidator, defaultMessage: string): { value: string; message: string } {
  if (typeof raw === "object") return raw;
  return { value: raw, message: defaultMessage };
}

function extractMessage(raw: boolean | { message: string } | undefined, fallback: string): string {
  if (raw && typeof raw === "object") return raw.message;
  return fallback;
}

// ─── Path-trie → nested ZodObject ────────────────────────────────────────────

type TrieNode = Map<string, TrieNode | ZodTypeAny>;

function isTrieNode(v: TrieNode | ZodTypeAny): v is TrieNode {
  return v instanceof Map;
}

function buildNestedZodObject(leaves: Map<string, ZodTypeAny>): ZodObject<Record<string, ZodTypeAny>> {
  const root: TrieNode = new Map();
  for (const [path, ztype] of leaves) {
    const segments = path.split(".");
    let cur: TrieNode = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const existing = cur.get(seg);
      if (existing && isTrieNode(existing)) {
        cur = existing;
      } else {
        const next: TrieNode = new Map();
        cur.set(seg, next);
        cur = next;
      }
    }
    cur.set(segments[segments.length - 1], ztype);
  }

  function trieToZod(trie: TrieNode): ZodObject<Record<string, ZodTypeAny>> {
    const shape: Record<string, ZodTypeAny> = {};
    for (const [key, val] of trie) {
      shape[key] = isTrieNode(val) ? trieToZod(val) : val;
    }
    return z.object(shape);
  }

  return trieToZod(root);
}

// ─── Per-field custom validate + validateAsync ───────────────────────────────

function applyCustomValidators(
  zod: ZodObject<Record<string, ZodTypeAny>>,
  fields: ReadonlyArray<FieldDefinition>,
): ZodObject<Record<string, ZodTypeAny>> {
  const withCustom = fields.filter((f) => isValueField(f) && (f.validate || f.validateAsync));
  if (withCustom.length === 0) return zod;

  return zod.superRefine(async (values, ctx) => {
    for (const f of withCustom) {
      const value = getByPath(values, f.name);
      const allValues = values as Record<string, unknown>;

      // Sync first — short-circuit on error
      if (f.validate) {
        const err = f.validate({ value, allValues });
        if (err) {
          ctx.addIssue({
            code: "custom",
            path: f.name.split("."),
            message: err,
          });
          continue;
        }
      }
      // Async runs only if sync passed
      if (f.validateAsync) {
        const err = await f.validateAsync({ value, allValues });
        if (err) {
          ctx.addIssue({
            code: "custom",
            path: f.name.split("."),
            message: err,
          });
        }
      }
    }
  }) as ZodObject<Record<string, ZodTypeAny>>;
}

// ─── requiredWhen — conditional required ─────────────────────────────────────

function applyRequiredWhen(
  zod: ZodObject<Record<string, ZodTypeAny>>,
  fields: ReadonlyArray<FieldDefinition>,
  strings: JsonFormStrings,
): ZodObject<Record<string, ZodTypeAny>> {
  const conditional = fields.filter((f) => isValueField(f) && f.requiredWhen);
  if (conditional.length === 0) return zod;

  return zod.superRefine((values, ctx) => {
    const allValues = values as Record<string, unknown>;
    for (const f of conditional) {
      const required = resolveConditionOrFn(f.requiredWhen!, allValues);
      if (!required) continue;
      const value = getByPath(values, f.name);
      const isEmpty = value === undefined || value === null || value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        const v = f.validators ?? {};
        const message = typeof v.required === "string" ? v.required : strings.errorTemplates.required;
        ctx.addIssue({
          code: "custom",
          path: f.name.split("."),
          message,
        });
      }
    }
  }) as ZodObject<Record<string, ZodTypeAny>>;
}

// ─── Merge consumer-provided ZodSchema (consumer wins per key) ───────────────

function mergeZodSchemas(
  base: ZodObject<Record<string, ZodTypeAny>>,
  override: ZodObject<Record<string, ZodTypeAny>>,
): ZodObject<Record<string, ZodTypeAny>> {
  const baseShape = base.shape;
  const overrideShape = override.shape;
  const merged: Record<string, ZodTypeAny> = { ...baseShape };
  for (const key of Object.keys(overrideShape)) {
    merged[key] = overrideShape[key];
  }
  return z.object(merged);
}
