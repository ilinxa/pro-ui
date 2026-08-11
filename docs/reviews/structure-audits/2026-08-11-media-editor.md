# Structure audit — media-editor v0.3.0 (2026-08-11)

> Post-P3-split baseline. Base + `media-editor-capture` feature item (strategy-b prop-injection,
> R1 VERDICT). R4 findings INFRA-4/MED-1/MED-3 + the konva `React.lazy` boundary + base file-intake
> verified landed below, not re-litigated.

verdict: findings-logged
artifact: base 282.0 KB / budget 290 KB (2.8% headroom) · feature item `media-editor-capture`
53.8 KB / budget 65 KB (17.2% headroom)

## 1. Compound compliance (.claude/rules/compound-component-structure.md)

Compliant. The capture injection seam is correctly modeled: `MediaCaptureExtensionContext`
(`hooks/use-capture-extension.ts`) is a real headless context; `features/capture/provider.tsx`'s
`MediaCaptureProvider` supplies `{ CameraSurface: EditorCamera }` through it (renderer-registry
style, per its own doc comment). No base file statically imports `features/capture/` — the only two
hits for `from ".../features"` in the folder are `demo.tsx:9` and `usage.tsx:97` (docs-site-only,
never shipped in the base registry item).

R4 fixes verified landed (fresh re-check, not assumed):
- **INFRA-4** — base registry item's `registryDependencies` now include `button` (confirmed via
  `registry.json`; grep confirms 5 base files — `editor-canvas.tsx`/`editor-toolbar.tsx`/
  `text-only-canvas.tsx`/`tool-draw-controls.tsx`/`tool-text-input.tsx` — import
  `components/ui/button`).
- **MED-1** — `features/capture/hooks/use-multi-instance-guard.ts:5-12` docstring now states both
  the narrowed trigger (live camera-surface mount, not mere configuration) and the R4 rationale
  honestly.
- **MED-3** — `meta.ts:43-49`'s budget comment matches the verified actual (282.0 KB, exact match to
  this audit's own measurement); budget is 290 with the stated ~3% headroom reasoning.
- **konva `React.lazy` boundary** — `media-editor.tsx:66`
  (`const LazyEditorCanvas = React.lazy(() => import("./parts/lazy-editor-canvas"))`), backed by the
  same-folder default-export shim `parts/lazy-editor-canvas.tsx`.
- **Base-alone file intake is real, not a placeholder** — `media-editor.tsx:1768-1776` renders a real
  `<input type="file">` wired through `validateGalleryFile` (`lib/validate-media-file.ts`).
- **Per-instance dev-warn dedup** — `media-editor.tsx:202`
  (`const warnedRef = React.useRef<Set<string>>(new Set())`), not module-scoped — same correct
  pattern as `event-calendar`'s `calendar-root.tsx:83` in this audit batch.

No findings.

## 2. Dead / orphaned public API

None found. All 8 "internal-by-convention" exported parts (`ModeTogglePill`, `VideoTrimBar`,
`TextOnlyCanvas`, and the 5 `Tool*` controls) are confirmed mounted internally by `media-editor.tsx`
(grep-verified JSX usage in each case), not just re-exported and forgotten.

## 3. Undocumented prop semantics

**Finding — `usage.tsx`'s imperative-handle summary undercounts by one, silently omitting
`getSourceBlob()`.** `usage.tsx:194-207` states *"22 methods total"* and names them by group:
inspect (`getIsDirty`, `getMode`, `getState`, `loadState`), capture (5), edit (7), export (3),
lifecycle (3) — summing to exactly 22. But `MediaEditorHandle` (`types.ts`) actually declares **23**
members: `getSourceBlob: () => Blob | null` (`types.ts:517`) carries a real, safety-relevant JSDoc
contract (`types.ts:511-516`: *"persist it alongside `getState()` so a later `loadState(state, {
sourceBlob })` can re-materialize the (revoked) object URL"*) and is used by `content-composer`'s own
`media-substrate.tsx` (`stashSourceBlob`/`restoreEditorState`) for exactly this persistence pattern —
but a consumer reading only `usage.tsx`'s handle reference would never learn the method exists.

## 4. A11y baseline

No findings. Toolbar/canvas/mode-toggle carry `aria-label` coverage (grep-confirmed 3+ hits each in
`editor-toolbar.tsx`/`editor-canvas.tsx`/`mode-toggle-pill.tsx`). Capture feature: permission prompt
`role="alert"` (`camera-permission-prompt.tsx:88`), camera status `role="status"`
(`editor-camera.tsx:307`), gallery-picker/switch-camera/shutter buttons all `aria-label`-driven
(`editor-camera.tsx:331,376`, `shutter-button.tsx:112`).

## 5. Weight & slice candidacy (already-sliced — is the remaining base coherently sized; second axis?)

Remaining base (excl. `features/capture/`, `demo.tsx`/`dummy-data.ts`/`usage.tsx`/`meta.ts`):
**7,432 LOC**. Top-3: `media-editor.tsx` 1,936 (26.1% — the single monolithic assembly+state file;
predates the 2026-06-10 compound-structure rule, created 2026-06-02, and P3 only added the
capture-seam wiring to it, not a structural rework — grandfathered, not re-litigated here),
`parts/editor-canvas.tsx` 979 (13.2% — already `React.lazy`, per §1), `types.ts` 598 (8.0%).

No further axis clears the ≥20% bar. The konva edit canvas is the dominant npm weight (~182 KB min,
per the plan's own R1 evidence) but is a universal dependency of every downstream consumer
(story-composer, content-composer, carousel-composer's per-item edit) — R1 explicitly evaluated and
rejected konva-slicing on exactly this ground; not re-proposed here. Video-specific code
(`lib/composite-video.ts` 211 + `parts/video-trim-bar.tsx` 239 ≈ 6.0%) is real but sub-threshold and
interleaved with mode-dispatch logic in `media-editor.tsx`, not cleanly separable. **Not a slice
candidate.**

## Owners

| Finding | Severity (🚫/⚠️/🔸/🔹) | Owner target |
|---|---|---|
| `usage.tsx:194-207` "22 methods total" imperative-handle summary omits `getSourceBlob()` (`types.ts:517`) from both the count and the per-category name list | 🔸 Medium | Next PATCH touch — add to the "inspect" group, correct count to 23 |
