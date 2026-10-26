"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: cross-procomp imports via relative + specific-file paths.
import { ExpandableText } from "../../expandable-text/expandable-text";
import { TagChips } from "./tag-chips";
import { buildEngagementNode, buildHeaderNode } from "./variant-nodes";
import type { VariantInnerProps } from "./variant-shared";

function CompactVariantInner(props: VariantInnerProps) {
  const {
    post,
    authorId,
    engagementClassName,
    bodyMaxLines,
    bodyClassName,
    textLabels,
    cardLinkable,
    linkHref,
    LinkComponent,
    renderContent,
    renderMedia,
    noticeSlot,
    onTagClick,
    inlinePanelNode,
    className,
    mediaClassName,
  } = props;

  const overlayLink =
    cardLinkable && linkHref ? (
      <LinkComponent
        href={linkHref}
        aria-label={post.content.slice(0, 60)}
        className="absolute inset-0 z-0"
      />
    ) : null;

  const firstMedia =
    post.media && post.media.length > 0 && post.media[0].type === "image"
      ? post.media[0]
      : null;

  const contentNode = renderContent ? (
    renderContent(post)
  ) : (
    <ExpandableText
      content={post.content}
      maxLines={bodyMaxLines}
      labels={textLabels}
      contentClassName={cn("text-xs md:text-sm", bodyClassName)}
    />
  );

  return (
    <article
      role="article"
      tabIndex={-1}
      aria-labelledby={authorId}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card p-2.5 sm:p-3",
        className,
      )}
    >
      {overlayLink}
      <div className="relative z-10 flex flex-col gap-2">
        {buildHeaderNode(props, true)}
        {noticeSlot?.(post)}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">{contentNode}</div>
          {firstMedia ? (
            renderMedia ? (
              renderMedia(post.media ?? [], {})
            ) : (
              <div
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-md",
                  mediaClassName,
                )}
              >
                <img
                  src={firstMedia.url}
                  alt={firstMedia.alt ?? ""}
                  className="h-full w-full object-cover"
                />
              </div>
            )
          ) : null}
        </div>
        {post.tags && post.tags.length > 0 ? (
          <TagChips tags={post.tags} onTagClick={onTagClick} />
        ) : null}
        <div className={cn("relative z-10 mt-1", engagementClassName)}>
          {buildEngagementNode(props, true)}
        </div>
        {inlinePanelNode ? (
          <div className="relative z-10 mt-2 border-t border-border/60 pt-2">
            {inlinePanelNode}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export const CompactVariant = memo(CompactVariantInner);
CompactVariant.displayName = "PostCard.CompactVariant";
