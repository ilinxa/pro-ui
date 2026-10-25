import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";
import { EXPORT_METADATA, editorMock, resetEditorMock } from "./mock-editor";

vi.mock("../../media-editor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../media-editor")>();
  const { createMockEditor } = await import("./mock-editor");
  return { ...actual, MediaEditor: createMockEditor() };
});

import { normalizeEditorLabels } from "../../media-editor/lib/normalize-labels";
import { DEFAULT_LABELS } from "../../media-editor/types";
import { StoryComposer } from "../story-composer";
import { PublishingProgressOverlay } from "../parts/publishing-progress-overlay";
import {
  DEFAULT_STORY_COMPOSER_LABELS,
  type ComposerCtx,
  type PublishResult,
  type StoryComposerHandle,
  type StoryComposerProps,
  type Uploader,
} from "../types";

const okUploader: Uploader = async () => ({ url: "https://cdn/x.png" });

function composer(props: Partial<StoryComposerProps> = {}) {
  return <StoryComposer isOpen onClose={() => {}} onPublished={() => {}} uploader={okUploader} {...props} />;
}

const dialog = () => screen.getByRole("dialog");
const details = () => within(dialog()).getByRole("region");
const queryDetails = () => within(dialog()).queryByRole("region");
const topBarPublish = () => dialog().querySelector<HTMLButtonElement>('[data-testid="editor-body"] button[aria-busy]')!;

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => resetEditorMock());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── S1 ────────────────────────────────────────────────────────────────

describe("S1 every editor-relevant flat label reaches the editor", () => {
  it("forwards every StoryComposerLabels key that is also an editor flat key", () => {
    const editorFlat = Object.keys(normalizeEditorLabels(DEFAULT_LABELS));
    const overlap = Object.entries(DEFAULT_STORY_COMPOSER_LABELS)
      .filter(([k, v]) => typeof v === "string" && editorFlat.includes(k))
      .map(([k]) => k);
    for (const named of [
      "composerLabel", "composerDescription", "shutterPhoto", "shutterVideoStart", "shutterVideoStop",
      "recordingLabel", "drawColor", "drawBrush", "drawEraser", "textPlaceholder", "textFontFamily",
      "textFontSize",
    ]) {
      expect(overlap, named).toContain(named);
    }
    const overrides = Object.fromEntries(overlap.map((k) => [k, `OVR-${k}`]));
    render(composer({ labels: { ...overrides, publish: "OVR-publish", close: "OVR-close", uploadCancel: "OVR-uc", detailsBack: "OVR-db" } }));
    const resolved = normalizeEditorLabels(editorMock.props!.labels) as Record<string, unknown>;
    for (const k of overlap) expect(resolved[k], k).toBe(`OVR-${k}`);
    // story-composer's own keys never leak into the editor's label set
    for (const own of ["publish", "close", "uploadCancel", "detailsBack"]) expect(resolved[own]).toBeUndefined();
  });
});

// ─── S3 / S4 ───────────────────────────────────────────────────────────

