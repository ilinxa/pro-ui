# Loop state — `carousel-composer` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: patch) |
| **Current stage** | CLOSED — shipped in `85b9e87`, deploy verified 2026-10-23 |
| **Sign-off policy** | patch — architect proceeds (batch plan docs/plans/fix-now-batch-plan.md, sign-off delegated by user 2026-10-23) |
| **Version target** | v0.2.0 -> v0.2.1 |
| **Model roster** | architect: main session · implementers: Sonnet 5 |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

## Stage checklist

- [x] U0 Intake & impact — blast radius + reproduction recorded below
- [x] U1 Change contract — batch plan (docs/plans/fix-now-batch-plan.md); sign-off per policy above
- [x] U2 Implement — slice table below
- [x] U3 Gate battery — gates 1–8 green (batch gate battery, docs/plans/fix-now-batch-plan.md)
- [x] U4 Adversarial review — architect self-check (patch); findings table below
- [x] U5 Runtime & smoke — `pnpm build` ✓ (77 pages); consumer smoke (shadcn@4.18.0, local `public/r`): 23/23 installs exit 0, consumer `tsc` 0 errors; cssVars land only in `@theme inline`; base media-editor compiles without the capture slice
- [x] U6 Docs sync & GATE 3 — guides/meta current; minors reviewed in spotcheck files (Pass with follow-ups); patches: architect self-check (no review file per ladder)
- [x] U7 Ship — `85b9e87` (fix-now batch) pushed to master; Vercel deploy verified 2026-10-23 (live `/r/*.json` carry the new files + `cssVars`). Decision: `.claude/decisions/2026-10-23-fix-now-hardening-batch.md`

## Run B4 — carousel-composer v0.2.0 -> v0.2.1

### U0 Blast radius

| Surface | Why touched | Synced (stage 7) |
|---|---|---|
| `media/content-composer` | wraps carousel-composer; uses handle.openEditor only for images in practice - re-verify at coordinator smoke | (architect, stage 7) |
| `registry.json` | no change | (architect, stage 7) |

### Reproduction (written before the fix)

- Bug: `handle.openEditor(id)` (hooks/use-carousel-state.ts) had no kind guard: a video id set editingId, mounted EditPanel -> media-editor export() would re-encode the video.
- `useCarouselState({defaultValue:[image, video]})`; `openEditor(videoId)` -> editingId === videoId (pre-fix). Falsified: guard disabled -> `open-editor-guard.test.tsx` 'no-op for a video item' fails.

### Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | `openEditor` refuses non-image items (dev-warn, no-op, no onEditOpen) | implementer (Sonnet 5) | done | `hooks/use-carousel-state.ts` |
| 2 | `EditPanel` refuses non-image item (dev-warn, calls onCancel, renders null) | implementer (Sonnet 5) | done | `parts/edit-panel.tsx` |
| 3 | `videoNotEditable` default unpinned; guide section 11.6, demo.tsx, usage.tsx, meta.ts corrected | implementer (Sonnet 5) | done | `types.ts, demo.tsx, usage.tsx, meta.ts, guide` |

### Invariants

| # | Invariant (testable) | Reviewed | Observed live |
|---|---|---|---|
| I1 | openEditor(videoId) leaves editingId null and fires no onEditOpen | (architect) | (architect) |
| I2 | openEditor(imageId) unchanged | (architect) | (architect) |
| I-neg | EditPanel never mounts media-editor for a video | (architect) | (architect) |

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
| architect self-check (patch) | no findings beyond the contract; diff read by coordinator | architect | NONE | `__tests__/open-editor-guard.test.tsx` | — |

### GATE verdict

(architect)

### Parked

- Stale version-pinned deferrals flagged by `validate:inert-surfaces` (pre-existing backlog, T1).

---

