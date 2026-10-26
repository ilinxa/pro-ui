/**
 * The moderation seam (U1 amendment): inline edit, tombstones, pin marker — with the
 * `comment-thread-moderation` add-on installed, and the negative path without it.
 */
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import { commentModeration } from "../features/moderation";
import type { Comment, CommentDelta, CommentThreadProps } from "../types";
import {
  ME,
  NOW,
  comment,
  deferred,
  flush,
  installDomStubs,
  mine,
  rowCount,
  rowQueries,
} from "./support";

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

function makeStream() {
  let handler: ((delta: CommentDelta) => void) | undefined;
  return {
    subscribe: (h: (delta: CommentDelta) => void) => {
      handler = h;
      return () => {
        handler = undefined;
      };
    },
    push: (delta: CommentDelta) => act(async () => handler?.(delta)),
  };
}

const warnings = () => vi.spyOn(console, "warn").mockImplementation(() => {});

describe("without the add-on (negative path)", () => {
  it("onEditComment logs ONE warning and offers no Edit item", async () => {
    const warn = warnings();
    const { user } = setup({ comments: [mine("a")], onEditComment: () => {} });
    await user.click(kebab("Body a"));
    const items = within(await screen.findByRole("menu")).getAllByRole("menuitem");
    expect(items.map((el) => el.textContent)).toEqual(["Delete"]);
    const hits = warn.mock.calls.filter((c) => String(c[0]).includes("onEditComment"));
    expect(hits).toHaveLength(1);
    warn.mockRestore();
  });

  it("a comment with a non-visible state is left out WITH its replies, with ONE warning", () => {
    const warn = warnings();
    setup({
      comments: [
        comment("a", { state: "hidden", replies: [comment("kid")] }),
        comment("b", { replies: [comment("deleted-kid", { state: "deleted" }), comment("ok-kid")] }),
      ],
    });
    expect(screen.queryByText("Body a")).not.toBeInTheDocument();
    expect(screen.queryByText("Body kid")).not.toBeInTheDocument();
    expect(screen.queryByText("Body deleted-kid")).not.toBeInTheDocument();
    expect(screen.getByText("Body ok-kid")).toBeInTheDocument();
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("state"))).toHaveLength(1);
    warn.mockRestore();
  });

  it('removedMode="tombstone" warns ONCE and still prunes', async () => {
    const warn = warnings();
    const stream = makeStream();
    setup({
      comments: [comment("a", { replies: [comment("kid")] })],
      subscribe: stream.subscribe,
      removedMode: "tombstone",
    });
    await stream.push({ kind: "removed", commentId: "a" });
    expect(screen.queryByText("Body a")).not.toBeInTheDocument();
    expect(screen.queryByText("Body kid")).not.toBeInTheDocument();
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("removedMode"))).toHaveLength(1);
    warn.mockRestore();
  });

  it("isPinned is ignored: no marker", () => {
    setup({ comments: [comment("a", { isPinned: true })] });
    expect(screen.queryByText("Pinned")).not.toBeInTheDocument();
  });

  it("does not warn when nothing needs the add-on", () => {
    const warn = warnings();
    setup({ comments: [comment("a")] });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("with the add-on", () => {
  it("offers Edit on your own comment, not on someone else's", async () => {
    const { user } = setup({
      comments: [mine("a"), comment("b", { permissions: { canDelete: true } })],
      onEditComment: () => {},
      moderation: commentModeration,
    });
    await user.click(kebab("Body a"));
    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(kebab("Body b"));
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("permissions.canEdit grants Edit on another's comment", async () => {
    const { user } = setup({
      comments: [comment("a", { permissions: { canEdit: true, canDelete: true } })],
      onEditComment: () => {},
      moderation: commentModeration,
    });
    await user.click(kebab("Body a"));
    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
  });

  it("no Edit item while the comment is pending", async () => {
    const add = deferred<Comment | void>();
    const { user } = setup({
      comments: [],
      onAddComment: () => add.promise,
      onEditComment: () => {},
      moderation: commentModeration,
    });
    await user.type(screen.getByPlaceholderText("Write a comment…"), "mine, pending{Enter}");
    await user.click(kebab("mine, pending"));
    const items = within(await screen.findByRole("menu")).getAllByRole("menuitem");
    expect(items.map((el) => el.textContent)).not.toContain("Edit");
  });

  it("Edit replaces the body with the editor, starting from the content; Escape cancels", async () => {
    const { user } = setup({
      comments: [mine("a", { content: "original text" })],
      onEditComment: () => {},
      moderation: commentModeration,
    });
    await user.click(kebab("original text"));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
    const editor = (await screen.findByLabelText("Edit")) as HTMLTextAreaElement;
    expect(editor.value).toBe("original text");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    await flush(); // the menu hands focus back on a timer; the editor takes it again
    expect(editor).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByLabelText("Edit")).not.toBeInTheDocument();
    expect(screen.getByText("original text")).toBeInTheDocument();
  });

  it("Save patches optimistically (content + edited), calls the handler and closes on success", async () => {
    const save = deferred<void>();
    const onEditComment = vi.fn(() => save.promise);
    const { user } = setup({
      comments: [mine("a", { content: "original text" })],
      onEditComment,
      moderation: commentModeration,
    });
    await user.click(kebab("original text"));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
    const editor = await screen.findByLabelText("Edit");
    await user.clear(editor);
    await user.type(editor, "new words");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onEditComment).toHaveBeenCalledWith("a", "new words");
    await act(async () => save.resolve());
    expect(screen.queryByLabelText("Edit")).not.toBeInTheDocument();
    expect(rowCount("new words")).toBe(1);
    expect(rowQueries("new words").getByText("(edited)")).toBeInTheDocument();
  });

  it("an unchanged Save closes without calling the handler", async () => {
    const onEditComment = vi.fn();
    const { user } = setup({
      comments: [mine("a", { content: "same" })],
      onEditComment,
      moderation: commentModeration,
    });
    await user.click(kebab("same"));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
    await user.click(await screen.findByRole("button", { name: "Save" }));
    expect(onEditComment).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Edit")).not.toBeInTheDocument();
  });

  it("a rejected edit rolls back, keeps the editor with its text, shows editFailed and calls onError", async () => {
    const onError = vi.fn();
    const { user } = setup({
      comments: [mine("a", { content: "keep me" })],
      onEditComment: () => Promise.reject(new Error("no")),
      onError,
      moderation: commentModeration,
    });
    await user.click(kebab("keep me"));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
    const editor = (await screen.findByLabelText("Edit")) as HTMLTextAreaElement;
    await user.clear(editor);
    await user.type(editor, "lost words");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await flush();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save your edit.");
    expect(editor.value).toBe("lost words");
    expect(onError).toHaveBeenCalledWith(expect.any(Error), { kind: "edit", commentId: "a" });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("keep me")).toBeInTheDocument(); // the content came back
    expect(screen.queryByText("(edited)")).not.toBeInTheDocument();
  });

  it("renders a tombstone in place of a non-visible comment and keeps its replies below", () => {
    setup({
      comments: [comment("a", { state: "hidden", replies: [comment("kid")] })],
      moderation: commentModeration,
    });
    expect(screen.getByText("This comment was hidden")).toBeInTheDocument();
    expect(screen.queryByText("Body a")).not.toBeInTheDocument();
    expect(screen.getByText("Body kid")).toBeInTheDocument();
  });

  it("each state has its own tombstone text and labels.tombstone overrides it", () => {
    setup({
      comments: [comment("a", { state: "deleted" }), comment("b", { state: "removed" })],
      moderation: commentModeration,
      labels: { tombstone: (state) => `gone:${state}` },
    });
    expect(screen.getByText("gone:deleted")).toBeInTheDocument();
    expect(screen.getByText("gone:removed")).toBeInTheDocument();
  });

  it('removedMode="tombstone": a removed delta keeps the comment as a tombstone with its replies', async () => {
    const stream = makeStream();
    setup({
      comments: [comment("a", { replies: [comment("kid")] })],
      subscribe: stream.subscribe,
      removedMode: "tombstone",
      moderation: commentModeration,
    });
    await stream.push({ kind: "removed", commentId: "a" });
    expect(screen.getByText("This comment was removed")).toBeInTheDocument();
    expect(screen.getByText("Body kid")).toBeInTheDocument();
  });

  it('removedMode="tombstone": your own delete becomes a "deleted" tombstone', async () => {
    const { user } = setup({
      comments: [mine("a", { replies: [comment("kid")] })],
      removedMode: "tombstone",
      moderation: commentModeration,
      onDeleteComment: () => {},
    });
    await user.click(kebab("Body a"));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(screen.getByText("This comment was deleted")).toBeInTheDocument();
    expect(screen.getByText("Body kid")).toBeInTheDocument();
  });

  it("a `state` delta turns a visible comment into a tombstone", async () => {
    const stream = makeStream();
    setup({ comments: [comment("a")], subscribe: stream.subscribe, moderation: commentModeration });
    await stream.push({ kind: "state", commentId: "a", state: "hidden" });
    expect(screen.getByText("This comment was hidden")).toBeInTheDocument();
  });

  it("shows the pinned marker beside the name, from labels.pinned", () => {
    setup({
      comments: [comment("a", { isPinned: true })],
      moderation: commentModeration,
      labels: { pinned: "Sabitlendi" },
    });
    expect(rowQueries("Body a").getByText("Sabitlendi")).toBeInTheDocument();
  });

  it("does not warn", () => {
    const warn = warnings();
    setup({
      comments: [comment("a", { state: "hidden" })],
      moderation: commentModeration,
      onEditComment: () => {},
      removedMode: "tombstone",
    });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
