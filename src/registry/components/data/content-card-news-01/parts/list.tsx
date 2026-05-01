import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";

/**
 * List variant — full-width row with badge + title + excerpt + chevron.
 * The compact "popular news" / sidebar-list density.
 *
 * When `actions` is provided, the chevron is replaced by the actions cluster
 * (consumer composes their own affordance).
 */
export function ListPart({
  item,
  formattedRelativeTime,
  LinkComponent,
  href,
  onClick,
  ariaLabel,
  titleId,
  titleClassName,
  className,
  actions,
}: ResolvedPartProps) {
  return (
    <article
      className={cn(
        "group relative flex gap-4 rounded-lg border-b border-border/50 px-2 py-4 transition-colors last:border-0 hover:bg-muted/30",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
        className,
      )}
    >
      {href ? (
        <LinkComponent
          href={href}
          aria-labelledby={titleId}
          aria-label={ariaLabel}
          onClick={onClick}
          className="absolute inset-0 z-0 rounded-lg outline-none"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        {(item.category || formattedRelativeTime) && (
          <div className="mb-2 flex items-center gap-3">
            {item.category ? (
              <Badge
                variant="outline"
                className="text-xs"
                aria-label={`Category: ${item.category}`}
              >
                {item.category}
              </Badge>
            ) : null}
            {formattedRelativeTime ? (
              <span className="text-xs text-muted-foreground">
                {formattedRelativeTime}
              </span>
            ) : null}
          </div>
        )}
        <h4
          id={titleId}
          className={cn(
            "font-semibold transition-colors line-clamp-1 motion-safe:group-hover:text-primary",
            titleClassName,
          )}
        >
          {item.title}
        </h4>
        {item.excerpt ? (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
            {item.excerpt}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="relative z-10 shrink-0 self-center">{actions}</div>
      ) : (
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 self-center text-muted-foreground transition-all motion-safe:group-hover:translate-x-1 motion-safe:group-hover:text-primary rtl:rotate-180"
        />
      )}
    </article>
  );
}
