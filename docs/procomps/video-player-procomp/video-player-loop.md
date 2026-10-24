# Loop state — `video-player` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop, run C (change class: **minor** — additive API, today's defaults kept except where stated; composed by media-carousel, story-viewer, media-library, and post-card through media-carousel) |
| **Current stage** | U7 — committed locally; push awaits the user's OK |
| **Sign-off policy** | user-interactive (sign-offs from earlier loops do not carry over) |
| **Version target** | v0.2.2 → **v0.3.0** (+ media-carousel v0.3.0 → v0.3.1 for R-03 / R-06) |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: Sonnet 5 (fresh) |
| **Started / updated** | 2026-10-24 / 2026-10-24 |

## Stage checklist (run C)

- [x] U0 Intake — class, blast radius, reproductions (below)
- [x] U1 Change contract — consistency review (8 corrections) · **sign-off:** user 2026-10-24 ("review them your self … then go ahead"); seek-bar default delegated → on
- [x] U2 Implement (slice table below) · [x] U3 Gates (final: tsc 0 · lint 0 / 13 baseline · meta-deps 64/64 · registry:build 0 · build 0 · tests **1267/1267**, 99 files) · [x] U4 Review (1 fresh finder + 2 test authors: 14 rows, all CONFIRMED; 12 fixed + F13 documented; regression tests falsified 13/13) · [x] U5 Runtime & smoke (browser **49/49**; 3 more defects found and fixed — below; installs 2/2 CLIs) · [x] U6 Docs & review — [`reviews/2026-10-24-v0.3.0-hardening.md`](reviews/2026-10-24-v0.3.0-hardening.md): **Pass with follow-ups** (6) · [ ] U7 Ship (ask before push)

## Run C — consumer hardening (request §5.1 VP1–VP8, digest §video-player)

Source: request §5.1 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md`, outside the repo) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md` §video-player — it wins). Carried in: media-carousel review
R-03 (resume after a URL refresh) and R-06 (arrow keys from video controls move the carousel); the `window.matchMedia`
call in `parts/default-controls.tsx:20,28`.

### U0 — Intake

**Class: minor.** Every new prop is additive. Visible changes to today's default render are listed under I1. The
locked defaults stay: `loop = true`, `muted = true`, `preload = "metadata"`, `controlsAutoHideMs = 2000`, no fullscreen
button (plan Q-P8), and Space / M only while the player is focused (Q-P4).

**Scope check (request + digest vs the code at `fdcc17b`)**

| Item | Code today | Verdict |
|---|---|---|
| VP1 seek bar + time | `currentTime` / `duration` in state; no bar, no `seek()`, no handle | confirmed. The digest adds "no handle at all" |
| VP2 fullscreen | no `requestFullscreen` in the folder | confirmed; 🔒 Q-P8 → opt-in prop, default off |
| VP3 captions | `<track>` renders (`video-element.tsx:86`); no control | confirmed. Also: no `crossOrigin` (a signed-CDN VTT will not load), and **the fixture's VTT URL is a 404** (`example.com/captions/sample-en.vtt`, checked in U0) |
| VP4 buffering / error / resume | `onError` callback only (`use-video-state.ts:155`); no UI | confirmed. **R-03:** media-carousel already swaps `src` after an error. The player should resume on that path too, not only through its own hook |
| VP5 autoplay in view | no IntersectionObserver | confirmed; opt-in |
| VP6 wake | the overlay with `onMouseMove` is `pointer-events-none` (`default-controls.tsx:73`); the mute button stays clickable while invisible (`:106`) and stays in the tab order | confirmed. Also: `hidden` is not reset on pause / play, and there is no touch wake |
| VP7 double tap | wrapper `onClick={handleDoubleTap}` + video `onClick={onTogglePlay}` both run | confirmed (control-tap bubbling already fixed in 0.2.1). Digest lock: do not change `useDoubleTap`'s exported single-tap timing |
| VP8 progress / defaults | `onTimeUpdate` already reports media time; `loop = true` makes `onEnded` dead | partly confirmed: only `buffered` is missing. 🔒 loop default kept. The `preload="none"` default conflicts with VP1's idle duration badge → keep `"metadata"` |
| matchMedia | `window.matchMedia(...)` behind `typeof window` only; throws where `matchMedia` is missing (jsdom) | guard + `mockMatchMedia` in tests |
| R-06 | media-carousel's region `onKeyDown` sees bubbled keys | fixed on both sides (see contract) |
| Contract gate | **0 baseline rows** (checked); not in `closed` | closing = add to `closed` + RTL demo + kit tests |

**Blast radius**

