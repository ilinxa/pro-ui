# Deep end-to-end codebase review — 2026-08-10

- **Scope:** entire repo at `master@a662b54` — all 63 registry components, registry infrastructure & distribution plumbing, docs site, design-system compliance, gates.
- **Method:** AI-assisted multi-agent review (7 scoped deep-read passes: registry infra, task family, media family, gamification pack, docs site, navigation/layout/code/feedback, cross-cutting sweep), findings independently spot-verified before inclusion. Coverage note: forms/marketing/small-data cards received targeted (not exhaustive) coverage — the riskiest members (json-form, markdown-editor, share-bar-01, workspace, grid-layout-news-01) were deep-read; mid-tier members (entity-picker, filter-bar-01, properties-form internals, category-cloud, comment-thread, engagement-bar internals, marketing cards) were skim/grep-covered only.
- **Gates at review time:** `tsc --noEmit` clean · `validate:meta-deps` 63/63 clean · lint **81 errors / 23 warnings** (known baseline; clusters: `pricing-table-01/usage.tsx` ×21 unescaped entities, `story-viewer-01` + `media-editor-01` React-Compiler refs/setState diagnostics, `story-composer-01/usage.tsx` ×5).
- **Verdict:** the library's infrastructure, conventions, and state-management discipline are unusually strong; the risk is concentrated in ~20 High findings — several of which are *functionally broken user flows* that compile clean and pass every existing gate.

Severity ladder: 🚫 Blocker · ⚠️ High · 🔸 Medium · 🔹 Low (project-standard).

---

## 0. P1 outcome ledger (added 2026-08-10, post-fix-program)

The P1 fix program (`9de7448..b035f51`, six batches) executed same-day. Every fix was adversarially re-reviewed by three independent verification passes (task/calendar · nav/misc · media) before ship; the media pass caught one real regression in the fixes themselves (N1 below), closed pre-ship.

