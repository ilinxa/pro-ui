import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";
import { NewsBadges } from "./news-badges";
import { VisibilityBadge } from "./visibility-badge";
import { LiveUpdateLine } from "./live-update-line";
import { NewsAuthorByline } from "./news-author-byline";
import { NewsPaywallGate } from "./news-paywall-gate";
import { ContentSensitiveGate } from "./content-sensitive-gate";
import { QuotedArticleCard } from "./quoted-article-card";
import { NewsEngagementCounts } from "./news-engagement-counts";
import { NewsKebab } from "./news-kebab";

/**
 * Medium variant — vertical card with image-on-top, view-chip overlay,
 * and a kicker footer (author left, date right, separator above).
 *
 * v0.3.0 integration per Q-PA matrix:
 *   - Badge stack (top-left, full set)
 *   - Visibility badge (top-right beside kebab)
 *   - Kebab dropdown (top-right corner, when kebabItems non-empty)
 *   - Sensitive gate over media
 *   - Paywall gate over excerpt + media
 *   - Quoted article (between excerpt and footer; medium + list only per Q-PE)
 *   - Engagement counts (bottom row)
 *   - Live-update sub-line (below date)
 *   - Structured author byline (via authorEntity)
 */
export function MediumPart(props: ResolvedPartProps) {
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
    renderQuoted,
    renderEngagementCounts,
    disableBadgesRender,
    disableAuthorRender,
    disableExcerptRender,
    disablePaywallGate,
    disableSensitiveGate,
    disableQuotedRender,
    disableEngagementCounts,
    engagementHandlers,
    kebabItems,
    onAuthorClick,
    onPublisherClick,
    onCategoryClick,
    onQuotedClick,
  } = props;

  const isEditorMode = viewerMode === "editor";
  const showKebab = kebabItems.length > 0;
  const showBadges =
    !disableBadgesRender &&
    (renderBadges ||
      item.isBreaking ||
      item.isLive ||
      item.isExclusive ||
      item.isFeatured ||
      item.isPinned ||
      item.isSponsored ||
      (isEditorMode && item.status && item.status !== "published"));

  const categoryChip =
    item.category && onCategoryClick ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onCategoryClick(item.category!);
        }}
        className="relative z-10"
        aria-label={`Category: ${item.category}`}
      >
        <Badge className={cn("cursor-pointer", categoryStyle)}>
          {item.category}
        </Badge>
      </button>
    ) : item.category ? (
      <Badge
        className={cn(categoryStyle)}
        aria-label={`Category: ${item.category}`}
      >
        {item.category}
      </Badge>
    ) : null;

  // Media block (gets wrapped by sensitive gate when sensitive)
  const mediaBlock = (
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
      {categoryChip && <div className="absolute left-4 top-4">{categoryChip}</div>}
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

  // Paywall scope: gate wraps just the media block, substitutes
  // paywall.preview for item.excerpt in the body (Q-PG lock — title +
  // author + footer all stay visible above/below the gate).
  const isPaywalled =
    !disablePaywallGate && Boolean(item.paywall?.isPaywalled) && !paywallRevealed;

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
          >
            {gatedMedia}
          </NewsPaywallGate>
        )
    : gatedMedia;

  // Excerpt block — paywall.preview substitutes for item.excerpt when paywalled
  const previewText =
    isPaywalled && item.paywall?.preview
      ? `${item.paywall.preview} ${labels.paywallPreviewSeparator}`
      : null;
  const displayExcerpt = previewText ?? item.excerpt;

  const excerptBlock =
    !disableExcerptRender && displayExcerpt ? (
      renderExcerpt ? (
        renderExcerpt(item)
      ) : (
        <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-3">
          {displayExcerpt}
        </p>
      )
    ) : null;

  const articleContent = (
    <>
      {mediaWithPaywall}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3
            id={titleId}
            className={cn(
              "font-serif text-xl font-bold transition-colors line-clamp-2 motion-safe:group-hover:text-primary",
              titleClassName,
            )}
          >
            {item.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <VisibilityBadge visibility={item.visibility} labels={labels} />
            {showKebab && <NewsKebab items={kebabItems} />}
          </div>
        </div>

        {excerptBlock}

        {!disableQuotedRender && item.quotedArticle ? (
          renderQuoted ? (
            renderQuoted(item, {
              onClick: onQuotedClick
                ? () => onQuotedClick(item.quotedArticle!)
                : undefined,
            })
          ) : (
            <div className="mb-4">
              <QuotedArticleCard
                quotedArticle={item.quotedArticle}
                onClick={onQuotedClick}
                labels={undefined}
              />
            </div>
          )
        ) : null}

        {actions ? <div className="relative z-10 mb-4">{actions}</div> : null}

        {!disableAuthorRender && (item.authorEntity || item.author || item.publisher) ? (
          renderAuthor ? (
            renderAuthor(item.authorEntity ?? item.author, {
              publisher: item.publisher,
            })
          ) : (
            <NewsAuthorByline
              author={item.authorEntity ?? item.author}
              publisher={item.publisher}
              onAuthorClick={onAuthorClick}
              onPublisherClick={onPublisherClick}
              labels={labels}
              className="mb-3"
            />
          )
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <div className="flex flex-col gap-1">
            {formattedRelativeTime ? <span>{formattedRelativeTime}</span> : null}
            <LiveUpdateLine item={item} labels={labels} />
          </div>
          {!disableEngagementCounts ? (
            renderEngagementCounts ? (
              renderEngagementCounts(item, {
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
              })
            ) : (
              <NewsEngagementCounts
                item={item}
                handlers={engagementHandlers}
                labels={labels}
              />
            )
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-xl",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
        className,
      )}
    >
      {/* Editorial badge stack — top-right overlay (top-left belongs to the
          category chip rendered inside mediaBlock). 75% max + wrap-end so up
          to 3 tightened badges fit on a single line at the medium card
          width (~280px); beyond that they wrap inward toward the title. */}
      {showBadges && (
        <div className="absolute right-2 top-2 z-20 flex max-w-[75%] flex-wrap justify-end gap-1">
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

      {articleContent}
    </article>
  );
}
