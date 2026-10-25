/**
 * info-list 0.3.0 — request IL1 (compact long values: `wrap` / `title`) and the U0 findings
 * U0-1..U0-6 (docs/procomps/info-list-procomp/info-list-loop.md).
 */
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Building, Mail } from "lucide-react";
import { InfoList } from "../info-list";
import { DEFAULT_INFO_LIST_LABELS, defaultInfoListLabels } from "../types";
import type { InfoListItem } from "../types";
import {
  dummyBusinessAbout,
  dummyBusinessAboutAr,
  dummyEventDetails,
} from "../dummy-data";

const LONG = "A very long organisation name that certainly does not fit on a single compact line";

const rowOf = (text: string) => screen.getByText(text).closest("li") as HTMLElement;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("IL1 — compact long values", () => {
  const items: InfoListItem[] = [{ id: "a", icon: Building, primary: LONG }];

  it("I1: default compact truncates and carries the full value as title", () => {
    render(<InfoList variant="compact" items={items} />);
    const el = screen.getByText(LONG);
    expect(el).toHaveClass("truncate");
    expect(el).toHaveAttribute("title", LONG);
    expect(rowOf(LONG)).toHaveClass("items-center");
  });

  it("title: item.title wins; a node primary without item.title gets none", () => {
    render(
      <InfoList
        variant="compact"
        items={[
          { id: "a", icon: Building, primary: <b>node</b>, title: "Full text" },
          { id: "b", icon: Mail, primary: <i>other</i> },
        ]}
      />,
    );
    expect(screen.getByText("node").parentElement).toHaveAttribute("title", "Full text");
    expect(screen.getByText("other").parentElement).not.toHaveAttribute("title");
  });

  it("a numeric primary gets a title too", () => {
    render(<InfoList variant="compact" items={[{ id: "n", icon: Mail, primary: 1234567890 }]} />);
    expect(screen.getByText("1234567890")).toHaveAttribute("title", "1234567890");
  });

  it("title also lands on a linked row", () => {
    render(<InfoList variant="compact" items={[{ id: "a", icon: Mail, primary: LONG, href: "mailto:a@b.c" }]} />);
    expect(screen.getByRole("link")).toHaveAttribute("title", LONG);
    expect(screen.getByRole("link")).toHaveClass("truncate");
  });

  it("I2: wrap removes truncation and the title, and wraps", () => {
    render(<InfoList variant="compact" wrap items={items} />);
    const el = screen.getByText(LONG);
    expect(el).not.toHaveClass("truncate");
    expect(el).toHaveClass("wrap-break-word");
    expect(el).not.toHaveAttribute("title");
  });

  it("I-neg: comfortable is unchanged by wrap", () => {
    const { container } = render(<InfoList variant="comfortable" wrap items={items} />);
    const { container: base } = render(<InfoList variant="comfortable" items={items} />);
    expect(container.innerHTML).toBe(base.innerHTML);
  });

  it("platform About fixture: the long mission wraps with `wrap`", () => {
    render(<InfoList variant="compact" wrap items={dummyBusinessAbout} />);
    expect(screen.getByText(dummyBusinessAbout[0].primary as string)).toHaveClass("wrap-break-word");
    expect(screen.getByRole("link", { name: "+90 (212) 555 0123" })).toHaveAttribute("href", "tel:+902125550123");
  });
});

describe("linkComponent", () => {
  it("renders linked rows through a custom link component in both variants", () => {
    const Link = ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
      <a data-custom="1" href={href} className={className}>
        {children}
      </a>
    );
    const items: InfoListItem[] = [{ id: "a", icon: Mail, primary: "Mail us", href: "/contact" }];
    for (const variant of ["compact", "comfortable"] as const) {
      const { unmount } = render(<InfoList variant={variant} linkComponent={Link} items={items} />);
      expect(screen.getByRole("link", { name: "Mail us" })).toHaveAttribute("data-custom", "1");
      unmount();
    }
  });

  it("U0-6: href links with the default <a> — no linkComponent needed", () => {
    render(<InfoList items={[{ id: "a", icon: Mail, primary: "Mail us", href: "mailto:a@b.c" }]} />);
    expect(screen.getByRole("link", { name: "Mail us" }).tagName).toBe("A");
  });
});

