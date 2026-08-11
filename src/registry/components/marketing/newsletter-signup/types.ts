import type { FormEvent, MouseEvent } from "react";

export type NewsletterSignupVariant = "inline-form" | "cta-only";

export type NewsletterSignupTone = "primary" | "accent" | "muted";

export type NewsletterSignupStatus = "idle" | "pending" | "success" | "error";

export type NewsletterSignupHeadingLevel = "h2" | "h3" | "h4";

export interface NewsletterSignupLabels {
  /** Headline. Default: 'Join our newsletter'. */
  title?: string;
  /** Body / description. Default: 'Latest updates, straight to your inbox.'. */
  body?: string;
  /**
   * Email input placeholder. Default: 'you@example.com' — a format-hint
   * showing the expected shape (per Nielsen "recognition over recall"). Pass
   * 'Email address' if you prefer a generic prompt over an example.
   */
  placeholder?: string;
  /** Email input aria-label. Default: 'Email address'. */
  emailLabel?: string;
  /** Button text. Default: 'Subscribe'. */
  button?: string;
  /** Success message after `onSubmit` resolves. Default: "Thanks! You're subscribed.". */
  successMessage?: string;
  /** Error message after `onSubmit` rejects. Default: 'Something went wrong. Please try again.'. */
  errorMessage?: string;
}

export const DEFAULT_LABELS: Required<NewsletterSignupLabels> = {
  title: "Join our newsletter",
  body: "Latest updates, straight to your inbox.",
  placeholder: "you@example.com",
  emailLabel: "Email address",
  button: "Subscribe",
  successMessage: "Thanks! You're subscribed.",
  errorMessage: "Something went wrong. Please try again.",
};

export interface NewsletterSignupProps {
  /** Visual variant. Default: 'inline-form'. */
  variant?: NewsletterSignupVariant;

  /** Color tint. Default: 'primary'. */
  tone?: NewsletterSignupTone;

  /** Heading semantic level. Default: 'h3'. */
  headingAs?: NewsletterSignupHeadingLevel;

  /** Controlled email value. */
  value?: string;
  /** Uncontrolled initial email value. */
  defaultValue?: string;
  /** Email change callback. */
  onChange?: (value: string) => void;

  /** Submit handler. Return Promise to auto-track pending → success/error. */
  onSubmit?: (email: string) => void | Promise<void>;

  /** Controlled status. If omitted, derives from `onSubmit`'s return. */
  status?: NewsletterSignupStatus;
  /** Status change callback. */
  onStatusChange?: (status: NewsletterSignupStatus) => void;

  /** Localized labels. Defaults are English. */
  labels?: NewsletterSignupLabels;

  /** Override classes for the root container. */
  className?: string;
  /** Override classes for the action button. */
  buttonClassName?: string;

  /** Override the heading id. Default: useId(). */
  id?: string;
}

/** Internal shape passed from the root to each variant part. */
export interface ResolvedPartProps {
  variant: NewsletterSignupVariant;
  tone: NewsletterSignupTone;
  headingAs: NewsletterSignupHeadingLevel;
  email: string;
  onEmailChange: (value: string) => void;
  status: NewsletterSignupStatus;
  labels: Required<NewsletterSignupLabels>;
  onSubmit: (event: FormEvent | MouseEvent) => void;
  className: string | undefined;
  buttonClassName: string | undefined;
  titleId: string;
  bodyId: string;
}
