# article-body-01 — consumer guide

> Stage 3: how to use it.
>
> Component lives at [`src/registry/components/data/article-body-01/`](../../../src/registry/components/data/article-body-01/).
>
> First Plate-based pro-comp in pro-ui. Pairs with `markdown-editor` (CodeMirror — source-text editor) but is a different paradigm: WYSIWYG rich text with JSON-as-storage.

## What's new in v0.2 (2026-05-02)

- **Syntax-highlighted code blocks** via lowlight — 15 languages registered (bash / css / diff / go / html / java / javascript / json / markdown / python / rust / shell / sql / typescript / xml / yaml). Token colors map to the chart-1..5 palette in `globals.css` so they integrate with the design system. To highlight a block, set `lang` on the code_block node: `{ type: "code_block", lang: "typescript", children: [...] }`.
- **HTML serialization escape hatch** — call `serializeArticleBodyToHtml(value)` (async, server-only) for export boundaries (RSS, email, OG tags). JSON stays canonical for storage.
- **Image resize + inline caption** — hover any image to reveal a right-edge resize handle; drag to resize (width persists as a percentage on the node). Click below the image to edit the caption inline.
- **Floating toolbar** — selecting text inside the editor surfaces a compact floating toolbar (bold / italic / underline / strikethrough / inline-code / highlight / link). Anchored to the selection rect via `@floating-ui/react`. Coexists with the fixed top toolbar.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/article-body-01
```

This pulls the sealed-folder source AND auto-installs the npm dependencies (`platejs`, `@platejs/basic-nodes`, `@platejs/basic-styles`, `@platejs/code-block`, `@platejs/indent`, `@platejs/link`, `@platejs/list`, `@platejs/media`, `@platejs/table`, `lucide-react`).

The `@ilinxa/article-body-01-fixtures` sibling adds the demo dummy-data file. Skip if you have your own articles.

## The two exports

```ts
import {
  ArticleBodyEditor,    // "use client" — full WYSIWYG editor with toolbar
  ArticleBodyViewer,    // RSC-friendly — pure server-renderable viewer
  type ArticleBodyValue,
  type ImageUploader,
} from "@/registry/components/data/article-body-01";
```

| | Editor | Viewer |
|---|---|---|
| Boundary | `"use client"` | server component (RSC) |
| Bundle | ~150KB gzip | ~30KB gzip (~5× lighter) |
| Lifecycle | Plate editor instance mounts | pure JSON-to-JSX serialization |
| Use on | `/admin/posts/[id]/edit` style pages | every `/news/[id]` view |

Both consume the same `ArticleBodyValue` shape. Storage format is JSON — never round-trip through HTML.

## Editor quick start

```tsx
"use client";

import { useState } from "react";
import {
  ArticleBodyEditor,
  ARTICLE_BODY_EMPTY_VALUE,
  type ArticleBodyValue,
} from "@/registry/components/data/article-body-01";

export function ArticleEditPage({ initial }: { initial?: ArticleBodyValue }) {
  const [value, setValue] = useState<ArticleBodyValue>(
    initial ?? ARTICLE_BODY_EMPTY_VALUE
  );

  return (
    <ArticleBodyEditor
      value={value}
      onChange={setValue}
      onSave={async (v) => {
        await fetch("/api/articles/save", {
          method: "POST",
          body: JSON.stringify(v),
        });
      }}
    />
  );
}
```

Press `Cmd/Ctrl+S` while in the editor to fire `onSave(value)` with the current document.

## Viewer quick start

```tsx
// Server component — no "use client"
import { ArticleBodyViewer } from "@/registry/components/data/article-body-01";

export default async function NewsArticle({ params }: { params: { id: string } }) {
  const article = await fetchArticle(params.id);
  return (
    <article className="lg:col-span-8">
      <h1 className="text-3xl font-serif font-bold">{article.title}</h1>
      <ArticleBodyViewer value={article.body} />
    </article>
  );
}
```

The viewer renders inside an RSC route with no hydration cost — Plate's `PlateStatic` walks the JSON and emits HTML directly.

## Image upload contract

The component never talks to a backend directly. Pass `onImageUpload` — a function that takes a `File` and resolves to `{ src, alt?, width?, height? }`:

```tsx
<ArticleBodyEditor
  onImageUpload={async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("upload failed");
    return res.json();   // { src, alt?, width?, height? }
  }}
