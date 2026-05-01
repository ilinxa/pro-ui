import type { ShareKind } from "../types";

export interface ShareUrlContext {
  url: string;
  title?: string;
  text?: string;
  via?: string;
  hashtags?: ReadonlyArray<string>;
}

type Builder = (ctx: ShareUrlContext) => string;

const enc = encodeURIComponent;

export const SHARE_TEMPLATES: Record<ShareKind, Builder> = {
  twitter: ({ url, title, via, hashtags }) => {
    const params = new URLSearchParams({ url });
    if (title) params.set("text", title);
    if (via) params.set("via", via);
    if (hashtags && hashtags.length > 0) {
      params.set("hashtags", hashtags.join(","));
    }
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  },
  facebook: ({ url }) =>
    `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  linkedin: ({ url }) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
  reddit: ({ url, title }) => {
    const params = new URLSearchParams({ url });
    if (title) params.set("title", title);
    return `https://reddit.com/submit?${params.toString()}`;
  },
  whatsapp: ({ url, title }) => {
    const text = [title, url].filter(Boolean).join(" ");
    return `https://wa.me/?text=${enc(text)}`;
  },
  telegram: ({ url, title }) => {
    const params = new URLSearchParams({ url });
    if (title) params.set("text", title);
    return `https://t.me/share/url?${params.toString()}`;
  },
  email: ({ url, title, text }) => {
    const params = new URLSearchParams();
    if (title) params.set("subject", title);
    params.set("body", [text, url].filter(Boolean).join("\n\n"));
    return `mailto:?${params.toString()}`;
  },
  threads: ({ url, title }) => {
    const text = [title, url].filter(Boolean).join(" ");
    return `https://www.threads.net/intent/post?text=${enc(text)}`;
  },
  bluesky: ({ url, title }) => {
    const text = [title, url].filter(Boolean).join(" ");
    return `https://bsky.app/intent/compose?text=${enc(text)}`;
  },
};
