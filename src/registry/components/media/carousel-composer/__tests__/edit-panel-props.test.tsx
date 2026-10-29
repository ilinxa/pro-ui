/**
 * B3: the edit panel forwards only the six documented `editorProps` keys to media-editor.
 * The panel owns aspect, cropAspects, initialSource, enabledModes and presentation.
 */
import { forwardRef, useImperativeHandle } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const seen: Array<Record<string, unknown>> = [];
vi.mock("@/registry/components/media/media-editor/media-editor", () => ({
  MediaEditor: forwardRef(function MockMediaEditor(props: Record<string, unknown>, ref) {
    seen.push(props);
    useImperativeHandle(ref, () => ({ export: async () => null, getState: () => ({}), getSourceBlob: () => null, loadState: () => {} }));
    return null;
  }),
}));

import { CarouselEditPanel } from "../features/editing";
import type { MediaCarouselItem } from "../types";

const item: MediaCarouselItem = { id: "a", kind: "image", url: "https://example.test/a.jpg" };
const labels = { editDone: "Done", editCancel: "Cancel", editSaving: "Saving", editError: "Error" };

describe("CarouselEditPanel editorProps", () => {
  it("cannot be overridden by an undocumented key", () => {
    render(
      <CarouselEditPanel
        item={item}
        aspect="1:1"
        aspectRatio={1}
        labels={labels}
        onApply={() => {}}
        onCancel={() => {}}
        editorProps={{
          cropAspects: ["free"],
          aspect: "16:9",
          enabledModes: ["photo"],
          presentation: "dialog",
          initialSource: { kind: "url", url: "https://evil.test/x.jpg", mode: "photo" },
          enabledTools: ["crop"],
          labels: { done: "Fertig" },
        }}
      />,
    );
    const props = seen.at(-1)!;
    expect(props.cropAspects).toEqual(["1:1"]);
    expect(props.aspect).toBe("1:1");
    expect(props.enabledModes).toEqual([]);
    expect(props.presentation).toBe("inline");
    expect(props.initialSource).toMatchObject({ url: "https://example.test/a.jpg" });
    expect(props.enabledTools).toEqual(["crop"]);
    expect(props.labels).toEqual({ done: "Fertig" });
  });
});