describe("S3 state survives close / reopen", () => {
  it("close mid-details then reopen: no details step, empty caption, status idle", async () => {
    const statuses: string[] = [];
    const user = userEvent.setup();
    const props = {
      caption: { maxLength: 50 },
      renderPublishFields: ({ status }: { status: string }) => {
        statuses.push(status);
        return null;
      },
    } satisfies Partial<StoryComposerProps>;
    const { rerender } = render(composer(props));
    await user.click(topBarPublish());
    await user.type(screen.getByLabelText("Caption"), "draft text");
    rerender(composer({ ...props, isOpen: false }));
    expect(queryDetails()).toBeNull();
    rerender(composer(props));
    expect(queryDetails()).toBeNull();
    await user.click(topBarPublish());
    expect(screen.getByLabelText("Caption")).toHaveValue("");
    expect(statuses[statuses.length - 1]).toBe("idle");
  });

  it("closing cancels an in-flight publish: onPublished never fires", async () => {
    const slow = deferred<PublishResult>();
    const onPublished = vi.fn();
    const props = { uploader: () => slow.promise, onPublished };
    const { rerender } = render(composer(props));
    await act(async () => topBarPublish().click());
    await within(dialog()).findByRole("button", { name: "Keep editing" });
    rerender(composer({ ...props, isOpen: false }));
    expect(within(dialog()).queryByRole("button", { name: "Keep editing" })).toBeNull();
    await act(async () => slow.resolve({ url: "https://cdn/late.png" }));
    expect(onPublished).not.toHaveBeenCalled();
  });

  it("after a success status settles back to idle (reopen, or next details-open)", async () => {
    const statuses: string[] = [];
    const onPublished = vi.fn();
    const user = userEvent.setup();
    const props = {
      onPublished,
      caption: {},
      renderPublishFields: ({ status }: { status: string }) => {
        statuses.push(status);
        return null;
      },
    } satisfies Partial<StoryComposerProps>;
    const { rerender } = render(composer(props));
    await user.click(topBarPublish());
    await user.click(within(details()).getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(1));
    const region = screen.getAllByRole("status").find((n) => n.className.includes("sr-only"))!;
    await waitFor(() => expect(region).toHaveTextContent("Published"));
    // reopen
    rerender(composer({ ...props, isOpen: false }));
    rerender(composer(props));
    await waitFor(() => expect(region).toHaveTextContent(""));
    await user.click(topBarPublish());
    expect(statuses[statuses.length - 1]).toBe("idle");
  });

  it("S4: the guide example works on the second story (publish twice in one mount)", async () => {
    const onPublished = vi.fn();
    const user = userEvent.setup();
    render(composer({ onPublished, caption: {} }));
    for (let i = 0; i < 2; i++) {
      await user.click(topBarPublish());
      expect(screen.getByLabelText("Caption")).toHaveValue("");
      await user.type(screen.getByLabelText("Caption"), `story ${i}`);
      await user.click(within(details()).getByRole("button", { name: "Publish" }));
      await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(i + 1));
    }
  });
});

// ─── S5 / S6 / S7 ──────────────────────────────────────────────────────

describe("S5 Cancel then Publish again", () => {
  it("the cancelled run can never publish: onPublished fires once, for the second run", async () => {
    const first = deferred<PublishResult>();
    const second = deferred<PublishResult>();
    const queue = [first, second];
    const uploader = vi.fn<Uploader>(() => queue.shift()!.promise);
    const onPublished = vi.fn();
    const user = userEvent.setup();
    render(composer({ uploader, onPublished }));
    await act(async () => topBarPublish().click());
    await user.click(await within(dialog()).findByRole("button", { name: "Keep editing" }));
    await act(async () => topBarPublish().click());
    await waitFor(() => expect(uploader).toHaveBeenCalledTimes(2));
    await act(async () => {
      first.resolve({ url: "https://cdn/first.png" });
      second.resolve({ url: "https://cdn/second.png" });
    });
    await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(1));
    expect(onPublished.mock.calls[0][0].items[0].src).toBe("https://cdn/second.png");
  });
});

describe("S6 re-entrancy and reset() mid-publish", () => {
  it("publish(); publish() uploads once", async () => {
    const slow = deferred<PublishResult>();
    const uploader = vi.fn<Uploader>(() => slow.promise);
    const handle = { current: null as StoryComposerHandle | null };
    let exports = 0;
    editorMock.exportImpl = async () => {
      exports += 1;
      return { blob: new Blob(["x"], { type: "image/png" }), metadata: EXPORT_METADATA };
    };
    render(<StoryComposer ref={(h) => void (handle.current = h)} isOpen onClose={() => {}} onPublished={() => {}} uploader={uploader} />);
    await act(async () => {
      void handle.current!.publish();
      void handle.current!.publish();
    });
    await waitFor(() => expect(uploader).toHaveBeenCalledTimes(1));
    await act(async () => slow.resolve({ url: "https://cdn/a.png" }));
    expect(uploader).toHaveBeenCalledTimes(1);
    expect(exports).toBe(1); // the second call never started a second flow
  });

  it("publish(); reset() cancels the flow: no onPublished", async () => {
    const slow = deferred<PublishResult>();
    const onPublished = vi.fn();
    const handle = { current: null as StoryComposerHandle | null };
    render(<StoryComposer ref={(h) => void (handle.current = h)} isOpen onClose={() => {}} onPublished={onPublished} uploader={() => slow.promise} />);
    await act(async () => {
      void handle.current!.publish();
      handle.current!.reset();
    });
    await act(async () => slow.resolve({ url: "https://cdn/a.png" }));
    expect(onPublished).not.toHaveBeenCalled();
  });
});

