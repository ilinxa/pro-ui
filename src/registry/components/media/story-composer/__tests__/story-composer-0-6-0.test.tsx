import * as React from "react";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import fs from "node:fs";
import path from "node:path";
import { describeContract } from "../../../../../../tests/helpers";
import { EXPORT_METADATA, editorMock, resetEditorMock } from "./mock-editor";

// The real editor is Konva-heavy; these tests are about story-composer's own wiring, so
// the editor is replaced by a stand-in that records the props it receives (the real editor
// is exercised in opt-in-real-editor.test.tsx).
vi.mock("../../media-editor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../media-editor")>();
  const { createMockEditor } = await import("./mock-editor");
  return { ...actual, MediaEditor: createMockEditor() };
});

import { editorLabelsFromFlat, type MediaCaptureExtension } from "../../media-editor";
import { StoryComposer } from "../story-composer";
import { PublishingProgressOverlay } from "../parts/publishing-progress-overlay";
import {
  DEFAULT_STORY_COMPOSER_LABELS,
  type PublishedStory,
  type PublishFields,
  type PublishResult,
  type StoryComposerHandle,
  type StoryComposerLabels,
  type StoryComposerProps,
  type Uploader,
} from "../types";

const okUploader: Uploader = async () => ({ url: "https://cdn/x.png" });

function composer(props: Partial<StoryComposerProps> = {}) {
  return (
    <StoryComposer
      isOpen
      onClose={() => {}}
      onPublished={() => {}}
      uploader={okUploader}
      {...props}
    />
  );
}

/** Mounts the composer and, when `openDetails`, taps the top-bar Publish so the details step shows. */
function Harness({ openDetails: open, ...props }: Partial<StoryComposerProps> & { openDetails?: boolean }) {
  const openDetails = open ?? props.caption !== undefined;
  const wrap = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!openDetails) return;
    const btn = wrap.current?.querySelector<HTMLButtonElement>('[data-testid="editor-body"] button[aria-busy]');
    btn?.click();
  }, [openDetails]);
  return <div ref={wrap}>{composer(props)}</div>;
}

const dialog = () => screen.getByRole("dialog");
const details = () => within(dialog()).getByRole("region");
const topBarPublish = () => dialog().querySelector<HTMLButtonElement>('[data-testid="editor-body"] button[aria-busy]')!;

beforeEach(() => resetEditorMock());
afterEach(() => cleanup());

// ─── contract ──────────────────────────────────────────────────────────

const TR_BASIC = {
  publish: "Yayınla",
  detailsTitle: "Ayrıntı ekle",
  detailsBack: "Geri",
  captionLabel: "Açıklama",
} satisfies StoryComposerLabels;

describeContract("StoryComposer", {
  render: (props = {}) => <Harness {...(props as Partial<StoryComposerProps>)} />,
  renders: (s) => {
    expect(s.getByRole("dialog")).toBeInTheDocument();
    expect(within(s.getByRole("dialog")).getAllByRole("button", { name: "Publish" }).length).toBeGreaterThan(0);
  },
  labels: {
    props: { caption: { maxLength: 100 }, labels: TR_BASIC },
    expect: (s) => {
      const region = within(s.getByRole("dialog")).getByRole("region", { name: "Ayrıntı ekle" });
      expect(within(region).getByRole("button", { name: "Geri" })).toBeInTheDocument();
      expect(within(region).getByRole("button", { name: "Yayınla" })).toBeInTheDocument();
      expect(within(region).getByLabelText("Açıklama")).toBeInTheDocument();
      expect(within(region).queryByText("Back")).toBeNull();
    },
  },
  controlled: {
    initial: { caption: { maxLength: 100 }, publishFields: { caption: "A" } },
    next: { caption: { maxLength: 100 }, publishFields: { caption: "B" } },
    callback: "onPublishFieldsChange",
    expectInitial: (s) => expect(s.getByLabelText("Caption")).toHaveValue("A"),
    expectNext: (s) => expect(s.getByLabelText("Caption")).toHaveValue("B"),
    request: async (user, s) => {
      await user.type(s.getByLabelText("Caption"), "z");
    },
  },
  rtl: {
    props: { caption: { maxLength: 100 } },
    expect: (s, root) => {
      expect(root).toHaveAttribute("dir", "rtl");
      const counter = s.getByText("0 / 100").closest("p")!;
      // logical alignment: end, never the physical right
      expect(counter.className).toContain("text-end");
      expect(counter.className).not.toMatch(/text-right|text-left/);
      expect(details().className).not.toMatch(/\b(ml|mr|pl|pr|left|right)-/);
    },
  },
  keyboard: {
    props: { caption: { maxLength: 100 } },
    run: async (user) => {
      // the caption takes focus when the step opens
      await user.keyboard("hi");
    },
    expect: (s) => expect(s.getByLabelText("Caption")).toHaveValue("hi"),
  },
  axeStates: [{ caption: { maxLength: 100, required: true } }, { openDetails: false }],
});

