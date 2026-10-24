# Loop state — `media-carousel` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive API, today's defaults kept; composed by post-card + content-composer) |
| **Current stage** | U1 — contract written, **awaiting user sign-off** |
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
- [ ] U1 Change contract — **sign-off:** pending
- [ ] U2 Implement · [ ] U3 Gates · [ ] U4 Review (1 fresh finder + dependents) · [ ] U5 Runtime & smoke · [ ] U6 Docs & review · [ ] U7 Ship (ask before push)

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
| **content-composer** (`lib/substrates.tsx`) | same | |
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
| I8 | post-card + content-composer compile + render unchanged | | |
| I-neg | 0 items → null; 1 item → no track / dots / buttons; `renderItem` path unchanged | | |

### Size

Artifact today **28.7 KB** vs budget 35. Estimate +8–10 KB source → ≈ 38–40 KB → raise the budget to **45**.

## Slice plan

| # | Slice | Owner | Status | Evidence |
|---|---|---|---|---|
| 1 | types + root + track (dir, controlled index, in-view, neighbour click, counter, labels, logical peek/fades, CSS vars) | architect | pending | |
| 2 | slide renderer + single item (aspect modes, dimensions, `onMediaError` image + video) | architect | pending | |
| 3 | tests (contract kit, MC1–MC7, R1–R5, tr, hydration, axe) | implementer (Sonnet) | pending | |
| 4 | demo + usage + fixtures (RTL / prototype / controlled / error / video) | implementer (Sonnet) | pending | |
| 5 | registry · meta · CHANGELOG · baseline `closed` · trio docs · STATUS | architect | pending | |

## Findings table (U4)

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|

## Runtime & smoke evidence (U5)

## Parked

- Video resume-at-last-time after a URL refresh → video-player loop (VP4).

## Pre-mortem (U7)
