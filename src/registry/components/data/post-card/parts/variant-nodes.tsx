import type { ReactNode } from "react";
// Cross-category: absolute-with-suffix (relative would resolve to non-existent
// `src/media/...` in consumer's flat tree).
import { MediaCarousel } from "@/registry/components/media/media-carousel/media-carousel";
import { EngagementBar } from "../../engagement-bar/engagement-bar";
import { PostHeader } from "./post-header";
import { PollWidget } from "./poll-widget";
import { RepostOfCard } from "./repost-of-card";
import type { VariantInnerProps } from "./variant-shared";

/** The header: the host's `renderHeader` (it still gets the actions menu) or the default one. */
export function buildHeaderNode(p: VariantInnerProps, compact: boolean): ReactNode {
  const { post } = p;
  if (p.renderHeader) {
    return p.renderHeader(post, { currentUser: p.currentUser, kebab: p.kebab });
  }
  return (
    <PostHeader
      post={post}
      kebab={p.kebab}
      headingAs={p.headingAs}
      formattedTime={p.formattedTime}
      authorId={p.authorId}
      locale={p.locale}
      timeZone={p.timeZone}
      authorHref={p.getAuthorHref?.(post.author, post)}
      LinkComponent={p.LinkComponent}
      subtitle={typeof p.subtitle === "function" ? p.subtitle(post) : p.subtitle}
      labels={p.labels}
      onLocationClick={p.onLocationClick}
      onMentionClick={p.onMentionClick}
      compact={compact}
      className={p.headerClassName}
    />
  );
}

/** The engagement bar: the host's `renderEngagementBar` or the built-in one. */
export function buildEngagementNode(p: VariantInnerProps, compactBar: boolean): ReactNode {
  if (p.renderEngagementBar) {
    return p.renderEngagementBar(p.post, { actions: p.engagementActions });
  }
  const barProps = p.engagementBarProps;
  return (
    <EngagementBar
      ref={p.engagementBarRef}
      {...barProps}
      variant={compactBar ? "compact" : undefined}
      actions={p.engagementActions}
      onSubscribeDelta={p.engagementSubscribeNoop}
      labels={p.engagementLabels}
      locale={p.locale}
      formatCount={barProps?.formatCount ?? p.formatCount}
      optimistic={barProps?.optimistic ?? p.optimistic}
    />
  );
}

/** The media carousel (feed + detail). `mediaProps` goes first so `items` / `variant` stay the card's. */
export function buildMediaNode(p: VariantInnerProps): ReactNode {
  const { post } = p;
  if (!post.media || post.media.length === 0) return null;
  if (p.renderMedia) return p.renderMedia(post.media, { onDoubleTap: p.onMediaDoubleTap });
  return (
    <MediaCarousel
      {...p.mediaProps}
      items={post.media}
      variant="gallery"
      locale={p.locale}
      onDoubleTap={p.onMediaDoubleTap}
    />
  );
}

/** The poll (feed + detail): the host's `renderPoll`, the default widget, or nothing. */
export function buildPollNode(p: VariantInnerProps): ReactNode {
  const { post } = p;
  if (p.disablePollRender || !post.poll) return null;
  if (p.renderPoll) {
    return p.renderPoll(post, { onVote: p.onPollVote, isOwnerView: p.isOwnerView });
  }
  return (
    <PollWidget
      poll={post.poll}
      hasVoted={post.poll.hasVoted ?? false}
      isOwnerView={p.isOwnerView}
      optimisticVoteOptionId={post.poll.viewerVoteOptionId}
      optimisticIncrement={false}
      onVote={p.onPollVote}
      labels={{
        pollHeading: p.labels.pollHeading,
        pollTotalVotesLabel: p.labels.pollTotalVotesLabel,
        pollClosesAtLabel: p.labels.pollClosesAtLabel,
        pollClosedLabel: p.labels.pollClosedLabel,
      }}
      formatRelativeTime={p.formatRelativeTime}
      formatCount={p.formatCount}
      now={p.now}
      locale={p.locale}
      busy={p.pollBusy}
    />
  );
}

/** The nested repost mini-card (feed + detail). */
export function buildRepostNode(p: VariantInnerProps): ReactNode {
  const { post } = p;
  if (p.disableRepostOfRender || !post.repostOf) return null;
  const onClick = p.onRepostOfClick;
  if (p.renderRepostOf) {
    return p.renderRepostOf(post, {
      onClick: onClick ? () => post.repostOf && onClick(post.repostOf) : undefined,
    });
  }
  return (
    <RepostOfCard
      originalPost={post.repostOf}
      onClick={onClick}
      getHref={p.getHref}
      linkComponent={p.linkComponent}
      labels={p.cardLabels}
      locale={p.locale}
      timeZone={p.timeZone}
      now={p.now}
      formatRelativeTime={p.repostForwarding.formatRelativeTime}
      formatCount={p.repostForwarding.formatCount}
    />
  );
}