describe("S7 a throwing onPublished is not an upload failure", () => {
  it("no error overlay, no onPublishError; the error surfaces to the publish() caller", async () => {
    const onPublishError = vi.fn();
    const handle = { current: null as StoryComposerHandle | null };
    render(
      <StoryComposer
        ref={(h) => void (handle.current = h)}
        isOpen
        onClose={() => {}}
        uploader={okUploader}
        onPublishError={onPublishError}
        onPublished={() => {
          throw new Error("host bug");
        }}
      />,
    );
    let caught: unknown;
    await act(async () => {
      await handle.current!.publish().catch((e) => void (caught = e));
    });
    expect((caught as Error).message).toBe("host bug");
    expect(onPublishError).not.toHaveBeenCalled();
    expect(within(dialog()).queryByText("Upload failed")).toBeNull();
    const region = screen.getAllByRole("status").find((n) => n.className.includes("sr-only"))!;
    expect(region).toHaveTextContent("Published");
  });
});

// ─── S8 ────────────────────────────────────────────────────────────────

describe("S8 gated publish() is not silent", () => {
  it("blocked without a details step: dev-warns once and resolves without publishing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const uploader = vi.fn(okUploader);
    const handle = { current: null as StoryComposerHandle | null };
    render(<StoryComposer ref={(h) => void (handle.current = h)} isOpen onClose={() => {}} onPublished={() => {}} uploader={uploader} canPublish={() => false} />);
    await act(async () => handle.current!.publish());
    await act(async () => handle.current!.publish());
    expect(uploader).not.toHaveBeenCalled();
    const hits = warn.mock.calls.filter((c) => String(c[0]).includes("publish() was blocked by caption.required / canPublish"));
    expect(hits).toHaveLength(1);
  });

  it("ctx.openDetails() opens the step; ctx.publish() with a details step opens it too", async () => {
    let ctx!: ComposerCtx;
    render(
      composer({
        caption: {},
        renderTopBar: (c) => {
          ctx = c;
          return null;
        },
      }),
    );
    expect(queryDetails()).toBeNull();
    await act(async () => ctx.openDetails());
    expect(details()).toBeInTheDocument();
    await act(async () => within(details()).getByRole("button", { name: "Back" }).click());
    expect(queryDetails()).toBeNull();
    await act(async () => void ctx.publish());
    expect(details()).toBeInTheDocument();
  });

  it("ctx.openDetails() with no details step configured warns instead of doing nothing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let ctx!: ComposerCtx;
    render(composer({ renderTopBar: (c) => ((ctx = c), null) }));
    await act(async () => ctx.openDetails());
    expect(warn.mock.calls.some((c) => String(c[0]).includes("openDetails()"))).toBe(true);
  });
});

// ─── S9 / S14 (default uploader through a stubbed XHR) ─────────────────

function stubXhr(responseText: string, sent: FormData[] = []) {
  class FakeXhr {
    upload = {} as { onprogress?: unknown };
    status = 200;
    responseText = responseText;
    onload?: () => void;
    open() {}
    send(form: FormData) {
      sent.push(form);
      queueMicrotask(() => this.onload?.());
    }
    abort() {}
  }
  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  return sent;
}

describe("S9 bad JSON is localized", () => {
  it("rejects with labels.uploadErrorBadResponse and keeps the parser error as cause", async () => {
    stubXhr("<html>502</html>");
    const onPublishError = vi.fn();
    render(composer({ uploader: undefined, uploadUrl: "/up", onPublishError, labels: { uploadErrorBadResponse: "TR-bad-json" } }));
    await act(async () => topBarPublish().click());
    await waitFor(() => expect(onPublishError).toHaveBeenCalled());
    const err = onPublishError.mock.calls[0][0] as Error;
    expect(err.message).toBe("TR-bad-json");
    expect(err.cause).toBeInstanceOf(SyntaxError);
  });
});

describe("S14 FormData collisions", () => {
  it("skips file / metadata / uploadFields collisions (dev-warn once each) and null / undefined; sends an empty caption", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sent = stubXhr(JSON.stringify({ url: "https://cdn/s.png" }));
    const onPublished = vi.fn();
    render(
      composer({
        uploader: undefined,
        uploadUrl: "/up",
        onPublished,
        uploadFields: { channel: "main" },
        publishFields: { caption: "", file: "evil", metadata: "evil", channel: "evil", gone: null, nothing: undefined, kept: "yes" },
      }),
    );
    await act(async () => topBarPublish().click());
    await waitFor(() => expect(onPublished).toHaveBeenCalled());
    const form = sent[0];
    expect(form.get("file")).toBeInstanceOf(Blob);
    expect(form.get("metadata")).not.toBe("evil");
    expect(form.getAll("channel")).toEqual(["main"]);
    expect(form.has("gone")).toBe(false);
    expect(form.has("nothing")).toBe(false);
    expect(form.get("caption")).toBe("");
    expect(form.get("kept")).toBe("yes");
    const warned = warn.mock.calls.map((c) => String(c[0]));
    for (const k of ["file", "metadata", "channel"]) {
      expect(warned.filter((m) => m.includes(`publish field "${k}"`))).toHaveLength(1);
    }
  });
});

