/**
 * people-grid 0.3.0 — platform request PG1-PG4, the two default changes, and the U0 findings
 * (docs/procomps/people-grid-procomp/people-grid-loop.md).
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { PeopleGrid } from "../people-grid";
import { getInitials } from "../lib/get-initials";
import { DEFAULT_PEOPLE_GRID_LABELS, defaultPeopleGridLabels, type PeopleGridItem } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

const items: PeopleGridItem[] = [
  { id: "1", name: "Ayşe Demir", title: "Editör" },
  { id: "2", name: "Mehmet Kaya", title: "Yazar", image: "/m.jpg" },
];

describe("PG1 — getInitials", () => {
  it("Turkish casing via the string shorthand and via options", () => {
    expect(getInitials("ilker yılmaz", "tr")).toBe("İY");
    expect(getInitials("şule çelik", { locale: "tr" })).toBe("ŞÇ");
    expect(getInitials("ilker yılmaz")).toBe("IY");
  });

  it("I1: one-argument results match 0.2.0 for ASCII names", () => {
    expect(getInitials("Dr. Ahmet Yılmaz")).toBe("AY");
    expect(getInitials("Prof. Dr. Elif Kaya")).toBe("EK");
    expect(getInitials("Madonna")).toBe("M");
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
    expect(getInitials("Dr.")).toBe("D");
    expect(getInitials("ada king lovelace")).toBe("AL");
  });

  it("honours a custom honorific list and RegExp", () => {
    expect(getInitials("Sayın Ali Veli", { honorifics: ["sayın"] })).toBe("AV");
    expect(getInitials("Dr. Ali Veli", { honorifics: ["sayın"] })).toBe("DV"); // default list replaced
    expect(getInitials("Sn. Ali Veli", { honorifics: /^Sn\.?$/ })).toBe("AV");
  });

  it("fallback option for an empty name", () => {
    expect(getInitials("", { fallback: "·" })).toBe("·");
  });

  it("U0-3: takes the first grapheme, not the first UTF-16 unit", () => {
    expect(getInitials("𠮷野 家")).toBe("𠮷家");
    expect(getInitials("👩‍💻 Dev Kaya")).toBe("👩‍💻K");
  });

  it("each initial stays one grapheme when upper-casing expands it (ß -> S)", () => {
    expect(getInitials("ßenta Ada")).toBe("SA");
  });

  it("an invalid locale tag does not throw", () => {
    expect(getInitials("ada lovelace", "not a locale!!")).toBe("AL");
  });
});

describe("PG2 — card heading level (default change 1)", () => {
  it("I2: h2 section -> h3 cards", () => {
    render(<PeopleGrid heading="Ekip" items={items} />);
    expect(screen.getByRole("heading", { level: 2, name: "Ekip" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  });

  it("h3 -> h4, h4 -> h5", () => {
    const { rerender } = render(<PeopleGrid heading="Ekip" headingAs="h3" items={items} />);
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(2);
    rerender(<PeopleGrid heading="Ekip" headingAs="h4" items={items} />);
    expect(screen.getAllByRole("heading", { level: 5 })).toHaveLength(2);
  });

  it("cardHeadingAs overrides; h4 reproduces 0.2.0", () => {
    render(<PeopleGrid heading="Ekip" items={items} cardHeadingAs="h4" />);
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(2);
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  });

  it("without a heading, cards still follow the headingAs default", () => {
    render(<PeopleGrid items={items} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
  });
});

describe("PG3 — renderActions / renderBadge", () => {
  const linked = items.map((i) => ({ ...i, href: `/u/${i.id}` }));

  it("renders the badge beside the name and actions below, both raised above the card link", () => {
    render(
      <PeopleGrid
        items={linked}
        renderBadge={(i) => <span data-testid={`b-${i.id}`}>verified</span>}
        renderActions={(i) => <button type="button">{`Bağlan ${i.id}`}</button>}
      />,
    );
    const badge = screen.getByTestId("b-1");
    expect(badge.parentElement!.className).toContain("z-10");
    expect(badge.parentElement!.className).toContain("relative");
    const btn = screen.getByRole("button", { name: "Bağlan 1" });
    expect(btn.parentElement!.className).toContain("z-10");
    expect(btn.parentElement!.className).toContain("relative");
    const li = btn.closest("li")!;
    expect(within(li).getByRole("heading", { name: "Ayşe Demir" }).parentElement).toContainElement(badge);
  });

  it("I3: clicking a slot never activates the card link; the link is a sibling, not an ancestor", () => {
    const onAction = vi.fn();
    const onLink = vi.fn((e: Event) => e.preventDefault());
    render(
      <PeopleGrid
        items={linked}
        renderActions={() => (
          <button type="button" onClick={onAction}>
            Takip
          </button>
        )}
      />,
    );
    const link = screen.getAllByRole("link")[0]!;
    link.addEventListener("click", onLink);
    const btn = screen.getAllByRole("button", { name: "Takip" })[0]!;
    expect(btn.closest("a")).toBeNull();
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onLink).not.toHaveBeenCalled();
  });

  it("tab order: slot controls come before the card link in DOM order", () => {
    render(
      <PeopleGrid
        items={linked.slice(0, 1)}
        renderBadge={() => <button type="button">rozet</button>}
        renderActions={() => <button type="button">eylem</button>}
      />,
    );
    const order = [
      screen.getByRole("button", { name: "rozet" }),
      screen.getByRole("button", { name: "eylem" }),
      screen.getByRole("link"),
    ];
    for (let i = 0; i < order.length - 1; i++) {
      expect(order[i]!.compareDocumentPosition(order[i + 1]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("slots returning null / false render no wrapper", () => {
    const { container } = render(<PeopleGrid items={items} renderBadge={() => null} renderActions={() => false} />);
    expect(container.querySelector(".z-10")).toBeNull();
  });

  it("I-neg: the renderItem path bypasses the default card and the slots", () => {
    render(
      <PeopleGrid
        items={items}
        renderItem={(i) => <p>{`custom ${i.name}`}</p>}
        renderActions={() => <button type="button">no</button>}
      />,
    );
    expect(screen.getByText("custom Ayşe Demir")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  });
});

describe("PG4 — image attributes + alt (default change 2)", () => {
  it("passes width, height, srcset, sizes; decoding async", () => {
    const { container } = render(
      <PeopleGrid
        items={[
          {
            id: "i",
            name: "Ada",
            image: "/a.jpg",
            imageWidth: 200,
            imageHeight: 220,
            imageSrcSet: "/a.jpg 1x, /a@2x.jpg 2x",
            imageSizes: "96px",
          },
        ]}
      />,
    );
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("width", "200");
    expect(img).toHaveAttribute("height", "220");
    expect(img).toHaveAttribute("srcset", "/a.jpg 1x, /a@2x.jpg 2x");
    expect(img).toHaveAttribute("sizes", "96px");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("alt defaults to empty (decorative); imageAlt wins", () => {
    const { container, rerender } = render(<PeopleGrid items={[{ id: "i", name: "Ada", image: "/a.jpg" }]} />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.queryByRole("img")).toBeNull(); // presentational
    rerender(<PeopleGrid items={[{ id: "i", name: "Ada", image: "/a.jpg", imageAlt: "Ada at the podium" }]} />);
    expect(screen.getByRole("img", { name: "Ada at the podium" })).toBeInTheDocument();
  });
});

describe("labels (U0-1 / U0-2)", () => {
  it("U0-1: an undefined emptyText keeps the default", () => {
    render(<PeopleGrid items={[]} labels={{ emptyText: undefined }} />);
    expect(screen.getByRole("status")).toHaveTextContent("No people to display.");
  });

  it("defaultPeopleGridLabels is exported; DEFAULT_PEOPLE_GRID_LABELS is the same deprecated alias", () => {
    expect(defaultPeopleGridLabels.emptyText).toBe("No people to display.");
    expect(DEFAULT_PEOPLE_GRID_LABELS).toBe(defaultPeopleGridLabels);
  });

  it("emptyState wins over labels", () => {
    render(<PeopleGrid items={[]} emptyState={<p>özel</p>} labels={{ emptyText: "x" }} />);
    expect(screen.getByText("özel")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("locale", () => {
  it('locale="tr" drives the default card initials', () => {
    render(
      <PeopleGrid
        locale="tr"
        items={[
          { id: "a", name: "ilker yılmaz" },
          { id: "b", name: "şule çelik" },
        ]}
      />,
    );
    expect(screen.getByText("İY")).toBeInTheDocument();
    expect(screen.getByText("ŞÇ")).toBeInTheDocument();
  });

  it("without locale, the unlocalised mapping is used", () => {
    render(<PeopleGrid items={[{ id: "a", name: "ilker yılmaz" }]} />);
    expect(screen.getByText("IY")).toBeInTheDocument();
  });
});

describe("U0-4 — memoised card", () => {
  it("re-rendering the grid with the same props does not re-run renderBadge", () => {
    const renderBadge = vi.fn(() => null);
    const stable = items.slice(0, 1);
    const { rerender } = render(<PeopleGrid items={stable} renderBadge={renderBadge} />);
    const calls = renderBadge.mock.calls.length;
    rerender(<PeopleGrid items={stable} renderBadge={renderBadge} headingAs="h2" />);
    expect(renderBadge.mock.calls.length).toBe(calls);
  });
});

describe("memo does not go stale", () => {
  it("a locale change re-renders the cards", () => {
    const one = [{ id: "i", name: "ilker yılmaz" }];
    const { rerender } = render(<PeopleGrid items={one} />);
    expect(screen.getByText("IY")).toBeInTheDocument();
    rerender(<PeopleGrid items={one} locale="tr" />);
    expect(screen.getByText("İY")).toBeInTheDocument();
  });

  it("an untyped headingAs outside h2-h4 still renders (cards fall back to h3)", () => {
    const one = [{ id: "a", name: "Ada Lovelace" }];
    render(<PeopleGrid items={one} heading="Team" headingAs={"h1" as "h2"} />);
    expect(screen.getByRole("heading", { level: 3, name: "Ada Lovelace" })).toBeInTheDocument();
  });
});

describe("server render / hydration", () => {
  it("hydrates the Turkish slots grid without warnings", async () => {
    const tree = (
      <PeopleGrid
        heading="Ekip"
        locale="tr"
        items={[{ id: "a", name: "ilker yılmaz", href: "/a" }]}
        renderBadge={() => <span>✓</span>}
        renderActions={() => <button type="button">Bağlan</button>}
      />
    );
    const html = renderToString(tree);
    expect(html).toContain("İY");
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
    errors.mockRestore();
    host.remove();
  });
});

describe("a11y", () => {
  it("axe: slots + links + images", async () => {
    const { container } = render(
      <PeopleGrid
        heading="Ekip"
        items={[
          { id: "a", name: "Ayşe Demir", href: "/a", image: "/a.jpg" },
          { id: "b", name: "Mehmet Kaya" },
        ]}
        renderBadge={() => (
          <span role="img" aria-label="verified">
            ✓
          </span>
        )}
        renderActions={() => <button type="button">Bağlan</button>}
      />,
    );
    await expectNoAxeViolations(container);
  });
});