| Surface | Why touched | Synced (U6) |
|---|---|---|
| `src/registry/components/media/video-player/**` | the change; new `parts/*`, `hooks/*`, `lib/*` files | |
| `registry.json` video-player item (+ `video-player-01` alias, `-fixtures`) | roster gains the new files; fixtures get a working VTT | |
| `scripts/contract-baseline.json` | add `video-player` to `closed` (0 rows to remove) | |
| **media-carousel** (`parts/slide-renderer.tsx` renders `<VideoPlayer>` with `isActive`, `poster`, `onDoubleTap`, `onError`; two parts import `useDoubleTap`) | seek bar shows in video slides; single tap is deferred when `onDoubleTap` is set (VP7); R-03 resume needs no carousel change (the player resumes on a post-error `src` swap); **R-06 is a carousel patch → 0.3.1** | |
| **story-viewer** (`parts/item-view.tsx`: `controls={false}`, `loop={false}`, `autoPlay`, `muted={isMuted}`, `isActive={!isPaused}`, `onEnded`) | must not change. ⚠️ Its arrow keys go through `useGlobalKeydown`, which skips already-handled events. If a focused `<video>` handled ← / → it would block story navigation → seek keys bind only when controls render (I9) | |
| **media-library** (`parts/file-preview.tsx`: lazy `VideoPlayer` with `poster` + `controls`) | gains the seek bar; lazy boundary must stay | |
| **post-card** (through media-carousel) | compiles + renders; a video post gains the seek bar | |
| `CHANGELOG.md`, trio docs (description scope, plan API, guide + upgrade notes), STATUS, component-versions | 0.3.0 | |

**Reproductions (write before the fix, replayed at U5)**

| # | Input | Today | Expected |
|---|---|---|---|
| R1 (VP6) | playing, controls hidden; move the pointer over the video | nothing | controls show |
| R2 (VP6) | playing, controls hidden; click where the mute button is | mute toggles | no toggle (the click reaches the video) |
| R3 (VP7) | `onDoubleTap` set; two clicks on the video within 300 ms | plays, then pauses, + `onDoubleTap` | `onDoubleTap` once; play state unchanged |
| R4 (VP4 / R-03) | play to 30 s; `error`; host swaps `src` | restarts at 0, paused | resumes at 30 s, playing |
| R5 (VP3) | `tracks` with one non-default track | no way to show it | toggle flips `mode` showing ↔ hidden |
| R6 (R-06) | media-carousel with a video slide; focus the seek bar; press → | video seeks **and** the carousel moves | video seeks only |
| R7 (matchMedia) | render in an environment without `window.matchMedia` | throws | renders; motion treated as allowed |

### U1 — Change contract (for sign-off)

**Structure (compound rule — ≥ 3 mountable regions after this change)**
- `VideoPlayer` stays the one-line assembly. It is also the provider: the `<video>` is required, so it owns the state,
  context and handle. No separate `Root`.
- New flat parts that read the player's context, usable inside `renderControls`: `VideoPlayerPlayButton`,
  `VideoPlayerMuteButton`, `VideoPlayerSeekBar`, `VideoPlayerTime`, `VideoPlayerFullscreenButton`,
  `VideoPlayerCaptionsButton`, `VideoPlayerStatus` (buffering + error overlay). `DefaultControls` = these parts plus
  the layout. Example: `renderControls={() => <><VideoPlayerSeekBar /><VideoPlayerMuteButton /></>}` builds a lighter
  overlay. `renderControls(state)` keeps its signature.
- Handle (`ref`, React 19 ref-as-prop): `play()`, `pause()`, `seek(seconds)`, `toggleMute()`, `toggleFullscreen()`.
  No element getter (plan Q-P7: the `<video>` ref is not leaked — review U1-3).

**VP1 — seek bar + time (C2, C3, C4)**
- `VideoPlayerSeekBar`: `role="slider"`, value from media time (`timeupdate`, rAF-throttled as today), buffered
  ranges drawn behind it. Pointer drag and click set `currentTime`. ← / → step `seekStep` (default 5 s), Home / End.
  Under RTL the bar fills from the right and → seeks backward. `aria-valuetext = labels.position(current, total)`.
- Elapsed / total through `formatDuration` (default `m:ss` / `h:mm:ss`, digits via `Intl.NumberFormat(locale)`);
  `locale?: string` (default `"en"`, invalid tags fall back). The idle duration badge shows while not started, once
  the duration is known. New `durationHint?: number` for `preload="none"` feeds.
- `seek(seconds)` on the state and the handle. On the `<video>` itself, ← / → seek only when controls render (I9).
- Shown by default; `showSeekBar?: boolean` (default `true`) and `showTime?: boolean` (default `true`) turn them off.
  **Decision for you (below).** The prototype's bottom-corner pause and mute buttons stay where they are.

**VP2 — fullscreen (🔒 Q-P8 → opt-in)**
- `showFullscreen?: boolean` (default `false`). The button calls the container's `requestFullscreen`, or the
  `<video>`'s `webkitEnterFullscreen` (iOS). With neither, it does not render. Labels `fullscreen` / `exitFullscreen`,
  `aria-pressed`. `isFullscreen` and `toggleFullscreen` go on the state.

