import { ArrowRight, Calendar, Clock, User } from "lucide-react";
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
 * Featured variant — full-bleed hero card. Image fills the entire surface;
 * gradient overlay puts the title + meta + CTA in legible white type.
 *
 * v0.3.0 features per Q-PA matrix: full badge stack, publisher logo, kebab
 * (top-right), paywall + sensitive gates, engagement counts, structured
 * author byline, live-update sub-line. NO quoted article render (Q-PE).
 */
export function FeaturedPart(props: ResolvedPartProps) {
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

  const heroMedia = (
    <>
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
    </>
  );

  // Paywall scope: gate wraps just the hero media. Title + meta in the
  // content overlay stay visible above the gate via z-20 (per Q-PG).
  // Substitute paywall.preview for item.excerpt when paywalled.
  const isPaywalled =
    !disablePaywallGate && Boolean(item.paywall?.isPaywalled) && !paywallRevealed;

  const previewText =
    isPaywalled && item.paywall?.preview
      ? `${item.paywall.preview} ${labels.paywallPreviewSeparator}`
      : null;
  const displayExcerpt = previewText ?? item.excerpt;

  const sensitiveGatedHero =
    !disableSensitiveGate && item.sensitivity?.isSensitive ? (
      renderSensitiveGate ? (
        renderSensitiveGate(item, { onReveal: onRevealSensitiveInternal })
      ) : (
        <ContentSensitiveGate
          sensitivity={item.sensitivity}
          revealed={sensitiveRevealed}
          onReveal={onRevealSensitiveInternal}
          labels={labels}
          className="contents"
        >
          {heroMedia}
        </ContentSensitiveGate>
      )
    ) : (
      heroMedia
    );

  const mediaWithPaywall = isPaywalled
    ? renderPaywallGate
      ? renderPaywallGate(item, { onReveal: onRevealPaywallInternal })
      : (
          <NewsPaywallGate
            paywall={item.paywall}
            revealed={paywallRevealed}
            onReveal={onRevealPaywallInternal}
            linkComponent={LinkComponent}
            labels={labels}
            className="absolute inset-0"
          >
            {sensitiveGatedHero}
          </NewsPaywallGate>
        )
    : sensitiveGatedHero;

  const content = (
    <>
      {mediaWithPaywall}

      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-12">
        {/* Top-row: publisher logo (left) + kebab/visibility (right) */}
        {(item.publisher || showKebab || item.visibility) && (
          <div className="absolute left-8 right-8 top-8 flex items-start justify-between md:left-12 md:right-12 md:top-12">
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
          <span className="mb-4 inline-flex w-fit gap-1">
            {onCategoryClick ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onCategoryClick(item.category!);
                }}
                className="relative z-10 rounded-full bg-black/40 backdrop-blur-sm"
                aria-label={`Category: ${item.category}`}
              >
                <Badge className={cn("cursor-pointer", categoryStyle)}>
                  {item.category}
                </Badge>
              </button>
            ) : (
              <span className="rounded-full bg-black/40 backdrop-blur-sm">
                <Badge
                  className={cn(categoryStyle)}
                  aria-label={`Category: ${item.category}`}
                >
                  {item.category}
                </Badge>
              </span>
            )}
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

        {!disableExcerptRender && displayExcerpt
          ? renderExcerpt
            ? renderExcerpt(item)
            : (
                <p className="mb-6 max-w-3xl text-lg text-white/80 line-clamp-3 md:text-xl">
                  {displayExcerpt}
                </p>
              )
          : null}

        {/* Author byline (structured when authorEntity set) */}
        {!disableAuthorRender && item.authorEntity ? (
          renderAuthor ? (
            renderAuthor(item.authorEntity, { publisher: item.publisher })
          ) : (
            <div className="mb-4 text-white/80">
              <NewsAuthorByline
                author={item.authorEntity}
                onAuthorClick={onAuthorClick}
                labels={labels}
              />
            </div>
          )
        ) : null}

        <div className="flex flex-wrap items-center gap-6 text-white/70">
          {/* String author (when no structured authorEntity) */}
          {!item.authorEntity && item.author ? (
            <div className="flex items-center gap-2">
              <User aria-hidden="true" className="h-4 w-4" />
              <span>{item.author}</span>
            </div>
          ) : null}
          {formattedRelativeTime ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Calendar aria-hidden="true" className="h-4 w-4" />
                <span>{formattedRelativeTime}</span>
              </div>
              <LiveUpdateLine
                item={item}
                labels={labels}
                className="text-white/60"
              />
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

        {!disableEngagementCounts ? (
          renderEngagementCounts ? (
            <div className="relative z-10 mt-4">
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
              className="mt-4 text-white/80"
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
        "group relative h-125 overflow-hidden rounded-2xl md:h-150",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
        className,
      )}
    >
      {/* Editorial badge stack — overlaid at top */}
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

      {href ? (
        <LinkComponent
          href={href}
          aria-labelledby={titleId}
          aria-label={ariaLabel}
          onClick={onClick}
          className="absolute inset-0 z-0 rounded-2xl outline-none"
        />
      ) : null}

      {content}
    </article>
  );
}
