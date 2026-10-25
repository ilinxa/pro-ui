import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoryComposer } from "../story-composer";
import type { StoryComposerProps } from "../types";

/**
 * Against the REAL MediaEditor in dialog presentation (S2, S10). With nothing loaded,
 * `export()` rejects, which is the cheapest way to reach the error overlay.
 */
describe("overlay keyboard + focus against the real editor", () => {
  afterEach(() => cleanup());

  async function mount(props: Partial<StoryComposerProps> = {}) {
    const onClose = vi.fn();
    await act(async () => {
      render(
        <StoryComposer
          isOpen
          presentation="modal"
          onClose={onClose}
          onPublished={() => {}}
          uploadUrl="/noop"
          renderTopBar={(ctx) => (
            <button type="button" data-testid="go" onClick={() => void ctx.publish()}>
              go
            </button>
          )}
          {...props}
        />,
      );
    });
    return { onClose };
  }
  const dialog = () => screen.getByRole("dialog");

  it("S2: Escape inside the details step is Back and does not close the dialog", async () => {
    const user = userEvent.setup();
    const { onClose } = await mount({ caption: {} });
    await user.click(screen.getByTestId("go"));
    expect(within(dialog()).getByRole("region")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(within(dialog()).queryByRole("region")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog()).toBeInTheDocument();
  });

  it("S2: Escape on the error overlay does nothing", async () => {
    const user = userEvent.setup();
    const { onClose } = await mount();
    await user.click(screen.getByTestId("go"));
    await within(dialog()).findByRole("button", { name: "Try again" });
    await user.keyboard("{Escape}");
    expect(within(dialog()).getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("S10: caption takes focus; Back returns focus to the control that opened the step", async () => {
    const user = userEvent.setup();
    await mount({ caption: {} });
    const go = screen.getByTestId("go");
    await user.click(go);
    await waitFor(() => expect(screen.getByLabelText("Caption")).toHaveFocus());
    await user.click(within(dialog()).getByRole("button", { name: "Back" }));
    await waitFor(() => expect(go).toHaveFocus());
  });

  it("S10: the error overlay focuses Retry; Cancel returns focus to the trigger", async () => {
    const user = userEvent.setup();
    await mount();
    const go = screen.getByTestId("go");
    await user.click(go);
    const retry = await within(dialog()).findByRole("button", { name: "Try again" });
    await waitFor(() => expect(retry).toHaveFocus());
    await user.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(go).toHaveFocus());
  });
});
