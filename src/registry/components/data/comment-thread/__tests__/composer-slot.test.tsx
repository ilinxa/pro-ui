/**
 * `renderComposer` slot helpers — v0.3.1.
 *
 * The slot used to receive `{ value: "", isReply: false, isSubmitting: false }`
 * and three empty-bodied helpers, so a consumer who replaced the composer got a
 * controller that could not set a value, submit, or cancel. `CommentComposer
 * Helpers` promised all three. Nothing caught it: the object matched its type,
 * so tsc and the barrel gate were both green.
 *
 * The second test is the adversarial-review finding on the FIX itself: `submit`
 * originally closed over React state, so the natural call sequence from a custom
 * composer — `setValue(next)` then `submit()` in the same tick — posted the
 * PREVIOUS value. Silently posting stale text is worse than the empty stub it
 * replaced, so it gets its own regression test.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { CommentThread } from "../comment-thread";
import type { CommentComposerHelpers, CommentComposerState } from "../types";

beforeAll(() => {
  // jsdom implements no ResizeObserver; the composer's autosize uses one. Left
  // unstubbed this throws as an UNHANDLED error while the assertions still
  // pass, which vitest correctly flags as a false-positive risk.
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

afterEach(() => cleanup());

const USER = { id: "u1", name: "Ada" };

/** Helpers from the most recent render — see the note in `renderWithSlot`. */
let latestHelpers: CommentComposerHelpers | null = null;

/** A custom composer that drives the slot exactly as a consumer would. */
function renderWithSlot(
  onAddComment: (content: string) => void,
  drive: (helpers: CommentComposerHelpers) => void,
) {
  return render(
    <CommentThread
      comments={[]}
      currentUser={USER}
      onAddComment={(content) => {
        onAddComment(content as string);
      }}
      renderComposer={(state: CommentComposerState, helpers: CommentComposerHelpers) => {
        // Each render hands over FRESH helpers; `submit()` closes over that
        // render's value. Holding on to helpers from an earlier render would
        // submit that render's (stale) value — which is the whole reason the
        // explicit `submit(value)` overload exists.
        latestHelpers = helpers;
        return (
        <div>
          <span data-testid="slot-value">{state.value}</span>
          <span data-testid="slot-submitting">{String(state.isSubmitting)}</span>
          <button type="button" onClick={() => drive(helpers)}>
            drive
          </button>
        </div>
        );
      }}
    />,
  );
}

describe("renderComposer receives working helpers", () => {
  it("setValue actually updates the state handed back to the slot", async () => {
    const onAdd = vi.fn();
    renderWithSlot(onAdd, (h) => h.setValue("hello world"));

    expect(screen.getByTestId("slot-value").textContent).toBe("");
    screen.getByText("drive").click();

    await waitFor(() => {
      expect(screen.getByTestId("slot-value").textContent).toBe("hello world");
    });
  });

  it("submit posts the current value — the empty stub posted nothing at all", async () => {
    const onAdd = vi.fn();
    renderWithSlot(onAdd, (h) => h.setValue("posted text"));

    // Tick 1 — set the value, as an input's onChange would.
    screen.getByText("drive").click();
    await waitFor(() =>
      expect(screen.getByTestId("slot-value").textContent).toBe("posted text"),
    );

    // Tick 2 — a later render, as a real composer's send button would.
    await latestHelpers!.submit();
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith("posted text"));
  });

  it("submit(value) posts an explicit value set in the SAME tick", async () => {
    /*
     * Review finding, and the shape of its fix. `submit` cannot consult a ref
     * to see a value set moments earlier: these helpers are handed to
     * `renderComposer` DURING render, so a ref read there sits on a
     * render-reachable path and the React Compiler lint rejects it outright.
     *
     * The contract is therefore explicit rather than magic — pass the text when
     * both calls happen in one tick. The no-argument form above stays correct
     * for the normal flow, where setValue and submit are separate ticks.
     */
    const onAdd = vi.fn();
    renderWithSlot(onAdd, (h) => {
      h.setValue("second");
      void h.submit("second");
    });

    screen.getByText("drive").click();

    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd).toHaveBeenCalledWith("second");
  });

  it("cancel clears the value", async () => {
    const onAdd = vi.fn();
    renderWithSlot(onAdd, (h) => {
      h.setValue("draft");
      h.cancel();
    });

    screen.getByText("drive").click();

    await waitFor(() => {
      expect(screen.getByTestId("slot-value").textContent).toBe("");
    });
    expect(onAdd).not.toHaveBeenCalled();
  });
});
