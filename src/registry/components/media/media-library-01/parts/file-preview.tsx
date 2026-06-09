"use client";

import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isTextKind, resolvePreviewKind } from "../lib/preview-kind";
import { useTextContent } from "../hooks/use-text-content";
import {
  DEFAULT_MEDIA_LIBRARY_LABELS,
  type MediaLibrary01Labels,
  type MediaNode,
  type MediaPreviewKind,
} from "../types";
import { PreviewKindIcon } from "./file-visuals";

// Lazy viewers — code-split so a consumer who never previews a PDF/code/markdown
// file never ships pdf.js / CodeMirror / shiki / marked. Imported from each
// procomp's `.tsx` entry (the F-01-safe value-import path).
const LazyPdf = lazy(() =>
  import("../../pdf-viewer/pdf-viewer").then((m) => ({ default: m.PdfViewer })),
);
const LazyVideo = lazy(() =>
  import("../../video-player-01/video-player-01").then((m) => ({ default: m.default })),
);
const LazyCode = lazy(() =>
  import("../../../code/code-block/code-block").then((m) => ({ default: m.CodeBlock })),
);
const LazyMarkdown = lazy(() =>
  import("../../../forms/markdown-editor/markdown-editor").then((m) => ({
    default: m.MarkdownEditor,
  })),
);

const NOOP = () => {};

/**
 * Catches a viewer that throws (network failure, corrupt file, pdf.js worker
 * error) so one bad file degrades to a graceful fallback instead of taking
 * down the whole library. Resets when the previewed node changes.
 */
class PreviewErrorBoundary extends Component<
  { resetKey: string; fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export interface FilePreviewProps {
  node: MediaNode;
  /** "pane" = constrained side panel; "full" = fills its container (lightbox). */
  variant?: "pane" | "full";
  resolveTextContent?: (node: MediaNode) => Promise<string>;
  /** Override the pdf.js worker URL (forwarded to the composed pdf-viewer). */
  pdfWorkerSrc?: string;
  labels?: Partial<MediaLibrary01Labels>;
  onDownload?: (node: MediaNode) => void;
  className?: string;
}

function PreviewFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function PreviewMessage({
  kind,
  message,
  node,
  onDownload,
  downloadLabel,
  tone = "muted",
}: {
  kind: MediaPreviewKind;
  message: string;
  node: MediaNode;
  onDownload?: (node: MediaNode) => void;
  downloadLabel: string;
  tone?: "muted" | "error";
}) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-3 p-6 text-center">
      <span
        className={cn(
          "grid size-12 place-items-center rounded-full",
          tone === "error" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
        )}
      >
        <PreviewKindIcon kind={kind} className="size-6" />
      </span>
      <p className={cn("text-sm", tone === "error" ? "text-destructive" : "text-muted-foreground")}>
        {message}
      </p>
      {onDownload && node.url ? (
        <Button variant="outline" size="sm" onClick={() => onDownload(node)}>
          <Download className="size-4" aria-hidden="true" />
          {downloadLabel}
        </Button>
      ) : null}
    </div>
  );
}

function TextPreview({
  node,
  kind,
  resolveTextContent,
  labels,
}: {
  node: MediaNode;
  kind: MediaPreviewKind;
  resolveTextContent?: (node: MediaNode) => Promise<string>;
  labels: Required<MediaLibrary01Labels>;
}) {
  const { text, loading, error } = useTextContent(node, true, resolveTextContent);

  if (loading) return <PreviewFallback label={labels.previewLoading} />;
  if (error != null || text == null) {
    return (
      <PreviewMessage
        kind={kind}
        node={node}
        message={labels.previewError}
        downloadLabel={labels.download}
        tone="error"
      />
    );
  }

  if (kind === "markdown") {
    return (
      <Suspense fallback={<PreviewFallback label={labels.previewLoading} />}>
        <div className="h-full overflow-auto p-4">
          <LazyMarkdown
            value={text}
            onChange={NOOP}
            readOnly
            view="preview"
            toolbar={false}
            showPreviewToggle={false}
          />
        </div>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PreviewFallback label={labels.previewLoading} />}>
      <div className="h-full overflow-auto">
        <LazyCode value={text} filename={node.name} mode="view" />
      </div>
    </Suspense>
  );
}

