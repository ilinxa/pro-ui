import { BadgeCheck } from "lucide-react";
import type { ElementType, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import type {
  ContentCardNewsLabels,
  NewsArticleAuthor,
  NewsPublisher,
} from "../types";

interface NewsAuthorBylineProps {
  /**
   * Structured author OR plain string (v0.2 soft-compat). When both an
   * `authorEntity` and `author` string are on the item, the root component
   * passes the structured one and this part renders it; otherwise the string
   * fallback path is taken.
   */
  author: NewsArticleAuthor | string | undefined;
  /** Publisher to render in a small sub-line below the author. */
  publisher?: NewsPublisher | undefined;
  /** Optional click handler — wraps the byline in a button when set. */
  onAuthorClick?: (author: NewsArticleAuthor) => void;
  /** Optional publisher click handler. */
  onPublisherClick?: (publisher: NewsPublisher) => void;
  /** Optional polymorphic element for author link (when an id-bearing author is clickable). */
  authorComponent?: ElementType;
  labels: Required<ContentCardNewsLabels>;
  className?: string;
}

/**
 * Author byline cluster.
 *
 * - Structured author: avatar (when set) + name + optional role + verified tick
 * - String fallback: just the name (no avatar, no role)
 * - Publisher (optional): rendered on a second line below the author
 *
 * RSC-compatible — no DOM state. Click handlers fire on the rendered button
 * elements which are hydrated by the consumer's React runtime.
 */
export function NewsAuthorByline({
  author,
  publisher,
  onAuthorClick,
  onPublisherClick,
  authorComponent: AuthorComponent = "button",
  labels,
  className,
}: NewsAuthorBylineProps) {
  if (!author && !publisher) return null;

  const structured = isStructuredAuthor(author) ? author : undefined;
  const nameText = structured?.name ?? (typeof author === "string" ? author : undefined);

  const handleAuthorClick = (event: MouseEvent) => {
    if (!structured || !onAuthorClick) return;
    event.preventDefault();
    onAuthorClick(structured);
  };

  const handlePublisherClick = (event: MouseEvent) => {
    if (!publisher || !onPublisherClick) return;
    event.preventDefault();
    onPublisherClick(publisher);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {nameText && (
        <div className="flex items-center gap-1.5">
          {structured?.avatar && (
            <img
              src={structured.avatar}
              alt=""
              aria-hidden
              className="size-5 rounded-full object-cover"
            />
          )}
          {structured && onAuthorClick ? (
            <AuthorComponent
              type={AuthorComponent === "button" ? "button" : undefined}
              onClick={handleAuthorClick}
              className="relative z-10 -mx-1 cursor-pointer rounded-sm px-1 font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {nameText}
            </AuthorComponent>
          ) : (
            <span className="font-medium text-foreground">{nameText}</span>
          )}
          {structured?.isVerified && (
            <BadgeCheck
              className="size-3.5 text-primary"
              aria-label={labels.verifiedAuthorLabel}
            />
          )}
          {structured?.role && (
            <span className="text-muted-foreground/80">· {structured.role}</span>
          )}
        </div>
      )}
      {publisher && (
        <div className="flex items-center gap-1.5">
          {publisher.logo && (
            <img
              src={publisher.logo}
              alt=""
              aria-hidden
              className="size-4 rounded object-contain"
            />
          )}
          {onPublisherClick ? (
            <button
              type="button"
              onClick={handlePublisherClick}
              className="relative z-10 -mx-1 cursor-pointer rounded-sm px-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {publisher.name}
            </button>
          ) : (
            <span>{publisher.name}</span>
          )}
        </div>
      )}
    </div>
  );
}

function isStructuredAuthor(
  value: NewsArticleAuthor | string | undefined,
): value is NewsArticleAuthor {
  return typeof value === "object" && value !== null && "id" in value && "name" in value;
}
