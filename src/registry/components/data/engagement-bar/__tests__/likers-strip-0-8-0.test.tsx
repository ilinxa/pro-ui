import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LikersStrip } from "../parts/likers-strip";
import type { EngagementLikerProfile } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

const u = (id: string, name: string, username?: string): EngagementLikerProfile => ({
  id,
  name,
  username,
});

beforeAll(() => {
  Object.assign(HTMLElement.prototype, {
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  });
});

const href = (p: EngagementLikerProfile) => `/u/${p.id}`;

describe("LikersStrip 0.8.0", () => {
  it("first name: trims, skips empty words, full name stays in the accessible text", () => {
    const { container } = render(<LikersStrip totalCount={1} likers={[u("1", "  Ali   Veli ")]} />);
    const visible = container.querySelector("bdi[aria-hidden='true']");
    expect(visible).toHaveTextContent("Ali");
    expect(visible?.textContent).toBe("Ali");
    expect(screen.getByText("  Ali   Veli ".trim().replace(/\s+/g, " "), { exact: false })).toBeInTheDocument();
  });

  it("nameDisplay full shows the whole name, not aria-hidden", () => {
    const { container } = render(
      <LikersStrip totalCount={1} likers={[u("1", "Ali Veli")]} nameDisplay="full" />,
    );
    expect(container.querySelector("bdi[aria-hidden='true']")).toBeNull();
    expect(screen.getByText("Ali Veli")).toBeInTheDocument();
  });

  it("username is dir=ltr", () => {
    render(<LikersStrip totalCount={1} likers={[u("1", "Ali", "ali")]} />);
    expect(screen.getByText("@ali")).toHaveAttribute("dir", "ltr");
  });

  it("getProfileHref renders a link named by the full name via linkComponent", () => {
    const Custom = ({ href: h, children, ...rest }: React.ComponentProps<"a">) => (
      <a data-custom="1" href={h} {...rest}>
        {children}
      </a>
    );
    render(
      <LikersStrip
        totalCount={2}
        likers={[u("1", "Ali Veli"), u("2", "Zed Q")]}
        getProfileHref={(p) => (p.id === "1" ? "/u/1" : undefined)}
        linkComponent={Custom}
      />,
    );
    const link = screen.getByRole("link", { name: "Ali Veli" });
    expect(link).toHaveAttribute("href", "/u/1");
    expect(link).toHaveAttribute("data-custom", "1");
    expect(link).toHaveAttribute("draggable", "false");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renderBadge is aria-hidden", () => {
    render(
      <LikersStrip
        totalCount={1}
        likers={[u("1", "Ali")]}
        renderBadge={() => <i data-testid="b" />}
      />,
    );
    expect(screen.getByTestId("b").closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("a plain click on a link is not suppressed", () => {
    render(<LikersStrip totalCount={1} likers={[u("1", "Ali")]} getProfileHref={href} />);
    const link = screen.getByRole("link");
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  it("a real drag suppresses the release click on a link, once", () => {
    render(<LikersStrip totalCount={1} likers={[u("1", "Ali")]} getProfileHref={href} />);
    const link = screen.getByRole("link");
    const strip = screen.getByRole("list");
    const p = { pointerId: 1, pointerType: "mouse", buttons: 1 };
    fireEvent.pointerDown(strip, { ...p, clientX: 100 });
    fireEvent.pointerMove(strip, { ...p, clientX: 80 });
    fireEvent.pointerUp(strip, { ...p, clientX: 80 });
    const first = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    const second = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
  });

  it("a sub-threshold press does not suppress the click", () => {
    render(<LikersStrip totalCount={1} likers={[u("1", "Ali")]} getProfileHref={href} />);
    const link = screen.getByRole("link");
    const strip = screen.getByRole("list");
    const p = { pointerId: 1, pointerType: "mouse", buttons: 1 };
    fireEvent.pointerDown(strip, { ...p, clientX: 100 });
    fireEvent.pointerMove(strip, { ...p, clientX: 101 });
    fireEvent.pointerUp(strip, { ...p, clientX: 101 });
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  it("FU-7: no focusable content -> scroller is a named tab stop; with links or pill it is not", () => {
    const { rerender } = render(<LikersStrip totalCount={1} likers={[u("1", "Ali")]} />);
    const list = screen.getByRole("list", { name: "Likes" });
    expect(list).toHaveAttribute("tabindex", "0");
    rerender(<LikersStrip totalCount={1} likers={[u("1", "Ali")]} getProfileHref={href} />);
    expect(screen.getByRole("list")).not.toHaveAttribute("tabindex");
    rerender(<LikersStrip totalCount={5} likers={[u("1", "Ali")]} onLoadMore={async () => []} />);
    expect(screen.getByRole("list")).not.toHaveAttribute("tabindex");
  });

  it("axe: both variants are clean", async () => {
    const a = render(<LikersStrip totalCount={1} likers={[u("1", "Ali Veli", "ali")]} />);
    await expectNoAxeViolations(a.container);
    a.unmount();
    const b = render(
      <LikersStrip totalCount={1} likers={[u("1", "Ali Veli", "ali")]} getProfileHref={href} />,
    );
    await expectNoAxeViolations(b.container);
  });

  it("size touch gives the Hide button, pill and links 44px floors", () => {
    render(
      <LikersStrip
        totalCount={5}
        likers={[u("1", "Ali")]}
        getProfileHref={href}
        onLoadMore={async () => []}
        onClose={vi.fn()}
        size="touch"
      />,
    );
    expect(screen.getByRole("button", { name: "Hide" }).className).toContain("min-h-11");
    expect(screen.getByRole("button", { name: /more/ }).className).toContain("min-h-11");
    expect(screen.getByRole("link").className).toContain("min-h-11");
  });
});