**VP3 — captions**
- Rendered when `tracks` is not empty. One track: a toggle that flips `textTracks[i].mode` between `showing` and
  `hidden`. Several tracks: a hand-rolled menu (`menuitemradio`, arrows / Home / End / Escape) with "Off" plus each
  track. It is not the shadcn DropdownMenu, so there is no Radix / Base UI divergence (F-cross-13).
- `crossOrigin?: "anonymous" | "use-credentials"` passed to `<video>`. Default unset: setting it would break videos
  served without CORS, such as test-videos.co.uk.
- Fixtures: replace the 404 VTT with MDN's `friday.vtt` + `friday.mp4` (both `access-control-allow-origin: *`,
  checked).

**VP4 — buffering, error, refresh + resume (C8, R-03)**
- A spinner on `waiting` / `stalled`, cleared on `playing` / `canplay`, with `labels.buffering` as its accessible
  name. It respects reduced motion.
- An error overlay with `labels.error` + a Retry button (`labels.retry`).
- `onMediaError?: (src: string) => Promise<string | void> | string | void`, asked once per `src`. A resolved URL
  replaces `src`. A second error shows the overlay and does not ask again. A new `src` from the host starts over.
- **Resume:** at an error the player records `currentTime` and whether it was playing. When the refreshed source
  loads (the hook's URL, or a host `src` that arrives while the hook is pending — media-carousel's echo), it seeks
  back and resumes if it was playing and `isActive`. Any other new host `src` is different media and starts at 0
  (**amended in U4, F6** — the earlier "any host swap after an error resumes" carried one video's position into the
  next). `onError` keeps firing as today.

**VP5 — autoplay in view (opt-in)**
- `autoPlayInView?: boolean` (default `false`): plays at `autoPlayThreshold` (default 0.5) visibility, pauses
  when it leaves view. It starts muted (sets the element muted) unless `muted` is controlled to `false`; then it tries
  to play and a rejected `play()` is ignored (review U1-5). `autoplayGroup?: string`: at most one player plays per group, and a player that starts
  pauses the others. Off under `prefers-reduced-motion`. Never plays while `isActive` is false.

**VP6 — wake + hidden controls**
- Pointer movement, tap and focus inside the root container wake the controls. Hidden controls are not clickable
  (`pointer-events-none`). Focusing a hidden control wakes the controls, so keyboard users never act on an invisible
  button. `hidden` resets on every play / pause transition.

**VP7 — double tap**
- With `onDoubleTap`, a single tap on the video is deferred by the 300 ms window, then toggles playback. A double tap
  calls `onDoubleTap` and never toggles. Without `onDoubleTap`, a single tap toggles immediately, as today.
- Built as an additive `onSingleTap` option on `useDoubleTap`. Without it the hook's timing is unchanged (digest
  lock; media-carousel's own two uses keep their behaviour).

**VP8 — progress + defaults**
- `onProgress?: ({ currentTime, duration, buffered }) => void`. `buffered` is `{ start, end }[]`. rAF-throttled, and
  also fires on the `progress` event.
- `loop`: when `onEnded` is passed and `loop` is not, `loop` defaults to `false`; otherwise `true` as today. Without
  this, `onEnded` with the default `loop` never fires (an inert surface). CHANGELOG note.
- `preload` default stays `"metadata"` (digest: `"none"` conflicts with the idle duration badge). The guide shows
  `preload="none"` + `durationHint` for long feeds. **The request's accept line "with a poster, `preload="none"`" is
  not adopted**; the report-back says so (review U1-6).

**Controlled data (C5) — the kit's controlled check**
- `onMutedChange?: (muted: boolean) => void`. With it, `muted` is controlled: the prop wins on every render, and a mute
  click calls back without changing the element unless the parent adopts it. This covers a feed-wide "sound on"
  preference. Without it `muted` works as today (story-viewer unchanged).
- Playback is **not** made controlled: a browser can refuse `play()`, so "the prop wins" cannot be honoured. Hosts
  pause through `isActive` (exists) and the handle.

**Labels (C2)**
- New keys: `seek`, `position(current, total)`, `durationBadge(total)`, `fullscreen`, `exitFullscreen`, `captions`,
  `captionsOff`, `captionsMenu`, `buffering`, `error`, `retry`. Functions for anything with a value.
- `defaultVideoPlayerLabels`; `DEFAULT_VIDEO_PLAYER_LABELS` stays as a deprecated alias (engagement-bar /
  media-carousel precedent). `undefined` never erases a default.

**Direction + runtime (C4, C9)**
- `dir?: "ltr" | "rtl"`, else the element's direction after mount (`useDirection` snippet). The control layout is
  already logical.
- `matchMedia` guarded. Fullscreen and IntersectionObserver are touched only in effects and handlers. Transitions are
  `motion-safe:`.

**media-carousel 0.3.1 (patch, same loop)**
- R-06: the region's `onKeyDown` ignores events already handled (`defaultPrevented`) and events from interactive
  descendants. The player's seek keys call `preventDefault`.
