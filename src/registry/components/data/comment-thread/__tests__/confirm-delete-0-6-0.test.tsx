/**
 * 0.6.0 confirmDelete (root side): the function form, the extension (dialog) form, focus
 * hand-offs, single-flight, and `handle.deleteComment` skipping the confirmation.
 * The built-in Delete item is wired to `ctx.requestDelete` by the rows; these tests drive
 * `requestDelete` directly through the thread context.
 */
import { createRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CommentThreadComposer,
  CommentThreadList,
  CommentThreadRoot,
  type CommentDeleteDialogProps,
  type CommentDeleteRequest,
  type CommentThreadHandle,
  type CommentThreadRootProps,
} from "../index";
import { useThreadContext } from "../parts/thread-context";
import { ME, NOW, comment, deferred, flush, installDomStubs, mine, rowCount } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

/** One "ask-<id>" button per id: starts a delete exactly like a row's Delete item will. */
function Asker({ ids }: { ids: string[] }) {
  const ctx = useThreadContext();
  return (
    <div>
      {ids.map((id) => (
        <button key={id} onClick={() => ctx.requestDelete(id)}>
          ask-{id}
        </button>
      ))}
    </div>
  );
}

const tree = () => [
  mine("a", { replies: [comment("a1")] }),
  mine("b"),
  mine("c", { replyCount: 3 }),
];

type Props = Omit<CommentThreadRootProps, "children" | "comments"> & { comments?: CommentThreadRootProps["comments"] };
function Thread(props: Props & { ref?: React.Ref<CommentThreadHandle>; composer?: boolean }) {
  const { composer = false, ...rest } = props;
  return (
    <CommentThreadRoot now={NOW} currentUser={ME} comments={tree()} {...rest}>
      <Asker ids={["a", "b", "c", "a1", "zzz"]} />
      <CommentThreadList />
      {composer ? <CommentThreadComposer /> : null}
    </CommentThreadRoot>
  );
}
const ask = (id: string) => userEvent.setup().click(screen.getByRole("button", { name: `ask-${id}` }));

describe("no confirmDelete", () => {
  it("deletes at once (today's behaviour)", async () => {
    const onDeleteComment = vi.fn(async () => undefined);
    render(<Thread onDeleteComment={onDeleteComment} />);
    await ask("b");
    expect(rowCount("Body b")).toBe(0);
    expect(onDeleteComment).toHaveBeenCalledWith("b");
  });
});

describe("confirmDelete as a function", () => {
  it("true removes; the request carries the comment and hasReplies", async () => {
    const seen: CommentDeleteRequest[] = [];
    const confirmDelete = vi.fn(async (r: CommentDeleteRequest) => {
      seen.push(r);
      return true;
    });
    render(<Thread confirmDelete={confirmDelete} />);
    await ask("a"); // loaded replies
    await waitFor(() => expect(rowCount("Body a")).toBe(0));
    await ask("c"); // replyCount only
    await ask("b"); // none
    await waitFor(() => expect(rowCount("Body b")).toBe(0));
    expect(seen.map((r) => [r.comment.id, r.hasReplies])).toEqual([
      ["a", true],
      ["c", true],
      ["b", false],
    ]);
  });

  it("false keeps the comment and never calls onDeleteComment", async () => {
    const onDeleteComment = vi.fn();
    render(<Thread confirmDelete={() => false} onDeleteComment={onDeleteComment} />);
    await ask("b");
    await flush();
    expect(rowCount("Body b")).toBe(1);
    expect(onDeleteComment).not.toHaveBeenCalled();
  });

  it("a rejection or a throw keeps the comment", async () => {
    const { unmount } = render(<Thread confirmDelete={() => Promise.reject(new Error("x"))} />);
    await ask("b");
    await flush();
    expect(rowCount("Body b")).toBe(1);
    unmount();
    render(
      <Thread
        confirmDelete={() => {
          throw new Error("sync");
        }}
      />,
    );
    await ask("b");
    await flush();
    expect(rowCount("Body b")).toBe(1);
  });

  it("is single-flight per comment: asking the same comment again is ignored; another supersedes", async () => {
    const answer = deferred<boolean>();
    const confirmDelete = vi.fn(() => answer.promise);
    render(<Thread confirmDelete={confirmDelete} />);
    await ask("a");
    await ask("a");
    expect(confirmDelete).toHaveBeenCalledTimes(1);
    await ask("b");
    expect(confirmDelete).toHaveBeenCalledTimes(2);
    await act(async () => {
      answer.resolve(false);
      await flush();
    });
    await ask("b");
    expect(confirmDelete).toHaveBeenCalledTimes(3);
  });

  it("an unknown id asks nothing; a comment gone before the answer is not removed again", async () => {
    const answer = deferred<boolean>();
    const confirmDelete = vi.fn(() => answer.promise);
    const onDeleteComment = vi.fn(async () => undefined);
    const ref = createRef<CommentThreadHandle>();
    render(<Thread ref={ref} confirmDelete={confirmDelete} onDeleteComment={onDeleteComment} />);
    await ask("zzz");
    expect(confirmDelete).not.toHaveBeenCalled();
    await ask("b");
    act(() => ref.current!.dispatch({ kind: "remove", commentId: "b" })); // a realtime delete
    await act(async () => {
      answer.resolve(true);
      await flush();
    });
    expect(onDeleteComment).not.toHaveBeenCalled();
  });
});

