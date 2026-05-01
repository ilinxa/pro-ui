import type { ShareTarget } from "./types";

export const SHARE_BAR_01_DUMMY_DEFAULT: ReadonlyArray<ShareTarget> = [
  { kind: "twitter" },
  { kind: "facebook" },
  { kind: "linkedin" },
  { kind: "copy" },
];

export const SHARE_BAR_01_DUMMY_FULL: ReadonlyArray<ShareTarget> = [
  { kind: "twitter" },
  { kind: "facebook" },
  { kind: "linkedin" },
  { kind: "reddit" },
  { kind: "whatsapp" },
  { kind: "telegram" },
  { kind: "threads" },
  { kind: "bluesky" },
  { kind: "email" },
  { kind: "copy" },
];

export const SHARE_BAR_01_DUMMY_COMPACT: ReadonlyArray<ShareTarget> = [
  { kind: "twitter" },
  { kind: "copy" },
];

export const SHARE_BAR_01_DUMMY_TR: ReadonlyArray<ShareTarget> = [
  { kind: "twitter" },
  { kind: "facebook" },
  { kind: "copy" },
];

export const SHARE_BAR_01_DUMMY_URL =
  "https://ilinxa-proui.vercel.app/components/share-bar-01";
export const SHARE_BAR_01_DUMMY_TITLE =
  "ShareBar01 — pro-ui share strip with 9 built-in platforms";
