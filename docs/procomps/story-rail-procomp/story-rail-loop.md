# Loop state — `story-rail` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking** — 0.x minor) |
| **Current stage** | CLOSED — shipped `407fea1`, deploy verified 2026-10-23 |
| **Sign-off policy** | delegated by user 2026-10-23 ("Sign off, delegate rest" — U2–U6 without pausing, ask before push; also covers app-sidebar's U1 unless a composed component breaks). Scroll-aware fades + `axe-core` devDep approved. |
| **Version target** | v0.3.0 → **v0.4.0** |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finder: Sonnet 5 (fresh) |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

Source of the request: ilinxa Social Platform hardening request §4.2 (SR1–SR8) + contract C1–C12,
**as amended by** [`.claude/hardening-request-verification-2026-10-23.md`](../../../.claude/hardening-request-verification-2026-10-23.md) §story-rail.
User order (2026-10-23): story-rail first (consumer adopts it for their stories release within ~a week), then app-sidebar, then Part 1.

## Stage checklist (U-loop)

- [x] U0 Intake — class + blast radius + reproductions (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-23 (contract as written; fades scroll-aware; axe-core now)
- [x] U2 Implement — slices below (all done; regression tests falsified, see slice 3)
- [x] U3 Gate battery — real numbers below (re-run after U4 fixes)
- [x] U4 Adversarial review — 2 fresh finders (23 rows: 20 CONFIRMED+fixed, 3 DROPPED incl. F-V refuted at U5); 13 regression tests added (F-A…F-M), F-C + F-F falsified by the coordinator; gates re-run green
- [x] U5 Runtime & smoke — browser 21/21 on the production build; installs CLI 4.18.0 + 3.8.5 (base + fixtures) exit 0, consumer tsc 0, theme no-overwrite negative path held
- [x] U6 Docs sync & review — spotcheck (broad) [`reviews/2026-10-23-v0.4.0-hardening.md`](reviews/2026-10-23-v0.4.0-hardening.md): **Pass with follow-ups** (5, all owned); roster 8/8 clean; doc-drift · doc-budget · inert-surfaces green; digest SR4 claim corrected
- [x] U7 Ship — `407fea1` pushed on user OK (with `0004f43`); live `https://ui.ilinxa.com/r/story-rail.json` verified on poll 3 (8 files incl. `story-rail-context.ts`, pinned deps, both `color-story-ring-*` mappings). Retro: decision `.claude/decisions/2026-10-23-story-rail-v0-4-0.md` (local).

## U0 — Intake

**Class: breaking** (take the higher class when in doubt):
- `previewImage` becomes optional → `string | undefined` for every `renderThumbnail` / reducer reader (TS break).
- Unread-ring default colours change (today `from-accent` = neutral grey start → token-driven).
- `handle.scrollTo(index)` semantics corrected when `leading` is mounted (see R3).
- `items` gains controlled semantics behind `onItemsChange` (legacy path kept + dev-warned — not itself a break).

**Blast radius**

| Surface | Why touched | Synced (U6) |
|---|---|---|
| `src/registry/components/data/story-rail/**` | the change | |
| `registry.json` story-rail item | `cssVars.theme` story-ring mappings; new files in `files[]`; deps pinned to meta ranges (C10) | |
| `src/app/globals.css` | docs-site `@theme` mapping for `story-ring-*` (same fallback string as the item) | |
| `story-viewer/usage.tsx`, `story-viewer/meta.ts` | prose shows positional `onItemClick(item, index)` + "always-uncontrolled (matches story-rail)" | |
| procomp trio (description · plan · guide) | API + locks Q-P4/Q-P8/R-D-1 revised; guide migration note; guide `:10,39,61` positional `onItemClick` | |
| `package.json` (devDeps) | `axe-core` for C11 axe tests (repo has only a transitive copy) | |
| STATUS row · component-versions · llms/README | version 0.4.0 | |
| Dependents (code) | **none** — grep: no registry file imports story-rail; `registryDependencies` nowhere name it | n/a |
| Feature slices / interop contracts | none | n/a |

Fix-on-touch ledger: no story-rail cohort. F-cross-15 / popover-width: not carriers. Open follow-ups from
`reviews/2026-05-09-v0.1.0-spotcheck.md`: checked at U6.

**Reproductions (write-before-fix, replayed at U5)**

| # | Input | Today | Expected |
|---|---|---|---|
| R1 (SR8) | `<StoryRail labels={{addStoryLabel:"Hikaye ekle", addStoryAriaLabel:"Hikaye ekle"}} leading={<AddStoryThumbnail/>}>` | tile shows "Add story" / `aria-label="Add a story"` (labels inert) | Turkish text + name |
| R2 (SR5) | re-render with a new `items` array (item added / `hasUnread` flipped) | ignored (read once into `useReducer`) | with `onItemsChange`: DOM follows the prop |
| R3 (new) | `leading` mounted, `ref.scrollTo(2)` | scrolls to item 1 (the Add tile is slide 0) | scrolls to item 2 |
| R4 (SR1) | item without `previewImage` / expired URL | `<img src="">` / broken image | avatar card; refresh via `onPreviewError` once |
| R5 (SR7) | Tab to the first tile | ring clipped top/bottom; start fade covers its edge | full ring visible |
| R6 (new) | Tab to `AddStoryThumbnail` | no visible focus indicator | `focus-visible` ring like the tiles |

## U1 — Change contract (for sign-off)

### API delta (v0.4.0)

**`StoryRailItem`**
- `previewImage?: string` (was required). Absent or failing → **avatar card**: author avatar (initials fallback) centred on `bg-muted` in the same 80×112 tile.
- `previewSrcSet?: string`, `previewSizes?: string` (C8; `sizes` defaults to `"80px"` when a srcSet is given).
- `muted?: boolean` — grey ring even when unread; tile + name at reduced opacity. Ordering stays the host's.

**`StoryRailProps`**
- `defaultItems?: StoryRailItem[]` — uncontrolled seed (today's behaviour).
- `items?: StoryRailItem[]` + `onItemsChange?: (next) => void` — **controlled when `onItemsChange` is passed**: the prop wins every render; `markViewed` / `dispatch` / `reset` / subscribe deltas compute `next` from the latest prop and call `onItemsChange`; DOM changes only when the prop does. Consecutive deltas before a re-render chain (no lost update).
- `items` **without** `onItemsChange` = legacy read-once, kept working + one dev-warning per mount pointing at `defaultItems` / `onItemsChange` (locked decision 1 + digest SR5 "deprecation window"; not version-pinned).
- `onPreviewError?: (item) => Promise<string | void>` — resolve a string → retried once with it; void / second failure → avatar card. A new `previewImage` from the host resets the state.
- `arrows?: "none" | "fine-pointer" | "always"` — default `"none"` (decision 2: defaults kept). `"fine-pointer"` renders prev/next only under `(pointer: fine)` (resolved after mount → SSR-identical first render). Hidden when the rail cannot scroll that way; page-wise scroll; mirrored in RTL; `prefers-reduced-motion` → jump, no animation.
- `dir?: "ltr" | "rtl"` — else the nearest `[dir]` ancestor (resolved after mount) → Embla `direction`.

**`StoryRailLabels`** (+ all defaults in `DEFAULT_STORY_RAIL_LABELS`, incl. the thumbnail aria function)
- `previousLabel` "Previous stories" · `nextLabel` "Next stories".
- `thumbnailAriaLabel(item)` default moves into the defaults object and covers muted: "{username}, muted".
- `addStoryLabel` / `addStoryAriaLabel` **wired** (SR8): `AddStoryThumbnail` reads the rail's labels from context; its own `label` / `ariaLabel` props still win; standalone use keeps the English defaults.

**`AddStoryThumbnail`**: focus-visible ring; plus badge `end-1` (logical); avatar `<img>` gets `width`/`height`/`decoding`, hides on error.

**Handle**: `scrollTo(index)` targets the **item** index (offset by the `leading` slide; clamped to the trimmed snap list). Others unchanged.

### Visual / token delta

| Item | Today | v0.4.0 |
|---|---|---|
| Unread ring (SR2, C1) | `from-accent via-warning to-destructive` | `from-story-ring-from to-story-ring-to`; item `cssVars.theme`: `color-story-ring-from: var(--story-ring-from, var(--warning, oklch(0.78 0.16 75)))`, `color-story-ring-to: var(--story-ring-to, var(--destructive))` (decision 4 — never light/dark) |
| Edge fades (SR7) | `w-12`, always both | width `var(--story-rail-fade-width, 3rem)` (default kept, decision 2 — consumer sets `2rem`); **scroll-aware**: a fade shows only where the rail can scroll (start fade hidden at rest → no longer covers the first tile's focus ring) |
| Fade/badge position (SR6, C4) | `left-*`/`right-*`, `bg-linear-to-r/l` | `start-*`/`end-*`, gradient flips under `rtl:` |
| Track (SR7) | no vertical padding | `py-1` so the 2px focus ring is never clipped |
| Ring transition (C9) | `transition-all` | `motion-safe:transition-colors` |

### Contract matrix (C1–C12 applied to story-rail)

| Rule | Applies | v0.4.0 |
|---|---|---|
| C1 tokens | yes | story-ring tokens; no raw palette classes (none today besides the ring) |
| C2 labels | yes | every string in `StoryRailLabels`, defaults exported; Add tile wired; arrows labelled; no concatenated fragments outside label functions |
| C3 formatting | no | no dates/counts rendered |
| C4 direction | yes | logical classes; `dir` prop → nearest `[dir]`; Embla direction; arrows mirrored; RTL demo tab |
| C5 controlled | yes | `items`/`onItemsChange` + `defaultItems` (above). Optimistic: n/a (no async callbacks to roll back) |
| C6 withheld counts | no | no counts |
| C7 permissions/slots | partial | `leading` + `renderThumbnail` slots exist; no per-action gating needed (single action) |
| C8 media | yes | optional preview, `width`/`height`/`loading`/`decoding`/`srcSet`/`sizes`, `onPreviewError` |
| C9 runtime | yes | no `next/*`; pointer + dir resolved in effects (server == first client render); reduced motion; no key listeners added |
| C10 packaging | partial | deps pinned in the item now; **served version (R10) + CLI 3.8.x install (R12) are Part 1** — but U5 smokes this slug on CLI 3.8.5 too |
| C11 tests | yes | Vitest + axe: reducer, legacy/uncontrolled/controlled, preview fallback + refresh, arrows (Embla mock + matchMedia), RTL, labels override (Add tile), muted, scrollTo offset, axe ×3 states |
| C12 visual | yes | prototype parity check at U5 (1440 / 375 px, ring, gap, Add tile first, focus ring) |

### Invariants

| # | Invariant (testable) | U4 | U5 |
|---|---|---|---|
| I1 | Legacy `items` without `onItemsChange`: read once; `markViewed`/`reset`/`dispatch`/deltas still mutate; dev-warn once | | |
| I2 | `defaultItems`: identical behaviour, no warning | | |
| I3 | Controlled: new `items` updates DOM without remount; mutations call `onItemsChange(next)` and leave DOM unchanged; two deltas before a re-render both land | | |
| I4 | No preview → avatar card, no `<img src="">`; error → `onPreviewError` string → retried once → avatar card on 2nd failure; void → avatar card | | |
| I5 | Preview `<img>`: `loading="lazy"` `decoding="async"` `width=80` `height=112`, srcSet/sizes forwarded | | |
| I6 | Unread ring classes reference both story-ring tokens; read + muted → `bg-muted`; muted → reduced opacity; label fn receives `muted: true` | | |
| I7 | Arrows: absent by default; `fine-pointer` + coarse → none; prev absent at start, next absent at end; names from labels | | |
| I8 | `dir="rtl"` (prop or ancestor) → Embla `direction: "rtl"`; badge/fades logical | | |
| I9 | Add tile inside the rail uses rail labels; its own props win; standalone → English defaults | | |
| I10 | `scrollTo(i)` with `leading` targets item i | | |
| I11 | First client render identical to server render (no arrows, start fade hidden, end fade shown) | | |
| I-neg | `renderThumbnail` slot, empty state, `framed={false}` unchanged; base renders with no new props | | |

### Size

Shipped source today ≈ 18.2 KB (≈ 20.6 KB built). Estimated +9 KB source → ≈ 31 KB built > `artifactBudgetKB: 25`
(fails at 30). **Raise the budget to 34.**

## Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | types + hook (controlled/legacy/default) + context + direction/pointer hooks + root (arrows, fades, scrollTo) | architect | done | `story-rail.tsx`, `types.ts`, `hooks/use-story-rail-state.ts`, `hooks/use-rail-environment.ts`, `parts/story-rail-context.ts` |
| 2 | thumbnail (preview fallback/refresh, muted, ring tokens) + Add tile (context labels, focus ring, logical) | architect | done | `parts/story-thumbnail.tsx` (`StoryPreview` keyed by `previewImage`), `parts/add-story-thumbnail.tsx`. Kept `start-*`/`end-*` (all Tailwind v4) over 4.2-only `inset-s/e-*`. |
| 3 | tests (C11 list) + `axe-core` devDep | implementer (Sonnet) + coordinator (devDep `axe-core@4.14.0`) | done | 5 files / 89 tests (reducer 14 · data-modes 17 · preview 22 · arrows-rtl 33 · a11y 3). Bodies read. **Falsified** by re-introducing 3 bugs (Add tile ignores rail labels · `scrollTo` ignores `leading` · controlled delta chain dropped): each failed exactly its regression test (88/89), files restored byte-identical (`cmp`). |
| 4 | demo (RTL / controlled / arrows / muted + no-preview fixtures) + usage | implementer (Sonnet) | done | tabs Fallbacks/Controlled/Arrows/RTL (`demo.tsx:280/298/364/400`); usage rewritten; fixtures + `selin` (no preview), `burak` (muted+unread), srcSet on item 1 |
| 5 | registry.json + globals.css + meta + trio docs + story-viewer prose | architect | done | item: cssVars story-ring ×2, deps pinned, +2 files; globals `@theme` mapping; meta 0.4.0 / budget 42; trio v0.4.0 sections + guide rewrite; story-viewer usage/meta prose |

## Gate battery (U3 — real numbers)

| Gate | Result |
|---|---|
| tsc | exit 0 · 0 errors (after U4) |
| lint | exit 0 · 0 errors / 14 warnings (baseline; none in story-rail) |
| meta-deps | exit 0 |
| registry validators | all exit 0 — **registry-tokens first flagged `story-rail-fade-width`** (a `var(--x, fallback)` override knob, not a theme token) → validator now skips fallback-carrying refs but still scans the fallback; gate test +1 case (20/20), falsified by reasoning (old code flags both cases) |
| doc validators | doc-drift exit 0 after `registry:build` regenerated component-versions · doc-budget exit 0 |
| registry:build | exit 0 · artifact **39.16 KB** vs estimate 34 → budget 42; after U4 fixes **43.11 KB** → budget **46** (6.3% headroom) |
| build | pending |
| tests | story-rail scoped **105/105** (5 files). Full suite **369/369 serial** (`--no-file-parallelism`). Parallel pool on this host: 368/369 — `registry-tokens-gate` "clean against the real catalog" timed out at 29 s under load (2 GB free, 61% CPU from other sessions); the same test takes 205 ms alone, and the validator runs 0.28 s new vs 0.29 s at HEAD → host load, not code (parked) |

## Findings table (U4)

| # | Finding (failure scenario) | Source | Verdict | Evidence / refutation | Fix |
|---|---|---|---|---|---|
| F-A | ⚠️ `labels={{ thumbnailAriaLabel: undefined }}` (conditional i18n) → TypeError on every tile; any undefined key erased its default (v0.4 regression: 0.3 had `?? defaultAriaLabel`) | finder-1 F1 · finder-2 F3 | CONFIRMED | `{...DEFAULTS, ...labelsProp}` merge; `labels.thumbnailAriaLabel(item)` called directly | merge skips `undefined` values (`story-rail.tsx` labels memo) |
| F-B | 🔸 `defaultItems` + `onItemsChange` → empty rail, no warning (controlled keyed on `onItemsChange` alone) | finder-1 F2 | CONFIRMED | `isControlled = onItemsChange !== undefined`; `items ?? EMPTY` | controlled iff `items` **and** `onItemsChange`; `onItemsChange` alone = uncontrolled + notified |
| F-C | ⚠️ expired signed URL + `previewSrcSet`: refreshed `src` never loads (browsers prefer `srcset`, still the dead URLs) → avatar card; the C8 refresh path fails for responsive items | finder-1 F3 | CONFIRMED | `srcSet={item.previewSrcSet}` in every phase | `srcSet`/`sizes` only in the `primary` phase |
| F-D | 🔸 host writes refreshed URL back → preview remounts as `primary` with a fresh budget → dead URLs loop `onPreviewError` | finder-1 F4 | CONFIRMED (host-pattern dependent) | keyed remount resets phase | per-tile `refreshed` Set (un-keyed owner): a URL `onPreviewError` returned gets one attempt, no refresh |
| F-E | 🔹 double entry into error handling (hydration probe + queued `error`, StrictMode) → `onPreviewError` ×2 | finder-1 F6 · finder-2 F6 | CONFIRMED | guard read the `phase` closure | `phaseRef` guard; probe uses `img.decode()` rejection (no SVG misfire) |
| F-F | 🔸 controlled chain reset on EVERY rail commit → async host (transition/debounce) loses a pending mutation when an unrelated commit (scroll state) lands | finder-1 F5 | CONFIRMED | no-deps layout effect reset `latestRef` | reset only when the rendered list changes identity |
| F-G | 🔸 guide: "to reject, don't apply it — the next render restores" is false when the host doesn't re-render | finder-1 F5 · finder-2 F2 | CONFIRMED (doc) | — | guide/usage/JSDoc: discard by re-rendering a fresh array |
| F-H | 🔹 direction: nearest `[dir]` only — `dir="auto"` / CSS `direction` missed | finder-1 F7 | CONFIRMED | `closest("[dir]")` | computed `direction` (+ nearest explicit non-auto `dir` fallback for jsdom) |
| F-I | 🔹 thresholds are fractions of total scroll (≈45px dead zone on a 100-story rail) | finder-1 F8 | CONFIRMED | `0.005/0.995` | `0.001/0.999` |
| F-J | 🔹 both arrows vanish while one is focused → focus to `<body>` | finder-1 F9 | CONFIRMED | hand-off only to sibling | fallback to the first slide's button |
| F-K | 🔹 arrows hard-centred on the default tile | finder-1 F10 | CONFIRMED | `top-[3.875rem]` | `top-(--story-rail-arrow-top,3.875rem)` + docs |
| F-L | 🔹 runtime controlled↔uncontrolled switch snaps to seed | finder-1 F11 | DROPPED (documented) | standard React contract | docs: don't switch after mount |
| F-M | 🔹 `items` + `defaultItems` warning says "read once" though `items` is ignored | finder-1 F12 | CONFIRMED | seed = `defaultItems ?? items` | second warning text |
| F-N | 🔸 docs/JSDoc claim mouse-wheel scrolling — Embla has none without a plugin | finder-2 F1 | CONFIRMED | no plugin passed; `grep wheel` embla = 0 | guide, usage, types JSDoc, meta corrected; arrows named the desktop path |
| F-O | 🔹 `renderThumbnail` `isUnread=true` for muted+unread (default tile shows grey) | finder-2 F5 | CONFIRMED | `!!item.hasUnread` | additive `helpers.showRing`; `isUnread` stays raw (documented) |
| F-P | 🔹 C9: arrow + Add-tile `transition-colors` not motion-gated | finder-2 F7 | CONFIRMED | grep | `motion-safe:` on all transitions |
| F-Q | 🔹 Add tile aria "Add a story" ⊉ visible "Add story" (WCAG 2.5.3) | finder-2 F8 | CONFIRMED | defaults | default aria "Add story" |
| F-R | 🔹 upgrade table missing 5 visible changes | finder-2 F9 | CONFIRMED | `git diff HEAD -- types.ts` | table extended |
| F-S | 🔹 stale v0.3 statements in description/plan/meta (arrow keys, always-uncontrolled, positional click, "upcoming story-viewer", changelog bullet in features) | finder-2 F10 | CONFIRMED | grep | corrected in place (struck through where historical) |
| F-T | 🔹 SSR end fade on non-overflowing rails until hydration | finder-1 parked · finder-2 F11 | DROPPED (by design, I11) | server can't measure | documented |
| F-U | 🔹 prototype fade value (2rem) not stated | finder-2 F12 | CONFIRMED (doc) | — | guide theming comment |
| F-V | 🔸 CLI 3.8.5 `cssVars.theme` behaviour unproven | finder-2 F4 | DROPPED (refuted at U5) | 3.8.5 writes both mappings into `@theme inline` and never overwrites a consumer value | — |
| F-W | 🔹 tab order put both arrows before the tiles | finder-2 parked | CONFIRMED | DOM order | next arrow moved after the track |

## Runtime & smoke evidence (U5)

- **Build:** `pnpm build` exit 0 (compiled 3.5 min) after U4 fixes.
- **Docs site (`next start`, host-side Playwright, 1440 px + 375 px, light + dark) — 21/21:** start fade hidden / end fade shown at rest; fade 48 px default; unread ring resolves a gradient (token fallbacks); no legacy warning in demos; focused first tile has 4 px top/bottom, 8 px start inside the clip (R5 replayed — ring visible in screenshot); **Tab to an offscreen tile scrolls it into view** (`translate3d(-222px…)`, Embla `watchFocus` → the digest's "no keyboard scroll path" is wrong); arrows: only Next at start → Next scrolls (`-579.9px`) → Prev appears → only Prev at end → Enter-driven focus survives arrow unmount; RTL (ancestor `dir`): Add tile at the right edge, Arabic name/label from rail labels via context (R1 replayed), plus badge bottom-left, chevrons mirrored; Fallbacks: no `<img src="">`, avatar cards for no-preview + stays-broken, `recovers` loads the refreshed URL, muted tile `data-state=muted` (R4 replayed); Controlled: counter 4/6 → 5/7 after parent add, reorder keeps 7 tiles; 0 console/page errors. Screenshots in session scratchpad.
- **Prototype parity (C12):** `/social/home` measured — tile 80×112, 12 px gap, `px-2`, inner `rounded-[14px] border-2 border-card`, dashed Add tile first, amber→red ring. Class-identical anatomy; fade 2 rem in the prototype = `--story-rail-fade-width: 2rem` (default kept 3 rem, decision 2).
- **Install (local `public/r` served, consumer `@ilinxa` remapped, restored after):**
  - CLI **4.18.0**: base exit 0 (8 files), fixtures exit 0 (`dummy-data.ts`), `--color-story-ring-*` written once into `@theme inline`, consumer `tsc` 0 errors (consumer-strict flags). First harness run was killed at its 300 s timeout while pnpm fetched a new upstream dep under host load — re-run warm: 6–9 s.
  - CLI **3.8.5** (the platform's version): base exit 0 (8 files created), fixtures exit 0, mappings written inside `@theme inline`; **negative path:** a consumer-owned `--color-story-ring-from` survived a re-add untouched; consumer `tsc` 0. → closes U4 F-V.
  - Harness note: upstream shadcn base-nova `avatar` now imports `{ cn } from "cn"` (npm package `cn`, declared as its dependency) — not ours; consumer baseline now carries `cn@^0.5.0`.
- **Not covered:** a new-york-style consumer (R12, Part 1); consumer-side render (docs-site production render covers the same source).

## Parked
- Parallel vitest pool times out spawn-based tests under host load (code-block review-regressions, registry-tokens catalog test). Consider per-test timeouts for spawnSync tests. Owner: Part 1 R9 (test harness).
- Served-item version (C10/R10) + new-york consumer smoke (R12) stay Part 1; the platform should be told R10 is not in this ship.
- Prototype parity reference captured (`/social/home`, 1440 + 375): 80×112 tiles, 12 px gap, `px-2`, inner `rounded-[14px] border-2 border-card`, dashed Add tile `rounded-2xl`, Add tile first, ring amber→red (matches the `--warning`→`--destructive` fallback). Our anatomy is class-identical.

- Digest claim "no keyboard scroll path at all" is wrong — verified at U5 (Tab scrolls via Embla `watchFocus`); digest corrected at U6.

## Pre-mortem (U7)

If this breaks for a consumer, it breaks because: real Embla behaviour (snap mapping, `slidesInView` paging, `watchFocus`) drifts in an Embla minor — our tests mock Embla and only the U5 browser pass (not in CI) covers it (follow-up F-02); or a host relies on rejecting a controlled change without re-rendering a fresh array (documented, but easy to miss).