describe("confirmDelete as an extension", () => {
  /** A dialog with two buttons; no role=dialog so the focus hand-off need not wait on a portal. */
  function FakeDialog({ request, onResolve, labels }: CommentDeleteDialogProps) {
    if (!request) return null;
    return (
      <div data-testid="fake-dialog">
        <p>{labels.deleteBody(request.hasReplies)}</p>
        <button onClick={() => onResolve(true)}>yes</button>
        <button onClick={() => onResolve(false)}>no</button>
      </div>
    );
  }
  const extension = { Dialog: FakeDialog };

  it("renders the dialog closed, opens it with the request, confirm removes", async () => {
    const onDeleteComment = vi.fn(async () => undefined);
    const user = userEvent.setup();
    render(<Thread confirmDelete={extension} onDeleteComment={onDeleteComment} />);
    expect(screen.queryByTestId("fake-dialog")).toBeNull();
    await ask("a");
    expect(screen.getByTestId("fake-dialog")).toHaveTextContent("Its replies will be deleted too");
    await user.click(screen.getByRole("button", { name: "yes" }));
    await waitFor(() => expect(rowCount("Body a")).toBe(0));
    expect(screen.queryByTestId("fake-dialog")).toBeNull();
    expect(onDeleteComment).toHaveBeenCalledWith("a");
  });

  it("cancel keeps the comment and returns focus to the row's actions trigger", async () => {
    const user = userEvent.setup();
    render(<Thread confirmDelete={extension} />);
    const trigger = screen
      .getAllByRole("button", { name: /Comment actions for/ })
      .find((b) => b.closest("[data-comment-id]")?.getAttribute("data-comment-id") === "b");
    // The kebab trigger carries `data-comment-kebab` in the rows (wired by the row parts).
    trigger?.setAttribute("data-comment-kebab", "");
    await ask("b");
    await user.click(screen.getByRole("button", { name: "no" }));
    expect(rowCount("Body b")).toBe(1);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("confirm hands focus to the neighbouring row", async () => {
    const user = userEvent.setup();
    render(<Thread confirmDelete={extension} />);
    await ask("b");
    await user.click(screen.getByRole("button", { name: "yes" }));
    await waitFor(() => expect(rowCount("Body b")).toBe(0));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Body c").closest("article")));
  });


  it("abandons the hand-off when focus went elsewhere meanwhile (never double-focus)", async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="elsewhere" />
        <Thread confirmDelete={extension} />
      </>,
    );
    await ask("b");
    await user.click(screen.getByRole("button", { name: "yes" }));
    screen.getByLabelText("elsewhere").focus();
    await waitFor(() => expect(rowCount("Body b")).toBe(0));
    await new Promise((r) => setTimeout(r, 150));
    expect(document.activeElement).toBe(screen.getByLabelText("elsewhere"));
  });

  it("handle.deleteComment never asks; unknown ids do nothing", async () => {
    const onDeleteComment = vi.fn(async () => undefined);
    const confirmDelete = vi.fn(() => false);
    const ref = createRef<CommentThreadHandle>();
    render(<Thread ref={ref} confirmDelete={confirmDelete} onDeleteComment={onDeleteComment} />);
    act(() => ref.current!.deleteComment("zzz"));
    expect(onDeleteComment).not.toHaveBeenCalled();
    act(() => ref.current!.deleteComment("b"));
    await waitFor(() => expect(rowCount("Body b")).toBe(0));
    expect(onDeleteComment).toHaveBeenCalledWith("b");
    expect(confirmDelete).not.toHaveBeenCalled();
  });
});

describe("confirm focus: last row", () => {
  function Dlg({ request, onResolve }: CommentDeleteDialogProps) {
    return request ? <button onClick={() => onResolve(true)}>yes</button> : null;
  }
  it("falls back to the composer textarea when no neighbour is left", async () => {
    const user = userEvent.setup();
    render(
      <CommentThreadRoot now={NOW} currentUser={ME} comments={[mine("only")]} confirmDelete={{ Dialog: Dlg }}>
        <Asker ids={["only"]} />
        <CommentThreadList />
        <CommentThreadComposer />
      </CommentThreadRoot>,
    );
    await ask("only");
    await user.click(screen.getByRole("button", { name: "yes" }));
    await waitFor(() => expect(rowCount("Body only")).toBe(0));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox")));
  });
});
