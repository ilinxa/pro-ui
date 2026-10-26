/**
 * carousel-composer 0.3.0 hardening (U4): handle reads, focus hand-off, announcements, URL
 * lifecycle, progress / labels / locale edge cases, intake `accept`, poster size, a11y names.
 */
import { createRef, useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CarouselComposer } from "../carousel-composer";
import { formatDuration } from "../lib/format-duration";
import { mergeLabels } from "../lib/labels";
import { grabPoster } from "../lib/poster";
import { defaultCarouselComposerLabels } from "../types";
import type { CarouselComposerHandle, MediaCarouselItem } from "../types";
import { mockResizeObserver } from "../../../../../../tests/helpers";
import { ITEMS, installIntakeStubs, jpg, mp4, type IntakeStubs } from "./support";

let stubs: IntakeStubs | undefined;
let restoreRo: () => void;
beforeEach(() => {
  restoreRo = mockResizeObserver();
});
afterEach(() => {
  stubs?.restore();
  stubs = undefined;
  restoreRo();
  vi.restoreAllMocks();
});

const add = async (ref: React.RefObject<CarouselComposerHandle | null>, files: File[]) => {
  await act(async () => {
    await ref.current!.addFiles(files);
  });
};
const live = () => document.querySelector("output")!;
const ZERO_WIDTH = /​/g;

describe("A1 handle reads the synchronous items", () => {
  it("getItems inside onItemAdd already contains the new item", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    let seen: MediaCarouselItem[] = [];
    render(
      <CarouselComposer
        ref={ref}
        defaultValue={ITEMS}
        onItemAdd={() => {
          seen = ref.current!.getItems();
        }}
      />,
    );
    await add(ref, [jpg()]);
    expect(seen).toHaveLength(3);
  });

  it("updateItem then export in one tick includes the patch", async () => {
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} defaultValue={ITEMS} />);
    let exported: MediaCarouselItem[] = [];
    await act(async () => {
      ref.current!.updateItem("a", { status: "uploaded", alt: "Now" });
      exported = await ref.current!.export();
    });
    expect(exported[0]).toMatchObject({ id: "a", status: "uploaded", alt: "Now" });
  });
});

describe("A2 handle addFiles uses the latest props", () => {
  it("applies a labels.errors change made after mount", async () => {
    const ref = createRef<CarouselComposerHandle>();
    const messages: string[] = [];
    const props = { ref, defaultValue: ITEMS, onValidationError: (e: { message: string }) => messages.push(e.message) };
    const { rerender } = render(
      <CarouselComposer {...props} labels={{ errors: { unsupportedType: () => "old" } }} />,
    );
    rerender(<CarouselComposer {...props} labels={{ errors: { unsupportedType: () => "new" } }} />);
    await add(ref, [new File(["x"], "n.txt", { type: "text/plain" })]);
    expect(messages).toEqual(["new"]);
  });
});

