/**
 * Per-comment permissions (CT4 base), the kebab (`extraActions`, `commentActions`, `hidden`,
 * `separatorBefore`) and reactions per row (CT5).
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import type { Comment, CommentThreadProps } from "../types";
import { ME, NOW, comment, installDomStubs, mine, rowQueries } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

function setup(props: Partial<CommentThreadProps> & { comments: Comment[] }) {
  const utils = render(<CommentThread now={NOW} currentUser={ME} {...props} />);
  return { user: userEvent.setup(), ...utils };
}
const kebab = (body: string) => rowQueries(body).getByRole("button", { name: /Comment actions for/ });
async function menuLabels(user: ReturnType<typeof userEvent.setup>, body: string): Promise<string[]> {
  await user.click(kebab(body));
  const menu = await screen.findByRole("menu");
  return within(menu)
    .getAllByRole("menuitem")
    .map((el) => el.textContent ?? "");
}

describe("default items and permissions", () => {
  it("Report is NOT offered on your own comment (it used to be), Delete is", async () => {
    const { user } = setup({ comments: [mine("a")], onReportComment: () => {} });
    expect(await menuLabels(user, "Body a")).toEqual(["Delete"]);
  });

  it("on someone else's comment: Report, no Delete", async () => {
    const { user } = setup({ comments: [comment("a")], onReportComment: () => {} });
    expect(await menuLabels(user, "Body a")).toEqual(["Report"]);
  });

  it("no kebab at all when nothing is offered", () => {
    setup({ comments: [comment("a")] });
    expect(screen.queryByRole("button", { name: /Comment actions for/ })).not.toBeInTheDocument();
  });

  it("each defined permission beats the default", async () => {
    const { user } = setup({
      comments: [
        comment("a", { permissions: { canDelete: true, canReport: false } }),
        mine("b", { permissions: { canDelete: false, canReport: true } }),
      ],
      onReportComment: () => {},
    });
    expect(await menuLabels(user, "Body a")).toEqual(["Delete"]);
    await user.keyboard("{Escape}");
    expect(await menuLabels(user, "Body b")).toEqual(["Report"]);
  });

  it("canReply: false removes the Reply button", () => {
    setup({
      comments: [comment("a", { permissions: { canReply: false } }), comment("b")],
    });
    expect(rowQueries("Body a").queryByRole("button", { name: "Reply" })).not.toBeInTheDocument();
    expect(rowQueries("Body b").getByRole("button", { name: "Reply" })).toBeInTheDocument();
  });

  it("canReact: false renders the like action disabled and calls nothing", async () => {
    const onLikeComment = vi.fn();
    const { user } = setup({
      comments: [comment("a", { permissions: { canReact: false } })],
      onLikeComment,
    });
    const like = rowQueries("Body a").getByRole("button", { name: /^Like/ });
    expect(like).toHaveAttribute("aria-disabled", "true");
    await user.click(like);
    expect(onLikeComment).not.toHaveBeenCalled();
  });

  it("with no signed-in viewer there is no Reply button", () => {
    setup({ comments: [comment("a")], currentUser: undefined });
    expect(screen.queryByRole("button", { name: "Reply" })).not.toBeInTheDocument();
  });
});

describe("the kebab slots", () => {
  it("extraActions are appended after the defaults and get the resolved permissions", async () => {
    const extra = vi.fn(() => [{ label: "Pin it", onClick: () => {} }]);
    const { user } = setup({ comments: [mine("a")], extraActions: extra });
    expect(await menuLabels(user, "Body a")).toEqual(["Delete", "Pin it"]);
    const [, helpers] = extra.mock.calls[0] as unknown as [Comment, { permissions: { canDelete: boolean }; isPending: boolean }];
    expect(helpers.permissions.canDelete).toBe(true);
    expect(helpers.isPending).toBe(false);
  });

  it("commentActions stays a full takeover (no defaults, no extras)", async () => {
    const { user } = setup({
      comments: [mine("a")],
      onReportComment: () => {},
      extraActions: () => [{ label: "Extra" }],
      commentActions: () => [{ label: "Only me" }],
    });
    expect(await menuLabels(user, "Body a")).toEqual(["Only me"]);
  });

  it("a hidden item is left out; a menu with every item hidden renders no kebab", async () => {
    const { user, rerender } = setup({
      comments: [comment("a")],
      commentActions: () => [{ label: "Secret", hidden: true }, { label: "Shown" }],
    });
    expect(await menuLabels(user, "Body a")).toEqual(["Shown"]);
    await user.keyboard("{Escape}");
    rerender(
      <CommentThread
        now={NOW}
        currentUser={ME}
        comments={[comment("a")]}
        commentActions={() => [{ label: "Secret", hidden: true }]}
      />,
    );
    expect(screen.queryByRole("button", { name: /Comment actions for/ })).not.toBeInTheDocument();
  });

  it("separatorBefore draws a divider above the item (and none above the first)", async () => {
    const { user } = setup({
      comments: [comment("a")],
      commentActions: () => [
        { label: "First", separatorBefore: true },
        { label: "Second" },
        { label: "Third", separatorBefore: true },
      ],
    });
    await user.click(kebab("Body a"));
    const menu = await screen.findByRole("menu");
    const children = Array.from(menu.children);
    const roles = children.map((el) => el.getAttribute("role"));
    expect(roles).toEqual(["menuitem", "menuitem", "separator", "menuitem"]);
  });

  it("the trigger is a direct button named from labels.kebabAriaLabel", () => {
    setup({
      comments: [mine("a")],
      labels: { kebabAriaLabel: (name) => `Actions: ${name}` },
    });
    expect(screen.getByRole("button", { name: "Actions: Ada Lovelace" })).toBeInTheDocument();
  });
});

describe("likes and reactions per row", () => {
  it("a withheld like count (null) renders no number and no count in the name", () => {
    setup({ comments: [comment("a", { likes: null })] });
    const like = rowQueries("Body a").getByRole("button", { name: /^Like/ });
    expect(like).toHaveAccessibleName("Like");
  });

  it("forwards the locale and formatCount to the bar", () => {
    setup({
      comments: [comment("a", { likes: 1234 })],
      formatCount: (n) => `#${n}`,
    });
    expect(rowQueries("Body a").getByRole("button", { name: /^Like/ })).toHaveAccessibleName("Like #1234");
  });

  it("forwards labels.like / labels.unlike", () => {
    setup({
      comments: [comment("a", { likes: null }), comment("b", { likes: null, isLiked: true })],
      labels: { like: "Beğen", unlike: "Vazgeç" },
    });
    expect(rowQueries("Body a").getByRole("button", { name: "Beğen" })).toBeInTheDocument();
    expect(rowQueries("Body b").getByRole("button", { name: "Vazgeç" })).toBeInTheDocument();
  });

  const kinds = [
    { key: "love", icon: <span>L</span>, label: "Love" },
    { key: "laugh", icon: <span>H</span>, label: "Laugh" },
  ];

  it("reactionKinds + onReactComment turn the row action into a reaction picker fed by comment.reactions", async () => {
    const onReactComment = vi.fn();
    const { user } = setup({
      comments: [
        comment("a", { reactions: { viewerReaction: null, counts: { love: 4, laugh: 1 }, totalCount: 5 } }),
      ],
      reactionKinds: kinds,
      onReactComment,
    });
    const trigger = rowQueries("Body a").getByRole("button", { name: /^React/ });
    expect(trigger).toHaveAccessibleName("React 5");
    await user.click(trigger);
    await user.click(await screen.findByRole("button", { name: /^Love/ }));
    expect(onReactComment).toHaveBeenCalledWith("a", "love");
  });

  it("reflects the viewer's reaction and updates it optimistically (counts move)", async () => {
    const { user } = setup({
      comments: [
        comment("a", { reactions: { viewerReaction: null, counts: { love: 4, laugh: 1 }, totalCount: 5 } }),
      ],
      reactionKinds: kinds,
      onReactComment: () => {},
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: /^React/ }));
    await user.click(await screen.findByRole("button", { name: /^Love/ }));
    expect(rowQueries("Body a").getByRole("button", { name: /^Love/ })).toHaveAccessibleName("Love 6");
  });

  it("without onReactComment the row keeps the like", () => {
    setup({ comments: [comment("a")], reactionKinds: kinds });
    expect(rowQueries("Body a").getByRole("button", { name: /^Like/ })).toBeInTheDocument();
  });

  it("engagementActions takes over and receives the default actions", () => {
    const seen: string[] = [];
    setup({
      comments: [comment("a")],
      engagementActions: (_c, helpers) => {
        seen.push(...helpers.defaultActions.map((action) => action.kind));
        return [...helpers.defaultActions, { kind: "custom", id: "boost", label: "Boost", icon: <span>B</span> }];
      },
    });
    expect(seen).toContain("like");
    expect(rowQueries("Body a").getByRole("button", { name: /Boost/ })).toBeInTheDocument();
  });
});
