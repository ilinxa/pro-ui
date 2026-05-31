---
date: 2026-06-01
session: story-composer-01-v0.1.0
phase: ship
type: component-first-ship
commits: ["a62fe76", "80a85d9", "7785e46", "f08c4ab", "11aeab8", "6cba033", "78ab584", "9a4ad01", "7c34c61", "effffc5", "56b394c", "ebf7758", "6e4f5c7", "4d8d8e8"]
components: ["story-composer-01"]
findings: 5
status: shipped
---

# story-composer-01 v0.1.0 — first ship

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

## What's next

- Push to master → Vercel rebuild → smoke harness run (post-deploy)
- v0.1.1 candidates: F-01 RAF-throttle + F-02 drawing-counter
- Smile-icon polish (still blocked on `engagement-bar-01` upstream `defaultReactionIcon`) — unrelated to this ship
