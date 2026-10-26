"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: cross-procomp imports via relative + specific-file paths.
import { ExpandableText } from "../../expandable-text/expandable-text";
import { EngagementHeartBurst } from "../../engagement-bar/parts/engagement-heart-burst";
import { CommentThread } from "../../comment-thread/comment-thread";
import { TagChips } from "./tag-chips";
import { SensitiveGate } from "./sensitive-gate";
import { LinkPreviewCard } from "./link-preview-card";
import {
  buildEngagementNode,
  buildHeaderNode,
  buildMediaNode,
  buildPollNode,
  buildRepostNode,
} from "./variant-nodes";
import type { DetailVariantInnerProps } from "./variant-shared";

function DetailVariantInner(props: DetailVariantInnerProps) {
  const {
    post,
    authorId,
    bodyMaxLines,
    bodyClassName,
    textLabels,
    labels,
    burstKey,
    heartBurstWired,
    renderContent,
    renderCommentSection,
    noticeSlot,
    onTagClick,
    sensitiveRevealed,
    onSensitiveReveal,
    disableSensitiveGate,
    renderSensitiveGate,
    onLinkPreviewClick,
    disableLinkPreviewRender,
    renderLinkPreview,
    commentThread,
    threadProps,
    commentHandlers,
    threadRef,
    commentSectionClassName,
    commentsHeading,
    engagementClassName,
    className,
    mediaClassName,
  } = props;

  const contentNode = renderContent ? (
    renderContent(post)
  ) : (
    <ExpandableText
      content={post.content}
      // bodyMaxLines may be 0 in detail (no clamp); ExpandableText handles 0 as no clamp
      maxLines={bodyMaxLines || 999}
      labels={textLabels}
      contentClassName={cn(
        "text-[15px] leading-relaxed sm:text-sm lg:text-base",
        bodyClassName,
      )}
    />
  );

  const mediaNode = buildMediaNode(props);

  const commentSectionNode = renderCommentSection ? (
    renderCommentSection(post, commentHandlers)
  ) : (
    <CommentThread ref={threadRef} comments={commentThread} {...threadProps} />
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
        {buildHeaderNode(props, false)}
        {noticeSlot?.(post)}
        {contentNode}
        {post.tags && post.tags.length > 0 ? (
          <TagChips tags={post.tags} onTagClick={onTagClick} />
        ) : null}
        {buildPollNode(props)}
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
        {buildRepostNode(props)}
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
        {buildEngagementNode(props, false)}
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
DetailVariant.displayName = "PostCard.DetailVariant";
