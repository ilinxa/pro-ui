---
date: 2026-06-01
session: story-composer-01-v0.1.0-to-v0.1.4-arc
phase: ship
type: component-first-ship-plus-patch-arc
commits: ["a62fe76", "80a85d9", "7785e46", "f08c4ab", "11aeab8", "6cba033", "78ab584", "9a4ad01", "7c34c61", "effffc5", "56b394c", "ebf7758", "6e4f5c7", "4d8d8e8", "cff7265", "fb18b90", "e77220d", "e46778a", "75acbba", "c64df7a"]
components: ["story-composer-01"]
findings: 5
status: shipped
versions: ["0.1.0", "0.1.1", "0.1.2", "0.1.3", "0.1.4"]
final_tip: c64df7a
---

# story-composer-01 v0.1.0 — first ship (+ v0.1.1 → v0.1.4 patch arc)

50th procomp. Closes the story-system trilogy: `story-rail-01` (discovery) + `story-viewer-01` (consumption) + **`story-composer-01`** (creation).

## What

Greenfield ship via user request: "create new story panel … directly opens the camera … select from gallery … simple text editor … brightness, brightness, saturation … save, publish … perfectly responsive like the story viewer". Locked to Q-P3a (full Instagram parity v0.1) so all six edit tools + video record + text mode + 36 built-in stickers + 10 filter presets shipped in v0.1, not deferred to a v0.2.

## Why these substrate choices

| Concern | Chose | Rejected | Reason |
|---|---|---|---|
| Canvas engine | `react-konva` v19 + `konva` v10 | `fabric.js` + `fabricjs-react` | react-konva is the OFFICIAL React binding (Fabric only has a 3rd-party wrapper); version-major-locked to React 19; built-in canvas filters; multi-layer architecture (one Layer per concern: image / drawing / stickers / text / ui-transformer) |
| Video record | `MediaRecorder` web stdlib | `ffmpeg.wasm` | ffmpeg.wasm is ~25MB; web stdlib is 0 bytes additional |
| Video overlay bake-in | `canvas.captureStream(30)` + MediaRecorder | Skip overlays on video | Q-P1a user lock — full Instagram parity |
| SSR boundary | React.lazy + Suspense | `next/dynamic` | Registry rule bans `next/*` imports |
| Upload | XHR POST FormData | `fetch` | fetch lacks upload-progress events in browsers |
| Sticker assets | Inline SVG-text data URLs | PNG-base64 inline OR separate `registry:file` PNGs | SVG is ~180 bytes per sticker (~6KB total for 36); vector scales infinitely; uses host system emoji rendering |

Description doc + plan doc each went through the two-pass re-validation rule (initial + post-fix re-audit). Description surfaced 6 + 7 internal-consistency findings (all fixed in-place); plan surfaced 5 + 3 (all fixed). No surprises post-implementation.

## Commit chain

15 commits, all green at each gate (tsc / lint / validate:meta-deps / registry:build). Plan estimate was 15 commits = actual 15. No mid-chain refactors. Order:

| # | SHA | Theme |
|---|---|---|
| C1 | `a62fe76` | scaffold + GATE 1+2 docs + konva peer deps |
| C2 | `80a85d9` | types + labels + default tokens |
| C3 | `7785e46` | Dialog shell + state machine + mode pill |
| C4 | `f08c4ab` | camera capture + permissions + gallery pick |
| C5 | `11aeab8` | video record + trim + dual shutter behaviors |
| C6 | `6cba033` | Konva editor canvas + SSR-safe lazy boundary |
| C7 | `78ab584` | adjust sliders + filter presets + thumbnails + toolbar shell |
| C8 | `9a4ad01` | text overlay tool + color picker + first Transformer wire |
| C9 | `7c34c61` | sticker tool + built-in emoji set |
| C10 | `effffc5` | drawing tool + eraser + undo/redo history (retro-wires text + sticker into history) |
| C11 | `56b394c` | crop tool — closes the six-tool toolbar |
| C12 | `ebf7758` | publish flow + uploader + composite export + discard guard |
| C13 | `6e4f5c7` | text-only mode + demo + a11y polish + guide + meta finalize |
| C14 | `4d8d8e8` | registry.json + roster + manual audit + build artifacts |
| C15 | _this commit_ | GATE 3 spotcheck + pre-push fixes (F-03 barrel exports, F-04 STATUS, F-05 build verification) |

## GATE 3 verdict: Pass with follow-ups

