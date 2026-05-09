---
date: 2026-05-10
session: pdf-viewer-v0.1.0-pipeline
phase: post-2026-05-09-pause
type: ship
commits: pending-this-session
components: [pdf-viewer]
findings: [pdf-viewer/F-01-worker-cdn, pdf-viewer/F-02-actions-identity, pdf-viewer/F-03-print-busy-ux, pdf-viewer/F-04-smoke-pending]
status: shipped-pending-smoke
---

# pdf-viewer — v0.1.0 first ship under the readiness-review rule

## What landed

`pdf-viewer` v0.1.0 — a continuous-scroll PDF reader built on `react-pdf@^10.4.1` (which wraps `pdfjs-dist@5.4.296`). 28-file sealed folder under `src/registry/components/media/pdf-viewer/`. Drop-in viewer with built-in toolbar, zoom (Ctrl/Cmd+wheel and pinch), drag-and-drop file loading, selectable text via pdf.js text-layer, right-click context menu, password-protected PDF support, auto-virtualization at ≥50 pages, high-DPI print rendering, and an imperative `ref` handle for external control.

Public API:

- `<PdfViewer>` top-level + `<PdfToolbar>` / `<PdfPageNav>` / `<PdfPageIndicator>` / `<PdfZoomControls>` / `<PdfActionMenu>` standalone toolbar parts
- `usePdfViewer()` hook for advanced consumers building bespoke chrome
- `PdfViewerHandle` ref type with `actions`, `state`, and the underlying `pdfDocument`
- Slot APIs: `renderToolbar`, `renderContextMenu`, `renderPasswordPrompt`
- Sources accepted: `string` URL / `File` / `Blob` / `ArrayBuffer` / `Uint8Array`

Object-shape callbacks throughout (F-cross-12-correct from day one). 13 customizable label keys for i18n. WCAG 2.1 AA target — `role="document"`, `role="toolbar"`, `aria-live` page indicator, focus-visible rings, full keyboard map.

## Sequencing — gates as designed

- **GATE 1 (description.md)** — authored at `docs/procomps/pdf-viewer-procomp/pdf-viewer-procomp-description.md`. Drafted with 16 open questions (slug naming, scope cuts, source shapes, worker hosting, mobile UX, print quality, virtualization threshold, etc.); user signed off "confirmed" with all 16 starting-position recommendations accepted.
- **GATE 2 (plan.md)** — authored at the sibling `pdf-viewer-procomp-plan.md`. Drafted with full type contracts, 28-file sealed-folder layout, hook + part decomposition, edge-case table, accessibility map, risks + alternatives. Pre-signoff dialog dropped one prop (`loadStrategy` — informational-only, no runtime effect) per user instruction; 6 other architectural calls confirmed (internal Context, imperative ref, sub-export parts, image-selection out-of-scope, hand-rolled pinch, region-rectangle vs per-image deferred). User signed off "go."
- **Implementation** — 23-step ordered build per the plan: types → lib → base hooks → document hook → page+state parts → viewer hooks → toolbar parts → context-menu + password prompt → top-level orchestrator → meta + dummy + index → demo + usage → manifest → checks. tsc / lint / validate-meta-deps all clean (38/38).
- **GATE 3 (spot-check review)** — authored at `docs/procomps/pdf-viewer-procomp/reviews/2026-05-10-v0.1.0-spotcheck.md`. Verdict: **Pass with follow-ups**. 4 findings (F-01 worker default, F-02 actions identity, F-03 print-busy UX, F-04 smoke pending). None blocking. Smoke harness pass deferred until Vercel redeploys post-push.

## Substrate decisions (locked in plan, one drift in implementation)

| Locked | Implemented | Notes |
|---|---|---|
| Library: `react-pdf@^10.4.1` | ✓ | Pulls `pdfjs-dist@5.4.296` transitively; declared as direct dep too for TS resolution. |
| Worker: bundled `?url` import | ✗ → **CDN** (unpkg) | Turbopack failed to resolve `new URL("bare-specifier", import.meta.url)`. Shipped CDN fallback as default; documented `workerSrc` override + `postinstall` recipe in guide.md. **F-01: bump-target v0.2.0** for offline-by-default. |
| Continuous scroll only | ✓ | No paged-mode toggle. |
| Initial scale: `'fit-width'` | ✓ | |
| Toolbar parts standalone-exported | ✓ | 5 parts shipped (added `PdfPageIndicator` per pre-impl Q3). |
| Print: pdf.js high-DPI canvas → iframe | ✓ | 2× scale; PNG dataURLs in hidden iframe; `afterprint` cleanup. |
| Right-click only over document surface | ✓ | shadcn `<ContextMenu>` wraps the page-render area. |
| Annotation layer rendered | ✓ | `renderAnnotationLayer={true}` — embedded links work natively. |
| `allowDownload` / `allowPrint` props | ✓ | UX-only gate (documented). |
| Image selection out of scope | ✓ | No image-related menu items; documented in usage + guide. |
| Mobile toolbar auto-collapse <480px | ✓ | `compact` flag in context; `<PdfActionMenu compact>` collapses to overflow. |

## Files

