import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoryComposer } from "../story-composer";
import { EXPORT_METADATA } from "./mock-editor";

/**
 * The REAL MediaEditor (dialog presentation), with only `export()` on its handle stubbed so a
 * publish can succeed in jsdom (no canvas). The host opens the composer with its own button —
 * there is no DialogTrigger — and closes it from `onClose` / `onPublished`, as the platform does.
 */
vi.mock("../../media-editor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../media-editor")>();
  const Real = actual.MediaEditor;
  const MediaEditor = React.forwardRef<unknown, React.ComponentProps<typeof Real>>(
    function MediaEditorWithStubbedExport(props, ref) {
      const inner = React.useRef<Record<string, unknown> | null>(null);
      React.useImperativeHandle(
        ref,
        () =>
          new Proxy(
            {},
            {
              get: (_t, key) =>
                key === "export"
                  ? async () => ({
                      blob: new Blob(["x"], { type: "image/png" }),
                      metadata: EXPORT_METADATA,
                    })
                  : inner.current?.[key as string],
            },
          ),
        [],
      );
      return <Real {...props} ref={inner as never} />;
    },
  );
  return { ...actual, MediaEditor };
});

function Host({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open composer
      </button>
      <StoryComposer
        isOpen={open}
        presentation="modal"
        onClose={() => setOpen(false)}
        uploader={async () => ({ url: "https://cdn.test/story.png", id: "s1" })}
        onPublished={() => {
          setOpen(false);
          onDone?.();
        }}
        renderTopBar={(ctx) => (
          <div>
            <button type="button" onClick={() => ctx.cancel()}>
              Close composer
            </button>
            <button type="button" onClick={() => void ctx.publish()}>
              Publish now
            </button>
          </div>
        )}
      />
    </>
  );
}

const opener = () => screen.getByRole("button", { name: "Open composer" });

async function openComposer() {
  const user = userEvent.setup();
  render(<Host />);
  await user.click(opener());
  await screen.findByRole("dialog");
  return user;
}

describe("focus returns to the host's opener when the composer dialog closes", () => {
  afterEach(() => cleanup());

  it("after Escape", async () => {
    const user = await openComposer();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener()));
  });

  it("after the top-bar close button", async () => {
    const user = await openComposer();
    await user.click(screen.getByRole("button", { name: "Close composer" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener()));
  });

  it("after a successful publish closes it from onPublished", async () => {
    const user = await openComposer();
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Publish now" }));
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener()));
  });

  it("leaves focus alone when the host moves it somewhere else after close", async () => {
    // A synchronous focus() inside onClose loses to the still-active focus trap; a host that
    // moves focus once the dialog is closed (here: an effect on `open`) must win.
    const user = userEvent.setup();
    function FocusingHost() {
      const [open, setOpen] = React.useState(false);
      const other = React.useRef<HTMLButtonElement>(null);
      const wasOpen = React.useRef(false);
      React.useEffect(() => {
        if (wasOpen.current && !open) other.current?.focus();
        wasOpen.current = open;
      }, [open]);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open composer
          </button>
          <button type="button" ref={other}>
            Elsewhere
          </button>
          <StoryComposer
            isOpen={open}
            presentation="modal"
            onClose={() => setOpen(false)}
            uploader={async () => ({ url: "u" })}
            onPublished={() => setOpen(false)}
          />
        </>
      );
    }
    render(<FocusingHost />);
    await user.click(opener());
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // give any deferred restore a chance to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Elsewhere" }));
  });
});
