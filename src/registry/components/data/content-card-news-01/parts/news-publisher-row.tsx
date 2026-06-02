import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";
import type { NewsPublisher } from "../types";

interface NewsPublisherRowProps {
  publisher: NewsPublisher | undefined;
  onPublisherClick?: (publisher: NewsPublisher) => void;
  /** When `true`, renders just the logo (no name). For tight variant slots. */
  logoOnly?: boolean;
  className?: string;
}

/**
 * Standalone publisher row — logo + name + optional click handler.
 *
 * Use case beyond the author byline: featured/large variants render this
 * inline above the title as the "source attribution" chip (parallels the
 * `featured`-variant category chip pattern).
 *
 * RSC-compatible — no DOM state.
 */
export function NewsPublisherRow({
  publisher,
  onPublisherClick,
  logoOnly = false,
  className,
}: NewsPublisherRowProps) {
  if (!publisher) return null;

  const handleClick = (event: MouseEvent) => {
    if (!onPublisherClick) return;
    event.preventDefault();
    onPublisherClick(publisher);
  };

  const content = (
    <>
      {publisher.logo && (
        <img
          src={publisher.logo}
          alt={logoOnly ? publisher.name : ""}
          aria-hidden={!logoOnly}
          className="size-5 rounded object-contain"
        />
      )}
      {!logoOnly && (
        <span className="text-xs font-medium">{publisher.name}</span>
      )}
    </>
  );

  const baseClass =
    "inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/80 px-2 py-1 backdrop-blur-sm";

  if (onPublisherClick) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          baseClass,
          "relative z-10 cursor-pointer transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return <span className={cn(baseClass, className)}>{content}</span>;
}
