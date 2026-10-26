/**
 * `renderNode` replaces the row, but the thread keeps the tree below it: nested replies (each
 * through `renderNode`) and the "view / more replies" links. Before this fix (pre-existing since
 * 0.1) a `renderNode` row returned early and every reply under it disappeared.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import { NOW, comment, installDomStubs } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const slot = (c: { id: string; content: string }, depth: number) => (
  <p data-testid={`row-${c.id}`} data-depth={depth}>
    {c.content}
  </p>
);

describe("renderNode keeps the tree", () => {
  it("renders loaded replies under a renderNode row, each through renderNode", () => {
    render(
      <CommentThread
        now={NOW}
        renderNode={slot}
        comments={[
          comment("a", {
            content: "Parent",
            replies: [comment("b", { content: "Child", replies: [comment("c", { content: "Grandchild" })] })],
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("row-a")).toHaveAttribute("data-depth", "0");
    expect(screen.getByTestId("row-b")).toHaveAttribute("data-depth", "1");
    expect(screen.getByTestId("row-c")).toHaveAttribute("data-depth", "2");
  });

  it("shows the on-demand replies link under a renderNode row and loads through it", async () => {
    const user = userEvent.setup();
    const onLoadReplies = vi.fn(async () => ({
      items: [comment("r1", { content: "Loaded reply" })],
      nextCursor: null,
    }));
    render(
      <CommentThread
        now={NOW}
        renderNode={slot}
        onLoadReplies={onLoadReplies}
        comments={[comment("a", { content: "Parent", replyCount: 1, replies: [] })]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "View 1 reply" }));
    expect(onLoadReplies).toHaveBeenCalledWith("a", null);
    expect(await screen.findByTestId("row-r1")).toHaveTextContent("Loaded reply");
  });
});
