# Loop state — `expandable-text` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive API + two visible default changes; composed by comment-thread and post-card) |
| **Current stage** | U7 — committed locally; push awaits the user's OK |
| **Sign-off policy** | user-interactive |
| **Version target** | v0.2.0 → **v0.3.0** |
| **Model roster** | architect: main session (diff ≲ 150 lines — no implementer fan-out, per config) · finder: Sonnet 5 (fresh) |
| **Started / updated** | 2026-10-24 / 2026-10-24 |

## Stage checklist (U-loop)

- [x] U0 Intake — class, blast radius, reproductions (below)
- [x] U1 Change contract — consistency review (below) · **sign-off:** user 2026-10-24 ("review and confirm that every thing is consistent and matche and accurate then go ahead")
- [x] U2 Implement (architect) · [x] U3 Gates (tsc 0 · lint 0 / 13 · registry:build 0 · build 0 · tests 1287/1287, 100 files) · [x] U4 Review (fresh finder with Chromium probes: 9 rows, all CONFIRMED; 7 fixed, 2 documented) · [x] U5 Runtime & smoke (browser **28/28** after U5-1; installs 2/2 CLIs) · [x] U6 Docs & review — [`reviews/2026-10-24-v0.3.0-hardening.md`](reviews/2026-10-24-v0.3.0-hardening.md): **Pass with follow-ups** (5) · [ ] U7 Ship (ask before push)

