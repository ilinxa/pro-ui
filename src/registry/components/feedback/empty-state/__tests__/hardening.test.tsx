/**
 * empty-state 0.2.0 — request ES1 (`linkComponent`), U0-1 (disabled link) and the owed C11 coverage
 * (docs/procomps/empty-state-procomp/empty-state-loop.md, Run 2).
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "../empty-state";
import type { EmptyStateVariant } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

afterEach(cleanup);

const VARIANTS: EmptyStateVariant[] = ["default", "search", "error", "offline", "permission", "first-use"];

describe("per-variant render", () => {
  it.each(VARIANTS)("%s renders a heading with the title", (variant) => {
    render(<EmptyState variant={variant} title={`T-${variant}`} />);
    expect(screen.getByRole("heading", { level: 3, name: `T-${variant}` })).toBeInTheDocument();
  });

  it("role=status only on search / error / offline", () => {
    for (const variant of VARIANTS) {
      const { container, unmount } = render(<EmptyState variant={variant} title="t" />);
      const root = container.firstElementChild as HTMLElement;
      const transient = ["search", "error", "offline"].includes(variant);
      expect(root.getAttribute("role")).toBe(transient ? "status" : null);
      expect(root.getAttribute("aria-live")).toBe(transient ? "polite" : null);
      unmount();
    }
  });

  it("animated={false} emits no animation classes or delays", () => {
    const { container } = render(
      <EmptyState variant="first-use" animated={false} title="t" description="d" action={{ label: "Go" }} hint="h" />,
    );
    expect(container.innerHTML).not.toMatch(/animate-|animation-delay|animation-fill|animationDelay/i);
    cleanup();
    const animated = render(<EmptyState variant="first-use" title="t" description="d" />);
    expect(animated.container.innerHTML).toMatch(/animate-in/);
    expect(animated.container.innerHTML).toMatch(/animation-delay/);
  });
});

describe("ES1 — linkComponent", () => {
  type LinkProps = { href: string; onClick?: () => void; className?: string; children?: ReactNode };
  const makeLink = () =>
    vi.fn(({ href, onClick, className, children }: LinkProps) => (
      <a href={href} onClick={onClick} className={className} data-router="">
        {children}
      </a>
    ));

  it("I2: receives href, onClick, button className and the label as children", () => {
    const Link = makeLink();
    const onClick = vi.fn();
    render(<EmptyState title="t" linkComponent={Link} action={{ label: "Write", href: "/compose", onClick }} />);
    const link = screen.getByRole("link", { name: "Write" });
    expect(link).toHaveAttribute("data-router");
    expect(link).toHaveAttribute("href", "/compose");
    expect(link.className).toBe(cn(buttonVariants({ variant: "default" })));
    const props = Link.mock.calls[0][0] as LinkProps;
    expect(props.href).toBe("/compose");
    expect(props.children).toBe("Write");
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("secondary action gets outline styling through the same linkComponent", () => {
    const Link = makeLink();
    render(
      <EmptyState
        title="t"
        linkComponent={Link}
        action={{ label: "A", href: "/a" }}
        secondaryAction={{ label: "B", href: "/b" }}
      />,
    );
    expect(screen.getByRole("link", { name: "B" }).className).toBe(cn(buttonVariants({ variant: "outline" })));
    expect(Link).toHaveBeenCalledTimes(2);
  });

  it("I3 / U0-1: a disabled href action is a disabled Button and linkComponent is not called", () => {
    const Link = makeLink();
    const onClick = vi.fn();
    render(
      <EmptyState title="t" linkComponent={Link} action={{ label: "Soon", href: "/x", disabled: true, onClick }} />,
    );
    const btn = screen.getByRole("button", { name: "Soon" });
    expect(btn).toBeDisabled();
    expect(screen.queryByRole("link")).toBeNull();
    expect(Link).not.toHaveBeenCalled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("U0-1 without linkComponent: a disabled href action is a disabled Button, not an href-less anchor", () => {
    const { container } = render(<EmptyState title="t" action={{ label: "Soon", href: "/x", disabled: true }} />);
    expect(screen.getByRole("button", { name: "Soon" })).toBeDisabled();
    expect(container.querySelector("a")).toBeNull();
  });

  it("I-neg: non-href object actions and ReactNode actions never use linkComponent", () => {
    const Link = makeLink();
    render(
      <EmptyState
        title="t"
        linkComponent={Link}
        action={{ label: "Plain", onClick: () => {} }}
        secondaryAction={<a href="/own">Own link</a>}
      />,
    );
    expect(screen.getByRole("button", { name: "Plain" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Own link" })).toBeInTheDocument();
    expect(Link).not.toHaveBeenCalled();
  });

  it("keyboard: Tab reaches a link action and Enter activates it", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EmptyState animated={false} title="t" action={{ label: "Go", href: "#go", onClick }} />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Go" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("I1: without linkComponent an enabled href action is the 0.1.0 anchor markup", () => {
    const { container } = render(<EmptyState animated={false} title="t" action={{ label: "Go", href: "/go" }} />);
    const a = container.querySelector("a")!;
    expect(a.getAttributeNames().sort()).toEqual(["class", "href"]);
    expect(a.getAttribute("href")).toBe("/go");
    expect(a.getAttribute("class")).toBe(cn(buttonVariants({ variant: "default" })));
    expect(a.textContent).toBe("Go");
    // linkComponent="a" is the same markup as omitting it.
    const explicit = render(
      <EmptyState animated={false} title="t" action={{ label: "Go", href: "/go" }} linkComponent="a" />,
    );
    expect(explicit.container.innerHTML).toBe(container.innerHTML);
  });

  it("axe: router link, disabled link and RTL stay clean", async () => {
    const Link = makeLink();
    const { container } = render(
      <div dir="rtl" lang="ar">
        <EmptyState
          title="لا شيء"
          linkComponent={Link}
          action={{ label: "فتح", href: "/x" }}
          secondaryAction={{ label: "قريباً", href: "/y", disabled: true }}
        />
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});

describe("server render", () => {
  it("renders on the server with linkComponent and hydrates without warnings", async () => {
    const Link = ({ href, className, children }: { href: string; className?: string; children?: ReactNode }) => (
      <a href={href} className={className}>
        {children}
      </a>
    );
    const el = (
      <EmptyState
        variant="search"
        title="No results"
        linkComponent={Link}
        action={{ label: "Open", href: "/o" }}
        secondaryAction={{ label: "Later", href: "/l", disabled: true }}
      />
    );
    const html = renderToString(el);
    expect(html).toContain('href="/o"');
    expect(html).toContain("<button");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(host, el, { onRecoverableError: recoverable });
    });
    expect(errors).not.toHaveBeenCalled();
    expect(recoverable).not.toHaveBeenCalled();
    errors.mockRestore();
    host.remove();
  });
});