**FIXED (all verified CONFIRMED-FIXED by the adversarial passes):**
- §1 broken flows: **1.1–1.6 all fixed** (composer gate + N1 content-aware hardening; text export; re-edit blob restore; step-revisit; calendar Day-view; grid-news featured).
- §2 task family: **2.1–2.11 all fixed** (2.1's byte-identical round-trip proven by 25 runtime assertions + the cross-agent calendar⇄card seam traced clean). 2.12 (`now`-prop semantics) open → P3.4.
- §3 distribution: **3.1–3.4 + 3.8 fixed** — `radix-ui` import replaced by a local SlotClone (merge semantics verified against Radix mergeProps); reverse-npm check (found 6 undeclared components beyond the review's 2: article-meta, content-composer, media-carousel×2 deps, media-carousel-editor + the known pair); `validate:registry-json` live in `registry:build`. 3.5 documented-warn; 3.6/3.7/3.9 → P2/P4.
- §4 docs site: 4.1–4.3 + 10.1/10.2 fixed in P0.
- §5 cross-cutting Highs: **5.1–5.12 all fixed** (XSS sanitizer survived a 22-vector adversarial smoke; flow-canvas coalescing verified compatible with all three locked defenses).
- §6 Mediums riding their component batches: media items, workspace bundle, rich-sidebar storage/focus, file-manager marquee/ARIA/type-ahead, trophy-shelf union, quest-log roles, json-form flatten, share-bar mailto, blackboard purity, code-block fixture — fixed. Lint baseline (1E): **81 errors → 0** (3 documented suppressions, all named false-positive classes).

**Adversarial-pass discoveries (beyond the original review):** N1 discard-resurrection regression (⚠️, **fixed**: content-aware `editorStateHasMedia` at 4 layers + pendingBlobRef/blob-cache eviction on discard) · kanban silent-veto ref divergence (🔸, **fixed**: microtask reset to committed state) · calendar Copy missing `.catch` (🔹, **fixed**).

**OPEN with owner (deferred per the Medium/Low routing rule):**
- 🔸 Re-edited heroes never re-export (media N2, pre-existing) — content-composer v0.2.3.
- 🔸 Text-export webfonts fall back inside SVG rasterization (media N3) — media-editor v0.2 or doc note.
- 🔸 §6 unowned remainders: detail-panel focus-steal + namespace compound; gamification viewed-telemetry drift / mounted-live-regions / lazy-barrel verification; task-choice cmdk value collision; fixture URL hygiene (rides P2.5) — P3.4 fix-on-touch channel.
- 🔹 §7 Lows, media N4–N6, task N3–N6 (gantt DST date-only fallback, 3 date-only convention copies → P3.5 kit, multi-touch gesture ref, `_shared` residuals), markdown image-src scheme filtering (informational, not XSS), IMPORT_RE string-literal residual, rich-sidebar controlled+storageKey doc note, EditPanel durable-draft dead-URL (documented backend deferral) — P3.4 channel; each named here so nothing is silently dropped.

---

## 1. Broken user flows (fix first)

| # | Severity | Where | Finding |
|---|---|---|---|
| 1.1 | 🚫/⚠️ | `content-composer-01/lib/gates.ts:85` | `mediaRequired` gate is `!!value?.exportedUrl \|\| isDirty` — ignores `pendingBlobRef`/`editorState`. At publish, the media step is re-gated **without** an active handle (single-step mount), so a freshly captured hero always fails → "A cover image is required" → bounce back to a (per 1.4) now-empty media step. **First-time news compose can never publish.** Re-edits with an existing `exportedUrl` mask it. Fix: `!!value?.exportedUrl \|\| !!value?.pendingBlobRef \|\| isDirty`. |
| 1.2 | 🚫/⚠️ | `media-editor-01.tsx:793-802` + `lib/export-blob.ts:78` | **Text-mode stories cannot be published.** `exportPolymorphic` dispatches video→`exportVideo`, else `exportImage`; text mode has no Konva stage → throws "editor canvas not ready". `exportTextOnlyBlob` + `textOnlyRef` exist (and index.ts exports the function) but are never wired into the export path. story-composer shows Publish in text mode → guaranteed error overlay. |
| 1.3 | ⚠️ | `media-carousel-editor-01/parts/edit-panel.tsx:63-85` (+ `media-editor-01.tsx:289`, `use-media-editor-state.ts:260`) | Re-edit restores `editorState.imageSrc` — a blob URL revoked when the first edit's editor unmounted → **second edit opens a black canvas**; export from there = overlays on empty stage. Same dead-URL problem for content-composer's `mediaSlot` `editorState` (`media-substrate.tsx:29`). Fix: persist `sourceBlob` on the item and re-mint a fresh object URL before `loadState`. |
| 1.4 | 🔸 | `content-composer-01/parts/media-substrate.tsx:61-88` | Step-revisit seeds only when `exportedUrl && !editorState`; a fresh capture has `editorState` but no `exportedUrl` → editor mounts **empty** (publish still works via blobMap, but the user sees their hero vanish). `SlotHandle.loadValue` is a dead contract — no caller anywhere. Fixing 1.1/1.3/1.4 together closes the whole chain. |
| 1.5 | ⚠️ | `calendar-01/parts/calendar-time-grid.tsx:277-279` | All-day band filter `endMs > firstMs` excludes zero-length point events (no `expireAt` → `endMs === startMs` = midnight). **Every single-day all-day event on the viewed day is invisible in Day view** (and on Week's first column). Month shows it; switch to Day and it's gone. Fix: inclusive comparison mirroring `coveredDays()`. |
| 1.6 | ⚠️ | `grid-layout-news-01/hooks/use-magazine-filter.ts:69-75,105` | Featured item is excluded from `regularItems` **and** suppressed once `page > 1` → **the lead story disappears entirely after the first "load more"**. |

## 2. Data-corruption & contract-drift (task family)

| # | Severity | Where | Finding |
|---|---|---|---|
| 2.1 | ⚠️ | `todo-rich-card/lib/normalize.ts:209-216` + `lib/time.ts:5-20` | `parseIso` accepts `YYYY-MM-DD`, `toIso` re-serializes via `toISOString()` → **any edit in calendar's embedded detail editor rewrites date-only dates to UTC timestamps**, destroying all-day-ness: event reclassifies as a 03:00 milestone (UTC+3) or shifts to the previous day (negative offsets); multi-day all-day events grow/shift a day; phantom `onFieldEdited({key:"startAt"})` fires on name-only edits. Fix: round-trip date-only values verbatim (match calendar's `parseDateValue`/`formatDateValue`). |
| 2.2 | ⚠️ | `calendar-01/parts/calendar-time-grid.tsx:141-143` + `lib/edit-mutations.ts:135-166` | Timed start-edge resize: preview clamps, **commit passes raw `t`** and `setWindow` only guards the end side → persists `startAt > expireAt` (inverted window), echoed to the consumer. Gantt clamps pre-commit; calendar must too. |
| 2.3 | ⚠️ | `todo-tree/todo-tree.tsx:196-217` + `hooks/use-todo-tree-state.ts:361-395` | **Clipboard Cut/Paste bypasses the permission matrix and `locked`** — Ctrl+X deletes locked/remove-denied items; Ctrl+V ignores `addChildren`. Keyboard Delete and every sibling surface gate correctly; this is the one hole. Also applies to imperative `cutItems`/`pasteItems`. |
| 2.4 | 🔸 | `gantt-timeline-01/lib/geometry.ts:13-21` vs `calendar-01/lib/classify.ts:24-31` | Gantt parses date-only as **UTC**, calendar as **floating-local** → same item renders a day apart in negative-offset TZs; any gantt edit then converts date-only → full ISO (same corruption class as 2.1 via another surface). Hoist calendar's date-value pair into the shared lib next to `clipboard.ts`. |
| 2.5 | 🔸 | `use-gantt-edit.ts:455`, `use-todo-tree-state.ts:361`, `calendar-context-menu.tsx:47` | Cut = `void copyTasksToClipboard(...)` then synchronous delete → **if the async clipboard write is denied, the item is deleted with nothing on the clipboard** (gantt even throws unhandled when `navigator.clipboard` is undefined). Await the copy; delete only on fulfillment. |
| 2.6 | 🔸 | `calendar-01/parts/calendar-root.tsx:603-639` | All-day keyboard move/resize uses raw `MS_PER_DAY` (DST-broken: ArrowRight is a silent no-op on the fall-back day, still firing events with an identical forest) while the pointer path correctly uses `addDays`. `startTimedMove`'s ms-offset day-mapping shifts wall-clock time across DST columns. |
| 2.7 | 🔸 | `calendar-01/parts/calendar-time-grid.tsx:76-195`, `calendar-edit-affordances.tsx:64-83` | Native pointer gestures handle no `pointercancel` and take no pointer capture → on touch scroll-takeover: leaked window listeners, a resize preview that tracks the finger forever, and **the next unrelated pointerup commits a stale reschedule**. Gantt does this correctly (`onPointerCancel` + capture). |
| 2.8 | 🔸 | `use-gantt-edit.ts:489-518` vs `use-calendar-edit.ts:442-475` | Calendar's per-field `onFieldEdited` diff on `applyEditedSubtree` (v0.2.2 fix A1) was never ported to gantt → detail-editor edits in gantt emit no granular events. |
| 2.9 | 🔸 | `kanban-board-01/hooks/use-kanban-state.ts:23-30` | `dispatch` computes `next` from render-captured `state` → two dispatches in one tick lose the first mutation in controlled mode. (Also: kanban remains outside the `ilinxa/task` clipboard envelope — known scope decision, restate in family docs.) |
| 2.10 | 🔹 | `todo-rich-card/lib/clipboard.ts:93-112` | Envelope branch returns `items` unvalidated (no `looksLikeTodoItem` over items, no version gate). Robustness, not a crash. |
| 2.11 | 🔹 | `todo-tree/todo-tree.tsx:179-194` | Multi-select copy with parent+descendant selected serializes the descendant twice → paste duplicates it. Prune ids whose ancestor is selected. |
| 2.12 | 🔹 | `calendar-01/hooks/use-now-tick.ts:31` vs `gantt-timeline-root.tsx:95-105` | `now` prop semantics differ: gantt treats it as authoritative, calendar as first-paint seed then real-clock takeover. |

## 3. Distribution & infrastructure

| # | Severity | Where | Finding |
|---|---|---|---|
| 3.1 | ⚠️ | `rich-sidebar/parts/sidebar-nav-trigger.tsx:4` | `import { Slot } from "radix-ui"` — undeclared in meta/registry.json, and `radix-ui` is on the validator's own `FORBIDDEN_NPM` list. Survives today via transitive install from Radix-backend primitives; **breaks module-not-found on Base-UI consumers** (the project's proven F-cross-13 divergence class). |
| 3.2 | ⚠️ | `scripts/validate-meta-deps.mjs:~304` | **No reverse npm check**: shipped code importing an npm package absent from `meta.npm` passes clean (internal deps check both directions; npm checks only phantom-declared). This is the hole 3.1 and 3.3 sailed through. Add a (b2) check mirroring (d.2) with a `react`/`react-dom` allowlist. |
| 3.3 | 🔸 | `registry.json` — `media-editor-01`, `rich-card-in-flow` | Undeclared `lucide-react` (7 shipped files in media-editor-01; 2 in rich-card-in-flow) — currently masked by transitive installs via pinned regDeps. Declare explicitly. |
| 3.4 | 🔸 | `registry:build` pipeline | Nothing validates `registry.json` itself (file lists vs disk, item deps vs shipped imports, regDeps vs `meta.internal`). This exact gap bit `todo-tree` historically. ~100 lines of mechanical checks would close 3.1/3.3/3.5 permanently. |
| 3.5 | 🔹 | `registry.json` post-card-01 | Phantom regDep `@ilinxa/video-player-01` (transitive-only; no shipped import). Document as intentional pin or drop. |
| 3.6 | 🔹 | `registry.json` | Two CSS files typed `registry:file` (engagement-heart-burst.css, flow-canvas-01.css) — necessary deviation from the locked "every file registry:component" convention; document the exception. Also `info-list-01` fixtures ship `dummy-data.tsx` (only `.tsx` deviation; scaffolder emits `.ts`). |
| 3.7 | 🔹 | `registry.json` | Mixed regDep styles: ~54 items use bare primitive names (style-agnostic), 9 media/social items pin absolute `ui.shadcn.com/r/styles/new-york/*.json` URLs, fighting Base-UI consumer installs. Pick one convention. |
| 3.8 | 🔹 | `validate-meta-deps.mjs:162` | `IMPORT_RE` can bridge from an `import`/`export` word in a comment to a later string → phantom "used" imports that **mask** findings. Strip comments before matching. |
| 3.9 | 🔹 | misc | `registry.json:4` homepage points at `github.com/ilinxa/pro-ui`, not the live host. Repo root carries stray `firstconversation.md` / `graph-visualizer-old.md`. `manifest.ts` is fully eager (63 demos in one module graph — server-bundle cost only, heavy deps are lazy'd inside components; deliberate trade, worth documenting). Registry-rule carve-out for docs-only files (`demo.tsx` importing `@/components/site/*`, `next/dynamic`) should be written into the rule. |

## 4. Docs site

| # | Severity | Where | Finding |
|---|---|---|---|
| 4.1 | ⚠️ | `src/app/components/_components/use-filters.ts:27-37` | Hardcoded `VALID_CATEGORIES` whitelist is missing `"code"` and `"gamification"` → **the Category filter silently no-ops for both newest categories** (facets are derived live, so the checkboxes render — and do nothing; shared URLs stripped too). Fix: derive from `CATEGORIES` (single source of truth). |
| 4.2 | ⚠️ | `src/app/docs/page.tsx:96-139` + `public/llms.txt` | Public docs + llms.txt claim **eight** components (and a stale `force-graph` note); the library has 63. llms.txt is promoted as "everything an AI needs" — an AI consumer will conclude ~55 components don't exist. Generate both from `getMetaList()`/registry.json. |
| 4.3 | 🔸 | `src/app/components/[slug]/page.tsx:209` | 63 live demos render with **no error boundary** (no `error.tsx` anywhere) — one throwing demo = unstyled crash page. The JSON playground already has `PreviewBoundary`; the primary demo surface doesn't. |
| 4.4 | 🔸 | `installation-block.tsx:7` | Deep-import of `code-block/hooks/use-copy-to-clipboard` (not exported from the public index) — sealed-folder violation, breaks on NPM extraction. (Same class, lower stakes: `sandbox/flow-stress` deep-imports flow-canvas `dummy-data`.) |
| 4.5 | 🔸 | 3 registry demos | `properties-form`, `share-bar-01`, `registration-form-01` demos import docs-site-only `@/components/site/swipe-tabs-list` — surfaced verbatim as copyable "Demo source" with no installable counterpart. |
| 4.6 | 🔹 | misc | No `metadataBase`/OG/sitemap/robots/not-found; registry URL + `@ilinxa` namespace hardcoded in 4 places; status→badge mapping duplicated ×4 (sandbox copies drop the `deprecated` arm); dead `getGroupedRegistry`/`getEntriesByCategory`; create-next-app leftover SVGs; inert category breadcrumb; no skip-link; playground `pending` uses object identity; composer-playground never revokes object URLs. |

## 5. Component internals — cross-cutting HIGHs

| # | Severity | Where | Finding |
|---|---|---|---|
| 5.1 | ⚠️ | `forms/markdown-editor/lib/parse-markdown.ts:52` → `parts/preview-pane.tsx:99` | **Unsanitized `marked` output into `dangerouslySetInnerHTML`** — marked passes raw inline HTML through; escaping covers only wikilink spans. `<img onerror=…>` executes. With backend-stored multi-author markdown (the wikilink use case) this is stored XSS in consumer apps. Sanitize (DOMPurify or renderer override + `javascript:` href strip); correct the trust comment. |
| 5.2 | ⚠️ | `data/flow-canvas-01/hooks/use-canvas-data.ts:535-549` (+373-427) | `fireOnChange` reads the **sibling ref synchronously inside state updaters** → node delete notifies with pre-cascade edges; controlled echo + `canvasMatchesInternalState` wholesale-replace can resurrect dangling edges or the deleted node (keyboard delete worst: two half-stale batches race). Coalesce: read refs at microtask time. |
| 5.3 | ⚠️ | `data/flow-canvas-01/hooks/use-drop-pipeline.ts:68-78` | `dispatch` calls `onNodeCreate` **and** `appendNode` (which also fires it) → **double-fire on every drop/paste**; consumers creating backend records get duplicates. Delete the extra call. |
| 5.4 | ⚠️ | `navigation/rich-sidebar/hooks/use-sidebar-reducer.ts:60-72` | Controlled `isCollapsed`/`isMobileOpen` honored only on prop *change*: internal toggle diverges from a constant controlled prop and the prop never wins it back. Make the prop win at read time (`props.isCollapsed ?? …`). |
| 5.5 | ⚠️ | `layout/workspace/workspace.tsx:96-114` | Controlled `layout` echo: user edit → notify `T1` → prop-driven revert → **notify `L0` again** — edit announced then un-announced, with a visible snap-back flash even for correct parents. Tag prop-originated replaces so the notify effect skips them. |
| 5.6 | ⚠️ | `file-tree/parts/file-tree-row.tsx:121`, `file-manager/parts/file-manager-item.tsx:99` | "Roving tabindex" is state-only — **no `.focus()` call ever moves DOM focus**, no `aria-activedescendant`. Arrow-nav invisible to screen readers; `focus-visible:ring` dead; meta.ts advertises the feature. |
| 5.7 | ⚠️ | `file-manager/hooks/use-drag.ts:241-256` | Item `dragover` sets the drop target; the ancestor scroller handler (no `stopPropagation`) clears it in the same batch → drop-target highlight never renders and cursor shows "no-drop" over legal targets (drop still works — feature *looks* broken). |
| 5.8 | ⚠️ | `code/code-block/hooks/use-code-mirror.ts:68-151` | Async mount window: prop changes while the dynamic lang import resolves hit `viewRef.current === null` sync effects and are **permanently lost**; editor created from stale closure value. Also `tabSize`/`editorExtensions` silently non-reactive. |
| 5.9 | ⚠️ | `code/code-block/hooks/use-shiki-highlighter.ts:33-41` | Declared `ShikiThemeObject` support drops the object, tries `import("shiki/themes/<name>.mjs")`, fails, then `codeToHtml` throws in un-try-wrapped `run()` → unhandled rejection + permanently blank block. `loadTheme(entry)` + fallback. |
| 5.10 | ⚠️ | `code/code-block/code-block.tsx:330-339` | Expand-modal clone spreads `{...props}` including `ref` → **consumer's imperative handle re-targets the modal instance** and goes stale on close. Add `ref={undefined}`. (Also `:307` `null as never` unsound cast in header slot ctx.) |
| 5.11 | ⚠️ | `media-editor-01/hooks/use-media-capture.ts:168-278` | `acquire()` has no cancellation: getUserMedia resolving after release/unmount **orphans a live camera stream (LED stays on)**; photo↔video flip interleaves two acquires and silently overwrites A's stream without `track.stop()`. Epoch/cancel token per acquire. |
| 5.12 | ⚠️ | `gamification/team-feedback-loop-01/parts/team-feedback-loop-root.tsx:142-153` | Controlled `event` is **identity-diffed** — an inline object literal (idiomatic React) re-dispatches `open` every parent render: auto-dismiss never fires while parent re-renders; a skipped celebration **re-opens** on the next render. Content-compare + explicit nonce escape hatch, or loud identity-contract docs + dev-warn. |

## 6. Component internals — Medium

- 🔸 `media-editor-01/hooks/use-history.ts:85-106` + `media-editor-01.tsx:309` — undo/redo is dead API (zero `execute` callers) yet binds a **window** Ctrl/Cmd+Z listener that `preventDefault`s page-wide while mounted, doing nothing.
- 🔸 `media-editor-01/parts/editor-canvas.tsx:149-153,493-518` — crop mapping and photo export ignore the pan/zoom transform (merely disabled, not reset) → zoom-then-crop crops the wrong region; export while zoomed bakes the viewport in.
- 🔸 `story-composer-01` + `use-image-uploader.ts:146-149` — `xhr.onabort` neither resolves nor rejects → `await handle.publish()` hangs forever after Cancel; cancel-during-composite resurrects the upload when `export()` resolves.
- 🔸 `media-editor-01/lib/composite-video.ts:99-185` — captureStream tracks never stopped; error paths leave the hidden source video playing; no abort path.
- 🔸 `data/blackboard-01/hooks/use-blackboard-state.ts:257-266` — `retryPost` runs the `onPostNote` network call **inside a `setExtras` updater** → StrictMode double-invoke = duplicate server notes.
- 🔸 `data/flow-canvas-01` — viewport never tracked after mount (no `onMoveEnd`) → exports/`onChange`/save-restore persist the mount-time camera; callbacks captured inside updaters can silently not fire (`updateNodeData:503-517`, `extractSubObject:596-628`) and `fireOnChange`-in-updater double-fires under StrictMode.
- 🔸 `forms/json-form/hooks/use-json-form.ts:162-169` — `handle.submit()` flattens only top-level errors; nested error trees return `{ok:false, errors:{}}`. The correct recursive flattener already exists (`lib/flatten-errors.ts`) — use it.
- 🔸 `layout/workspace/lib/ids.ts:5` — `Date.now()` area ids minted in the render-path lazy initializer, emitted as `data-area-id` → SSR hydration mismatch for default-tree Workspace. (`useId()` seed; rich-sidebar is the in-repo precedent.)
- 🔸 `layout/workspace` a11y — splitter `role="separator"` with `tabIndex={-1}` (keyboard-unreachable despite a correct handler, no label); `CornerHandle` ×4/area `role="button"` pointer-only (should be `aria-hidden`).
- 🔸 `layout/workspace/hooks/use-corner-gesture.ts:70,183` — deps keyed on `dragState` object → 4 listeners torn down/re-bound **every pointermove**; key on `dragState !== null`.
- 🔸 `navigation/rich-sidebar/hooks/use-storage-sync.ts:46-50` — rehydration replays only collapse dispatches → a user-expanded `defaultCollapsed` section re-collapses on every reload (expand never survives).
- 🔸 `navigation/rich-sidebar/lib/build-handle.ts:99-101` — `focusFirstItem()`/`focusLastItem()` both dispatch `itemId: null` — public no-ops on both the ref and headless-hook paths.
- 🔸 `navigation/file-manager/hooks/use-marquee.ts:107-112` — window pointer listeners removed only in `handleUp`; unmount mid-drag leaks all three + setState-on-unmounted.
- 🔸 `feedback/detail-panel/detail-panel.tsx:72-77` — every selection change unconditionally steals DOM focus to the panel → arrow-keying a master list loses focus after one keystroke. Also `:156-165` — `DetailPanel.Header/.Body/.Actions` namespace-object compound + `as unknown as` cast, against the repo's own flat-exports rule.
- 🔸 file-manager grid: `role="grid"` → keyless div → `gridcell` with **no `role="row"`** anywhere; file-tree: unroled wrappers between `tree` and `treeitem`s; no `aria-multiselectable`.
- 🔸 `gamification/team-trophy-shelf-01` root:49-54 — newly-earned diff **replaces** `newAwards` wholesale → a second `badges` update mid-reveal cancels the first badge's animation. Union with still-pending ids.
- 🔸 `gamification/team-quest-log-01/parts/chapter-beat.tsx:108` — `<button role="listitem">` overwrites the button role → AT hears a list item, not a button. (ChapterRail's custom-render branch already does it right.)
- 🔸 gamification "viewed" telemetry drift — progress-bar: IO threshold 0; quest-log: IO 0.5; **trophy-shelf: bare mount effect** (below-the-fold still "viewed"). Three meanings of one verb.
- 🔸 gamification live regions (`celebration-overlay.tsx:37`, coop header:33) mounted **with** their content → not announced by VO/Safari & older NVDA. task-choice does it correctly (persistent sr-only region); port that.
- 🔸 gamification lazy-chunk barrels (`team-feedback-loop-01/index.ts:15`, trophy-shelf:14) — static re-export of the confetti/award hosts risks folding the `canvas-confetti` dynamic import into the main chunk in consumer app-source installs. Verify with a bundle analyze; the repo's own rewriter memory prescribes the safer shape.
- 🔸 `task-choice-control-01/parts/assignee-chip.tsx:100` — `CommandItem value={displayName}` collides for duplicate names → wrong-member `onSelect`. Use id in value + `keywords`.
- 🔸 `marketing/share-bar-01/parts/templates.ts:43-48` — mailto built with `URLSearchParams` → literal `+` for spaces in mail clients ("Check+this+out"). Percent-encode.
- 🔸 `code/code-block/dummy-data.ts:63-67` — module-scope `Math.random()` in a shipped fixture → hydration mismatch + non-deterministic consumer fixture. Freeze the coordinates.
- 🔸 Fixture URLs — pravatar.cc / picsum / placehold.co hotlinks in shipped fixtures; `video-player-01` captions track points at dead `example.com/.vtt` (captions silently broken everywhere); `SAMPLE_UPLOAD_URL = example.com` copy-paste trap. Converge on vetted Unsplash or inline SVG data-URIs (media-editor's generator is the precedent).

## 7. Low (selected)

- 🔹 `workspace.tsx:151` — one non-dev-gated `console.error` in shipped code (the only one found).
- 🔹 `use-camera-permissions.ts:55` — permission `change` listener binds to the first `PermissionStatus` only.
- 🔹 carousel F13 — cache-restored item re-edit leaks the displaced pre-edit blob URL (tombstone-revoke at composer root).
- 🔹 `use-media-editor-state.ts:251` — `revokeObjectURL` inside setState updater (impure; harmless double-revoke today). Same purity class as blackboard 🔸 above.
- 🔹 `media-editor-01.tsx:246` — `initialSource` effect keys on object identity (inline literal → cancel/revoke/refetch every render).
- 🔹 `editor-camera.tsx:116-155` — shutter failures swallowed silently (`catch {}` admitted by its own comment).
- 🔹 `media-editor-01.tsx:1410` — tool chips render the raw enum, ignoring `mergedLabels` (i18n dead-end).
- 🔹 gamification: `Math.round` reports 100% at ≥99.5% (`min(round,99)` until done); `NaN` value sails through clamps to `aria-valuenow`; `querySelector` id interpolation without `CSS.escape`; evicted event's `onCelebrationDismiss` never fires ("replaced" reason missing); claim-button silent no-op without `currentMemberId`; dead exported `TaskChoiceInteraction` type; RTL tick centering; misleading fraction-mode dev-warn; `.reveal-up`/`animate-in` classes not shipped via registry (library-wide, graceful degradation).
- 🔹 file-tree `ArrowUp` from no-focus lands on the first row (APG expects last); account-switcher listbox options are tab stops + `aria-controls` dangles while closed; grid-layout-news index keys across filtered/paginated list (needs `getItemKey`); code-block unstable `themes`/`highlightedLines` deps double tokenization work; file-manager type-ahead timer never cleared on unmount; rich-sidebar `onCollapsedChange` suppressed for storage rehydration (consumer mirrors desync); unused eslint-disables + `showDesktopHeader` unused var (lint warnings).

## 8. What is genuinely strong

1. **Distribution engineering is defended, not assumed** — 63/63 base+fixtures pairs with uniform targets and zero docs-file leakage; `_shared/file-clipboard` target-path chain verified end-to-end in the built artifact; tail type re-exports for the rewriter; validators wired as hard gates in `registry:build`.
2. **A real house style for the hardest state problems** — single-chokepoint mutation dispatchers with veto-before-dispatch (gantt/calendar), echo-loop defenses (json-form ChangeBridge, flow-canvas structural resync guard), latest-callback-ref discipline everywhere, structural-sharing pure mutation libs with correct same-parent-move index math.
3. **SSR/hydration discipline is deliberate** — `useSyncExternalStore` with server snapshots, deterministic UTC formatting, fixed spark offsets, setState-during-render prev-props diffs done textbook-correctly (trophy-shelf), `useMagazineFilter`'s render-phase adjust pattern with compiler-aware comments.
4. **Suppression hygiene is exemplary** — zero rote TODOs in shipped code; ~60 eslint-disables and 1 `@ts-expect-error`, effectively all load-bearing with inline rationale tied to F-numbers/plan sections.
5. **Design-token compliance is near-total** — no font drift, max chroma exactly at the 0.20 ceiling, no white-page surfaces, no gradient clichés, third-party surfaces (xyflow, Shiki, highlight.js) mapped onto the token system; one non-gated console.error in 63 components.
6. **A11y groundwork above par for a component library** — roving-tabindex trees (where actually wired), dnd-kit custom announcements, aria-live status regions, focus-restore after keyboard transients, motion-reduce discipline — the findings above are gaps in a system that clearly takes this seriously, not an absence of one.

## 9. Recommended sequencing

1. **Patch-bump batch A (broken flows):** 1.1 + 1.3 + 1.4 (one design gap: editorState/blob restore), 1.2, 1.5, 1.6.
2. **Patch-bump batch B (data corruption):** 2.1, 2.2, 2.3 (+2.5 cheap), then 2.4 as the family date-only convention hoist.
3. **Infra hardening (one PR):** 3.1 + 3.2 + 3.3 + 3.4 — fix the two undeclared deps, then land the reverse-npm check and registry.json validator so the class is closed; re-run Base-UI consumer smoke.
4. **Docs site quick wins:** 4.1 (one-line), 4.2/10.1 (generate docs + llms.txt + README catalog from manifest, fix category count), 4.3 (`error.tsx`), 10.2 (SSR the unfiltered grid in the Suspense fallback), 10.3 (naming sweep). Run the 10.4 src-layout smoke before the next Model-B conversation.
5. **Security:** 5.1 markdown sanitization — small, isolated, ship-now.
6. Remaining HIGHs per component owner (5.2-5.12), then Mediums opportunistically on next touch of each component, per the patch-bump-no-review-needed rule.

---

## 10. External user review — validation (added 2026-08-10)

A user-supplied review of the public site (homepage / docs / llms.txt) was validated claim-by-claim against source. Results:

| # | Severity | Claim | Verdict + evidence |
|---|---|---|---|
| 10.1 | ⚠️ | "Homepage claims 63 · 11, docs/llms.txt say eight — numbers contradict" | **Confirmed, with a correction:** the homepage is *live-derived* (`getMetaList().length` + `ORDERED_CATEGORIES.length`, `src/app/page.tsx:7-8,48-49`) so it is accurate; the stale side is `docs/page.tsx:96-139` + `llms.txt` ("Available items (16 total — 8 base + 8 fixtures)", "The `/components` index lists all eight", stale `force-graph` note also duplicated in `README.md:116`). Same root cause as **4.2** — folds into it. **New wrinkle the reviewer's count implies:** homepage says **11 categories** but only 9 contain components (`overlays` and `auth` are empty in `src/registry/components/`) — the marketing surface overclaims by two. Fix: derive the category count from categories *with ≥1 component*, and generate docs/llms.txt/README catalog sections from the manifest. |
| 10.2 | 🔸 | "/components index appears empty to crawlers — client-rendered, no SSR'd list" | **Confirmed.** `src/app/components/page.tsx:28-30` wraps the entire list in `<Suspense>` around `ComponentsExplorer` (client component using `useSearchParams`) → static prerender emits only `ExplorerFallback` — six pulse-skeleton divs, zero component names/links in the HTML. Crawlers and no-JS AI agents browsing the site see an empty catalog (llms.txt/registry.json remain machine-readable; detail pages are statically generated but unlinked from the index HTML). Cheap fix: make the Suspense fallback render the real **unfiltered** grid (it's server-rendered; users get it replaced on hydration) — plus the `sitemap.ts` from 4.6. |
| 10.3 | 🔹 | "Four naming variants across one site" | **Confirmed.** `ilinxa-ui-pro` (homepage/layout/sandbox/detail titles), `ilinxa/pro-ui` (llms.txt:1, README:1, registry.json homepage, all GitHub URLs), `ilinxa-proui` (docs metadata `docs/page.tsx:5-7` + the Vercel host), `ilinxa pro-ui` (docs prose `docs/page.tsx:30`) — plus the repo folder `pro-ui`. Pick one canonical form (suggest: brand = **ilinxa pro-ui**, host/handle = `ilinxa-proui`, npm-style refs never used since it's not a package) and sweep — pairs with the hardcoded-URL consolidation in 4.6. |
| 10.4 | 🔸 | "Install-path gotcha documented but not solved; verify whether target paths force it" | **Confirmed documented-not-solved, and the two doc mentions disagree on the mechanism:** `llms.txt:48` says files land at project-root `components/<slug>/` and blames a `./src/components/` layout; `llms.txt:84` blames a non-default `aliases.components`. Both can't be the whole story. The locked `target: "components/<slug>/..."` convention is what puts resolution in the CLI's hands. **Open verification item:** run the existing tmp-consumer smoke once with a `src/`-directory layout (and once with a custom `aliases.components`) and record where the CLI actually writes explicit-target files — then either fix the targets, or make the doc precise. Prior smokes used non-src layouts, so this path is genuinely untested. |
| 10.5 | 🔹 | "Decide what 1.0 means before client-facing sales material" | **Advisory, accepted.** All 63 components sit at v0.x with per-component versions; the tier charter defines `alpha → beta` promotion but no library-level 1.0 criteria. Worth a decision file when Model-B/sales motion starts — candidate bar: reverse-npm validator + registry.json validator landed (3.2/3.4), Base-UI smoke green across all items, the §1 broken-flow batch closed, docs generated-not-hand-written (4.2/10.1). |

Reviewer's praise checked out too: the dual-item fixtures pattern, the "not an npm package" framing, and the failure-mode anticipation in llms.txt §gotchas are real strengths (§8.1) — which is exactly why the stale catalog (10.1) and untested src-layout path (10.4) are worth fixing first: they undercut the site's best asset.

---

*Review conducted 2026-08-10 by AI-assisted multi-pass deep read (per readiness-review rule's AI-assisted provision). All findings verified against source before inclusion; spot re-verification of the highest-severity claims performed independently of the originating pass.*