describe("A3 focus hand-off", () => {
  function RetryHost({ initial, next }: { initial: MediaCarouselItem[]; next: Partial<MediaCarouselItem> }) {
    const [items, setItems] = useState(initial);
    return (
      <CarouselComposer
        value={items}
        onChange={setItems}
        onRetry={(it) =>
          setItems((cur) => cur.map((x) => (x.id === it.id ? { ...x, ...next } : x)))
        }
      />
    );
  }
  const errored = (id: string): MediaCarouselItem => ({
    id,
    kind: "image",
    url: `https://example.test/${id}.jpg`,
    status: "error",
    error: "bad",
  });

  it("preview Retry -> the item's progress bar", async () => {
    const user = userEvent.setup();
    render(<RetryHost initial={[errored("a")]} next={{ status: "uploading", progress: 0.2, error: undefined }} />);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(document.activeElement).toBe(screen.getByRole("progressbar"));
    expect(document.activeElement).toHaveAttribute("data-progress-for", "a");
  });

  it("thumb Retry -> the item's thumb when nothing else is shown", async () => {
    const user = userEvent.setup();
    const ok: MediaCarouselItem = { id: "a", kind: "image", url: "https://example.test/a.jpg" };
    render(<RetryHost initial={[ok, errored("b")]} next={{ status: "uploaded", error: undefined }} />);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(document.activeElement).toHaveAttribute("data-thumb-select", "b");
  });

  it("thumb Retry -> the thumb's progress bar when it starts uploading", async () => {
    const user = userEvent.setup();
    const ok: MediaCarouselItem = { id: "a", kind: "image", url: "https://example.test/a.jpg" };
    render(<RetryHost initial={[ok, errored("b")]} next={{ status: "uploading", progress: 0.1, error: undefined }} />);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(document.activeElement).toHaveAttribute("data-progress-for", "b");
  });

  const three: MediaCarouselItem[] = ["a", "b", "c"].map((id) => ({
    id,
    kind: "image",
    url: `https://example.test/${id}.jpg`,
  }));

  it("Remove -> the next thumb, else the previous, else the dropzone Browse button", async () => {
    const user = userEvent.setup();
    render(<CarouselComposer defaultValue={three} />);
    await user.click(screen.getAllByRole("button", { name: /^Remove item \d+ of \d+$/ })[1]); // remove b
    expect(document.activeElement).toHaveAttribute("data-thumb-select", "c");
    await user.click(screen.getAllByRole("button", { name: /^Remove item \d+ of \d+$/ })[1]); // remove c (last)
    expect(document.activeElement).toHaveAttribute("data-thumb-select", "a");
    await user.click(screen.getByRole("button", { name: /^Remove item \d+ of \d+$/ })); // remove a (only)
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Browse" }));
  });
});

describe("A4 announcements", () => {
  it("announces an error that changes while the status stays 'error'", () => {
    const err = (error: string): MediaCarouselItem[] => [
      { ...ITEMS[0], status: "error", error },
      ITEMS[1],
    ];
    const { rerender } = render(<CarouselComposer value={err("e1")} />);
    expect(live()).toHaveTextContent("");
    rerender(<CarouselComposer value={err("e2")} />);
    expect(live()).toHaveTextContent("Item 1 of 2 failed to upload: e2");
  });

  it("speaks the same text twice in a row", async () => {
    const user = userEvent.setup();
    render(<CarouselComposer defaultValue={[...ITEMS, { id: "c", kind: "image", url: "https://example.test/c.jpg" }]} />);
    await user.click(screen.getAllByRole("button", { name: /^Remove item \d+ of \d+$/ })[0]);
    const first = live().textContent!;
    expect(first.replace(ZERO_WIDTH, "")).toBe("Item removed");
    await user.click(screen.getAllByRole("button", { name: /^Remove item \d+ of \d+$/ })[0]);
    const second = live().textContent!;
    expect(second.replace(ZERO_WIDTH, "")).toBe("Item removed");
    expect(second).not.toBe(first);
  });
});

describe("A5 addFiles resolving after unmount", () => {
  it("revokes the item and poster URLs it created and adds nothing", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    const onChange = vi.fn();
    const onItemAdd = vi.fn();
    const { unmount } = render(<CarouselComposer ref={ref} onChange={onChange} onItemAdd={onItemAdd} />);
    let pending!: Promise<void>;
    act(() => {
      pending = ref.current!.addFiles([mp4()]) as unknown as Promise<void>;
    });
    unmount();
    await act(async () => {
      await pending;
    });
    expect(stubs.created).toHaveLength(2); // video + poster
    expect(stubs.revoked.sort()).toEqual([...stubs.created].sort());
    expect(onChange).not.toHaveBeenCalled();
    expect(onItemAdd).not.toHaveBeenCalled();
  });
});