// ─── SC1 camera opt-in ─────────────────────────────────────────────────

describe("SC1 camera opt-in (mocked editor: what story-composer hands over)", () => {
  const capture = { __marker: true } as unknown as MediaCaptureExtension;

  it("is upload-only by default: no capture extension, sources = [upload]", () => {
    render(composer());
    expect(editorMock.props!.capture).toBeUndefined();
    expect(editorMock.props!.mediaSources).toEqual(["upload"]);
  });

  it("with capture, offers the camera: sources = [camera, upload] and the extension is forwarded", () => {
    render(composer({ capture }));
    expect(editorMock.props!.capture).toBe(capture);
    expect(editorMock.props!.mediaSources).toEqual(["camera", "upload"]);
  });

  it("explicit sources win; acceptMediaTypes / videoOutput / locale are forwarded untouched", () => {
    const videoOutput = { mimeTypes: ["video/mp4"] };
    render(
      composer({
        capture,
        sources: ["upload"],
        acceptMediaTypes: ["image/*"],
        videoOutput,
        locale: "tr",
      }),
    );
    expect(editorMock.props!.mediaSources).toEqual(["upload"]);
    expect(editorMock.props!.acceptMediaTypes).toEqual(["image/*"]);
    expect(editorMock.props!.videoOutput).toBe(videoOutput);
    expect(editorMock.props!.locale).toBe("tr");
  });

  it("imports nothing from the capture slice (source scan)", () => {
    const root = path.resolve(__dirname, "..");
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "__tests__") walk(full);
        } else if (
          /\.(ts|tsx)$/.test(entry.name) &&
          // Shipped files only — the docs-site demo / usage / meta are never installed.
          !["demo.tsx", "usage.tsx", "meta.ts"].includes(entry.name)
        ) {
          const code = fs
            .readFileSync(full, "utf8")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/^\s*\/\/.*$/gm, "");
          if (code.includes("features/capture")) hits.push(path.relative(root, full));
        }
      }
    };
    walk(root);
    expect(hits).toEqual([]);
  });
});

// ─── SC2 publish fields ────────────────────────────────────────────────

