# share-bar-01 — procomp plan

> Stage 2: how. Implementation blueprint for [`share-bar-01-procomp-description.md`](./share-bar-01-procomp-description.md).

## File map

```
src/registry/components/marketing/share-bar-01/
├── share-bar-01.tsx            # root, "use client", memoized, owns copy state
├── parts/
│   ├── share-button.tsx        # single icon-only button, kind-dispatched
│   ├── templates.ts            # pure share-intent URL builders
│   └── icons.ts                # default Lucide icon map per kind
├── types.ts                    # ShareTarget discriminated union + props
├── dummy-data.ts               # 3 sample target sets
├── demo.tsx                    # 5 sub-tabs
├── usage.tsx
├── meta.ts
└── index.ts
```

10 files (matches the migration analysis estimate).

## Public types

```ts
import type { ComponentType, ReactNode } from "react";

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
  href?: string;
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
  successResetMs?: number;                            // default 2000
  divider?: boolean;                                  // default false
  headingAs?: "h2" | "h3" | "h4" | null;              // default null
  labels?: ShareBar01Labels;
  className?: string;
  headerClassName?: string;
  buttonClassName?: string;
}

export const SHARE_BAR_DEFAULT_LABELS: Required<ShareBar01Labels>;
```

## Templates module (pure)

```ts
// parts/templates.ts
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
    if (hashtags?.length) params.set("hashtags", hashtags.join(","));
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  },
  facebook: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  linkedin: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
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
```

Pure module, no React deps. Testable independently.

## Default icon map

```ts
// parts/icons.ts
import {
  Copy,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,        // WhatsApp
  Send,                 // Telegram
  Share2,
  Twitter,
} from "lucide-react";
import type { ComponentType } from "react";
import type { ShareKind } from "../types";

// Threads & Bluesky lack first-party Lucide icons; fall back to Share2.
export const DEFAULT_ICONS: Record<ShareKind | "copy", ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  reddit: Share2,
  whatsapp: MessageCircle,
  telegram: Send,
  email: Mail,
  threads: Share2,
  bluesky: Share2,
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
```

## Copy clipboard helper (pure)

```ts
// parts/clipboard.ts (or inline in share-bar-01.tsx — small enough)
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older / insecure contexts
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) {
      throw new Error("execCommand copy returned false");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
```

## Share-button part

```tsx
// parts/share-button.tsx
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_ARIA, DEFAULT_ICONS } from "./icons";
import type { ShareTarget } from "../types";

type ButtonState = "idle" | "success" | "error";

interface ShareButtonProps {
  target: ShareTarget;
  state: ButtonState;
  onClick: () => void;
  buttonClassName?: string;
}

export function ShareButton({ target, state, onClick, buttonClassName }: ShareButtonProps) {
  const isCopy = target.kind === "copy";
  const isCustom = target.kind === "custom";

  const Icon =
    isCopy && state === "success" ? Check
    : isCopy && state === "error" ? X
    : target.icon ?? (isCustom ? null : DEFAULT_ICONS[target.kind]);

  const ariaLabel =
    target.ariaLabel ??
    (isCustom
      ? undefined            // custom requires ariaLabel — type-enforced
      : DEFAULT_ARIA[target.kind]);

  return (
    <li>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "rounded-full",
          isCopy && state === "success" && "text-primary",
          isCopy && state === "error" && "text-destructive",
          buttonClassName
        )}
        title={ariaLabel}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {Icon ? <Icon className="w-4 h-4" /> : null}
      </Button>
    </li>
  );
}
```

**Decisions:**

- `<Button>` from shadcn — outline + icon size + `rounded-full` for the round chrome.
- Icon switches based on copy state: idle → kind icon, success → `Check`, error → `X`.
- `title` + `aria-label` both set — visual tooltip for sighted hover users + a11y label for SR.
- `text-primary` for success (signal-lime), `text-destructive` for error.

## Root component

```tsx
"use client";

// share-bar-01.tsx
import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ShareButton } from "./parts/share-button";
import { SHARE_TEMPLATES } from "./parts/templates";
import {
  SHARE_BAR_DEFAULT_LABELS,
  type ShareBar01Props,
  type ShareTarget,
} from "./types";

type CopyState = "idle" | "success" | "error";

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) {
      throw new Error("execCommand copy returned false");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

function ShareBar01Inner(props: ShareBar01Props) {
  const {
    targets,
    url,
    title,
    text,
    via,
    hashtags,
    onShare,
    onCopySuccess,
    onCopyError,
    successResetMs = 2000,
    divider = false,
    headingAs,
    labels,
    className,
    headerClassName,
    buttonClassName,
  } = props;

  const HeadingTag = headingAs;
  const resolvedLabels = { ...SHARE_BAR_DEFAULT_LABELS, ...labels };
  const headingId = useId();
  const announceId = useId();

  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    },
    []
  );

  const scheduleReset = useCallback(
    (ms: number) => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopyState("idle"), ms);
    },
    []
  );

  const resolveUrl = useCallback(() => url ?? window.location.href, [url]);

  const handleClick = useCallback(
    (target: ShareTarget) => async () => {
      if (target.kind === "copy") {
        try {
          await copyToClipboard(resolveUrl());
          setCopyState("success");
          onCopySuccess?.();
          onShare?.("copy");
          scheduleReset(successResetMs);
        } catch (err) {
          setCopyState("error");
          onCopyError?.(err);
          scheduleReset(successResetMs);
        }
        return;
      }

      if (target.kind === "custom") {
        target.onClick();
        onShare?.(target.id);
        return;
      }

      // built-in share intent
      const shareUrl = SHARE_TEMPLATES[target.kind]({
        url: resolveUrl(),
        title,
        text,
        via,
        hashtags,
      });
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      onShare?.(target.kind);
    },
    [
      resolveUrl,
      title,
      text,
      via,
      hashtags,
      onShare,
      onCopySuccess,
      onCopyError,
      successResetMs,
      scheduleReset,
    ]
  );

  return (
    <div
      className={cn(divider && "pt-8 border-t border-border", className)}
      aria-labelledby={HeadingTag ? headingId : undefined}
    >
      {HeadingTag ? (
        <HeadingTag
          id={headingId}
          className={cn(
            "text-sm font-semibold text-muted-foreground mb-3",
            headerClassName
          )}
        >
          {resolvedLabels.heading}
        </HeadingTag>
      ) : null}

      <ul role="list" className="flex flex-wrap items-center gap-2">
        {targets.map((target) => {
          const key = target.kind === "custom" ? target.id : target.kind;
          return (
            <ShareButton
              key={key}
              target={target}
              state={target.kind === "copy" ? copyState : "idle"}
              onClick={handleClick(target)}
              buttonClassName={buttonClassName}
            />
          );
        })}
      </ul>

      <span id={announceId} className="sr-only" aria-live="polite" role="status">
        {copyState === "success" ? resolvedLabels.copySuccess : ""}
      </span>
      <span className="sr-only" role="alert">
        {copyState === "error" ? resolvedLabels.copyError : ""}
      </span>
    </div>
  );
}

export const ShareBar01 = memo(ShareBar01Inner);
ShareBar01.displayName = "ShareBar01";
```