Source: request §4.4 ET1–ET2 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:627-646`) as amended by the digest
§expandable-text (`.claude/hardening-request-verification-2026-10-23.md:127-129`).

## U0 — Intake

**Class: minor.** Additive props (`children`, `measureKey`, `dir`); `content` becomes optional (widening, no
caller breaks). Two visible changes to the default render: `dir="auto"` on the text (ET2, the request's ask) and the
text is clamped before the first measurement (U0-1 below). Contract gate: **0 baseline rows**, not in `closed`.

**Scope check (request + digest vs the code at `233d23d`)**

| Item | Code today | Verdict |
|---|---|---|
| ET1 plain text only | `content: string \| null \| undefined` (`types.ts:19`), rendered as `{content}` (`expandable-text.tsx:65`) | confirmed. Digest: plan Q-P7's reason ("measurement needs a stable text node") is weak — the hook measures the element's `scrollHeight`, which works with any children; `if (!content) return null` (`:47`) must change |
| ET1 re-measure | the hook re-runs on `content` / `maxLines` / element resize (`use-line-clamp-detect.ts:55`) | confirmed: while clamped, the element's box does not resize when hidden text changes, so new children need a trigger |
| ET2 bidi | the `<p>` has no `dir` (`:51`) | confirmed |
| C11 | `__tests__/contract.test.tsx` (the R9 reference kit use) | exists; its RTL check only asserts the toggle exists — the kit's own doc calls that "only proves it did not crash" |
| Digest: plan `:544` version pin | "v0.3: optional rich-content escape hatch …" | confirmed — and v0.3.0 is this release |

**Also found in U0 (read end to end):**
- **U0-1 layout shift on every server render:** `isClamped = !expanded && isTruncated`, and `isTruncated` starts
  `false` (no DOM on the server), so the full text paints, then collapses to `maxLines` after mount — a layout shift
  on every feed post / comment. The plan's Q-P9 note ("no flash-of-untruncated-content") is about the clamp toggle,
  not first paint.
- **U0-2 labels:** `{ ...DEFAULT, ...labelsProp }` lets `{ showMore: undefined }` erase a default (C2 rule).
  `DEFAULT_EXPANDABLE_TEXT_LABELS` → `defaultExpandableTextLabels` + alias (engagement-bar / media-carousel / video-player
  precedent).
- **U0-3 `line-height: normal`:** `parseFloat("normal")` is NaN → the measurement bails → no toggle ever. The guide
  documents it as "avoid".
- **U0-4 hidden focusable content (new with ET1):** a link below the clamp is invisible but still in the tab order.
- **U0-5 owed follow-up F-02** (v0.1.0 review, "Open" since v0.1.1): `meta.related` lacks the real consumers
  (comment-thread, post-card).
- **U0-6 docs:** the guide's "v0.2 candidates" and the plan's follow-ups are version-pinned (0.2 shipped without
  them).

**Blast radius (from imports, not names)**

| Surface | Why touched | Synced (U6) |
|---|---|---|
| `src/registry/components/data/expandable-text/**` | the change | |
| **comment-thread** (`parts/comment-node.tsx:200` — `content`, `maxLines`, `contentClassName`) | API unchanged; body gets `dir="auto"` + pre-measure clamp | |
| **post-card** (`parts/{feed,compact,list,detail}-variant.tsx` — `content`, `maxLines` (detail: `bodyMaxLines \|\| 999`), `contentClassName`) | API unchanged; same visible changes. `parts/mention-text.tsx:39-43` says mention highlighting cannot be clamped "v0.3+ may bridge" — ET1 makes that possible, but wiring it is **post-card's Part 3 loop** (not here) | |
| `registry.json` expandable-text item (+ `-01` alias, `-fixtures`) | no new files planned | |
| `scripts/contract-baseline.json` | `closed` += expandable-text (0 rows) | |
| CHANGELOG, trio docs, STATUS, component-versions | 0.3.0 | |

**Reproductions (write before the fix, replayed at U5)**

| # | Input | Today | Expected |
|---|---|---|---|
| R1 (ET1) | `<ExpandableText>` with link children, long | nothing renders (`!content`) | links render + clickable; clamp + toggle work |
| R2 (ET1) | children change while clamped (same box size) | no re-measure | `measureKey` change and DOM mutation both re-measure |
| R3 (ET2) | Arabic text in an LTR page | starts at the left | `dir="auto"` → starts at the right |
| R4 (U0-1) | server-render a long post | full text, then collapses after mount | clamped from the first paint |
| R5 (U0-2) | `labels={{ showMore: undefined }}` | empty toggle text | "Show more" |
| R6 (U0-3) | `line-height: normal` | no toggle | toggle |
| R7 (U0-4) | Tab into a link hidden below the clamp | focus on invisible text | the text expands (uncontrolled) / `onExpandedChange(true)` (controlled) |

## U1 — Change contract

**ET1 — rich children**
- `children?: ReactNode` — rendered instead of `content` (children win when both are given). With children the
  content element is a `<div>` (block children such as `<p>` are valid; a `<p>` cannot contain them — hydration error);
  with `content` it stays the `<p>`.
- `content?: string | null` — now optional. The component renders nothing only when there is neither non-empty
  `content` nor renderable children (`null` / `undefined` / `false` / `""` / `[]`).
- Re-measurement: `measureKey?: unknown` (re-measure when it changes) **and** a MutationObserver on the content
  element (text / child changes) so most hosts never need `measureKey`; ResizeObserver stays.
- `useLineClampDetect` gains an optional `observeMutations` (default `false` — the exported hook's behaviour is
  unchanged for its own callers); the component turns it on.

**ET2 — direction**
- `dir?: "auto" | "ltr" | "rtl"` (default `"auto"`) on the content element. The toggle stays in block flow below
  (start-aligned in either direction).

**Found in U0**
- **U0-1:** clamp before the first measurement: `isClamped = !expanded && (isTruncated || !measured)`; after the
  first measurement short text is unclamped (no `overflow: hidden` clipping focus rings). The toggle still appears
  only when truncated. Server markup = clamped.
- **U0-2:** `defaultExpandableTextLabels` + deprecated alias; merge skips `undefined`.
- **U0-3:** `line-height: normal` → measure with `fontSize × 1.2` (the CSS "normal" approximation).
- **U0-4:** focus entering clamped, truncated content (not the toggle) expands it — `setExpanded(true)` (uncontrolled:
  expands; controlled: `onExpandedChange(true)`, the parent decides).
- **U0-5:** `meta.related` += comment-thread, post-card; mark F-02 done in the v0.1.0 review.
- **U0-6:** unpinned "not implemented" wording in guide / plan / description; plan Q-P7 revised.

**Tests + demo (C11)** — the kit spec strengthened (RTL asserts `dir="auto"` + Arabic text; labels; controlled), plus a
test per R1–R7, hydration (server markup clamped, no warning), dependents (comment-thread, post-card compile; their
bodies render with `dir="auto"`). Demo: an RTL tab in `<div dir="rtl" lang="ar">` with RTL sample text in
`dummy-data.ts`, a rich-children tab (links + a mention), a `measureKey` tab.

### Contract matrix

| Rule | v0.3.0 |
|---|---|
| C1 tokens | `text-muted-foreground` / `text-foreground` (unchanged) |
| C2 labels | typed, `undefined` never erases a default, renamed constant + alias |
| C3 | n/a (no formatting) |
| C4 direction | `dir="auto"` default + prop; RTL demo |
| C5 controlled | `expanded` / `defaultExpanded` / `onExpandedChange` (exists; the prop wins every render) |
| C6 / C7 | n/a / `renderToggle` + `children` slots |
| C8 | n/a (no media) |
| C9 runtime | measurement in effects only; MutationObserver / ResizeObserver guarded; no motion |
| C10 | 0.3.0 + CHANGELOG + installs CLI 3.8.5 / 4.18.0 |
| C11 | kit (strengthened) + R1–R7 + hydration + axe |
| C12 | n/a |

### Invariants

| # | Invariant | U4 | U5 |
|---|---|---|---|
| I1 | `content`-only callers (comment-thread, post-card): same DOM except `dir="auto"` and the pre-measure clamp | | |
| I2 | children render; links clickable; clamp + toggle work; block children valid (no `<div>` in `<p>`) | | |
| I3 | `measureKey` change and DOM mutation re-measure | | |
| I4 | `dir="auto"` default, prop overrides | | |
| I5 | nothing renders only with no content AND no renderable children | | |
| I6 | `labels` with `undefined` keeps defaults | | |
| I7 | focus into clamped truncated content expands (uncontrolled) / asks (controlled) | | |
| I8 | `line-height: normal` measures | | |
| I-neg | server markup clamped; hydration without warnings; short text unclamped after measure; `maxLines={999}` (post-card detail) never shows a toggle for normal text | | |

### Size

Artifact today **8.66 KB** vs budget 10. Estimate (retro rule): 0 new modules, ~+2.5 KB of logic + JSDoc →
≈ 11.5 KB → budget **15**.

### U1 consistency review (architect, at the user's request, before "go")

Re-checked every line above against the code at `233d23d`, the request's accept lines (`PROUI_HANDOFF.md:631-646`),
the digest's three notes, plan Q-P1–Q-P10, the two dependents' call sites (read: comment-thread `comment-node.tsx:200`,
post-card's four variants), the 0.1.0 review's open follow-ups and the last retro. **4 corrections made before
sign-off:**

| # | Inconsistency in my first draft | Evidence | Correction |
|---|---|---|---|
| C-1 | Children rendered inside the `<p>` — any block child (a host's `<p>` per paragraph, a `<div>` mention card) is invalid inside `<p>` and fails hydration | HTML content model; React's `validateDOMNesting` | `<div>` for children, `<p>` kept for `content` |
| C-2 | Relying on `measureKey` alone: while clamped the box does not resize, so a host that forgets it gets a stale toggle — the request's "(or content)" alternative does not apply to children | `use-line-clamp-detect.ts:52` (ResizeObserver only) | MutationObserver as well; `measureKey` stays for changes that alter no DOM (e.g. font load) |
| C-3 | Turning mutation observation on inside the EXPORTED hook would change its behaviour for external callers | plan Q-P1 (public hook) | opt-in `observeMutations`, default off |
| C-4 | My blast radius first listed only comment-thread (a grep with a narrow pattern); post-card composes it in **four** variants | `post-card/parts/*-variant.tsx:6` imports | post-card added; dependents axis covers both |

**Checked and consistent:** ET1 accept lines (links render + clickable, clamp + toggle, `measureKey` re-measures under the
ResizeObserver mock) map to I2 / I3; ET2 accept ("paragraph has `dir="auto"`; Arabic starts at the right") maps to I4
— for the children path the `<div>` carries it; the digest's `if (!content) return null` → I5; plan `:544` → U0-6;
locked decision 1 (controlled opt-in, prop wins) already holds (`expanded`); Q-P2 / Q-P3 / Q-P4 / Q-P5 / Q-P6 / Q-P9 /
Q-P10 (empty → nothing, now "no content and no children") hold; Q-P7 is revised by the request (the consumer asked for
it; the digest refuted its reason); the post-card MentionText bridge stays out of scope (post-card Part 3).

## U2 — Implement (architect)

`types.ts` (children / measureKey / dir, optional content, `defaultExpandableTextLabels` + alias),
`hooks/use-line-clamp-detect.ts` (opt-in `observeMutations`, `isMeasured`, `line-height: normal`),
`expandable-text.tsx` (rich `<div>` path, pre-measure clamp, keyboard-focus expand, labels merge, `dir`),
`index.ts`, `dummy-data.ts` (Arabic samples), `demo.tsx` (Rich children + RTL tabs), `usage.tsx`, meta (0.3.0,
budget 15, related, features), CHANGELOG, contract `closed` += expandable-text, docs trio, F-02 marked done.
Tests: `__tests__/hardening.test.tsx` (R1–R7, I-neg, hydration) + the kit's RTL check strengthened — 22 passed, then
**falsified 10/10** (each fix reverted from a byte-exact backup → its tests fail → restored).

Flake seen: the first combined vitest run (expandable-text + comment-thread + post-card) **hung > 10 min with no
output** (one worker at 900 MB); re-runs of the same set passed in ~2 min (19/19). Not reproducible — a hanging variant
of the known worker-start flake. Runs since use a hard `WaitForExit` timeout.

## Findings table (U4 — 1 fresh finder, Sonnet 5, with Chromium probes)

| # | Finding (failure scenario) | Verdict | Evidence | Fix |
|---|---|---|---|---|
| F1 | Block children (two `<p>`) ignore `-webkit-line-clamp`: collapsed box ~4.6 lines, cut mid-line — the very case the `<div>` switch exists for | CONFIRMED (Chromium probe: clientHeight 92 vs 60) | `expandable-text.tsx` style | rich path also `max-height: N lh` (inline children keep the ellipsis); test + falsified |
| F2 | `dir="auto"` = first strong character, else LTR: a mention-first Arabic post goes LTR; emoji / number-only bodies left-align on an RTL page | CONFIRMED (HTML rule; the request asked for `auto`) | `dir` default | documented in guide §9 with the `<bdi>` / `dir` workarounds |
| F3 | Keyboard focus on a link on a VISIBLE line also expanded (page reflow on every Tab) | CONFIRMED | `handleFocus` | expand only when the target's bottom is below the content box; test + falsified |
| F4 | No JS / print / impossible measurement (no line height) → clamped forever with no toggle | CONFIRMED | pre-measure clamp | bail = measured + not truncated; `print:` + `@media (scripting: none)` unclamp; tests + falsified |
| F5 | A child element that renders nothing still wins over `content` (empty box) | CONFIRMED (limitation) | `isEmptyNode` | documented (guide recipe 8, `children` JSDoc) |
| F6 | `p` ↔ `div` switch / null-first render: one frame with stale measurement | CONFIRMED | passive effect | measurement in a layout effect (before paint) |
| F7 | Short → long `content` change paints one full-length frame before the clamp | CONFIRMED | passive effect | same as F6 |
| F8 | The demo's "measureKey" example was also caught by the MutationObserver (proved nothing) | CONFIRMED | `demo.tsx` | split: a DOM-change demo and a style-change (`measureKey`) demo; the measureKey-only path is proven by test R2 |
| F9 | Alias JSDoc "for one minor" = a version pin (rule: never version-pin) | CONFIRMED | `types.ts:72` | reworded. The same wording ships in video-player 0.3.0 → follow-up for its next touch |

## U3 — Gate battery

- First battery (after U4 fixes): registry:build **1** — `validate-changelog`: the `expandable-text` 0.2.0 row in
  `scripts/changelog-baseline.json` is no longer needed (a real catch: the baseline is shrink-only) → row removed;
  doc-drift 1 downstream of it; tests: 3 repo-tier failures downstream of it + one worker-start flake.
- Re-run: registry:build **0** (artifact **14.09 KB / 15** — the U1 estimate of ~11.5 was low again, +5.4 KB for 0
  new modules; JSDoc + the unclamp classes) · tsc 0 · lint 0 / 13 baseline · doc-drift 0 · build 0 · tests: first
  attempt 3 × "Test timed out in 5000ms" in repo-tier tests that spawn scripts + "Failed to start forks worker" with
  **4.3 GB free of 32** (memory-starved host — the known flake class); retry **100 files / 1287 passed**.

## U5 — Runtime & smoke evidence

- Browser (Chrome on `next start`, scratchpad `et-u5-browser.mjs`, screenshots `et-shots/`): first run **26/28** —
  **one real defect (U5-1):** Tab onto a link hidden below the clamp did not expand. Probe (`et-probe.mjs`): Chrome
  scrolls the clipped box to the focused link **before** `focus` fires (`scrollTop` 46, link inside the box), so
  the geometry check alone never saw it hidden. Fix: a scrolled box counts as hidden; expanding resets `scrollTop`;
  test + falsified. Re-run: see below.
- Re-run after the U5-1 fix (fresh build): **28/28** — SSR markup clamped; long body 3 lines + toggle; short body unclamped; rich clamped to 3 lines; Tab onto a visible link does not expand, onto the hidden `#harbor` expands; **block children held to 3 lines in Chrome (F1 proven live)**; RTL page + Arabic-in-LTR-feed compute `rtl`; comment-thread (6 bodies) and post-card render with `dir=auto`, 0 page errors; mobile no overflow. Light + dark. Screenshots read.
- Installs (`pnpm test:install`: expandable-text, -fixtures, comment-thread, post-card): **CLI 3.8.5 + 4.18.0 — every add exit 0, consumer tsc 0, 2/2.**
- Falsified total: **15/15** (10 U2 + 4 U4 + 1 U5).
