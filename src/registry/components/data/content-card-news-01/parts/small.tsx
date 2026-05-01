import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";

/**
 * Small variant — horizontal thumb tile. Compact 24px-thumb on the left,
 * badge + title + relative-date on the right. Sidebar-density.
 *
 * No `actions` slot for `small` (intentional — too compact for nested buttons).
 */
export function SmallPart({
  item,
  formattedRelativeTime,
  categoryStyle,
  LinkComponent,
  href,
  onClick,
  ariaLabel,
  titleId,
  titleClassName,
  imageClassName,
  className,
  loading,
}: ResolvedPartProps) {
  return (
    <article
      className={cn(
        "group relative flex gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:shadow-md",
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
          "h-24 w-24 shrink-0 rounded-lg object-cover",
          imageClassName,
        )}
      />

      {href ? (
        <LinkComponent
          href={href}
          aria-labelledby={titleId}
          aria-label={ariaLabel}
          onClick={onClick}
          className="absolute inset-0 z-0 rounded-xl outline-none"
        />
      ) : null}

      <div className="flex min-w-0 flex-col justify-center">
        {item.category ? (
          <Badge
            className={cn(categoryStyle, "mb-2 w-fit text-xs")}
            aria-label={`Category: ${item.category}`}
          >
            {item.category}
          </Badge>
        ) : null}
        <h4
          id={titleId}
          className={cn(
            "text-sm font-semibold transition-colors line-clamp-2 motion-safe:group-hover:text-primary",
            titleClassName,
          )}
        >
          {item.title}
        </h4>
        {formattedRelativeTime ? (
          <span className="mt-1 text-xs text-muted-foreground">
            {formattedRelativeTime}
          </span>
        ) : null}
      </div>
    </article>
  );
}
