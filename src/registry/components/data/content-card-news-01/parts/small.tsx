import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";
import { NewsBadges } from "./news-badges";
import { ContentSensitiveGate } from "./content-sensitive-gate";

/**
 * Small variant — horizontal thumb tile, compact sidebar density.
 *
 * Per Q-PA matrix: ONLY highest-priority badge (via `highestPriorityOnly`)
 * + sensitive gate (graphic content must always warn). NO kebab, NO author,
 * NO excerpt, NO engagement counts, NO paywall (no space + low engagement
 * value at this density), NO publisher logo, NO quoted article. Just
 * category chip + title + date + a single highest-priority badge.
 */
export function SmallPart(props: ResolvedPartProps) {
  const {
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
    loading,
    viewerMode,
    canModerate,
    sensitiveRevealed,
    onRevealSensitiveInternal,
    renderBadges,
    renderSensitiveGate,
    disableBadgesRender,
    disableSensitiveGate,
    onCategoryClick,
  } = props;

  const isEditorMode = viewerMode === "editor";

  const thumbImg = (
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
  );

  const gatedThumb =
    !disableSensitiveGate && item.sensitivity?.isSensitive ? (
      renderSensitiveGate ? (
        renderSensitiveGate(item, { onReveal: onRevealSensitiveInternal })
      ) : (
        <ContentSensitiveGate
          sensitivity={item.sensitivity}
          revealed={sensitiveRevealed}
          onReveal={onRevealSensitiveInternal}
          labels={labels}
          compact
          className="shrink-0 overflow-hidden rounded-lg"
        >
          {thumbImg}
        </ContentSensitiveGate>
      )
    ) : (
      thumbImg
    );

  return (
    <article
      className={cn(
        "group relative flex gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:shadow-md",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
        className,
      )}
    >
      {gatedThumb}

      {href ? (
        <LinkComponent
          href={href}
          aria-labelledby={titleId}
          aria-label={ariaLabel}
          onClick={onClick}
          className="absolute inset-0 z-0 rounded-xl outline-none"
        />
      ) : null}

      {/* Single highest-priority badge — top-right corner */}
      {!disableBadgesRender && (
        <div className="absolute right-2 top-2 z-20">
          {renderBadges ? (
            renderBadges(item, { canModerate })
          ) : (
            <NewsBadges
              item={item}
              labels={labels}
              isEditorMode={isEditorMode}
              highestPriorityOnly
            />
          )}
        </div>
      )}

      <div className="flex min-w-0 flex-col justify-center">
        {item.category ? (
          onCategoryClick ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCategoryClick(item.category!);
              }}
              className="relative z-10 mb-2 w-fit"
              aria-label={`Category: ${item.category}`}
            >
              <Badge className={cn(categoryStyle, "cursor-pointer text-xs")}>
                {item.category}
              </Badge>
            </button>
          ) : (
            <Badge
              className={cn(categoryStyle, "mb-2 w-fit text-xs")}
              aria-label={`Category: ${item.category}`}
            >
              {item.category}
            </Badge>
          )
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
