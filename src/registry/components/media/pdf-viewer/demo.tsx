"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, FileText, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  PDF_VIEWER_DUMMY_URL,
  pdfViewerDummyBlob,
} from "./dummy-data";
import type { PdfViewerHandle, PdfViewerProps } from "./types";

// pdf.js requires browser globals (DOMMatrix, Worker, Canvas), so the viewer
// must be loaded client-only. Consumers should use the same pattern in their
// own app (see usage.tsx → "Lazy loading"). This wrapper is allowed in
// demo.tsx because demo files are docs-site-only — never shipped via the
// registry to consumers.
const PdfViewer = dynamic(
  () => import("./pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <Skeleton className="h-3/4 w-2/3" />
      </div>
    ),
  },
) as unknown as React.ForwardRefExoticComponent<
  PdfViewerProps & React.RefAttributes<PdfViewerHandle>
>;

function ViewerFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-160 w-full overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

function UrlTab() {
  return (
    <div className="space-y-3">
      <ViewerFrame>
        <PdfViewer source={PDF_VIEWER_DUMMY_URL} />
      </ViewerFrame>
      <p className="text-xs text-muted-foreground">
        Source: <code>string</code> URL. Drag-drop is on by default — try
        dragging another PDF onto the viewer to swap it.
      </p>
    </div>
  );
}

function FileTab() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex">
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button asChild type="button" variant="outline" size="sm">
            <span>
              <Upload aria-hidden="true" />
              Choose a PDF
            </span>
          </Button>
        </label>
        {file ? (
          <span className="font-mono text-xs text-muted-foreground">
            {file.name}
          </span>
        ) : null}
        {file ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFile(null)}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <ViewerFrame>
        <PdfViewer source={file} />
      </ViewerFrame>
      <p className="text-xs text-muted-foreground">
        Source: <code>File</code> from the OS file picker. Same drag-drop
        behavior — drop any PDF into the viewer to load it.
      </p>
    </div>
  );
}

function BlobTab() {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBlob = async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await pdfViewerDummyBlob();
      setBlob(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={fetchBlob}
          disabled={loading}
        >
          {loading ? "Fetching…" : "Fetch sample → Blob"}
        </Button>
        {blob ? (
          <span className="font-mono text-xs text-muted-foreground">
            Blob: {(blob.size / 1024).toFixed(1)} KB
          </span>
        ) : null}
        {error ? (
          <span className="text-xs text-destructive">{error}</span>
        ) : null}
      </div>
      <ViewerFrame>
        <PdfViewer source={blob} />
      </ViewerFrame>
      <p className="text-xs text-muted-foreground">
        Source: <code>Blob</code>. Useful when you have an in-memory PDF
        (after server-side rendering, decryption, etc.).
      </p>
    </div>
  );
}

function DragDropTab() {
  return (
    <div className="space-y-3">
      <ViewerFrame>
        <PdfViewer />
      </ViewerFrame>
      <p className="text-xs text-muted-foreground">
        Empty state with drag-drop on. Drag a PDF from your desktop onto the
        viewer area to load it. Non-PDF drops are ignored.
      </p>
    </div>
  );
}

function CustomToolbarTab() {
  return (
    <div className="space-y-3">
      <ViewerFrame>
        <PdfViewer
          source={PDF_VIEWER_DUMMY_URL}
          renderToolbar={({ page, numPages, scale, actions }) => (
            <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-2">
              <FileText className="size-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">
                Custom toolbar
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.goToPrevPage()}
                  disabled={page <= 1}
                >
                  <ArrowLeft />
                  Prev
                </Button>
                <span className="font-mono text-xs tabular-nums">
                  {page} / {numPages || "—"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.goToNextPage()}
                  disabled={page >= numPages}
                >
                  Next
                  <ArrowRight />
                </Button>
                <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
                  {Math.round(scale * 100)}%
                </span>
              </div>
            </div>
          )}
        />
      </ViewerFrame>
      <p className="text-xs text-muted-foreground">
        Full toolbar replacement via <code>renderToolbar</code>. The slot
        receives state + actions; build whatever chrome you want.
      </p>
    </div>
  );
}

function ToolbarOffTab() {
  return (
    <div className="space-y-3">
      <ViewerFrame>
        <PdfViewer source={PDF_VIEWER_DUMMY_URL} toolbar={false} />
      </ViewerFrame>
      <p className="text-xs text-muted-foreground">
        Minimal embed — no toolbar. Ctrl/Cmd+wheel zoom and PgUp/PgDn page
        nav still work; right-click context menu still works.
      </p>
    </div>
  );
}