/>
```

Without this prop, the editor falls back to a URL prompt — useful for demos and admin tools where the URL is already known.

## Toolbar (v0.1)

| Cluster | Items |
|---|---|
| Marks | Bold, Italic, Underline, Strikethrough, Inline code, Highlight, Subscript, Superscript |
| Headings | H1, H2, H3 |
| Blocks | Blockquote, Code block, Horizontal rule |
| Lists | Bullet, Ordered |
| Insert | Link, Image, Table |
| Styles | Font family, Font size, Text color |

Mark buttons reflect cursor state (`aria-pressed=true` when the cursor sits inside that mark). Block buttons reflect the current block type.

## Composed with the news-domain article column

The article-body component is the missing middle of the kasder news detail-page port. Together with siblings:

```tsx
<article className="lg:col-span-8">
  <h1 className="text-3xl font-serif font-bold mb-4">{article.title}</h1>

  <ArticleMeta01 divider items={metaItems} />

  <ArticleBodyViewer value={article.body} />

  <ShareBar01
    targets={[{ kind: "twitter" }, { kind: "facebook" }, { kind: "linkedin" }, { kind: "copy" }]}
    title={article.title}
    headingAs="h4"
    divider
  />
</article>

<aside className="lg:col-span-4">
  <div className="sticky top-24 space-y-8">
    <AuthorCard01 {...author} />
    <ThumbList01 items={relatedArticles} />
    <NewsletterCard01 onSubmit={subscribe} />
  </div>
</aside>
```

That's the full kasder news detail page in 7 pro-comps.

## API reference

```ts
interface ArticleBodyEditorProps {
  // Value
  value?: ArticleBodyValue;          // controlled mode
  defaultValue?: ArticleBodyValue;   // uncontrolled initial
  onChange?: (value: ArticleBodyValue) => void;
  onSave?: (value: ArticleBodyValue) => void | Promise<void>;

  // Behavior
  readOnly?: boolean;                // default false; hides toolbar
  placeholder?: string;              // default "Write your article here…"
  autoFocus?: boolean;               // default false; focuses editor on mount

  // Image upload
  onImageUpload?: (file: File) => Promise<{ src; alt?; width?; height? }>;

  // Layout / chrome
  hideToolbar?: boolean;             // default false; useful in read-only consumer wrappers
  className?: string;
  toolbarClassName?: string;
  containerClassName?: string;       // the scrollable wrapper around PlateContent
  contentClassName?: string;         // the PlateContent itself
}

interface ArticleBodyViewerProps {
  value: ArticleBodyValue;           // required
  className?: string;
  fallback?: ReactNode;              // shown when value is empty (defaults to "No content.")
}

type ArticleBodyValue = Value;       // Plate's Value type — array of element nodes

const ARTICLE_BODY_EMPTY_VALUE: ArticleBodyValue;
const ARTICLE_BODY_DEFAULT_PLACEHOLDER: string;

