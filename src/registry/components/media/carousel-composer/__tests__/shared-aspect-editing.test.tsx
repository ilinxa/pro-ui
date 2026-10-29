/**
 * CC-1 editing add-on: the panel locks media-editor to the shared aspect and Done exports at
 * it (region "media", width x height of that ratio, never above the photo's pixels). Also
 * `tsc`-checked: `CarouselAspectRatio` and media-editor's `CropAspect` stay the same set.
 */
import { forwardRef, useImperativeHandle } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const seen: Array<Record<string, unknown>> = [];
const exportImage = vi.fn();
let isModified = true;
vi.mock("@/registry/components/media/media-editor/media-editor", () => ({
  MediaEditor: forwardRef(function MockMediaEditor(props: Record<string, unknown>, ref) {
    seen.push(props);
    useImperativeHandle(ref, () => ({
      exportImage,
      isModified: () => isModified,
      getState: () => ({}),
      getSourceBlob: () => null,
      loadState: () => {},
    }));
    return null;
  }),
}));

import { CarouselEditPanel } from "../features/editing";
import type { CarouselAspectRatio, MediaCarouselItem } from "../types";
import type { CropAspect } from "@/registry/components/media/media-editor/media-editor";

// Mutual assignability (tsc is the assertion).
type AssertAssignable<A extends B, B> = A extends B ? true : never;
export type CarouselToCrop = AssertAssignable<CarouselAspectRatio, CropAspect>;
export type CropToCarousel = AssertAssignable<CropAspect, CarouselAspectRatio>;

const labels = { editDone: "Done", editCancel: "Cancel", editSaving: "Saving", editError: "Error" };
const item: MediaCarouselItem = { id: "a", kind: "image", url: "https://example.test/a.jpg", width: 4000, height: 3000 };

const result = (width: number, height: number) => ({
  blob: new Blob(["x"], { type: "image/jpeg" }),
  metadata: { mode: "photo", width, height },
});

beforeEach(() => {
  seen.length = 0;
  exportImage.mockReset();
  isModified = true;
  URL.createObjectURL = vi.fn(() => "blob:test/1");
});

function mount(props: { aspect: string; aspectRatio: number | null; item?: MediaCarouselItem }) {
  const onApply = vi.fn();
  render(
    <CarouselEditPanel
      item={props.item ?? item}
      aspect={props.aspect as never}
      aspectRatio={props.aspectRatio}
      labels={labels}
      onApply={onApply}
      onCancel={() => {}}
    />,
  );
  return onApply;
}

describe("CarouselEditPanel at the shared aspect", () => {
  it("locks media-editor to the aspect (canvas aspect + cropAspects)", () => {
    mount({ aspect: "1.91:1", aspectRatio: 1.91 });
    const props = seen.at(-1)!;
    expect(props.aspect).toBe("1.91:1");
    expect(props.cropAspects).toEqual(["1.91:1"]);
  });

  it("Done on a first edit exports region media at the shared ratio inside the photo", async () => {
    exportImage
      .mockResolvedValueOnce(result(4000, 3000))
      .mockResolvedValueOnce(result(3000, 3000));
    const onApply = mount({ aspect: "1:1", aspectRatio: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(onApply).toHaveBeenCalled());
    expect(exportImage).toHaveBeenNthCalledWith(1, { region: "media" });
    expect(exportImage).toHaveBeenNthCalledWith(2, { region: "media", width: 3000, height: 3000 });
    expect(onApply.mock.calls[0][1]).toMatchObject({ width: 3000, height: 3000 });
  });

  it("never upscales: an applied crop smaller than the item is trimmed inside its own pixels", async () => {
    // The item is 4000 × 3000, but the user applied a small crop: the editor now
    // exports a 1000 × 900 photo. Sizing from the item would upscale it 3×.
    exportImage
      .mockResolvedValueOnce(result(1000, 900))
      .mockResolvedValueOnce(result(720, 900));
    mount({ aspect: "4:5", aspectRatio: 0.8 });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(exportImage).toHaveBeenCalledTimes(2));
    const opts = exportImage.mock.calls[1][0];
    expect(opts.region).toBe("media");
    expect(opts.width).toBeLessThanOrEqual(1000);
    expect(opts.height).toBeLessThanOrEqual(900);
    expect(Math.abs(opts.width / opts.height - 0.8)).toBeLessThan(0.001);
  });

  it("an export already at the shared ratio is used as it is", async () => {
    exportImage.mockResolvedValue(result(800, 1000));
    const onApply = mount({ aspect: "4:5", aspectRatio: 0.8 });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(onApply).toHaveBeenCalled());
    expect(exportImage).toHaveBeenCalledTimes(1);
  });

  it("a re-edit measures the photo first, then trims to the ratio", async () => {
    exportImage
      .mockResolvedValueOnce(result(2000, 1000))
      .mockResolvedValueOnce(result(1000, 1000));
    const onApply = mount({
      aspect: "1:1",
      aspectRatio: 1,
      item: { ...item, editorState: {} as never },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(onApply).toHaveBeenCalled());
    expect(exportImage).toHaveBeenNthCalledWith(1, { region: "media" });
    expect(exportImage).toHaveBeenNthCalledWith(2, { region: "media", width: 1000, height: 1000 });
  });

  it("free keeps today's export (no size)", async () => {
    exportImage.mockResolvedValue(result(4000, 3000));
    const onApply = mount({ aspect: "free", aspectRatio: null });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(onApply).toHaveBeenCalled());
    expect(exportImage).toHaveBeenCalledTimes(1);
    expect(exportImage).toHaveBeenCalledWith({ region: "media" });
  });
});