describe("SC2 publish fields", () => {
  it("without caption / renderPublishFields Publish is one tap (no details step)", async () => {
    const onPublished = vi.fn();
    render(composer({ onPublished }));
    await act(async () => topBarPublish().click());
    await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(1));
    expect(within(dialog()).queryByRole("region")).toBeNull();
  });

  it("with caption, Publish opens the details step first; Back returns without publishing", async () => {
    const uploader = vi.fn(okUploader);
    const user = userEvent.setup();
    render(composer({ caption: { maxLength: 50 }, uploader }));
    await user.click(topBarPublish());
    const step = details();
    expect(within(step).getByLabelText("Caption")).toBeInTheDocument();
    await user.click(within(step).getByRole("button", { name: "Back" }));
    expect(within(dialog()).queryByRole("region")).toBeNull();
    expect(uploader).not.toHaveBeenCalled();
  });

  it("caption + host fields reach a custom uploader's third argument", async () => {
    const uploader = vi.fn<Uploader>(okUploader);
    const user = userEvent.setup();
    render(
      composer({
        uploader,
        caption: { maxLength: 100 },
        renderPublishFields: ({ value, onChange }) => (
          <input
            aria-label="Audience"
            value={String(value.audience ?? "")}
            onChange={(e) => onChange({ ...value, audience: e.target.value })}
          />
        ),
      }),
    );
    await user.click(topBarPublish());
    await user.type(screen.getByLabelText("Caption"), "hello");
    await user.type(screen.getByLabelText("Audience"), "friends");
    await user.click(within(details()).getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(uploader).toHaveBeenCalledTimes(1));
    const [blob, metadata, fields] = uploader.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(metadata.mode).toBe("photo");
    expect(fields).toEqual({ caption: "hello", audience: "friends" });
  });

  it("forwards the editor's frame and textOnly so overlay coordinates can be mapped (media-editor 0.6.0)", async () => {
    const frame = { stageWidth: 400, stageHeight: 700, media: { x: 0, y: 100, width: 400, height: 500 } };
    const textOnly = { text: "hi", fontFamily: "sans", textColor: "white", gradientId: "g1" };
    editorMock.exportImpl = async () => ({
      blob: new Blob(["x"], { type: "image/png" }),
      metadata: { ...EXPORT_METADATA, width: 800, height: 1400, frame, textOnly },
    });
    const uploader = vi.fn<Uploader>(okUploader);
    const user = userEvent.setup();
    render(composer({ uploader, caption: { maxLength: 100 } }));
    await user.click(topBarPublish());
    await user.click(within(details()).getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(uploader).toHaveBeenCalledTimes(1));
    const [, metadata] = uploader.mock.calls[0];
    expect(metadata).toMatchObject({ width: 800, height: 1400, frame, textOnly });
  });

  it("the default uploader appends caption + every field to the FormData", async () => {
    const sent: FormData[] = [];
    class FakeXhr {
      upload = {} as { onprogress?: unknown };
      status = 200;
      responseText = JSON.stringify({ url: "https://cdn/s.png" });
      onload?: () => void;
      open() {}
      send(form: FormData) {
        sent.push(form);
        queueMicrotask(() => this.onload?.());
      }
      abort() {}
    }
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    try {
      const user = userEvent.setup();
      render(
        composer({
          uploader: undefined,
          uploadUrl: "/api/stories",
          uploadFields: { channel: "main" },
          caption: {},
          publishFields: { caption: "cap", tags: ["a", "b"], n: 3 } as PublishFields,
        }),
      );
      await user.click(topBarPublish());
      await user.click(within(details()).getByRole("button", { name: "Publish" }));
      await waitFor(() => expect(sent).toHaveLength(1));
      const form = sent[0];
      expect(form.get("caption")).toBe("cap"); // string as-is
      expect(form.get("tags")).toBe(JSON.stringify(["a", "b"])); // non-string -> JSON
      expect(form.get("n")).toBe("3");
      expect(form.get("channel")).toBe("main"); // existing uploadFields kept
      expect(form.get("metadata")).toBeTruthy();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("canPublish gates the details step's Publish", async () => {
    const uploader = vi.fn(okUploader);
    const user = userEvent.setup();
    render(
      composer({
        uploader,
        caption: {},
        canPublish: (f) => f.caption === "ok",
      }),
    );
    await user.click(topBarPublish());
    const publish = within(details()).getByRole("button", { name: "Publish" });
    expect(publish).toBeDisabled();
    await user.type(screen.getByLabelText("Caption"), "ok");
    expect(publish).toBeEnabled();
  });

  it("a required caption blocks Publish while empty", async () => {
    const user = userEvent.setup();
    render(composer({ caption: { required: true } }));
    await user.click(topBarPublish());
    const publish = within(details()).getByRole("button", { name: "Publish" });
    expect(publish).toBeDisabled();
    await user.type(screen.getByLabelText("Caption"), "   ");
    expect(publish).toBeDisabled(); // whitespace only
    await user.type(screen.getByLabelText("Caption"), "x");
    expect(publish).toBeEnabled();
  });

  it("controlled publishFields win over typing; the change is only reported", async () => {
    const onPublishFieldsChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      composer({ caption: {}, publishFields: { caption: "fixed" }, onPublishFieldsChange }),
    );
    await user.click(topBarPublish());
    await user.type(screen.getByLabelText("Caption"), "x");
    expect(onPublishFieldsChange).toHaveBeenCalledWith({ caption: "fixedx" });
    expect(screen.getByLabelText("Caption")).toHaveValue("fixed");
    rerender(composer({ caption: {}, publishFields: { caption: "host" }, onPublishFieldsChange }));
    expect(screen.getByLabelText("Caption")).toHaveValue("host");
  });

  it("the caption counter is formatted with the locale", async () => {
    const user = userEvent.setup();
    render(composer({ caption: { maxLength: 1000 }, locale: "tr" }));
    await user.click(topBarPublish());
    expect(within(details()).getByText("0 / 1.000")).toBeInTheDocument(); // tr groups with "."
  });
});

// ─── SC4 error state ───────────────────────────────────────────────────

describe("SC4 error state", () => {
  it("Cancel returns to the editor with the draft intact (no editor reset)", async () => {
    const user = userEvent.setup();
    render(composer({ uploader: async () => Promise.reject(new Error("net")) }));
    expect(screen.getByTestId("draft")).toHaveTextContent("loaded");
    await act(async () => topBarPublish().click());
    const cancel = await within(dialog()).findByRole("button", { name: "Cancel" });
    await user.click(cancel);
    expect(within(dialog()).queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(within(dialog()).queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByTestId("draft")).toHaveTextContent("loaded");
    expect(editorMock.resetCalls).toBe(0);
  });

  it("getErrorMessage text renders; the default is the uploadFailedBody label", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      composer({
        uploader: async () => Promise.reject(new Error("quota")),
        getErrorMessage: (e) => `custom: ${e.message}`,
      }),
    );
    await act(async () => topBarPublish().click());
    expect(await within(dialog()).findByText("custom: quota")).toBeInTheDocument();
    unmount();
    render(composer({ uploader: async () => Promise.reject(new Error("quota")) }));
    await act(async () => topBarPublish().click());
    expect(await within(dialog()).findByText(DEFAULT_STORY_COMPOSER_LABELS.uploadFailedBody)).toBeInTheDocument();
    expect(user).toBeTruthy();
  });

  it("Retry still works", async () => {
    let calls = 0;
    const onPublished = vi.fn();
    const user = userEvent.setup();
    render(
      composer({
        onPublished,
        uploader: async () => {
          calls += 1;
          if (calls === 1) throw new Error("flaky");
          return { url: "https://cdn/ok.png" };
        },
      }),
    );
    await act(async () => topBarPublish().click());
    await user.click(await within(dialog()).findByRole("button", { name: "Try again" }));
    await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(1));
    expect(calls).toBe(2);
  });

  it("the default uploader's own error strings are labels", async () => {
    const onPublishError = vi.fn();
    render(
      composer({
        uploader: undefined,
        uploadUrl: undefined,
        onPublishError,
        labels: { uploadErrorNoDestination: "TR-no-destination" },
      }),
    );
    await act(async () => topBarPublish().click());
    await waitFor(() => expect(onPublishError).toHaveBeenCalled());
    expect(onPublishError.mock.calls[0][0].message).toBe("TR-no-destination");
  });

  it("renderPublishingOverlay gets status, error, retry and cancel (progress / mode unchanged)", async () => {
    const seen: Array<Record<string, unknown>> = [];
    render(
      composer({
        uploader: async () => Promise.reject(new Error("bad")),
        renderPublishingOverlay: (ctx) => {
          seen.push(ctx as unknown as Record<string, unknown>);
          return <div data-testid="custom">{ctx.status}</div>;
        },
      }),
    );
    await act(async () => topBarPublish().click());
    await waitFor(() => expect(screen.getByTestId("custom")).toHaveTextContent("error"));
    const last = seen[seen.length - 1];
    expect(last.mode).toBe("photo");
    expect(typeof last.progress).toBe("number");
    expect((last.error as Error).message).toBe("bad");
    expect(typeof last.retry).toBe("function");
    expect(typeof last.cancel).toBe("function");
    await act(async () => (last.cancel as () => void)());
    expect(screen.queryByTestId("custom")).toBeNull();
  });

  it("the overlay uses tokens: no palette colours, no black/white literals", () => {
    const dir = path.resolve(__dirname, "../parts");
    for (const file of ["publishing-progress-overlay.tsx", "composer-publish-bar.tsx", "publish-details-step.tsx"]) {
      const code = fs.readFileSync(path.join(dir, file), "utf8");
      expect(code, file).not.toMatch(/\b(?:bg|text|border)-(?:black|white|amber-\d+)\b/);
    }
  });

  it("the percentage follows the locale", () => {
    render(
      <PublishingProgressOverlay
        progress={0.5}
        status="uploading"
        labels={DEFAULT_STORY_COMPOSER_LABELS}
        locale="tr"
      />,
    );
    expect(screen.getByText("%50")).toBeInTheDocument(); // Turkish puts the sign first
  });
});

