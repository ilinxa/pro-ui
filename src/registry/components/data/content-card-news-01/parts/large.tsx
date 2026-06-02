import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";
import { NewsBadges } from "./news-badges";
import { VisibilityBadge } from "./visibility-badge";
import { LiveUpdateLine } from "./live-update-line";
import { NewsAuthorByline } from "./news-author-byline";
import { NewsPublisherRow } from "./news-publisher-row";
import { NewsPaywallGate } from "./news-paywall-gate";
import { ContentSensitiveGate } from "./content-sensitive-gate";
import { NewsEngagementCounts } from "./news-engagement-counts";
import { NewsKebab } from "./news-kebab";

/**
 * Large variant — 2-column horizontal card. Image left, content right.
 * v0.3 features per Q-PA matrix: full badge stack, publisher logo, kebab,
 * paywall + sensitive gates, engagement counts. NO quoted article (Q-PE).
 */
export function LargePart(props: ResolvedPartProps) {
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
    actions,
    loading,
    viewerMode,
    canModerate,
    paywallRevealed,
    sensitiveRevealed,
    onRevealPaywallInternal,
    onRevealSensitiveInternal,
    renderBadges,
    renderAuthor,
    renderExcerpt,
    renderPaywallGate,
    renderSensitiveGate,
    renderEngagementCounts,
    disableBadgesRender,
    disableAuthorRender,
    disableExcerptRender,
    disablePaywallGate,
    disableSensitiveGate,
    disableEngagementCounts,
    engagementHandlers,
    kebabItems,
    onAuthorClick,
    onPublisherClick,
    onCategoryClick,
  } = props;

  const isEditorMode = viewerMode === "editor";
  const showKebab = kebabItems.length > 0;

  const mediaBlock = (
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
      {!disableBadgesRender && (
        <div className="absolute left-2 top-2 z-20">
          {renderBadges ? (
            renderBadges(item, { canModerate })
          ) : (
            <NewsBadges
              item={item}
              labels={labels}
              isEditorMode={isEditorMode}
            />
          )}
        </div>
      )}
    </div>
  );

  const gatedMedia =
    !disableSensitiveGate && item.sensitivity?.isSensitive ? (
      renderSensitiveGate ? (
        renderSensitiveGate(item, { onReveal: onRevealSensitiveInternal })
      ) : (
        <ContentSensitiveGate
          sensitivity={item.sensitivity}
          revealed={sensitiveRevealed}
          onReveal={onRevealSensitiveInternal}
          labels={labels}
        >
          {mediaBlock}
        </ContentSensitiveGate>
      )
    ) : (
      mediaBlock
    );

  const content = (
    <>
      {gatedMedia}

      <div className="flex flex-col justify-center p-6 md:p-8">
        {/* Top: publisher + kebab/visibility */}
        {(item.publisher || showKebab || item.visibility) && (
          <div className="mb-3 flex items-start justify-between gap-2">
            <NewsPublisherRow
              publisher={item.publisher}
              onPublisherClick={onPublisherClick}
            />
            <div className="flex items-center gap-1">
              <VisibilityBadge visibility={item.visibility} labels={labels} />
              {showKebab && <NewsKebab items={kebabItems} />}
            </div>
          </div>
        )}

        {item.category ? (
          onCategoryClick ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCategoryClick(item.category!);
              }}
              className="relative z-10 mb-4 w-fit"
              aria-label={`Category: ${item.category}`}
            >
              <Badge className={cn(categoryStyle, "cursor-pointer")}>
                {item.category}
              </Badge>
            </button>
          ) : (
            <Badge
              className={cn(categoryStyle, "mb-4 w-fit")}
              aria-label={`Category: ${item.category}`}
            >
              {item.category}
            </Badge>
          )
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

        {!disableExcerptRender && item.excerpt
          ? renderExcerpt
            ? renderExcerpt(item)
            : (
                <p className="mb-4 text-muted-foreground line-clamp-3">
                  {item.excerpt}
                </p>
              )
          : null}

        {!disableAuthorRender && item.authorEntity ? (
          renderAuthor ? (
            renderAuthor(item.authorEntity, { publisher: item.publisher })
          ) : (
            <NewsAuthorByline
              author={item.authorEntity}
              onAuthorClick={onAuthorClick}
              labels={labels}
              className="mb-3"
            />
          )
        ) : null}

        {(item.author || formattedRelativeTime || item.readTime !== undefined) && (
          <div className="mt-auto flex items-center gap-4 text-sm text-muted-foreground">
            {!item.authorEntity && item.author ? (
              <span className="flex items-center gap-1.5">
                <User aria-hidden="true" className="h-4 w-4" />
                {item.author}
              </span>
            ) : null}
            {formattedRelativeTime ? (
              <div className="flex flex-col">
                <span>{formattedRelativeTime}</span>
                <LiveUpdateLine item={item} labels={labels} />
              </div>
            ) : null}
            {item.readTime !== undefined ? (
              <span>
                {item.readTime} {labels.minutesShort}
              </span>
            ) : null}
          </div>
        )}

        {!disableEngagementCounts ? (
          renderEngagementCounts ? (
            <div className="relative z-10 mt-3">
              {renderEngagementCounts(item, {
                handlers: {
                  onLike: engagementHandlers.onLike
                    ? (id, nextLiked) => engagementHandlers.onLike?.(nextLiked)
                    : undefined,
                  onComment: engagementHandlers.onComment
                    ? () => engagementHandlers.onComment?.()
                    : undefined,
                  onShare: engagementHandlers.onShare
                    ? () => engagementHandlers.onShare?.()
                    : undefined,
                  onBookmark: engagementHandlers.onBookmark
                    ? (id, nextBookmarked) =>
                        engagementHandlers.onBookmark?.(nextBookmarked)
                    : undefined,
                },
              })}
            </div>
          ) : (
            <NewsEngagementCounts
              item={item}
              handlers={engagementHandlers}
              labels={labels}
              className="mt-3"
            />
          )
        ) : null}

        {actions ? (
          <div className="relative z-10 mt-4">{actions}</div>
        ) : null}
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group relative grid gap-6 overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-xl md:grid-cols-2",
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
          className="absolute inset-0 z-0 rounded-2xl outline-none"
        />
      ) : null}

      {!disablePaywallGate && item.paywall?.isPaywalled ? (
        renderPaywallGate ? (
          renderPaywallGate(item, { onReveal: onRevealPaywallInternal })
        ) : (
          <NewsPaywallGate
            paywall={item.paywall}
            revealed={paywallRevealed}
            onReveal={onRevealPaywallInternal}
            linkComponent={LinkComponent}
            labels={labels}
            className="contents"
          >
            {content}
          </NewsPaywallGate>
        )
      ) : (
        content
      )}
    </article>
  );
}
