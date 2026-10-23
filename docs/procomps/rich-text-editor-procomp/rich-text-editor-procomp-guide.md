# rich-text-editor — consumer guide

> Stage 3: how to use it.
>
> Component lives at [`src/registry/components/data/rich-text-editor/`](../../../src/registry/components/data/rich-text-editor/).
>
> First Plate-based pro-comp in pro-ui. Pairs with `markdown-editor` (CodeMirror — source-text editor) but is a different paradigm: WYSIWYG rich text with JSON-as-storage.

## What's new in v0.4

Sandboxed, host-allow-listed embeds and scheme-filtered links (editor, viewer and HTML export) - see [Security: embeds and links](#security-embeds-and-links).

## What's new in v0.2

**v0.2.0 (2026-05-02):**

- **Syntax-highlighted code blocks** via lowlight — 15 languages registered (bash / css / diff / go / html / java / javascript / json / markdown / python / rust / shell / sql / typescript / xml / yaml). Token colors map to the chart-1..5 palette in `globals.css` so they integrate with the design system. To highlight a block, set `lang` on the code_block node: `{ type: "code_block", lang: "typescript", children: [...] }`.
- **HTML serialization escape hatch** — call `serializeRichTextToHtml(value)` (async, server-only) for export boundaries (RSS, email, OG tags). JSON stays canonical for storage.
- **Image resize + inline caption** — hover any image to reveal a right-edge resize handle; drag to resize (width persists as a percentage on the node). Click below the image to edit the caption inline.
- **Floating toolbar** — selecting text inside the editor surfaces a compact floating toolbar (bold / italic / underline / strikethrough / inline-code / highlight / link). Anchored to the selection rect via `@floating-ui/react`. Coexists with the fixed top toolbar.

**v0.2.1 (2026-05-21):** additive re-exports — `RichTextValue` type alias and `RICH_TEXT_EMPTY_VALUE` constant are now first-class exports from the package barrel (previously file-local). Consumers wrapping the editor in RHF / json-form controllers no longer need to re-derive the empty shape. No public-API breakage.

**v0.2.2 (2026-05-21):** content-equality echo guard in the controlled-mode sync effect. The sync effect that mirrors the `value` prop into Plate's `editor.children` now compares **stringified content** (`serializeValueKey(value) !== lastSyncedKeyRef.current`) instead of reference equality. RHF / json-form-style hosts emit a fresh `value` reference on every render even when the content is unchanged; the old reference check fired `editor.tf.setValue` on every keystroke, which reset Slate's selection and (under rapid succession) tripped React's max-update-depth guard (#185). The content check makes controlled mode work correctly under RHF — typing in an `<RichTextEditor>` driven by `react-hook-form` no longer loses focus or loops. The JSON-stringify pass is O(n) on tree size but is cheap relative to a keystroke's frame budget.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/rich-text-editor
```

This pulls the sealed-folder source AND auto-installs the npm dependencies (`platejs`, `@platejs/basic-nodes`, `@platejs/basic-styles`, `@platejs/code-block`, `@platejs/indent`, `@platejs/link`, `@platejs/list`, `@platejs/media`, `@platejs/table`, `lucide-react`).

The `@ilinxa/rich-text-editor-fixtures` sibling adds the demo dummy-data file. Skip if you have your own articles.

## The two exports

```ts
import {
  RichTextEditor,    // "use client" — full WYSIWYG editor with toolbar
  RichTextViewer,    // RSC-friendly — pure server-renderable viewer
  type RichTextValue,
  type ImageUploader,
} from "@/components/rich-text-editor";
```

| | Editor | Viewer |
|---|---|---|
| Boundary | `"use client"` | server component (RSC) |
| Bundle | ~150KB gzip | ~30KB gzip (~5× lighter) |
| Lifecycle | Plate editor instance mounts | pure JSON-to-JSX serialization |
| Use on | `/admin/posts/[id]/edit` style pages | every `/news/[id]` view |

Both consume the same `RichTextValue` shape. Storage format is JSON — never round-trip through HTML.

## Editor quick start

```tsx
"use client";

import { useState } from "react";
import {
  RichTextEditor,
  RICH_TEXT_EMPTY_VALUE,
  type RichTextValue,
} from "@/components/rich-text-editor";

export function ArticleEditPage({ initial }: { initial?: RichTextValue }) {
  const [value, setValue] = useState<RichTextValue>(
    initial ?? RICH_TEXT_EMPTY_VALUE
  );

  return (
    <RichTextEditor
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
import { RichTextViewer } from "@/components/rich-text-editor";

export default async function NewsArticle({ params }: { params: { id: string } }) {
  const article = await fetchArticle(params.id);
  return (
    <article className="lg:col-span-8">
      <h1 className="text-3xl font-serif font-bold">{article.title}</h1>
      <RichTextViewer value={article.body} />
    </article>
  );
}
```

The viewer renders inside an RSC route with no hydration cost — Plate's `PlateStatic` walks the JSON and emits HTML directly.

## Image upload contract

The component never talks to a backend directly. Pass `onImageUpload` — a function that takes a `File` and resolves to `{ src, alt?, width?, height? }`:

```tsx
<RichTextEditor
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

The rich-text component is the missing middle of the kasder news detail-page port. Together with siblings:

```tsx
<article className="lg:col-span-8">
  <h1 className="text-3xl font-serif font-bold mb-4">{article.title}</h1>

  <ArticleMeta divider items={metaItems} />

  <RichTextViewer value={article.body} />

  <ShareBar
    targets={[{ kind: "twitter" }, { kind: "facebook" }, { kind: "linkedin" }, { kind: "copy" }]}
    title={article.title}
    headingAs="h4"
    divider
  />
</article>

<aside className="lg:col-span-4">
  <div className="sticky top-24 space-y-8">
    <AuthorCard {...author} />
    <ThumbnailList items={relatedArticles} />
    <NewsletterSignup onSubmit={subscribe} />
  </div>
</aside>
```

That's the full kasder news detail page in 7 pro-comps.

## API reference

```ts
interface RichTextEditorProps {
  // Value
  value?: RichTextValue;          // controlled mode
  defaultValue?: RichTextValue;   // uncontrolled initial
  onChange?: (value: RichTextValue) => void;
  onSave?: (value: RichTextValue) => void | Promise<void>;

  // Behavior
  readOnly?: boolean;                // default false; hides toolbar
  placeholder?: string;              // default "Write your article here…"
  autoFocus?: boolean;               // default false; focuses editor on mount

  // Embed policy (v0.4.0 - see "Security: embeds and links")
  embedAllowList?: string[];         // hostnames; "*.example.com" wildcard; REPLACES the default list
  isEmbedAllowed?: (url: URL) => boolean; // wins over embedAllowList

  // Image upload
  onImageUpload?: (file: File) => Promise<{ src; alt?; width?; height? }>;

  // Layout / chrome
  hideToolbar?: boolean;             // default false; useful in read-only consumer wrappers
  className?: string;
  toolbarClassName?: string;
  containerClassName?: string;       // the scrollable wrapper around PlateContent
  contentClassName?: string;         // the PlateContent itself
}

interface RichTextViewerProps {
  value: RichTextValue;           // required
  className?: string;
  fallback?: ReactNode;              // shown when value is empty (defaults to "No content.")
  embedAllowList?: string[];         // same as the editor prop
  isEmbedAllowed?: (url: URL) => boolean;
}

type RichTextValue = Value;       // Plate's Value type — array of element nodes

const RICH_TEXT_EMPTY_VALUE: RichTextValue;
const RICH_TEXT_DEFAULT_PLACEHOLDER: string;

interface ImageUploadResult {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}
type ImageUploader = (file: File) => Promise<ImageUploadResult>;
```

## Security: embeds and links

Stored JSON, pasted HTML and programmatic inserts can all produce `media_embed` and link nodes with an arbitrary `url`. Since v0.4.0 the editor, the viewer and `serializeRichTextToHtml` treat those URLs as untrusted.

**Embeds**
- The URL must parse as an absolute `https:` URL and its hostname must be on the allow-list. Default list: `www.youtube.com`, `youtube.com`, `www.youtube-nocookie.com`, `player.vimeo.com`. URLs carrying credentials (`https://user:pw@host/…`) are refused. Matching is on the parsed hostname only (any path on an allowed host is embeddable); list internationalized hosts in their punycode form (`xn--…`), and note a `*.com`-style wildcard allows every host under that suffix.
- Allowed embeds render `<iframe sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox" referrerpolicy="strict-origin-when-cross-origin" loading="lazy" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen title="Embedded content">`. `allow-top-navigation*` is never granted.
- Anything else (other host, `http:`, `javascript:`, unparsable) renders as a plain link card in the same box: `<a rel="noopener noreferrer nofollow" target="_blank">` with the URL as text, or plain text when the URL is not a safe href. It is never an iframe and never silently dropped.
- `embedAllowList={["*.example.com", "video.acme.io"]}` **replaces** the default list (add the defaults back yourself if you still want them; they are exported as `EMBED_DEFAULT_ALLOW_LIST`). `*.` matches subdomains, not the apex.
- `isEmbedAllowed={(url) => ...}` wins over the list and receives the parsed https `URL`. A non-https URL is refused regardless.
- The same two options exist on `<RichTextEditor>`, `<RichTextViewer>` and `serializeRichTextToHtml(value, options)`.
- Same-origin embeds are NOT detected: the viewer is server-rendered, and a client-only origin check would cause a hydration mismatch. Do not put your own origin on the allow-list, because `allow-scripts` + `allow-same-origin` on a same-origin frame defeats the sandbox.
- Policy is read at render time per editor instance; changing the props re-renders on the next edit/refresh of the document, not retroactively for already-mounted embed nodes.

**Links**
- `href` is passed through `safeHref()` (exported): control characters and whitespace are stripped before the scheme is checked; `http`, `https`, `mailto`, `tel` and scheme-less relative URLs are allowed. Anything else (`javascript:`, `data:`, `vbscript:`, `file:`) renders the link without an `href`, children kept. Protocol-relative URLs (`//example.com`) count as relative and navigate off-site, exactly like an absolute `https:` link would.
- The toolbar and floating-toolbar link prompts reject unsafe URLs (nothing is inserted); the toolbar image prompt requires `http(s)`. `LinkPlugin` is configured with `allowedSchemes: ["http", "https", "mailto", "tel"]`.

**Migration from 0.3.x:** embeds from hosts outside the allow-list now render as links; pass `embedAllowList` or `isEmbedAllowed` to allow them. Existing YouTube/Vimeo embed URLs keep rendering. Dependents (`json-form` richtext field, `content-composer`) need no changes.

## Controlled mode (RHF / json-form)

`<RichTextEditor>` is safe to drive from a `react-hook-form` Controller or as a `json-form` `richtext` field. The sync effect uses **content-equality** (`serializeValueKey(value) !== lastSyncedKeyRef.current`) since v0.2.2, so:

- A host that re-emits a new `value` reference per render with identical content (RHF's default behavior) does NOT trigger spurious `editor.tf.setValue` calls.
- Selection / caret position is preserved across host re-renders that don't actually change content.
- External content updates (`reset()`, server-loaded value swap) still flow through correctly — the content hash changes, the effect fires, `editor.tf.setValue` runs once.

Worked example, RHF Controller:

```tsx
<Controller
  name="body"
  control={form.control}
  defaultValue={RICH_TEXT_EMPTY_VALUE}
  render={({ field }) => (
    <RichTextEditor
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
```

For json-form, just declare a `richtext` field and let the substrate wire the controller — `parts/field-richtext.tsx` is the canonical adapter.

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

- Toolbar carries `role="toolbar"` + `aria-label="Rich text editor toolbar"`.
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

**Closed in v0.2:** ✅ syntax highlighting (lowlight) · ✅ floating toolbar · ✅ image resizing + captions · ✅ HTML serialization escape hatch · ✅ `RichTextValue` + `RICH_TEXT_EMPTY_VALUE` package-level re-exports (v0.2.1) · ✅ content-equality controlled-mode echo guard for RHF / json-form hosts (v0.2.2).

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
- **`markdown-editor` → `rich-text-editor`** — different paradigms (source-text vs WYSIWYG). Use `markdown-editor` when consumers are markdown-fluent and want explicit syntax; use `rich-text-editor` for end-user editors where the document model is hidden.
