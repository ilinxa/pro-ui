"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCodeBlock } from "../hooks/use-code-block-context";
import { CodeBlockCopyButton } from "./code-block-copy-button";
import { CodeBlockDownloadButton } from "./code-block-download-button";
import { CodeBlockExpandButton } from "./code-block-expand-button";
import { CodeBlockFilename } from "./code-block-filename";
import { CodeBlockLangPill } from "./code-block-lang-pill";
import { CodeBlockTrafficLights } from "./code-block-traffic-lights";
import { CodeBlockWrapButton } from "./code-block-wrap-button";

export interface CodeBlockHeaderProps {
  showLanguage?: boolean;
  showCopy?: boolean;
  showExpand?: boolean;
  showWrap?: boolean;
  showDownload?: boolean;
  showTrafficLights?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function CodeBlockHeader({
  showLanguage = true,
  showCopy = true,
  showExpand = false,
  showWrap = false,
  showDownload = false,
  showTrafficLights = false,
  actions,
  className,
}: CodeBlockHeaderProps) {
  const { filename, resolvedLang } = useCodeBlock();

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-border/60 bg-card/50 px-3 py-1.5",
        "min-h-9",
        className,
      )}
    >
      {showTrafficLights ? <CodeBlockTrafficLights className="mr-1" /> : null}
      <CodeBlockFilename filename={filename} />
      {filename && showLanguage && resolvedLang && resolvedLang !== "plaintext" ? (
        <span aria-hidden="true" className="text-muted-foreground/40">·</span>
      ) : null}
      {showLanguage ? <CodeBlockLangPill lang={resolvedLang} /> : null}
      <div className="flex-1" />
      {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      {showWrap ? <CodeBlockWrapButton /> : null}
      {showDownload ? <CodeBlockDownloadButton /> : null}
      {showExpand ? <CodeBlockExpandButton /> : null}
      {showCopy ? <CodeBlockCopyButton /> : null}
    </div>
  );
}
