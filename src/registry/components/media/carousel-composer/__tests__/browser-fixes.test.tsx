/**
 * carousel-composer 0.3.0 browser fix wave (W1, W2, W4, W5, W8, W10): focus after dismissing
 * the error alert, edit open / close focus, RTL rail, keyboard drop announcement, Arabic
 * plurals, and accessible names.
 */
import { useEffect, useRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CarouselComposer } from "../carousel-composer";
import { arabicLabels, turkishLabels } from "../dummy-data";
import type { CarouselComposerHandle, CarouselEditorPanelProps, MediaCarouselItem } from "../types";
import { mockResizeObserver, renderWithContext } from "../../../../../../tests/helpers";
import { ITEMS, installIntakeStubs, jpg, type IntakeStubs } from "./support";

let restoreRo: () => void;
let stubs: IntakeStubs | undefined;
beforeEach(() => {
  restoreRo = mockResizeObserver();
});
afterEach(() => {
  stubs?.restore();
  stubs = undefined;
  restoreRo();
  vi.restoreAllMocks();
});

const bad = () => new File(["x"], "notes.txt", { type: "text/plain" });
const dismiss = () => screen.getByRole("button", { name: "Dismiss" });

describe("W1 dismissing the error alert keeps focus in the component", () => {
  it("empty carousel -> the dropzone Browse button", async () => {
    const ref = { current: null as CarouselComposerHandle | null };
    const user = userEvent.setup();
    render(<CarouselComposer ref={ref} />);
    await act(async () => {
      ref.current!.addFiles([bad()]);
    });
    await user.click(dismiss());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Browse" }));
  });

  it("room left -> the add-more tile", async () => {
    const ref = { current: null as CarouselComposerHandle | null };
    const user = userEvent.setup();
    render(<CarouselComposer ref={ref} defaultValue={ITEMS} />);
    await act(async () => {
      ref.current!.addFiles([bad()]);
    });
    await user.click(dismiss());
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add more" }));
  });

  it("full carousel -> the selected thumb's select button", async () => {
    stubs = installIntakeStubs();
    const ref = { current: null as CarouselComposerHandle | null };
    const user = userEvent.setup();
    render(<CarouselComposer ref={ref} defaultValue={ITEMS} maxItems={2} />);
    await act(async () => {
      ref.current!.addFiles([jpg()]);
    });
    await user.click(dismiss());
    expect(document.activeElement).toHaveAttribute("data-thumb-select", "a");
  });
});

let panelProps: CarouselEditorPanelProps | null = null;
function PlainPanel(props: CarouselEditorPanelProps) {
  useEffect(() => {
    panelProps = props;
  });
  return <div data-testid="plain-panel" />;
}
function FocusingPanel() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return <input ref={ref} aria-label="inner" />;
}

describe("W2 edit flow focus", () => {
  it("opening the edit moves focus into a labelled container", async () => {
    const user = userEvent.setup();
    render(<CarouselComposer defaultValue={ITEMS} editing={{ Panel: PlainPanel }} />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const group = screen.getByRole("group", { name: "Edit" });
    expect(group).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement).toBe(group);
  });

  it("keeps focus the panel already moved inside", async () => {
    const user = userEvent.setup();
    render(<CarouselComposer defaultValue={ITEMS} editing={{ Panel: FocusingPanel }} />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "inner" }));
  });

  it("Done (apply) returns focus to the Edit button", async () => {
    const user = userEvent.setup();
    render(<CarouselComposer defaultValue={ITEMS} editing={{ Panel: PlainPanel }} />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    act(() => panelProps!.onApply("a", { url: "blob:edited" }));
    expect(screen.queryByTestId("plain-panel")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit" }));
  });

  it("Cancel returns focus to the Edit button", async () => {
    const user = userEvent.setup();
    render(<CarouselComposer defaultValue={ITEMS} editing={{ Panel: PlainPanel }} />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    act(() => panelProps!.onCancel());
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit" }));
  });

  it("an automatic close with no Edit button falls back to the selected thumb", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CarouselComposer defaultValue={ITEMS} editing={{ Panel: PlainPanel }} />,
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));
    rerender(
      <CarouselComposer defaultValue={ITEMS} editing={{ Panel: PlainPanel }} canEditItem={() => false} />,
    );
    expect(screen.queryByTestId("plain-panel")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(document.activeElement).toHaveAttribute("data-thumb-select", "a");
  });

  it("does not pull focus the user already moved elsewhere", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">outside</button>
        <CarouselComposer defaultValue={ITEMS} editing={{ Panel: PlainPanel }} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));
    screen.getByRole("button", { name: "outside" }).focus();
    act(() => panelProps!.onCancel());
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "outside" }));
  });
});