// ─── SC5 server result ─────────────────────────────────────────────────

describe("SC5 onPublished(story, result)", () => {
  it("receives the uploader's exact result object as the second argument", async () => {
    const result: PublishResult = { url: "https://cdn/r.png", id: "srv-9", extra: { a: 1 } };
    const onPublished = vi.fn();
    render(composer({ uploader: async () => result, onPublished }));
    await act(async () => topBarPublish().click());
    await waitFor(() => expect(onPublished).toHaveBeenCalledTimes(1));
    const [story, second] = onPublished.mock.calls[0] as [PublishedStory, PublishResult];
    expect(second).toBe(result);
    expect(story.items[0].src).toBe("https://cdn/r.png");
  });

  it("a one-argument handler and a two-argument uploader still type-check", () => {
    const oneArg: StoryComposerProps["onPublished"] = (story: PublishedStory) => void story;
    const twoArg: Uploader = async (blob, meta) => ({ url: `${blob.size}${meta.width}` });
    expectTypeOf(oneArg).toBeFunction();
    expectTypeOf(twoArg).toBeFunction();
    expectTypeOf<StoryComposerProps["onPublished"]>().parameters.toEqualTypeOf<[PublishedStory, PublishResult]>();
  });
});

// ─── SC6 labels ────────────────────────────────────────────────────────