5 findings via [`reviews/2026-05-31-v0.1.0-spotcheck.md`](../../docs/procomps/story-composer-01-procomp/reviews/2026-05-31-v0.1.0-spotcheck.md). 3 landed pre-push in this same session (F-03/F-04/F-05); 2 carried to v0.1.x (F-01/F-02 perf-polish).

| F# | Severity | Status | Target |
|---|---|---|---|
| F-01 RAF-throttle adjust sliders | 🔸 Medium | Open | v0.1.1 |
| F-02 Drawing-stroke counter-ref signal | 🔹 Low | Open | v0.1.x (defer if no measurable drop) |
| F-03 `index.ts` barrel — 14 promised exports missing | ⚠️ High | **✅ closed in-session** | v0.1.0 |
| F-04 STATUS.md not updated | 🔸 Medium | **✅ closed in-session** | v0.1.0 |
| F-05 `pnpm build` not yet confirmed | 🔸 Medium | **✅ closed in-session** (exit 0, 59 static pages) | v0.1.0 |

Plus post-deploy smoke harness verification queued for the standard ship→smoke→patch cycle.

## What's notable

- **Q-Ps all answered with recommendations** — user signed off on the 10 Q-Ps as a batch, trusting the rec column. No mid-build Q-P revisits.
- **Description+plan two-pass re-validation paid off** — combined 21 internal inconsistencies caught pre-impl. Zero "we should have flagged that in the plan" moments during the 15-commit chain.
- **F-cross-13 defensive pre-wires worked** — Popover via direct `PopoverPrimitive.Trigger` (no `asChild`, per the engagement-bar-01 v0.3.2 pattern) shipped clean.
- **One mid-commit hiccup, caught and fixed without back-tracking** — C7 hit `Konva.Filter` namespace miss; fixed by importing `Filter as KonvaFilter` from `konva/lib/Node`.
- **Hoisting fix in C12** — `performClose` had to be defined before `handlePublish` (TS2448). Reordered without losing time.

## What's next (v0.1.0 ship state — superseded by the patch arc below)

- Push to master → Vercel rebuild → smoke harness run (post-deploy)
- v0.1.1 candidates: F-01 RAF-throttle + F-02 drawing-counter
- Smile-icon polish (still blocked on `engagement-bar-01` upstream `defaultReactionIcon`) — unrelated to this ship

---

## Post-ship patch arc (v0.1.1 → v0.1.4, same-day)

Five patches landed on the same day as the first ship — four user-reported, one Radix-warning-driven. Single arc, kept under one decision file because the cluster of fixes is tightly coupled to v0.1.0's surface decisions.

### v0.1.1 (`fb18b90`) — F-cross-13 smoke patch

First-pass smoke harness (`pnpm dlx shadcn@4.6.0 add @ilinxa/story-composer-01` → consumer `pnpm tsc --noEmit`) surfaced 3 F-cross-13 sub-traps against older consumer shadcn primitives:

1. **`color-swatch-picker.tsx`** — imported `Popover as PopoverPrimitive` from `radix-ui` (the namespace package). Not portable: older consumers have only individual `@radix-ui/react-popover`. Refactored to use the consumer's `<PopoverTrigger>` directly (no `asChild`, since Base UI's Trigger doesn't accept Slot mergeProps).
2. **`composer-shell.tsx`** — passed `showCloseButton={false}` to `<DialogContent>`. That prop is a producer-side extension; older consumer `dialog.tsx` versions don't ship it. Replaced with CSS selector `[&_[data-slot=dialog-close]]:hidden`.
3. **`tool-text-input.tsx`** — used `size="icon-sm"` on Button. Producer-only variant. Replaced with `size="icon"` + `className="size-8"`.

Re-smoke against deployed v0.1.1 ✅ green: 36/36 files install + consumer-tsc 0 errors. Fourth consecutive ship following the established `ship → smoke → patch → re-smoke clean` pattern.

### v0.1.2 (`e46778a`) — Radix DialogDescription a11y

User-reported console warning: `Missing 'Description' or 'aria-describedby={undefined}' for {DialogContent}`. Root cause: `<DialogContent>` had `<DialogTitle>` (sr-only) but no `<DialogDescription>`. Fix: added required `ariaDescription` prop on `ComposerShell` + sr-only `<DialogDescription>`; new `composerDescription?: string` label key with default.

### v0.1.3 (`75acbba`) — pan + pinch-zoom

