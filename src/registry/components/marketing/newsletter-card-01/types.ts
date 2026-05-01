import type { FormEvent, MouseEvent } from "react";

export type NewsletterCardVariant = "inline-form" | "cta-only";

export type NewsletterCardTone = "primary" | "accent" | "muted";

export type NewsletterCardStatus = "idle" | "pending" | "success" | "error";

export type NewsletterCardHeadingLevel = "h2" | "h3" | "h4";

export interface NewsletterCardLabels {
  /** Headline. Default: 'Join our newsletter'. */
  title?: string;
  /** Body / description. Default: 'Latest updates, straight to your inbox.'. */
  body?: string;
  /** Email input placeholder. Default: 'Email address'. */
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

export const DEFAULT_LABELS: Required<NewsletterCardLabels> = {
  title: "Join our newsletter",
  body: "Latest updates, straight to your inbox.",
  placeholder: "Email address",
  emailLabel: "Email address",
  button: "Subscribe",
  successMessage: "Thanks! You're subscribed.",
  errorMessage: "Something went wrong. Please try again.",
};

export interface NewsletterCardProps {
  /** Visual variant. Default: 'inline-form'. */
  variant?: NewsletterCardVariant;

  /** Color tint. Default: 'primary'. */
  tone?: NewsletterCardTone;

  /** Heading semantic level. Default: 'h3'. */
  headingAs?: NewsletterCardHeadingLevel;

  /** Controlled email value. */
  value?: string;
  /** Uncontrolled initial email value. */
  defaultValue?: string;
  /** Email change callback. */
  onChange?: (value: string) => void;

  /** Submit handler. Return Promise to auto-track pending → success/error. */
  onSubmit?: (email: string) => void | Promise<void>;

  /** Controlled status. If omitted, derives from `onSubmit`'s return. */
  status?: NewsletterCardStatus;
  /** Status change callback. */
  onStatusChange?: (status: NewsletterCardStatus) => void;

  /** Localized labels. Defaults are English. */
  labels?: NewsletterCardLabels;

  /** Override classes for the root container. */
  className?: string;
  /** Override classes for the action button. */
  buttonClassName?: string;

  /** Override the heading id. Default: useId(). */
  id?: string;
}

/** Internal shape passed from the root to each variant part. */
export interface ResolvedPartProps {
  variant: NewsletterCardVariant;
  tone: NewsletterCardTone;
  headingAs: NewsletterCardHeadingLevel;
  email: string;
  onEmailChange: (value: string) => void;
  status: NewsletterCardStatus;
  labels: Required<NewsletterCardLabels>;
  onSubmit: (event: FormEvent | MouseEvent) => void;
  className: string | undefined;
  buttonClassName: string | undefined;
  titleId: string;
  bodyId: string;
}
