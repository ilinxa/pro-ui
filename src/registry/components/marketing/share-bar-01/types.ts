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

export interface ShareTargetBuiltin {
  kind: ShareKind;
  icon?: ComponentType<{ className?: string }>;
  ariaLabel?: string;
}

export interface ShareTargetCopy {
  kind: "copy";
  icon?: ComponentType<{ className?: string }>;
  ariaLabel?: string;
}

export interface ShareTargetCustom {
  kind: "custom";
  id: string;
  icon: ComponentType<{ className?: string }>;
  ariaLabel: string;
  onClick: () => void;
}

export type ShareTarget = ShareTargetBuiltin | ShareTargetCopy | ShareTargetCustom;

export interface ShareBar01Labels {
  heading?: string;
  copyAria?: string;
  copySuccess?: string;
  copyError?: string;
}

export interface ShareBar01Props {
  targets: ReadonlyArray<ShareTarget>;
  url?: string;
  title?: string;
  text?: string;
  via?: string;
  hashtags?: ReadonlyArray<string>;
  onShare?: (targetKind: string) => void;
  onCopySuccess?: () => void;
  onCopyError?: (err: unknown) => void;
  successResetMs?: number;
  divider?: boolean;
  headingAs?: "h2" | "h3" | "h4" | null;
  labels?: ShareBar01Labels;
  className?: string;
  headerClassName?: string;
  buttonClassName?: string;
}

export const SHARE_BAR_DEFAULT_LABELS: Required<ShareBar01Labels> = {
  heading: "Share",
  copyAria: "Copy link",
  copySuccess: "Link copied",
  copyError: "Couldn't copy link",
};
