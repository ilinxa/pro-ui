"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleBodyEditor } from "./article-body-01";
import { ArticleBodyViewer } from "./article-body-viewer";
import {
  ARTICLE_BODY_01_DUMMY_CODE,
  ARTICLE_BODY_01_DUMMY_EMPTY,
  ARTICLE_BODY_01_DUMMY_IMAGE,
  ARTICLE_BODY_01_DUMMY_RICH,
  ARTICLE_BODY_01_DUMMY_SIMPLE,
  ARTICLE_BODY_01_DUMMY_TABLE,
} from "./dummy-data";
import { serializeArticleBodyToHtml } from "./lib/serialize-html";
import type { ArticleBodyValue, ImageUploader } from "./types";

const fakeUploader: ImageUploader = async (file) => {
  await new Promise((r) => setTimeout(r, 400));
  return {
    src: URL.createObjectURL(file),
    alt: file.name,
  };
};

function HtmlExportPanel({ value }: { value: ArticleBodyValue }) {
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    serializeArticleBodyToHtml(value, { stripDataAttributes: true })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (error) {
    return (
      <pre className="rounded-md border border-destructive/50 bg-destructive/5 p-4 font-mono text-xs text-destructive">
        Serialization failed: {error}
      </pre>
    );
  }

  return (
    <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
      <code>{html || "(serializing…)"}</code>
    </pre>
  );
}

export default function ArticleBody01Demo() {
  const [edited, setEdited] = useState<ArticleBodyValue>(
    ARTICLE_BODY_01_DUMMY_RICH
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);

  return (
    <Tabs defaultValue="editor" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="editor">Editor</TabsTrigger>
        <TabsTrigger value="viewer">Viewer</TabsTrigger>
        <TabsTrigger value="roundtrip">Edit ↔ View</TabsTrigger>
        <TabsTrigger value="code">Code (syntax)</TabsTrigger>
        <TabsTrigger value="image">Image (resize + caption)</TabsTrigger>
        <TabsTrigger value="export">HTML export</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>

      <TabsContent value="editor" className="mt-6">
        <ArticleBodyEditor
          defaultValue={ARTICLE_BODY_01_DUMMY_RICH}
          onImageUpload={fakeUploader}
          onSave={(value) => {
            setSavedAt(new Date().toLocaleTimeString());
            setEdited(value);
          }}
        />
        {savedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Saved at {savedAt}. Select text to surface the floating toolbar.
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Press Cmd/Ctrl+S to fire <code>onSave</code>. Select text to
            surface the floating toolbar.
          </p>
        )}
      </TabsContent>

      <TabsContent value="viewer" className="mt-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <ArticleBodyViewer value={ARTICLE_BODY_01_DUMMY_RICH} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The viewer is a pure server-renderable component — no editor instance
          mounted.
        </p>
      </TabsContent>

      <TabsContent value="roundtrip" className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Editor
          </p>
          <ArticleBodyEditor
            value={edited}
            onChange={setEdited}
            onImageUpload={fakeUploader}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Viewer (live)
          </p>
          <div className="rounded-lg border border-border bg-card p-6">
            <ArticleBodyViewer value={edited} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="code" className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Editor — code blocks with lowlight syntax highlighting
          </p>
          <ArticleBodyEditor defaultValue={ARTICLE_BODY_01_DUMMY_CODE} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Viewer (server-rendered, identical highlighting)
          </p>
          <div className="rounded-lg border border-border bg-card p-6">
            <ArticleBodyViewer value={ARTICLE_BODY_01_DUMMY_CODE} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Languages registered: bash, css, diff, go, html, java, javascript,
          json, markdown, python, rust, sql, typescript, xml, yaml. Token
          colors map to the chart-1..5 palette in <code>globals.css</code>.
        </p>
      </TabsContent>

      <TabsContent value="image" className="mt-6 space-y-4">
        <p className="text-xs text-muted-foreground">
          Hover the image to reveal the right-edge resize handle. Click the
          caption text below it to edit. Both width and caption are stored on
          the node and persist through the JSON.
        </p>
        <ArticleBodyEditor
          defaultValue={ARTICLE_BODY_01_DUMMY_IMAGE}
          onImageUpload={fakeUploader}
        />
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Viewer (preserves width + caption)
          </p>
          <div className="rounded-lg border border-border bg-card p-6">
            <ArticleBodyViewer value={ARTICLE_BODY_01_DUMMY_IMAGE} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="export" className="mt-6 space-y-4">
        <p className="text-xs text-muted-foreground">
          Storage stays JSON (Plate <code>Value</code>). Call{" "}
          <code>serializeArticleBodyToHtml(value)</code> at export boundaries
          (RSS / email / OG tags) to get a clean HTML string. Async — uses
          react-dom/server under the hood. Server-only.
        </p>
        <ArticleBodyEditor
          value={edited}
          onChange={setEdited}
          onImageUpload={fakeUploader}
        />
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Live HTML export
          </p>
          <HtmlExportPanel value={edited} />
        </div>
      </TabsContent>

      <TabsContent value="empty" className="mt-6">
        <ArticleBodyEditor defaultValue={ARTICLE_BODY_01_DUMMY_EMPTY} />
        <p className="mt-2 text-xs text-muted-foreground">
          Empty starting state. Type to begin.
        </p>
      </TabsContent>

      <TabsContent value="json" className="mt-6 space-y-4">
        <ArticleBodyEditor
          defaultValue={ARTICLE_BODY_01_DUMMY_SIMPLE}
          onChange={setEdited}
        />
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Live JSON
          </p>
          <pre className="max-h-80 overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
            <code>{JSON.stringify(edited, null, 2)}</code>
          </pre>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Code-block fixture
            </p>
            <div className="rounded-lg border border-border bg-card p-6">
              <ArticleBodyViewer value={ARTICLE_BODY_01_DUMMY_CODE} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Table fixture
            </p>
            <div className="rounded-lg border border-border bg-card p-6">
              <ArticleBodyViewer value={ARTICLE_BODY_01_DUMMY_TABLE} />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
