import type { RegistrationLabels } from "../types";

/**
 * Default English labels for `<RegistrationForm01>`. Consumers override
 * any subset via the `labels?: Partial<RegistrationLabels>` prop;
 * `mergeRegistrationLabels` shallow-merges the override over these
 * defaults at the top of the component.
 *
 * The shape mirrors json-form's `defaultJsonFormStrings` + `mergeJsonFormStrings`
 * pattern.
 */
export const defaultRegistrationLabels: RegistrationLabels = {
  // Field labels
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  passwordLabel: "Password",
  passwordPlaceholder: "At least 8 characters",
  firstNameLabel: "First name",
  firstNamePlaceholder: "",
  lastNameLabel: "Last name",
  lastNamePlaceholder: "",
  displayNameLabel: "Display name",
  displayNamePlaceholder: "",
  phoneLabel: "Phone",
  phonePlaceholder: "",
  companyLabel: "Company",
  companyPlaceholder: "",

  // Buttons
  createAccountLabel: "Create account",
  continueLabel: "Continue",
  backLabel: "Back",
  skipForNowLabel: "Skip for now",
  signInLabel: "Already have an account? Sign in",

  // OAuth
  orContinueWith: "or",
  oauthLabelTemplate: "Continue with {provider}",

  // Step indicator
  stepOf: "Step {current} of {total}",

  // Error messages
  emailRequired: "Email is required",
  emailInvalid: "Enter a valid email",
  passwordRequired: "Password is required",
  passwordTooShort: "Password must be at least {min} characters",
  passwordMissingUppercase: "Password must contain an uppercase letter",
  passwordMissingNumber: "Password must contain a number",
  passwordMissingSymbol: "Password must contain a symbol",
  consentRequired: "You must accept the terms to continue",

  // Strength meter
  strengthWeak: "weak",
  strengthFair: "fair",
  strengthStrong: "strong",
  strengthExcellent: "excellent",
  strengthLabel: "Strength: {level}",

  // Server-error fallback
  serverError: "Something went wrong. Please try again.",

  // Success
  successDefaultMessage:
    "You're in. Check your inbox to verify your email.",

  // sr-only accessibility hints
  passwordToggleShow: "Show password",
  passwordToggleHide: "Hide password",
  honeypotLabel: "Leave this field empty",
};

/**
 * Shallow-merge consumer overrides over the English defaults. Returns
 * the full, populated `RegistrationLabels` object so downstream parts
 * can read by key without optional-chaining.
 */
export function mergeRegistrationLabels(
  override?: Partial<RegistrationLabels>,
): RegistrationLabels {
  if (!override) return defaultRegistrationLabels;
  return { ...defaultRegistrationLabels, ...override };
}
