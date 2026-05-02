"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleBodyEditor } from "./article-body-01";
import { ArticleBodyViewer } from "./article-body-viewer";
import {
  ARTICLE_BODY_01_DUMMY_CODE,
  ARTICLE_BODY_01_DUMMY_EMPTY,
  ARTICLE_BODY_01_DUMMY_RICH,
  ARTICLE_BODY_01_DUMMY_SIMPLE,
  ARTICLE_BODY_01_DUMMY_TABLE,
} from "./dummy-data";
import type { ArticleBodyValue, ImageUploader } from "./types";

const fakeUploader: ImageUploader = async (file) => {
  await new Promise((r) => setTimeout(r, 400));
  return {
    src: URL.createObjectURL(file),
    alt: file.name,
  };
};

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
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="json">JSON output</TabsTrigger>
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
          <p className="mt-2 text-xs text-muted-foreground">Saved at {savedAt}</p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Press Cmd/Ctrl+S to fire <code>onSave</code>.
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
