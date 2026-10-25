import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { StoryComposer } from "../story-composer";
import type { StoryComposerHandle } from "../types";

/**
 * While the publishing / details overlay is mounted, the controls behind it must not be
 * reachable by keyboard or AT. media-editor makes its editor body `inert` while its `overlay`
 * prop is mounted (media-editor 0.5.0); this proves story-composer's overlays get that.
 *
 * Runs against the REAL editor. Red until the media-editor slice that adds `inert` lands.
 */
describe("overlay focus: editor controls behind the overlay are inert", () => {
  afterEach(() => cleanup());

  const behind = () => screen.getByRole("button", { name: "Choose from gallery" });
  const isInert = (el: Element) => el.closest("[inert]") !== null;

  it("behind the publishing/error overlay", async () => {
    const ref = React.createRef<StoryComposerHandle>();
    await act(async () => {
      render(
        <StoryComposer
          ref={ref}
          isOpen
          presentation="modal"
          onClose={() => {}}
          onPublished={() => {}}
          uploadUrl="/noop"
        />,
      );
    });
    expect(isInert(behind())).toBe(false); // no overlay yet: reachable
    await act(async () => {
      await ref.current!.publish(); // nothing loaded -> export rejects -> error overlay mounts
    });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(isInert(behind())).toBe(true);
    // the overlay's own controls stay interactive
    expect(isInert(within(dialog).getByRole("button", { name: "Try again" }))).toBe(false);
  });
});
