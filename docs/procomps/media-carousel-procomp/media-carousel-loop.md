# Loop state — `media-carousel` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive API, today's defaults kept; composed by post-card + content-composer) |
| **Current stage** | **CLOSED** — `fdcc17b` pushed 2026-10-24 and verified live |
| **Sign-off policy** | user-interactive (2026-10-24: the platform team signed off §4.5 + 3 additions; the user asked for a consistency/accuracy review before confirming) |
| **Version target** | v0.2.1 → **v0.3.0** |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: Sonnet 5 (fresh) |
| **Started / updated** | 2026-10-24 / 2026-10-24 |

Source: request §4.5 (MC1–MC7, `E:/tmp/social-ui-v2/PROUI_HANDOFF.md`) as amended by the digest §media-carousel,
plus the platform's 2026-10-24 additions: (1) video slides — poster before play, only the active slide plays, pausing
when it leaves view, MP4/MOV + H.264 on their side; (2) controlled `index` + `onIndexChange`, the prop wins every
render, default uncontrolled; (3) Turkish locale + RTL demo + C11 kit.

## Stage checklist (U-loop)

- [x] U0 Intake — class + blast radius + reproductions (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-24 ("go" on the contract below, after the consistency/accuracy review; autoplay assumed off)
- [x] U2 Implement · [x] U3 Gates (final: tsc 0 · lint 0 / 13 baseline · meta-deps 64/64 · registry:build 0 · build 0 · tests **1069/1069**, 84 files) · [x] U4 Review (1 fresh finder + dependents: 8 findings, all CONFIRMED; F1–F7 fixed; 26 regression tests, falsified) · [x] U5 Runtime & smoke · [x] U6 Docs & review — [`reviews/2026-10-24-v0.3.0-hardening.md`](reviews/2026-10-24-v0.3.0-hardening.md): **Pass with follow-ups** (7) · [x] U7 Ship — pushed `91b3ea3..fdcc17b` (user OK, 2026-10-24); live on attempt 9 (~9 min): `media-carousel` 0.3.0 with 14 files (the 5 new hooks/lib files present, no `__tests__`, one stamp, as the `index.ts` trailer), 0 bare deps; `media-carousel-fixtures` 0.3.0 with `Big_Buck_Bunny_720_10s_1MB.mp4` and no `videos.pexels`; `post-card` still 0.5.3

## U0 — Intake

**Class: minor.** Everything is additive or a bug fix; defaults kept (locked decision 2). `slideAriaLabel` / `goToSlide`
accept `string | function` (string kept, digest MC3) so no consumer breaks. Behaviour fixes that change output: a
single item in `linear` now honours `aspect` (was always square); the RTL layout follows the resolved direction.

**Scope review (consistency + accuracy of the platform's message vs the code, the request and the digest)**

| Their point | Code today | Verdict |
|---|---|---|
| "Done means" prototype: ~85 % slides + peek, inactive 95 % scale / 60 % opacity, centred dots, 16 px active pill | `flex-[0_0_85%]`, `scale-95 opacity-60`, dots centred bottom, active `w-4` (16 px) — **already the defaults**, plus `blur-[1px]` on inactive slides | consistent; only the blur differs → kept as default, exposed as `--media-carousel-inactive-blur` (set `0px` for the prototype) — locked decision 2 |
| MC7 "nav buttons only on fine pointers" | buttons on every pointer | changing it would change a default → opt-in `showNavButtons="fine-pointer"` (story-rail `arrows` precedent) |
| Video "works with video-player as the slide renderer" | built-in video slides already render `<VideoPlayer>` | consistent — already true |
| "poster image shown before play" | `poster` forwarded to `<video poster>` | already true; `preload="metadata"` without a poster shows the first frame |
| "only the active slide plays" | video-player pauses when its slide goes inactive (`useVideoState`, `isActive`) | already true |
| "pausing when it leaves view" | nothing pauses when the carousel scrolls out of the viewport | **gap** → IntersectionObserver: below ~50 % visible, every slide is treated as inactive |
| (implicit) autoplay | `autoPlay` false | assumption: no autoplay — the viewer starts playback |
| MC4 "video resumes at its last time through the player, VP4" | VP4 is video-player's request item (next loop) | **dependency** → this loop: a refreshed video URL reloads from the start; resume-at-time lands with video-player's loop |
| MP4/MOV + H.264 | no format handling here | nothing to build (their side) |
| Controlled `index` + `onIndexChange`, prop wins every render | uncontrolled only (`onSlideChange` + handle) | additive; consequence stated: a swipe the parent does not adopt snaps back |
| Turkish locale + RTL demo + C11 kit | none | same package as engagement-bar |

**Also owed (digest / found in U0):** single-item `linear` ignores `aspect`; gallery peek uses physical inline
`marginLeft` / `marginRight`; arrow keys and chevrons follow the `rtl` prop while Embla may disagree; edge fades are
physical (`dir-ok` escapes) and `from-background`; transitions not reduced-motion gated; 5 baseline rows
(template-fill 2, jsx-literal 3 — all in `parts/carousel-track.tsx`).

**Blast radius**

| Surface | Why touched | Synced (U6) |
|---|---|---|
| `src/registry/components/media/media-carousel/**` | the change | |
| `registry.json` media-carousel item (+ `-01` alias) | new files (`hooks/use-direction.ts`, maybe `hooks/use-in-view.ts`, `lib/`) | |
| `scripts/contract-baseline.json` | delete 5 rows; add `media-carousel` to `closed` | |
| `CHANGELOG.md`, trio docs (+ guide upgrade notes), STATUS, component-versions | 0.3.0 | |
| **post-card** (feed + detail variants render `<MediaCarousel>`) | must compile + render unchanged; no file change planned | |
| ~~content-composer~~ | **corrected in U2:** its `mediaCarouselSlot` mounts `carousel-composer`, not `MediaCarousel` — not a dependent | n/a |
| video-player | read-only dependency (`VideoPlayer`, `useDoubleTap`); its `__tests__` reference the shared double-tap hook | |

**Reproductions (write-before-fix, replayed at U5)**

| # | Input | Today | Expected |
|---|---|---|---|
| R1 (MC1 + digest) | single item, `variant="linear" aspect="video"` | square | 16:9 |
| R2 (MC6) | `<div dir="rtl">` ancestor, no prop | slides LTR, → goes next | slides RTL, → goes previous, chevrons and nav sides agree |
| R3 (MC7) | click the peeking next slide | nothing (`inert`) | scrolls to it |
| R4 (video) | play a video, scroll the carousel off-screen | keeps playing | pauses |
| R5 (MC4) | image URL 403 | broken image | `onMediaError` once → retried with the returned URL; second failure → no second call |

## U1 — Change contract (for sign-off)

**Items + media (MC1, MC2, C8)**
- `MediaItem` gains optional `width`, `height`, `srcSet`, `sizes` (image + video); the built-in `<img>` gets them +
  `decoding="async"`; `<video>` gets `width` / `height`.
- `aspect` gains `"natural-clamped"` (plus `minRatio` default 4/5, `maxRatio` default 1.91) and now applies to all
  variants and the single-item path. Default stays `"square"` (locked). Ratio source: the first item's `width` /
  `height`; when absent, its loaded natural size (square placeholder until then — one layout change, documented).
  Gallery: every slide uses the first item's clamped ratio.

**Labels + counter (MC3, MC5, C2)**
- `slideAriaLabel: string | ((index, total) => string)`, `goToSlide: string | ((index) => string)` — the string
  forms stay as deprecated aliases (template kept under the `template-ok` escape, same rule as engagement-bar D1).
- New labels: `counter(index, total)`, `carouselRoleDescription`, `slideRoleDescription`; `defaultMediaCarouselLabels`
  (old `DEFAULT_MEDIA_CAROUSEL_LABELS` kept as an alias); `undefined` never erases a default.
- `showCounter?: boolean` (default false) — a chip with `labels.counter(n, N)`, numbers through `locale`.
- `locale?: string` (default "en", invalid tags fall back) for the counter numbers.

**Media errors (MC4, C8)**
- `onMediaError?: (item) => Promise<string | void>` for images and videos: a resolved string replaces the URL and
  retries once; a second failure does not call again; a new `url` from the host resets it. Video restarts from 0
  (resume-at-time = video-player VP4, next loop).

**Direction (MC6, C4)**
- `dir?: "ltr" | "rtl"`; else the element's direction after mount (`useDirection` snippet). `rtl` kept as a
  `@deprecated` alias. Embla `direction`, arrow keys, chevrons and nav-button sides all follow the one resolved value.
- Peek margins and edge fades become logical (`marginInlineStart/End`, `start-0` / `end-0`, gradient flipped under
  `rtl:`); the `dir-ok` escapes go away.

**Interaction + look (MC7, C9)**
- Clicking / tapping a peeking neighbour scrolls to it; its content stays out of the tab order and accessibility tree.
- `showNavButtons?: boolean | "fine-pointer"` (default `true`, today); `"fine-pointer"` renders them only under
  `(pointer: fine)`, resolved after mount.
- CSS variables with today's values as defaults: `--media-carousel-fade` (`var(--background)`),
  `--media-carousel-inactive-blur` (`1px`). Documented: the platform prototype = `--media-carousel-inactive-blur: 0px`.
- All transitions `motion-safe:`.

**Video (platform addition 1)**
- Slides are inactive while the carousel is less than ~50 % in the viewport (IntersectionObserver; SSR + first render
  = visible), so the playing video pauses when the post scrolls away. No autoplay. Poster before play (already).

**Controlled index (platform addition 2, C5)**
- `index?: number` + `onIndexChange?: (index) => void` — controlled when both are passed; the prop wins on every
  render (a swipe calls back, and snaps back unless the parent adopts it); `defaultIndex?: number` for uncontrolled
  start. `onSlideChange` keeps firing as today. Handle unchanged.

**Tests + demo (platform addition 3, C11)**
- `describeContract` kit (Embla mock, as story-rail), `locale="tr"` counter, hydration, RTL; a test per MC1–MC7 accept
  line and R1–R5; axe. Demo: RTL tab in `<div dir="rtl" lang="ar">`, prototype tab (blur 0, counter, `fine-pointer`),
  controlled-index tab, error-refresh tab, video tab.

### Contract matrix

| Rule | v0.3.0 |
|---|---|
| C1 tokens | `bg-primary` dots kept; fade colour via a CSS var; no palette |
| C2 labels | all strings + role descriptions in labels; functions for values; 3 jsx-literal + 2 template-fill rows closed |
| C3 formatting | `locale` for the counter numbers |
| C4 direction | resolved `dir`; logical peek + fades; RTL demo |
| C5 controlled | `index` / `onIndexChange` / `defaultIndex` |
| C6 counts | n/a (the counter is position, not a withheld count) |
| C7 slots | `renderItem` (exists) |
| C8 media | dimensions, srcSet/sizes, decoding, `onMediaError` |
| C9 runtime | `fine-pointer` after mount, IntersectionObserver in an effect, motion-safe |
| C10 | 0.3.0 + CHANGELOG + installs on CLI 3.8.5 / 4.18.0 |
| C11 | contract kit + per-item tests + axe |
| C12 | prototype parity = defaults + `--media-carousel-inactive-blur: 0px` |

### Invariants

| # | Invariant | U4 | U5 |
|---|---|---|---|
| I1 | No new props → same DOM / visuals as 0.2.1 (except: linear single item honours `aspect`, transitions motion-gated) | | |
| I2 | `natural-clamped`: 3:4 → 4:5, 16:9 → 16:9, 3:1 → 1.91:1, single item same rule | | |
| I3 | Controlled `index` wins every render; uncontrolled default unchanged; `onSlideChange` unchanged | | |
| I4 | Only the active, in-view slide's video can play | | |
| I5 | RTL (prop or ancestor): Embla direction, keys, chevrons, nav sides, peek, fades all agree | | |
| I6 | Neighbour click scrolls; neighbours not focusable / not in the a11y tree | | |
| I7 | `onMediaError` once per URL; second failure no call | | |
| I8 | post-card compiles + renders unchanged | | |
| I-neg | 0 items → null; 1 item → no track / dots / buttons; `renderItem` path unchanged | | |

### Size

Artifact today **28.7 KB** vs budget 35. Estimate +8–10 KB source → ≈ 38–40 KB → raise the budget to **45**.

**U3 actual: 49.95 KB** (before the U4 fixes) — the estimate was low (+21 KB: five new modules, typed function labels, JSDoc). Budget raised to **55** (architect, U3); the size gate reports it, it does not fail on it.

## Slice plan

| # | Slice | Owner | Status | Evidence |
|---|---|---|---|---|
| 1 | types + root + track (dir, controlled index, in-view, neighbour click, counter, labels, logical peek/fades, CSS vars) | architect | done | tsc 0 · eslint 0 · contract gate clean, baseline −5 (template-fill 25, jsx-literal 635) · post-card + media tests 48/48 |
| 2 | slide renderer + single item (aspect modes, dimensions, `onMediaError` image + video) | architect | done | same run; new files `hooks/use-direction.ts`, `hooks/use-environment.ts`, `hooks/use-media-recovery.ts`, `lib/aspect.ts`, `lib/labels.ts` added to registry.json (14 files) |
| 3 | tests (contract kit, MC1–MC7, R1–R5, tr, hydration, axe) | implementer (Sonnet) | pending | |
| 4 | demo + usage + fixtures (RTL / prototype / controlled / error / video) | implementer (Sonnet) | pending | |
| 5 | registry · meta · CHANGELOG · baseline `closed` · trio docs · STATUS | architect | pending | |

### Contract clarifications made in U2 (architect; within the signed scope)

- **K1 `inView` is its own context field.** `RenderItemContext` gains `inView`; `isActive` keeps meaning "the centred
  slide", so a half-scrolled post does not dim / blur / `inert` its active slide. The built-in video plays only on
  `isActive && inView`; a custom `renderItem` video should use the same condition (documented on the type).
- **K2 media attributes.** `srcSet` / `sizes` exist on the image arm only (`<video>` has none). `<video>` gets no
  `width` / `height`: `VideoPlayer` does not take them and is read-only in this loop, so a video's dimensions feed the
  frame ratio only. A recovered image URL drops `srcSet` / `sizes` (they would point at the expired variants).
- **K3 controlled = `index !== undefined`** (the C5 template's rule; `index` without `onIndexChange` is read-only). The
  snap-back runs on Embla `settle` (and when the prop changes), so a drag in progress is never yanked.
  `onIndexChange` is silent for the settle-back and for a prop-driven scroll.
- **K4 neighbour click.** `inert` moved to the slide's content; the wrapper carries `aria-hidden` when inactive and takes
  the click (an inert node is not a pointer target, so the click lands on the wrapper). A click ending a drag never
  arrives: Embla stops it in the capture phase on its root.
- **K5 `rtl` alias** is honoured only when set (`rtl={false}` still forces LTR, as in 0.2); unset → resolved direction.
  The root gets `dir` only when the direction is explicit, so an inherited one is never overridden.
- **K6 single item** gets `role="group"` (its `aria-label` sat on a role-less div — an ARIA-prohibited name).
- **K7 `aspect` in a gallery.** 0.2 ignored `aspect` for galleries; it now applies. A host passing `aspect` with
  `variant="gallery"` sees the frame change — CHANGELOG says so. post-card passes none.

## Findings table (U4)

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|
| F1 ⚠️ | Changing `loop` / `variant` / `dir` re-inits Embla with our options; `startIndex` in them wins over the current slide → jumps to the start; no `select` fires, so dots / `isActive` go stale; controlled mode did not correct | finder 1 | CONFIRMED | `embla-carousel.esm.js` `reActivate`: `mergeOptions({ startIndex: selected }, withOptions)` — caller wins; `embla-carousel-react` re-inits with the full stored options on change. (Resize re-inits pass no options → unaffected.) 0.2.1 passed no `startIndex` | store subscribes to `reInit`; a `reInit` listener jumps back to the last index (`scrollTo(last, true)`, silent); controlled `correct()` also on `reInit` |
| F2 🔸 | A carousel taller than twice the viewport never reaches ratio 0.5 → `inView` false forever → the video can never play | finder 1 | CONFIRMED | `ratio >= 0.5` only, thresholds `[0, .5, 1]` | in view also when the visible part covers ≥ half the viewport (`intersectionRect.height ≥ rootBounds.height × 0.5`); 21 threshold steps so that is re-evaluated |
| F3 🔸 | An image that loaded / failed before hydration fires no handler: `natural-clamped` stays square, `onMediaError` never runs (SSR pages) | finder 1 | CONFIRMED (defensive — the event is not replayed for an `<img>` that completed before React attached) | no `complete` check anywhere | effect reads `img.complete`: width > 0 → natural size; width 0 → `img.decode()` rejection = broken (a loaded SVG without intrinsic size decodes fine, so it is not misreported) |
| F4 🔹 | First item removed / reordered: the new first image is already loaded → no `load` → frame square forever | finder 1 | CONFIRMED | `onNaturalSize` only attached to index 0; no event follows | same effect as F3 (re-runs when `onNaturalSize` attaches) |
| F5 🔹 | `dir="ltr"` inside an RTL page: chevrons rotate and fades flip — Tailwind `rtl:` also matches `[dir=rtl] *` | finder 1 | CONFIRMED | tailwind 4.2.4 variant `&:where(:dir(rtl), [dir="rtl"], [dir="rtl"] *)` | root `group/media-carousel` + `data-dir={dir prop}`; `group-data-[dir=ltr]/media-carousel:` overrides (higher specificity than `:where`). Inherited LTR-inside-RTL wrappers (no prop) keep the Tailwind limitation — pass `dir` |
| F6 🔹 | StrictMode replays the mount effect → the first-run flag is consumed → `onSlideChange` / `onIndexChange` fire on mount | finder 1 | CONFIRMED (pre-existing for `onSlideChange`; new for `onIndexChange`) | ref survives the StrictMode remount | last-notified index instead of a flag |
| F7 🔹 | Single item ignores `dir` (no attribute on its root) | finder 1 | CONFIRMED | `SingleItem` had no `dir` | passes + writes the explicit direction |
| F8 🔹 | Test gaps: fake Embla has no `reInit`; the neighbour-click test cannot exercise inert hit-testing / Embla's capture guard; no tall-element / pre-hydration cases | finder 1 | CONFIRMED | `__tests__/support.tsx` | regression tests for F1–F7 (test author, round 2); browser-only behaviour proven at U5 (Playwright) |

## Runtime & smoke evidence (U5)

- **Browser — 62/62** (Playwright on `next start`, light + dark at 1440, mobile emulation 390, post-card page):
  neighbour click scrolls (hit test lands on the wrapper of "Slide 2 of 5"); a drag starting on the neighbour is not
  a click; inactive slides `aria-hidden` + content `inert`; ArrowRight / Home; LTR fade `to right`, default blur
  `1px`; prototype tab blur `0px`, counter "1/4", fine-pointer buttons on desktop and none under mobile emulation,
  natural-clamped frame 1.50; RTL (ancestor): computed `rtl`, no `dir` written, slide 2 left of slide 1, ArrowLeft →
  next, chevrons `rotate: 180deg`, start fade `to left`; Turkish slide names; controlled: external Next → 1, locked
  ArrowRight settles back to 1; error tab: one `onMediaError`, replaced image loads; video: plays, pauses when the
  page scrolls it away; no horizontal scroll at 390; post-card: carousel renders, frames square; no console errors.
- **Found by U5:** the fixtures' sample video URL was a **404** (in 0.2.1 too) → replaced with video-player's Big
  Buck Bunny clip; the gallery counter sat over the peeking neighbour → inset by the peek (`end-[calc(7.5%_+_0.75rem)]`).
  First run's 2 gallery "failures" were the probe (its dot filter caught the video's Unmute button).
- **Installs — 2/2 CLIs** (3.8.5, 4.18.0; new-york `src/` consumer): `media-carousel` 0.3.0, `-fixtures` 0.3.0,
  `post-card` 0.5.3 (+ video-player, expandable-text, engagement-bar, comment-thread), consumer tsc 0.
- **Invariants:** I1 (defaults: blur 1px, square post-card frames, unchanged tests) · I2 · I3 · I4 · I5 · I6 · I7 · I8
  (post-card compiles, installs, renders) · I-neg — each covered by tests named in the review; I4–I6 also in the browser.

## Parked

- Video resume-at-last-time after a URL refresh → video-player loop (VP4).

## Pre-mortem (U7)

If this breaks for a consumer, it breaks because: a host passed `aspect` to a gallery and relied on 0.2 ignoring it
(K7 — CHANGELOG + upgrade table say so); or a real touch device treats the neighbour tap / swipe differently from
Chromium emulation (review R-02); or a host's custom `renderItem` video keeps playing off-screen because it reads
only `isActive` (K1 — documented on the type and in the guide).