```
src/registry/components/media/pdf-viewer/   (28 files in the sealed folder)
├── pdf-viewer.tsx                  ← top-level (~390 LOC, "use client")
├── parts/   (12 files)
│   ├── pdf-toolbar.tsx, pdf-page-nav.tsx, pdf-page-indicator.tsx,
│   │   pdf-zoom-controls.tsx, pdf-action-menu.tsx           — toolbar parts
│   ├── pdf-page.tsx                                         — page + placeholder
│   ├── pdf-context-menu.tsx                                 — right-click ContextMenu
│   ├── pdf-password-prompt.tsx                              — default Dialog
│   ├── pdf-drop-overlay.tsx                                 — drag-drop visual
│   └── pdf-empty-state.tsx, pdf-error-state.tsx, pdf-loading-state.tsx
├── hooks/   (8 files)
│   ├── use-pdf-viewer-context.ts (Context + public hook)
│   ├── use-pdf-document.ts (load lifecycle + password retry)
│   ├── use-pdf-zoom.ts (scale + ctrl+wheel + pinch)
│   ├── use-pdf-page-tracker.ts (IntersectionObserver-driven current page)
│   ├── use-pdf-virtualization.ts (visible-window resolver)
│   ├── use-pdf-keyboard.ts (Cmd/Ctrl shortcuts + PgUp/PgDn)
│   ├── use-pdf-drop.ts (drag-drop counter + handlers)
│   ├── use-pdf-selection.ts (debounced selectionchange)
│   └── use-pdf-print.ts (high-DPI canvas → iframe → print())
├── lib/   (5 files)
│   ├── clamp-scale.ts, compute-fit-scale.ts, normalize-source.ts,
│   │   download.ts, worker-config.ts
├── types.ts (~200 LOC — full API contract + DEFAULT_PDF_VIEWER_LABELS)
├── dummy-data.ts (sample URL + Blob/ArrayBuffer fetch helpers)
├── demo.tsx (9 tabs — URL, File, Blob, drag-drop, custom toolbar, toolbar-off, permissions, ref, selection)
├── usage.tsx (9 sections — quick start through performance notes)
├── meta.ts
└── index.ts (no `meta` re-export per post-Phase-7 rule)
```

`registry.json` updated: `pdf-viewer` (28-file base item) + `pdf-viewer-fixtures` (1-file sibling for dummy-data). `pnpm registry:build` produced `public/r/pdf-viewer.json` (94 KB) and `public/r/pdf-viewer-fixtures.json` (2 KB).

`manifest.ts` updated to register the entry as the 38th component.

## Notable problems hit during implementation

1. **Turbopack `new URL(bare-specifier, import.meta.url)` rejection.** Spent ~10 min trying to make the bundled-worker import work in Turbopack. Pivoted to unpkg CDN as default with `workerSrc` prop override; offline path documented. F-01 captures the v0.2 follow-up.
2. **`DOMMatrix is not defined` during SSR.** pdf.js evaluates DOMMatrix at module-load. Even with `"use client"` on pdf-viewer.tsx, Next.js still SSRs the component. Fix: wrapped `<PdfViewer>` in `next/dynamic({ ssr: false })` inside `demo.tsx` (allowed since demo files are docs-site-only). Documented the same pattern as a *required* setup step for consumers in `usage.tsx` and `guide.md`.
3. **React 19 lint enforcement (set-state-in-effect / refs-during-render).** Several patterns flagged: setState reset on prop change → moved to "comparison-during-render" pattern; ref mutation during render → moved to useEffect; `printingRef.current` returned from hook → switched to `useState`. None functional issues, just stricter modern-React conventions.
4. **`pdfjs-dist` not resolvable as transitive dep.** TS couldn't find pdfjs-dist types under pnpm's hoisting. Added as direct dep (`pnpm add pdfjs-dist@5.4.296`) and declared in `meta.ts` to match producer's exact version (`5.4.296` no caret) per validate-meta-deps' alignment rule.

## Verification

| Check | Result |
|---|---|
| `pnpm tsc --noEmit` | ✓ clean |
| `pnpm lint` | ✓ clean |
| `pnpm validate:meta-deps` | ✓ 38/38 clean |
| `pnpm registry:build` | ✓ both artifacts generated |
| `pnpm dev` `/components/pdf-viewer` | ✓ 200, no console errors |
| Smoke harness (consumer install + tsc) | ⏳ pending Vercel redeploy |

## Open follow-ups (per GATE 3)

1. **F-01 — worker default uses CDN** (v0.2.0) — replace with bundled-import + postinstall recipe.
2. **F-02 — `actions` identity instability** (v0.1.1) — stabilize for consumer ref-effect patterns.
3. **F-03 — print-busy UX** (v0.1.1) — disable button + spinner while `isPrinting`.
4. **F-04 — smoke run pending** (this session) — append row to spot-check review after Vercel redeploys.

F-01 mirrored in STATUS.md "Open decisions / TODOs" since it's a substrate-level decision.

## Workflow contribution

This is the **second** component to ship under the GATE-3 component-readiness-review rule (first was `stat-card` v0.1.0 → v0.1.1 on 2026-05-09). The rule held: substrate drift (F-01) was caught + documented before push, callback shapes are F-cross-12-correct from day one, smoke pin established as a procedural step. Roadmap continuation: 5 more procomps queued from the user's session-open list (`folder-manager`, `file-tree`, `rich-graph-2`, `chat-panel`, `notification-system`) — each will go through the same three-gate flow.
