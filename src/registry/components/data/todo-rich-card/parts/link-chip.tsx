"use client";

import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodoLink } from "../types";

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function LinkChip({
  link,
  className,
}: {
  link: TodoLink;
  className?: string;
}) {
  const label = link.label ?? safeHostname(link.url);
  let validUrl = true;
  try {
    new URL(link.url);
  } catch {
    validUrl = false;
  }

  if (!validUrl) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded border border-dashed border-destructive/40 px-1.5 py-0.5 text-xs text-muted-foreground",
          className,
        )}
        title="Invalid URL"
      >
        <LinkIcon className="size-3" />
        {label}
      </span>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded border border-border bg-card px-1.5 py-0.5 text-xs hover:bg-muted",
        className,
      )}
    >
      {link.icon ? (
        <img src={link.icon} alt="" className="size-3" />
      ) : (
        <LinkIcon className="size-3" />
      )}
      <span className="font-medium">{label}</span>
      <ExternalLink className="size-3 text-muted-foreground" />
    </a>
  );
}