// ─── S10 focus ─────────────────────────────────────────────────────────

describe("S10 focus follows the overlay content", () => {
  it("progress -> Cancel, error -> Retry", async () => {
    const slow = deferred<PublishResult>();
    render(composer({ uploader: () => slow.promise }));
    await act(async () => topBarPublish().click());
    const cancel = await within(dialog()).findByRole("button", { name: "Keep editing" });
    await waitFor(() => expect(cancel).toHaveFocus());
    await act(async () => slow.reject(new Error("nope")));
    const retry = await within(dialog()).findByRole("button", { name: "Try again" });
    await waitFor(() => expect(retry).toHaveFocus());
  });

  it("details -> caption, or the first host field without a caption", async () => {
    const user = userEvent.setup();
    const { unmount } = render(composer({ caption: {} }));
    await user.click(topBarPublish());
    expect(screen.getByLabelText("Caption")).toHaveFocus();
    unmount();
    render(composer({ renderPublishFields: () => <input aria-label="Host field" /> }));
    await user.click(topBarPublish());
    expect(screen.getByLabelText("Host field")).toHaveFocus();
  });
});

// ─── S2 (mock: the step's own keyboard) ────────────────────────────────

describe("S2 Escape", () => {
  it("Escape inside the details step is Back", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(composer({ caption: {}, onClose }));
    await user.click(topBarPublish());
    await user.keyboard("{Escape}");
    expect(queryDetails()).toBeNull();
  });

  it("Escape on the progress overlay does nothing", async () => {
    const slow = deferred<PublishResult>();
    render(composer({ uploader: () => slow.promise }));
    await act(async () => topBarPublish().click());
    await within(dialog()).findByRole("button", { name: "Keep editing" });
    fireEvent.keyDown(within(dialog()).getByRole("button", { name: "Keep editing" }), { key: "Escape" });
    expect(within(dialog()).getByRole("button", { name: "Keep editing" })).toBeInTheDocument();
  });
});

// ─── S11 a11y ──────────────────────────────────────────────────────────

describe("S11 details-step accessibility", () => {
  it("counter is described-by, required/invalid are exposed, the disabled reason is visible and linked", async () => {
    const user = userEvent.setup();
    render(composer({ caption: { required: true, maxLength: 10 } }));
    await user.click(topBarPublish());
    const field = screen.getByLabelText("Caption");
    const counter = screen.getByText("0 / 10").closest("p")!;
    expect(counter).not.toHaveAttribute("aria-live");
    expect(field.getAttribute("aria-describedby")!.split(" ")).toContain(counter.id);
    expect(field).toHaveAttribute("aria-required", "true");
    expect(field).not.toHaveAttribute("aria-invalid"); // untouched
    const reason = within(details()).getByText("Add a caption to publish");
    expect(within(details()).getByRole("button", { name: "Publish" })).toHaveAttribute("aria-describedby", reason.id);
    expect(field.getAttribute("aria-describedby")!.split(" ")).toContain(reason.id);
    await user.type(field, "a");
    await user.clear(field);
    expect(field).toHaveAttribute("aria-invalid", "true"); // interacted + empty
  });

  it("over maxLength: invalid + a 'too long' reason", async () => {
    const user = userEvent.setup();
    render(composer({ caption: { maxLength: 5 }, publishFields: { caption: "far too long" } }));
    await user.click(topBarPublish());
    expect(screen.getByLabelText("Caption")).toHaveAttribute("aria-invalid", "true");
    expect(within(details()).getByText("Caption is too long (max 5)")).toBeInTheDocument();
  });

  it("the progress live region announces the status text only, not the percentage", () => {
    render(<PublishingProgressOverlay progress={0.37} status="uploading" labels={DEFAULT_STORY_COMPOSER_LABELS} />);
    const live = screen.getByRole("status");
    expect(live).toHaveTextContent("Publishing…");
    expect(live.textContent).not.toMatch(/%/);
    expect(screen.getByText("37%")).toBeInTheDocument();
    expect(live.contains(screen.getByText("37%"))).toBe(false);
  });
});

