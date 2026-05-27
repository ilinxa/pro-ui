"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { ExpandableText01 } from "@/registry/components/data/expandable-text-01";
import { MediaCarousel01 } from "@/registry/components/media/media-carousel-01";
import {
  EngagementBar01,
  EngagementHeartBurst,
} from "@/registry/components/data/engagement-bar-01";
import { PostHeader } from "./post-header";
import { TagChips } from "./tag-chips";
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
    inlinePanelNode,
    className,
    headerClassName,
    mediaClassName,
  } = props;

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
      contentClassName={cn("text-sm", bodyClassName)}
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
      <div className="relative z-10 flex flex-col gap-3 p-4">
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
        </div>
      ) : null}
      <div className={cn("relative z-10 px-4 pb-3 pt-3", engagementClassName)}>
        {engagementNode}
      </div>
      {inlinePanelNode ? (
        <div className="relative z-10 border-t border-border/60 px-4 py-3">
          {inlinePanelNode}
        </div>
      ) : null}
    </article>
  );
}

export const FeedVariant = memo(FeedVariantInner);
FeedVariant.displayName = "PostCard01.FeedVariant";
