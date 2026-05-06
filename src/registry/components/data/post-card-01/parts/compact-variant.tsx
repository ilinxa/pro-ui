"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { ExpandableText01 } from "@/registry/components/data/expandable-text-01";
import { EngagementBar01 } from "@/registry/components/data/engagement-bar-01";
import { PostHeader } from "./post-header";
import type { VariantInnerProps } from "./variant-shared";

function CompactVariantInner(props: VariantInnerProps) {
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
    cardLinkable,
    linkHref,
    LinkComponent,
    renderHeader,
    renderContent,
    renderMedia,
    renderEngagementBar,
    inlinePanelNode,
    className,
    headerClassName,
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
      labels={{ verifiedBadgeLabel: labels.verifiedBadgeLabel }}
      compact
      className={headerClassName}
    />
  );

  const contentNode = renderContent ? (
    renderContent(post)
  ) : (
    <ExpandableText01
      content={post.content}
      maxLines={bodyMaxLines}
      contentClassName={cn("text-xs", bodyClassName)}
    />
  );

  return (
    <article
      role="article"
      aria-labelledby={authorId}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card p-3",
        className,
      )}
    >
      {overlayLink}
      <div className="relative z-10 flex flex-col gap-2">
        {headerNode}
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
        <div className={cn("relative z-10 mt-1", engagementClassName)}>
          {renderEngagementBar ? (
            renderEngagementBar(post, { actions: engagementActions })
          ) : (
            <EngagementBar01
              ref={engagementBarRef}
              variant="compact"
              actions={engagementActions}
              onSubscribeDelta={engagementSubscribeNoop}
              labels={engagementLabels}
            />
          )}
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
CompactVariant.displayName = "PostCard01.CompactVariant";
