import type { ComponentType, ElementType } from "react";

export type AuthorCardTone = "primary" | "accent" | "muted";

export interface AuthorCardLabels {
  heading?: string;
}

export interface AuthorCardProps {
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
  labels?: AuthorCardLabels;
  className?: string;
  headingClassName?: string;
  nameClassName?: string;
  bioClassName?: string;
}

export const AUTHOR_CARD_DEFAULT_LABELS: Required<AuthorCardLabels> = {
  heading: "About the author",
};
