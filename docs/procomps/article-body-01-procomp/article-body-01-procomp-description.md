# article-body-01 — procomp description

> Stage 1: what & why.
>
> **Greenfield component** — no migration origin. The kasder source has a markdown-text-renderer (line-by-line regex parser); article-body-01 is a separate paradigm (WYSIWYG editor + JSON viewer) and a multi-year architectural commitment.
>
> **Architectural decision:** Plate (`platejs` v53) adopted as pro-ui's WYSIWYG substrate. See [project_richtext_substrate.md](../../../C:\Users\AsiaData\.claude\projects\e--2026-ilinxaDOC-ilinxa-ui-pro\memory\project_richtext_substrate.md) memory note. Future rich-content components compose on Plate.

## Problem

Every long-form-content surface — news articles, blog posts, knowledge-base entries, doc pages, marketing landing copy — eventually needs:

1. **An editor** with a complete toolbar (marks / headings / lists / link / image / table / code-block / font controls / etc.)
2. **A read-only viewer** that renders the same content cheaply on every page view (the read path is 100× more common than the write path)

Built ad-hoc per project, this is a multi-week effort each time, with predictable failures: hydration mismatches, image-upload coupling, no clean editor/viewer split, HTML-as-storage (which round-trips poorly), no shared a11y baseline. Pro-ui needs ONE answer that other components can compose on.

## In scope

- **Two-export sealed folder.** `<ArticleBodyEditor>` (`"use client"`, ~150KB gzip) and `<ArticleBodyViewer>` (RSC-friendly, ~30KB gzip). Same JSON shape; different bundle profiles.
- **Plate (platejs v53) substrate.** First-party React 19 + Next 16 + Tailwind v4 fit; MIT core; first-party RSC viewer via `platejs/static`.
- **Storage format: JSON.** Plate's `Value` array. Never HTML round-trip.
- **Toolbar v1.** Marks (bold / italic / underline / strikethrough / inline code / highlight / sub / sup); headings (H1–H3 via toolbar; H4 supported in plugins); blockquote; code block; horizontal rule; bullet + ordered lists; link insertion (URL prompt); image insertion (`onImageUpload(file)` Promise OR URL prompt fallback); table insertion (3×3 default); font family / size / color selectors.
- **Image upload contract.** `onImageUpload?: (file: File) => Promise<{ src; alt?; width?; height? }>` — bring-your-own backend. URL prompt fallback when not provided.
- **Cmd/Ctrl+S → onSave(value).** Platform-aware key descriptor in footer; payload from live editor children, not React `value` prop (avoids React-batching staleness).
- **Echo-guarded value sync.** External `value` prop changes flow into the editor via `editor.tf.setValue(...)` once, without re-emitting `onChange` (prevents infinite loops).
- **Read-only mode.** `readOnly` prop hides the toolbar; editor still selectable.
- **i18n-friendly.** All visible chrome is consumer-supplied; no hardcoded labels.
- **Tailwind v4 + signal-lime.** All chrome flows through the existing `--background`, `--foreground`, `--border`, `--primary`, `--muted` tokens. Headings use `--font-serif` (Playfair Display); body uses `--font-sans` (Onest); code uses `--font-mono` (JetBrains Mono).
- **a11y.** Toolbar carries `role="toolbar"` + `aria-label`; mark buttons carry `aria-pressed`; icon-only buttons have `title` + `aria-label`; figure / figcaption for images; link buttons open with `target="_blank" rel="noopener noreferrer"`.

## Out of scope (v0.1)

- **AI features** (smart suggestions, autocomplete from LLM). Plate has plugin patterns for these; future v0.2.
- **Collaborative editing** (Yjs / Liveblocks). Different architecture; future v0.3+.
- **Comments / suggestions** (track-changes-like). `@platejs/comment` exists; out of scope for v0.1.
- **Slash command menu** (`/` triggers a block-insert popup). `@platejs/slash-command` exists; v0.2.
- **Floating toolbar** (selection-anchored mark toolbar). `@platejs/floating-toolbar` exists; v0.2.
- **Math / equation blocks** (`@platejs/math`). v0.2.
- **Drag-and-drop block reordering** (`@platejs/dnd`). v0.2.
- **Mention / autocomplete tags** (`@platejs/mention`). v0.2.
- **Excalidraw embeds** (`@platejs/excalidraw`). v0.2 if real demand.
- **Custom syntax highlighting in code blocks.** `CodeSyntaxPlugin` is registered but no highlighter wired; v0.1 ships unstyled `<code>`. Wire `@platejs/code-block` with `lowlight` in v0.2.
- **Image resizing in editor.** `@platejs/resizable` + caption editing exist; v0.2.
- **HTML serialization escape hatch.** `serializeHtml` from `platejs/static` is available but not wrapped in this component's API. Consumers can call it directly when needed.
- **Skeleton loading state.** Consumer wraps own `Skeleton` while data loads.

## Target consumers

- News article detail pages (the kasder-equivalent surface)
- Blog post bodies (CMS, headless)
- Doc page bodies (knowledge bases, internal docs)
- Marketing landing copy (long-form sections)
- Comment bodies (with the editor scoped down via `readOnly` toggling)

