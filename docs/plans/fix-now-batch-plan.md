# Fix-now batch — plan & state

> Readiness/U-loop coordination doc for the "fix now" batch that came out of the 2026-10-23
> verification of an external consumer's hardening request (social-platform consumer). The request
> itself is not in this repo; the verified findings it led to are listed below with their contracts.
> Each component also gets a run section in its own `docs/procomps/<slug>-procomp/<slug>-loop.md`.

## Status

| Field | Value |
|---|---|
| **Mode** | procomp-loop U-loops (per component) + feature-readiness-loop (gate tooling, registry tokens) |
| **Current stage** | U7 — all gates green, smoke 23/23; committed locally; push awaits user |
| **Sign-off policy** | delegated by user (2026-10-23: "Delegate for this batch" — minor-class contracts signed off by the architect, recorded per state doc; user reviews everything before push) |
| **Push policy** | commit locally with gate numbers; **ask before push** (user, 2026-10-23) |
| **Model roster** | architect: main session · implementers + finders: Sonnet 5 (`sonnet`) |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

## Locked consumer-contract decisions (apply to this and all later hardening work)

1. **Controlled data is opt-in.** The "uncontrolled by default" locks stay. A controlled prop pair is
   added next to the uncontrolled default; when the controlled prop is passed it wins on every render
   (no stale internal copy). Optimistic updates optional, rolled back on a rejected callback.
2. **Consumer-specific needs become props or CSS variables; today's defaults are kept** (video output
   restriction, prototype sizes, and the smaller conflicts VP2/ET1/IL1/AW1/AW3/SR2/SR7).
3. **No raw `bg-black` / `text-white`** (component-guide ban holds) — overlays on media get tokens
   (`--media-overlay`, `--media-overlay-foreground`), delivered per decision 4.
4. **Tokens reach consumers through the item's `cssVars.theme` mapping with a fallback**, e.g.
   `"color-warning": "var(--warning, <fallback>)"` — never `cssVars.light`/`dark` values. Evidence
   (CLI 3.8.5 / 4.5.0 / 4.18.0 source, identical; 4.5.0 run empirically): `light`/`dark` values are
   matched by exact top-level selector, so a consumer using `:root, :host`, `[data-theme]` or
   `@layer base` gets an appended rule that silently overrides their theme. `theme` entries are only
   added when the mapping is absent and never overwrite. A component item must never have a
   `registry:theme`/`style`/`font`/`base` registryDependency (it flips every var to overwrite).
5. **Heavy optional composition ships as a feature-slice add-on**, not a ban (carousel-composer /
   story-composer installable without media-editor/Konva) — Part 3, not this batch.

## Batch contracts

