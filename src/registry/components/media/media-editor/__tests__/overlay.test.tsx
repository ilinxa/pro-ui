import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MediaEditor } from "../media-editor";

describe("media-editor overlay prop", () => {
  it("renders inside the editor surface (inline)", () => {
    render(
      <MediaEditor
        presentation="inline"
        enabledModes={[]}
        overlay={<button type="button">overlay-btn</button>}
      />,
    );
    const surface = document.querySelector('[data-slot="media-editor"]')!;
    expect(within(surface as HTMLElement).getByText("overlay-btn")).toBeTruthy();
  });

  it("renders inside the dialog content (dialog presentation)", () => {
    render(
      <MediaEditor
        presentation="dialog"
        isOpen
        onClose={() => {}}
        overlay={<button type="button">overlay-btn</button>}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("overlay-btn")).toBeTruthy();
  });

  it("honors nested labels end-to-end", () => {
    render(
      <MediaEditor
        presentation="dialog"
        isOpen
        onClose={() => {}}
        enabledModes={["photo", "video", "text"]}
        mediaSources={["upload"]}
        labels={{ capture: { modes: { photo: "Foto" } } } as never}
      />,
    );
    expect(within(screen.getByRole("dialog")).getByText("Foto")).toBeTruthy();
  });

  it("dev-warns once when the inert `labels.publish` / `labels.empty` groups are passed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <MediaEditor presentation="inline" enabledModes={[]} labels={{ empty: { noSource: "x" } } as never} />,
    );
    rerender(<MediaEditor presentation="inline" enabledModes={[]} labels={{ empty: { noSource: "y" } } as never} />);
    const hits = warn.mock.calls.filter((c) => String(c[0]).includes("labels.publish"));
    expect(hits).toHaveLength(1);
    warn.mockRestore();
  });
});
