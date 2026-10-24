/**
 * The R9 test helpers must catch what they exist to catch. Runs in the `repo-dom` project.
 */
import { render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  contractChecks,
  type ContractSpec,
  createEmblaApi,
  expectNoAxeViolations,
  fireMedia,
  installMediaElementStubs,
  mockIntersectionObserver,
  mockLayout,
  mockMatchMedia,
  mockResizeObserver,
  renderWithContext,
} from "./helpers";

describe("expectNoAxeViolations", () => {
  it("fails on a fixture with a violation", async () => {
    const { container } = render(
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- a deliberate axe violation fixture */}
        <img src="x.png" />
        <button type="button" />
      </div>,
    );
    await expect(expectNoAxeViolations(container)).rejects.toThrow(/image-alt|button-name/);
  });

  it("passes a clean fixture", async () => {
    const { container } = render(
      <main>
        {/* eslint-disable-next-line @next/next/no-img-element -- plain DOM fixture, not app code */}
        <img src="x.png" alt="A chart" />
        <button type="button">Save</button>
      </main>,
    );
    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});

describe("renderWithContext", () => {
  it("wraps in dir + lang", () => {
    const { getByTestId } = renderWithContext(<span>x</span>, { dir: "rtl", locale: "ar" });
    expect(getByTestId("context-root")).toHaveAttribute("dir", "rtl");
    expect(getByTestId("context-root")).toHaveAttribute("lang", "ar");
  });
});

describe("environment mocks", () => {
  it("mockMatchMedia answers reduced motion and pointer, then restores", () => {
    const original = window.matchMedia;
    const restore = mockMatchMedia({ reducedMotion: true, pointer: "coarse" });
    expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
    expect(window.matchMedia("(pointer: fine)").matches).toBe(false);
    expect(window.matchMedia("(pointer: coarse)").matches).toBe(true);
    restore();
    expect(window.matchMedia).toBe(original);
  });

  it("observers call back on observe with the configured visibility", () => {
    const r1 = mockResizeObserver();
    const r2 = mockIntersectionObserver({ visible: false });
    const onResize = vi.fn();
    const onIntersect = vi.fn();
    new ResizeObserver(onResize).observe(document.body);
    new IntersectionObserver(onIntersect).observe(document.body);
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onIntersect.mock.calls[0][0][0].isIntersecting).toBe(false);
    r2();
    r1();
  });

  it("mockLayout reports sizes and line height, then restores", () => {
    const el = document.createElement("p");
    const restore = mockLayout({ scrollHeight: 120, lineHeight: "20px" });
    expect(el.scrollHeight).toBe(120);
    expect(getComputedStyle(el).lineHeight).toBe("20px");
    restore();
    expect(el.scrollHeight).toBe(0);
  });

  it("createEmblaApi emits to subscribed handlers", () => {
    const api = createEmblaApi({ snaps: 4 });
    const onSelect = vi.fn();
    api.on("select", onSelect);
    api.emit("select");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(api.scrollSnapList()).toHaveLength(4);
  });
});

describe("media element stubs", () => {
  it("play / pause / time / events", async () => {
    const restore = installMediaElementStubs();
    const video = document.createElement("video");
    const onTime = vi.fn();
    video.addEventListener("timeupdate", onTime);
    await video.play();
    expect(video.paused).toBe(false);
    fireMedia(video, "loadedmetadata", { duration: 30 });
    fireMedia(video, "timeupdate", { currentTime: 12 });
    expect([video.duration, video.currentTime]).toEqual([30, 12]);
    expect(onTime).toHaveBeenCalledTimes(1);
    video.pause();
    expect(video.paused).toBe(true);
    restore();
  });

  it("a blocked play() rejects", async () => {
    const restore = installMediaElementStubs({ playError: new Error("NotAllowedError") });
    await expect(document.createElement("audio").play()).rejects.toThrow("NotAllowedError");
    restore();
  });
});

describe("media stubs keep `paused` in step with the event", () => {
  it("pause / playing / load", async () => {
    const restore = installMediaElementStubs();
    const video = document.createElement("video");
    await video.play();
    fireMedia(video, "pause");
    expect(video.paused).toBe(true);
    fireMedia(video, "playing");
    expect(video.paused).toBe(false);
    fireMedia(video, "timeupdate", { currentTime: 9 });
    video.load();
    expect([video.paused, video.currentTime]).toEqual([true, 0]);
    restore();
  });
});

describe("mockLayout covers getPropertyValue('line-height')", () => {
  it("both read paths agree", () => {
    const restore = mockLayout({ lineHeight: "20px" });
    const style = getComputedStyle(document.body);
    expect([style.lineHeight, style.getPropertyValue("line-height")]).toEqual(["20px", "20px"]);
    restore();
  });
});

