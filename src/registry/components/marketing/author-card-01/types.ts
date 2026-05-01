import type { ComponentType, ElementType } from "react";

export type AuthorCardTone = "primary" | "accent" | "muted";

export interface AuthorCard01Labels {
  heading?: string;
}

export interface AuthorCard01Props {
  name: string;
  role: string;
  bio?: string;
  imageSrc?: string;
  imageAlt?: string;
  fallbackIcon?: ComponentType<{ className?: string }>;
  href?: string;
  linkComponent?: ElementType;
  tone?: AuthorCardTone;
  headingAs?: "h2" | "h3" | "h4";
  labels?: AuthorCard01Labels;
  className?: string;
  headingClassName?: string;
  nameClassName?: string;
  bioClassName?: string;
}

export const AUTHOR_CARD_DEFAULT_LABELS: Required<AuthorCard01Labels> = {
  heading: "About the author",
};
