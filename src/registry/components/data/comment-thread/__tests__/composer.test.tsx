/**
 * The standalone `CommentComposer` (story-viewer uses it with a controlled `value` + `onChange`):
 * a rejected `onSubmit` keeps the text and shows the failure instead of escaping, and the
 * `renderComposer` slot learns about it through `state.hasError`.
 */
import { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentComposer } from "../parts/comment-composer";
import { CommentThread } from "../comment-thread";
import type { CommentComposerHelpers, CommentComposerState } from "../types";
import { ME, NOW, comment, deferred, flush, installDomStubs } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const box = () => screen.getByRole("textbox") as HTMLTextAreaElement;

describe("CommentComposer failure handling", () => {
  it("keeps the text, shows labels.postFailed (role=alert), calls onError and never rejects", async () => {
    const unhandled: unknown[] = [];
    const hook = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", hook);
    const onError = vi.fn();
    const user = userEvent.setup();
    render(
      <CommentComposer
        onSubmit={() => Promise.reject(new Error("offline"))}
        onError={onError}
        errorClassName="custom-alert"
      />,
    );
    await user.type(box(), "hello{Enter}");
    await flush();
    expect(box().value).toBe("hello");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Couldn't post your comment. Try again.");
    expect(alert).toHaveClass("custom-alert");
    expect(box()).toHaveAttribute("aria-invalid", "true");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "offline" }));
    process.off("unhandledRejection", hook);
    expect(unhandled).toEqual([]);
  });

  it("the alert clears on the next input and on a successful submit", async () => {
    let fail = true;
    const user = userEvent.setup();
    render(
      <CommentComposer
        onSubmit={async () => {
          if (fail) throw new Error("x");
        }}
      />,
    );
    await user.type(box(), "one{Enter}");
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.type(box(), "!");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fail = true;
    await user.keyboard("{Enter}");
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fail = false;
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(box().value).toBe("");
  });

  it("uses labels.postFailed for the message", async () => {
    const user = userEvent.setup();
    render(
      <CommentComposer
        onSubmit={() => Promise.reject(new Error("x"))}
        labels={{ postFailed: "Gönderilemedi" }}
      />,
    );
    await user.type(box(), "a{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("Gönderilemedi");
  });

  it("story-viewer style: controlled value + onChange keeps the text on rejection", async () => {
    function Host() {
      const [value, setValue] = useState("");
      return (
        <CommentComposer
          value={value}
          onChange={setValue}
          onSubmit={() => Promise.reject(new Error("x"))}
        />
      );
    }
    const user = userEvent.setup();
    render(<Host />);
    await user.type(box(), "a story reply{Enter}");
    expect(box().value).toBe("a story reply");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("a sync onSubmit still works and the English fallbacks come from defaultCommentThreadLabels", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CommentComposer onSubmit={onSubmit} />);
    expect(screen.getByPlaceholderText("Write a comment…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    await user.type(box(), "ok{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("ok");
  });

  it("Send keeps focus while submitting (aria-disabled, not disabled) and ignores clicks", async () => {
    const pending = deferred<void>();
    const onSubmit = vi.fn(() => pending.promise);
    const user = userEvent.setup();
    render(<CommentComposer onSubmit={onSubmit} />);
    await user.type(box(), "text");
    const send = screen.getByRole("button", { name: "Send" });
    await user.click(send);
    expect(send).toHaveFocus();
    expect(send).toHaveAttribute("aria-disabled", "true");
    expect(send).not.toBeDisabled(); // a disabled button drops focus to <body> in a browser
    await user.click(send);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve());
    expect(send).toHaveFocus();
  });

  it("the textarea stays focusable while a post is in flight (readOnly, not disabled)", async () => {
    const pending = deferred<void>();
    const user = userEvent.setup();
    render(<CommentComposer onSubmit={() => pending.promise} />);
    await user.type(box(), "text{Enter}");
    expect(box()).toHaveFocus();
    expect(box()).toHaveAttribute("readonly");
    expect(box()).not.toBeDisabled();
    await act(async () => pending.resolve());
  });
});

describe("the renderComposer slot", () => {
  it("submit never rejects and reports the failure as state.hasError until the value changes", async () => {
    let helpers!: CommentComposerHelpers;
    let state!: CommentComposerState;
    render(
      <CommentThread
        now={NOW}
        comments={[comment("a")]}
        currentUser={ME}
        onAddComment={() => Promise.reject(new Error("x"))}
        renderComposer={(s, h) => {
          state = s;
          helpers = h;
          return <div data-testid="slot" />;
        }}
      />,
    );
    await act(async () => {
      helpers.setValue("draft");
    });
    expect(state.hasError).toBe(false);
    await act(async () => {
      await expect(helpers.submit()).resolves.toBeUndefined();
    });
    expect(state.hasError).toBe(true);
    expect(state.value).toBe("draft");
    await act(async () => {
      helpers.setValue("draft 2");
    });
    expect(state.hasError).toBe(false);
  });
});
