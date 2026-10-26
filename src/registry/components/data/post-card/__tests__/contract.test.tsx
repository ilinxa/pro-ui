/**
 * C11 kit for PostCard: render, labels override, controlled `post` (+ a requested change),
 * RTL + axe, a keyboard path through the kebab, and axe over the other states.
 */
import { expect, vi } from "vitest";
import { describeContract } from "../../../../../../tests/helpers";
import { card, installDomStubs, KINDS, likeButton, makePost } from "./support";

const AR_POST = makePost({
  author: { id: "u2", name: "أحمد المنصوري", username: "ahmad" },
  content: "شارك أحمد: قمنا اليوم بنزهة طويلة في الحرم الجامعي والتقطنا صوراً جميلة جداً.",
  // The results view draws its bars from the inline start edge.
  poll: {
    options: [
      { id: "a", label: "الجبال", voteCount: 6 },
      { id: "b", label: "البحر", voteCount: 4 },
    ],
    totalVotes: 10,
    hasVoted: true,
    viewerVoteOptionId: "a",
  },
});

const kbBookmark = vi.fn();

describeContract("PostCard", {
  render: (props) => card(props),
  setup: installDomStubs,
  renders: (s) => {
    expect(s.getByRole("article")).toHaveAccessibleName("Ada Lovelace");
    expect(s.getByText("Hello from the analytical engine.")).toBeInTheDocument();
    expect(likeButton(s)).toHaveAccessibleName("Like 10");
    expect(s.getByRole("button", { name: "Post actions" })).toBeInTheDocument();
    expect(s.getByText("3h")).toBeInTheDocument();
  },
  labels: {
    props: { labels: { kebabAriaLabel: "Gönderi işlemleri", engagementLabels: { like: "Beğen" } } },
    expect: (s) => {
      expect(s.getByRole("button", { name: "Gönderi işlemleri" })).toBeInTheDocument();
      expect(likeButton(s)).toHaveAccessibleName("Beğen 10");
    },
  },
  controlled: {
    initial: { post: makePost({ likes: 10, isLiked: false }) },
    next: { post: makePost({ likes: 11, isLiked: true }) },
    callback: "onPostChange",
    expectInitial: (s) => {
      expect(likeButton(s)).toHaveAccessibleName("Like 10");
      expect(likeButton(s)).toHaveAttribute("aria-pressed", "false");
    },
    expectNext: (s) => {
      expect(likeButton(s)).toHaveAccessibleName("Unlike 11");
      expect(likeButton(s)).toHaveAttribute("aria-pressed", "true");
    },
    request: async (user, s) => {
      await user.click(likeButton(s));
    },
  },
  rtl: {
    props: { post: AR_POST, getAuthorHref: () => "/u/ahmad", subtitle: "مدير المجتمع" },
    expect: (s, root) => {
      expect(root).toHaveAttribute("dir", "rtl");
      expect(s.getByRole("article")).toHaveAccessibleName("أحمد المنصوري");
      // The body is bidi-isolated, so an Arabic post in an LTR feed starts at the right.
      expect(s.getByText(AR_POST.content)).toHaveAttribute("dir", "auto");
      // Logical utilities only: nothing in the card pins a physical side.
      expect(root.innerHTML).not.toMatch(/(?:^|[\s"])(?:ml|mr|pl|pr|left|right)-\d/);
      expect(root.innerHTML).not.toMatch(/(?:^|[\s"])text-(?:left|right)(?:[\s"]|$)/);
    },
  },
  keyboard: {
    props: { onBookmark: kbBookmark },
    run: async (user, s) => {
      const trigger = s.getByRole("button", { name: "Post actions" });
      trigger.focus();
      await user.keyboard("{Enter}");
      const item = await s.findByRole("menuitem", { name: "Bookmark" });
      item.focus();
      await user.keyboard("{Enter}");
    },
    expect: () => {
      expect(kbBookmark).toHaveBeenCalledWith("p1", true);
    },
  },
  axeStates: [
    { variant: "compact" },
    { variant: "list" },
    { post: AR_POST, getAuthorHref: () => "/u/ahmad", subtitle: "Sponsored", noticeSlot: () => <p>Under review</p> },
    { post: makePost({ isLiked: true, likes: 0, comments: 0, shares: 0 }) },
    {
      reactions: { kinds: KINDS, counts: { love: 5, laugh: 3 }, totalCount: 8, viewerReaction: null, onReact: vi.fn() },
    },
    { viewerMode: "owner", onEdit: vi.fn(), onDelete: vi.fn(), permissions: { disabled: { delete: true } } },
  ],
});