function PermissionsTab() {
  const [download, setDownload] = useState(true);
  const [print, setPrint] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-muted/30 px-3 py-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={download} onCheckedChange={setDownload} />
          Allow download
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={print} onCheckedChange={setPrint} />
          Allow print
        </label>
      </div>
      <ViewerFrame>
        <PdfViewer
          source={PDF_VIEWER_DUMMY_URL}
          allowDownload={download}
          allowPrint={print}
        />
      </ViewerFrame>
      <p className="text-xs text-muted-foreground">
        UX-level gates only — anyone with browser dev tools can still pull the
        PDF. Useful for &quot;preview-only&quot; surfaces.
      </p>
    </div>
  );
}

function ImperativeRefTab() {
  const ref = useRef<PdfViewerHandle>(null);
  const [target, setTarget] = useState("3");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
        <span className="text-sm">Jump to page</span>
        <Input
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="h-8 w-16 text-center font-mono tabular-nums"
        />
        <Button
          size="sm"
          onClick={() => {
            const n = Number.parseInt(target, 10);
            if (Number.isFinite(n)) ref.current?.actions.goToPage(n);
          }}
        >
          Go
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => ref.current?.actions.zoomIn()}
        >
          + Zoom
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => ref.current?.actions.zoomOut()}
        >
          − Zoom
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => ref.current?.actions.rotate(90)}
        >
          Rotate
        </Button>
      </div>
      <ViewerFrame>
        <PdfViewer ref={ref} source={PDF_VIEWER_DUMMY_URL} />
      </ViewerFrame>
      <p className="text-xs text-muted-foreground">
        External controls via <code>ref</code>. The handle exposes the same{" "}
        <code>actions</code> the toolbar uses, plus current state and the
        underlying <code>pdfDocument</code>.
      </p>
    </div>
  );
}

function SelectionTab() {
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
        <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
          <Search className="size-3" aria-hidden="true" />
          <span>Last selection</span>
        </div>
        <p className="font-mono text-[11px] leading-relaxed text-foreground">
          {text || (
            <span className="text-muted-foreground">
              Select text inside the PDF to capture it here.
            </span>
          )}
        </p>
      </div>
      <ViewerFrame>
        <PdfViewer
          source={PDF_VIEWER_DUMMY_URL}
          onSelection={({ text }) => setText(text)}
          onSearchSelection={({ text }) => {
            window.alert(`Search "${text.slice(0, 80)}" — wire your own search`);
          }}
        />
      </ViewerFrame>
      <p className="text-xs text-muted-foreground">
        <code>onSelection</code> fires debounced; right-click → &quot;Search
        selection&quot; calls <code>onSearchSelection</code> (when provided).
      </p>
    </div>
  );
}

export default function PdfViewerDemo() {
  // Force a remount when switching tabs to keep memory bounded.
  const [tab, setTab] = useState("url");

  // Suppress unused-import warnings in case future tabs need it
  useEffect(() => {
    void tab;
  }, [tab]);

  return (
    <Tabs value={tab} onValueChange={setTab} defaultValue="url">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="url">URL</TabsTrigger>
        <TabsTrigger value="file">File</TabsTrigger>
        <TabsTrigger value="blob">Blob</TabsTrigger>
        <TabsTrigger value="dragdrop">Drag &amp; drop</TabsTrigger>
        <TabsTrigger value="custom-toolbar">Custom toolbar</TabsTrigger>
        <TabsTrigger value="toolbar-off">Toolbar off</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <TabsTrigger value="ref">Imperative ref</TabsTrigger>
        <TabsTrigger value="selection">Selection</TabsTrigger>
      </TabsList>

      <TabsContent value="url" className="mt-6">
        <UrlTab />
      </TabsContent>
      <TabsContent value="file" className="mt-6">
        <FileTab />
      </TabsContent>
      <TabsContent value="blob" className="mt-6">
        <BlobTab />
      </TabsContent>
      <TabsContent value="dragdrop" className="mt-6">
        <DragDropTab />
      </TabsContent>
      <TabsContent value="custom-toolbar" className="mt-6">
        <CustomToolbarTab />
      </TabsContent>
      <TabsContent value="toolbar-off" className="mt-6">
        <ToolbarOffTab />
      </TabsContent>
      <TabsContent value="permissions" className="mt-6">
        <PermissionsTab />
      </TabsContent>
      <TabsContent value="ref" className="mt-6">
        <ImperativeRefTab />
      </TabsContent>
      <TabsContent value="selection" className="mt-6">
        <SelectionTab />
      </TabsContent>
    </Tabs>
  );
}