User request: "we must be able to pan and scale the visual content (2-finger in touch and mouse keyboard logic for pc)". New `hooks/use-pan-zoom.ts` + wired Konva Stage `scaleX/scaleY/x/y`:

- **Touch**: 2-finger pinch zoom anchored to midpoint; 2-finger pan by delta. Single-finger pointer events untouched.
- **Desktop (initial)**: Ctrl/Cmd+wheel zoom anchored to cursor.
- **Keyboard**: Arrows pan (32px), `+`/`=` zoom in, `-`/`_` zoom out, `0` reset.

Disabled during drawing (Stage owns pointer pipeline) + cropping (DOM overlay can't follow Stage transform — deferred to v0.2). Drawing-coord fix: `getPointerPosition()` → `getRelativePointerPosition()` so strokes stick at any zoom. Reset-zoom CTA top-left when not at identity. Min 1× / max 4×. New file `use-pan-zoom.ts` added to `registry.json` per manual-roster audit.

### v0.1.4 (`c64df7a`) — three user-reported fixes

User report after v0.1.3:

> 1. PC Ctrl+wheel zooms the entire browser, not just the canvas
> 2. Stories don't need crop (9:16 is the only meaningful ratio)
> 3. Camera flickers + permission conflict in photo/video modes

**(1) Wheel zoom** — Dropped Ctrl/Cmd modifier requirement; plain wheel over canvas now zooms. Wheel listener moved from React `onWheel` (passive in modern browsers, can't `preventDefault`) to a native non-passive listener via `addEventListener("wheel", h, { passive: false })` on a `targetRef`. New required `targetRef: RefObject<HTMLElement | null>` option on `usePanZoom`.

**(2) Crop default** — Removed `"crop"` from default `enabledTools`. Stories are 9:16-locked; consumers opt in for post-style composers.

**(3) Camera flicker** — Root cause: photo mode requested mic (`audio: true` always); if user granted camera but denied mic, `getUserMedia` rejected → status flipped to `"denied"` → auto-retry effect re-fired → loop. Two fixes:
- `use-media-capture.ts`: renamed `recordAudio` → `requestAudio`, default flipped `true` → `false`. Mount effect deps on `requestAudio` so photo↔video re-acquires with correct constraint.
- `composer-camera.tsx`: derives `requestAudio = mode === "video" && recordAudio`. AND bounded the auto-retry effect via `autoRetryAttemptedRef` (fires at most once per granted-state transition; resets when status reaches `"ready"`).

## Final state

| Metric | Value |
|---|---|
| Total commits in arc | 20 (15-commit ship chain + 5-version patch arc) |
| Final tip | `c64df7a` on master |
| Files on disk | 41 (40 source + new `use-pan-zoom.ts` in v0.1.3) |
| Registry files | 38 (37 base + 1 fixtures) |
| All gates green | tsc + lint + meta-deps + registry:build + `pnpm build` + smoke harness ✅ |

## What's next (post-arc)

- **F-01 RAF-throttle adjust sliders** → v0.1.5 candidate
- **F-02 Drawing-stroke counter-ref** → v0.1.x defer-if-no-drop
- **Crop-with-zoom integration** → v0.2 (needs crop overlay rewritten from DOM to Konva.Rect so both can be active simultaneously)
- **Smile-icon polish** — still blocked on `engagement-bar-01` upstream `defaultReactionIcon`

## Lessons captured (memory carriers for future sessions)

- **Smoke harness as the F-cross-13 oracle.** 4 consecutive ships now follow `ship → smoke → patch → re-smoke clean` (post-card-01 / engagement-bar-01 / todo-tree / story-composer-01). Same-day patch is the default expectation for any new procomp using Popover / Slider / Dialog / Button.
- **Registry roster manual audit is mandatory** on every minor bump that adds files.
- **Audio permission in photo mode is a flicker trap.** `getUserMedia({audio:true})` rejects on mic-denied even when camera is granted. Only request audio when actually needed.
- **Auto-retry effects against permission state need a bounded ref** or they will infinite-loop on stable denials.
- **React `onWheel` is passive in modern browsers.** `preventDefault` is a no-op for blocking browser page-zoom; use a native non-passive listener via `addEventListener("wheel", h, { passive: false })`.
- **`DialogContent` needs both Title AND Description.** Radix's a11y warning fires loudly; missed it in the GATE 3 review because we tested visually but not against the console. Add console-warning sweep to future GATE 3 spotchecks.
