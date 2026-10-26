/**
 * Owed forwarding (R-05 / R-06) and the comment-thread passthrough: one `locale` reaches the
 * carousel, the bar, the likers strip, the share menu and the thread; `mediaProps`,
 * `engagementBarProps` and `commentThreadProps` are spread; the thread gets one stable props
 * object and a stable `comments` array.
 *
 * The carousel and the thread are replaced by recorders: this file tests what the card hands
 * them, not what they do.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockLayout, mockResizeObserver } from "../../../../../../tests/helpers";
import { PostCard } from "../post-card";
import { card, installDomStubs, makePost } from "./support";

const rec = vi.hoisted(() => ({
  carousel: [] as Record<string, unknown>[],
  thread: [] as Record<string, unknown>[],
  bar: [] as Record<string, unknown>[],
  strip: [] as Record<string, unknown>[],
  share: [] as Record<string, unknown>[],
}));

// The bar, the likers strip and the share menu keep working: the wrappers only record the props.
vi.mock("../../engagement-bar/engagement-bar", async (importActual) => {
  const actual = await importActual<typeof import("../../engagement-bar/engagement-bar")>();
  return {
    ...actual,
    EngagementBar: (props: Record<string, unknown>) => {
      rec.bar.push(props);
      return <actual.EngagementBar {...(props as unknown as React.ComponentProps<typeof actual.EngagementBar>)} />;
    },
  };
});
vi.mock("../../engagement-bar/parts/likers-strip", async (importActual) => {
  const actual = await importActual<typeof import("../../engagement-bar/parts/likers-strip")>();
  return {
    ...actual,
    LikersStrip: (props: Record<string, unknown>) => {
      rec.strip.push(props);
      return <actual.LikersStrip {...(props as unknown as React.ComponentProps<typeof actual.LikersStrip>)} />;
    },
  };
});
vi.mock("../../engagement-bar/parts/share-menu", async (importActual) => {
  const actual = await importActual<typeof import("../../engagement-bar/parts/share-menu")>();
  return {
    ...actual,
    ShareMenu: (props: Record<string, unknown>) => {
      rec.share.push(props);
      return <actual.ShareMenu {...(props as unknown as React.ComponentProps<typeof actual.ShareMenu>)} />;
    },
  };
});

vi.mock("@/registry/components/media/media-carousel/media-carousel", () => ({
  MediaCarousel: (props: Record<string, unknown>) => {
    rec.carousel.push(props);
    return <div data-testid="carousel" />;
  },
}));
vi.mock("../../comment-thread/comment-thread", () => ({
  CommentThread: (props: Record<string, unknown>) => {
    rec.thread.push(props);
    return <div data-testid="thread" />;
  },
}));

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
  for (const list of Object.values(rec)) list.length = 0;
});
afterEach(() => restore());

const NBSP_COMPACT = /^Like 1,2\sB$/;
const media = [{ id: "m1", type: "image" as const, url: "https://x.test/a.jpg", alt: "a" }];
const last = (list: Record<string, unknown>[]) => list[list.length - 1]!;

describe("locale", () => {
  it("reaches the engagement bar (a Turkish compact count)", () => {
    render(card({ locale: "tr", post: makePost({ likes: 1200 }) }));
    expect(screen.getByRole("button", { name: NBSP_COMPACT })).toBeInTheDocument();
  });

  it("is overridden by a count formatter on the card, and by one on engagementBarProps", () => {
    const { unmount } = render(card({ formatCount: (n) => `~${n}` }));
    expect(screen.getByRole("button", { name: "Like ~10" })).toBeInTheDocument();
    unmount();
    render(card({ formatCount: (n) => `~${n}`, engagementBarProps: { formatCount: (n) => `#${n}` } }));
    expect(screen.getByRole("button", { name: "Like #10" })).toBeInTheDocument();
  });

  it("reaches the bar as a prop", () => {
    render(card({ locale: "tr" }));
    expect(last(rec.bar).locale).toBe("tr");
  });

  it("reaches the share menu as a prop", () => {
    render(card({ locale: "tr", engagementMode: "inline", shareSuggestions: [] }));
    fireEvent.click(screen.getByRole("button", { name: /^Share/ }));
    expect(last(rec.share).locale).toBe("tr");
  });

  it("reaches the carousel", () => {
    render(card({ locale: "tr", post: makePost({ media }) }));
    expect(last(rec.carousel).locale).toBe("tr");
  });

  it("reaches the likers strip: Turkish compact pill and the card's count formatter", () => {
    render(
      card({
        engagementMode: "inline",
        defaultInlinePanel: "likes",
        locale: "tr",
        post: makePost({ likes: 1203 }),
        likers: [{ id: "a", name: "Ayşe Kaya" }],
        onLoadMoreLikers: async () => [],
        labels: { likersMoreLabel: (_c, f) => `${f} daha` },
      }),
    );
    expect(screen.getByRole("button", { name: /^1,2\sB daha$/ })).toBeInTheDocument();
    expect(last(rec.strip).locale).toBe("tr");
  });

  it("reaches the thread, and nested repost card", () => {
    render(
      card({
        variant: "detail",
        locale: "tr",
        timeZone: "UTC",
        post: makePost({ repostOf: makePost({ id: "p0", content: "original" }) }),
      }),
    );
    expect(last(rec.thread)).toMatchObject({ locale: "tr", timeZone: "UTC" });
    // The outer card and the nested repost both print Turkish relative text.
    expect(screen.getAllByText("3 sa. önce")).toHaveLength(2);
  });
});

describe("likers and share panels", () => {
  it("passes `likers` straight to the strip: a changed prop shows, a loaded page is kept by the strip", async () => {
    const user = userEvent.setup();
    const onLoadMoreLikers = vi.fn(async () => [{ id: "c", name: "Cem Yildiz" }]);
    const props = {
      engagementMode: "inline" as const,
      defaultInlinePanel: "likes" as const,
      post: makePost({ likes: 5 }),
      onLoadMoreLikers,
    };
    const { rerender } = render(card({ ...props, likers: [{ id: "a", name: "Ali Veli" }] }));
    expect(screen.getByText("Ali")).toBeInTheDocument();
    rerender(card({ ...props, likers: [{ id: "a", name: "Ali Veli" }, { id: "b", name: "Berk Can" }] }));
    expect(screen.getByText("Berk")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+3 more" }));
    expect(onLoadMoreLikers).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Cem")).toBeInTheDocument();
    expect(screen.getByText("Ali")).toBeInTheDocument();
  });

  it("maps the flat label keys onto the strip, and nested likersLabels win", () => {
    const { unmount } = render(
      card({
        engagementMode: "inline",
        defaultInlinePanel: "likes",
        labels: { likersHeading: "Beğenenler", hidePanelLabel: "Gizle" },
        likers: [],
      }),
    );
    expect(screen.getByText("Beğenenler")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gizle" })).toBeInTheDocument();
    unmount();
    render(
      card({
        engagementMode: "inline",
        defaultInlinePanel: "likes",
        labels: { likersHeading: "Beğenenler", likersLabels: { heading: "Nested", close: undefined } },
        likers: [],
        onLoadMoreLikers: async () => [],
      }),
    );
    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  it("maps the flat label keys onto the share menu, and nested shareLabels win", () => {
    render(
      card({
        engagementMode: "inline",
        shareSuggestions: [],
        labels: {
          shareHeading: "Paylaş…",
          shareSearchPlaceholder: "Kişi ara…",
          shareEmptyLabel: "Sonuç yok.",
          shareLabels: { empty: "Hiç kimse." },
        },
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Share/ }));
    expect(screen.getByText("Paylaş…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Kişi ara…")).toBeInTheDocument();
    expect(screen.getByText("Hiç kimse.")).toBeInTheDocument();
  });
});

describe("textLabels", () => {
  it("reaches the body's toggle", () => {
    const restoreLayout = mockLayout({ scrollHeight: 200, lineHeight: "20px" });
    const restoreObserver = mockResizeObserver();
    try {
      render(card({ labels: { textLabels: { showMore: "Devamını gör" } } }));
      expect(screen.getByRole("button", { name: "Devamını gör" })).toBeInTheDocument();
    } finally {
      restoreObserver();
      restoreLayout();
    }
  });
});

describe("mediaProps", () => {
  it("is spread onto the carousel; items / variant / double-tap stay the card's", () => {
    const onMediaError = vi.fn();
    render(
      card({
        onLike: vi.fn(),
        post: makePost({ media }),
        mediaProps: {
          aspect: "video",
          showCounter: true,
          onMediaError,
          labels: { carouselLabel: "Galeri" },
        },
      }),
    );
    const props = last(rec.carousel);
    expect(props).toMatchObject({
      aspect: "video",
      showCounter: true,
      onMediaError,
      labels: { carouselLabel: "Galeri" },
      variant: "gallery",
      items: media,
    });
    expect(typeof props.onDoubleTap).toBe("function");
  });

  it("reaches the detail variant's carousel too", () => {
    render(card({ variant: "detail", post: makePost({ media }), mediaProps: { aspect: "portrait" } }));
    expect(last(rec.carousel)).toMatchObject({ aspect: "portrait", variant: "gallery" });
  });
});

describe("engagementBarProps", () => {
  it("is spread onto the built-in bar", () => {
    const { container } = render(card({ engagementBarProps: { className: "bar-x", likersPreview: <p>Liked by Ada</p> } }));
    expect(container.querySelector(".bar-x")).not.toBeNull();
    expect(screen.getByText("Liked by Ada")).toBeInTheDocument();
  });

  it("reaches the compact variant's bar too", () => {
    const { container } = render(
      <PostCard variant="compact" now={new Date()} post={makePost()} engagementBarProps={{ className: "bar-c" }} />,
    );
    expect(container.querySelector(".bar-c")).not.toBeNull();
  });
});

describe("comment thread", () => {
  const comments = [
    {
      id: "c1",
      author: { id: "u", name: "U" },
      content: "hi",
      createdAt: "2026-03-10T10:00:00Z",
      likes: 0,
    },
  ];

  it("gets commentThreadProps, with the card's own comment props winning when defined", () => {
    const fromBag = vi.fn();
    const own = vi.fn();
    const onLoadMoreCursor = vi.fn();
    render(
      card({
        variant: "detail",
        commentThread: comments,
        onAddComment: own,
        commentThreadProps: { onAddComment: fromBag, onLoadMoreCursor, hasMore: true, pageSize: 4 },
      }),
    );
    const props = last(rec.thread);
    expect(props.onAddComment).toBe(own);
    expect(props.onLoadMoreCursor).toBe(onLoadMoreCursor);
    expect(props.hasMore).toBe(true);
    // The card's `commentPageSize` is undefined, so the bag's wins.
    expect(props.pageSize).toBe(4);
    expect(props.comments).toBe(comments);
  });

  it("the card's locale / timeZone / now are the default; commentThreadProps can set its own", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    const other = new Date("2026-01-01T00:00:00Z");
    const { unmount } = render(card({ variant: "detail", locale: "tr", timeZone: "UTC", now }));
    expect(last(rec.thread)).toMatchObject({ locale: "tr", timeZone: "UTC", now });
    unmount();
    render(
      card({
        variant: "detail",
        locale: "tr",
        timeZone: "UTC",
        now,
        commentThreadProps: { locale: "de", timeZone: "Europe/Berlin", now: other },
      }),
    );
    expect(last(rec.thread)).toMatchObject({ locale: "de", timeZone: "Europe/Berlin", now: other });
  });

  it("lays labels.commentLabels over commentThreadProps.labels", () => {
    render(
      card({
        variant: "detail",
        labels: { commentLabels: { composerSend: "Gönder" } },
        commentThreadProps: { labels: { composerSend: "Send it", emptyState: "Boş" } },
      }),
    );
    expect(last(rec.thread).labels).toEqual({ composerSend: "Gönder", emptyState: "Boş" });
  });

  it("forwards the moderation add-on (and works without it)", () => {
    const moderation = { EditComposer: () => null, Tombstone: () => null, PinnedMarker: () => null };
    const { unmount } = render(card({ variant: "detail", commentThreadProps: { moderation } }));
    expect(last(rec.thread).moderation).toBe(moderation);
    unmount();
    render(card({ variant: "detail" }));
    expect(last(rec.thread).moderation).toBeUndefined();
  });

  it("passes the same empty `comments` array on every render (the thread warns on a changing identity)", () => {
    const { rerender } = render(card({ variant: "detail" }));
    rerender(card({ variant: "detail", className: "a" }));
    rerender(card({ variant: "detail", className: "b" }));
    const identities = new Set(rec.thread.map((p) => p.comments));
    expect(rec.thread.length).toBeGreaterThanOrEqual(3);
    expect(identities.size).toBe(1);
    expect([...identities][0]).toEqual([]);
  });

  it("the inline panel gets the same stable array and the same props", () => {
    const { rerender } = render(card({ engagementMode: "inline", defaultInlinePanel: "comments", locale: "tr" }));
    rerender(card({ engagementMode: "inline", defaultInlinePanel: "comments", locale: "tr", className: "a" }));
    expect(new Set(rec.thread.map((p) => p.comments)).size).toBe(1);
    expect(last(rec.thread).locale).toBe("tr");
  });

  it("renderCommentSection keeps its handler bag", () => {
    const onAddComment = vi.fn();
    const renderCommentSection = vi.fn(() => <div>custom thread</div>);
    render(card({ variant: "detail", onAddComment, renderCommentSection }));
    expect(renderCommentSection).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1" }),
      expect.objectContaining({ onAddComment }),
    );
    expect(rec.thread).toHaveLength(0);
  });
});
