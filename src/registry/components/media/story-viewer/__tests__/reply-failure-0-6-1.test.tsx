/**
 * story-viewer 0.6.1 — the reply composer on comment-thread 0.4.0.
 *
 * A rejected `onAddReply` keeps the typed text, shows `labels.replyFailed` (or
 * `labels.commentLabels.postFailed`) as an alert, keeps the story paused (the draft holds
 * `reply-focus`) and leaves no unhandled rejection. A successful send clears the box and the
 * alert.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { Story } from "../types";

const story: Story = {
  id: "A",
  userId: "u-A",
  username: "A",
  items: [{ id: "a1", type: "image", src: "a1.jpg" }],
  createdAt: "2026-01-01T00:00:00Z",
};

const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
let unhandled: unknown[] = [];
const onUnhandled = (reason: unknown) => unhandled.push(reason);
beforeEach(() => {
  unhandled = [];
  process.on("unhandledRejection", onUnhandled);
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => true,
  });
});
afterEach(() => {
  cleanup();
  process.off("unhandledRejection", onUnhandled);
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

function mount(extra: Record<string, unknown>) {
  const onPauseReasonsChange = vi.fn();
  render(
    <StoryViewer
      stories={[story]}
      isOpen
      initialStoryIndex={0}
      onClose={() => {}}
      disableStoryTransition
      viewerMode="viewer"
      currentUser={{ id: "me", name: "Me" }}
      onPauseReasonsChange={onPauseReasonsChange}
      {...extra}
    />,
  );
  return { onPauseReasonsChange, input: screen.getByLabelText("Reply to A") as HTMLTextAreaElement };
}

async function send(input: HTMLTextAreaElement, text: string) {
  fireEvent.change(input, { target: { value: text } });
  await act(async () => {
    fireEvent.keyDown(input, { key: "Enter" });
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("story-viewer 0.6.1 — reply failure", () => {
  it("a rejected onAddReply keeps the text, shows the alert and keeps the story paused", async () => {
    const onAddReply = vi.fn().mockRejectedValue(new Error("offline"));
    const { input, onPauseReasonsChange } = mount({ onAddReply });
    await send(input, "hello");

    expect(onAddReply).toHaveBeenCalledWith("A", "a1", "hello");
    expect(input.value).toBe("hello");
    expect(screen.getByRole("alert").textContent).toBe("Couldn't send your reply. Try again.");
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["reply-focus"]);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(unhandled).toEqual([]);
  });

  it("labels.replyFailed and commentLabels.postFailed override the alert (postFailed wins)", async () => {
    const onAddReply = vi.fn().mockRejectedValue(new Error("offline"));
    const { input } = mount({
      onAddReply,
      labels: { replyFailed: "R-failed", commentLabels: { postFailed: "P-failed" } },
    });
    await send(input, "x");
    expect(screen.getByRole("alert").textContent).toBe("P-failed");
  });

  it("labels.replyFailed is used when commentLabels.postFailed is not set", async () => {
    const onAddReply = vi.fn().mockRejectedValue(new Error("offline"));
    const { input } = mount({ onAddReply, labels: { replyFailed: "R-failed" } });
    await send(input, "x");
    expect(screen.getByRole("alert").textContent).toBe("R-failed");
  });

  it("a successful send after a failure clears the text and the alert", async () => {
    const onAddReply = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    const { input } = mount({ onAddReply });
    await send(input, "again");
    expect(screen.getByRole("alert")).toBeTruthy();
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(onAddReply).toHaveBeenCalledTimes(2);
    expect(input.value).toBe("");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("labels.commentLabels.composerPlaceholder reaches the reply box (it had no effect)", () => {
    mount({ onAddReply: vi.fn(), labels: { commentLabels: { composerPlaceholder: "Yanıtla…" } } });
    expect(screen.getByPlaceholderText("Yanıtla…")).toBeTruthy();
  });
});
