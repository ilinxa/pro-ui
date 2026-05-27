"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { ExpandableText01 } from "@/registry/components/data/expandable-text-01";
import { MediaCarousel01 } from "@/registry/components/media/media-carousel-01";
import {
  EngagementBar01,
  EngagementHeartBurst,
} from "@/registry/components/data/engagement-bar-01";
import { CommentThread01 } from "@/registry/components/data/comment-thread-01";
import { PostHeader } from "./post-header";
import { TagChips } from "./tag-chips";
import { SensitiveGate } from "./sensitive-gate";
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
      contentClassName={cn("text-base leading-relaxed", bodyClassName)}
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
      <div className="flex flex-col gap-3 p-4">
        {headerNode}
        {contentNode}
        {post.tags && post.tags.length > 0 ? (
          <TagChips tags={post.tags} onTagClick={onTagClick} />
        ) : null}
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
      <div className={cn("px-4 pb-3 pt-3", engagementClassName)}>
        {engagementNode}
      </div>
      <div
        className={cn(
          "border-t border-border/60 px-4 py-4",
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
