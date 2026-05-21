import type { CSSProperties, ReactNode } from "react";

/**
 * Variant of the standard shadcn Button — matches `ButtonProps["variant"]`
 * without taking a runtime dep on the primitive.
 */
export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

/** Built-in OAuth providers the registration form knows about. */
export type OAuthProvider =
  | "google"
  | "github"
  | "apple"
  | "facebook"
  | "microsoft"
  | "x";

/** Optional profile fields the consumer can opt into via the `fields` prop. */
export type OptionalFieldName =
  | "firstName"
  | "lastName"
  | "displayName"
  | "phone"
  | "company";

/**
 * Lifecycle status. Internal state machine by default; mutable via the
 * controlled `status` / `onStatusChange` escape hatch.
 */
export type RegistrationFormStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error";

/**
 * Pluggable password-strength calculator. 0 = empty / unrated. 1–4 =
 * weak / fair / strong / excellent.
 *
 * v0.1 default is the built-in `(length, character-class-count)` heuristic
 * in `lib/strength-calculator.ts`. Consumers with corporate password
 * policies or who want to drop in zxcvbn replace this slot; v0.2 may ship
 * an opt-in zxcvbn adapter that satisfies the same shape.
 */
export type StrengthCalculator = (password: string) => 0 | 1 | 2 | 3 | 4;

/**
 * Field-config entry. `true` = show + optional. `{ required: true }` =
 * show + required. `false` (or omitted key) = hidden.
 */
export type OptionalFieldConfig = boolean | { required: boolean };

// ─── Values ──────────────────────────────────────────────────────────────────

/**
 * Step-1 values. Email + (optional, magic-link drops it) password + consent
 * + honeypot. Always present at the bottom of the values stack regardless
 * of flow.
 *
 * **`password` is statically typed as optional** because the magic-link
 * strategy drops the field entirely. The Zod resolver enforces required
 * at runtime under `passwordStrategy: "password"`; the static type stays
 * permissive to keep one shape across both strategies.
 */
export interface RegistrationStep1Values {
  email: string;
  password?: string;
  consentAccepted: boolean;
  /**
   * Honeypot field value. **Should always be `""`.** A non-empty value
   * means a spam bot filled the off-screen `<input name="website">` —
   * the discriminated payload flag `isHoneypotTripped` reflects this.
   */
  _honeypot: string;
}

/** Step-2 values: step-1 plus the optional profile bag. */
export interface RegistrationStep2Values extends RegistrationStep1Values {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  company?: string;
}

/**
 * Discriminated submit-payload envelope.
 *
 * Consumers MUST switch on `stepCompleted` to know whether the optional
 * profile fields are populated. Narrowing optional fields as
 * `string | undefined` was rejected because it silently lets naïve
 * destructuring (`const { firstName, lastName } = payload.values`) send
 * `undefined` values to backend APIs. The envelope forces the discriminant.
 *
 * - `"single"` — `flow: "single-step"`.
 * - `"step1"` — `flow: "two-step"` + user clicked "Skip for now".
 * - `"step2"` — `flow: "two-step"` + user completed step 2.
 */
export type RegistrationSubmitPayload =
  | {
      stepCompleted: "single";
      values: RegistrationStep2Values;
      isHoneypotTripped: boolean;
    }
  | {
      stepCompleted: "step1";
      values: RegistrationStep1Values;
      isHoneypotTripped: boolean;
    }
  | {
      stepCompleted: "step2";
      values: RegistrationStep2Values;
      isHoneypotTripped: boolean;
    };

// ─── Labels (i18n bag) ───────────────────────────────────────────────────────

export interface RegistrationLabels {
  // Field labels + placeholders
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  firstNameLabel: string;
  firstNamePlaceholder: string;
  lastNameLabel: string;
  lastNamePlaceholder: string;
  displayNameLabel: string;
  displayNamePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  companyLabel: string;
  companyPlaceholder: string;

  // Buttons
  createAccountLabel: string;
  continueLabel: string;
  backLabel: string;
  skipForNowLabel: string;
  signInLabel: string;

  // OAuth
  orContinueWith: string;
  /** Template — `{provider}` interpolated with capitalized provider name. */
  oauthLabelTemplate: string;

  // Step indicator
  /** Template — `{current}` and `{total}` interpolated. */
  stepOf: string;

  // Error messages
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  /** Template — `{min}` interpolated with the minLength policy value. */
  passwordTooShort: string;
  passwordMissingUppercase: string;
  passwordMissingNumber: string;
  passwordMissingSymbol: string;
  consentRequired: string;

  // Strength meter
  strengthWeak: string;
  strengthFair: string;
  strengthStrong: string;
  strengthExcellent: string;
  /** Template — `{level}` interpolated with the bucketed strength label. */
  strengthLabel: string;