// ─── S13 / S15 / S17 / S18 / S19 / S20 ─────────────────────────────────

describe("S13 explicit undefined overrides keep the defaults", () => {
  it("captionCounter: undefined does not crash and renders the default", async () => {
    const user = userEvent.setup();
    render(composer({ caption: { maxLength: 10 }, labels: { captionCounter: undefined, publish: undefined } }));
    await user.click(topBarPublish());
    expect(within(details()).getByText("0 / 10")).toBeInTheDocument();
    expect(within(details()).getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });
});

describe("S15 locale", () => {
  it("a malformed locale falls back to en instead of throwing (counter + percentage)", async () => {
    const user = userEvent.setup();
    render(composer({ caption: { maxLength: 1000 }, locale: "xx_YY" }));
    await user.click(topBarPublish());
    expect(within(details()).getByText("0 / 1,000")).toBeInTheDocument();
    cleanup();
    render(<PublishingProgressOverlay progress={0.5} status="uploading" labels={DEFAULT_STORY_COMPOSER_LABELS} locale="xx_YY" />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("formatters are cached per locale (no Intl.NumberFormat per render)", () => {
    const Orig = Intl.NumberFormat;
    const spy = vi.spyOn(Intl, "NumberFormat").mockImplementation(function (this: unknown, ...a: ConstructorParameters<typeof Orig>) {
      return new Orig(...a);
    } as never);
    const { rerender } = render(<PublishingProgressOverlay progress={0.1} status="uploading" labels={DEFAULT_STORY_COMPOSER_LABELS} locale="de" />);
    const after1 = spy.mock.calls.length;
    for (let i = 2; i < 6; i++) {
      rerender(<PublishingProgressOverlay progress={i / 10} status="uploading" labels={DEFAULT_STORY_COMPOSER_LABELS} locale="de" />);
    }
    expect(spy.mock.calls.length).toBe(after1);
  });
});

describe("S17 single PublishStatus", () => {
  it("use-story-composer-state does not re-declare the union", () => {
    const code = fs.readFileSync(path.resolve(__dirname, "../hooks/use-story-composer-state.ts"), "utf8");
    expect(code).not.toMatch(/export type PublishStatus\s*=/);
  });
});

describe("S18 a successful publish consumes the draft", () => {
  it("resets the editor after onPublished; Cancel and error keep the draft", async () => {
    const order: string[] = [];
    const onPublished = vi.fn(() => void order.push(`published(reset=${editorMock.resetCalls})`));
    render(composer({ onPublished }));
    await act(async () => topBarPublish().click());
    await waitFor(() => expect(onPublished).toHaveBeenCalled());
    expect(editorMock.resetCalls).toBe(1);
    expect(order).toEqual(["published(reset=0)"]); // reset runs AFTER the host handler
    cleanup();
    resetEditorMock();
    render(composer({ uploader: async () => Promise.reject(new Error("x")) }));
    await act(async () => topBarPublish().click());
    await within(dialog()).findByRole("button", { name: "Cancel" });
    expect(editorMock.resetCalls).toBe(0);
  });
});

describe("S19 / S20 details-step contrast and RTL counter", () => {
  const read = (f: string) => fs.readFileSync(path.resolve(__dirname, "../parts", f), "utf8");
  it("the scrims darken what is behind them and the small text keeps >= /70 alpha", () => {
    for (const f of ["publish-details-step.tsx", "publishing-progress-overlay.tsx"]) {
      expect(read(f), f).toMatch(/backdrop-brightness-\d+/);
      expect(read(f), f).not.toMatch(/media-overlay\/\d+/); // never an alpha on the scrim token itself
    }
    const step = read("publish-details-step.tsx");
    expect(step).not.toMatch(/placeholder:text-media-overlay-foreground\/(?:[1-5]\d|[0-9])\b/);
  });

  it("the counter text is isolated (bdi dir=ltr) so RTL pages do not reverse it", async () => {
    const user = userEvent.setup();
    render(composer({ caption: { maxLength: 5 }, publishFields: { caption: "120" } }));
    await user.click(topBarPublish());
    const bdi = screen.getByText("3 / 5");
    expect(bdi.tagName).toBe("BDI");
    expect(bdi).toHaveAttribute("dir", "ltr");
  });
});
