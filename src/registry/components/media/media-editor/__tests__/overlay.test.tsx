import * as React from "react";
import { describe, expect, it } from "vitest";
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
        labels={{ capture: { modes: { photo: "Foto" } } }}
      />,
    );
    expect(within(screen.getByRole("dialog")).getByText("Foto")).toBeTruthy();
  });

});

describe("media-editor overlay makes the editor body inert", () => {
  const body = () => document.querySelector<HTMLElement>('[data-slot="media-editor-body"]')!;
  const inertNodes = () => document.querySelectorAll("[inert]");
  const Overlay = () => (
    <div data-testid="ov">
      <button type="button">overlay-btn</button>
    </div>
  );

  for (const presentation of ["inline", "dialog"] as const) {
    it(`${presentation}: body inert, overlay not inert, none without an overlay`, () => {
      const props =
        presentation === "dialog"
          ? ({ presentation, isOpen: true, onClose: () => {} } as const)
          : ({ presentation } as const);
      const { rerender } = render(<MediaEditor {...props} mediaSources={["upload"]} />);
      expect(inertNodes().length).toBe(0);
      expect(body().hasAttribute("inert")).toBe(false);

      rerender(<MediaEditor {...props} mediaSources={["upload"]} overlay={<Overlay />} />);
      expect(body().hasAttribute("inert")).toBe(true);
      expect(inertNodes().length).toBe(1);
      const ov = screen.getByTestId("ov");
      expect(ov.closest("[inert]")).toBeNull();
      // the editor's own controls are behind the overlay
      expect(
        (screen.getByText("Choose from gallery") as HTMLElement).closest("[inert]"),
      ).toBe(body());

      rerender(<MediaEditor {...props} mediaSources={["upload"]} />);
      expect(inertNodes().length).toBe(0);
    });
  }

  it("moves focus off the inert body into the overlay when it mounts", () => {
    const { rerender } = render(
      <MediaEditor presentation="inline" mediaSources={["upload"]} />,
    );
    const gallery = screen.getByText("Choose from gallery");
    gallery.focus();
    expect(document.activeElement).toBe(gallery);
    rerender(
      <MediaEditor presentation="inline" mediaSources={["upload"]} overlay={<Overlay />} />,
    );
    expect(document.activeElement).toBe(screen.getByText("overlay-btn"));
    // and hands it back when the overlay goes away
    rerender(<MediaEditor presentation="inline" mediaSources={["upload"]} />);
    expect(document.activeElement).toBe(gallery);
  });

  it("leaves focus alone when the overlay already took it", () => {
    function Autofocus() {
      return <input aria-label="ov-input" autoFocus />;
    }
    const { rerender } = render(<MediaEditor presentation="inline" mediaSources={["upload"]} />);
    rerender(
      <MediaEditor presentation="inline" mediaSources={["upload"]} overlay={<Autofocus />} />,
    );
    expect(document.activeElement).toBe(screen.getByLabelText("ov-input"));
  });
});