  // Server-error fallback
  serverError: string;

  // Success
  successDefaultMessage: string;

  // sr-only accessibility hints
  passwordToggleShow: string;
  passwordToggleHide: string;
  honeypotLabel: string;
}

// ─── Component props ─────────────────────────────────────────────────────────

export interface RegistrationForm01Props {
  /** Heading rendered above the form. Optional — consumer may render their own. */
  heading?: string;
  /** Subheading below the heading. */
  subheading?: string;
  /** Semantic level for the heading. Defaults to `h2`. */
  headingAs?: "h1" | "h2" | "h3";

  /** Flow shape. Default `"single-step"`. */
  flow?: "single-step" | "two-step";
  /** Password vs magic-link strategy. Default `"password"`. */
  passwordStrategy?: "password" | "magic-link";
  /** Vertical-rhythm density. Default `"default"`. */
  density?: "compact" | "default";
  /**
   * Controls whether step 2 of the two-step flow renders a "Skip for now"
   * button. Default `true`. Ignored when `flow === "single-step"`.
   */
  skippableStepTwo?: boolean;

  /**
   * Optional-fields bag. Each key:
   * - `true` → show + optional
   * - `false` (or omitted key) → hidden
   * - `{ required: true }` → show + required
   */
  fields?: Partial<Record<OptionalFieldName, OptionalFieldConfig>>;

  /**
   * Password validators + strength-meter toggle. Ignored under
   * `passwordStrategy: "magic-link"`.
   */
  passwordPolicy?: {
    /** Default 8. */
    minLength?: number;
    requireUppercase?: boolean;
    requireNumber?: boolean;
    requireSymbol?: boolean;
    /** Default `true`. */
    showStrengthMeter?: boolean;
  };

  /**
   * BYO strength heuristic — v0.1 contract for the v0.2 zxcvbn opt-in.
   * Default is the built-in `(length, character-class-count)` scorer in
   * `lib/strength-calculator.ts`.
   */
  strengthCalculator?: StrengthCalculator;

  /**
   * ToS consent gate. `required: true` blocks submit until checked.
   * `label` accepts a `ReactNode` for inline `<Link>` composition;
   * the `string + href?` convenience overload renders a plain anchor.
   */
  consent: {
    required: boolean;
    label: ReactNode | string;
    /** Only used when `label` is a string. */
    href?: string;
  };

  /**
   * Render OAuth buttons above the email field. Empty array (or omitted)
   * renders no OAuth row and no divider.
   */
  oauthProviders?: ReadonlyArray<OAuthProvider>;
  /** Per-provider icon override slot. Default: text-only buttons. */
  oauthIcons?: Partial<Record<OAuthProvider, ReactNode>>;
  /**
   * Fires on OAuth button click. The component does NOT handle the
   * redirect / SDK call — consumer drives the actual OAuth handshake.
   */
  onOAuthClick?: (args: { provider: OAuthProvider }) => void;

  /**
   * Submit button label + variant override. Defaults:
   * `{ label: "Create account", variant: "default" }`. On step 1 of the
   * two-step flow, label auto-overrides to `"Continue"`.
   */
  submitButton?: { label?: string; variant?: ButtonVariant };

  /**
   * Renders "Already have an account? Sign in" link below the form when
   * provided. Omit to hide the link.
   */
  signInHref?: string;

  /**
   * Controlled server-error message. When set, renders a `role="alert"`
   * banner above the form. Takes display precedence over the internal
   * `error` status fallback.
   */
  errorMessage?: string;
  /**
   * Success-screen content. Renders on `onSubmit` resolving without
   * throwing (default), or on `status === "success"` (controlled).
   */
  successMessage?: ReactNode | string;

  /**
   * Controlled status escape hatch. **Mutual exclusion:** if provided,
   * internal state becomes read-only — the component reads `status` as
   * source of truth and fires `onStatusChange` for observers only. If
   * omitted, internal state owns transitions and `onStatusChange` fires
   * on each one. Mixing the two (passing `status` AND expecting internal
   * transitions) is a contract violation.
   */
  status?: RegistrationFormStatus;
  /** Fires on every status transition (internal or controlled-mode echo). */
  onStatusChange?: (status: RegistrationFormStatus) => void;

  /** Submit handler — receives the discriminated envelope. */
  onSubmit: (payload: RegistrationSubmitPayload) => void | Promise<void>;

  /** Per-string overrides. Falls back to `defaultRegistrationLabels`. */
  labels?: Partial<RegistrationLabels>;

  /** Container className — applied to the outermost wrapper. */
  className?: string;
  /** Container style — applied to the outermost wrapper. */
  style?: CSSProperties;
}
