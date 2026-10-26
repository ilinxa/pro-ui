/**
 * carousel-composer 0.3.0: alt text, host-owned upload status, MIME allow-list, video
 * duration limit, poster + duration badge, never-WebM, labels, keyboard reorder.
 */
import { createRef } from "react";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CarouselComposer } from "../carousel-composer";
import { formatDuration } from "../lib/format-duration";
import { PLATFORM_SAFE_MIME } from "../types";
import type { CarouselComposerHandle, MediaCarouselItem } from "../types";
import { mockResizeObserver } from "../../../../../../tests/helpers";
import { ITEMS, installIntakeStubs, jpg, mp4, webm, type IntakeStubs } from "./support";
import { turkishLabels } from "../dummy-data";

let stubs: IntakeStubs;
let restoreRo: () => void;
beforeEach(() => {
  restoreRo = mockResizeObserver();
});
afterEach(() => {
  stubs?.restore();
  restoreRo();
  vi.restoreAllMocks();
});

const add = async (ref: React.RefObject<CarouselComposerHandle | null>, files: File[]) => {
  await act(async () => {
    ref.current!.addFiles(files);
  });
};

describe("alt text (CC3)", () => {
  it("types into a labelled field and reports the updated alt through onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CarouselComposer defaultValue={ITEMS} enableAltText onChange={onChange} />);
    const field = screen.getByRole("textbox", { name: "Alt text" });
    expect(field).toHaveAttribute("placeholder", "Describe this image for people who can't see it");
    await user.type(field, "Hi");
    const last = onChange.mock.calls.at(-1)![0] as MediaCarouselItem[];
    expect(last[0].alt).toBe("Hi");
    expect(field).toHaveValue("Hi");
    expect(screen.getByText("2/200")).toBeInTheDocument();
  });

  it("enforces maxAltLength on the field", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CarouselComposer defaultValue={ITEMS} enableAltText maxAltLength={5} onChange={onChange} />);
    const field = screen.getByRole("textbox", { name: "Alt text" });
    expect(field).toHaveAttribute("maxlength", "5");
    await user.type(field, "abcdefgh");
    expect((onChange.mock.calls.at(-1)![0] as MediaCarouselItem[])[0].alt).toBe("abcde");
    expect(screen.getByText("5/5")).toBeInTheDocument();
  });

  it("clamps a longer value in code too (paste, autofill)", () => {
    const onChange = vi.fn();
    render(<CarouselComposer defaultValue={ITEMS} enableAltText maxAltLength={5} onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Alt text" }), { target: { value: "abcdefghij" } });
    expect((onChange.mock.calls.at(-1)![0] as MediaCarouselItem[])[0].alt).toBe("abcde");
  });

  it("works controlled: the prop wins, onChange carries the new alt", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CarouselComposer value={ITEMS} enableAltText onChange={onChange} />);
    await user.type(screen.getByRole("textbox", { name: "Alt text" }), "x");
    expect((onChange.mock.calls.at(-1)![0] as MediaCarouselItem[])[0].alt).toBe("x");
    expect(screen.getByRole("textbox", { name: "Alt text" })).toHaveValue("");
  });

  it("has no field for a video, nor without enableAltText; img alt is alt, then fileName", () => {
    const video: MediaCarouselItem = { id: "v", kind: "video", url: "https://example.test/v.mp4" };
    const { rerender } = render(<CarouselComposer value={[video]} enableAltText />);
    expect(screen.queryByRole("textbox")).toBeNull();
    rerender(<CarouselComposer value={[{ ...ITEMS[0], alt: "A red barn" }]} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    // preview img + rail thumb img both carry the alt
    expect(screen.getAllByAltText("A red barn")).toHaveLength(2);
    rerender(<CarouselComposer value={[ITEMS[0]]} />);
    expect(screen.getAllByAltText("a.jpg")).toHaveLength(2);
  });
});

