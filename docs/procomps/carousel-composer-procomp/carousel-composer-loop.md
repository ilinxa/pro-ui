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
| **Current stage** | U1 signed (scope: platform 2026-10-25) — U2 starts on the user's go for its release |
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
