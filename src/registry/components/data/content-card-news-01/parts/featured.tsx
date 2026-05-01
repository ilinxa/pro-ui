import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";

/**
 * Featured variant — full-bleed hero card. Image fills the entire surface;
 * gradient overlay puts the title + meta + CTA in legible white type.
 *
 * Badge wears a `bg-black/40 backdrop-blur-sm` chip on this variant so the
 * category color stays single-source-of-truth in `categoryStyles` while
 * remaining readable on the dark gradient.
 */
export function FeaturedPart({
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
        "group relative h-125 overflow-hidden rounded-2xl md:h-150",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
        className,
      )}
    >
      <img
        src={item.image}
        alt={item.title}
        loading={loading}
        decoding="async"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-transform duration-700",
          "motion-safe:group-hover:scale-105",
          imageClassName,
        )}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent"
      />

      {href ? (
        <LinkComponent
          href={href}
          aria-labelledby={titleId}
          aria-label={ariaLabel}
          onClick={onClick}
          className="absolute inset-0 z-0 rounded-2xl outline-none"
        />
      ) : null}

      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        {item.category ? (
          <span className="mb-4 inline-block w-fit rounded-full bg-black/40 backdrop-blur-sm">
            <Badge
              className={cn(categoryStyle)}
              aria-label={`Category: ${item.category}`}
            >
              {item.category}
            </Badge>
          </span>
        ) : null}

        <h2
          id={titleId}
          className={cn(
            "mb-4 font-serif text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl",
            titleClassName,
          )}
        >
          {item.title}
        </h2>

        {item.excerpt ? (
          <p className="mb-6 max-w-3xl text-lg text-white/80 line-clamp-3 md:text-xl">
            {item.excerpt}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-6 text-white/70">
          {item.author ? (
            <div className="flex items-center gap-2">
              <User aria-hidden="true" className="h-4 w-4" />
              <span>{item.author}</span>
            </div>
          ) : null}
          {formattedRelativeTime ? (
            <div className="flex items-center gap-2">
              <Calendar aria-hidden="true" className="h-4 w-4" />
              <span>{formattedRelativeTime}</span>
            </div>
          ) : null}
          {item.readTime !== undefined ? (
            <div className="flex items-center gap-2">
              <Clock aria-hidden="true" className="h-4 w-4" />
              <span>
                {item.readTime} {labels.minutesRead}
              </span>
            </div>
          ) : null}
          {href ? (
            <span className="ml-auto inline-flex items-center gap-2 text-white transition-colors motion-safe:group-hover:text-primary">
              {labels.readMore}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1 rtl:rotate-180"
              />
            </span>
          ) : null}
        </div>

        {actions ? (
          <div className="relative z-10 mt-4">{actions}</div>
        ) : null}
      </div>
    </article>
  );
}