- R-03: built-in video slides forward the carousel's recovery through the player's `onMediaError` (the recovery hook
  gains a promise-returning `request(item)`; ask-once per item + URL stays in the carousel). The player then shows
  the buffering state, not the error overlay, while the refresh is pending, and resumes at the old time (review U1-2).
  The guide's "video restarts from 0" line is updated.
- **Single-item double tap (review U1-1):** `SingleItem` wraps the slide in its own `useDoubleTap` and passes
  `onDoubleTap={undefined}` to the player, so a single video post still plays → pauses on a double tap even after
  VP7. Fix: the wrapper handles images only; video slides pass `onDoubleTap` to the player (as `CarouselTrack` does).

**Tests + demo (C11)**
- `describeContract` kit (media stubs, `mockMatchMedia`, `mockIntersectionObserver`); `locale="tr"` time text;
  hydration; RTL. One test per VP1–VP8 accept line and per R1–R7. axe over idle, playing, buffering, error and
  captions-menu states.
- Demo tabs: RTL in `<div dir="rtl" lang="ar">`, captions, error-refresh, autoplay group, composed (lighter) controls.
  Screenshots of idle, playing with controls, buffering and error states (request "done means").

### Contract matrix

| Rule | v0.3.0 |
|---|---|
| C1 tokens | spinner / error overlay / idle badge on `bg-media-overlay` + `text-media-overlay-foreground` (`cssVars.theme` + fallback); the letterbox frame keeps `bg-black` (media backdrop, tolerated by the gate; `--media-overlay` is a 55 % scrim, not a fill — review U1-4); corner buttons keep `bg-background/70` (prototype) |
| C2 labels | all strings in typed labels, functions for values |
| C3 formatting | `locale` + `formatDuration` |
| C4 direction | resolved `dir`; RTL seek; logical layout; RTL demo |
| C5 controlled | `muted` + `onMutedChange` |
| C6 counts | n/a |
| C7 slots | `renderControls` + flat parts |
| C8 media | `onMediaError` + resume; `crossOrigin`; `onProgress` with media time + buffered |
| C9 runtime | guarded `matchMedia`; effects only; `motion-safe` |
| C10 | 0.3.0 + CHANGELOG + installs on CLI 3.8.5 / 4.18.0 |
| C11 | kit + per-item tests + axe |
| C12 | prototype corner buttons kept |

### Invariants

| # | Invariant | U4 | U5 |
|---|---|---|---|
| I1 | No new props → same as 0.2.2 **except** the seek bar + time (if default on), the idle duration badge, hidden controls no longer clickable, single tap deferred only when `onDoubleTap` is set | | |
| I2 | `timeupdate` at 30 s of 120 s → thumb at 25 %; → / drag set `currentTime`; RTL → seeks backward; `aria-valuetext` = label output | | |
| I3 | Fullscreen: container `requestFullscreen` → called; only `webkitEnterFullscreen` → that; neither → no button | | |
| I4 | One track: toggle flips `mode`; no tracks → no control | | |
| I5 | `waiting` shows the spinner, `playing` hides it; `error` → `onMediaError` once; new `src` → `currentTime` restored; second error → overlay, no call | | |
| I6 | Autoplay group: entering view plays, leaving pauses, a second player pauses the first; reduced motion → none | | |
| I7 | Double tap within the window → `onDoubleTap` once, play state unchanged; single → toggles after the window | | |
| I8 | `onMutedChange` → prop wins every render; without it → 0.2.2 behaviour | | |
| I9 | `controls={false}` → no overlay at all (no spinner, no error overlay) and the `<video>` consumes no arrow keys (story-viewer navigation intact); Space / M as today (Q-P9) | | |
| I11 | media-carousel: a single video post — double tap → `onDoubleTap` once, play state unchanged; ← / → from the seek bar never move the carousel; a refreshed video resumes at its time | | |
| I10 | Dependents compile + render: media-carousel, story-viewer, media-library (lazy boundary kept), post-card | | |
| I-neg | no `matchMedia` / no IntersectionObserver / no Fullscreen API → renders, features off | | |

### Size

Artifact today **25.26 KB** vs budget 30. Estimated with the media-carousel retro rule (new modules × ~4 KB): ~13
new modules (context, 7 parts, direction / autoplay-group / fullscreen / recovery hooks, duration formatter) + growth
of the 6 existing files → **≈ 75–85 KB** → budget **90** (review U1-8; recorded here, the size gate reports it at U3).

### U1 consistency review (architect, 2026-10-24 — at the user's request, before "go")

Every contract line was re-checked against the code at `fdcc17b`, request §5.1 (each accept line), the digest
§video-player and its locked decisions, plan locks Q-P1–Q-P10, the dependents' call sites (read, not grepped by
name), and the last two retros. Result: **8 corrections, all applied to the contract above.**

