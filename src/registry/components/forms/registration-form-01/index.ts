// Component
export { RegistrationForm01 } from "./registration-form-01";

// Public types
export type {
  RegistrationForm01Props,
  RegistrationFormStatus,
  RegistrationSubmitPayload,
  RegistrationStep1Values,
  RegistrationStep2Values,
  RegistrationLabels,
  OAuthProvider,
  OptionalFieldName,
  OptionalFieldConfig,
  StrengthCalculator,
  ButtonVariant,
} from "./types";

// Helpers
export {
  defaultRegistrationLabels,
  mergeRegistrationLabels,
} from "./parts/labels";
export { defaultStrengthCalculator } from "./lib/strength-calculator";
export { OAUTH_PROVIDERS } from "./lib/oauth-providers";
