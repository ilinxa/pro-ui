# expandable-text-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`expandable-text-01-procomp-description.md`](./expandable-text-01-procomp-description.md) for the what & why.
>
> Migration origin: [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — kasder `PostContent.tsx` (55 LOC).

## Q-P locks (commitments before code)

| # | Question (from description) | Locked answer |
|---|---|---|
| Q-P1 | Expose `useLineClampDetect` hook publicly? | **Yes.** Re-exported from `index.ts`. Cheap, useful for hosts that want to detect truncation without using our component. |
| Q-P2 | `renderToggle` slot vs separate `showMoreLabel` / `showLessLabel` props? | **`renderToggle` slot for full takeover.** Label-only customization stays in the `labels` object. No prop proliferation. |
| Q-P3 | Single `onExpandedChange(next)` vs separate `onExpand` / `onCollapse`? | **Single callback with boolean** — matches React form-input convention (`onCheckedChange`, `onValueChange`). |
| Q-P4 | Inline `style` for `WebkitLineClamp` vs Tailwind `line-clamp-N` class? | **Inline `style`** — Tailwind generates static classes only; we need a dynamic `maxLines` prop. |
| Q-P5 | Re-measure on resize? | **Yes — `ResizeObserver`** on the content element. Line-height can change with responsive scaling. Observer fires async; no oscillation since clamp doesn't change scrollHeight. |
| Q-P6 | Default `maxLines` value? | **3** (matches kasder; sensible feed default). |
| Q-P7 | `content` accepts `ReactNode`? | **No — `string` only.** Measurement requires a stable text node. Rich content is `article-body-01`'s job. |
| Q-P8 | Component category? | **`data`** (matches sibling primitives `progress-timeline-01`, `info-list-01`, `schedule-list-01`). |
| Q-P9 | Always apply `display: -webkit-box` or only when clamping? | **Always** — matches kasder. Toggle `WebkitLineClamp` between `maxLines` and `"unset"`. Verified: `scrollHeight` reflects natural content height even when `-webkit-box` clamp is applied; no flash-of-untruncated-content. |
| Q-P10 | When `content` is empty/null? | **Render nothing** (no `<p>` shell, no toggle). Caller's responsibility to conditionally render the component if they want an empty state. |

## Final API

### Public types

```ts
// src/registry/components/data/expandable-text-01/types.ts

import type { ReactNode } from "react";

export interface ExpandableText01Labels {
  /** Default: "Show more". Toggle button label when collapsed. */
  showMore?: string;
  /** Default: "Show less". Toggle button label when expanded. */
  showLess?: string;
}

export interface ExpandableText01ToggleRenderProps {
  /** Current expanded state. */
  isExpanded: boolean;
  /** Setter — handles controlled-or-uncontrolled internally. */
  setExpanded: (next: boolean) => void;
}

export interface ExpandableText01Props {
  /** Plain-text content to render. Required. Empty/null → component renders nothing. */
  content: string | null | undefined;

  /** Number of lines before truncation. Default: 3. */
  maxLines?: number;

  // ─── Controlled-or-uncontrolled expanded state ────────────────────
  /** Controlled expanded state. Pair with `onExpandedChange`. */
  expanded?: boolean;
  /** Initial uncontrolled expanded state. Default: false. Ignored when `expanded` is provided. */
  defaultExpanded?: boolean;
  /** Fires on every expand/collapse. Receives the NEXT state. */
  onExpandedChange?: (next: boolean) => void;

  // ─── Customization ────────────────────────────────────────────────
  /** Localized labels. Defaults are English. */
  labels?: ExpandableText01Labels;
  /** Custom toggle renderer — full takeover. Receives current state + setter. */
  renderToggle?: (props: ExpandableText01ToggleRenderProps) => ReactNode;

  // ─── Style overrides ──────────────────────────────────────────────
  /** Override classes for the wrapping <div>. */
  className?: string;
  /** Override classes for the content <p>. */
  contentClassName?: string;
  /** Override classes for the default toggle <button>. Ignored when `renderToggle` is provided. */
  toggleClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_EXPANDABLE_TEXT_LABELS: Required<ExpandableText01Labels> = {
  showMore: "Show more",
  showLess: "Show less",
};
```

### Hook signature

```ts
// src/registry/components/data/expandable-text-01/hooks/use-line-clamp-detect.ts

export interface UseLineClampDetectOptions {
  /** Number of lines before truncation. */
  maxLines: number;
  /** Content string — re-measures when this changes. */
  content: string | null | undefined;
}

export interface UseLineClampDetectResult {
  /** Attach to the <p> element being measured. */
  ref: React.RefCallback<HTMLElement>;
  /** True when content's natural height exceeds maxLines × lineHeight. */
  isTruncated: boolean;
}

export function useLineClampDetect(opts: UseLineClampDetectOptions): UseLineClampDetectResult;
```

Returns object (not tuple) so destructuring stays self-documenting.

### Exported names

```ts
// index.ts
export { default as ExpandableText01 } from "./expandable-text-01";
export type {
  ExpandableText01Props,
  ExpandableText01Labels,
  ExpandableText01ToggleRenderProps,
} from "./types";
export { DEFAULT_EXPANDABLE_TEXT_LABELS } from "./types";
export {
  useLineClampDetect,
  type UseLineClampDetectOptions,
  type UseLineClampDetectResult,
} from "./hooks/use-line-clamp-detect";
export { meta } from "./meta";
```

### No generics

Strict shape. Content is `string`.

## File-by-file plan

8 files. Sealed-folder.

```
src/registry/components/data/expandable-text-01/
├── expandable-text-01.tsx              # 1 — root
├── hooks/
│   └── use-line-clamp-detect.ts        # 2 — measurement hook
├── types.ts                             # 3
├── dummy-data.ts                        # 4
├── demo.tsx                             # 5
├── usage.tsx                            # 6
├── meta.ts                              # 7
└── index.ts                             # 8
```

### 1. `expandable-text-01.tsx` — root

- `"use client"` directive (uses `useEffect`, `useState`, `useId`).
- `React.memo` at export.
- Resolves defaults: `maxLines ?? 3`, `defaultExpanded ?? false`.
- Controlled-or-uncontrolled state via `isControlled = expanded !== undefined` pattern (mirrors React form inputs).
- `useId` produces `contentId` for `aria-controls`.
- Empty content guard: when `!content`, return `null` (no shell rendered — Q-P10).
- Renders:

```tsx
"use client";

import { memo, useCallback, useId, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_EXPANDABLE_TEXT_LABELS,
  type ExpandableText01Props,
} from "./types";
import { useLineClampDetect } from "./hooks/use-line-clamp-detect";

function ExpandableText01Inner({
  content,
  maxLines = 3,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  labels: labelsProp,
  renderToggle,
  className,
  contentClassName,
  toggleClassName,
}: ExpandableText01Props) {
  const labels = { ...DEFAULT_EXPANDABLE_TEXT_LABELS, ...labelsProp };

  const isControlled = expandedProp !== undefined;
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const expanded = isControlled ? expandedProp : expandedState;

  const setExpanded = useCallback(
    (next: boolean) => {
      if (!isControlled) setExpandedState(next);
      onExpandedChange?.(next);
    },
    [isControlled, onExpandedChange],
  );

  const { ref, isTruncated } = useLineClampDetect({ maxLines, content });
  const contentId = useId();

  const isClamped = !expanded && isTruncated;
  const showToggle = isTruncated;

  if (!content) return null;

  return (
    <div className={cn(className)}>
      <p
        ref={ref}
        id={contentId}
        className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap wrap-break-word",
          contentClassName,
        )}
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: isClamped ? maxLines : "unset",
          overflow: isClamped ? "hidden" : "visible",
        }}
      >
        {content}
      </p>
      {showToggle &&
        (renderToggle ? (
          renderToggle({ isExpanded: expanded, setExpanded })
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls={contentId}
            className={cn(
              "mt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
              toggleClassName,
            )}
          >
            {expanded ? labels.showLess : labels.showMore}
          </button>
        ))}
    </div>
  );
}

const ExpandableText01 = memo(ExpandableText01Inner);
ExpandableText01.displayName = "ExpandableText01";

export { ExpandableText01 };
export default ExpandableText01;
```

### 2. `hooks/use-line-clamp-detect.ts`

- Pure hook; no `"use client"` (consumer file owns the directive).
- Tracks the element via `useState` (NOT `useRef` + ref-callback capture) so element-identity changes (e.g., consumer attaches to a `<p>` inside a list with keys → re-mounts on reorder) re-trigger the observer setup. Critical for the publicly-exported hook contract.
- `setEl` IS the ref callback handed back to the consumer — React guarantees `setState`'s identity is stable across renders.
- Re-measures on `[el, content, maxLines]` change AND on every ResizeObserver fire.
- Defensive: bails if `lineHeight` parse returns `NaN` or `0`.
- `content` typed as `unknown` (NOT `string | null | undefined`) — the hook never reads the value, only uses its identity as a re-measurement trigger. External consumers can pass primitives, version counters, content hashes, or even ReactNode (their measurement target) without type cast friction. The component caller still passes a `string` (locked by Q-P7).

```ts
import { useEffect, useState } from "react";

export interface UseLineClampDetectOptions {
  maxLines: number;
  /**
   * Re-measurement trigger. Hook never reads the value — only uses its identity
   * to detect when a re-measure is needed. Pass a primitive (string, number),
   * a content hash, a version counter, or any stable identity that changes
   * when the underlying text changes.
   */
  content: unknown;
}

export interface UseLineClampDetectResult {
  /** Pass to your measured element: `<p ref={ref}>...</p>`. */
  ref: (node: HTMLElement | null) => void;
  /** True when the element's natural height exceeds `maxLines × lineHeight`. */
  isTruncated: boolean;
}

export function useLineClampDetect({
  maxLines,
  content,
}: UseLineClampDetectOptions): UseLineClampDetectResult {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (!el) return;

    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      if (!lineHeight || Number.isNaN(lineHeight)) return;
      const maxHeight = lineHeight * maxLines;
      const next = el.scrollHeight > maxHeight + 1; // +1 for sub-pixel rounding
      setIsTruncated((prev) => (prev === next ? prev : next));
    };

    measure(); // initial synchronous measurement (avoids waiting for first observer frame)

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, content, maxLines]);

  return { ref: setEl, isTruncated };
}
```

**Why `useState` not `useRef`:** the consumer's `<p ref={ref}>` element may re-mount (keyed list reorder, parent reconciliation). `useState`-tracked element causes the effect to re-run when identity changes — old observer disconnects, new observer attaches to the fresh element. `useRef` + ref-callback would silently observe a stale element. Critical for the public hook contract.

**Why `setState` IS the ref callback:** React's `setState` setters have stable identity across renders (guaranteed by React). So `ref={setEl}` doesn't cause `<p>` to detach/reattach on every render. Free stability, no `useCallback` needed.

**Single `useEffect`:** combines initial measurement + observer setup + cleanup. Runs on `[el, content, maxLines]`. ResizeObserver's first callback is async (next frame), so explicit `measure()` call gives synchronous initial value on commit.

**`+1` sub-pixel guard:** without it, certain font/zoom combinations report `scrollHeight = 49px` and `lineHeight × 3 = 49px`, oscillating between truncated/not. The 1px slop fixes false positives on exact-match content.

**`setIsTruncated((prev) => (prev === next ? prev : next))`:** referentially stable update — React skips re-render when value unchanged. Keeps the ResizeObserver from cascading re-renders during animation/scroll.

### 3. `types.ts`

All public types as shown in **Final API** above. Including `DEFAULT_EXPANDABLE_TEXT_LABELS` constant export.

### 4. `dummy-data.ts`

Strings only. Two short + two long samples (one Turkish, one English).

```ts
export const SHORT_EN =
  "Just shipped a small update. Quick fix for the auth flow.";

export const LONG_EN =
  "Spent the afternoon walking through the new market by the harbor. The vendors had set up under bright canopies, and the smell of grilled fish and fresh bread filled the air. I bought a small jar of olive paste from a woman who told me her family has been making it the same way for four generations. The texture was somewhere between butter and tapenade — earthy, salty, with a faint heat at the finish. I'll pick up another jar before we leave.";

export const SHORT_TR =
  "Küçük bir güncelleme yayınladım. Hızlı bir düzeltme.";

export const LONG_TR =
  "Bugün limanın yanındaki yeni pazarda dolaştım. Satıcılar parlak tentelerin altına tezgâhlarını kurmuştu ve havada ızgara balık ile taze ekmek kokusu vardı. Dört nesildir aynı şekilde zeytin ezmesi yaptığını söyleyen bir kadından küçük bir kavanoz aldım. Doku tereyağı ile tapenad arasında bir yerde — toprağımsı, tuzlu, sonunda hafif bir acılıkla. Ayrılmadan bir kavanoz daha alacağım.";
```

### 5. `demo.tsx`

4-tab demo with shadcn `Tabs`. Each tab uses one of the dummy strings.

1. **Default (collapsed)** — `<ExpandableText01 content={LONG_EN} />`. Shows the toggle, demonstrates the basic interaction.
2. **Custom maxLines** — `<ExpandableText01 content={LONG_EN} maxLines={6} />`. Shows that maxLines is dynamic (toggle still appears since content > 6 lines on the demo width).
3. **Localized (TR)** — `<ExpandableText01 content={LONG_TR} labels={{ showMore: "Daha fazla göster", showLess: "Daha az göster" }} />`.
4. **Custom toggle (chevron)** — `renderToggle` slot demonstration with `ChevronDown` / `ChevronUp` icons + `aria-label`.

Each tab also shows the SHORT variant alongside to prove the toggle does NOT render when content fits within maxLines.

### 6. `usage.tsx`

Code-block walkthrough:

- **Minimal usage** — one-prop call
- **Custom maxLines** — when to use 2 vs 5 vs 10
- **Controlled mode** — feed virtualization scenario; per-post expand state map
- **Custom toggle** — chevron icon example
- **Localized** — Turkish labels override
- **`useLineClampDetect` hook standalone** — using the hook outside the component (e.g., to show a small "..." indicator in a different style)
- **Anti-patterns** — passing `ReactNode` (don't; use `article-body-01`); expecting auto-collapse on click outside (we don't do that); animating expand height (we don't in v0.1)

### 7. `meta.ts`

```ts
import type { ComponentMeta } from "@/registry/types";

export const meta: ComponentMeta = {
  slug: "expandable-text-01",
  name: "Expandable Text 01",
  category: "data",
  description:
    "Truncate-and-expand plain-text block — measure-based detection (toggle only renders when truncation actually occurs), configurable maxLines, controlled-or-uncontrolled expand state, custom toggle slot.",
  context:
    "Use for any user-authored multi-line text where the surface budget is bounded — post bodies, comment bodies, event descriptions, news excerpts, product descriptions, profile bios. Pure CSS line-clamp clips silently; this component measures scrollHeight against lineHeight × maxLines after mount + on resize, so the 'show more' toggle only appears when content actually exceeds the budget. Migration origin: kasder kas-social-front-v0 PostContent.tsx; first ship in the 8-component social-posts-system arc.",
  features: [
    "Measure-based truncation detection — toggle hidden when content fits",
    "Configurable maxLines (default 3)",
    "Controlled-or-uncontrolled expand state via expanded / defaultExpanded / onExpandedChange (mirrors React form-input convention)",
    "Re-measure on content + maxLines change AND on container resize (ResizeObserver)",
    "i18n via labels object (English defaults: 'Show more' / 'Show less')",
    "renderToggle slot for full toggle takeover",
    "Public useLineClampDetect hook export for advanced consumers",
    "a11y: real <button> with aria-expanded + aria-controls; <p> id from useId; focus-visible ring",
    "Empty content guard — renders nothing when content is empty/null",
    "No peer deps beyond React",
  ],
  tags: ["expandable-text-01", "text", "truncate", "line-clamp", "expand"],
  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",
  author: { name: "ilinxa" },
  dependencies: { shadcn: ["tabs"], npm: {}, internal: [] },
  related: ["article-body-01", "comment-thread-01", "post-card-01"],
};
```

### 8. `index.ts`

Public exports as shown in **Final API** above.

## Dependencies

### Internal (pro-ui)

- `@/lib/utils` — `cn()`

### NPM

- `react` (already installed)
- shadcn `tabs` for the demo (already installed)
- `lucide-react` for the demo's chevron icons (already installed)

### Forbidden

- `next/*`
- Any animation library
- Any rich-text library (use `article-body-01` for that)

## Composition pattern

**Headless wrapping over a measurement hook.** The hook does the work; the component renders the result. Hook is exported standalone for advanced consumers.

## Edge cases

| Case | Behavior |
|---|---|
| `content` empty / null / undefined | Component returns `null` — no shell rendered |
| Content exactly `maxLines` lines | `+1` sub-pixel guard prevents false-positive truncation; toggle hidden |
| Container resizes (responsive width change) | ResizeObserver fires → re-measures → updates `isTruncated` |
| `maxLines` changes at runtime | useEffect dep triggers re-measure |
| `content` changes at runtime | useEffect dep triggers re-measure |
| Both `expanded` + `defaultExpanded` provided | `expanded` wins (controlled mode); `defaultExpanded` ignored |
| Neither `expanded` nor `defaultExpanded` provided | Uncontrolled, defaults to collapsed |
| `onExpandedChange` provided in uncontrolled mode | Fires alongside internal state update |
| `renderToggle` provided | Default `<button>` skipped; consumer renders + wires their own |
| Heavy content with many embedded `\n` | `whitespace-pre-wrap` preserves; measurement remains accurate |
| Long unbroken URL | `wrap-break-word` wraps; doesn't blow the layout width |
| RTL content | `whitespace-pre-wrap` preserves; line-clamp works in both directions |
| SSR | Hook's `useEffect` doesn't run on server; first render = `isTruncated: false`, no toggle. Hydration: toggle appears after measurement. Acceptable — matches kasder; consumers wanting SSR-safe truncation use static CSS clamp without the toggle |
| Reduced motion | No motion in v0.1; nothing to gate |
| Font swap (web font load) | ResizeObserver fires when computed line-height changes due to font load → re-measures correctly |

## Accessibility

- Default toggle is a real `<button type="button">` — keyboard activation via Enter / Space comes free.
- `aria-expanded={expanded}` on the toggle — announces state.
- `aria-controls={contentId}` on the toggle, `id={contentId}` on the `<p>` — links them programmatically for AT.
- `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm` — visible focus ring on keyboard focus only.
- Custom `renderToggle` is consumer's responsibility — usage doc warns to maintain `aria-expanded` + `aria-controls` (the slot prop receives `isExpanded` and `setExpanded` so consumer can wire them).
- Content `<p>` is plain semantic prose — screen readers handle the `whitespace-pre-wrap` newlines naturally.
- No `aria-live` needed — the toggle action is user-initiated, not a content update.

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean (1 pre-existing rich-card warning OK; no new)
- [ ] `pnpm build` clean — `/components/expandable-text-01` prerendered (35th route)
- [ ] SSR returns 200 with all 4 demo tab triggers
- [ ] `/components` index lists the new entry
- [ ] Visual sanity:
  - Short content (1–2 lines): NO toggle
  - Long content (10+ lines): toggle appears, click expands, click again collapses
  - `maxLines={6}`: toggle behavior shifts threshold accordingly
  - Custom `renderToggle` chevron rotates / swaps icons on click
  - TR labels render correctly with Turkish characters
- [ ] Browser sanity (deferred but flagged in STATUS):
  - ResizeObserver re-measures on window narrow/widen
  - Controlled mode persists state across hypothetical remount

## Risks & alternatives

### Risk 1: SSR shows no toggle initially, then appears after hydration

The first server render has `isTruncated: false` (no DOM, no measurement). Client mounts, `useEffect` fires, sets `isTruncated: true`, toggle appears. **This is a flash.**

**Mitigation:** acceptable for v0.1 — matches kasder's existing behavior; the toggle pop-in is small and at the end of the text. Consumers wanting zero-flash SSR can apply Tailwind's static `line-clamp-3` themselves (no toggle) and live with always-clamped content.

**v0.2 candidate:** server-side truncation estimate via character count heuristic (e.g., assume ~50 chars/line for default styling) — gives an SSR-time guess; client refines on hydration.

### Risk 2: ResizeObserver in older browsers

ResizeObserver is supported in all evergreen browsers (Safari 13.1+, Chrome 64+, Firefox 69+, Edge 79+). Pro-ui targets evergreen — no polyfill needed. Documented in usage.

### Risk 3: `getComputedStyle(el).lineHeight` returns `"normal"` instead of a px value

When the consumer doesn't set an explicit line-height, browsers may report `"normal"` which `parseFloat` returns as `NaN`. Hook bails (`if (!lineHeight || Number.isNaN(lineHeight)) return;`) — `isTruncated` stays at its prior value (false initially). **Visible behavior:** toggle never appears even on long content.

**Mitigation:** the component's default class includes `leading-relaxed` (= `line-height: 1.625`), which Tailwind compiles to a unitless number. `getComputedStyle` resolves unitless line-heights to `"normal"` in some browsers... actually, Tailwind's `leading-relaxed` compiles to `line-height: 1.625` (unitless), and `getComputedStyle` returns the resolved px value (e.g. `"22.75px"` for `text-sm`). Tested in modern Chromium. Documented in the hook's JSDoc.

**Edge case:** if a consumer overrides via `contentClassName="leading-normal"` → resolves correctly. If they override with their own `style={{ lineHeight: "normal" }}` → bail path triggers; no toggle. Acceptable.

### Risk 4: Consumer applies their own `display: flex` via `contentClassName`

Our inline `style={{ display: "-webkit-box", ... }}` wins over Tailwind class because inline styles have higher specificity. So `display: -webkit-box` is preserved. No conflict.

### Alternatives considered

1. **Pure CSS `line-clamp-N` without measurement** — rejected. The whole point is the toggle should NOT render when content fits. CSS-only loses that signal.
2. **JS string truncation by character count** — rejected. Doesn't account for font, width, or line-wrapping. Causes "show more" on already-fitting content and vice versa.
3. **Always-render toggle, let user click to expand even when no overflow** — rejected. Bad UX (button does nothing).
4. **Animated height transition on expand** — deferred to v0.2. Requires either measuring unclamped height (extra render pass) or `interpolate-size: allow-keywords` (limited browser support).
5. **Detect via `MutationObserver`** — overkill. Content changes flow through React → hook's useEffect dep covers them. ResizeObserver covers layout-driven cases. MutationObserver would catch DOM mutations from outside React (rare here).
6. **Hide toggle behind `hover` reveal** — rejected. Mobile users would have no way to discover it.

## Implementation phases

### Phase A — scaffolding + hook (Day 1, ~1 hour)

- `pnpm new:component data/expandable-text-01` — scaffolds the sealed folder
- Author `hooks/use-line-clamp-detect.ts` per spec above (most complex piece)
- Author `types.ts` with all public types
- `pnpm tsc --noEmit` should pass on the bare scaffolding

### Phase B — root component + parts (Day 1, ~1 hour)

- Author `expandable-text-01.tsx` per spec above
- Author `dummy-data.ts` (4 strings)
- Smoke-test by importing into a temporary scratch route (`src/app/scratch/page.tsx`) with the 4 strings — verify visual behavior + click interaction. Delete the scratch route before commit.

### Phase C — demo + docs + ship (Day 1, ~1 hour)

- Author `demo.tsx` (4 tabs)
- Author `usage.tsx`
- Author `meta.ts`
- Add 3 lines to `src/registry/manifest.ts` (printed by scaffolder)
- Run `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` — all clean
- Add to `registry.json` (base item + fixtures item — `dummy-data.ts` only)
- Run `pnpm registry:build` — verify `public/r/expandable-text-01.json` + `public/r/expandable-text-01-fixtures.json` produced
- Update `.claude/STATUS.md` with the entry
- Author `expandable-text-01-procomp-guide.md` (consumer-facing notes — composes alongside the implementation)

### Estimated total: ~3 hours focused work

Smallest pro-comp in the social-posts-system arc. Sets the cadence + establishes the labels-object + controlled-or-uncontrolled patterns for the next 7 components.

## Open follow-ups (post v0.1)

- v0.2: animated height transition on expand/collapse — gated on `interpolate-size: allow-keywords` browser support OR a measure-and-set-height approach
- v0.2: server-side truncation estimate via character heuristic for zero-flash SSR
- v0.2: `inline` mode — `<span>` with inline "...more" continuation instead of block toggle below
- v0.2: `expandSnap` prop — when expanded, scroll the toggle into view (avoid jumping the page when collapsed deep)
- v0.3: optional rich-content escape hatch via `<ExpandableText01><CustomChildren /></ExpandableText01>` — but this likely lives in a separate `expandable-block-01` since measurement gets harder with arbitrary children
