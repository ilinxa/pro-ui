import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";

/**
 * Large variant — 2-column horizontal card. Image left, content right.
 * Used as the lead article in a magazine main column under a featured hero.
 */
export function LargePart({
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
  return (
    <article
      className={cn(
        "group relative grid gap-6 overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-xl md:grid-cols-2",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
        className,
      )}
    >
      <div className="relative h-64 overflow-hidden md:h-full md:min-h-75">
        <img
          src={item.image}
          alt={item.title}
          loading={loading}
          decoding="async"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-500",
            "motion-safe:group-hover:scale-105",
            imageClassName,
          )}
        />
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

      <div className="flex flex-col justify-center p-6 md:p-8">
        {item.category ? (
          <Badge
            className={cn(categoryStyle, "mb-4 w-fit")}
            aria-label={`Category: ${item.category}`}
          >
            {item.category}
          </Badge>
        ) : null}

        <h3
          id={titleId}
          className={cn(
            "mb-3 font-serif text-2xl font-bold transition-colors line-clamp-2 motion-safe:group-hover:text-primary md:text-3xl",
            titleClassName,
          )}
        >
          {item.title}
        </h3>

        {item.excerpt ? (
          <p className="mb-4 text-muted-foreground line-clamp-3">
            {item.excerpt}
          </p>
        ) : null}

        {(item.author || formattedRelativeTime || item.readTime !== undefined) && (
          <div className="mt-auto flex items-center gap-4 text-sm text-muted-foreground">
            {item.author ? (
              <span className="flex items-center gap-1.5">
                <User aria-hidden="true" className="h-4 w-4" />
                {item.author}
              </span>
            ) : null}
            {formattedRelativeTime ? <span>{formattedRelativeTime}</span> : null}
            {item.readTime !== undefined ? (
              <span>
                {item.readTime} {labels.minutesShort}
              </span>
            ) : null}
          </div>
        )}

        {actions ? (
          <div className="relative z-10 mt-4">{actions}</div>
        ) : null}
      </div>
    </article>
  );
}