describe("empty state + labels (U0-1/U0-2)", () => {
  it("shows the default text, and emptyState wins over it", () => {
    const { unmount } = render(<InfoList items={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No information.");
    unmount();
    render(<InfoList items={[]} emptyState={<p>Custom empty</p>} />);
    expect(screen.getByText("Custom empty")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("I-neg: labels={{ emptyText: undefined }} shows the default", () => {
    render(<InfoList items={[]} labels={{ emptyText: undefined }} />);
    expect(screen.getByRole("status")).toHaveTextContent("No information.");
  });

  it("a given emptyText is used; the old constant name is the same object", () => {
    render(<InfoList items={[]} labels={{ emptyText: "Nada" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Nada");
    expect(DEFAULT_INFO_LIST_LABELS).toBe(defaultInfoListLabels);
    expect(defaultInfoListLabels.emptyText).toBe("No information.");
  });
});

describe("U0-3 — renderItem rows", () => {
  const items = dummyEventDetails;
  const renderItem = (item: InfoListItem) => <span>{item.id}</span>;

  it("I3: unchanged unless separated is passed (no class attribute at all)", () => {
    const { container } = render(<InfoList items={items} renderItem={renderItem} />);
    for (const li of container.querySelectorAll("li")) expect(li.hasAttribute("class")).toBe(false);
  });

  it("itemClassName is applied to renderItem rows", () => {
    const { container } = render(<InfoList items={items} renderItem={renderItem} itemClassName="row-x" />);
    const lis = container.querySelectorAll("li");
    expect(lis).toHaveLength(items.length);
    lis.forEach((li) => expect(li).toHaveClass("row-x"));
  });

  it("separated={true} adds separators to every row but the first", () => {
    const { container } = render(<InfoList items={items} renderItem={renderItem} separated />);
    const lis = container.querySelectorAll("li");
    expect(lis[0]).not.toHaveClass("border-t");
    expect(lis[1]).toHaveClass("border-t");
    expect(lis[2]).toHaveClass("border-t");
  });

  it("compact renderItem rows use the compact separator", () => {
    const { container } = render(<InfoList variant="compact" items={items} renderItem={renderItem} separated />);
    const lis = container.querySelectorAll("li");
    expect(lis[0].hasAttribute("class")).toBe(false);
    expect(lis[1]).toHaveClass("pt-3", "border-t");
    expect(lis[1]).not.toHaveClass("pt-4");
  });

  it("separated={false} adds none", () => {
    const { container } = render(<InfoList items={items} renderItem={renderItem} separated={false} />);
    container.querySelectorAll("li").forEach((li) => expect(li).not.toHaveClass("border-t"));
  });
});

describe("U0-4 — compact secondary / action dev warning", () => {
  const rich: InfoListItem[] = [{ id: "a", icon: Mail, primary: "x", secondary: "sub" }];

  it("warns once per mount (not per render) in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<InfoList variant="compact" items={rich} />);
    rerender(<InfoList variant="compact" items={[...rich]} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("[info-list]");
    expect(screen.queryByText("sub")).toBeNull();
  });

  it("warns once per mount even when the items turn rich, plain, then rich again", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const plain: InfoListItem[] = [{ id: "p", icon: Mail, primary: "x" }];
    const { rerender } = render(<InfoList variant="compact" items={rich} />);
    rerender(<InfoList variant="compact" items={plain} />);
    rerender(<InfoList variant="compact" items={rich} />);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("does not warn for falsy conditional values (cond && <X />)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<InfoList variant="compact" items={[{ id: "f", icon: Mail, primary: "x", secondary: false, action: "" }]} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns for action too", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<InfoList variant="compact" items={[{ id: "a", icon: Mail, primary: "x", action: <i>go</i> }]} />);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("stays silent in production, for comfortable, for renderItem, and without those fields", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    render(<InfoList variant="compact" items={rich} />).unmount();
    vi.stubEnv("NODE_ENV", "development");
    render(<InfoList variant="comfortable" items={rich} />).unmount();
    render(<InfoList variant="compact" items={rich} renderItem={(i) => <span>{i.id}</span>} />).unmount();
    render(<InfoList variant="compact" items={[{ id: "a", icon: Mail, primary: "x" }]} />).unmount();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("U0-5 — fixtures", () => {
  it("the map action is a real <button type=button>", () => {
    render(<InfoList items={dummyEventDetails} />);
    const btn = screen.getByRole("button", { name: /view on map/i });
    expect(btn).toHaveAttribute("type", "button");
  });
});

describe("RTL fixtures", () => {
  it("Arabic rows render in compact + wrap with logical utilities only", () => {
    const { container } = render(
      <div dir="rtl" lang="ar">
        <InfoList variant="compact" wrap items={dummyBusinessAboutAr} />
      </div>,
    );
    expect(screen.getByText(dummyBusinessAboutAr[0].primary as string)).toHaveClass("wrap-break-word");
    expect(
      container.querySelector(
        "[class~='pl-4'],[class*=' pl-'],[class*=' pr-'],[class*=' ml-'],[class*=' mr-'],[class~='text-left'],[class~='text-right']",
      ),
    ).toBeNull();
  });
});

describe("server render + hydration", () => {
  it("renders on the server and hydrates without errors or recoverable errors", async () => {
    const tree = <InfoList heading="About" variant="compact" wrap items={dummyBusinessAbout} />;
    const html = renderToString(tree);
    expect(html).toContain("wrap-break-word");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(host, tree, { onRecoverableError: recoverable });
    });
    expect(errors).not.toHaveBeenCalled();
    expect(recoverable).not.toHaveBeenCalled();
    host.remove();
  });
});
