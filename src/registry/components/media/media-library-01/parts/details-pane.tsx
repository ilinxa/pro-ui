"use client";

import { useMemo } from "react";
import { Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes, formatRelativeTime } from "../lib/format";
import { useMediaLibrary } from "../hooks/use-media-library";
import { FilePreview } from "./file-preview";

/** Tier B — right-side details pane showing the single selected file. */
export function MediaLibraryDetailsPane({ className }: { className?: string }) {
  const ctx = useMediaLibrary();
  const { selectedIds, files, labels, resolveTextContent, can } = ctx;

  const node = useMemo(() => {
    if (selectedIds.size !== 1) return null;
    const [id] = Array.from(selectedIds);
    return files.find((f) => f.id === id) ?? null;
  }, [selectedIds, files]);

  if (!node) {
    return (
      <aside
        className={cn(
          "hidden w-72 shrink-0 flex-col rounded-xl border border-border bg-card p-4 text-center lg:flex",
          className,
        )}
      >
        <p className="m-auto text-sm text-muted-foreground">{labels.preview}</p>
      </aside>
    );
  }

  const meta: Array<[string, string]> = [];
  if (node.width && node.height) meta.push(["Dimensions", `${node.width} × ${node.height}`]);
  if (typeof node.size === "number") meta.push(["Size", formatBytes(node.size)]);
  if (node.modifiedAt) meta.push(["Modified", formatRelativeTime(node.modifiedAt)]);
  if (node.owner) meta.push(["Owner", node.owner]);

  return (
    <aside
      className={cn(
        "hidden w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-3 lg:flex",
        className,
      )}
    >
      <div className="h-44 overflow-hidden rounded-lg border border-border">
        <FilePreview
          node={node}
          variant="pane"
          resolveTextContent={resolveTextContent}
          pdfWorkerSrc={ctx.pdfWorkerSrc}
          labels={labels}
          onDownload={can.download ? (n) => ctx.download([n.id]) : undefined}
        />
      </div>
      <p className="truncate text-sm font-medium text-foreground" title={node.name}>
        {node.name}
      </p>
      <dl className="flex flex-col gap-1.5 text-xs">
        {meta.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="truncate font-mono text-foreground" title={v}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex gap-2">
        {ctx.canPreview ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => ctx.openPreview(node.id)}
          >
            <Maximize2 className="size-4" aria-hidden="true" />
            {labels.preview}
          </Button>
        ) : null}
        {can.download ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => ctx.download([node.id])}
          >
            <Download className="size-4" aria-hidden="true" />
            {labels.download}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
