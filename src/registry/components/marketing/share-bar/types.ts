import type { ComponentType } from "react";

export type ShareKind =
  | "twitter"
  | "facebook"
  | "linkedin"
  | "reddit"
  | "whatsapp"
  | "telegram"
  | "email"
  | "threads"
  | "bluesky";

/** Kinds that have a localizable accessible name (custom targets carry their own `ariaLabel`). */
export type ShareLabelKind = ShareKind | "copy" | "native";

export interface ShareTargetBuiltin {
  kind: ShareKind;
  icon?: ComponentType<{ className?: string }>;
  ariaLabel?: string;
  /** Render the button but make it inert. */
  disabled?: boolean;
  /** Do not render the target at all. */
  hidden?: boolean;
}

export interface ShareTargetCopy {
  kind: "copy";
  icon?: ComponentType<{ className?: string }>;
  ariaLabel?: string;
  disabled?: boolean;
  hidden?: boolean;
}

/**
 * The platform's native share sheet (`navigator.share`). Rendered only after mount and only
 * where the browser supports it (and `navigator.canShare`, when present, accepts the payload),
 * so server HTML never contains it.
 */
export interface ShareTargetNative {
  kind: "native";
  icon?: ComponentType<{ className?: string }>;
  ariaLabel?: string;
  disabled?: boolean;
  hidden?: boolean;
}

export interface ShareTargetCustom {
  kind: "custom";
  id: string;
  icon: ComponentType<{ className?: string }>;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

export type ShareTarget =
  | ShareTargetBuiltin
  | ShareTargetCopy
  | ShareTargetNative
  | ShareTargetCustom;

export interface ShareBarLabels {
  heading?: string;
  copyAria?: string;
  copySuccess?: string;
  copyError?: string;
  /**
   * Accessible name (`aria-label` and `title`) per built-in target kind, copy and native
   * included. A target's own `ariaLabel` wins. For `copy`, this wins over `copyAria` (which is
   * the copy button's default name).
   */
  targets?: Partial<Record<ShareLabelKind, string>>;
}

export interface ShareBarProps {
  targets: ReadonlyArray<ShareTarget>;
  url?: string;
  title?: string;
  text?: string;
  via?: string;
  hashtags?: ReadonlyArray<string>;
  /**
   * Fires after a target was used: the share-intent window was opened, the copy succeeded,
   * the native share sheet resolved, or a custom target's `onClick` ran. Opening a window
   * with `noopener` cannot report whether the user then completed the share.
   */
  onShare?: (targetKind: string) => void;
  onCopySuccess?: () => void;
  onCopyError?: (err: unknown) => void;
  /** A native share that failed for a reason other than the user dismissing the sheet. */
  onShareError?: (error: unknown, targetKind: string) => void;
  successResetMs?: number;
  divider?: boolean;
  headingAs?: "h2" | "h3" | "h4" | null;
  labels?: ShareBarLabels;
  className?: string;
  headerClassName?: string;
  buttonClassName?: string;
}

/**
 * `targets.copy` has no default: the copy button's default name is `copyAria`, so a 0.2.0-style
 * `{ ...defaultShareBarLabels, copyAria }` spread still names it.
 */
export type ResolvedShareBarLabels = Required<Omit<ShareBarLabels, "targets">> & {
  targets: Record<Exclude<ShareLabelKind, "copy">, string> & { copy?: string };
};

export const defaultShareBarLabels: ResolvedShareBarLabels = {
  heading: "Share",
  copyAria: "Copy link",
  copySuccess: "Link copied",
  copyError: "Couldn't copy link",
  targets: {
    twitter: "Share on X",
    facebook: "Share on Facebook",
    linkedin: "Share on LinkedIn",
    reddit: "Share on Reddit",
    whatsapp: "Share on WhatsApp",
    telegram: "Share on Telegram",
    email: "Share via email",
    threads: "Share on Threads",
    bluesky: "Share on Bluesky",
    native: "Share",
  },
};

/** @deprecated Use `defaultShareBarLabels` — the same object under its old name. */
export const SHARE_BAR_DEFAULT_LABELS: ResolvedShareBarLabels = defaultShareBarLabels;
