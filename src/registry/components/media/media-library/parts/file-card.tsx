"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { resolvePreviewKind } from "../lib/preview-kind";
import { extOf } from "../lib/preview-kind";
import type { MediaNode, MediaPreviewKind } from "../types";
import { FileKindBadge, PreviewKindIcon, STRIPE_STYLE } from "./file-visuals";

export interface FileCardProps extends HTMLAttributes<HTMLDivElement> {
  node: MediaNode;
  /** Pre-resolved kind; computed from the node when omitted. */
  kind?: MediaPreviewKind;
  selected?: boolean;
  renaming?: ReactNode;
  dragHandle?: ReactNode;
  /** Extra overlay (e.g. an upload progress ring). */
  overlay?: ReactNode;
}

/** Tier C — presentational file thumbnail tile. */
export const FileCard = forwardRef<HTMLDivElement, FileCardProps>(function FileCard(
  { node, kind: kindProp, selected, renaming, dragHandle, overlay, className, ...rest },
  ref,
) {
  const kind = kindProp ?? resolvePreviewKind(node);
  const ext = extOf(node);
  const thumb = node.thumbnailUrl ?? (kind === "image" ? node.url : undefined);
  const dims =
    node.width && node.height ? `${node.width} × ${node.height}` : null;

  return (
    <div
      ref={ref}
      className={cn(
        "group/file relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-[border-color,box-shadow] outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-foreground/20 hover:shadow-md",
        className,
      )}
      {...rest}
    >
      <div
        className="relative aspect-4/3 w-full overflow-hidden bg-muted"
        style={!thumb ? STRIPE_STYLE : undefined}
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            draggable={false}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground/70">
            <PreviewKindIcon kind={kind} className="size-9" />
          </span>
        )}
        <span className="absolute left-2 top-2">
          <FileKindBadge kind={kind} ext={ext} />
        </span>
        {dims ? (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-background/85 px-2 py-0.5 font-mono text-[11px] text-foreground shadow-sm ring-1 ring-border backdrop-blur-sm">
            {dims}
          </span>
        ) : null}
        {overlay}
      </div>
      <div className="flex min-w-0 items-center gap-2 px-2.5 py-2">
        <FileKindBadge kind={kind} ext={ext} />
        {renaming ?? (
          <p className="truncate text-sm font-medium text-foreground">{node.name}</p>
        )}
      </div>
      {dragHandle}
    </div>
  );
});