describe("A6 object URL lifecycle", () => {
  it("a late-echo controlled host keeps a live URL across an unrelated value change", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    const pending: { current: MediaCarouselItem[] | null } = { current: null };
    const api: { echo: () => void; unrelated: () => void } = { echo: () => {}, unrelated: () => {} };
    function Host() {
      const [value, setValue] = useState(ITEMS);
      api.echo = () => setValue(pending.current!);
      api.unrelated = () => setValue((v) => [...v]);
      return (
        <CarouselComposer
          ref={ref}
          value={value}
          onChange={(next) => {
            pending.current = next;
          }}
        />
      );
    }
    const { container } = render(<Host />);
    await add(ref, [jpg()]);
    const fresh = stubs.created[0];
    act(() => api.unrelated());
    expect(stubs.revoked).not.toContain(fresh);
    act(() => api.echo());
    expect(stubs.revoked).not.toContain(fresh);
    expect(container.querySelector(`img[src="${fresh}"]`)).not.toBeNull();
  });

  it("a removed item's URL is still revoked once the removal commits", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} />);
    await add(ref, [jpg()]);
    const fresh = stubs.created[0];
    const id = ref.current!.getItems()[0].id;
    expect(stubs.revoked).not.toContain(fresh);
    act(() => ref.current!.removeItem(id));
    expect(stubs.revoked).toContain(fresh);
  });
});

describe("A7 progress", () => {
  it("reads NaN as 0 on the preview bar and the thumb bar", () => {
    const items: MediaCarouselItem[] = [
      { ...ITEMS[0], status: "uploading", progress: Number.NaN },
      { ...ITEMS[1], status: "uploading", progress: Number.POSITIVE_INFINITY },
    ];
    render(<CarouselComposer value={items} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(2);
    bars.forEach((bar) => expect(bar).toHaveAttribute("aria-valuenow", "0"));
    expect(bars[0]).toHaveAccessibleName("Item 1 of 2 uploading, 0%");
    expect(bars[1]).toHaveAccessibleName("Item 2 of 2 uploading, 0%");
  });
});

describe("A8 labels", () => {
  it("ignores undefined keys at the top level, in errors and in drag", () => {
    const { labels } = mergeLabels({
      dropzoneTitle: undefined,
      errors: { fileTooLarge: undefined },
      drag: { pickedUp: undefined },
    });
    expect(labels.dropzoneTitle).toBe(defaultCarouselComposerLabels.dropzoneTitle);
    expect(labels.errors.fileTooLarge).toBe(defaultCarouselComposerLabels.errors.fileTooLarge);
    expect(labels.drag.pickedUp).toBe(defaultCarouselComposerLabels.drag.pickedUp);
  });

  it("renders with explicit undefined labels", () => {
    render(<CarouselComposer labels={{ dropzoneTitle: undefined, dropzoneHint: undefined }} />);
    expect(screen.getByText("Drag photos & videos here")).toBeInTheDocument();
    expect(screen.getByText("or drop up to 10 files")).toBeInTheDocument();
  });
});

describe("A9 duration formatting", () => {
  it("an invalid locale reads as English instead of throwing", () => {
    expect(formatDuration(65, "tr_TR")).toBe("1:05");
  });

  it("builds the formatters once per locale", () => {
    formatDuration(5, "sv");
    const Original = Intl.NumberFormat;
    let built = 0;
    Intl.NumberFormat = class extends Original {
      constructor(...args: ConstructorParameters<typeof Original>) {
        super(...args);
        built++;
      }
    } as typeof Intl.NumberFormat;
    try {
      formatDuration(65, "sv");
      formatDuration(125, "sv");
    } finally {
      Intl.NumberFormat = Original;
    }
    expect(built).toBe(0);
  });

  it("the component renders a video badge with locale='tr_TR'", () => {
    const video: MediaCarouselItem = { id: "v", kind: "video", url: "https://example.test/v.mp4", duration: 65 };
    render(<CarouselComposer value={[video]} locale="tr_TR" />);
    expect(screen.getByRole("img", { name: "Duration 1:05" })).toBeInTheDocument();
  });
});

describe("A10 revokeOnUnmount read at unmount", () => {
  it("flipping true -> false at runtime revokes nothing, then unmount keeps the URLs", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    const { rerender, unmount } = render(<CarouselComposer ref={ref} revokeOnUnmount />);
    await add(ref, [jpg()]);
    const fresh = stubs.created[0];
    rerender(<CarouselComposer ref={ref} revokeOnUnmount={false} />);
    expect(stubs.revoked).not.toContain(fresh);
    unmount();
    expect(stubs.revoked).not.toContain(fresh);
  });

  it("with the default, unmount revokes the owned URLs", async () => {
    stubs = installIntakeStubs();
    const ref = createRef<CarouselComposerHandle>();
    const { unmount } = render(<CarouselComposer ref={ref} />);
    await add(ref, [jpg()]);
    unmount();
    expect(stubs.revoked).toContain(stubs.created[0]);
  });
});