describe("SC6 labels", () => {
  it("passes no labels to the editor when the host passed none", () => {
    render(composer());
    expect(editorMock.props!.labels).toBeUndefined();
  });

  it("forwards only host overrides, flat-converted, with labels.editor underneath (flat wins)", () => {
    render(
      composer({
        labels: {
          modePhoto: "FLAT-PHOTO",
          editor: { capture: { modes: { photo: "NESTED-PHOTO", video: "NESTED-VIDEO" } } } as never,
        },
      }),
    );
    const labels = editorMock.props!.labels as { capture: { modes: Record<string, string> }; toolbar?: Record<string, string> };
    expect(labels.capture.modes.photo).toBe("FLAT-PHOTO"); // flat wins on conflict
    expect(labels.capture.modes.video).toBe("NESTED-VIDEO"); // nested kept
    expect(labels.toolbar?.text).toBeUndefined(); // story-composer defaults are NOT forwarded
    expect(labels).toMatchObject(editorLabelsFromFlat({ modePhoto: "FLAT-PHOTO" }) as object);
  });

  it("labels.published is announced politely when publishing completes", async () => {
    render(composer({ labels: { published: "Yayınlandı" } }));
    const region = screen.getAllByRole("status").find((n) => n.className.includes("sr-only"))!;
    expect(region).toHaveTextContent("");
    await act(async () => topBarPublish().click());
    await waitFor(() => expect(region).toHaveTextContent("Yayınlandı"));
  });

  it("has no `as unknown as` cast left in the component sources", () => {
    const root = path.resolve(__dirname, "..");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "__tests__") walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name) && fs.readFileSync(full, "utf8").includes("as unknown as")) {
          offenders.push(path.relative(root, full));
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });

  it("labels.editor accepts nested keys (compile-time)", () => {
    const labels: StoryComposerLabels = { editor: { toolbar: { text: "T" } } as never };
    expect(labels.editor).toBeDefined();
  });
});

// ─── locale + SSR / hydration ──────────────────────────────────────────