| # | Unit | Contract (what DONE means) | Class / bump |
|---|---|---|---|
| B1 | story-viewer | (a) Removing the current item or group never leaves a cursor naming a removed id: move to the next item (or next group's first item); removing the last group closes the viewer; progress keeps advancing. (b) Global keydown ignores editable targets (input/textarea/select/contentEditable/`[role=textbox]`) and IME composition; Space on a focused button is left to the button. (c) `triggerReply(content)` pre-fills the reply composer with `content` (advertised in JSDoc). | patch 0.5.1 → 0.5.2 |
| B2 | post-card | Double-tap never removes a like: not liked → like + burst; already liked → burst only. No burst when no like was applied (e.g. bar has no like action, or `renderEngagementBar` takeover). Handle `triggerLike` plays the burst only when the result is liked. | patch 0.5.0 → 0.5.1 |
| B3 | video-player (+ media-carousel) | A click/tap whose target is inside an interactive control (button, a, input, select, textarea, `[role=button]`, `[role=slider]`) never counts toward a double tap — fixed in the shared `useDoubleTap`, so media-carousel's wrappers inherit it. | patch 0.2.0 → 0.2.1 (media-carousel only if its own source changes) |
| B4 | carousel-composer | `handle.openEditor(id)` and the EditPanel refuse non-image items (dev-warn, no-op) — no path re-encodes video. Default `videoNotEditable` copy loses its version pin. | patch 0.2.0 → 0.2.1 |
| B5 | event-calendar | `onExternalDrop` becomes self-disclosing (`@notImplemented` + dev-warn when passed), unpinned wording. | patch 0.5.0 → 0.5.1 |
| B6 | news-card | `updatedAt` (documented as rendering "(edited)", rendered nowhere) becomes self-disclosing; implementation parked to the news-card loop. | patch 0.4.2 → 0.4.3 |
| B7 | media-editor | (a) The documented nested `labels` prop works: a normalizer maps nested keys onto the internal flat shape; flat input (story-composer) keeps working byte-identically (flat wins on conflict). (b) New additive `overlay?: ReactNode` rendered as the last child of the editor's inner box (inside the dialog in dialog presentation). (c) Every warn-only handle method carries `@notImplemented` on its type member. (d) Version pins removed (code strings, comments, types JSDoc, guide); guide stops claiming undo/redo work. | minor 0.3.1 → 0.4.0 |
| B8 | story-composer | Publishing overlay (default and `renderPublishingOverlay`) is passed through media-editor's `overlay`, so Retry/Cancel sit inside the dialog and are clickable. Requires media-editor ≥ 0.4.0 (guide note). | ~~patch 0.4.2~~ **minor 0.4.1 → 0.5.0** (raised at U4, F-B3) |
| B9 | rich-text-editor | One shared safe-embed renderer for editor, static viewer and HTML serializer: `sandbox` (scripts, same-origin, presentation, popups, popups-to-escape-sandbox), `referrerPolicy`, `loading="lazy"`, `title`; https only; default host allow-list (YouTube, YouTube-nocookie, Vimeo player); `embedAllowList` + `isEmbedAllowed` props (and `SerializeHtmlOptions`); a disallowed embed renders as a plain link, never an iframe, never dropped. Link hrefs pass a scheme filter (http/https/mailto/tel + relative; control chars stripped); toolbar/floating-toolbar inserts validate. Migration note: embeds from other hosts now render as links unless allowed. | minor 0.3.0 → 0.4.0 |
| T1 | `validate:inert-surfaces` | Probe D scans `types.ts` and each slug's guide + description; joins comment-wrapped lines; widened future-tense verb set (arrives/lands/ships/coming/candidate/addition/not wired …) with a strict `v` prefix, ignoring history/provenance phrasing. Probe B: a warn-only public handle method must carry `@notImplemented` on its type member. Fixture tests for each new case + negatives. Rolled out report-mode → backlog burned → `--strict`. | tooling |
| T2 | registry tokens | Scan every item's shipped files for theme tokens outside the shadcn v4 default set; add `cssVars.theme` mappings with fallbacks (decision 4) to those items; add `--destructive-foreground` to our `globals.css`; new validator: a non-default token used by an item must be mapped in that item's `cssVars.theme`. Empirical install check: mapping added when absent, existing consumer mapping/values untouched. | tooling (no component version bumps — component source unchanged; recorded in the decision file) |

Moved out of this batch into the next loops (same order the consumer agreed): app-sidebar
(AS1 toggle desync + the 4 unread CSS variables) and story-rail (wire the inert Add-tile labels).

## Waves

1. **Wave 1 (parallel, disjoint folders):** B1 · B2 · B3+B4+B5+B6 · B7+B8 · B9 · T1 (report mode) · T2 (scan + proposal; coordinator merges `registry.json`).
2. **Coordinator:** merge registry.json / shared files; full gate battery (readiness.config gates 1–8).
3. **T1 backlog burn-down** (findings from the widened probes), then `--strict`.
4. **Adversarial review:** fresh finders on B7/B9/T2 (minor) + dependents axis (story-composer, carousel-composer, content-composer, json-form); architect self-check on patches.
5. **Runtime & smoke:** docs-site production build interactions for the fixed bugs; consumer install + tsc for every changed slug and the listed dependents; empirical cssVars install.
6. **Docs sync, review files (media-editor, rich-text-editor spotchecks), STATUS, decision file, commit.** Ask before push.

## Checklist

- [x] Wave 1 implemented, spot-checked (coordinator read every bug-fix diff; one public-signature concern in `useDoubleTap` checked — return type unchanged, event made optional)
- [x] Gate battery green (numbers below)
- [x] T1 backlog burned (179 → 0 across 43 slugs, 3 agents), `--strict` green in `registry:build`
- [x] Findings table complete
- [x] Runtime + smoke evidence recorded — `pnpm build` ✓; consumer smoke (shadcn@4.18.0 pinned, local `public/r` via `@ilinxa` remap, restored after): 23/23 installs exit 0 (21 base + `media-editor-capture` + `project-card-fixtures`), new files present, consumer `tsc` 0; orphan sweep 64/64 clean; consumer `globals.css` gained exactly 3 `@theme inline` lines and no `:root`/`.dark` rule; base media-editor compiles without the capture slice (only its two importers fail, as designed), then 0 with it. Behaviour proof = the jsdom regression tests (each falsified red where noted); no browser pass this run (host memory)
- [x] Docs, review files, STATUS, decision file
- [ ] Committed (push: ask user)

## Gate battery

| Gate | Result |
|---|---|
| tsc | exit 0, 0 errors (consumer-strict flags) |
| lint | exit 0 — 0 errors, 14 warnings (= known baseline) |
| meta-deps | exit 0 — 64/64 clean |
| registry validators | all exit 0: whitelist ✓ · registry-json 0 high / 6 warn (all pre-existing: filter-bar ×2, rich-text-editor `@platejs/resizable`, post-card ×2, project-card) · naming 0 · no-control-chars 1438 files · barrel-exports 0 high · inert-surfaces 0 · **registry-tokens 0 (new)** |
| doc validators | doc-drift ✓ (inside registry:build) · doc-budget ✓ |
| registry:build | exit 0 — 66 artifacts, artifact-size 0 high; `cssVars` + new files verified in `public/r/*.json` |
| build | exit 0 — compiled 3.8 min, 77/77 static pages. First attempt died `Zone Allocation failed - process out of memory` with ~1.5–3 GB of 32 GB free (memory held by other projects' sessions); the retry with ~11 GB free commit passed unchanged |
| tests (`NODE_ENV=production`) | exit 0 — **35 files / 263 tests** (was 158 / 23). Runs under host load hit the known cold-start flake (14 files + 21 worker-start timeouts — a partial run that looks like a smaller suite); retry compared by count |

## Findings

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|
| F-A1 | story-viewer: unsent reply draft carries to the next item; a pre-fill after an abandoned draft doesn't pause | finder (B1–B6) | CONFIRMED 🔸 | `ReplyComposer` not keyed per item | `key={story:item}`; test "an unsent draft is discarded…" (falsified: red without the key) |
| F-A2 | story-viewer: a group added/removed *before* the current one plays a spurious cube animation (pre-existing, adjacent) | finder (B1–B6) | CONFIRMED 🔸 | cube branch compared indices only | `trackedCursor.storyId`; snap on same-story index shift; test "a group inserted BEFORE…" |
| F-A3 | story-viewer: removing the last group while earlier groups exist moves back instead of closing | finder (B1–B6) | DROPPED (documented) | contract wording vs a reasonable fallback | guide states the fallback order |
| F-A4 | story-viewer: `hasContent` drifts false after a failed send | finder (B1–B6) | CONFIRMED 🔹 | state not derived | derived from `text` |
| F-A5 | story-viewer: arrows on slider/listbox/combobox/spinbutton still navigate | finder (B1–B6) | CONFIRMED 🔹 | `isEditableTarget` selector | roles added; test |
| F-A6 | post-card: two same-tick handle `triggerLike()` calls both burst | finder (B1–B6) | DROPPED | a real double-tap spans ticks; handle callers are imperative | — |
| F-A7 | news-card warn says "not rendered yet" | finder (B1–B6) | DROPPED | unpinned wording is allowed by the rule | — |
| F-B1 | dark-theme `--destructive-foreground` near-white on the lifted red ≈ 2.8:1 (fails AA) | finder (B7/B8/T2) | CONFIRMED 🔸 | contrast computed 2.77 vs 6.96 near-black | dark → `oklch(0.13 0 0)`; registry fallback → `var(--background)` (adapts per theme) |
| F-B2 | media-editor `labels.publish.*` / `labels.empty.noSource` typed but inert | finder (B7/B8/T2) | CONFIRMED 🔸 | no consumer | `@notImplemented` + dev-warn once per mount; test |
| F-B3 | story-composer patch bump hides a coupling to media-editor ≥ 0.4.0 | finder (B7/B8/T2) | CONFIRMED 🔸 | partial update → TS error / no overlay | bumped **0.5.0** + meta note |
| F-B4 | tokens validator misses `bg-(--x)` / `bg-[--x]` | finder (B7/B8/T2) | CONFIRMED 🔹 | scanner probe | regex widened (utility-dash anchored so `(--count)` never matches); 2 tests |
| F-B5 | overlay corners square on the rounded inline surface | finder (B7/B8/T2) | CONFIRMED 🔹 | no radius | `rounded-[inherit]` |
| F-B6 | overlay docs lack z-index guidance | finder (B7/B8/T2) | CONFIRMED 🔹 | chrome at z-20/30 | guide + JSDoc: `z-40`+ |
| F-B7 | media-editor test named "honors nested labels end-to-end" only asserted a mount (implementer over-claimed) | coordinator | CONFIRMED 🔹 | test body | now asserts "Foto" renders |
| F-C1 | rich-text: render tests unverified (worker timeouts) | finder (B9) | CONFIRMED → resolved | re-run | 35/35 incl. render + serializer |
| F-C2 | rich-text: embed URL with credentials passes | finder (B9) | CONFIRMED 🔹 | `resolveEmbed` | refused; test |
| F-C3..C6 | rich-text: policy change on a mounted editor; protocol-relative hrefs; image `src` unfiltered (no script exec); IDN/wildcard breadth | finder (B9) | DROPPED / documented | low impact | guide notes; image src parked |
| F-D1 | widened probe false positive: "deferred from `file-tree` v0.1.0" (another component's version) | burn-down | CONFIRMED | probe `from` guard | guard extended; fixture test |
| F-D2 | "No scheduled v0.2 / v0.3 work" checklist line | burn-down | reworded | — | unpinned wording |
| F-D3 | card-tree runtime error strings carried "in v0.1/v0.2" | burn-down | CONFIRMED | `lib/parse.ts:422`, `lib/validate-edit.ts:205,302` | unpinned → card-tree **0.6.3** |

## Parked

- story-composer overlay: controls under the overlay stay tabbable (needs `inert` on the editor body) — story-composer Part 3 loop.
- rich-text-editor click-to-load embeds; labels for the URL prompts — rich-text-editor next loop / Part 1 R5.
- news-card `updatedAt` implementation — news-card loop.
- inert-surface probe for CSS variables a component sets but never reads (app-sidebar case) — T1 follow-up.
- split-workspace: meta says 0.2.0 but none of the features its guide promised for 0.2.0 exist (docs now say "not implemented") — check the version history in the split-workspace loop.
- Remaining version-pinned prose the probe doesn't catch (post-card guide "single object in v0.1.x", json-form decision-log voice, task-card "baked in v0.1", file-manager usage "does NOT virtualize at v0.1.0").
- rich-text-editor image `src` scheme filter (tracking/mixed content only; no script execution).
