"use client";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Minus,
  Plus,
  Printer,
  RotateCw,
  Search,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { usePdfViewer } from "../hooks/use-pdf-viewer-context";
import type { ReactNode } from "react";

interface PdfContextMenuProps {
  enabled: boolean;
  onSearchSelection?: (text: string) => void;
  className?: string;
  children: ReactNode;
}

async function copyText(text: string): Promise<void> {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore — clipboard may be denied
  }
}

export function PdfContextMenu({
  enabled,
  onSearchSelection,
  className,
  children,
}: PdfContextMenuProps) {
  const { actions, labels, allowDownload, allowPrint, selectedText } =
    usePdfViewer();

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  const hasSelection = selectedText.trim().length > 0;
  const showSearch = hasSelection && typeof onSearchSelection === "function";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={className}>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-44">
        {hasSelection ? (
          <>
            <ContextMenuItem onSelect={() => copyText(selectedText)}>
              <Copy aria-hidden="true" />
              {labels.copyText}
            </ContextMenuItem>
            {showSearch ? (
              <ContextMenuItem
                onSelect={() => onSearchSelection?.(selectedText)}
              >
                <Search aria-hidden="true" />
                {labels.searchSelection}
              </ContextMenuItem>
            ) : null}
            <ContextMenuSeparator />
          </>
        ) : null}
        <ContextMenuItem onSelect={() => actions.goToPrevPage()}>
          <ChevronLeft aria-hidden="true" />
          {labels.contextPrevPage}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => actions.goToNextPage()}>
          <ChevronRight aria-hidden="true" />
          {labels.contextNextPage}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => actions.zoomIn()}>
          <Plus aria-hidden="true" />
          {labels.contextZoomIn}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => actions.zoomOut()}>
          <Minus aria-hidden="true" />
          {labels.contextZoomOut}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => actions.rotate()}>
          <RotateCw aria-hidden="true" />
          {labels.contextRotate}
        </ContextMenuItem>
        {allowDownload || allowPrint ? <ContextMenuSeparator /> : null}
        {allowDownload ? (
          <ContextMenuItem onSelect={() => actions.download()}>
            <Download aria-hidden="true" />
            {labels.contextDownload}
          </ContextMenuItem>
        ) : null}
        {allowPrint ? (
          <ContextMenuItem onSelect={() => actions.print()}>
            <Printer aria-hidden="true" />
            {labels.contextPrint}
          </ContextMenuItem>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Suppress unused warning for cn in case future tweaks need it
void cn;