interface ImageUploadResult {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}
type ImageUploader = (file: File) => Promise<ImageUploadResult>;
```

## Storage format

The Plate `Value` type is an array of element nodes:

```json
[
  { "type": "h1", "children": [{ "text": "Title" }] },
  {
    "type": "p",
    "children": [
      { "text": "Hello " },
      { "text": "world", "bold": true },
      { "text": "." }
    ]
  },
  {
    "type": "blockquote",
    "children": [{ "text": "A quote." }]
  },
  {
    "type": "ul",
    "listStyleType": "disc",
    "indent": 1,
    "children": [{ "text": "First item" }]
  }
]
```

**Don't round-trip through HTML.** Plate's docs warn against this — HTML serialization loses the structural model that makes editing reliable. Keep JSON authoritative; serialize to HTML only at export boundaries (RSS feeds, email digests, etc.) using `serializeHtml` from `platejs/static`.

## A11y

- Toolbar carries `role="toolbar"` + `aria-label="Article body editor toolbar"`.
- Mark buttons use `aria-pressed={isActive}` so screen readers track toggle state.
- Icon-only buttons have both `title` (sighted hover) and `aria-label` (SR).
- Image elements render in `<figure>` with optional `<figcaption>`.
- Link elements open with `target="_blank" rel="noopener noreferrer"`.
- Editor is `spellCheck`-enabled.
- Read-only mode disables editing; toolbar is hidden by default.

## Performance

- Editor renders only on client (`"use client"`). Server-side, the editor demo emits a placeholder div until hydration; the viewer renders fully server-side.
- Viewer is ~5× lighter than the editor — exactly the read-mostly optimization the brief asked for.
- Plate uses React Compiler-aware patterns; the toolbar's mark buttons are first-party hooks (`useMarkToolbarButton` / `useMarkToolbarButtonState`) which Plate optimizes internally.
- The 2s save-success affordance is locked at 2000ms; the platform-aware key descriptor (`Cmd+S` on Mac, `Ctrl+S` elsewhere) is computed once at module load.

## Known limits / v0.3 candidates

**Closed in v0.2:** ✅ syntax highlighting (lowlight) · ✅ floating toolbar · ✅ image resizing + captions · ✅ HTML serialization escape hatch.

**Still parked for future versions:**
- **Heading-4 in toolbar.** Plugin set supports H1–H4; toolbar exposes H1–H3 only.
- **Slash command menu** (`/heading`, `/quote`, etc) — `@platejs/slash-command` available but not wired.
- **DnD block reordering** — `@platejs/dnd` available.
- **Mention autocomplete** — `@platejs/mention`.
- **Math blocks** — `@platejs/math`.
- **Comments / suggestions** — `@platejs/comment` + `@platejs/suggestion`.
- **Collaborative editing** (Yjs / Liveblocks) — different architecture.
- **Markdown autoformat** (typing `# ` → H1, `> ` → blockquote) — `@platejs/autoformat`.
- **Selectors are native HTML** (`<select>` + `<input type="color">`). Future: shadcn DropdownMenu wrappers.
- **AI features** (smart suggestions, autocomplete from LLM) — different paradigm.

## Tailwind v4 + theme tokens

The component flows through pro-ui's existing tokens (no special Tailwind config needed):

- `--background` / `--foreground` — page + text base
- `--card` — editor + viewer surface
- `--border` — toolbar + content separators
- `--primary` — selection ring, link color, blockquote rule
- `--muted` / `--muted-foreground` — toolbar background, code block bg, secondary text
- `--font-serif` (Playfair Display) — headings (H1–H4)
- `--font-sans` (Onest) — paragraphs
- `--font-mono` (JetBrains Mono) — code

Override any of these in your project's `globals.css` to retheme the editor + viewer.

## Plate version pinning

This component pins to Plate v53. When bumping:

1. `pnpm up platejs @platejs/*@latest`
2. Re-verify SSR via `pnpm build`
3. Re-verify image upload (Plate's MediaPlugin sometimes shifts shape)
4. Re-verify the JSON shape — `editor.children` schema can change at major bumps
5. Re-confirm MIT license — `platejs` core has stayed MIT; the broader `pro.platejs.org` ecosystem has paid templates that don't apply to us

Pin exact versions in `registry.json` to avoid auto-bumping consumers into incompatible territory.

## Why JSON, not HTML?

Plate's docs are explicit on this:

> **Storage format: JSON.** HTML round-trips lose structural information (text marks, list types, custom attributes) that the editor relies on for predictable editing.

JSON is queryable, format-agnostic, and stable across Plate versions. HTML serialization is an export boundary — call `serializeHtml(editor, value)` from `platejs/static` when you need HTML for RSS / email / OG tags. Don't store it as canonical.

## Migration / replacement guide

If you're coming from an existing rich-text setup:

- **TipTap → Plate** — both use Slate-shaped JSON. Schema differs; not a 1:1 migration. Write a one-time conversion script.
- **Lexical → Plate** — Lexical uses its own JSON shape. Conversion is more involved; consider sticking with Lexical if you've invested heavily.
- **Markdown text → Plate** — use `@platejs/markdown` (not yet wired in v0.1) or convert via `marked` → HTML → Plate's `htmlToValue` deserializer (also future v0.2).
- **`markdown-editor` → `article-body-01`** — different paradigms (source-text vs WYSIWYG). Use `markdown-editor` when consumers are markdown-fluent and want explicit syntax; use `article-body-01` for end-user editors where the document model is hidden.
