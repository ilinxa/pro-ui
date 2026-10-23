/**
 * R1 / I1 / I2 (AS1) - controlled `isCollapsed` / `isMobileOpen` and storage.
 *
 * Reproduction R1: `isCollapsed={false}` + `storageKey` with a stored
 * `collapsed:true`. Before 0.5.0 storage dispatched EXTERNAL_SYNC(true) into the
 * raw reducer, so the first toggle click flipped raw to `false` -> requested
 * `false` = the value already on screen -> nothing happened.
 */
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../app-sidebar";
import type { AppSidebarHandle, NavEntry } from "../types";

const KEY = "test-sidebar";

const ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/home" },
  {
    kind: "section",
    id: "sec",
    title: "Projects",
    collapsible: true,
    items: [{ id: "p1", label: "Alpha", href: "/p1" }],
  },
];

const nav = (c: HTMLElement) => c.querySelector<HTMLElement>('nav[data-component="app-sidebar"]')!;
const dialog = () => document.querySelector('[role="dialog"]');

function seed(collapsed: boolean, collapsedSectionIds: string[] = []) {
  window.localStorage.setItem(KEY, JSON.stringify({ v: 1, collapsed, collapsedSectionIds }));
}

/** Parsed payloads of every `localStorage.setItem(KEY, …)` so far. */
function writes(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls
    .filter((c) => c[0] === KEY)
    .map((c) => JSON.parse(String(c[1])) as { collapsed: boolean; collapsedSectionIds: string[] });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  window.localStorage.clear();
  (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = vi.fn();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("R1/I2: controlled isCollapsed + storageKey", () => {
  it("R1/I2: renders data-collapsed=false on every render even though storage holds collapsed:true", async () => {
    seed(true);
    const { container, rerender } = render(
      <AppSidebar items={ITEMS} currentPath="/home" isCollapsed={false} storageKey={KEY} />,
    );
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "false");
    rerender(<AppSidebar items={ITEMS} currentPath="/home" isCollapsed={false} storageKey={KEY} />);
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "false");
  });

  it("R1/I2: the FIRST toggle click requests collapsed:true; the DOM stays expanded until the prop changes", async () => {
    seed(true);
    const onCollapsedChange = vi.fn();
    const { container, getByRole, rerender } = render(
      <AppSidebar
        items={ITEMS}
        currentPath="/home"
        isCollapsed={false}
        storageKey={KEY}
        onCollapsedChange={onCollapsedChange}
      />,
    );
    await flush();
    expect(onCollapsedChange).not.toHaveBeenCalled();

    fireEvent.click(getByRole("button", { name: "Collapse sidebar" }));
    await flush();

    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
    expect(onCollapsedChange).toHaveBeenCalledWith({ collapsed: true });
    // host has not updated its state -> nothing moved
    expect(nav(container)).toHaveAttribute("data-collapsed", "false");

    // host applies the request
    rerender(
      <AppSidebar
        items={ITEMS}
        currentPath="/home"
        isCollapsed
        storageKey={KEY}
        onCollapsedChange={onCollapsedChange}
      />,
    );
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "true");
    // a prop-driven change is not echoed back to the host
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
  });

  it("R1/I2: a second click while the prop is still constant requests the same value again (no swallowed request)", async () => {
    seed(true);
    const onCollapsedChange = vi.fn();
    const { getByRole } = render(
      <AppSidebar
        items={ITEMS}
        currentPath="/home"
        isCollapsed={false}
        storageKey={KEY}
        onCollapsedChange={onCollapsedChange}
      />,
    );
    await flush();
    const btn = getByRole("button", { name: "Collapse sidebar" });
    fireEvent.click(btn);
    await flush();
    fireEvent.click(btn);
    await flush();
    expect(onCollapsedChange.mock.calls).toEqual([[{ collapsed: true }], [{ collapsed: true }]]);
  });

  it("R1/I2: while controlled, no setItem writes a `collapsed` different from the stored one; section state still persists", async () => {
    vi.useFakeTimers();
    seed(true);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { getByRole } = render(
      <AppSidebar items={ITEMS} currentPath="/home" isCollapsed={false} storageKey={KEY} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    // collapse the section (persisted state) + click the rail toggle (requested, not applied)
    fireEvent.click(getByRole("button", { name: /Projects/ }));
    fireEvent.click(getByRole("button", { name: "Collapse sidebar" }));
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const all = writes(setItem);
    expect(all.length).toBeGreaterThan(0);
    // every write carries the STORED collapsed value, never the rendered `false`
    for (const w of all) expect(w.collapsed).toBe(true);
    // ...and the section toggle did persist
    expect(all[all.length - 1].collapsedSectionIds).toEqual(["sec"]);
  });

  it("R1/I2: controlled mode does not read `collapsed` from storage (rendered value is the prop even after remount)", async () => {
    seed(true);
    const first = render(
      <AppSidebar items={ITEMS} currentPath="/home" isCollapsed={false} storageKey={KEY} />,
    );
    await flush();
    first.unmount();
    const second = render(
      <AppSidebar items={ITEMS} currentPath="/home" isCollapsed={false} storageKey={KEY} />,
    );
    await flush();
    expect(nav(second.container)).toHaveAttribute("data-collapsed", "false");
  });
});

