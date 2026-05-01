# author-card-01 — procomp plan

> Stage 2: how. Implementation blueprint for [`author-card-01-procomp-description.md`](./author-card-01-procomp-description.md).

## File map

```
src/registry/components/marketing/author-card-01/
├── author-card-01.tsx          # root component, memoized default export
├── parts/
│   ├── avatar.tsx              # image-or-icon-fallback circle
│   └── tone-resolver.ts        # pure mapping: tone → CSS classes
├── types.ts                    # public props, AuthorCardTone, defaults
├── dummy-data.ts               # 3 sample authors (image / no-image / custom-icon)
├── demo.tsx                    # 5 sub-tabs
├── usage.tsx                   # consumer-facing examples
├── meta.ts                     # ComponentMeta stub
└── index.ts                    # barrel
```

8 files (matches the migration analysis estimate of ~7 ± 1).

## Public types

```ts
import type { ComponentType, ElementType, ReactNode } from "react";

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

export const AUTHOR_CARD_DEFAULT_LABELS: Required<AuthorCard01Labels>;
```

## Tone resolver

```ts
// parts/tone-resolver.ts
export interface ToneClasses {
  avatarBg: string;
  avatarIcon: string;
}

const TONE_MAP: Record<AuthorCardTone, ToneClasses> = {
  primary: { avatarBg: "bg-primary/10", avatarIcon: "text-primary" },
  accent:  { avatarBg: "bg-accent",     avatarIcon: "text-accent-foreground" },
  muted:   { avatarBg: "bg-muted",      avatarIcon: "text-muted-foreground" },
};

export function resolveTone(tone: AuthorCardTone): ToneClasses {
  return TONE_MAP[tone];
}
```

Pure, no React. Mirrors `newsletter-card-01/parts/tone-resolver.ts` shape (different output class set).

## Avatar part

```tsx
// parts/avatar.tsx
import { User } from "lucide-react";

interface AuthorAvatarProps {
  imageSrc?: string;
  imageAlt: string;                // resolved at root (alt OR name fallback)
  fallbackIcon: ComponentType<{ className?: string }>;
  toneClasses: ToneClasses;
}

export function AuthorAvatar({ imageSrc, imageAlt, fallbackIcon: Icon, toneClasses }: AuthorAvatarProps) {
  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element — registry forbids next/*
      <img
        src={imageSrc}
        alt={imageAlt}
        loading="lazy"
        className="w-16 h-16 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center shrink-0",
        toneClasses.avatarBg
      )}
      aria-hidden="true"
    >
      <Icon className={cn("w-8 h-8", toneClasses.avatarIcon)} />
    </div>
  );
}
```

Note: registry-wide ESLint override already disables `@next/next/no-img-element` for `src/registry/components/**` (set during `content-card-news-01` ship). The per-file disable comment is belt-and-suspenders; can also be omitted. **Decision:** omit the per-file directive — rely on the rule override.

## Root component

```tsx
// author-card-01.tsx
"use client";  // no — pure server-renderable; omit

import { memo, useId } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthorAvatar } from "./parts/avatar";
import { resolveTone } from "./parts/tone-resolver";
import { AUTHOR_CARD_DEFAULT_LABELS } from "./types";
import type { AuthorCard01Props } from "./types";

function AuthorCard01Inner(props: AuthorCard01Props) {
  const {
    name, role, bio,
    imageSrc, imageAlt,
    fallbackIcon = User,
    href, linkComponent: LinkComponent,
    tone = "primary",
    headingAs: HeadingTag = "h3",
    labels,
    className, headingClassName, nameClassName, bioClassName,
  } = props;

  const nameId = useId();
  const toneClasses = resolveTone(tone);
  const resolvedLabels = { ...AUTHOR_CARD_DEFAULT_LABELS, ...labels };
  const resolvedAlt = imageAlt ?? name;

  const RootEl = href ? (LinkComponent ?? "a") : "div";
  const rootProps: Record<string, unknown> = {
    className: cn(
      "block bg-card rounded-2xl p-6 border border-border/50 transition-colors",
      href && "hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
  };
  if (href) {
    rootProps.href = href;
    rootProps["aria-labelledby"] = nameId;
  }

  return (
    <RootEl {...rootProps}>
      <HeadingTag className={cn("text-lg font-serif font-bold text-foreground mb-4", headingClassName)}>
        {resolvedLabels.heading}
      </HeadingTag>

      <div className="flex items-center gap-4">
        <AuthorAvatar
          imageSrc={imageSrc}
          imageAlt={resolvedAlt}
          fallbackIcon={fallbackIcon}
          toneClasses={toneClasses}
        />
        <div>
          <p id={nameId} className={cn("font-semibold text-foreground", nameClassName)}>
            {name}
          </p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>

      {bio ? (
        <p className={cn("text-sm text-muted-foreground mt-4", bioClassName)}>{bio}</p>
      ) : null}
    </RootEl>
  );
}

export const AuthorCard01 = memo(AuthorCard01Inner);
AuthorCard01.displayName = "AuthorCard01";
```

