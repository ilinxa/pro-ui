// Component
export { SignupForm } from "./signup-form";

// Public types
export type {
  SignupFormProps,
  SignupFormStatus,
  SignupSubmitPayload,
  SignupStep1Values,
  SignupStep2Values,
  SignupLabels,
  OAuthProvider,
  OptionalFieldName,
  OptionalFieldConfig,
  StrengthCalculator,
  ButtonVariant,
} from "./types";

// Helpers
export {
  defaultSignupLabels,
  mergeSignupLabels,
} from "./parts/labels";
export { defaultStrengthCalculator } from "./lib/strength-calculator";
export { OAUTH_PROVIDERS } from "./lib/oauth-providers";
