export default function ArticleBody01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        A WYSIWYG rich-text editor + read-only viewer for long-form article
        bodies — news, blog posts, doc pages, knowledge-base entries. Built on{" "}
        <a
          href="https://platejs.org"
          className="text-primary underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Plate (platejs)
        </a>
        , pro-ui&apos;s WYSIWYG substrate.
      </p>
      <p className="mt-2 text-muted-foreground">
        Two exports from one folder: <code>ArticleBodyEditor</code> is a{" "}
        <code>&quot;use client&quot;</code> editor (~150KB gzip);{" "}
        <code>ArticleBodyViewer</code> is server-renderable (~30KB gzip).
        Storage format is JSON — Plate&apos;s docs warn against HTML round-trips.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Editor</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`"use client"

import {
  ArticleBodyEditor,
  type ArticleBodyValue,
} from "@/registry/components/data/article-body-01"

export function ArticleEditPage({ initial }: { initial: ArticleBodyValue }) {
  const [value, setValue] = useState(initial)

  return (
    <ArticleBodyEditor
      value={value}
      onChange={setValue}
      onSave={async (v) => {
        await fetch("/api/articles/save", { method: "POST", body: JSON.stringify(v) })
      }}
      onImageUpload={async (file) => {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        return res.json()    // { src, alt?, width?, height? }
      }}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Viewer (RSC)</h3>
      <p className="text-muted-foreground">
        The viewer is a server component — no <code>&quot;use client&quot;</code>{" "}
        boundary needed. It uses <code>platejs/static</code> to render the JSON
        without instantiating an editor.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ArticleBodyViewer } from "@/registry/components/data/article-body-01"

export default async function NewsArticle({ params }: { params: { id: string } }) {
  const article = await fetchArticle(params.id)
  return (
    <article>
      <h1>{article.title}</h1>
      <ArticleBodyViewer value={article.body} />
    </article>
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Composed with the news-domain article column</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<article className="lg:col-span-8">
  <h1>{article.title}</h1>

  <ArticleMeta01 divider items={metaItems} />

  <ArticleBodyViewer value={article.body} />

  <ShareBar01 targets={[...]} title={article.title} headingAs="h4" divider />
</article>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Image upload contract</h3>
      <p className="text-muted-foreground">
        The component never talks to a backend directly. Pass{" "}
        <code>onImageUpload</code> — a function that takes a <code>File</code>{" "}
        and resolves to <code>{`{ src, alt?, width?, height? }`}</code>. Without
        this prop, the editor falls back to a URL prompt.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Toolbar</h3>
      <p className="text-muted-foreground">
        Marks: bold, italic, underline, strikethrough, inline code, highlight,
        subscript, superscript. Blocks: H1–H3, blockquote, code block,
        horizontal rule. Lists: bullet, ordered. Insert: link, image, table.
        Styles: font family, font size, text color.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Storage format is the Plate <code>Value</code> type (an array of
          element nodes). Don&apos;t round-trip through HTML — keep JSON
          authoritative; serialize to HTML only at export boundaries (RSS,
          email, etc.).
        </li>
        <li>
          The viewer renders bare HTML with Plate&apos;s data-slate-* attributes
          stripped — no editor instance, no client hooks. Safe in Server
          Components.
        </li>
        <li>
          Press <code>Cmd/Ctrl+S</code> to fire <code>onSave</code> with the
          current document. Override <code>autoFocus</code> to focus the editor
          on mount.
        </li>
        <li>
          The editor is <code>echo-guarded</code> on the <code>value</code>{" "}
          prop: external updates flow in via <code>setValue</code> on the editor
          without triggering an extra <code>onChange</code> emit.
        </li>
        <li>
          Toolbar buttons are <code>onMouseDown</code>-driven so the editor
          selection isn&apos;t lost when clicking a button.
        </li>
        <li>
          Plate ships a brand-recognizable suite of plugins under{" "}
          <code>@platejs/*</code>. This component pins to v53. When bumping
          Plate, re-verify SSR, image upload, and the JSON shape.
        </li>
      </ul>
    </div>
  );
}
