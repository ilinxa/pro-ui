/**
 * The editing seam (CC1 / CC2): image editing is an opt-in add-on passed as `editing`.
 * media-editor is mocked so Konva never loads.
 */
import { createRef, forwardRef, useImperativeHandle } from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const editor = vi.hoisted(() => ({
  modified: true,
  exportCalls: [] as unknown[],
}));

vi.mock("@/registry/components/media/media-editor/media-editor", () => ({
  MediaEditor: forwardRef(function MockMediaEditor(
    props: Record<string, unknown>,
    ref,
  ) {
    useImperativeHandle(ref, () => ({
      isModified: () => editor.modified,
      exportImage: async (opts: unknown) => {
        editor.exportCalls.push(opts);
        return {
          blob: new Blob(["edited"], { type: "image/png" }),
          metadata: { width: 10, height: 10, mimeType: "image/png" },
        };
      },
      getState: () => ({ imageSrc: "blob:old" }),
      getSourceBlob: () => null,
      loadState: () => {},
    }));
    return <div data-testid="mock-editor" data-tools={String(props.enabledTools)} />;
  }),
}));

import { CarouselComposer } from "../carousel-composer";
import type {
  CarouselComposerHandle,
  CarouselEditorPanelProps,
  MediaCarouselItem,
} from "../types";
import { carouselEditing } from "../features/editing";

const ITEMS: MediaCarouselItem[] = [
  { id: "a", kind: "image", url: "https://example.test/a.jpg", fileName: "a.jpg" },
  { id: "b", kind: "image", url: "https://example.test/b.jpg", fileName: "b.jpg" },
  { id: "v", kind: "video", url: "https://example.test/v.mp4", fileName: "v.mp4" },
];

let warn: MockInstance<typeof console.warn>;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  URL.createObjectURL = vi.fn(() => "blob:edited");
  URL.revokeObjectURL = vi.fn();
  editor.modified = true;
  editor.exportCalls = [];
});
afterEach(() => vi.restoreAllMocks());

const editButton = () => screen.queryByRole("button", { name: "Edit" });
const warned = (needle: string) =>
  warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes(needle));
// Rail thumbs are named "Media item N of M, kind" (default itemAria).
const thumb = (n: number) =>
  screen.getAllByRole("button").find((b) => (b.getAttribute("aria-label") ?? "").startsWith(`Media item ${n} of`))!;