| # | Inconsistency found | Evidence | Correction |
|---|---|---|---|
| U1-1 | A single video post keeps the VP7 bug: `SingleItem` wraps it in its own `useDoubleTap` and gives the player `onDoubleTap={undefined}`, so the player's single tap still toggles at once | `media-carousel/parts/single-item.tsx:54-72` (vs `carousel-track.tsx:106-119`, which already splits image / video) | media-carousel 0.3.1: wrapper = images only; video → player |
| U1-2 | With the carousel's recovery on `onError`, the player would flash its error overlay until the host swaps `src` | `slide-renderer.tsx:117` + `use-media-recovery.ts` (no promise exposed) | carousel forwards through the player's `onMediaError`; buffering state while pending |
| U1-3 | The handle's `video` element getter contradicts plan Q-P7 (no ref leak) | plan `:19` | dropped |
| U1-4 | Contract matrix said the `bg-black` frame becomes a token; `--media-overlay` is `oklch(0 0 0 / 0.55)`, a scrim — a translucent letterbox would show the page | `globals.css:114`; guide `:663` tolerates black over media | frame stays `bg-black`; tokens for scrims / overlays |
| U1-5 | "Autoplay muted" was unspecified against the new controlled `muted={false}` | contract VP5 vs C5 | rule written |
| U1-6 | VP8's "poster → `preload="none"`" accept line was silently dropped | request `:955-958`; digest VP8 | stated as not adopted; goes in the report-back |
| U1-7 | `controls={false}` behaviour for the new spinner / error overlay was unstated; story-viewer renders with `controls={false}` | `story-viewer/parts/item-view.tsx:62-75` | I9: no overlay at all |
| U1-8 | Size estimate used feature count; the media-carousel retro says new-module count × ~4 KB | `improvement-log.md:658` | ≈ 75–85 KB, budget 90 |

**Checked and consistent (no change):**
- VP1 accept lines map 1:1.
- VP2 is opt-in per the digest's 🔒 Q-P8.
- VP3 `crossOrigin` and the 404 fixture are covered. The new VTT + MP4 serve `access-control-allow-origin: *`.
  `crossOrigin` stays opt-in because the test-videos.co.uk fixtures send no CORS header.
- VP4 accept lines map. "A new `src` starts over" and "resume after an error-driven swap" do not conflict: the first
  is the ask-once count, the second the position.
- VP5 maps.
- VP6 maps. The digest's "invisible mute in tab order" is solved by focus waking the controls.
- VP7 maps. The digest's lock on `useDoubleTap` timing is held: `onSingleTap` is additive.
- VP8 `onProgress` + the loop rule: story-viewer passes `loop={false}` + `onEnded` (no change), and media-library /
  media-carousel pass no `onEnded` (no change).
- `muted` without `onMutedChange` keeps today's semantics, so story-viewer's `muted={isMuted}` is unchanged.
- Q-P4 / Q-P9 keyboard locks are held (I9).
- Compound rule: triggered (≥ 3 regions). Root = `VideoPlayer` (the `<video>` is mandatory), flat exports.
- Labels rename + alias follow the engagement-bar / media-carousel precedent.
- media-carousel's two image `useDoubleTap` uses do not pass `onSingleTap`, so they are unaffected.
- Contract gate: 0 rows, so closing = `closed` + RTL demo + kit.

**Seek bar default:** delegated to the architect by the user → **on by default** (`showSeekBar` / `showTime` opt out;
CHANGELOG note), per the recommendation: VP1 is the request's main item, and the prototype's corner buttons stay.

**Sign-off:** user, 2026-10-24 — "review them your self and confirm that every thing is fully matched and allined and
consistent then go ahead" → this review is that confirmation; U1 closed with the 8 corrections applied.

### Slice plan (U2)

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | Core: `types.ts`, `lib/format.ts`, hooks (`use-video-state` rewrite, `use-autoplay-group`, `use-controls-visibility`, `use-direction` snippet copy, `use-environment`, `use-fullscreen`, `use-double-tap` `onSingleTap`), `parts/video-player-context.tsx`, `parts/video-element.tsx`, `video-player.tsx` provider + handle | architect | done | eslint on the core 0/0; tsc 0 |
| 2 | Flat parts + `DefaultControls` layout (play, mute, seek bar, time + badge, fullscreen, captions toggle/menu, status) | implementer (Sonnet 5) | done | coordinator read `default-controls.tsx`, `seek-bar.tsx`, `captions-button.tsx` in full: fade group `pointer-events-none` + `[&>*]:pointer-events-auto` only when visible; RTL `1 - fraction`; every handled key `preventDefault`; hand-rolled menu. Agent gates: tsc 0 · eslint 0/0 · contract 0 new |
| 3 | media-carousel 0.3.1: `SingleItem` video double tap → player (U1-1); region keydown ignores `defaultPrevented` + interactive descendants (R-06); recovery `request()` forwarded as the player's `onMediaError` (U1-2 / R-03) | architect | done | existing suites 131/131 after the change (media-carousel 126 + video-player 5) |
| 4 | Tests (C11 kit + VP1–VP8 + R1–R7 + I9 + media-carousel interop) + U4 regressions | implementers (Sonnet 5 ×2) | done | 13 video-player files + 2 media-carousel + 1 media-library; one `it.fails` (T1) → fixed; regressions falsified by the architect |
| 5 | Demo (11 tabs incl. RTL) + usage | implementer (Sonnet 5) | done | broken-URL 404 checked; usage gained the callbacks section (architect); browser run exercised every tab |
| 6 | registry.json roster (+14 files), contract `closed`, meta (0.3.0, budget 90, features, description), CHANGELOG ×2, fixtures (404 VTT → MDN `friday.vtt` / `.mp4`), guide rewrite, description / plan v0.3.0 sections, media-carousel guide / types / usage lines | architect | done | roster diff 21/21 + 14/14 (scratchpad `roster-diff.mjs`) |

