import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";

// Stand-in for MediaEditor: renders `overlay` inside a role="dialog" element,
// exactly where the real editor puts it in dialog presentation, and an
// export() that rejects so the composer lands in its "error" publish status.
vi.mock("../../media-editor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../media-editor")>();
  const MediaEditor = React.forwardRef<unknown, { overlay?: React.ReactNode }>(
    function MockEditor(props, ref) {
      React.useImperativeHandle(ref, () => ({
        getMode: () => "photo",
        export: () => Promise.reject(new Error("boom")),
      }));
      return (
        <div role="dialog" data-testid="dialog">
          {props.overlay}
        </div>
      );
    },
  );
  return { ...actual, MediaEditor };
});

import { StoryComposer } from "../story-composer";
import type { StoryComposerHandle } from "../types";

describe("story-composer publishing overlay", () => {
  it("renders the error overlay (Retry) inside the editor's dialog", async () => {
    const ref = React.createRef<StoryComposerHandle>();
    render(
      <StoryComposer
        ref={ref}
        isOpen
        onClose={() => {}}
        onPublished={() => {}}
        onPublishError={() => {}}
        uploadUrl="/noop"
      />,
    );
    expect(screen.getByTestId("dialog").children).toHaveLength(0);

    await act(async () => {
      await ref.current!.publish();
    });

    const dialog = screen.getByRole("dialog");
    const retry = within(dialog).getByRole("button", { name: "Try again" });
    expect(dialog.contains(retry)).toBe(true);
  });

  it("passes a consumer renderPublishingOverlay through the same slot", async () => {
    const ref = React.createRef<StoryComposerHandle>();
    render(
      <StoryComposer
        ref={ref}
        isOpen
        onClose={() => {}}
        onPublished={() => {}}
        onPublishError={() => {}}
        uploadUrl="/noop"
        renderPublishingOverlay={() => <div data-testid="custom">custom</div>}
      />,
    );
    await act(async () => {
      await ref.current!.publish();
    });
    expect(within(screen.getByRole("dialog")).getByTestId("custom")).toBeTruthy();
  });
});