describe("upload status (CC4)", () => {
  it("shows a determinate progressbar with a name from labels", () => {
    render(<CarouselComposer value={[{ ...ITEMS[0], status: "uploading", progress: 0.4 }]} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAccessibleName("Item 1 of 1 uploading, 40%");
  });

  it("shows the item's error text with a Retry that calls onRetry(item)", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    const item: MediaCarouselItem = { ...ITEMS[0], status: "error", error: "Network lost" };
    render(<CarouselComposer value={[item]} onRetry={onRetry} />);
    expect(screen.getByText("Network lost")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "a", status: "error" }));
  });

  it("falls back to labels.uploadFailed and hides Retry without onRetry", () => {
    render(<CarouselComposer value={[{ ...ITEMS[0], status: "error" }]} />);
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("announces a status change, not the initial status and not progress ticks", async () => {
    const item: MediaCarouselItem = { ...ITEMS[0], status: "uploading", progress: 0.1 };
    const { rerender } = render(<CarouselComposer value={[item]} />);
    const live = document.querySelector("output")!;
    expect(live).toHaveTextContent("");
    rerender(<CarouselComposer value={[{ ...item, progress: 0.7 }]} />);
    expect(live).toHaveTextContent("");
    rerender(<CarouselComposer value={[{ ...item, status: "uploaded" }]} />);
    await waitFor(() => expect(live).toHaveTextContent("Item 1 of 1 uploaded"));
  });

  it("updateItem merges a patch (uncontrolled) and ignores an unknown id", async () => {
    const ref = createRef<CarouselComposerHandle>();
    const onChange = vi.fn();
    render(<CarouselComposer ref={ref} defaultValue={ITEMS} onChange={onChange} />);
    act(() => ref.current!.updateItem("nope", { status: "error" }));
    expect(onChange).not.toHaveBeenCalled();
    act(() => ref.current!.updateItem("a", { status: "error", error: "boom" }));
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(ref.current!.getItems()[0]).toMatchObject({ id: "a", status: "error", error: "boom" });
  });

  it("updateItem in controlled mode calls onChange with the patched array and renders the prop", () => {
    const ref = createRef<CarouselComposerHandle>();
    const onChange = vi.fn();
    render(<CarouselComposer ref={ref} value={ITEMS} onChange={onChange} />);
    act(() => ref.current!.updateItem("a", { alt: "hello" }));
    const next = onChange.mock.calls.at(-1)![0] as MediaCarouselItem[];
    expect(next[0]).toMatchObject({ id: "a", alt: "hello" });
    expect(next[1]).toBe(ITEMS[1]);
    expect(screen.queryByText("boom")).toBeNull();
  });
});

describe("MIME allow-list and video duration (CC5)", () => {
  it("refuses video/webm under PLATFORM_SAFE_MIME with labels.errors.unsupportedType", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    const onValidationError = vi.fn();
    render(
      <CarouselComposer ref={ref} acceptMime={PLATFORM_SAFE_MIME} onValidationError={onValidationError} />,
    );
    await add(ref, [webm()]);
    expect(screen.getByRole("alert")).toHaveTextContent("Unsupported file type: video/webm");
    expect(onValidationError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "unsupported-type", message: "Unsupported file type: video/webm" }),
    );
    expect(ref.current!.getItems()).toHaveLength(0);
  });

  it("uses the list as the input's accept; the default stays image/*,video/*", () => {
    const { container, unmount } = render(<CarouselComposer acceptMime={PLATFORM_SAFE_MIME} />);
    expect(container.querySelector("input[type=file]")).toHaveAttribute("accept", PLATFORM_SAFE_MIME.join(","));
    unmount();
    const second = render(<CarouselComposer />);
    expect(second.container.querySelector("input[type=file]")).toHaveAttribute("accept", "image/*,video/*");
  });

  it("accepts WebM by default (permissive)", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} />);
    await add(ref, [webm()]);
    expect(ref.current!.getItems()).toHaveLength(1);
  });

  it("refuses a 45 s video over maxVideoSeconds={30} and accepts a 20 s one", async () => {
    stubs = installIntakeStubs({ durations: { "long.mp4": 45, "short.mp4": 20 } });
    const ref = createRef<CarouselComposerHandle>();
    const onValidationError = vi.fn();
    render(<CarouselComposer ref={ref} maxVideoSeconds={30} onValidationError={onValidationError} />);
    await add(ref, [mp4("long.mp4"), mp4("short.mp4")]);
    expect(onValidationError).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "video-too-long",
        durationSeconds: 45,
        maxSeconds: 30,
        message: "Video is 45 s — maximum is 30 s.",
      }),
    );
    expect(ref.current!.getItems().map((i) => i.fileName)).toEqual(["short.mp4"]);
    // the refused video's object URL is released
    expect(stubs.revoked.length).toBeGreaterThan(0);
  });

  it("accepts a video whose duration cannot be read", async () => {
    stubs = installIntakeStubs({ durations: { "x.mp4": Number.NaN } });
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} maxVideoSeconds={5} />);
    await add(ref, [mp4("x.mp4")]);
    const [item] = ref.current!.getItems();
    expect(item.fileName).toBe("x.mp4");
    expect(item.duration).toBeUndefined();
  });
});

