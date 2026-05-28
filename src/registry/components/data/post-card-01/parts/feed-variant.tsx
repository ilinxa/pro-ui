"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: cross-procomp imports via relative + specific-file paths.
import { ExpandableText01 } from "../../expandable-text-01/expandable-text-01";
// Cross-category: absolute-with-suffix (relative would resolve to non-existent
// `src/media/...` in consumer's flat tree).
import { MediaCarousel01 } from "@/registry/components/media/media-carousel-01/media-carousel-01";
import { EngagementBar01 } from "../../engagement-bar-01/engagement-bar-01";
import { EngagementHeartBurst } from "../../engagement-bar-01/parts/engagement-heart-burst";
import { PostHeader } from "./post-header";
import { TagChips } from "./tag-chips";
import { SensitiveGate } from "./sensitive-gate";
import { LinkPreviewCard } from "./link-preview-card";
import { RepostOfCard } from "./repost-of-card";
import { PollWidget } from "./poll-widget";
import type { VariantInnerProps } from "./variant-shared";

function FeedVariantInner(props: VariantInnerProps) {
  const {
    post,
    currentUser,
    authorId,
    formattedTime,
    kebabOpen,
    onKebabOpenChange,
    kebabItems,
    engagementActions,
    engagementBarRef,
    engagementClassName,
    engagementLabels,
    engagementSubscribeNoop,
    bodyMaxLines,
    bodyClassName,
    headingAs,
    labels,
    burstKey,
    heartBurstWired,
    onMediaDoubleTap,
    cardLinkable,
    linkHref,
    LinkComponent,
    renderHeader,
    renderContent,
    renderMedia,
    renderEngagementBar,
    onLocationClick,
    onMentionClick,
    onTagClick,
    sensitiveRevealed,
    onSensitiveReveal,
    disableSensitiveGate,
    renderSensitiveGate,
    onLinkPreviewClick,
    disableLinkPreviewRender,
    renderLinkPreview,
    onRepostOfClick,
    disableRepostOfRender,
    renderRepostOf,
    getHref,
    linkComponent,
    cardLabels,
    onPollVote,
    pollOptimisticVote,
    isOwnerView,
    disablePollRender,
    renderPoll,
    formatRelativeTime,
    inlinePanelNode,
    className,
    headerClassName,
    mediaClassName,
  } = props;

  const showSensitiveGate =
    !disableSensitiveGate && post.isSensitive === true && !sensitiveRevealed;
  const showLinkPreview =
    !disableLinkPreviewRender && post.linkPreview !== undefined;
  const showRepostOf =
    !disableRepostOfRender && post.repostOf !== undefined;
  const showPoll = !disablePollRender && post.poll !== undefined;
  const pollHasVoted =
    pollOptimisticVote !== null || (post.poll?.hasVoted ?? false);
  const pollOptimisticVoteOptionId =
    pollOptimisticVote?.optionId ?? post.poll?.viewerVoteOptionId;
  const pollOptimisticIncrement = pollOptimisticVote !== null;

  const handleRepostClick = onRepostOfClick
    ? () => post.repostOf && onRepostOfClick(post.repostOf)
    : undefined;

  const overlayLink =
    cardLinkable && linkHref ? (
      <LinkComponent
        href={linkHref}
        aria-label={post.content.slice(0, 80)}
        className="absolute inset-0 z-0"
      />
    ) : null;

  const headerNode = renderHeader ? (
    renderHeader(post, { currentUser })
  ) : (
    <PostHeader
      post={post}
      kebabOpen={kebabOpen}
      onKebabOpenChange={onKebabOpenChange}
      kebabItems={kebabItems}
      headingAs={headingAs}
      formattedTime={formattedTime}
      authorId={authorId}
      labels={labels}
      onLocationClick={onLocationClick}
      onMentionClick={onMentionClick}
      className={headerClassName}
    />
  );

  const contentNode = renderContent ? (
    renderContent(post)
  ) : (
    <ExpandableText01
      content={post.content}
      maxLines={bodyMaxLines}
      contentClassName={cn("text-[15px] sm:text-sm", bodyClassName)}
    />
  );

  const mediaNode =
    post.media && post.media.length > 0
      ? renderMedia
        ? renderMedia(post.media, { onDoubleTap: onMediaDoubleTap })
        : (
            <MediaCarousel01
              items={post.media}
              variant="gallery"
              onDoubleTap={onMediaDoubleTap}
            />
          )
      : null;

  const engagementNode = renderEngagementBar ? (
    renderEngagementBar(post, { actions: engagementActions })
  ) : (
    <EngagementBar01
      ref={engagementBarRef}
      actions={engagementActions}
      onSubscribeDelta={engagementSubscribeNoop}
      labels={engagementLabels}
    />
  );

  return (
    <article
      role="article"
      aria-labelledby={authorId}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      {overlayLink}
      <div className="relative z-10 flex flex-col gap-3 p-3 sm:p-4">
        {headerNode}
        {contentNode}
        {post.tags && post.tags.length > 0 ? (
          <TagChips tags={post.tags} onTagClick={onTagClick} />
        ) : null}
        {showPoll && post.poll
          ? renderPoll
            ? renderPoll(post, { onVote: onPollVote, isOwnerView })
            : (
              <PollWidget
                poll={post.poll}
                hasVoted={pollHasVoted}
                isOwnerView={isOwnerView}
                optimisticVoteOptionId={pollOptimisticVoteOptionId}
                optimisticIncrement={pollOptimisticIncrement}
                onVote={onPollVote}
                labels={{
                  pollHeading: labels.pollHeading,
                  pollTotalVotesLabel: labels.pollTotalVotesLabel,
                  pollClosesAtLabel: labels.pollClosesAtLabel,
                  pollClosedLabel: labels.pollClosedLabel,
                }}
                formatRelativeTime={formatRelativeTime}
              />
            )
          : null}
        {showLinkPreview && post.linkPreview
          ? renderLinkPreview
            ? renderLinkPreview(post)
            : (
              <LinkPreviewCard
                preview={post.linkPreview}
                onClick={onLinkPreviewClick}
              />
            )
          : null}
        {showRepostOf && post.repostOf
          ? renderRepostOf
            ? renderRepostOf(post, { onClick: handleRepostClick })
            : (
              <RepostOfCard
                originalPost={post.repostOf}
                onClick={onRepostOfClick}
                getHref={getHref}
                linkComponent={linkComponent}
                labels={cardLabels}
              />
            )
          : null}
      </div>
      {mediaNode ? (
        <div className={cn("relative", mediaClassName)}>
          {mediaNode}
          {heartBurstWired ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <EngagementHeartBurst trigger={burstKey} />
            </div>
          ) : null}
          {showSensitiveGate
            ? renderSensitiveGate
              ? renderSensitiveGate(post, { onReveal: onSensitiveReveal })
              : (
                <SensitiveGate
                  heading={labels.sensitiveHeading}
                  reason={post.sensitiveReason}
                  revealLabel={labels.sensitiveRevealLabel}
                  onReveal={onSensitiveReveal}
                />
              )
            : null}
        </div>
      ) : null}
      <div className={cn("relative z-10 px-3 pb-3 pt-3 sm:px-4", engagementClassName)}>
        {engagementNode}
      </div>
      {inlinePanelNode ? (
        <div className="relative z-10 border-t border-border/60 px-3 py-3 sm:px-4">
          {inlinePanelNode}
        </div>
      ) : null}
    </article>
  );
}

export const FeedVariant = memo(FeedVariantInner);
FeedVariant.displayName = "PostCard01.FeedVariant";
