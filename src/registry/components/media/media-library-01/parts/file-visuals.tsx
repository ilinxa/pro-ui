"use client";

import {
  File,
  FileCode,
  FileJson,
  FileText,
  FileType2,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { MediaPreviewKind } from "../types";

const KIND_ICON: Record<MediaPreviewKind, ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Film,
  pdf: FileType2,
  code: FileCode,
  json: FileJson,
  text: FileText,
  markdown: FileText,
  unknown: File,
};

export function PreviewKindIcon({
  kind,
  className,
}: {
  kind: MediaPreviewKind;
  className?: string;
}) {
  const Icon = KIND_ICON[kind] ?? File;
  return <Icon className={className} />;
}

const KIND_BADGE: Record<MediaPreviewKind, string> = {
  image: "bg-violet-500/15 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  video: "bg-orange-500/15 text-orange-700 ring-orange-500/25 dark:text-orange-300",
  pdf: "bg-red-500/15 text-red-700 ring-red-500/25 dark:text-red-300",
  code: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  json: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  markdown: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  text: "bg-slate-500/15 text-slate-700 ring-slate-500/25 dark:text-slate-300",
  unknown: "bg-muted text-muted-foreground ring-border",
};

/** Small monospace extension pill ("JPG", "PDF", "MD"). */
export function FileKindBadge({
  kind,
  ext,
  className,
}: {
  kind: MediaPreviewKind;
  ext?: string;
  className?: string;
}) {
  const label = (ext || kind).replace(/^\./, "").toUpperCase().slice(0, 4);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ring-1 ring-inset",
        KIND_BADGE[kind] ?? KIND_BADGE.unknown,
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Subtle diagonal-stripe backdrop for visual files lacking a thumbnail. */
export const STRIPE_STYLE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(-45deg, color-mix(in oklch, var(--muted-foreground) 8%, transparent) 0 10px, transparent 10px 20px)",
};