describe("renderWithContext keeps its direction across rerender", () => {
  it("rerender stays inside dir=rtl", () => {
    const { rerender, getByTestId } = renderWithContext(<span>a</span>, { dir: "rtl" });
    rerender(<span>b</span>);
    expect(getByTestId("context-root")).toHaveAttribute("dir", "rtl");
    expect(getByTestId("context-root")).toHaveTextContent("b");
  });
});

/**
 * The kit must FAIL a component that is broken the way a check names. A small toggle that
 * honours labels + a controlled `open` prop is the healthy baseline; each broken variant
 * drops one property.
 */
type ToggleProps = {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  labels?: { show?: string };
  ignoreControlled?: boolean;
  ignoreLabels?: boolean;
  unlabelled?: boolean;
};
function Toggle({ open, onOpenChange, labels, ignoreControlled, ignoreLabels, unlabelled }: ToggleProps) {
  const [inner, setInner] = useState(false);
  const isOpen = open !== undefined && !ignoreControlled ? open : inner;
  const name = ignoreLabels ? "Show" : (labels?.show ?? "Show");
  return (
    <button
      type="button"
      aria-label={unlabelled ? undefined : name}
      aria-expanded={isOpen}
      onClick={() => {
        if (open === undefined || ignoreControlled) setInner(!isOpen);
        onOpenChange?.(!isOpen);
      }}
    />
  );
}
const spec = (extra: ToggleProps): ContractSpec => ({
  render: (p) => <Toggle {...extra} {...p} />,
  renders: (s) => expect(s.getByRole("button")).toBeInTheDocument(),
  labels: { props: { labels: { show: "Göster" } }, expect: (s) => expect(s.getByRole("button")).toHaveAccessibleName("Göster") },
  controlled: {
    initial: { open: false },
    next: { open: true },
    callback: "onOpenChange",
    expectInitial: (s) => expect(s.getByRole("button")).toHaveAttribute("aria-expanded", "false"),
    expectNext: (s) => expect(s.getByRole("button")).toHaveAttribute("aria-expanded", "true"),
    request: (user, s) => user.click(s.getByRole("button")),
  },
  rtl: { expect: (s, root) => expect(root).toContainElement(s.getByRole("button")) },
  keyboard: {
    run: async (user) => {
      await user.tab();
      await user.keyboard("{Enter}");
    },
    expect: (s) => expect(s.getByRole("button")).toHaveAttribute("aria-expanded", "true"),
  },
});
const check = (extra: ToggleProps, name: RegExp) => contractChecks(spec(extra)).find((c) => name.test(c.name))!;

describe("the contract kit fails broken components", () => {
  it("a healthy component passes every check", async () => {
    for (const c of contractChecks(spec({}))) await c.run();
  });

  it("ignoring the controlled prop fails the controlled checks", async () => {
    await expect(check({ ignoreControlled: true }, /re-renders when/).run()).rejects.toThrow();
    await expect(check({ ignoreControlled: true }, /keeps rendering the prop/).run()).rejects.toThrow();
  });

  it("dropping labels fails the labels check", async () => {
    await expect(check({ ignoreLabels: true }, /labels override/).run()).rejects.toThrow();
  });

  it("a not-applicable check is skipped and carries its reason", () => {
    const checks = contractChecks({
      ...spec({}),
      labels: { notApplicable: "renders no strings" },
      controlled: { notApplicable: "holds no state" },
      keyboard: { notApplicable: "nothing focusable" },
    });
    const skipped = checks.filter((c) => c.skip);
    expect(skipped.map((c) => c.name)).toEqual([
      "applies a labels override — not applicable: renders no strings",
      "re-renders when the controlled prop changes — not applicable: holds no state",
      "supports the keyboard path — not applicable: nothing focusable",
    ]);
    expect(checks.some((c) => /requested change/.test(c.name))).toBe(false);
    expect(checks.filter((c) => !c.skip).map((c) => c.name)).toEqual([
      "renders",
      "renders right-to-left without axe violations",
      "has no axe violations",
    ]);
  });

  it("a not-applicable check without a reason is rejected", () => {
    expect(() => contractChecks({ ...spec({}), labels: { notApplicable: " " } })).toThrow(/non-empty reason/);
  });

  it("an unnamed control fails the axe checks", async () => {
    await expect(check({ unlabelled: true }, /has no axe violations/).run()).rejects.toThrow(/button-name/);
    await expect(check({ unlabelled: true }, /right-to-left/).run()).rejects.toThrow(/button-name/);
  });
});