describe('locale="tr", SSR and hydration', () => {
  it("renderToString then hydrateRoot produces no mismatch warnings", async () => {
    const props = { caption: { maxLength: 1000 }, locale: "tr", labels: { published: "Yayınlandı" } } as const;
    const html = renderToString(composer(props));
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors: unknown[][] = [];
    const recoverable: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...a) => void errors.push(a));
    try {
      let root!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(host, composer(props), {
          onRecoverableError: (e) => void recoverable.push(e),
        });
      });
      expect(recoverable).toEqual([]);
      expect(errors.filter((e) => /hydrat|did not match|mismatch/i.test(String(e[0])))).toEqual([]);
      await act(async () => root.unmount());
    } finally {
      spy.mockRestore();
      host.remove();
    }
  });

  it("a full Turkish label set leaves no default English in the publish bar, details step or error overlay", async () => {
    const tr: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(DEFAULT_STORY_COMPOSER_LABELS)) {
      if (typeof value === "string") tr[key] = `TR-${key}`;
    }
    tr.uploadErrorHttp = (s: number) => `TR-http ${s}`;
    tr.captionCounter = (c: string, m: string) => `TR-counter ${c}/${m}`;
    const user = userEvent.setup();
    render(
      composer({
        locale: "tr",
        caption: { maxLength: 10 },
        labels: tr as StoryComposerLabels,
        uploader: async () => Promise.reject(new Error("x")),
      }),
    );
    const english = (): string[] => {
      const el = dialog();
      const seen = new Set<string>();
      el.querySelectorAll("*").forEach((n) => {
        if (n.children.length === 0 && n.textContent?.trim()) seen.add(n.textContent.trim());
        for (const a of ["aria-label", "placeholder"]) {
          const v = n.getAttribute(a);
          if (v) seen.add(v);
        }
      });
      return Object.entries(DEFAULT_STORY_COMPOSER_LABELS)
        .filter(([, v]) => typeof v === "string" && seen.has(v as string))
        .map(([k]) => k);
    };
    // publish bar
    expect(within(dialog()).getByRole("button", { name: "TR-publish" })).toBeInTheDocument();
    expect(english()).toEqual([]);
    // details step
    await user.click(topBarPublish());
    expect(within(details()).getByText("TR-detailsTitle")).toBeInTheDocument();
    expect(within(details()).getByText("TR-counter 0/10")).toBeInTheDocument();
    expect(within(details()).getByPlaceholderText("TR-captionPlaceholder")).toBeInTheDocument();
    expect(english()).toEqual([]);
    // error overlay
    await user.click(within(details()).getByRole("button", { name: "TR-publish" }));
    expect(await within(dialog()).findByText("TR-uploadFailedTitle")).toBeInTheDocument();
    expect(within(dialog()).getByText("TR-uploadFailedBody")).toBeInTheDocument();
    expect(within(dialog()).getByRole("button", { name: "TR-uploadRetry" })).toBeInTheDocument();
    expect(within(dialog()).getByRole("button", { name: "TR-uploadCancel" })).toBeInTheDocument();
    expect(english()).toEqual([]);
  });
});

// ─── handle ────────────────────────────────────────────────────────────

describe("handle publish honours the caption gate", () => {
  it("handle.publish() opens the details step (not a silent return) while a required caption is empty", async () => {
    const uploader = vi.fn(okUploader);
    const ref = React.createRef<StoryComposerHandle>();
    render(<StoryComposer ref={ref} isOpen onClose={() => {}} onPublished={() => {}} uploader={uploader} caption={{ required: true }} />);
    await act(async () => ref.current!.publish());
    expect(uploader).not.toHaveBeenCalled();
    expect(details()).toBeInTheDocument();
    // with the step open and the caption still empty the gate blocks (and says so)
    await act(async () => ref.current!.publish());
    expect(uploader).not.toHaveBeenCalled();
  });
});

describe("mode switch keeps the editor's modified flag (media-editor 0.6.0)", () => {
  beforeEach(() => resetEditorMock());
  afterEach(() => cleanup());

  it("setMode round-trips the state with keepModified, so the discard confirm still sees edits", () => {
    let setMode: ((m: "photo" | "video" | "text") => void) | undefined;
    render(
      composer({
        renderTopBar: (ctx) => {
          setMode = ctx.setMode;
          return null;
        },
      }),
    );
    act(() => setMode!("text"));
    expect(editorMock.loadStateCalls).toEqual([
      [{ mode: "text" }, { keepModified: true }],
    ]);
  });
});
