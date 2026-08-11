import type { OAuthProvider } from "../types";

/**
 * Built-in OAuth provider list — the runtime equivalent of the
 * `OAuthProvider` type literal union. Used to validate / iterate
 * consumer-provided `oauthProviders` arrays.
 */
export const OAUTH_PROVIDERS: ReadonlyArray<OAuthProvider> = [
  "google",
  "github",
  "apple",
  "facebook",
  "microsoft",
  "x",
];

/**
 * Per-provider display name. Used by `getOAuthProviderLabel` to
 * interpolate into `labels.oauthLabelTemplate`. Apple's brand guidelines
 * require "Sign in with Apple" specifically — but this component is
 * neutral on the verb (`Continue with` / `Sign up with`), so we surface
 * the capitalized provider name and let `oauthLabelTemplate` carry the
 * verb.
 */
const PROVIDER_DISPLAY_NAMES: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
  apple: "Apple",
  facebook: "Facebook",
  microsoft: "Microsoft",
  x: "X",
};

/**
 * Interpolate the provider name into the consumer-overridable template
 * (`labels.oauthLabelTemplate`). Default template is
 * `"Continue with {provider}"` — yields `"Continue with Google"`.
 */
export function getOAuthProviderLabel(
  provider: OAuthProvider,
  template: string,
): string {
  return template.replace("{provider}", PROVIDER_DISPLAY_NAMES[provider]);
}
