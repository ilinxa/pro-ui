import { ArrowRight } from "lucide-react";
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
 * List variant — full-width row, compact density. Author + chevron / actions / kebab right-aligned.
 *
 * v0.3 features per Q-PA matrix: full badge stack (inline), kebab (replaces chevron when items),
 * paywall + sensitive gates (over excerpt; list has no image), quoted article, engagement counts,
 * structured author byline. NO publisher logo / topic chips / tag chips per matrix.
 */
export function ListPart(props: ResolvedPartProps) {
  const {
    item,
    formattedRelativeTime,
    labels,
    LinkComponent,
    href,
    onClick,
    ariaLabel,
    titleId,
    titleClassName,
    className,
    actions,
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
    onCategoryClick,
    onQuotedClick,
  } = props;

  const isEditorMode = viewerMode === "editor";
  const showKebab = kebabItems.length > 0;

  // Paywall scope: list has no image, so the gate wraps the excerpt area
  // (Q-PG — gates excerpt + media; in list there's only excerpt).
  // Substitute paywall.preview for item.excerpt as the body text when
  // paywalled — title stays visible above, author/quoted/engagement below.
  const isPaywalled =
    !disablePaywallGate && Boolean(item.paywall?.isPaywalled) && !paywallRevealed;

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
        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
          {displayExcerpt}
        </p>
      )
    ) : null;

  const sensitiveGatedExcerpt =
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
          {excerptBlock}
        </ContentSensitiveGate>
      )
    ) : (
      excerptBlock
    );

  const gatedExcerpt = isPaywalled
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
            {sensitiveGatedExcerpt}
          </NewsPaywallGate>
        )
    : sensitiveGatedExcerpt;

  const innerContent = (
    <>
      {(item.category || formattedRelativeTime || !disableBadgesRender) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {!disableBadgesRender &&
            (renderBadges ? (
              renderBadges(item, { canModerate })
            ) : (
              <NewsBadges
                item={item}
                labels={labels}
                isEditorMode={isEditorMode}
              />
            ))}
          {item.category ? (
            onCategoryClick ? (
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
                <Badge variant="outline" className="cursor-pointer text-xs">
                  {item.category}
                </Badge>
              </button>
            ) : (
              <Badge
                variant="outline"
                className="text-xs"
                aria-label={`Category: ${item.category}`}
              >
                {item.category}
              </Badge>
            )
          ) : null}
          <VisibilityBadge visibility={item.visibility} labels={labels} />
          {formattedRelativeTime ? (
            <span className="text-xs text-muted-foreground">
              {formattedRelativeTime}
            </span>
          ) : null}
          <LiveUpdateLine item={item} labels={labels} />
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
      {gatedExcerpt}

      {!disableAuthorRender && item.authorEntity ? (
        renderAuthor ? (
          renderAuthor(item.authorEntity, { publisher: item.publisher })
        ) : (
          <NewsAuthorByline
            author={item.authorEntity}
            onAuthorClick={onAuthorClick}
            labels={labels}
            className="mt-1"
          />
        )
      ) : null}

      {!disableQuotedRender && item.quotedArticle ? (
        renderQuoted ? (
          renderQuoted(item, {
            onClick: onQuotedClick
              ? () => onQuotedClick(item.quotedArticle!)
              : undefined,
          })
        ) : (
          <div className="mt-2">
            <QuotedArticleCard
              quotedArticle={item.quotedArticle}
              onClick={onQuotedClick}
              labels={undefined}
            />
          </div>
        )
      ) : null}

      {!disableEngagementCounts ? (
        renderEngagementCounts ? (
          <div className="relative z-10 mt-2">
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
            className="mt-2"
          />
        )
      ) : null}
    </>
  );

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

      <div className="min-w-0 flex-1">{innerContent}</div>

      <div className="flex shrink-0 items-center gap-1 self-center">
        {actions ? (
          <div className="relative z-10">{actions}</div>
        ) : null}
        {showKebab ? (
          <NewsKebab items={kebabItems} />
        ) : !actions ? (
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 text-muted-foreground transition-all motion-safe:group-hover:translate-x-1 motion-safe:group-hover:text-primary rtl:rotate-180"
          />
        ) : null}
      </div>
    </article>
  );
}
