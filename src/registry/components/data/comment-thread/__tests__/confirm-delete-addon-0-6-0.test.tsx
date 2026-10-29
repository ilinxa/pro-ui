/**
 * `comment-thread-confirm-delete`: the dialog on its own — labels, one answer per request,
 * Escape / Cancel / Confirm, text kept through close, and opening right after a menu item click.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commentDeleteConfirm, CommentDeleteConfirmDialog } from "../features/confirm-delete";
import { CommentKebab } from "../parts/comment-kebab";
import { resolveLabels } from "../lib/labels";
import type { CommentDeleteRequest } from "../types";
import { comment, installDomStubs } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const labels = resolveLabels(undefined);
const req = (hasReplies = false): CommentDeleteRequest => ({ comment: comment("a"), hasReplies });
const flushTimers = () => act(async () => void (await new Promise((r) => setTimeout(r, 20))));

async function openDialog(request: CommentDeleteRequest | null, onResolve = vi.fn()) {
  const utils = render(<CommentDeleteConfirmDialog request={request} labels={labels} onResolve={onResolve} />);
  await flushTimers();
  return { onResolve, ...utils };
}

describe("CommentDeleteConfirmDialog", () => {
  it("is exported as the extension's Dialog", () => {
    expect(commentDeleteConfirm.Dialog).toBe(CommentDeleteConfirmDialog);
  });

  it("is closed while request is null", async () => {
    await openDialog(null);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows the labels; the body follows hasReplies", async () => {
    const { unmount } = await openDialog(req(false));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Delete comment?")).toBeInTheDocument();
    expect(screen.getByText(labels.deleteBody(false))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    unmount();
    await openDialog(req(true));
    expect(screen.getByText(labels.deleteBody(true))).toBeInTheDocument();
  });

  it("Cancel answers false once", async () => {
    const { onResolve } = await openDialog(req());
    await userEvent.setup().click(screen.getByRole("button", { name: "Cancel" }));
    expect(onResolve.mock.calls).toEqual([[false]]);
  });

  it("Delete answers true once", async () => {
    const { onResolve } = await openDialog(req());
    await userEvent.setup().click(screen.getByRole("button", { name: "Delete" }));
    expect(onResolve.mock.calls).toEqual([[true]]);
  });

  it("Escape answers false once", async () => {
    const { onResolve } = await openDialog(req());
    await userEvent.setup().keyboard("{Escape}");
    expect(onResolve.mock.calls).toEqual([[false]]);
  });

  it("Escape then Cancel on the same request still answers once", async () => {
    const { onResolve } = await openDialog(req());
    const user = userEvent.setup();
    await user.keyboard("{Escape}");
    const cancel = screen.queryByRole("button", { name: "Cancel" });
    if (cancel) await user.click(cancel);
    expect(onResolve).toHaveBeenCalledTimes(1);
  });

  it("answers a second request after the first closed", async () => {
    const onResolve = vi.fn();
    const first = req(true);
    const { rerender } = await openDialog(first, onResolve);
    rerender(<CommentDeleteConfirmDialog request={null} labels={labels} onResolve={onResolve} />);
    await flushTimers();
    rerender(<CommentDeleteConfirmDialog request={req()} labels={labels} onResolve={onResolve} />);
    await flushTimers();
    await userEvent.setup().click(screen.getByRole("button", { name: "Delete" }));
    expect(onResolve.mock.calls).toEqual([[true]]);
  });

  it("opens when the request appears right after a menu item click", async () => {
    const onResolve = vi.fn();
    function Host() {
      const [request, setRequest] = useState<CommentDeleteRequest | null>(null);
      return (
        <>
          <CommentKebab
            ariaLabel="Actions"
            items={[{ label: "Delete", destructive: true, onClick: () => setRequest(req()) }]}
          />
          <CommentDeleteConfirmDialog
            request={request}
            labels={labels}
            onResolve={(ok) => {
              onResolve(ok);
              setRequest(null);
            }}
          />
        </>
      );
    }
    render(<Host />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    await flushTimers();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onResolve.mock.calls).toEqual([[true]]);
  });
});
