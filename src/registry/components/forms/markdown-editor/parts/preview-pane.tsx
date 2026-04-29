import { useCallback, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface PreviewPaneProps {
  html: string;
  onWikilinkClick: ((target: string) => void) | undefined;
  minHeight: string | number | undefined;
  maxHeight: string | number | undefined;
  className?: string;
}

function toCss(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

// Click + keyboard delegation per §6.5 — interactive wikilinks (those with role+tabindex)
// activate on Enter/Space; spans without role are inert.
export function PreviewPane({
  html,
  onWikilinkClick,
  minHeight,
  maxHeight,
  className,
}: PreviewPaneProps) {
  const activate = useCallback(
    (target: HTMLElement) => {
      const span = target.closest("[data-wikilink-target]");
      if (!span) return;
      const wikilinkTarget = span.getAttribute("data-wikilink-target");
      if (wikilinkTarget && onWikilinkClick) {
        onWikilinkClick(wikilinkTarget);
      }
    },
    [onWikilinkClick],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const targetEl = event.target as HTMLElement;
      if (!targetEl.closest("[data-wikilink-target]")) return;
      event.preventDefault();
      activate(targetEl);
    },
    [activate],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const targetEl = event.target as HTMLElement;
      if (!targetEl.matches("[data-wikilink-target]")) return;
      event.preventDefault();
      activate(targetEl);
    },
    [activate],
  );

  const style: CSSProperties = {
    minHeight: toCss(minHeight) ?? "12rem",
    maxHeight: toCss(maxHeight),
  };

  return (
    <div
      role="article"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "markdown-editor__preview flex-1 overflow-y-auto bg-card px-4 py-3 text-sm leading-7",
        // Tailwind v4 typography styles for the rendered markdown — light + dark.
        "prose-headings:scroll-mt-4 prose-headings:font-semibold",
        "[&_h1]:mb-3 [&_h1]:mt-1 [&_h1]:text-2xl",
        "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl",
        "[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg",
        "[&_p]:my-2",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-0.5",
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[0.85em]",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80",
        "[&_strong]:font-semibold",
        "[&_em]:italic",
        "[&_hr]:my-4 [&_hr]:border-border",
        "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
        "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium",
        "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
        // Wikilink visual treatment — resolved + broken
        "[&_.wikilink]:rounded [&_.wikilink]:bg-primary/10 [&_.wikilink]:px-1 [&_.wikilink]:py-0.5 [&_.wikilink]:text-primary [&_.wikilink]:no-underline",
        "[&_.wikilink[role=link]]:cursor-pointer [&_.wikilink[role=link]:hover]:bg-primary/15 [&_.wikilink[role=link]:focus-visible]:outline [&_.wikilink[role=link]:focus-visible]:outline-2 [&_.wikilink[role=link]:focus-visible]:outline-offset-2 [&_.wikilink[role=link]:focus-visible]:outline-ring",
        "[&_.wikilink-broken]:bg-destructive/10 [&_.wikilink-broken]:text-destructive [&_.wikilink-broken]:underline [&_.wikilink-broken]:decoration-dashed [&_.wikilink-broken]:underline-offset-2",
        className,
      )}
      style={style}
      // We trust this html — produced by our per-instance Marked + escaped wikilink renderer.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