describe("without `editing`", () => {
  it("shows no Edit button on an image and no caption on a video", () => {
    render(<CarouselComposer defaultValue={ITEMS} />);
    expect(editButton()).toBeNull();
    fireEvent.click(thumb(3));
    expect(screen.queryByText(/video editing isn't available/i)).toBeNull();
    expect(editButton()).toBeNull();
  });

  it("ignores ref.openEditor and warns once", () => {
    const ref = createRef<CarouselComposerHandle>();
    const onEditOpen = vi.fn();
    render(<CarouselComposer ref={ref} defaultValue={ITEMS} onEditOpen={onEditOpen} />);
    act(() => ref.current!.openEditor("a"));
    act(() => ref.current!.openEditor("b"));
    expect(onEditOpen).not.toHaveBeenCalled();
    expect(screen.queryByTestId("mock-editor")).toBeNull();
    expect(warned("no `editing`")).toHaveLength(1);
  });

  it("warns once when `editorProps` is passed", () => {
    const { rerender } = render(
      <CarouselComposer defaultValue={ITEMS} editorProps={{ enabledTools: ["crop"] }} />,
    );
    rerender(<CarouselComposer defaultValue={ITEMS} editorProps={{ enabledTools: ["draw"] }} />);
    expect(warned("editorProps")).toHaveLength(1);
  });
});

describe("with editing={carouselEditing}", () => {
  it("shows Edit for an image, mounts the panel, Done applies, Cancel closes", async () => {
    const onEditApply = vi.fn();
    const onEditCancel = vi.fn();
    render(
      <CarouselComposer
        defaultValue={ITEMS}
        editing={carouselEditing}
        editorProps={{ enabledTools: ["crop"] }}
        onEditApply={onEditApply}
        onEditCancel={onEditCancel}
      />,
    );
    fireEvent.click(editButton()!);
    expect(screen.getByTestId("mock-editor")).toHaveAttribute("data-tools", "crop");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("mock-editor")).toBeNull();
    expect(onEditCancel).toHaveBeenCalledWith("a");

    fireEvent.click(editButton()!);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Done" }));
    });
    expect(screen.queryByTestId("mock-editor")).toBeNull();
    expect(onEditApply).toHaveBeenCalledTimes(1);
    const applied = onEditApply.mock.calls[0][0] as MediaCarouselItem;
    expect(applied).toMatchObject({ id: "a", url: "blob:edited", width: 10, height: 10 });
    expect(applied.editorState).toMatchObject({ imageSrc: "blob:old" });
    // F-05: only the photo's area is exported (no letterbox bars).
    expect(editor.exportCalls).toEqual([{ region: "media" }]);
  });

  it("Done with no change keeps the item: no export, no apply, closes like Cancel (F-05)", async () => {
    editor.modified = false;
    const onEditApply = vi.fn();
    const onEditCancel = vi.fn();
    render(
      <CarouselComposer
        defaultValue={ITEMS}
        editing={carouselEditing}
        onEditApply={onEditApply}
        onEditCancel={onEditCancel}
      />,
    );
    fireEvent.click(editButton()!);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Done" }));
    });
    expect(screen.queryByTestId("mock-editor")).toBeNull();
    expect(editor.exportCalls).toEqual([]);
    expect(onEditApply).not.toHaveBeenCalled();
    expect(onEditCancel).toHaveBeenCalledWith("a");
  });

  it("never opens a video: no button, the handle ignores it with a warning", () => {
    const ref = createRef<CarouselComposerHandle>();
    const onEditOpen = vi.fn();
    render(
      <CarouselComposer
        ref={ref}
        defaultValue={ITEMS}
        editing={carouselEditing}
        onEditOpen={onEditOpen}
      />,
    );
    fireEvent.click(thumb(3));
    expect(editButton()).toBeNull();
    expect(screen.getByText(/video editing isn't available/i)).toBeInTheDocument();
    act(() => ref.current!.openEditor("v"));
    expect(onEditOpen).not.toHaveBeenCalled();
    expect(screen.queryByTestId("mock-editor")).toBeNull();
    expect(warned("only image items")).toHaveLength(1);
  });

  it("canEditItem hides Edit for a refused item and the handle refuses it", () => {
    const ref = createRef<CarouselComposerHandle>();
    const onEditOpen = vi.fn();
    render(
      <CarouselComposer
        ref={ref}
        defaultValue={ITEMS}
        editing={carouselEditing}
        canEditItem={(it) => it.id !== "b"}
        onEditOpen={onEditOpen}
      />,
    );
    expect(editButton()).not.toBeNull();
    fireEvent.click(thumb(2));
    expect(editButton()).toBeNull();
    act(() => ref.current!.openEditor("b"));
    expect(onEditOpen).not.toHaveBeenCalled();
    expect(screen.queryByTestId("mock-editor")).toBeNull();
    expect(warned("canEditItem")).toHaveLength(1);
    act(() => ref.current!.openEditor("a"));
    expect(onEditOpen).toHaveBeenCalledWith("a");
  });
});

describe("a custom Panel", () => {
  it("receives exactly { item, aspect, labels, editorProps, onApply, onCancel }", () => {
    const seen: CarouselEditorPanelProps[] = [];
    function MyPanel(props: CarouselEditorPanelProps) {
      seen.push(props);
      return <div data-testid="my-panel" />;
    }
    render(
      <CarouselComposer
        defaultValue={ITEMS}
        editing={{ Panel: MyPanel }}
        editorProps={{ custom: 1 }}
      />,
    );
    fireEvent.click(editButton()!);
    expect(screen.getByTestId("my-panel")).toBeInTheDocument();
    const props = seen[0];
    expect(Object.keys(props).sort()).toEqual(
      ["aspect", "aspectRatio", "editorProps", "item", "labels", "onApply", "onCancel"].sort(),
    );
    expect(props.item.id).toBe("a");
    expect(props.editorProps).toEqual({ custom: 1 });
    expect(Object.keys(props.labels).sort()).toEqual(
      ["editCancel", "editDone", "editError", "editSaving"].sort(),
    );
  });
});
