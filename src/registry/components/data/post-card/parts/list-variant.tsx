"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: cross-procomp imports via relative + specific-file paths.
import { ExpandableText } from "../../expandable-text/expandable-text";
import { TagChips } from "./tag-chips";
import { buildEngagementNode, buildHeaderNode } from "./variant-nodes";
import type { VariantInnerProps } from "./variant-shared";

function ListVariantInner(props: VariantInnerProps) {
  const {
    post,
    authorId,
    engagementClassName,
    engagementActions,
    renderEngagementBar,
    bodyMaxLines,
    bodyClassName,
    textLabels,
    labels,
    formatCount,
    cardLinkable,
    linkHref,
    LinkComponent,
    renderContent,
    renderMedia,
    noticeSlot,
    onTagClick,
    className,
    mediaClassName,
  } = props;

  const firstMedia =
    post.media && post.media.length > 0 && post.media[0].type === "image"
      ? post.media[0]
      : null;

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
      contentClassName={cn("text-xs md:text-sm", bodyClassName)}
    />
  );

  // Default for list: counts-only meta row, no interactive bar.
  const defaultMeta = (
    <span className="text-xs text-muted-foreground">
      {labels.listLikes(post.likes, formatCount(post.likes))}
      <span aria-hidden="true"> · </span>
      {labels.listComments(post.comments, formatCount(post.comments))}
      {post.shares !== undefined ? (
        <>
          <span aria-hidden="true"> · </span>
          {labels.listShares(post.shares, formatCount(post.shares))}
        </>
      ) : null}
    </span>
  );

  return (
    <article
      role="article"
      aria-labelledby={authorId}
      className={cn(
        "relative flex items-stretch gap-3 overflow-hidden rounded-lg border border-border bg-card",
        firstMedia ? "p-0" : "p-2.5 sm:p-3",
        className,
      )}
    >
      {overlayLink}
      {firstMedia ? (
        renderMedia ? (
          renderMedia(post.media ?? [], {})
        ) : (
          <div
            className={cn(
              "relative w-16 shrink-0 self-stretch overflow-hidden sm:w-20 md:w-24 lg:w-28",
              mediaClassName,
            )}
          >
            <img
              src={firstMedia.url}
              alt={firstMedia.alt ?? ""}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        )
      ) : null}
      <div
        className={cn(
          "relative z-10 flex min-w-0 flex-1 flex-col gap-2",
          firstMedia ? "p-2.5 sm:p-3" : "",
        )}
      >
        {buildHeaderNode(props, true)}
        {noticeSlot?.(post)}
        {contentNode}
        {post.tags && post.tags.length > 0 ? (
          <TagChips tags={post.tags} onTagClick={onTagClick} />
        ) : null}
        <div className={cn("relative z-10 mt-auto", engagementClassName)}>
          {renderEngagementBar || engagementActions.length > 0
            ? buildEngagementNode(props, true)
            : defaultMeta}
        </div>
      </div>
    </article>
  );
}

export const ListVariant = memo(ListVariantInner);
ListVariant.displayName = "PostCard.ListVariant";
