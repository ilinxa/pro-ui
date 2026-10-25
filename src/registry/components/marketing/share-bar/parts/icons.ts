import { Copy, Mail, MessageCircle, Send, Share2 } from "lucide-react";
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
  ShareKind | "copy" | "native",
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
  native: Share2,
};