## Rough API sketch

```tsx
// Editor (client component)
"use client";

const [value, setValue] = useState<ArticleBodyValue>(initial);

<ArticleBodyEditor
  value={value}
  onChange={setValue}
  onSave={async (v) => { await saveToDb(v); }}
  onImageUpload={async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    return res.json();   // { src, alt?, width?, height? }
  }}
/>
```

```tsx
// Viewer (server component, no "use client")
import { ArticleBodyViewer } from "@/registry/components/data/article-body-01";

export default async function NewsArticle({ params }: { params: { id: string } }) {
  const article = await fetchArticle(params.id);
  return (
    <article>
      <h1>{article.title}</h1>
      <ArticleBodyViewer value={article.body} />
    </article>
  );
}
```

## Success criteria

1. **SSR works in Next 16.** `/components/article-body-01` prerenders with `HTTP 200`. Both editor (in a client boundary) and viewer (server-rendered) appear in the demo and behave correctly.
2. **JSON roundtrip.** Editing the editor updates the JSON; passing that JSON into the viewer renders identical visual output.
3. **All toolbar items work.** Bold / italic / underline / strikethrough / inline code / highlight / sub / sup / H1 / H2 / H3 / blockquote / code block / hr / bullet / ordered / link / image / table / font-family / font-size / color.
4. **Image upload works** with `onImageUpload`. Without it, URL prompt fallback works.
5. **Cmd/Ctrl+S triggers `onSave(value)`** with the correct (live, not stale) value.
6. **Echo guard works.** Setting `value` externally doesn't trigger `onChange` cascade.
7. **`readOnly` mode** hides the toolbar and disables editing.
8. **Tailwind v4 + signal-lime tokens** flow through cleanly. Headings render in Playfair (the existing `--font-serif`); selection ring uses `--primary`.
9. **TypeScript strict.** All exports typed; `ArticleBodyValue`, `ImageUploader`, `ImageUploadResult` exported.
10. **Lint clean.** No new warnings (1 pre-existing rich-card warning OK).
11. **Bundle envelope.** Editor ≤ 165KB gzip; Viewer ≤ 35KB gzip.
12. **Demo coverage.** 5 sub-tabs (Editor / Viewer / Edit↔View roundtrip / Empty / JSON output side-by-side).

## Open questions

All resolved during the Phase 0 spike:

1. ✅ **Plate v53.0.3 latest, MIT core** — verified against npm + GitHub LICENSE file.
2. ✅ **`platejs/static` SSR works in Next 16** — verified via `pnpm build` prerender of `/components/article-body-01`.
3. ✅ **Tailwind v4 token flow works** — Plate UI consumes `--background` / `--foreground` / `--primary` / `--border` directly; no fighting tokens.
4. ✅ **Plate's discriminated `<PlateElement as="X">` typing fights TS** — solved with a `withAs<As>(props, as)` helper that casts `attributes` via `never`. Documented in `parts/element-renderers.tsx`.
5. ✅ **Static viewer needs parallel renderers** — `parts/element-renderers.tsx` uses `PlateElement` (live, client hooks); `static-elements/static-element-renderers.tsx` renders bare HTML with `props.attributes` spread (no client hooks, no SSR concerns).
6. ✅ **`unsetMark` doesn't exist in v53** — use `editor.tf.removeMark(key)`.
7. ✅ **`useMarkToolbarButton` + `useMarkToolbarButtonState`** — first-party hooks for mark toggles; cleaner than rolling our own.

## Why not...

- **Build the toolbar from Plate's shadcn registry (`pnpm dlx shadcn@latest add @plate/...`)?** — That installs Plate UI components into `src/components/ui/` (next to shadcn primitives) and consumers would need them too. For a sealed-folder pro-comp we'd then declare every Plate UI component as a `registryDependencies` cross-registry ref. Higher consumer-install complexity, less control over our chrome. We chose to build the toolbar from our existing shadcn primitives (`Button`) + raw HTML (selects, color input) — fewer files, more pro-ui-native, easier to evolve. We can layer Plate's UI components in v0.2 if real demand surfaces.
- **TipTap instead of Plate?** — Decided in research pass. TipTap has 8.1M weekly DLs vs Plate's 155k (operationally safer), but Plate's official `udecode/plate-template` is React 19 + Next 16 + Tailwind v4 + shadcn-native — exact stack fit. We picked stack-fit over community size. Documented in memory.
- **One component with `mode="edit" | "view"` prop?** — Bundles the 150KB editor weight into every viewer page. Even with `next/dynamic`, the API would conflate two genuinely different things. Two exports, one folder.
- **HTML as storage?** — Plate's docs warn against HTML round-trips: serialization loses the structural model that makes editing reliable. JSON is the source of truth; HTML serialization is an export boundary (RSS, email).
- **`@platejs/floating-toolbar` for v0.1?** — Adds a second toolbar mode (selection-anchored). Out of v0.1 scope. The fixed top toolbar is the universal pattern.
- **Custom NodeViews for fancy block types?** — Plate's NodeView system is powerful but the static renderer can diverge from live output for custom NodeViews. Avoid in v0.1; ship the standard Plate plugin set.
