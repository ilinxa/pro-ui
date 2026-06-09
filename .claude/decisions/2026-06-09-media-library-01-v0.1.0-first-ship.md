---
date: 2026-06-09
session: media-library-01 first ship
phase: procomp GATE 1 → 2 → 3
type: component-ship
commits: []
components: [media-library-01]
findings: [F-01-smoke-pending, F-02-grid-virtualization, F-03-copy-duplicate, F-04-sidebar-lazy-expand, F-05-markdown-light-path, F-06-browser-walkthrough]
status: shipped-pre-push
---

# media-library-01 v0.1.0 — first ship (54th procomp)

A Google-Drive-style media library. **Composition-first**: owns the Drive shell (storage-quota bar, type-filter chips, folder-card row, thumbnail grid, upload pipeline, breadcrumbs, selection, dnd-move, context menus, preview dispatcher) and **delegates every actual file render** to shipped viewers — `pdf-viewer`, `code-block`, `markdown-editor`, `video-player-01` — plus a folder `file-tree`. No shipped component was modified.

Single-session GATE 1 → GATE 2 → implement → GATE 3, on user request ("create this reusable pro component … exactly like the Google Drive environment: lazy load, drag-drop upload, drag-drop move, right-click options, preview for images/pdf/text/code/md/json … we have all of them previously created as a procomponent — find them and use them").

## Load-bearing decisions

1. **Hybrid reuse, not a `file-manager` wrapper.** `file-manager`'s barrel exposes only `useFileManager` (context) + clipboard + helpers — its selection/marquee/drag/keyboard hooks are private and would require fragile deep-subpath imports. So the shell (selection, marquee, dnd, context-menu) is built fresh in this folder; only the shared `FsNode` model + the previewers + `file-tree` are reused.

2. **`FsNode` declared LOCALLY (the re-validation catch).** Plan v1 imported `FsNode` from `file-tree/file-tree`. Verification found `file-tree.tsx` only *imports* `FsNode` (no tail re-export band) — so a `.tsx`-entry import fails; a `/types` import trips the F-S1 rewriter; adding a band to file-tree modifies a shipped component. Resolution: re-declare the tiny interface locally and rely on **structural typing** at the composed `<FileTree nodes={mediaNodes}>` boundary. Zero cross-procomp *type* imports; only *value* imports (F-01-safe).

3. **shadcn-compound model (user directive).** "We must be able to customize it … drop some [sub-components] and use a lighter version … like some shadcn component." → headless `<MediaLibraryRoot>` (provider + DndContext + handle) + flat à-la-carte parts (each reads `useMediaLibrary()`) + a thin `<MediaLibrary01>` assembly (Root + toggle-gated children, no extra logic) + standalone Tier-C primitives (`FilePreview`, `QuotaBar`, `FileCard`). **Flat exports** (not a `MediaLibrary.Root` namespace object) preserve tree-shaking. Saved as the durable feedback memory `feedback-compound-composable-procomps`.

4. **Lazy viewers = real bundle savings.** The four viewers are `React.lazy(() => import("...tsx"))`. Omitting `<MediaLibraryLightbox/>` + `<MediaLibraryDetailsPane/>` drops pdf.js / CodeMirror / shiki / marked from the consumer graph entirely.

5. **Clipboard = internal state in v0.1** (not `@ilinxa/file-clipboard`). The shared module's dev path (`navigation/_shared/`) ≠ install path (`components/_shared/`), so no portable relative import exists from `media/`. Cut → paste-into-folder (= move) ships; cross-component clipboard *sync* deferred to v0.2.

6. **Upload contract = per-file.** `onUpload(files, targetFolderId, progress)` is invoked once per file; `progress(pct)` is pre-bound to that file's optimistic item (changed from the plan's `(tempId, pct)` — only mappable per-file). Lib does no network (portability).

## Scope shipped (full screenshot fidelity)
Quota bar · type chips with live counts · FOLDERS card row · FILES thumbnail grid · breadcrumbs · sidebar (file-tree) · selection (click/⌘/shift/marquee) · drag-drop upload (optimistic + progress + retry) · drag-to-move (self/cycle-validated) · right-click menus · inline rename + new-folder · multi-type preview in side pane + full-screen lightbox with prev/next · controlled/uncontrolled selection + current folder · imperative handle · full label i18n.

## Files
31 shipped (root + 16 parts + 6 hooks + 4 lib + types + index) + 1 fixtures (dummy-data). 5 internal registryDeps (file-tree, pdf-viewer, code-block, markdown-editor, video-player-01) + 6 shadcn (button, context-menu, dialog, input, progress, skeleton). Zero new npm packages — `@dnd-kit/core` + `date-fns` + `lucide-react` already present.

## Gates
tsc 0 · lint clean (fixed: sync-setState-in-effect → microtask yield; `react-hooks/refs` false-positive on dnd returns → destructure per kanban precedent; `aria-selected`→`aria-pressed`; `aspect-4/3`) · meta-deps 54-54 · build 54 slugs · registry:build (31 files, no demo/usage/meta; 11 registryDeps). GATE 3 **Pass with follow-ups** ([review](../../docs/procomps/media-library-01-procomp/reviews/2026-06-09-v0.1.0-spotcheck.md)).

## Open follow-ups
- **F-01 (Med, v0.1.1):** post-deploy consumer-tsc local-registry smoke not yet run — expect F-cross-13 sub-traps across 5 internal + 6 shadcn deps (context-menu asChild, dialog close-button). 4-ship pattern.
- **F-02 (Low, v0.2):** file-grid virtualization (prop reserved; plain grid ships).
- **F-03 (Low, v0.2):** copy/duplicate (cut→paste-move only today).
- **F-04 (Low, v0.2):** sidebar lazy-expand (file-tree composed without onLoadChildren).
- **F-05 (Low, v0.1.x):** markdown preview uses full MarkdownEditor lazy chunk vs lighter `parseMarkdown`.
- **F-06 (user):** ✅ DONE 2026-06-10 — live browser walkthrough; surfaced + fixed 7 runtime issues (below).

## Browser walkthrough fixes (2026-06-10) — F-06 closed
The live walkthrough found 7 runtime issues none of tsc/lint/build caught (re-proving "the visual walkthrough is the de-facto gate"):
1. **SSR hydration mismatch** — `@dnd-kit`'s `aria-describedby` counter incremented in different order SSR vs client → stable `useId()` `id` on `DndContext`. (Same class as the rich-card auto-id SSR lesson.)
2. **`PreviewErrorBoundary`** around dispatched viewers — a throwing viewer degrades to a graceful card instead of crashing the page.
3. **`pdfWorkerSrc` prop + react-pdf `onError`** — async PDF/worker fetch failures (a boundary can't catch them) now surface the fallback; demo uses a jsdelivr worker.
4. **Sidebar root** — synthetic "Library" root node (expanded), clickable → navigate to root.
5. **Sidebar drag-move** — `file-tree`'s native-drag `onMove` was never wired → `onMove → ctx.moveTo`.
6. **False "(empty)" folders** — `foldersOnly()` stripped files; sidebar now shows the full tree (folder→navigate, file→preview).
7. **Cards crushed by the preview pane** — viewport breakpoints ignored sidebar+pane width → width-aware `auto-fill minmax()` grids; grid drag hardened (ids read off the event; `pointerWithin`; visible grips).
Additions only (`pdfWorkerSrc`); no public-API removals. Re-verified: tsc 0 / lint 0 / meta-deps 54-54 / build / registry:build.

## Push status
Pushed to `master` 2026-06-10 (see commit). Vercel auto-deploys; F-01 consumer-tsc smoke to run post-deploy.