**Size (U2 estimate from shipped source × 1.13):** video-player ≈ 79 KB (budget 90); media-carousel ≈ 57 KB (budget
55 → **60**, review R-07 asked for this decision at the next addition).

### U3 — Gate battery (first run, before U4 fixes)

First full run (scratchpad `gates.ps1`): tsc 0 · lint 0 · meta-deps 0 · registry validators 0 except **naming 1**
(description 167 > 160 chars) · doc-drift **1** (component-versions stale — downstream of registry:build) · doc-budget 0
· registry:build **1** (naming) · build 0 · tests **1** (3 repo-tier failures: served versions stale — downstream of
registry:build; `registry-tokens` "is clean against the real catalog" → **video-player shipped `--media-overlay*`
classes with no `cssVars.theme` mapping**). All four were real. Fixed: shorter description; `cssVars.theme`
`color-media-overlay` / `color-media-overlay-foreground` with `var()` fallbacks (= `globals.css`). Re-run:
registry:build 0 (video-player **78.11 KB / 90**, media-carousel **55.60 / 60**) · doc-drift 0 · tests **96 files /
1249 passed**. Final battery numbers are recorded after the U4 fix wave (below).

### Findings table (U4 — 1 fresh finder, Sonnet 5, + the test author)

| # | Finding (failure scenario) | Source | Verdict | Evidence / refutation | Fix |
|---|---|---|---|---|---|
| T1 | `useDoubleTap`: a first tap in the page's first 300 ms reads as a double tap (`lastTapRef` starts at 0, `performance.now()` counts from navigation) | test author (`it.fails`) | CONFIRMED (pre-existing) | `use-double-tap.ts` | `-Infinity` start; `it.fails` → `it` |
| F1 | `--media-overlay*` used, no `cssVars.theme` mapping → a consumer without the tokens gets invisible track / no scrim | finder + gate | CONFIRMED | `validate-registry-tokens` 2 HIGH | mapping added (U3) |
| F2 | media-library lightbox: ← / → in the video's seek bar / focused video ALSO jump to the next file (`DialogContent onKeyDown` checks only `e.key`) — a dependent regression this change created | finder | CONFIRMED | `preview-lightbox.tsx:65-68` (before) | guard `defaultPrevented` + preview controls → **media-library 0.2.3** |
| F3 | Scrubbing a video's seek bar inside a carousel also drags the carousel (Embla listens to `mousedown` / `touchstart` and skips only form fields) | finder | CONFIRMED | `embla-carousel.esm.js` `init` / `down` read in `node_modules` | `watchDrag: allowSlideDrag` (slider / menu targets) |
| F4 | Paused / idle refresh or Retry: `isBuffering` set, never cleared without `playing` / `canplay` → stuck spinner + hidden centre Play | finder | CONFIRMED | reducer `loaded` left `isBuffering` | `loaded` clears it; `source` buffers only when resuming play; Retry: paused → `clear-error`, playing → `load()` + `play()` (loads under `preload="none"`) |
| F5 | Auto-hide hides keyboard-focused controls / an open captions menu after 2 s (focus woke them only once) | finder | CONFIRMED | `use-controls-visibility.ts` (before) | `pinned` = keyboard (`:focus-visible`) focus on a control ∨ menu open (`setMenuOpen` on the context) |
| F6 | After an error, ANY later host `src` resumed at the old time and auto-played (feed recycling: video B starts at A's 30 s) | finder | CONFIRMED | `resumeRef` cleared only by `loadedmetadata` | resume only into the refreshed URL or a URL arriving while the refresh is pending (carousel echo); else reset `resumeRef` + `playingRef`. **Contract change:** the "host swaps src after an error → resume" path (U1 R-03 wording) is replaced by the forwarded `onMediaError` (media-carousel already uses it) |
| F7 | Focused video now takes ← / → — undocumented behaviour change | finder | CONFIRMED (docs) | CHANGELOG / guide upgrade table | both updated |
| F8 | R-06 guard also swallowed arrows from the carousel's OWN chevrons / dots (they sit inside the region) — a regression of my own fix | finder | CONFIRMED | `carousel-track.tsx` `INTERACTIVE` incl. `button` | guard limited to controls inside `[data-media-carousel-slide]` |
| F9 | Visible fade group gave `pointer-events-auto` to EVERY direct child: the time chip / spacer swallowed taps (no play toggle), and with `onDoubleTap` taps on the error panel counted | finder | CONFIRMED | `default-controls.tsx` `[&>*]:` | auto only for `button` / slider / menu descendants; error panel `stopPropagation` |
| F10 | Every `pointermove` re-rendered the player (`wakeKey` state) | finder | CONFIRMED (perf) | `use-controls-visibility.ts` (before) | timer in a ref; `wake()` re-renders only when hidden |
| F11 | Docs drift ×4 (centre play hidden while loading / failed; autoplay-in-view mutes uncontrolled; `onLoadedMetadata` fires per source load; `toggleFullscreen` no-op without an API) | finder | CONFIRMED | guide / types | wording fixed |
| F12 | Spinner's `role="status"` mounted already filled → many screen readers never announce it | finder | CONFIRMED | `status.tsx` (before) | always-mounted live region, text swaps |
| F13 | Escape in the captions menu inside a Radix Dialog also closes the dialog (Radix's document-level Escape runs first) | finder | CONFIRMED, not fixable inside the player | Radix `useEscapeKeydown` | documented in the guide's Limitations; parked |

**Falsification (architect, scratchpad `falsify*.mjs`):** each fix reverted from a byte-exact backup, its tests run,
the file restored — T1, F2, F3, F5, F6, F8, F9a, F9b fail when reverted; F4's two layers each cover the paused path
alone (the `source` flag and the `loaded` clear), so they were reverted together (fails) and the Retry layer alone
(fails). 13/13 including the U5 additions below.

### U5 — Runtime & smoke evidence

- **Browser** (Playwright + Chrome on `next start`, scratchpad `vp-u5-browser.mjs`, screenshots `vp-shots/`, read):
  first run **42/47** → 3 real defects, then **49/49** after the fixes:
  - **U5-1 (High):** a server-rendered `<video>` loads metadata (or fails) before hydration attaches React's
    handlers → no duration (`0:00 of 0:00`, disabled seek bar) and an early error never reaches `onMediaError`.
    jsdom cannot show it (events fire only when a test dispatches them). Fix: read the element once on mount
    (`readyState`, `error`, `paused`); tests stub `readyState` / `error` before mount (falsified).
  - **U5-2:** media-carousel's indicator dots sat on the new full-width seek bar → `--video-player-controls-bottom`
    (default 0.75rem; the carousel sets 1.75rem while dots show). Test + browser overlap check.
  - **U5-3:** the mute button drew over the error overlay → no control groups while `hasError`.
  - Checked live: idle badge + centre Play; play → seek bar follows media time; valuetext "0:01 of 0:10"; auto-hide
    after 2 s; a click at the hidden mute's position does not mute; pointer movement wakes; Home / ArrowRight; captions
    menu Off + 2 tracks, a track shows, cues loaded cross-origin (`crossOrigin` + MDN VTT); fullscreen button; error
    tab: one refresh then plays, the no-refresh player shows the overlay + Retry; autoplay group ≤ 1 playing; RTL fill
    from the right + ArrowRight seeks backward; mobile 390 px no overflow; media-carousel: region arrows reach the
    video slide, ArrowRight on its seek bar does not move the carousel, dots clear of the bar; 0 page errors. Light +
    dark.
- **Installs** (`pnpm test:install`, items video-player, video-player-fixtures, media-carousel, media-library,
  post-card): **CLI 3.8.5 and 4.18.0 — every `add` exit 0, consumer `tsc` 0, stamps checked, 2/2 pass.**

### U6 — Docs & review

- Trio: description ("In scope since v0.3.0", unpinned out-of-scope), plan (v0.3.0 delta + unpinned follow-ups), guide
  (rewritten). media-carousel guide (refresh resume, slide keys, dots clearance), types / usage lines. CHANGELOG:
  video-player 0.3.0, media-carousel 0.3.1, media-library 0.2.3. Usage page + demo (11 tabs incl. RTL).
- Blast-radius rows: all synced (registry roster 21/21; `closed` += video-player; component-versions + llms / README
  regenerated; media-library joined the radius at U4 — F2).
- Review: [`reviews/2026-10-24-v0.3.0-hardening.md`](reviews/2026-10-24-v0.3.0-hardening.md) — **Pass with
  follow-ups** (R-01 e2e spec · R-02 real devices · R-03 Escape inside a Radix dialog · R-04 `resumeKey` · R-05 RTL
  time order · R-06 size headroom 7 %).

## Pre-mortem (U7)

If this breaks for a consumer, it breaks because: a real touch device behaves differently from mouse + jsdom (the
deferred single tap calling `play()` from a timer on iOS; tap-to-wake), a host relying on the focused video NOT
taking ← / → (documented, `controls={false}` escape), or a feed recycling `src` while a refresh is pending (R-04).

## Run B3 — video-player v0.2.0 -> v0.2.1 (CLOSED — shipped in `85b9e87`, deploy verified 2026-10-23)

Mode: U-loop (patch) · sign-off: patch — architect proceeds (batch plan docs/plans/fix-now-batch-plan.md, sign-off
delegated by user 2026-10-23) · implementers: Sonnet 5.

- [x] U0 Intake & impact — blast radius + reproduction recorded below
- [x] U1 Change contract — batch plan (docs/plans/fix-now-batch-plan.md); sign-off per policy above
- [x] U2 Implement — slice table below
- [x] U3 Gate battery — gates 1–8 green (batch gate battery, docs/plans/fix-now-batch-plan.md)
- [x] U4 Adversarial review — architect self-check (patch); findings table below
- [x] U5 Runtime & smoke — `pnpm build` ✓ (77 pages); consumer smoke (shadcn@4.18.0, local `public/r`): 23/23 installs exit 0, consumer `tsc` 0 errors; cssVars land only in `@theme inline`; base media-editor compiles without the capture slice
- [x] U6 Docs sync & GATE 3 — guides/meta current; minors reviewed in spotcheck files (Pass with follow-ups); patches: architect self-check (no review file per ladder)
- [x] U7 Ship — `85b9e87` (fix-now batch) pushed to master; Vercel deploy verified 2026-10-23 (live `/r/*.json` carry the new files + `cssVars`). Decision: `.claude/decisions/2026-10-23-fix-now-hardening-batch.md`

### U0 Blast radius

| Surface | Why touched | Synced (stage 7) |
|---|---|---|
| `media/media-carousel` | imports `video-player/hooks/use-double-tap` in parts/single-item.tsx + parts/carousel-track.tsx; inherits the guard, own source unchanged -> no bump | (architect, stage 7) |
| `media/story-viewer, media/media-library` | import video-player; unaffected (no callers of onDoubleTap through controls) | (architect, stage 7) |
| `registry.json` | no change (no new files) | (architect, stage 7) |

### Reproduction (written before the fix)

- Bug: Two quick clicks on a control button (e.g. mute) bubble to the wrapper `onClick={handleDoubleTap}` (video-player.tsx) and fire `onDoubleTap` (accidental like).
- Render `<VideoPlayer onDoubleTap>`; `fireEvent.click(button)` x2 -> onDoubleTap called (pre-fix). Falsified: with the guard disabled, 3 of 5 tests in `__tests__/double-tap-controls.test.tsx` fail.

### Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | Shared `useDoubleTap` ignores events whose target is inside button/a/input/select/textarea/[role=button]/[role=slider] below currentTarget | implementer (Sonnet 5) | done | `hooks/use-double-tap.ts` |

### Invariants

| # | Invariant (testable) | Reviewed | Observed live |
|---|---|---|---|
| I1 | two clicks on a control never call onDoubleTap | (architect) | (architect) |
| I2 | two clicks on the video area still call it once | (architect) | (architect) |
| I-neg | single-tap timing unchanged (window logic untouched; a control click neither arms nor resets the window) | (architect) | (architect) |

### Gate battery

Batch-wide numbers copied from `docs/plans/fix-now-batch-plan.md` (2026-10-23).

| Gate | Result |
|---|---|
| tsc | exit 0, 0 errors (consumer-strict flags) |
| lint | exit 0 — 0 errors, 14 warnings (= known baseline) |
| meta-deps | exit 0 — 64/64 clean |
| registry validators | all exit 0: whitelist ✓ · registry-json 0 high / 6 warn (all pre-existing: filter-bar ×2, rich-text-editor `@platejs/resizable`, post-card ×2, project-card) · naming 0 · no-control-chars 1438 files · barrel-exports 0 high · inert-surfaces 0 · registry-tokens 0 (new) |
| doc validators | doc-drift ✓ (inside registry:build) · doc-budget ✓ |
| registry:build | exit 0 — 66 artifacts, artifact-size 0 high; `cssVars` + new files verified in `public/r/*.json` |
| build | exit 0 — compiled in 3.8 min, 77/77 static pages (first attempt OOM'd on a memory-starved host; retry clean) |
| tests (`NODE_ENV=production`) | exit 0 — **35 files / 263 tests** (first run of the session: 14 files + 21 worker-start timeouts — the known cold-start flake; retry clean, counts compared) |
| component tests (implementer run) | `__tests__/` file added in this slice; implementer run: pass |

### Findings table

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|
| architect self-check (patch) | no findings beyond the contract; diff read by coordinator | architect | NONE | `__tests__/double-tap-controls.test.tsx` | — |

### Parked

- Stale version-pinned deferrals flagged by `validate:inert-surfaces` (pre-existing backlog, T1).
