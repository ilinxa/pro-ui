import { z, type ZodTypeAny } from "zod";
import type {
  OptionalFieldConfig,
  OptionalFieldName,
  RegistrationLabels,
} from "../types";

const OPTIONAL_FIELDS: ReadonlyArray<OptionalFieldName> = [
  "firstName",
  "lastName",
  "displayName",
  "phone",
  "company",
];

/**
 * Subset of `RegistrationLabels` carrying the error-message templates the
 * Zod schema bakes in. The hook passes the full merged labels bag; we
 * narrow here to make the function pure-ish.
 */
export type SchemaLabels = Pick<
  RegistrationLabels,
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordTooShort"
  | "passwordMissingUppercase"
  | "passwordMissingNumber"
  | "passwordMissingSymbol"
  | "consentRequired"
>;

export interface BuildSchemaArgs {
  passwordStrategy: "password" | "magic-link";
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumber: boolean;
    requireSymbol: boolean;
  };
  fields: Partial<Record<OptionalFieldName, OptionalFieldConfig>>;
  consent: { required: boolean };
  labels: SchemaLabels;
}

/**
 * Build the Zod schema for the whole form (step 1 + step 2 fields).
 *
 * The schema is **single** — step-1 vs step-2 partial validation is
 * driven by `form.trigger(name[])` at the call site in the hook (NOT by
 * swapping schemas). Step-2-only fields are always optional at the type
 * level so the "Skip for now" path can submit with step-1 values alone
 * without tripping a "required" error on the skipped step-2 fields.
 *
 * Field-by-field rules:
 * - `email`: required, valid email format (Zod's `email()` check).
 * - `password`: optional under `magic-link`; under `password`, required
 *   + `minLength` + each policy class check.
 * - `consentAccepted`: required `true` when `consent.required`; otherwise
 *   just `boolean` (no validation).
 * - `_honeypot`: passthrough string. **Never validated** — the honeypot
 *   "trip" semantics live in `isHoneypotTripped()` at the submit handler,
 *   not in the schema. Validating it here would block submission on a
 *   bot fill, which is the WRONG behavior (we want the bot to think it
 *   succeeded).
 * - Optional fields (`firstName` etc.): present in the schema with
 *   `.optional()` if the consumer opted them in via `fields`. If
 *   `{ required: true }` on the optional-field config AND the user
 *   completes step 2, the field is required. The "Skip for now" path
 *   bypasses step-2 validation entirely (see hook).
 */
export function buildSchema(args: BuildSchemaArgs) {
  const { passwordStrategy, passwordPolicy, fields, consent, labels } = args;

  const emailSchema = z
    .string({ message: labels.emailRequired })
    .min(1, labels.emailRequired)
    .email(labels.emailInvalid);

  let passwordSchema: ZodTypeAny;
  if (passwordStrategy === "magic-link") {
    // Field absent at runtime under magic-link. We still register a
    // schema slot for shape stability (`.optional()`) so partial values
    // shapes line up between the two strategies.
    passwordSchema = z.string().optional();
  } else {
    let chain = z
      .string({ message: labels.passwordRequired })
      .min(
        passwordPolicy.minLength,
        labels.passwordTooShort.replace(
          "{min}",
          String(passwordPolicy.minLength),
        ),
      );
    if (passwordPolicy.requireUppercase) {
      chain = chain.refine((s) => /[A-Z]/.test(s), {
        message: labels.passwordMissingUppercase,
      });
    }
    if (passwordPolicy.requireNumber) {
      chain = chain.refine((s) => /[0-9]/.test(s), {
        message: labels.passwordMissingNumber,
      });
    }
    if (passwordPolicy.requireSymbol) {
      chain = chain.refine((s) => /[^A-Za-z0-9]/.test(s), {
        message: labels.passwordMissingSymbol,
      });
    }
    passwordSchema = chain;
  }

  const consentSchema = consent.required
    ? z.literal(true, {
        message: labels.consentRequired,
      })
    : z.boolean();

  const shape: Record<string, ZodTypeAny> = {
    email: emailSchema,
    password: passwordSchema,
    consentAccepted: consentSchema,
    _honeypot: z.string(),
  };

  for (const name of OPTIONAL_FIELDS) {
    const config = fields[name];
    if (config === undefined || config === false) continue;
    const required = config === true ? false : config.required;
    shape[name] = required ? z.string().min(1) : z.string().optional();
  }

  return z.object(shape);
}
