/**
 * Fix wave 2 (real-browser pass): focus after a delete (B2) and the portaled actions menu's
 * direction (B4). Each test was written to fail without its fix.
 */
import { createRef } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommentThread } from "../comment-thread";
import { commentModeration } from "../features/moderation";
import type { Comment, CommentThreadHandle, CommentThreadProps } from "../types";
import { ME, NOW, comment, installDomStubs, mine, row, rowQueries } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const settle = () => new Promise<void>((r) => setTimeout(r, 90));

function setup(props: Partial<CommentThreadProps> & { comments: Comment[]; ref?: React.Ref<CommentThreadHandle> }) {
  const utils = render(<CommentThread now={NOW} currentUser={ME} {...props} />);
  return { user: userEvent.setup(), ...utils };
}
async function deleteRow(user: ReturnType<typeof userEvent.setup>, body: string) {
  await user.click(rowQueries(body).getByRole("button", { name: /Comment actions for/ }));
  await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
  await settle();
}

describe("B2 focus after a delete", () => {
  it("moves to the next comment's row", async () => {
    const { user } = setup({ comments: [mine("a"), mine("b"), mine("c")], onDeleteComment: () => {} });
    await deleteRow(user, "Body b");
    expect(document.activeElement).toBe(row("Body c"));
  });

  it("the last row: moves to the previous one", async () => {
    const { user } = setup({ comments: [mine("a"), mine("b")], onDeleteComment: () => {} });
    await deleteRow(user, "Body b");
    expect(document.activeElement).toBe(row("Body a"));
  });

  it("the only row: moves to the composer", async () => {
    const { user } = setup({ comments: [mine("a")], onDeleteComment: () => {} });
    await deleteRow(user, "Body a");
    expect(document.activeElement).toBe(screen.getByPlaceholderText("Write a comment…"));
  });

  it("a promise delete (optimistic removal) behaves the same", async () => {
    const { user } = setup({
      comments: [mine("a"), mine("b")],
      onDeleteComment: () => new Promise<void>(() => {}),
    });
    await deleteRow(user, "Body a");
    expect(document.activeElement).toBe(row("Body b"));
  });

  it("a tombstoned row keeps focus on its tombstone", async () => {
    const { user } = setup({
      comments: [mine("a"), mine("b")],
      removedMode: "tombstone",
      moderation: commentModeration,
      onDeleteComment: () => {},
    });
    await deleteRow(user, "Body a");
    const tomb = screen.getByText("This comment was deleted").closest("[data-comment-id]");
    expect(document.activeElement).toBe(tomb);
  });

  it("does not steal focus that went elsewhere", async () => {
    const ref = createRef<CommentThreadHandle>();
    const { user } = setup({ ref, comments: [mine("a"), mine("b")] });
    await user.click(rowQueries("Body a").getByRole("button", { name: /^Like/ }));
    const composer = screen.getByPlaceholderText("Write a comment…");
    composer.focus();
    act(() => ref.current!.dispatch({ kind: "remove", commentId: "a" }));
    await settle();
    expect(document.activeElement).toBe(composer);
  });

  it("a removal driven by the host (a delta) also hands focus on", async () => {
    let push: ((d: { kind: "removed"; commentId: string }) => void) | undefined;
    const { user } = setup({
      comments: [comment("a"), comment("b")],
      subscribe: (h) => {
        push = h as typeof push;
        return () => {};
      },
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: /^Like/ }));
    await act(async () => push?.({ kind: "removed", commentId: "a" }));
    await settle();
    expect(document.activeElement).toBe(row("Body b"));
  });
});

describe("B4 the portaled actions menu follows the direction", () => {
  const open = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: /Comment actions for/ }));
    return screen.findByRole("menu");
  };

  it("under dir=rtl the menu gets dir=rtl and opens toward the row (dir=rtl reaches the positioner; align end)", async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl" lang="ar">
        <CommentThread now={NOW} currentUser={ME} comments={[mine("a")]} />
      </div>,
    );
    const menu = await open(user);
    expect(menu).toHaveAttribute("dir", "rtl");
    expect(menu).toHaveAttribute("data-align", "end");
    // floating-ui mirrors "end" for an RTL floating element: the positioned wrapper must carry dir=rtl.
    expect(menu.closest("[data-radix-popper-content-wrapper]")).toHaveAttribute("dir", "rtl");
  });

  it("in LTR it stays dir=ltr and align end", async () => {
    const user = userEvent.setup();
    render(<CommentThread now={NOW} currentUser={ME} comments={[mine("a")]} />);
    const menu = await open(user);
    expect(menu).toHaveAttribute("dir", "ltr");
    expect(menu).toHaveAttribute("data-align", "end");
  });

  it("the thread's `dir` prop wins over the surroundings", async () => {
    const user = userEvent.setup();
    render(<CommentThread now={NOW} currentUser={ME} dir="rtl" comments={[mine("a")]} />);
    const menu = await open(user);
    expect(menu).toHaveAttribute("dir", "rtl");
    expect(menu).toHaveAttribute("data-align", "end");
    // floating-ui mirrors "end" for an RTL floating element: the positioned wrapper must carry dir=rtl.
    expect(menu.closest("[data-radix-popper-content-wrapper]")).toHaveAttribute("dir", "rtl");
  });
});