# Run — Part 3 (social-platform request §5.2 CC1–CC8)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking install graph** — editing moves to an optional feature item; everything else additive; 0.x minor) |
| **Current stage** | CLOSED (release 6, `e8976ac`) — see "Run — Part 3 release 6" below |
| **Sign-off policy** | user-interactive; composed by content-composer → always the user's call. Push: the user granted push-without-asking for each Part 3 release after a final consistency review (2026-10-25). |
| **Version target** | v0.2.2 → **v0.3.0** + new item `carousel-composer-editing` 0.3.0 + a minimal content-composer patch in the same push |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.2 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:966-1033`) as amended by the digest §Part 3
"carousel-composer" and locked decision 5 (feature item, injection prop, orphan list, content-composer must wire it).

## Stage checklist (run Part 3)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** platform 2026-10-25 (`PROUI_REPLY_2026-10-25_PART3.md`); the user's go is given per release (order in the platform reply)
- [ ] U2 · [ ] U3 · [ ] U4 · [ ] U5 · [ ] U6 · [ ] U7

## U0 — Intake

Not in `closed`. Baseline 7 rows: template-fill 5 (`carousel-composer.tsx` `{max}`, `parts/media-dropzone.tsx` `{max}`,
`parts/rail-thumb.tsx` `{kind}` / `{n}` / `{total}`), jsx-literal 2 ("Dismiss", "Adding media…"). Also decision 3:
`bg-black/*` / `text-white` in the preview and rail. One test file. Built 60.0 KB / budget 70.

| Item | Code today | Verdict |
|---|---|---|
| CC1 media-editor optional | `parts/edit-panel.tsx:6` static `MediaEditor` import; `types.ts` imports and re-exports six media-editor types; `registryDependencies` has `@ilinxa/media-editor` (→ Konva); `EditPanel` exported | confirmed → decision 5 |
| CC2 editable | copy + guards fixed (0.2.1); still hard-coded `canEdit = kind === "image"` (`carousel-composer.tsx:236`) | partial |
| CC3 per-item alt | no `alt`; `<img alt={fileName}>` | confirmed |
| CC4 status / progress / retry | none | confirmed |
| CC5 type / duration | prefix check `image/` / `video/` (WebM accepted); `accept="image/*,video/*"`; no duration limit | confirmed |
| CC6 poster | none (video thumbs use `<video preload=metadata>`) | confirmed |
| CC7 never WebM | no `MediaRecorder` in the folder; intake keeps the original `File` | already holds — test only |
| CC8 strings | "Dismiss", `"${n} item(s) added"`, four English drag announcements (built once with empty deps), "Adding media…", `.replace` templates, English validation messages | confirmed |
| Request: physical rail classes | already logical (R6) | wrong today |

**Coupling to media-editor (complete):** the static import; six type imports + re-exports; `editorProps`
(`Pick<MediaEditorProps, …>`); item fields `editorState` / `sourceBlob` / `exportMeta`; handle `openEditor`;
`onEditOpen` / `onEditApply` / `onEditCancel`; seven edit labels; edit state in `use-carousel-state.ts` + `ApplyEditPatch`;
`EditPanel` exports; registry deps; the Edit button in `MainPreview`; the aspect passed to the editor.

**Dependent: content-composer** — registry deps on carousel-composer + media-editor; its substrate imports
`CarouselComposer` / `MediaCarouselItem` from the `.tsx` tail band and uses `editorState`, `exportMeta`,
`revokeOnUnmount={false}`, `editorProps={{ enabledTools }}`. What it needs from the injection surface (recorded for its
GATE 1 redesign, not designed here): the tail type band kept; a stable `editing` prop taking a ready extension;
`editorState` / `sourceBlob` still travelling so re-edit works; `revokeOnUnmount` kept.

## U1 — Change contract (proposed)

- **CC1 (feature item, per `docs/feature-slicing-convention.md` and the `media-editor-capture` pilot):** the base keeps a
  seam (`hooks/use-editing-extension.ts`) and one prop `editing?: CarouselEditingExtension` whose `Panel` receives
  `{ item, aspect, labels, onApply(id, patch), onCancel, editorProps? }` — the platform's `renderEditor` shape, so a host
  can inject its own editor. New item **`carousel-composer-editing`** (`features/editing/`: the moved edit panel +
  `carouselEditing` value; deps `@ilinxa/carousel-composer`, `@ilinxa/media-editor`). Base deps → `button`,
  `scroll-area`. Base types become standalone (local aspect union; opaque `editorState`; structural `exportMeta`);
  media-editor types move to the feature barrel. No Edit button without `editing`; `openEditor` / `editorProps` without
  it → one dev-warn (self-disclosing). Guide gets "Removed in v0.3.0 — delete `parts/edit-panel.tsx`".
- **content-composer patch (same push):** add `@ilinxa/carousel-composer-editing` to its registry deps and pass
  `editing={carouselEditing}` in the substrate, so installed trees keep editing. Nothing else.
- **CC2:** `canEditItem?(item)` (default images only).
- **CC3:** `item.alt?`, an alt field in the preview (`labels.altLabel` / `altPlaceholder` / `altCounter`),
  `maxAltLength?` (default 200); `<img alt>` = `alt ?? fileName ?? ""`.
- **CC4:** `item.status?` / `progress?` / `error?`, `onRetry?(item)`; progress on thumb + preview (`role=progressbar`),
  polite announcement on status change; handle `updateItem(id, patch)` for uncontrolled hosts.
- **CC5:** `acceptMime?` / `acceptVideoTypes?` (default permissive, today's behaviour), exported
  `PLATFORM_SAFE_MIME`; `maxVideoSeconds?`; kinded errors (`video-too-long` added) with label functions.
- **CC6:** poster frame at `posterAt` (default 0.5 s) → `item.posterBlob` (JPEG); `item.duration`; duration badge via
  `formatDuration?` / `locale`. No frame picker (not shipped as a stub).
- **CC7:** tests only (identical `File`; no `MediaRecorder` in shipped source).
- **CC8:** every string above to `labels` (string-or-function; today's English defaults; announcements rebuilt when
  labels change).
- **Also:** media-overlay tokens; RTL rail demo; `describeContract`, `locale="tr"` + hydration, axe; remove version-pinned
  "v0.1" wording (inert-surfaces rule).

### Invariants

| # | Invariant |
|---|---|
| I1 | a video item is never edited or re-encoded: the output is the original `File` |
| I2 | controlled `value` wins every render; `onChange` payload only grows |
| I3 | defaults: accept, `maxItems` 10, `maxFileSizeMb` 50, `aspect="auto"`, English labels |
| I4 | object-URL ownership; `revokeOnUnmount={false}` honoured |
| I5 | the `.tsx` tail band keeps `MediaCarouselItem` / `MediaKind`; handle methods stay (none becomes empty) |
| I6 | with the editing item, image editing behaves exactly as today |

### Size

60.0 KB / 70; estimate base ~64 KB (+9 features, −6 edit panel, +1.5 seam); feature item ~8 KB.

### Open questions (in the proposal)

1. Default stays permissive (WebM accepted) and they pass `PLATFORM_SAFE_MIME` — recommended.
2. Editing through an `editing` extension whose panel has their `renderEditor` shape — will they inject their own editor
   or install ours?
3. Upload status: controlled `value` (recommended) — confirm.
4. Poster frame picker needed now? Recommendation: later.

### Platform reply (Part 3 run)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_PART3.md`: scope signed off as proposed, including every breaking change. Release order: (1) story-viewer 0.5.4 → 0.6.0 · (2) media-editor 0.5.0 + story-composer 0.6.0 · (3) filter-bar 0.3.0 + entity-picker 0.2.0 · (4) post-card 0.6.0 + comment-thread 0.4.0 · (5) carousel-composer 0.3.0 (+ content-composer patch) · (6) app-sidebar 0.6.0, whenever convenient.

- They will **install ours** (`@ilinxa/carousel-composer-editing`), not inject their own editor. The panel still takes the `renderEditor` shape (public seam).
- Questions 1, 3, 4 not contested → as recommended (permissive default + `PLATFORM_SAFE_MIME`; controlled `value` for status; no frame picker).

### Pre-U2 scope review (2026-10-25) — corrections

Source: `.claude/review-2026-10-25-part3-scope.md` (fresh Sonnet finder + architect). Where these lines differ from the text above, these win.

- **Panel shape, stated honestly:** the editing panel gets a **superset** of the requested `renderEditor` argument — `{ item, aspect, labels, onApply(id, patch), onCancel, editorProps }`; `onApply` takes an id + patch (`ApplyEditPatch`), not a blob. The proposal said "exactly your shape" — corrected in the guide and the report-back (they install ours, so no change on their side). [F-08]
- Overlay colours ship through the `--media-overlay` `cssVars.theme` mapping on this item. [F-09]
- Migration note: the deprecated alias `media-carousel-editor-01` (→ carousel-composer) also loses editing unless `carousel-composer-editing` is added. [F-18]

---

# Run — Part 3 release 6 (0.3.0 + `carousel-composer-editing` 0.3.0 + content-composer 0.3.3)

| Field | Value |
|---|---|
| **Current stage** | CLOSED — shipped `e8976ac`, live-verified 2026-10-26 |
| **Go** | user 2026-10-26 ("go", after the platform's release-5 reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-26_RELEASE5.md` said go on release 6). Execution delegated for this release; scope signed by the platform 2026-10-25. Push under the Part 3 grant after a final consistency review. |
| **Release** | carousel-composer 0.3.0 (breaking: install graph + label functions + opaque `editorState`) · new feature item `carousel-composer-editing` 0.3.0 · content-composer 0.3.3 (patch: wires the add-on) |
| **Ladder** | breaking → 2 fresh finders + dependents axis (content-composer, the `media-carousel-editor-01` alias) · broad spotcheck · smoke slug + content-composer + the feature item + base-without-feature |
| **Roster** | architect: main session · implementers: Sonnet 5 ×2 (A editing seam + content-composer; B CC3–CC8) · finders: fresh Sonnet 5 |

## U2 — architect decisions (types fixed first: `types.ts` written by the architect)

Re-checked before U2: no commit touched either folder since the U0 intake (last: `72263e0`, `85b9e87`); versions
0.2.2 / 0.3.2. Where these differ from U1, these win.

1. **No media-editor type in the base.** `editorState?: unknown` (opaque; the add-on writes media-editor's
   `MediaEditorState`); `exportMeta?: CarouselExportMeta` (`width`, `height`, `mimeType`, `durationMs?` —
   media-editor's `ExportMetadata` is assignable to it); local `CarouselAspectRatio` (same five values) with a
   deprecated `AspectRatio` alias; `editorProps?: Readonly<Record<string, unknown>>`. The add-on exports typed readers
   `editorStateOf(item)` / `exportMetaOf(item)` and the type `CarouselEditorProps` (the old `Pick<MediaEditorProps, …>`).
   A structural copy of `MediaEditorState` was rejected: it pulls `TextOverlay`, `PlacedSticker`, … and drifts.
2. **Seam:** `editing?: CarouselEditingExtension` = `{ Panel: ComponentType<CarouselEditorPanelProps> }`;
   `CarouselEditorPanelProps = { item, aspect, labels (editDone / editCancel / editSaving / editError), editorProps?,
   onApply(id, ApplyEditPatch), onCancel }`. `ApplyEditPatch` moves to `types.ts` (the hook re-exports it). Without
   `editing`: no Edit button, no "video not editable" caption, `openEditor` and `editorProps` each warn once (dev).
3. **content-composer 0.3.3** imports `carouselEditing`, `editorStateOf`, `exportMetaOf` from
   `../../carousel-composer/features/editing` (same pattern as its `../../media-editor/features/capture` import) and
   adds `@ilinxa/carousel-composer-editing` to its registry deps. The two reader calls are the only other change (its
   draft refs are typed with media-editor's types).
4. **Labels:** varying strings are functions (`dropzoneHint(max)`, `maxReached(max)`, `itemAria({ position, total,
   kind, alt, status })`); an old string template is ignored (English default) with one dev warning naming the key —
   the post-card 0.6.0 rule. New keys for every hard-coded string (`dropzoneBusy`, `dismissErrors`, `itemsAdded`,
   `itemRemoved`, `drag.*`, errors as functions). `defaultCarouselComposerLabels` + deprecated `DEFAULT_CAROUSEL_LABELS`.
   The reorder no longer also announces "Drag to reorder" (dnd-kit's drag announcements already speak; removal
   announces `itemRemoved`, not "Remove").
5. **Alt text is opt-in** (`enableAltText`, default false; `maxAltLength` 200): no visible change for current hosts
   (content-composer's draft refs carry no alt). `<img alt>` = `alt ?? fileName ?? ""`.
6. **One type filter:** `acceptMime` (exact allow-list, also the input's `accept`) + `PLATFORM_SAFE_MIME`; the U1
   `acceptVideoTypes` is dropped — `acceptMime` covers it. Default stays permissive (platform Q1).
   `maxVideoSeconds` reads `video.duration` on add; an unreadable duration is accepted (cannot be checked).
7. **Upload status is host-owned:** `status` / `progress` / `error` on the item (controlled `value`, or the new handle
   `updateItem(id, patch)`); `onRetry(item)` shows Retry on an error item; a polite announcement on each status
   CHANGE (`labels.uploadStatus`), never per progress tick.
8. **Video:** `duration` + JPEG `posterBlob` / `posterUrl` (owned + revoked by the carousel) grabbed at `posterAt`
   (default 0.5 s; `false` = none); duration badge via `formatDuration` / `locale`. No frame picker (platform Q4).
   A video item's `blob` is the original `File` (CC7).
9. **Tokens:** `bg-black/*` / `text-white` → `bg-media-overlay` / `text-media-overlay-foreground` with the
   `cssVars.theme` mapping on the base item (as story-viewer).

## U2 — result

- **Slice A (Sonnet, editing seam + content-composer):** `hooks/use-editing-extension.ts`, `hooks/use-warn-once.ts`,
  `features/editing/{index.ts, lib/accessors.ts, parts/edit-panel.tsx}` (the moved panel), `parts/edit-panel.tsx`
  deleted, barrel + tail band updated, content-composer substrate wired (`editing={carouselEditing}`, readers in
  `serialize`), content-composer `meta.ts` 0.3.3. Tests `editing-seam` (7), `install-graph` (2), content-composer
  `carousel-editing` (1), `open-editor-guard` (3); 8 falsifications CAUGHT. Process slips: `git mv` (staged the
  rename — harmless) and whole-file snapshot restores during falsification while slice B was editing (B re-checked
  and re-applied one overwritten batch).
- **Slice B (Sonnet, CC3–CC8):** `lib/{labels, poster, format-duration}.ts`, `parts/{alt-field, item-status,
  upload-progress}.tsx`, intake / validation / thumb / dropzone / preview reworked, demo tabs (Upload status, Türkçe,
  Arabic RTL). Tests `contract` (7), `features` (28); 15 falsifications CAUGHT. Found and fixed a real a11y bug: the
  add-more tile nested its `<input type=file>` inside a `<button>` (axe `nested-interactive`).
- **Architect:** `types.ts`; accepted B's proposal `labels.drag.instructions` (dnd-kit's own English keyboard
  instructions could not be overridden — passed as `screenReaderInstructions`; test `drag-instructions`, falsified
  CAUGHT; Turkish + Arabic fixtures); test `editor-props-type` (the add-on's `CarouselEditorProps` is assignable to
  the base's untyped `editorProps`); registry.json (base roster from the folder, deps − media-editor + input,
  `cssVars.theme` media-overlay + destructive-foreground, new item, content-composer dep), `meta.ts`, `usage.tsx`,
  CHANGELOG, contract baseline (7 rows cleared, `closed` 19 → 20).

## U3 — gates

First battery: tsc 0 · lint 0 · build 0 · `registry:build` FAILED, four gates in turn, each a real catch:
1. `validate:meta-deps` — my `meta.ts` ended `dependencies` with `npm`, and the parser's lazy regex then stopped at
   npm's closing brace (npm read as empty → 4 false "undeclared-npm"); the walker also counts `features/editing/`'s
   media-editor import → `internal: ["media-editor"]` with a comment (the base registry item still has no such dep).
2. `validate:naming` — three descriptions over 160 characters → shortened.
3. `validate:registry-tokens` — `text-destructive-foreground` without a `cssVars.theme` mapping → mapped (the
   repo's existing fallback `var(--destructive-foreground, var(--background))`).
4. `validate-registry-deps` (heavy edges) — its doc says feature slices are the sanctioned route to a heavy item
   (locked decision 5) but the code exempted only a slice's edge to its own base. **Gate fixed:** a slice's own edges
   are exempt and a slice that reaches a heavy item is heavy itself (`sliceCarriesWeight`), so an edge INTO it still
   counts; test added (both halves falsified CAUGHT; one redundant call found by falsification and removed).
   Baseline: 4 stale rows deleted (`carousel-composer → media-editor` ×2, `content-composer → carousel-composer` ×2),
   1 added (`content-composer → carousel-composer-editing`, owner: content-composer re-design) — 22 → 19.
5. `validate:artifact-size` — base **90.4 KB** vs 70 (U1 estimate ~64): labels surface + JSDoc + the new features →
   provisional budget 100; feature item 9.2 KB → 11. Re-checked after U4 fixes.

Then: `registry:build` 0 · tests **183 files / 2523 passed, 6 skipped** · tsc 0.

## U4 — adversarial review (2 fresh Sonnet finders on the frozen snapshot `scratchpad/snap-r6/`)

Finder 1: the base's behaviour (controlled mode, status, object URLs, intake, labels / a11y / SSR, every CC "Accept:"
line). Finder 2: the seam, dependents (content-composer, the alias), install graph, public API, the gate change.
27 rows; architect verdicts below (each verified in code before ruling).

## Finder 1 (base behaviour) — 15 rows

| # | Sev | Finding | Verdict | Fix |
|---|---|---|---|---|
| A1 | ⚠️ | handle `getItems` / `export` read a passive-effect ref (`carousel-composer.tsx:153-156`) → stale inside `onItemAdd`, after `updateItem` in the same tick | CONFIRMED (code read; pre-existing in 0.2 but now matters: `updateItem` + `export` is the upload flow) | read the hook's synchronous ref (expose `getItems()` from `useCarouselState`) |
| A2 | ⚠️ | handle `addFiles` stale closure (deps omit it, "intentional") → old labels / `maxItems` / `maxVideoSeconds` / `onValidationError` | CONFIRMED (`:251-272`) | latest-ref (`addFilesRef.current`) |
| A3 | 🔸 | focus to `<body>`: thumb Retry / preview Retry unmount when the host flips to uploading; Remove unmounts the thumb (last item → dropzone) | CONFIRMED (no `focus()` in the base) | Retry → focus the item's progress indicator (or the thumb select button); Remove → neighbour thumb's select button, else the dropzone Browse button |
| A4 | 🔸 | announcements missed: (a) id replaced, (b) error → error with a new message, (c) identical text twice is a no-op for the live region | (a) DOCUMENT (an id swap is a new item; the host's `uploaded` is then first sight — guide note) · (b)+(c) CONFIRMED | compare status AND error; alternate a zero-width suffix so a repeat string re-announces |
| A5 | 🔸 | `addFiles` resolving after unmount leaks URLs + calls `onChange` | CONFIRMED (no mounted guard) | mounted ref; revoke the fresh URLs and skip |
| A6 | 🔸 | sync revoke on remove / reset / applyEdit + orphan effect revokes a URL a late-echo controlled host has not rendered yet | CONFIRMED for the orphan path (a URL in `ownedUrls` but never yet in `items` is revoked on an unrelated commit); sync revokes = pre-existing, keep for uncontrolled but route through "seen" | orphan only URLs that were seen in `items` at least once; remove / applyEdit revoke via the orphan effect |
| A7 | 🔹 | NaN `progress` → "NaN%" | CONFIRMED | `Number.isFinite` clamp |
| A8 | 🔹 | explicit `undefined` label keys override defaults → crash | CONFIRMED (`lib/labels.ts`) | drop undefined before merge |
| A9 | 🔹 | invalid `locale` throws in render (`format-duration`); 2 formatters per thumb render | CONFIRMED | try/catch → "en"; memoize per locale |
| A10 | 🔹 | `revokeOnUnmount` true → false at runtime revokes everything | CONFIRMED (`use-carousel-state.ts:145-152`) | flag in a ref, `[]` deps |
| A11 | 🔹 | input `accept` not intersected with `accept` kinds | CONFIRMED | filter `acceptMime` by kind |
| A12 | 🔹 | poster canvas at full resolution (4K = ~33 MB, iOS limits) | CONFIRMED | downscale to max edge 1280 |
| A13 | 🔹 | unreadable video / image accepted, `maxVideoSeconds` bypassed, 8 s timeout | DOCUMENT (U2 decision 6) — guide + JSDoc |
| A14 | 🔹 | (a) empty dropzone `div` with `aria-label` and no role · (b) default `itemAria` ignores alt / status (thumb name hides `<img alt>`) · (c) `maxReached` announced twice (alert + live region) | CONFIRMED all three | (a) `role="group"` · (b) include alt + status in the default · (c) announce once |
| A15 | 🔹 | ScrollArea without `dir`; dnd keyboard physical arrows in RTL | U5 browser check |

## Finder 2 (seam, dependents, install graph, gate) — 12 rows

| # | Sev | Finding | Verdict | Fix |
|---|---|---|---|---|
| B1 | ⚠️ | `features/editing/index.ts` re-exports media-editor types with `export type { … } from "@/registry/…"` — the shadcn rewriter rewrites only static `import` declarations (`docs/component-guide.md` §11.5 rewriter rules) → consumer TS2307 | CONFIRMED (repo rule; the only such re-export in `src/registry`) | `import type { … }` + `export type { … }`; add the editing item to the install matrix |
| B2 | 🔸 | content-composer never revokes poster URLs: root revokes `it.url` only (`content-composer.tsx:128`), tombstones `.url` only (`media-carousel-substrate.tsx:162-168`); carousel runs `revokeOnUnmount={false}` | CONFIRMED | revoke + tombstone `posterUrl` too (content-composer 0.3.3 patch) |
| B3 | 🔸 | untyped `editorProps` spread last in the panel can override `aspect` / `cropAspects` / `initialSource` / `enabledModes` | CONFIRMED (`edit-panel.tsx:114-122`) | pick the six documented keys |
| B4 | 🔸 | raw `onApply`: foreign id edits another item + closes the real edit; unknown id leaks the panel's minted URL; edit keeps an `"uploaded"` status on a now-local item | CONFIRMED | accept only the editing id (dev warn), revoke `patch.url` on a miss; an applied edit clears `status` / `progress` / `error` (the host re-uploads on `onEditApply` — documented) |
| B5 | 🔸 | public parts' props changed (`formatDuration`, label functions, `editingEnabled`) — not in the CHANGELOG | CONFIRMED | CHANGELOG + guide migration clause |
| B6 | 🔸 | `editingId` survives `editing` removed / item dropped by a value swap / `openEditor(unknown)` → panel re-opens by itself later; `onEditOpen` for a ghost id | CONFIRMED | effect cancels when the editing item is gone / `editing` absent / `canEdit` false; `openEditor` rejects unknown ids |
| B7 | 🔹 | a Panel's mount-time `onCancel()` ignored (editingIdRef set in a parent effect) | CONFIRMED | write the ref synchronously in `openEditor` / `cancelEdit` / `applyEdit` |
| B8 | 🔹 | alias `media-carousel-editor-01` silently loses editing | CONFIRMED → alias description + migration note (coordinator) |
| B9 | 🔹 | `meta.internal: ["media-editor"]` may read as a base dependency on the docs page | CHECK the detail page; label or keep (coordinator) |
| B10 | 🔹 | gate: `featureOf` trusted; slice weight from `registryDependencies` only; relative imports invisible to the static-import scan | PARKED → follow-up (pre-existing scan limit; `validate-registry-json` requires regDeps for cross-component imports, which backs the regDeps reading) |
| B11 | 🔹 | content-composer's carousel step has no `acceptMime` / labels / locale / alt / status dials → WebM accepted there | DOCUMENT — the content-composer re-design (queued, GATE 1) owns it; report-back says so |
| B12 | 🔹 | video / `canEditItem` openEditor warnings fire per call | DROPPED — docs promise "one warning" only for the no-`editing` case |


**Fix wave** (one Sonnet implementer, brief `scratchpad/brief-r6-fix.md`): A1–A12, A14, B1–B4, B6, B7 fixed; tests
`base-fixes`, `edit-lifecycle`, `edit-panel-props`, `install-graph` (+ the `export … from` scan),
content-composer `carousel-poster-urls`; **every fix falsified CAUGHT** (31 reverts, files verified byte-identical on
restore). One addition beyond the rows, kept: "N items added" counts the items actually kept under the cap (it used to
announce the offered count and masked the `maxReached` double announcement). Architect: handle `addFiles` typed
`=> Promise<void>` (it always returned one), `itemAria` JSDoc, CHANGELOG (behaviour + parts-props migration
clause), guide. Coordinator rows: A13 / A4a / B11 documented (guide §8, §14); B8 alias description now names the add-on;
B9 → follow-up (detail page lists `internal: media-editor` for the feature folder); B10 → follow-up (gate hardening);
B12 dropped. carousel-composer + content-composer: 12 files / 88 tests.

## U5 — runtime (browser finder on `next start -p 3200`, Chromium, real H.264 MP4 + generated images / WebM)

Post-fix battery first (battery-r6b): tsc 0 · lint 0 · `registry:build` 0 · doc-budget 0 · tests 187 files / 2561 ·
build 0; base 98.6 KB → budget set to 110 on the post-fix size. Console: 0 errors / warnings / hydration messages on
both pages, light + dark, 1280 + 390 px; no page overflow at 390 px.

| # | Sev | Finding | Verdict |
|---|---|---|---|
| W1 | ⚠️ | focus to `<body>` after Dismiss on the error alert (all locales, content-composer too) | CONFIRMED → fix wave 2 |
| W2 | ⚠️ | focus to `<body>` after Edit (the button unmounts, the panel is not focused) and after Done / Cancel | CONFIRMED (pre-existing since 0.1) → fix wave 2 |
| W3 | ⚠️ | Edit → Done with no change bakes black letterbox bars (800×600 → 820×820); re-edit opens the letterboxed image | PRE-EXISTING in media-editor's export (the panel code is unchanged since 0.2; the editor exports its aspect frame with the photo contained) — the same family as the platform's incoming media-editor 0.5.1 note (crop frames fit the stage, not the photo) → media-editor follow-up; report-back "Known" |
| W4 | ⚠️ | RTL rail not mirrored: Radix ScrollArea sets `dir="ltr"` (its default) inside a `dir="rtl"` page | CONFIRMED → fix wave 2 (`dir` prop + direction read after mount, passed to ScrollArea) |
| W5 | 🔸 | keyboard drop announces the old position ("dropped at position 1 of 3" after moving to 2) | CONFIRMED → fix wave 2 |
| W6 | 🔸 | content-composer: Back validates the caption step and shows a raw zod message | PRE-EXISTING (content-composer's stepper, untouched) → content-composer re-design (F-04) |
| W7 | 🔸 | content-composer: focus to `<body>` after Back | PRE-EXISTING → same |
| W8 | 🔹 | Arabic demo labels: plural for 1 item | CONFIRMED (fixtures) → fix wave 2 |
| W9 | 🔹 | Arabic demo note claims Arabic-Indic digits; badge shows Latin (`Intl` "ar") | CONFIRMED (demo) → fix wave 2 |
| W10 | 🔹 | progress indicators and Remove buttons carry no item identity in their names; alt counter not described-by | CONFIRMED → fix wave 2 (new `removeItem` label, `uploadProgress(progress, { position, total })`) |
| W11 | 🔹 | 24×24 px remove / drag targets | DROPPED — meets WCAG 2.5.8 (AA, 24 px) |
| W12 | 🔹 | an errored thumb's centred Retry intercepts a click meant to select it | DROPPED — intended (Retry is the action an errored item needs); selection works on the edge and by keyboard |

Passing (finder's coverage): intake through the input and drag-and-drop; WebM and 51 MB refusals (localised); Remove
focus (neighbour / previous / Browse); keyboard reorder + localised instructions and lift / over announcements; alt
text (label, limit, `<img alt>`); real MP4 poster + duration badge; seeded video caption without Edit; the cap tab;
upload status (40 %, error + Retry, focus to the progress indicator, announcement); edit panel tools, Done / Cancel,
re-edit reopens the image; Türkçe / Arabic fully localised; dark-mode overlays legible; content-composer post step:
add, edit, Next / Back keeps items, edits and posters, Remove focus.

**Fix wave 2** (one Sonnet implementer, brief `scratchpad/brief-r6-fix2.md`; architect first added `dir`, the
`removeItem` label and `uploadProgress(progress, { position, total })` to `types.ts`): W1 (Dismiss → Browse /
add-more / selected thumb), W2 (`parts/edit-frame.tsx`: the panel container takes focus unless the Panel moved focus
inside; focus returns to Edit / the selected thumb on close, never stealing focus the user moved), W4
(`hooks/use-direction.ts`, `dir` on the ScrollArea + rail), W5 (final drop position captured in `onDragEnd`), W8, W9
(Arabic tab `locale="ar-EG"`), W10 — test `browser-fixes` (19); **11 reverts CAUGHT**. Architect: `labels.remove`
was left unread by the new `removeItem` (a dead public label) → `@deprecated`, and a 0.2 `remove` translation still
names the remove buttons until `removeItem` is passed (test `remove-label-compat`, falsified CAUGHT). 14 files / 109
tests across carousel-composer + content-composer.

## U6 — pre-push doc verifier (fresh Sonnet, read-only)

11 rows + 4 stale code comments; **no code bug and no inert surface** this time (every prop, label key and handle
method wired; `remove` honoured through the compat shim). All fixed before the push: stale test counts and sizes in the
report-back and review (88 → the final count, 98.6 / 110 → 105.3 / 115, roster 21 → 23 files), the report-back's
"Turkish example in the guide" (it is in the usage tab), the usage sample's untyped `useState([])` (failed strict tsc:
`never[]` → `useState<MediaCarouselItem[]>([])`), guide §11 `uploadProgress` / `removeItem` signatures, §13 parts-props
row (`editingEnabled` is optional) and the `AspectRatio` alias (only in `types.ts`, as in 0.2), the `reset` JSDoc
("auto-runs on unmount" was false — unmount only revokes), content-composer guide version pins (v0.2.1 / "v0.3 post
backend" / "v0.1.x follow-up"), and the component's header JSDoc + three "v0.1" comments.

## U5 — browser re-verify (fresh Sonnet, rebuilt production build)

W1, W2 (carousel and content-composer), W4 (scroll area `dir="rtl"`, item 1 at the right, ArrowLeft moves forward,
announcements match), W5 (final position in EN / TR / AR), W8, W9 (Arabic-Indic digits via `ar-EG`), W10 — **all
PASS**; TR / AR progress names not observable (no uploading item in those tabs; covered by the fixtures). Regression
sweep PASS (Remove / Retry focus, alt limit, MP4 poster + badge, refusals, edit flow, content-composer Next / Back,
390 px). 0 console messages on both pages. Scripts: `scratchpad/browser-r6-verify/`.

## U5 — installs (`scratchpad/installs-r6.sh`, final artifacts)

| Run | Items | CLI | Result | Components in the consumer |
|---|---|---|---|---|
| a | carousel-composer alone | 4.18.0 | PASS, tsc 0 (first attempt: the consumer's own `pnpm install` timed out at 600 s before any add — re-run passed) | `carousel-composer` only — **no media-editor** |
| b | carousel-composer + carousel-composer-editing | 4.18.0 | PASS, tsc 0 | `carousel-composer`, `media-editor` (0.5.1) |
| c | carousel-composer-fixtures | 4.18.0 | PASS, tsc 0 | `carousel-composer` |
| d | content-composer | 4.18.0 | PASS, tsc 0 | pulls carousel-composer 0.3.0 + carousel-composer-editing 0.3.0 + media-editor, json-form, rich-text-editor, news-card … |
| e | carousel-composer alone | 3.8.5 | PASS, tsc 0 | `carousel-composer` only — **no media-editor** |
| f | carousel-composer-editing | 3.8.5 | PASS, tsc 0 | `carousel-composer`, `media-editor` |

## U7 — Ship

Commit `e8976ac`, pushed 15:33 under the user's Part 3 grant after the final consistency review. Live poll (180 s apart): 0.2.2 / — / 0.3.2 at +3 / +6 / +9 min, **all three new at +12 min** (carousel-composer 0.3.0, carousel-composer-editing 0.3.0, content-composer 0.3.3). Live artifacts: base 23 files, no tests, deps `button` / `input` / `scroll-area`, no import of media-editor (only comments mention it), `cssVars.theme` media-overlay + destructive-foreground; add-on 3 files under `features/editing/`, `import type` re-exports; content-composer depends on the add-on and passes `editing={carouselEditing}`; the alias description names the add-on. Decision `shipped`; retro in `.claude/improvement-log.md`; report-back `.claude/report-back-2026-10-26-carousel-composer-0-3-0.md` (to the user for the platform). **Next:** app-sidebar 0.6.0 (whenever convenient) and the media-editor patch when the platform's note arrives (it takes follow-up F-05).