describe("I1: uncontrolled + storage behaves as 0.4.1", () => {
  it("I1: rehydrates `collapsed` from storage after mount", async () => {
    seed(true);
    const { container } = render(<AppSidebar items={ITEMS} currentPath="/home" storageKey={KEY} />);
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "true");
  });

  it("I1: rehydrates the collapsed section set (whole-set replace)", async () => {
    seed(false, ["sec"]);
    const { getByRole } = render(
      <AppSidebar items={ITEMS} currentPath="/home" storageKey={KEY} autoExpandActiveSection={false} />,
    );
    await flush();
    expect(getByRole("button", { name: /Projects/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("I1: writes `collapsed` on toggle (debounced 50ms)", async () => {
    vi.useFakeTimers();
    seed(true);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { getByRole } = render(<AppSidebar items={ITEMS} currentPath="/home" storageKey={KEY} />);
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    setItem.mockClear();

    fireEvent.click(getByRole("button", { name: "Expand sidebar" }));
    // inside the debounce window nothing is written yet
    await act(async () => {
      vi.advanceTimersByTime(20);
    });
    expect(writes(setItem)).toHaveLength(0);
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    const all = writes(setItem);
    expect(all).toHaveLength(1);
    expect(all[0].collapsed).toBe(false);
  });

  it("I1: uncontrolled toggle moves the DOM and fires onCollapsedChange", async () => {
    const onCollapsedChange = vi.fn();
    const { container, getByRole } = render(
      <AppSidebar items={ITEMS} currentPath="/home" onCollapsedChange={onCollapsedChange} />,
    );
    fireEvent.click(getByRole("button", { name: "Collapse sidebar" }));
    await flush();
    expect(nav(container)).toHaveAttribute("data-collapsed", "true");
    expect(onCollapsedChange).toHaveBeenCalledWith({ collapsed: true });
  });
});

describe("I2: controlled isMobileOpen", () => {
  it("I2: handle.openMobile('trigger') requests {open:true, reason:'trigger'}; the drawer stays closed until the prop changes", async () => {
    const ref = createRef<AppSidebarHandle>();
    const onMobileOpenChange = vi.fn();
    const { rerender } = render(
      <AppSidebar
        ref={ref}
        items={ITEMS}
        currentPath="/home"
        isMobileOpen={false}
        onMobileOpenChange={onMobileOpenChange}
      />,
    );
    await flush();
    act(() => ref.current!.openMobile("trigger"));
    await flush();

    expect(onMobileOpenChange).toHaveBeenCalledTimes(1);
    expect(onMobileOpenChange).toHaveBeenCalledWith({ open: true, reason: "trigger" });
    expect(dialog()).toBeNull();

    rerender(
      <AppSidebar
        ref={ref}
        items={ITEMS}
        currentPath="/home"
        isMobileOpen
        onMobileOpenChange={onMobileOpenChange}
      />,
    );
    await flush();
    expect(dialog()).not.toBeNull();
    expect(onMobileOpenChange).toHaveBeenCalledTimes(1);
  });

  it("I2: toggleMobile while controlled-open requests close, and the drawer stays open", async () => {
    const ref = createRef<AppSidebarHandle>();
    const onMobileOpenChange = vi.fn();
    render(
      <AppSidebar
        ref={ref}
        items={ITEMS}
        currentPath="/home"
        isMobileOpen
        onMobileOpenChange={onMobileOpenChange}
      />,
    );
    await flush();
    act(() => ref.current!.toggleMobile("escape"));
    await flush();
    expect(onMobileOpenChange).toHaveBeenCalledWith({ open: false, reason: "escape" });
    expect(dialog()).not.toBeNull();
  });
});

describe("I2: SSR", () => {
  it("renderToString with isCollapsed true emits data-collapsed=\"true\" (no client-only fix-up needed)", () => {
    const html = renderToString(<AppSidebar items={ITEMS} currentPath="/home" isCollapsed />);
    expect(html).toContain('data-collapsed="true"');
    expect(html).not.toContain('data-collapsed="false"');
  });

  it("I2: renderToString with isCollapsed false emits data-collapsed=\"false\"", () => {
    const html = renderToString(<AppSidebar items={ITEMS} currentPath="/home" isCollapsed={false} />);
    expect(html).toContain('data-collapsed="false"');
  });
});