**Decisions:**

- `linkComponent ?? "a"` — when `href` provided but no `linkComponent`, default to native anchor.
- `aria-labelledby={nameId}` only when the card is a link (clickable).
- `focus-visible:ring-*` only on the link variant.
- `"block"` on the root ensures `<a>` behaves like a card visually (anchors default to inline).
- Heading text fixed semantically as the "About the author" label, not the author name. Author name lives in `<p id={nameId}>` and serves as the accessible name when the card is a link.
- Bio renders only when present.
- `Required<AuthorCard01Labels>` enforces that `AUTHOR_CARD_DEFAULT_LABELS` covers every `labels` field.

## Demo (5 sub-tabs)

1. **Default** — image-less, primary tone, no link, no bio. Shows the icon-fallback path.
2. **With image** — full identity card with image, role, bio.
3. **Clickable** — `href` set, native `<a>` link. Hover affordance + focus-visible ring visible.
4. **Muted tone** — neutral background, useful for team pages where the card shouldn't compete with content.
5. **Custom labels (Turkish)** — `labels.heading: "Yazar Hakkında"`, sample Turkish role + bio, custom `fallbackIcon` (`Users` for collective bylines). Proves i18n.

Built on shadcn primitives `Tabs` + `Badge` (badge optional) for demo navigation. Same structure as `newsletter-card-01/demo.tsx`.

## Dummy data

```ts
// dummy-data.ts
export const DUMMY_AUTHORS = {
  withImage: {
    name: "Maya Chen",
    role: "Senior Editor",
    bio: "Specializes in sustainable urbanism and environmental journalism.",
    imageSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&auto=format",
    imageAlt: "Maya Chen",
  },
  withoutImage: {
    name: "Anonymous Contributor",
    role: "Guest Writer",
    bio: "Writes occasionally about local environmental stories.",
  },
  collective: {
    name: "The Editorial Team",
    role: "Collective",
    bio: "Reporting and analysis from across the newsroom.",
  },
  turkish: {
    name: "Aylin Demir",
    role: "Kıdemli Editör",
    bio: "Sürdürülebilir şehircilik ve çevre konularında uzmanlaşmış gazetecilik deneyimine sahip.",
  },
};
```

## Verification (end-of-implementation gate)

1. `pnpm tsc --noEmit` clean
2. `pnpm lint` clean (1 pre-existing rich-card warning OK)
3. `pnpm build` clean — `/components/author-card-01` prerendered
4. SSR smoke — `HTTP 200`, all 5 demo tab triggers present, default tab content rendered
5. Manifest entry present, `/components` index lists the new entry
6. Registry artifacts at `public/r/author-card-01.json` + `public/r/author-card-01-fixtures.json`

## Risks / known unknowns

1. **Image error fallback** — broken `src` shows browser default broken-image icon. Acknowledged as known limit; consumer ensures URLs are valid. v0.2 candidate: `imagePlaceholder?: ReactNode`.
2. **`href` provided without `linkComponent`** — defaults to native `<a>`. Works for static hrefs but consumers using a router-aware link (next/link, RemixLink) must pass `linkComponent` for client-side navigation. Standard pro-ui pattern.
3. **Memoization correctness** — `linkComponent` and `fallbackIcon` are component refs; consumers must pass stable refs (not inline arrow components) for memo to bite. Standard React caveat; documented in guide.

## Bundle envelope

Component code only (excluding `lucide-react` + `cn` shared infra):
- `author-card-01.tsx` ~70 LOC
- `parts/avatar.tsx` ~25 LOC
- `parts/tone-resolver.ts` ~12 LOC
- `types.ts` ~30 LOC
- Total: ~140 LOC TSX

Estimated minified: ~3.5KB. Under the ≤ 4KB envelope.

## Out of plan (deferred to v0.2 if needed)

- `imagePlaceholder?: ReactNode` for image-error fallback
- `size?: "sm" | "md" | "lg"` for avatar size variants
- `footer?: ReactNode` slot for trailing CTAs (e.g. "Follow", "View all posts")
- Skeleton loading state primitive
- Multi-author / avatar-group variant — separate slug if ever needed
