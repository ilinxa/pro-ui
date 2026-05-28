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
import { CommentThread01 } from "../../comment-thread-01/comment-thread-01";
import { PostHeader } from "./post-header";
import { TagChips } from "./tag-chips";
import { SensitiveGate } from "./sensitive-gate";
import { LinkPreviewCard } from "./link-preview-card";
import { RepostOfCard } from "./repost-of-card";
import { PollWidget } from "./poll-widget";
import type { DetailVariantInnerProps } from "./variant-shared";

function DetailVariantInner(props: DetailVariantInnerProps) {
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
    renderHeader,
    renderContent,
    renderMedia,
    renderEngagementBar,
    renderCommentSection,
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
    commentThread,
    commentPageSize,
    commentSubscribe,
    onSubscribeCommentDelta,
    onAddComment,
    onLikeComment,
    onDeleteComment,
    onReportComment,
    onLoadMoreComments,
    commentActions,
    commentLabels,
    threadRef,
    commentSectionClassName,
    commentsHeading,
    className,
    headerClassName,
    mediaClassName,
  } = props;

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
      // bodyMaxLines may be 0 in detail (no clamp); ExpandableText01 handles 0 as no clamp
      maxLines={bodyMaxLines || 999}
      contentClassName={cn(
        "text-[15px] leading-relaxed sm:text-sm lg:text-base",
        bodyClassName,
      )}
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

  const commentSectionNode = renderCommentSection ? (
    renderCommentSection(post, {
      onAddComment,
      onLikeComment,
      onDeleteComment,
      onReportComment,
      onLoadMoreComments,
    })
  ) : (
    <CommentThread01
      ref={threadRef}
      comments={commentThread}
      currentUser={currentUser}
      pageSize={commentPageSize}
      subscribe={commentSubscribe}
      onSubscribeDelta={onSubscribeCommentDelta}
      onAddComment={onAddComment}
      onLikeComment={onLikeComment}
      onDeleteComment={onDeleteComment}
      onReportComment={onReportComment}
      onLoadMore={onLoadMoreComments}
      commentActions={commentActions}
      labels={commentLabels}
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
      <div className="flex flex-col gap-3 p-3 sm:p-4 md:p-5 lg:p-6">
        {headerNode}
        {contentNode}
        {post.tags && post.tags.length > 0 ? (
          <TagChips tags={post.tags} onTagClick={onTagClick} />
        ) : null}
        {!disablePollRender && post.poll
          ? renderPoll
            ? renderPoll(post, { onVote: onPollVote, isOwnerView })
            : (
              <PollWidget
                poll={post.poll}
                hasVoted={
                  pollOptimisticVote !== null || (post.poll.hasVoted ?? false)
                }
                isOwnerView={isOwnerView}
                optimisticVoteOptionId={
                  pollOptimisticVote?.optionId ?? post.poll.viewerVoteOptionId
                }
                optimisticIncrement={pollOptimisticVote !== null}
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
        {!disableLinkPreviewRender && post.linkPreview
          ? renderLinkPreview
            ? renderLinkPreview(post)
            : (
              <LinkPreviewCard
                preview={post.linkPreview}
                onClick={onLinkPreviewClick}
              />
            )
          : null}
        {!disableRepostOfRender && post.repostOf
          ? renderRepostOf
            ? renderRepostOf(post, {
                onClick: onRepostOfClick
                  ? () => post.repostOf && onRepostOfClick(post.repostOf)
                  : undefined,
              })
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
          {!disableSensitiveGate && post.isSensitive && !sensitiveRevealed
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
      <div
        className={cn(
          "px-3 pb-3 pt-3 sm:px-4 md:px-5 lg:px-6",
          engagementClassName,
        )}
      >
        {engagementNode}
      </div>
      <div
        className={cn(
          "border-t border-border/60 px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 lg:px-6 lg:py-6",
          commentSectionClassName,
        )}
      >
        <h3 className="mb-3 text-sm font-semibold">{commentsHeading}</h3>
        {commentSectionNode}
      </div>
    </article>
  );
}

export const DetailVariant = memo(DetailVariantInner);
DetailVariant.displayName = "PostCard01.DetailVariant";
