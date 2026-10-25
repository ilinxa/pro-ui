/**
 * category-cloud 0.3.0 — CCL1 (link mode), CCL2 (labels + locale), F-03 + duplicate-value dev-warns.
 * See docs/procomps/category-cloud-procomp/category-cloud-loop.md (U1).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef, type AnchorHTMLAttributes } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CategoryCloud } from "../category-cloud";
import { defaultCategoryCloudLabels } from "../types";

const ITEMS = [
  { value: "tech", label: "Technology", count: 12 },
  { value: "events", label: "Events", count: 3 },
  { value: "plain", label: "Plain" },
];
const href = (i: { value: string }) => `/c/${i.value}`;

afterEach(() => vi.unstubAllEnvs());

describe("I1 — no new props", () => {
  it("renders today's markup and English text", () => {
    render(<CategoryCloud items={ITEMS} />);
    expect(screen.getByRole("group", { name: "Categories" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Technology (12)" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Plain" })).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});

describe("I-neg — selection", () => {
  it("uncontrolled single-select toggles on re-click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CategoryCloud items={ITEMS} onChange={onChange} />);
    const tech = () => screen.getByRole("button", { name: /Technology/ });
    await user.click(tech());
    expect(tech()).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Events/ }));
    expect(tech()).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: /Events/ }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
  it("toggleable={false} keeps the selection", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CategoryCloud items={ITEMS} toggleable={false} defaultValue="tech" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Technology/ }));
    expect(onChange).toHaveBeenLastCalledWith("tech");
    expect(screen.getByRole("button", { name: /Technology/ })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("CCL1 — link mode", () => {
  it("I2: links with href, aria-current on the active one, no aria-pressed", () => {
    render(<CategoryCloud items={ITEMS} getHref={href} value="events" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByRole("link", { name: /Technology/ })).toHaveAttribute("href", "/c/tech");
    expect(screen.getByRole("link", { name: /Events/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Technology/ })).not.toHaveAttribute("aria-current");
    links.forEach((l) => expect(l).not.toHaveAttribute("aria-pressed"));
  });

  it("onChange fires on click without preventing default; clicking the active link does not clear", () => {
    const onChange = vi.fn();
    render(<CategoryCloud items={ITEMS} getHref={href} value="events" onChange={onChange} />);
    const link = screen.getByRole("link", { name: /Technology/ });
    const notPrevented = fireEvent.click(link);
    expect(notPrevented).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith("tech");
    fireEvent.click(screen.getByRole("link", { name: /Events/ }));
    expect(onChange).toHaveBeenLastCalledWith("events");
  });

  it("a modified click (new tab / window) neither calls onChange nor moves the active chip", () => {
    const onChange = vi.fn();
    render(<CategoryCloud items={ITEMS} getHref={href} onChange={onChange} />);
    const link = screen.getByRole("link", { name: /Technology/ });
    link.addEventListener("click", (e) => e.preventDefault());
    for (const mod of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }]) {
      fireEvent.click(link, mod);
    }
    expect(onChange).not.toHaveBeenCalled();
    expect(link).not.toHaveAttribute("aria-current");
    fireEvent.click(link);
    expect(onChange).toHaveBeenCalledWith("tech");
  });

  it("Enter on a focused link chip activates it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryCloud items={ITEMS} getHref={href} onChange={onChange} />);
    screen.getAllByRole("link").forEach((l) => l.addEventListener("click", (e) => e.preventDefault()));
    await user.tab();
    expect(screen.getByRole("link", { name: /Technology/ })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("tech");
  });

  it("a getHref that returns null (untyped caller) leaves the chip a button", () => {
    render(
      <CategoryCloud
        items={ITEMS}
        getHref={(i) => (i.value === "plain" ? (null as unknown as undefined) : href(i))}
      />,
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Plain" })).toBeInTheDocument();
  });

  it("uncontrolled link mode tracks the clicked chip in aria-current", () => {
    render(<CategoryCloud items={ITEMS} getHref={href} />);
    const link = screen.getByRole("link", { name: /Technology/ });
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("an item whose getHref returns undefined stays a button", () => {
    render(<CategoryCloud items={ITEMS} getHref={(i) => (i.value === "plain" ? undefined : href(i))} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Plain" })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders through linkComponent as an element type", () => {
    const Link = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>((props, ref) => (
      <a ref={ref} data-router="1" {...props} />
    ));
    Link.displayName = "TestLink";
    render(<CategoryCloud items={ITEMS} getHref={href} linkComponent={Link} />);
    expect(screen.getByRole("link", { name: /Technology/ })).toHaveAttribute("data-router", "1");
  });
});

describe("CCL2 — locale and labels", () => {
  it('locale="tr" formats the count with the Turkish separator', () => {
    render(<CategoryCloud items={[{ value: "a", label: "Haber", count: 12345 }]} locale="tr" />);
    expect(screen.getByRole("button", { name: "Haber (12.345)" })).toBeInTheDocument();
  });

  it("the default English count groups thousands (0.3.0 change) and prints -0 as 0", () => {
    render(
      <CategoryCloud
        items={[
          { value: "big", label: "Big", count: 12345 },
          { value: "zero", label: "Zero", count: -0 },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Big (12,345)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zero (0)" })).toBeInTheDocument();
  });

  it("an invalid locale falls back to en", () => {
    render(<CategoryCloud items={[{ value: "a", label: "A", count: 12345 }]} locale="en_US" />);
    expect(screen.getByRole("button", { name: "A (12,345)" })).toBeInTheDocument();
  });

  it("labels overridden: no English remains", () => {
    render(
      <CategoryCloud
        items={[{ value: "a", label: "Haber", count: 1234 }]}
        locale="tr"
        labels={{ group: "Kategoriler", count: (_n, f) => ` — ${f} yazı` }}
      />,
    );
    expect(screen.getByRole("group", { name: "Kategoriler" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Haber — 1.234 yazı" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Categories/);
  });

  it("labels with an undefined key keep the default; group precedence ariaLabel > title > labels.group", () => {
    const { rerender } = render(<CategoryCloud items={ITEMS} labels={{ group: undefined, count: undefined }} />);
    expect(screen.getByRole("group", { name: "Categories" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Technology (12)" })).toBeInTheDocument();
    rerender(<CategoryCloud items={ITEMS} labels={{ group: "G" }} title="T" />);
    expect(screen.getByRole("group", { name: "T" })).toBeInTheDocument();
    rerender(<CategoryCloud items={ITEMS} labels={{ group: "G" }} title="T" ariaLabel="A" />);
    expect(screen.getByRole("group", { name: "A" })).toBeInTheDocument();
    rerender(<CategoryCloud items={ITEMS} labels={{ group: "G" }} />);
    expect(screen.getByRole("group", { name: "G" })).toBeInTheDocument();
  });

  it("I3: formatCount still overrides everything about the count", () => {
    render(
      <CategoryCloud items={ITEMS} locale="tr" labels={{ count: () => "LABEL" }} formatCount={(c) => ` [${c}]`} />,
    );
    expect(screen.getByRole("button", { name: "Technology [12]" })).toBeInTheDocument();
    expect(defaultCategoryCloudLabels.count(1, "1")).toBe(" (1)");
  });
});

describe("dev-warns (once per change)", () => {
  it("a controlled value matching no item warns once; a stable rerender does not repeat", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<CategoryCloud items={ITEMS} value="nope" />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"nope" matches no item'));
    rerender(<CategoryCloud items={ITEMS} value="nope" className="x" />);
    expect(warn).toHaveBeenCalledTimes(1);
    rerender(<CategoryCloud items={ITEMS} value="tech" />);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("an inline items array (new identity, same content) does not re-warn; a new problem does", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<CategoryCloud items={[...ITEMS]} value="nope" />);
    rerender(<CategoryCloud items={[...ITEMS]} value="nope" />);
    rerender(<CategoryCloud items={[...ITEMS]} value="nope" />);
    expect(warn).toHaveBeenCalledTimes(1);
    rerender(<CategoryCloud items={[...ITEMS]} value="other" />);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("a repeated value's key cannot collide with another real value", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<CategoryCloud items={["a", "a", "a#1", "a|1"]} />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(error).not.toHaveBeenCalled();
    warn.mockRestore();
    error.mockRestore();
  });

  it("duplicate item values warn and still render every chip", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<CategoryCloud items={["a", "b", "a"]} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Duplicate item values: a"));
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(error).not.toHaveBeenCalled(); // no duplicate-key error from React
    warn.mockRestore();
    error.mockRestore();
  });

  it("is silent in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<CategoryCloud items={["a", "a"]} value="zzz" />);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("server render", () => {
  it("hydrates with locale and link mode without warnings", async () => {
    const el = (
      <CategoryCloud items={[{ value: "a", label: "Haber", count: 12345 }]} locale="tr" getHref={href} value="a" />
    );
    const html = renderToString(el);
    expect(html).toContain("12.345");
    expect(html).toContain('aria-current="page"');
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