describe("poster frame and duration badge (CC6)", () => {
  it("adds duration, a JPEG posterBlob and an owned posterUrl; the thumb shows the badge", async () => {
    stubs = installIntakeStubs({ durations: { "clip.mp4": 45 } });
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} />);
    await add(ref, [mp4()]);
    const [item] = ref.current!.getItems();
    expect(item.duration).toBe(45);
    expect(item.posterBlob?.type).toBe("image/jpeg");
    expect(item.posterUrl).toMatch(/^blob:/);
    expect(stubs.seeks).toContain(0.5);
    const badge = screen.getByRole("img", { name: `Duration ${formatDuration(45)}` });
    expect(badge).toHaveTextContent("0:45");
    const thumb = screen.getByRole("button", { name: /Media item 1 of 1/ });
    expect(within(thumb).getByRole("presentation", { hidden: true })).toHaveAttribute("src", item.posterUrl);
  });

  it("clamps posterAt to the duration, and posterAt={false} grabs no frame", async () => {
    stubs = installIntakeStubs({ durations: { "clip.mp4": 1.5 } });
    const ref = createRef<CarouselComposerHandle>();
    const { unmount } = render(<CarouselComposer ref={ref} posterAt={9} />);
    await add(ref, [mp4()]);
    expect(Math.max(...stubs.seeks)).toBeLessThanOrEqual(1.5);
    unmount();
    stubs.seeks.length = 0;
    const ref2 = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref2} posterAt={false} />);
    await add(ref2, [mp4()]);
    const [item] = ref2.current!.getItems();
    expect(item.posterBlob).toBeUndefined();
    expect(item.duration).toBe(1.5);
    expect(stubs.seeks).toHaveLength(0);
  });

  it("a failed frame grab is no poster and no error", async () => {
    stubs = installIntakeStubs({ noCanvas: true });
    const ref = createRef<CarouselComposerHandle>();
    const onValidationError = vi.fn();
    render(<CarouselComposer ref={ref} onValidationError={onValidationError} />);
    await add(ref, [mp4()]);
    expect(ref.current!.getItems()[0].posterBlob).toBeUndefined();
    expect(onValidationError).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("revokes the poster URL when the item is removed", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} />);
    await add(ref, [mp4()]);
    const [item] = ref.current!.getItems();
    expect(stubs.revoked).not.toContain(item.posterUrl);
    expect(stubs.revoked).not.toContain(item.url);
    act(() => ref.current!.removeItem(item.id));
    expect(stubs.revoked).toContain(item.posterUrl);
    expect(stubs.revoked).toContain(item.url);
  });

  it("formatDuration: m:ss, h:mm:ss, locale digits; the prop overrides the badge", () => {
    expect(formatDuration(45)).toBe("0:45");
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(45, "ar-EG")).toBe("٠:٤٥");
    const video: MediaCarouselItem = { id: "v", kind: "video", url: "https://example.test/v.mp4", duration: 45 };
    render(<CarouselComposer value={[video]} formatDuration={(s) => `${s} sec`} />);
    expect(screen.getByRole("img", { name: "Duration 45 sec" })).toBeInTheDocument();
  });

  it("locale tr/ar changes the digits of the default badge", () => {
    const video: MediaCarouselItem = { id: "v", kind: "video", url: "https://example.test/v.mp4", duration: 45 };
    render(<CarouselComposer value={[video]} locale="ar-EG" />);
    expect(screen.getByRole("img", { name: "Duration ٠:٤٥" })).toBeInTheDocument();
  });
});

