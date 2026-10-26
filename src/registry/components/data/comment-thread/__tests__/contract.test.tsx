/**
 * The consumer-contract checks (C11) for CommentThread, via the shared kit — plus axe in the
 * interactive states the kit cannot reach (pending, error, tombstone, editor, open menu).
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommentThread } from "../comment-thread";
import { commentModeration } from "../features/moderation";
import { DUMMY_RTL_COMMENTS, DUMMY_RTL_VIEWER } from "../dummy-data";
import type { Comment, CommentThreadProps } from "../types";
import { describeContract, expectNoAxeViolations } from "../../../../../../tests/helpers";
import { ME, NOW, comment, deferred, flush, installDomStubs, mine, rowQueries } from "./support";

const base = (): Comment[] => [
  comment("a", { likes: 3, replyCount: 0 }),
  comment("b", { replies: [comment("b1")] }),
];

describeContract("CommentThread", {
  render: (props) => (
    <CommentThread now={NOW} comments={base()} currentUser={ME} {...(props as Partial<CommentThreadProps>)} />
  ),
  setup: installDomStubs,
  renders: (s) => {
    expect(s.getByText("Body a")).toBeInTheDocument();
    expect(s.getByText("Body b1")).toBeInTheDocument();
    expect(s.getAllByRole("article")).toHaveLength(3);
    expect(s.getAllByRole("button", { name: /^Like/ })).toHaveLength(3);
  },
  labels: {
    props: { labels: { reply: "Yanıtla", composerPlaceholder: "Yorum yaz…", like: "Beğen" } },
    expect: (s) => {
      expect(s.getAllByRole("button", { name: "Yanıtla" }).length).toBeGreaterThan(0);
      expect(s.getByPlaceholderText("Yorum yaz…")).toBeInTheDocument();
      expect(s.getAllByRole("button", { name: /^Beğen/ }).length).toBeGreaterThan(0);
    },
  },
  controlled: {
    initial: { comments: [comment("a", { likes: 3 })], onLikeComment: () => {} },
    next: { comments: [comment("a", { likes: 9, isLiked: true })] },
    callback: "onCommentsChange",
    expectInitial: (s) => expect(s.getByRole("button", { name: /^Like/ })).toHaveAccessibleName("Like 3"),
    expectNext: (s) => expect(s.getByRole("button", { name: /^Unlike/ })).toHaveAccessibleName("Unlike 9"),
    // A requested change calls back, but the prop still wins.
    request: (user, s) => user.click(s.getByRole("button", { name: /^Like/ })),
  },
  rtl: {
    props: { comments: DUMMY_RTL_COMMENTS, currentUser: DUMMY_RTL_VIEWER, indentPx: 40 },
    expect: (s, root) => {
      expect(root).toHaveAttribute("dir", "rtl");
      // Arabic bodies are bidi-isolated; the reply is indented from the inline-START edge (which is the right in RTL).
      expect(s.getByText(DUMMY_RTL_COMMENTS[0]!.content)).toHaveAttribute("dir", "auto");
      const reply = s.getByText(DUMMY_RTL_COMMENTS[0]!.replies![0]!.content).closest("article")!;
      expect(reply.getAttribute("style") ?? "").toMatch(/padding-inline-start:\s*40px/);
      expect(reply.getAttribute("style") ?? "").not.toMatch(/padding-left|padding-right/);
    },
  },
  keyboard: {
    run: async (user) => {
      await user.tab();
      await user.keyboard("{Enter}");
    },
    expect: (s) => {
      // The first focusable control is the first row's like; Enter toggled it.
      expect(s.getAllByRole("button", { name: /^Unlike/ })).toHaveLength(1);
      expect(s.getAllByRole("button", { name: /^Unlike/ })[0]).toHaveFocus();
    },
  },
  axeStates: [
    { currentUser: undefined },
    { variant: "compact", comments: [comment("a", { replyCount: 4 })], onLoadReplies: async () => ({ items: [] }) },
    {
      comments: [comment("a", { state: "hidden", replies: [comment("kid")] }), comment("b", { isPinned: true })],
      moderation: commentModeration,
    },
    { comments: base(), pageSize: 2, onLoadMore: async () => [] },
    { comments: [comment("a", { likes: null })], reactionKinds: [{ key: "love", icon: <span>L</span>, label: "Love" }], onReactComment: () => {} },
  ],
});

describe("axe in interactive states", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = installDomStubs();
  });
  afterEach(() => restore());

  it("a pending (sending) comment", async () => {
    const add = deferred<Comment | void>();
    const user = userEvent.setup();
    const { container } = render(
      <CommentThread now={NOW} comments={base()} currentUser={ME} onAddComment={() => add.promise} />,
    );
    await user.type(screen.getByPlaceholderText("Write a comment…"), "sending now{Enter}");
    expect(screen.getByText("Sending…")).toBeInTheDocument();
    await expectNoAxeViolations(container);
    await act(async () => add.resolve());
  });

  it("a failed post (alert under the composer)", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CommentThread now={NOW} comments={base()} currentUser={ME} onAddComment={() => Promise.reject(new Error("x"))} />,
    );
    await user.type(screen.getByPlaceholderText("Write a comment…"), "will fail{Enter}");
    await flush();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("a failed load-more and a failed replies load", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CommentThread
        now={NOW}
        comments={[comment("a", { replyCount: 2 }), comment("b")]}
        pageSize={2}
        onLoadMore={() => Promise.reject(new Error("x"))}
        onLoadReplies={() => Promise.reject(new Error("x"))}
        onError={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    await user.click(screen.getByRole("button", { name: "View 2 replies" }));
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    await expectNoAxeViolations(container);
  });

  it("tombstones, a pinned marker and the edit composer", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CommentThread
        now={NOW}
        currentUser={ME}
        comments={[
          comment("a", { state: "deleted", replies: [comment("kid")] }),
          mine("b", { isPinned: true }),
        ]}
        moderation={commentModeration}
        onEditComment={() => {}}
      />,
    );
    await user.click(rowQueries("Body b").getByRole("button", { name: /Comment actions for/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
    expect(await screen.findByLabelText("Edit")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("the open kebab menu", async () => {
    const user = userEvent.setup();
    render(
      <CommentThread now={NOW} currentUser={ME} comments={[mine("a")]} onReportComment={() => {}} />,
    );
    await user.click(screen.getByRole("button", { name: /Comment actions for/ }));
    await screen.findByRole("menu");
    // The menu renders in a portal, so audit the whole body; `region` is a page-level rule.
    await expectNoAxeViolations(document.body, { disable: ["color-contrast", "region"] });
  });
});
