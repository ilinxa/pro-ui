import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";

/**
 * Medium variant — vertical card with image-on-top, view-chip overlay,
 * and a kicker footer (author left, date right, separator above).
 * The default workhorse for magazine grid cells.
 */
export function MediumPart({
  item,
  formattedRelativeTime,
  categoryStyle,
  labels,
  LinkComponent,
  href,
  onClick,
  ariaLabel,
  titleId,
  titleClassName,
  imageClassName,
  className,
  actions,
  loading,
}: ResolvedPartProps) {
  const hasFooter = Boolean(item.author || formattedRelativeTime);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-xl",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
        className,
      )}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          loading={loading}
          decoding="async"
          className={cn(
            "h-full w-full object-cover transition-transform duration-500",
            "motion-safe:group-hover:scale-105",
            imageClassName,
          )}
        />
        {item.category ? (
          <div className="absolute left-4 top-4">
            <Badge
              className={cn(categoryStyle)}
              aria-label={`Category: ${item.category}`}
            >
              {item.category}
            </Badge>
          </div>
        ) : null}
        {item.views !== undefined ? (
          <div
            className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm"
            aria-label={`${item.views} ${labels.viewsLabel}`}
          >
            <Eye aria-hidden="true" className="h-3 w-3" />
            <span aria-hidden="true">{item.views}</span>
          </div>
        ) : null}
      </div>

      {href ? (
        <LinkComponent
          href={href}
          aria-labelledby={titleId}
          aria-label={ariaLabel}
          onClick={onClick}
          className="absolute inset-0 z-0 rounded-2xl outline-none"
        />
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <h3
          id={titleId}
          className={cn(
            "mb-2 font-serif text-xl font-bold transition-colors line-clamp-2 motion-safe:group-hover:text-primary",
            titleClassName,
          )}
        >
          {item.title}
        </h3>

        {item.excerpt ? (
          <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-3">
            {item.excerpt}
          </p>
        ) : null}

        {actions ? (
          <div className="relative z-10 mb-4">{actions}</div>
        ) : null}

        {hasFooter ? (
          <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
            {item.author ? <span>{item.author}</span> : <span aria-hidden="true" />}
            {formattedRelativeTime ? <span>{formattedRelativeTime}</span> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
