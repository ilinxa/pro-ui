"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { ExpandableText01 } from "@/registry/components/data/expandable-text-01";
import { EngagementBar01 } from "@/registry/components/data/engagement-bar-01";
import { PostHeader } from "./post-header";
import type { VariantInnerProps } from "./variant-shared";

function ListVariantInner(props: VariantInnerProps) {
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
    className,
    headerClassName,
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
      contentClassName={cn("text-sm", bodyClassName)}
    />
  );

  // Default for list: counts-only meta row, no interactive bar.
  const defaultMeta = (
    <span className="text-xs text-muted-foreground">
      {post.likes} likes · {post.comments} comments
      {post.shares !== undefined ? ` · ${post.shares} shares` : ""}
    </span>
  );

  return (
    <article
      role="article"
      aria-labelledby={authorId}
      className={cn(
        "relative flex items-stretch gap-3 overflow-hidden rounded-lg border border-border bg-card",
        firstMedia ? "p-0" : "p-3",
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
              "relative w-32 shrink-0 self-stretch overflow-hidden",
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
          firstMedia ? "p-3" : "",
        )}
      >
        {headerNode}
        {contentNode}
        <div className={cn("relative z-10 mt-auto", engagementClassName)}>
          {renderEngagementBar ? (
            renderEngagementBar(post, { actions: engagementActions })
          ) : engagementActions.length > 0 ? (
            <EngagementBar01
              ref={engagementBarRef}
              variant="compact"
              actions={engagementActions}
              onSubscribeDelta={engagementSubscribeNoop}
              labels={engagementLabels}
            />
          ) : (
            defaultMeta
          )}
        </div>
      </div>
    </article>
  );
}

export const ListVariant = memo(ListVariantInner);
ListVariant.displayName = "PostCard01.ListVariant";
