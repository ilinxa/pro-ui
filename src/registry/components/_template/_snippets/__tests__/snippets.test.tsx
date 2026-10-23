import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { isEditableTarget } from "../is-editable-target";
import { useDirection } from "../use-direction";
import { useGlobalKeydown } from "../use-global-keydown";

describe("isEditableTarget (R8)", () => {
  const make = (html: string) => {
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    return host.firstElementChild as HTMLElement;
  };

  it("text input, textarea, select, contentEditable and [role=textbox] are editable", () => {
    expect(isEditableTarget(make('<input type="text" />'))).toBe(true);
    expect(isEditableTarget(make("<input />"))).toBe(true);
    expect(isEditableTarget(make("<textarea></textarea>"))).toBe(true);
    expect(isEditableTarget(make("<select></select>"))).toBe(true);
    const ce = make('<div contenteditable="true"><span>x</span></div>');
    expect(isEditableTarget(ce.firstElementChild)).toBe(true);
    expect(isEditableTarget(make('<div role="textbox"></div>'))).toBe(true);
    expect(isEditableTarget(make('<div data-keyboard-ignore><button></button></div>').firstElementChild)).toBe(true);
  });

  it("button, div and a checkbox are not", () => {
    expect(isEditableTarget(make("<button></button>"))).toBe(false);
    expect(isEditableTarget(make("<div></div>"))).toBe(false);
    expect(isEditableTarget(make('<input type="checkbox" />'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("useGlobalKeydown (R8)", () => {
  function Probe({ onKey, enabled }: { onKey: (e: KeyboardEvent) => void; enabled?: boolean }) {
    useGlobalKeydown(onKey, { enabled });
    return <textarea aria-label="reply" />;
  }

  it("runs for keys outside editable targets", () => {
    const onKey = vi.fn();
    render(<Probe onKey={onKey} />);
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(onKey).toHaveBeenCalledTimes(1);
  });

  it("skips editable targets, composing events and already-handled events", () => {
    const onKey = vi.fn();
    render(<Probe onKey={onKey} />);
    fireEvent.keyDown(screen.getByLabelText("reply"), { key: " " });
    fireEvent.keyDown(document.body, { key: "a", isComposing: true });
    const handled = new KeyboardEvent("keydown", { key: "x", bubbles: true, cancelable: true });
    handled.preventDefault();
    act(() => {
      document.body.dispatchEvent(handled);
    });
    expect(onKey).not.toHaveBeenCalled();
  });

  it("sees through a shadow root to the input the user is typing in", () => {
    const onKey = vi.fn();
    render(<Probe onKey={onKey} />);
    const host = document.createElement("div");
    document.body.append(host);
    const input = host.attachShadow({ mode: "open" }).appendChild(document.createElement("input"));
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, composed: true }));
    });
    expect(onKey).not.toHaveBeenCalled();
    host.remove();
  });

  it("detaches when disabled", () => {
    const onKey = vi.fn();
    render(<Probe onKey={onKey} enabled={false} />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onKey).not.toHaveBeenCalled();
  });
});

describe("useDirection (R6)", () => {
  function Probe({ dir }: { dir?: "ltr" | "rtl" }) {
    const ref = useRef<HTMLSpanElement>(null);
    return <span ref={ref}>{useDirection(ref, dir)}</span>;
  }

  it("the prop wins", () => {
    render(
      <div dir="rtl">
        <Probe dir="ltr" />
      </div>,
    );
    expect(screen.getByText("ltr")).toBeInTheDocument();
  });

  it("reads an ancestor dir=rtl after mount", () => {
    render(
      <div dir="rtl">
        <Probe />
      </div>,
    );
    expect(screen.getByText("rtl")).toBeInTheDocument();
  });

  it("the server render returns the prop or ltr", () => {
    expect(renderToString(<div dir="rtl"><Probe /></div>)).toContain(">ltr<");
    expect(renderToString(<Probe dir="rtl" />)).toContain(">rtl<");
  });
});
