/**
 * AS9 - `useAppSidebarState` forwards the filter gates when the state is
 * lifted and passed back through `state={...}`. Before 0.5.0 a lifted state hid
 * every `ownerOnly` item and showed every `minMembers` item regardless of the
 * consumer's `isOwner` / `currentMaxMembers`.
 *
 * Note: with a lifted `state`, the rows rendered come from `state.visibleEntries`
 * (the hook's own filter pass), so the gates must be given to the HOOK.
 */
import { render, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../app-sidebar";
import { useAppSidebarState } from "../hooks/use-sidebar-nav-state";
import type { NavEntry, UseAppSidebarStateOptions } from "../types";

const ITEMS: ReadonlyArray<NavEntry> = [
  { id: "home", label: "Home", href: "/home" },
  { id: "owner", label: "Owner only", href: "/owner", ownerOnly: true },
  { id: "team", label: "Team seats", href: "/team", minMembers: 5 },
  {
    kind: "section",
    id: "empty-sec",
    title: "Admin",
    items: [{ id: "adm", label: "Admin tool", href: "/adm", ownerOnly: true }],
  },
];

beforeEach(() => {
  (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = vi.fn();
});

function Lifted(opts: UseAppSidebarStateOptions) {
  const state = useAppSidebarState({ items: ITEMS, currentPath: "/home", ...opts });
  return <AppSidebar items={ITEMS} currentPath="/home" state={state} />;
}

const has = (c: HTMLElement, label: string) =>
  Array.from(c.querySelectorAll("a")).some((a) => a.textContent === label);

describe("AS9: gates through the lifted-state path (rendered output)", () => {
  it("AS9: isOwner:true renders an ownerOnly item; omitted/false hides it", () => {
    const owner = render(<Lifted isOwner />);
    expect(has(owner.container, "Owner only")).toBe(true);
    owner.unmount();
    const not = render(<Lifted />);
    expect(has(not.container, "Owner only")).toBe(false);
    not.unmount();
    const falsy = render(<Lifted isOwner={false} />);
    expect(has(falsy.container, "Owner only")).toBe(false);
  });

  it("AS9: currentMaxMembers:1 hides a minMembers:5 item; 5 shows it", () => {
    const small = render(<Lifted currentMaxMembers={1} />);
    expect(has(small.container, "Team seats")).toBe(false);
    expect(has(small.container, "Home")).toBe(true);
    small.unmount();
    const big = render(<Lifted currentMaxMembers={5} />);
    expect(has(big.container, "Team seats")).toBe(true);
  });

  it("AS9: bypassFiltering:true renders every gated item", () => {
    const { container } = render(<Lifted bypassFiltering currentMaxMembers={0} />);
    expect(has(container, "Owner only")).toBe(true);
    expect(has(container, "Team seats")).toBe(true);
    expect(has(container, "Admin tool")).toBe(true);
  });

  it("AS9: keepEmptySections keeps a section whose items were all filtered; default drops it", () => {
    const dropped = render(<Lifted />);
    expect(dropped.container.textContent).not.toContain("Admin");
    dropped.unmount();
    const kept = render(<Lifted keepEmptySections />);
    expect(kept.container.textContent).toContain("Admin");
    expect(has(kept.container, "Admin tool")).toBe(false);
  });
});

describe("AS9: the hook's own return value", () => {
  it("AS9: visibleEntries reflects isOwner / currentMaxMembers", () => {
    const ids = (o: UseAppSidebarStateOptions) => {
      const { result } = renderHook(() => useAppSidebarState({ items: ITEMS, currentPath: "/home", ...o }));
      return result.current.visibleEntries.map((e) => (e.kind === "separator" ? "sep" : e.id));
    };
    // currentMaxMembers defaults to Infinity, so minMembers items show unless capped
    expect(ids({})).toEqual(["home", "team"]);
    expect(ids({ currentMaxMembers: 1 })).toEqual(["home"]);
    expect(ids({ isOwner: true })).toEqual(["home", "owner", "team", "empty-sec"]);
    expect(ids({ isOwner: true, currentMaxMembers: 1 })).toEqual(["home", "owner", "empty-sec"]);
    expect(ids({ bypassFiltering: true, currentMaxMembers: 1 })).toEqual(["home", "owner", "team", "empty-sec"]);
    expect(ids({ keepEmptySections: true })).toEqual(["home", "team", "empty-sec"]);
  });

  it("AS9: getItemById does not resolve items the gates hid", () => {
    const { result } = renderHook(() => useAppSidebarState({ items: ITEMS, currentPath: "/home" }));
    expect(result.current.getItemById("owner")).toBeUndefined();
    const owner = renderHook(() => useAppSidebarState({ items: ITEMS, currentPath: "/home", isOwner: true }));
    expect(owner.result.current.getItemById("owner")?.label).toBe("Owner only");
  });
});

describe("I-neg: unchanged paths", () => {
  it("I-neg: the component's own props still gate when no lifted state is used", () => {
    const hidden = render(<AppSidebar items={ITEMS} currentPath="/home" />);
    expect(has(hidden.container, "Owner only")).toBe(false);
    hidden.unmount();
    const shown = render(<AppSidebar items={ITEMS} currentPath="/home" isOwner currentMaxMembers={9} />);
    expect(has(shown.container, "Owner only")).toBe(true);
    expect(has(shown.container, "Team seats")).toBe(true);
  });

  it("I-neg: a lifted state wins over the component's own gate props", () => {
    function Mixed() {
      const state = useAppSidebarState({ items: ITEMS, currentPath: "/home" }); // no owner
      return <AppSidebar items={ITEMS} currentPath="/home" isOwner state={state} />;
    }
    const { container } = render(<Mixed />);
    expect(has(container, "Owner only")).toBe(false);
  });

  it("I-neg: navAccessorySlot={null} removes the collapse toggle", () => {
    const { container } = render(<AppSidebar items={ITEMS} currentPath="/home" navAccessorySlot={null} />);
    expect(container.querySelector('button[aria-label="Collapse sidebar"]')).toBeNull();
  });

  it("I-neg: renderItem / renderBadge slots still run", () => {
    const renderBadge = vi.fn<(args: { position: string }) => React.ReactNode>(() => <i data-testid="custom-badge" />);
    const renderItem = vi.fn(({ defaultRender }) => <div data-testid="wrapped">{defaultRender}</div>);
    const { getAllByTestId } = render(
      <AppSidebar
        items={[{ id: "a", label: "A", href: "/a", badge: 2 }]}
        currentPath="/a"
        renderBadge={renderBadge}
        renderItem={renderItem}
      />,
    );
    expect(getAllByTestId("wrapped").length).toBeGreaterThan(0);
    expect(getAllByTestId("custom-badge").length).toBeGreaterThan(0);
    expect(renderBadge.mock.calls[0][0]).toMatchObject({ position: "inline-end" });
  });
});
