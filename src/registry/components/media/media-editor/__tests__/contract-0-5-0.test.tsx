/**
 * media-editor 0.5.0 - consumer contract (C11): the kit's six checks over the editor, plus the
 * proofs the kit cannot express: `locale="tr"` number formatting in a validation message, SSR +
 * hydration (also with a video allow-list the server cannot evaluate), and an RTL render with no
 * physical-direction utility in the markup.
 */
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { MediaCaptureExtensionContext } from "../hooks/use-capture-extension";
import type { ValidationError } from "../types";
import { describeContract, renderWithContext } from "../../../../../../tests/helpers";

// The konva canvas needs a real <canvas>; these tests are about the editor chrome.
vi.mock("../parts/lazy-editor-canvas", () => ({ default: () => null }));

function stubBrowser() {
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:media-editor-contract";
  URL.revokeObjectURL = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  return () => {
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    vi.unstubAllGlobals();
  };
}

const editor = (props: Record<string, unknown> = {}) => (
  <MediaEditor presentation="inline" mediaSources={["upload"]} {...props} />
);

let clickSpy: ReturnType<typeof vi.spyOn> | undefined;

describeContract("MediaEditor", {
  render: (props) => editor(props),
  setup: stubBrowser,
  renders: (s) => {
    expect(s.getByText("Choose from gallery")).toBeInTheDocument();
    expect(s.getByText("Photo")).toBeInTheDocument();
  },
  labels: {
    props: { labels: { intake: { prompt: "Bir dosya sec" }, capture: { galleryButton: "Galeriden sec" } } },
    expect: (s) => {
      expect(s.getByText("Bir dosya sec")).toBeInTheDocument();
      expect(s.getByText("Galeriden sec")).toBeInTheDocument();
      expect(s.queryByText("Choose from gallery")).toBeNull();
    },
  },
  controlled: {
    notApplicable:
      "the editor owns its draft and edit state (a state machine, not a controlled value); the host seeds it with initialSource / handle.loadState and reads it with getState / onEditAction - there is no value + onChange pair",
  },
  rtl: {
    props: {},
    expect: (s, root) => {
      expect(root).toHaveAttribute("dir", "rtl");
      expect(s.getByText("Choose from gallery")).toBeInTheDocument();
      expect(physicalUtilities(root)).toEqual([]);
    },
  },
  keyboard: {
    run: async (user) => {
      clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
      await user.tab(); // photo, video, text mode buttons, then the gallery picker
      await user.tab();
      await user.tab();
      await user.tab();
      await user.keyboard("{Enter}");
    },
    expect: (s) => {
      expect(s.getByText("Choose from gallery")).toHaveFocus();
      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy?.mockRestore();
      clickSpy = undefined;
    },
  },
});

/** Physical-direction utilities left in the rendered markup (centring `left-1/2` excepted). */
function physicalUtilities(root: HTMLElement): string[] {
  const out: string[] = [];
  const re =
    /^(?:(?:[a-z-]+:)*)(?:-?(?:m|p)[lr]-\S+|(?:left|right)-(?!1\/2$)(?:\d\S*|px|full|auto)|text-(?:left|right)|float-(?:left|right)|rounded-(?:l|r|tl|tr|bl|br)(?:-\S+)?|border-[lr](?:-\S+)?)$/;
  for (const el of Array.from(root.querySelectorAll("*"))) {
    const cls = el.getAttribute("class");
    if (!cls) continue;
    for (const tok of cls.split(/\s+/)) {
      if (re.test(tok)) out.push(`${el.tagName.toLowerCase()}.${tok}`);
    }
  }
  return out;
}