**Decisions:**

- `"use client"` directive — uses `useState`, `useEffect`, `navigator.clipboard`. Required.
- Click handler factory pattern (`handleClick(target) => () => {...}`) — clean per-target binding without inline closures during render. The factory itself is memoized via `useCallback`.
- Two `aria-live` spans (polite for success, alert for error) — separate elements so they don't fight each other in the SR announcement queue.
- Cleanup of `resetTimer` on unmount — prevents `setState after unmount` warning.
- `useId` for heading id + announcement id — stable across renders, unique across multiple instances on a page.
- `window.open(_, "_blank", "noopener,noreferrer")` — secure external link with feature flags.
- `key` for custom targets uses `target.id`; built-ins use `target.kind` (each kind appears at most once in any sane targets array).

## Demo (5 sub-tabs)

1. **Default** — 4-target row (Twitter / Facebook / LinkedIn / Copy) on a sample article URL.
2. **Full social set** — all 9 platforms + copy + analytics callback (`onShare` logs to demo state).
3. **Custom target** — Twitter + LinkedIn + a custom "Send to teammate" button (`Send` icon, `onClick` shows a toast).
4. **Compact** — Twitter + Copy only.
5. **Localized** — Turkish labels + 3-target subset.

Built on shadcn primitives `Button` + `Tabs`.

## Dummy data

```ts
// dummy-data.ts
import { Send } from "lucide-react";
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
```

The custom-target demo composes inline (icon + onClick) since it needs handler refs from the demo component.

## Verification (end-of-implementation gate)

1. `pnpm tsc --noEmit` clean
2. `pnpm lint` clean (1 pre-existing rich-card warning OK)
3. `pnpm build` clean — `/components/share-bar-01` prerendered
4. SSR smoke — `HTTP 200`, all 5 demo tab triggers present, default tab content rendered
5. Manifest entry present, `/components` index lists the new entry
6. Registry artifacts at `public/r/share-bar-01.json` + `public/r/share-bar-01-fixtures.json`

## Risks / known unknowns

1. **`document.execCommand("copy")` is deprecated** — but it's still the only fallback for insecure contexts and older browsers. Browsers haven't actually removed it. Documented in guide.
2. **`window.open` popup blockers** — modern browsers block `window.open` not invoked by direct user interaction. Our `handleClick` is invoked from a click handler so this should be fine; flagged in case async work later separates the click from the open.
3. **Async `copyToClipboard` + state update timing** — the success state is set after the await. If the component unmounts during the clipboard write (rare but possible if the parent re-renders and removes us), we'd `setState` on an unmounted component. React warns but doesn't crash; minor. Acceptable risk.
4. **URL templates may drift over time** — Twitter became X but kept `twitter.com/intent/tweet` working in 2026. If a platform changes its share-intent URL format, we update `templates.ts`. Documented in guide.
5. **Threads + Bluesky icons** — Lucide doesn't ship first-party `Threads` / `Bluesky` icons as of May 2026. Falling back to `Share2`. Consumers can override via `target.icon`. Flagged in guide.
6. **Custom-target `onClick` contract** — runs at click time on the client. Not invoked during SSR. Documented.

## Bundle envelope

Component code only:
- `share-bar-01.tsx` ~140 LOC
- `parts/share-button.tsx` ~40 LOC
- `parts/templates.ts` ~50 LOC
- `parts/icons.ts` ~30 LOC
- `types.ts` ~50 LOC
- Total: ~310 LOC TSX/TS

Estimated minified: ~4.5KB. Under the ≤ 5KB envelope.

## Out of plan (deferred to v0.2 if needed)

- `useNativeShare?: boolean` — replaces button row with single Share button calling `navigator.share()`
- Sticky-rail variant
- Per-target `successResetMs` override
- Share-count display (would require API integration)
- Internationalized URL templates (e.g. `lang=tr` query)
- shadcn Tooltip integration (for richer tooltips than native `title`)
