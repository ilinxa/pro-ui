"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: cross-procomp imports via relative + specific-file paths.
import { ExpandableText } from "../../expandable-text/expandable-text";
import { EngagementHeartBurst } from "../../engagement-bar/parts/engagement-heart-burst";
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
import type { VariantInnerProps } from "./variant-shared";

function FeedVariantInner(props: VariantInnerProps) {
  const {
    post,
    authorId,
    bodyMaxLines,
    bodyClassName,
    textLabels,
    labels,
    burstKey,
    heartBurstWired,
    cardLinkable,
    linkHref,
    LinkComponent,
    renderContent,
    noticeSlot,
    onTagClick,
    sensitiveRevealed,
    onSensitiveReveal,
    disableSensitiveGate,
    renderSensitiveGate,
    onLinkPreviewClick,
    disableLinkPreviewRender,
    renderLinkPreview,
    inlinePanelNode,
    engagementClassName,
    className,
    mediaClassName,
  } = props;

  const showSensitiveGate =
    !disableSensitiveGate && post.isSensitive === true && !sensitiveRevealed;
  const showLinkPreview =
    !disableLinkPreviewRender && post.linkPreview !== undefined;

  const overlayLink =
    cardLinkable && linkHref ? (
      <LinkComponent
        href={linkHref}
        aria-label={post.content.slice(0, 80)}
        className="absolute inset-0 z-0"
      />
    ) : null;

  const contentNode = renderContent ? (
    renderContent(post)
  ) : (
    <ExpandableText
      content={post.content}
      maxLines={bodyMaxLines}
      labels={textLabels}
      contentClassName={cn("text-[15px] sm:text-sm", bodyClassName)}
    />
  );

  const mediaNode = buildMediaNode(props);

  return (
    <article
      role="article"
      tabIndex={-1}
      aria-labelledby={authorId}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      {overlayLink}
      <div className="relative z-10 flex flex-col gap-3 p-3 sm:p-4">
        {buildHeaderNode(props, false)}
        {noticeSlot?.(post)}
        {contentNode}
        {post.tags && post.tags.length > 0 ? (
          <TagChips tags={post.tags} onTagClick={onTagClick} />
        ) : null}
        {buildPollNode(props)}
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
        {buildEngagementNode(props, false)}
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
FeedVariant.displayName = "PostCard.FeedVariant";