describe("MediaEditor - contract proofs beyond the kit", () => {
  let restore: (() => void) | undefined;
  beforeEach(() => {
    restore = stubBrowser();
  });
  afterEach(() => {
    cleanup();
    restore?.();
    restore = undefined;
  });

  it('locale="tr" formats the sizes in a validation message with Turkish separators', () => {
    const sized = () => {
      const file = new File(["x"], "big.png", { type: "image/png" });
      Object.defineProperty(file, "size", { value: 12.34 * 1024 * 1024 });
      return file;
    };
    const message = (locale?: string) => {
      const onValidationError = vi.fn<(e: ValidationError) => void>();
      render(editor({ locale, maxFileSizeMb: 10, onValidationError }));
      fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [sized()] } });
      cleanup();
      expect(onValidationError).toHaveBeenCalledTimes(1);
      return onValidationError.mock.calls[0]![0].message;
    };
    expect(message("tr")).toContain("12,3");
    expect(message("en")).toContain("12.3");
  });

  it("renders inside an RTL document with no physical-direction utility, edit stage included", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    const { getByTestId } = renderWithContext(
      editor({ enabledModes: ["photo"], initialSource: { kind: "blob", blob, mode: "photo" } }),
      { dir: "rtl", locale: "ar" },
    );
    await screen.findByLabelText("Back to capture");
    expect(physicalUtilities(getByTestId("context-root"))).toEqual([]);
  });

  /** `server` / `client` stub `MediaRecorder` for each pass: a list of supported types, or null = absent. */
  async function hydrate(
    tree: React.ReactElement,
    env: { server?: string[] | null; client?: string[] | null } = {},
  ) {
    const recorder = (supported: string[] | null | undefined) => {
      if (supported === undefined) return;
      vi.stubGlobal(
        "MediaRecorder",
        supported === null ? undefined : { isTypeSupported: (t: string) => supported.includes(t) },
      );
    };
    recorder(env.server);
    const html = renderToString(tree);
    recorder(env.client);
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(host, tree, { onRecoverableError: recoverable });
    });
    const calls = errors.mock.calls.slice();
    errors.mockRestore();
    return { host, recoverable, errorCalls: calls };
  }

  it("renders on the server and hydrates without errors or recoverable errors", async () => {
    const { host, recoverable, errorCalls } = await hydrate(editor({ locale: "tr" }));
    expect(errorCalls).toEqual([]);
    expect(recoverable).not.toHaveBeenCalled();
    expect(host.querySelector('[data-slot="media-editor"]')).toBeTruthy();
    host.remove();
  });

  const modes = (host: HTMLElement) =>
    Array.from(host.querySelectorAll("button[data-mode]")).map((b) => b.getAttribute("data-mode"));
  const allowMp4 = { videoOutput: { mimeTypes: ["video/mp4"] } };

  it("hydrates cleanly when the server cannot evaluate a video allow-list the client can record", async () => {
    // server: no MediaRecorder at all; client: mp4 is recordable. The server markup must not
    // already have decided "no video" (that would mismatch the client's first render).
    const onValidationError = vi.fn();
    const { host, recoverable, errorCalls } = await hydrate(editor({ ...allowMp4, onValidationError }), {
      server: null,
      client: ["video/mp4"],
    });
    expect(errorCalls).toEqual([]);
    expect(recoverable).not.toHaveBeenCalled();
    expect(modes(host)).toEqual(["photo", "video", "text"]);
    expect(onValidationError).not.toHaveBeenCalled();
    host.remove();
  });

  // Recording is only reachable with the camera source AND a capture extension wired.
  const reachable = {
    mediaSources: ["camera", "upload"],
    capture: {
      Provider: ({ children }: { children: React.ReactNode }) => (
        <MediaCaptureExtensionContext.Provider value={{ CameraSurface: () => null }}>
          {children}
        </MediaCaptureExtensionContext.Provider>
      ),
    },
  };

  it("after hydration the client's answer wins: video hidden and the host told once", async () => {
    const onValidationError = vi.fn();
    const { host, recoverable, errorCalls } = await hydrate(
      editor({ ...allowMp4, ...reachable, onValidationError }),
      { server: null, client: ["video/webm"] },
    );
    expect(errorCalls).toEqual([]);
    expect(recoverable).not.toHaveBeenCalled();
    expect(modes(host)).toEqual(["photo", "text"]);
    expect(onValidationError).toHaveBeenCalledTimes(1);
    host.remove();
  });

  it("defaultMode=\"video\" does not stay stuck after hydration hides video", async () => {
    const dataMode = (host: HTMLElement) =>
      host.querySelector('[data-slot="media-editor"]')!.getAttribute("data-mode");
    const props = editor({ ...allowMp4, ...reachable, defaultMode: "video", onValidationError: () => {} });
    // the server snapshot says "recordable", so the markup starts in video mode ...
    const { host, recoverable } = await hydrate(props, { server: null, client: ["video/webm"] });
    expect(recoverable).not.toHaveBeenCalled();
    // ... and the client's answer (mp4 not recordable) takes it back out
    expect(dataMode(host)).not.toBe("video");
    expect(dataMode(host)).toBe("none");
    host.remove();
  });
});