describe("never WebM (CC7)", () => {
  it("keeps the identical File as a video item's blob", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} />);
    const file = mp4();
    await add(ref, [file]);
    expect(ref.current!.getItems()[0].blob).toBe(file);
    const out = await ref.current!.export();
    expect(out[0].blob).toBe(file);
  });

  it("no shipped file references MediaRecorder", () => {
    const root = join(__dirname, "..");
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (name === "__tests__" || name === "node_modules") continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|json)$/.test(name) && readFileSync(p, "utf8").includes("MediaRecorder")) hits.push(p);
      }
    };
    walk(root);
    expect(hits).toEqual([]);
  });
});

describe("labels (CC8)", () => {
  it("shows no English in the dropzone, errors or the dismiss button when overridden", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    const { container } = render(<CarouselComposer ref={ref} labels={turkishLabels} acceptMime={["image/png"]} />);
    expect(screen.getByText("Fotoğraf ve videoları buraya sürükleyin")).toBeInTheDocument();
    expect(screen.getByText("veya en fazla 10 dosya bırakın")).toBeInTheDocument();
    await add(ref, [jpg()]);
    expect(screen.getByRole("alert")).toHaveTextContent("Desteklenmeyen dosya türü: image/jpeg");
    expect(screen.getByRole("button", { name: "Kapat" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Unsupported|Dismiss|Drag photos|Adding media/);
  });

  it("announces additions and removals from labels", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} labels={turkishLabels} />);
    await add(ref, [jpg()]);
    expect(document.querySelector("output")).toHaveTextContent("1 öğe eklendi");
    act(() => ref.current!.removeItem(ref.current!.getItems()[0].id));
    expect(document.querySelector("output")).toHaveTextContent("Öğe kaldırıldı");
  });

  it("warns once, naming the key, for a 0.2 string template and keeps the English default", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const legacy = { dropzoneHint: "or drop up to {max} files" } as never;
    const { rerender } = render(<CarouselComposer labels={legacy} />);
    expect(screen.getByText("or drop up to 10 files")).toBeInTheDocument();
    rerender(<CarouselComposer labels={{ dropzoneHint: "or drop up to {max} files" } as never} maxItems={4} />);
    const mine = warn.mock.calls.filter((c) => String(c[0]).includes("dropzoneHint"));
    expect(mine).toHaveLength(1);
    expect(screen.getByText("or drop up to 4 files")).toBeInTheDocument();
  });
});

describe("keyboard reorder (dnd-kit KeyboardSensor)", () => {
  it("moves an item with Space, ArrowRight, Space on the drag handle and announces from labels.drag", async () => {
    // jsdom has no layout: give each sortable wrapper a rect by its position in the rail.
    const orig = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      if (this.classList.contains("shrink-0") && this.classList.contains("group")) {
        const i = Array.from(this.parentElement!.children).indexOf(this);
        return { x: i * 72, y: 0, left: i * 72, right: i * 72 + 64, top: 0, bottom: 64, width: 64, height: 64, toJSON() {} };
      }
      return orig.call(this);
    };
    try {
      const onReorder = vi.fn();
      const user = userEvent.setup();
      render(<CarouselComposer defaultValue={ITEMS} onReorder={onReorder} labels={turkishLabels} />);
      const handles = screen.getAllByRole("button", { name: "Sıralamak için sürükleyin" });
      handles[0].focus();
      await user.keyboard(" ");
      await user.keyboard("{ArrowRight}");
      await user.keyboard(" ");
      await waitFor(() => expect(onReorder).toHaveBeenCalled());
      expect((onReorder.mock.calls.at(-1)![0] as MediaCarouselItem[]).map((i) => i.id)).toEqual(["b", "a"]);
      expect(document.body.textContent).toContain("bırakıldı");
    } finally {
      HTMLElement.prototype.getBoundingClientRect = orig;
    }
  });
});
