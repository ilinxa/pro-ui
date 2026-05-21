export { RegistrationForm01 } from "./registration-form-01";

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

// Helpers exported by later commits in this chain:
// - `defaultStrengthCalculator` from `./lib/strength-calculator` (C2)
// - `OAUTH_PROVIDERS` from `./lib/oauth-providers` (C2)
// - `defaultRegistrationLabels` + `mergeRegistrationLabels` from `./parts/labels` (C4)
