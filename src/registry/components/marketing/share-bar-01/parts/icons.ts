import { Copy, Mail, MessageCircle, Send } from "lucide-react";
import type { ComponentType } from "react";
import {
  Bluesky,
  Facebook,
  LinkedIn,
  Reddit,
  Threads,
  TwitterX,
} from "./brand-icons";
import type { ShareKind } from "../types";

export const DEFAULT_ICONS: Record<
  ShareKind | "copy",
  ComponentType<{ className?: string }>
> = {
  twitter: TwitterX,
  facebook: Facebook,
  linkedin: LinkedIn,
  reddit: Reddit,
  whatsapp: MessageCircle,
  telegram: Send,
  email: Mail,
  threads: Threads,
  bluesky: Bluesky,
  copy: Copy,
};

export const DEFAULT_ARIA: Record<ShareKind | "copy", string> = {
  twitter: "Share on X",
  facebook: "Share on Facebook",
  linkedin: "Share on LinkedIn",
  reddit: "Share on Reddit",
  whatsapp: "Share on WhatsApp",
  telegram: "Share on Telegram",
  email: "Share via email",
  threads: "Share on Threads",
  bluesky: "Share on Bluesky",
  copy: "Copy link",
};
