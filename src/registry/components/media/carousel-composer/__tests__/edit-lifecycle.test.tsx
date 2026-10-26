/**
 * The open edit's lifecycle (B4 / B6 / B7) with a custom Panel, so media-editor never loads.
 */
import { createRef, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CarouselComposer } from "../carousel-composer";
import type {
  CarouselComposerHandle,
  CarouselEditorPanelProps,
  MediaCarouselItem,
} from "../types";
import { mockResizeObserver } from "../../../../../../tests/helpers";

const ITEMS: MediaCarouselItem[] = [
  { id: "a", kind: "image", url: "https://example.test/a.jpg", status: "uploaded", progress: 1 },
  { id: "b", kind: "image", url: "https://example.test/b.jpg" },
];

let panel: CarouselEditorPanelProps | null;
function Panel(props: CarouselEditorPanelProps) {
  useEffect(() => {
    panel = props;
  });
  return <div data-testid="my-panel" />;
}
const editing = { Panel };

let warn: MockInstance<typeof console.warn>;
let revoke: ReturnType<typeof vi.fn>;
let restoreRo: () => void;
beforeEach(() => {
  panel = null;
  restoreRo = mockResizeObserver();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  revoke = vi.fn();
  URL.revokeObjectURL = revoke as unknown as typeof URL.revokeObjectURL;
});
afterEach(() => {
  restoreRo();
  vi.restoreAllMocks();
});

const editButton = () => screen.getByRole("button", { name: "Edit" });
const warned = (needle: string) =>
  warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes(needle));

describe("B4 onApply is accepted only for the open edit", () => {
  it("ignores a foreign or unknown id, warns once, and releases the panel's blob URL", () => {
    const onEditApply = vi.fn();
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} defaultValue={ITEMS} editing={editing} onEditApply={onEditApply} />);
    fireEvent.click(editButton());
    act(() => panel!.onApply("b", { url: "blob:foreign" }));
    act(() => panel!.onApply("zzz", { url: "blob:unknown" }));
    expect(onEditApply).not.toHaveBeenCalled();
    expect(ref.current!.getItems()[1].url).toBe("https://example.test/b.jpg");
    expect(screen.getByTestId("my-panel")).toBeInTheDocument();
    expect(revoke).toHaveBeenCalledWith("blob:foreign");
    expect(revoke).toHaveBeenCalledWith("blob:unknown");
    expect(warned("not the one being edited")).toHaveLength(1);
  });

  it("clears the upload state of the applied item and ignores a second apply", () => {
    const onEditApply = vi.fn();
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} defaultValue={ITEMS} editing={editing} onEditApply={onEditApply} />);
    fireEvent.click(editButton());
    const open = panel!;
    act(() => open.onApply("a", { url: "blob:edited" }));
    expect(onEditApply).toHaveBeenCalledTimes(1);
    const applied = onEditApply.mock.calls[0][0] as MediaCarouselItem;
    expect(applied).toMatchObject({ id: "a", url: "blob:edited" });
    expect(applied.status).toBeUndefined();
    expect(applied.progress).toBeUndefined();
    expect(applied.error).toBeUndefined();
    expect(ref.current!.getItems()[0].status).toBeUndefined();
    act(() => open.onApply("a", { url: "blob:again" }));
    expect(onEditApply).toHaveBeenCalledTimes(1);
    expect(ref.current!.getItems()[0].url).toBe("blob:edited");
    expect(revoke).toHaveBeenCalledWith("blob:again");
  });
});

describe("B6 an open edit that can no longer happen is cancelled", () => {
  it("when the item leaves `items`", () => {
    const onEditCancel = vi.fn();
    const ref = createRef<CarouselComposerHandle>();
    const { rerender } = render(
      <CarouselComposer ref={ref} value={ITEMS} editing={editing} onEditCancel={onEditCancel} />,
    );
    act(() => ref.current!.openEditor("a"));
    expect(screen.getByTestId("my-panel")).toBeInTheDocument();
    rerender(<CarouselComposer ref={ref} value={[ITEMS[1]]} editing={editing} onEditCancel={onEditCancel} />);
    expect(onEditCancel).toHaveBeenCalledTimes(1);
    expect(onEditCancel).toHaveBeenCalledWith("a");
    rerender(<CarouselComposer ref={ref} value={ITEMS} editing={editing} onEditCancel={onEditCancel} />);
    expect(screen.queryByTestId("my-panel")).toBeNull();
    expect(onEditCancel).toHaveBeenCalledTimes(1);
  });

  it("when `editing` is removed", () => {
    const onEditCancel = vi.fn();
    const ref = createRef<CarouselComposerHandle>();
    const { rerender } = render(
      <CarouselComposer ref={ref} value={ITEMS} editing={editing} onEditCancel={onEditCancel} />,
    );
    act(() => ref.current!.openEditor("a"));
    rerender(<CarouselComposer ref={ref} value={ITEMS} onEditCancel={onEditCancel} />);
    expect(onEditCancel).toHaveBeenCalledTimes(1);
    rerender(<CarouselComposer ref={ref} value={ITEMS} editing={editing} onEditCancel={onEditCancel} />);
    expect(screen.queryByTestId("my-panel")).toBeNull();
    expect(onEditCancel).toHaveBeenCalledTimes(1);
  });

  it("when canEditItem starts refusing the item", () => {
    const onEditCancel = vi.fn();
    const ref = createRef<CarouselComposerHandle>();
    const { rerender } = render(
      <CarouselComposer ref={ref} value={ITEMS} editing={editing} canEditItem={() => true} onEditCancel={onEditCancel} />,
    );
    act(() => ref.current!.openEditor("a"));
    expect(screen.getByTestId("my-panel")).toBeInTheDocument();
    rerender(
      <CarouselComposer ref={ref} value={ITEMS} editing={editing} canEditItem={() => false} onEditCancel={onEditCancel} />,
    );
    expect(screen.queryByTestId("my-panel")).toBeNull();
    expect(onEditCancel).toHaveBeenCalledTimes(1);
  });

  it("openEditor with an unknown id does nothing", () => {
    const onEditOpen = vi.fn();
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} value={ITEMS} editing={editing} onEditOpen={onEditOpen} />);
    act(() => ref.current!.openEditor("nope"));
    expect(onEditOpen).not.toHaveBeenCalled();
    expect(screen.queryByTestId("my-panel")).toBeNull();
  });
});

describe("B7 a Panel can cancel from its mount effect", () => {
  it("closes the edit and fires onEditCancel once", () => {
    const onEditCancel = vi.fn();
    function EagerPanel({ onCancel }: CarouselEditorPanelProps) {
      useEffect(() => {
        onCancel();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return <div data-testid="eager-panel" />;
    }
    render(<CarouselComposer defaultValue={ITEMS} editing={{ Panel: EagerPanel }} onEditCancel={onEditCancel} />);
    fireEvent.click(editButton());
    expect(screen.queryByTestId("eager-panel")).toBeNull();
    expect(onEditCancel).toHaveBeenCalledTimes(1);
    expect(onEditCancel).toHaveBeenCalledWith("a");
  });
});