describe("A11 input accept", () => {
  it("lists only the acceptMime entries of an accepted kind", () => {
    const { container } = render(
      <CarouselComposer accept={["image"]} acceptMime={["image/jpeg", "video/mp4", "image/png"]} />,
    );
    expect(container.querySelector("input[type=file]")).toHaveAttribute("accept", "image/jpeg,image/png");
  });
});

describe("A12 poster size", () => {
  it("draws a 3840x2160 frame no wider than 1280 px, aspect kept", async () => {
    const sizes: Array<[number, number]> = [];
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    const origToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
      sizes.push([this.width, this.height]);
      return { drawImage: () => {} };
    } as never;
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      cb(new Blob(["f"], { type: "image/jpeg" }));
    };
    try {
      const video = document.createElement("video");
      let current = 0;
      Object.defineProperties(video, {
        videoWidth: { get: () => 3840 },
        videoHeight: { get: () => 2160 },
        currentTime: {
          get: () => current,
          set: (v: number) => {
            current = v;
            queueMicrotask(() => video.dispatchEvent(new Event("seeked")));
          },
        },
      });
      const blob = await grabPoster(video, 0.5, 10);
      expect(blob).not.toBeNull();
      expect(sizes).toEqual([[1280, 720]]);
    } finally {
      HTMLCanvasElement.prototype.getContext = origGetContext;
      HTMLCanvasElement.prototype.toBlob = origToBlob;
    }
  });
});

describe("A14 accessible names and announcements", () => {
  it("the empty dropzone is a named group", () => {
    render(<CarouselComposer />);
    expect(screen.getByRole("group", { name: "Drag photos & videos here" })).toBeInTheDocument();
  });

  it("the default thumb name carries the status and the alt", () => {
    const items: MediaCarouselItem[] = [
      { ...ITEMS[0], alt: "Beach at sunset", status: "uploading", progress: 0.5 },
      ITEMS[1],
      { id: "c", kind: "image", url: "https://example.test/c.jpg", status: "uploaded" },
    ];
    render(<CarouselComposer value={items} />);
    expect(
      screen.getByRole("button", { name: "Media item 1 of 3, image, uploading: Beach at sunset" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Media item 2 of 3, image" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Media item 3 of 3, image" })).toBeInTheDocument();
  });

  it("maxReached goes to the alert list only, not to the live region", async () => {
    const ref = createRef<CarouselComposerHandle>();
    stubs = installIntakeStubs();
    render(<CarouselComposer ref={ref} defaultValue={ITEMS} maxItems={2} />);
    await add(ref, [jpg()]);
    expect(screen.getByRole("alert")).toHaveTextContent("Maximum 2 items reached");
    expect(live().textContent).toBe("");
  });

  it("announces how many items were kept when the cap drops some", async () => {
    const ref = createRef<CarouselComposerHandle>();
    stubs = installIntakeStubs();
    render(<CarouselComposer ref={ref} defaultValue={ITEMS} maxItems={3} />);
    await add(ref, [jpg("x.jpg"), jpg("y.jpg")]);
    expect(screen.getByRole("alert")).toHaveTextContent("Maximum 3 items reached");
    expect(live().textContent).toBe("1 item added");
  });
});