/**
 * PDF preview that turns react-pdf's async `onError` (failed document / worker
 * fetch) into the graceful fallback — an error boundary can't catch the async
 * failure, so we surface it explicitly. Reset by keying on `node.id`.
 */
function PdfPreview({
  node,
  labels,
  workerSrc,
  onDownload,
}: {
  node: MediaNode;
  labels: Required<MediaLibrary01Labels>;
  workerSrc?: string;
  onDownload?: (node: MediaNode) => void;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <PreviewMessage
          kind="pdf"
          node={node}
          message={labels.previewError}
          downloadLabel={labels.download}
          onDownload={onDownload}
          tone="error"
        />
      </div>
    );
  }
  return (
    <Suspense fallback={<PreviewFallback label={labels.previewLoading} />}>
      <LazyPdf source={node.url} workerSrc={workerSrc} onError={() => setFailed(true)} />
    </Suspense>
  );
}

/** Tier C — the multi-type preview dispatcher. Usable standalone (no context). */
export function FilePreview({
  node,
  variant = "full",
  resolveTextContent,
  pdfWorkerSrc,
  labels: labelOverrides,
  onDownload,
  className,
}: FilePreviewProps) {
  const labels = { ...DEFAULT_MEDIA_LIBRARY_LABELS, ...labelOverrides };
  const kind = resolvePreviewKind(node);

  const wrap = (children: React.ReactNode) => (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden bg-muted/30",
        className,
      )}
    >
      {children}
    </div>
  );

  if (!node.url && !isTextKind(kind)) {
    return wrap(
      <PreviewMessage
        kind={kind}
        node={node}
        message={labels.noPreview}
        downloadLabel={labels.download}
        onDownload={onDownload}
      />,
    );
  }

  let content: ReactNode;
  switch (kind) {
    case "image":
      content = wrap(
        <img
          src={node.url}
          alt={node.name}
          className="max-h-full max-w-full object-contain"
        />,
      );
      break;
    case "video":
      content = wrap(
        <Suspense fallback={<PreviewFallback label={labels.previewLoading} />}>
          <div className={cn("w-full", variant === "full" ? "max-w-4xl" : "")}>
            <LazyVideo src={node.url!} poster={node.thumbnailUrl} controls />
          </div>
        </Suspense>,
      );
      break;
    case "pdf":
      content = (
        <div className={cn("h-full w-full overflow-hidden", className)}>
          <PdfPreview
            key={node.id}
            node={node}
            labels={labels}
            workerSrc={pdfWorkerSrc}
            onDownload={onDownload}
          />
        </div>
      );
      break;
    case "code":
    case "json":
    case "text":
    case "markdown":
      content = (
        <div className={cn("h-full w-full overflow-hidden bg-card", className)}>
          <TextPreview
            node={node}
            kind={kind}
            resolveTextContent={resolveTextContent}
            labels={labels}
          />
        </div>
      );
      break;
    default:
      return wrap(
        <PreviewMessage
          kind={kind}
          node={node}
          message={labels.noPreview}
          downloadLabel={labels.download}
          onDownload={onDownload}
        />,
      );
  }

  // A viewer that throws (network / worker / corrupt file) degrades gracefully
  // instead of crashing the library; resets when the previewed node changes.
  return (
    <PreviewErrorBoundary
      resetKey={node.id}
      fallback={wrap(
        <PreviewMessage
          kind={kind}
          node={node}
          message={labels.previewError}
          downloadLabel={labels.download}
          onDownload={onDownload}
          tone="error"
        />,
      )}
    >
      {content}
    </PreviewErrorBoundary>
  );
}