describe("W4 RTL rail", () => {
  const root = () => document.querySelector<HTMLElement>('[data-slot="scroll-area"]')!;

  it("passes the dir prop to the ScrollArea root and the rail container", () => {
    render(<CarouselComposer defaultValue={ITEMS} dir="rtl" />);
    expect(root()).toHaveAttribute("dir", "rtl");
    expect(root().querySelector('div[dir="rtl"]')).not.toBeNull();
  });

  it("reads an ancestor dir=rtl after mount", () => {
    renderWithContext(<CarouselComposer defaultValue={ITEMS} />, { dir: "rtl" });
    expect(root()).toHaveAttribute("dir", "rtl");
  });

  it("is ltr by default", () => {
    render(<CarouselComposer defaultValue={ITEMS} />);
    expect(root()).toHaveAttribute("dir", "ltr");
  });
});

describe("W5 keyboard drop announcement", () => {
  it("states the final position, not the displaced item's", async () => {
    const orig = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      if (this.classList.contains("shrink-0") && this.classList.contains("group")) {
        const i = Array.from(this.parentElement!.children).indexOf(this);
        return { x: i * 72, y: 0, left: i * 72, right: i * 72 + 64, top: 0, bottom: 64, width: 64, height: 64, toJSON() {} };
      }
      return orig.call(this);
    };
    try {
      const three: MediaCarouselItem[] = [...ITEMS, { id: "c", kind: "image", url: "https://example.test/c.jpg" }];
      const onReorder = vi.fn();
      const user = userEvent.setup();
      render(<CarouselComposer defaultValue={three} onReorder={onReorder} />);
      screen.getAllByRole("button", { name: "Drag to reorder" })[0].focus();
      await user.keyboard(" ");
      await user.keyboard("{ArrowRight}");
      await user.keyboard(" ");
      await waitFor(() => expect(onReorder).toHaveBeenCalled());
      expect((onReorder.mock.calls.at(-1)![0] as MediaCarouselItem[]).map((i) => i.id)).toEqual(["b", "a", "c"]);
      expect(document.body.textContent).toContain("dropped at position 2 of 3");
    } finally {
      HTMLElement.prototype.getBoundingClientRect = orig;
    }
  });
});

describe("W8 Arabic plurals and new label shapes", () => {
  const added = arabicLabels.itemsAdded!;
  it("uses singular for 1, dual for 2, plural otherwise", () => {
    expect(added(1)).toBe("تمت إضافة عنصر واحد");
    expect(added(2)).toBe("تمت إضافة عنصرين");
    expect(added(3)).toBe("تمت إضافة 3 عناصر");
    expect(added(11)).toBe("تمت إضافة 11 عنصرًا");
  });

  it.each([
    ["tr", turkishLabels],
    ["ar", arabicLabels],
  ])("%s labels carry removeItem and the positional uploadProgress", (_n, labels) => {
    expect(labels.removeItem!({ position: 2, total: 3, kind: "image" })).toMatch(/2/);
    expect(labels.uploadProgress!(0.4, { position: 2, total: 3 })).toMatch(/2/);
    expect(labels.uploadProgress!(0.4, { position: 2, total: 3 })).toMatch(/3/);
  });
});

describe("W10 accessible names", () => {
  it("names each Remove button by position and total", () => {
    render(<CarouselComposer defaultValue={ITEMS} />);
    expect(screen.getByRole("button", { name: "Remove item 1 of 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove item 2 of 2" })).toBeInTheDocument();
  });

  it("describes the alt input by its counter", () => {
    render(<CarouselComposer defaultValue={ITEMS} enableAltText />);
    const field = screen.getByRole("textbox", { name: "Alt text" });
    expect(field).toHaveAccessibleDescription("0/200");
  });

  it("names the thumb and preview progress bars with the item position", () => {
    const items: MediaCarouselItem[] = [
      { ...ITEMS[0], status: "uploading", progress: 0.4 },
      { ...ITEMS[1], status: "uploading", progress: 0.6 },
    ];
    render(<CarouselComposer value={items} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Item 1 of 2 uploading, 40%",
      "Item 2 of 2 uploading, 60%",
    ]);
  });
});
