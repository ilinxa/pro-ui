/**
 * PC3: the header. `getAuthorHref`, `subtitle`, `noticeSlot`, `kebabAriaLabel`, `renderHeader`
 * keeping the kebab, `extraKebabActions`, `CommentMenuItem.hidden` and `permissions.disabled`.
 */
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CommentMenuItem } from "../../comment-thread/types";
import { PostCard } from "../post-card";
import { card, installDomStubs, makePost, NOW } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const openMenu = async (user = userEvent.setup()) => {
  await user.click(screen.getByRole("button", { name: "Post actions" }));
  return screen.findByRole("menu");
};
const itemNames = (menu: HTMLElement) => within(menu).getAllByRole("menuitem").map((i) => i.textContent);

describe("author link", () => {
  const props = { getAuthorHref: (a: { username?: string }) => `/u/${a.username}` };

  it("links the name (focusable) and the avatar (not focusable, hidden from assistive tech)", async () => {
    const user = userEvent.setup();
    const { container } = render(card(props));
    const name = screen.getByRole("link", { name: "Ada Lovelace" });
    expect(name).toHaveAttribute("href", "/u/ada");
    const avatar = container.querySelector('a[aria-hidden="true"]');
    expect(avatar).toHaveAttribute("href", "/u/ada");
    expect(avatar).toHaveAttribute("tabindex", "-1");
    // Only the name link is in the accessibility tree.
    expect(screen.getAllByRole("link")).toHaveLength(1);
    await user.tab();
    expect(name).toHaveFocus();
    await user.tab();
    expect(avatar).not.toHaveFocus();
  });

  it("stacks both links above the card's overlay link", () => {
    const { container } = render(card({ ...props, getHref: (p) => `/p/${p.id}` }));
    const overlay = container.querySelector("a.absolute.inset-0")!;
    expect(overlay).toHaveClass("z-0");
    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toHaveClass("relative", "z-10");
    expect(container.querySelector('a[aria-hidden="true"]')).toHaveClass("relative", "z-10");
  });

  it("renders the links with linkComponent", () => {
    const Custom = forwardRef<HTMLAnchorElement, ComponentProps<"a">>(function Custom(p, ref) {
      return <a ref={ref} data-custom="yes" {...p} />;
    });
    const { container } = render(card({ ...props, linkComponent: Custom }));
    expect(container.querySelectorAll("a[data-custom]")).toHaveLength(2);
  });

  it("renders no link when the host returns no href", () => {
    render(card({ getAuthorHref: () => undefined }));
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("subtitle and noticeSlot", () => {
  it("renders a subtitle node under the name", () => {
    render(card({ subtitle: <em>Sponsored</em> }));
    expect(screen.getByText("Sponsored")).toBeInTheDocument();
  });

  it("calls a subtitle function with the post", () => {
    const subtitle = vi.fn(() => "Community manager");
    render(card({ subtitle }));
    expect(subtitle).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }));
    expect(screen.getByText("Community manager")).toBeInTheDocument();
  });

  it.each(["feed", "compact", "list"] as const)("puts the notice above the content (%s)", (variant) => {
    render(
      <PostCard
        variant={variant}
        engagementMode="navigate"
        now={NOW}
        post={makePost()}
        noticeSlot={(post) => <p>Under review: {post.id}</p>}
      />,
    );
    const notice = screen.getByText("Under review: p1");
    const body = screen.getByText("Hello from the analytical engine.");
    expect(notice.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders nothing when the notice slot returns null", () => {
    const { container } = render(card({ noticeSlot: () => null }));
    expect(container.textContent).not.toContain("Under review");
  });
});

describe("kebab", () => {
  it("names the trigger with labels.kebabAriaLabel", () => {
    render(card({ labels: { kebabAriaLabel: "Gönderi işlemleri" } }));
    expect(screen.getByRole("button", { name: "Gönderi işlemleri" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Post actions" })).toBeNull();
  });

  it("renderHeader receives a working kebab", async () => {
    const renderHeader = vi.fn((_post: unknown, { kebab }: { kebab: ReactNode }) => (
      <header>
        <span>custom header</span>
        {kebab}
      </header>
    ));
    const onReport = vi.fn();
    render(card({ renderHeader, onReport, currentUser: { id: "me", name: "Me" } }));
    expect(renderHeader).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1" }),
      expect.objectContaining({ currentUser: { id: "me", name: "Me" } }),
    );
    const user = userEvent.setup();
    const menu = await openMenu(user);
    await user.click(within(menu).getByRole("menuitem", { name: "Report" }));
    expect(onReport).toHaveBeenCalledWith("p1");
  });

  it("renderHeader gets a null kebab when every item is hidden", () => {
    const renderHeader = vi.fn((_post: unknown, helpers: { kebab: ReactNode }) => (
      <header>{helpers.kebab ?? "custom header"}</header>
    ));
    render(card({ renderHeader, kebabActions: () => [{ label: "x", hidden: true }] }));
    expect(renderHeader.mock.calls[0]![1].kebab).toBeNull();
  });

  it("appends extraKebabActions after the default items, destructive group included", async () => {
    const onClick = vi.fn();
    const extra = (): CommentMenuItem[] => [{ label: "Copy embed", onClick }];
    render(card({ extraKebabActions: extra, onReport: vi.fn() }));
    const menu = await openMenu();
    const names = itemNames(menu);
    expect(names).toEqual(["Bookmark", "Report", "Copy embed"]);
    await userEvent.setup().click(within(menu).getByRole("menuitem", { name: "Copy embed" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("appends extraKebabActions in role-aware mode without canModerate, after Delete", async () => {
    render(
      card({
        viewerMode: "owner",
        onDelete: vi.fn(),
        onEdit: vi.fn(),
        extraKebabActions: () => [{ label: "Boost" }],
      }),
    );
    const names = itemNames(await openMenu());
    expect(names[0]).toBe("Edit");
    expect(names.at(-1)).toBe("Boost");
    expect(names.indexOf("Delete")).toBeLessThan(names.indexOf("Boost"));
  });

  it("ignores extraKebabActions when kebabActions takes over", async () => {
    render(
      card({
        kebabActions: () => [{ label: "Only me" }],
        extraKebabActions: () => [{ label: "Boost" }],
      }),
    );
    expect(itemNames(await openMenu())).toEqual(["Only me"]);
  });

  it("leaves hidden items out", async () => {
    render(
      card({
        kebabActions: () => [{ label: "Shown" }, { label: "Secret", hidden: true }, { label: "Also shown" }],
      }),
    );
    expect(itemNames(await openMenu())).toEqual(["Shown", "Also shown"]);
  });

  it("renders no kebab when every item is hidden", () => {
    render(card({ kebabActions: () => [{ label: "Secret", hidden: true }] }));
    expect(screen.queryByRole("button", { name: "Post actions" })).toBeNull();
  });
});

describe("permissions.disabled", () => {
  it("disables the named items in legacy (handler-driven) mode", async () => {
    render(card({ onReport: vi.fn(), permissions: { disabled: { bookmark: true, report: true } } }));
    const menu = await openMenu();
    expect(within(menu).getByRole("menuitem", { name: "Bookmark" })).toHaveAttribute("aria-disabled", "true");
    expect(within(menu).getByRole("menuitem", { name: "Report" })).toHaveAttribute("aria-disabled", "true");
  });

  it("stays in legacy mode: a `disabled`-only matrix adds no role-aware items", async () => {
    // Role-aware mode would add "Mute author" for a viewer with this handler wired.
    render(card({ onReport: vi.fn(), onMuteAuthor: vi.fn(), permissions: { disabled: { share: true } } }));
    expect(itemNames(await openMenu())).toEqual(["Bookmark", "Report"]);
  });

  it("disables the named items in role-aware mode and leaves the others usable", async () => {
    render(
      card({
        viewerMode: "owner",
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        permissions: { disabled: { delete: true } },
      }),
    );
    const menu = await openMenu();
    expect(within(menu).getByRole("menuitem", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");
    expect(within(menu).getByRole("menuitem", { name: "Edit" })).not.toHaveAttribute("aria-disabled", "true");
  });

  it("does not turn an item on: a denied action stays absent", async () => {
    render(
      card({
        viewerMode: "owner",
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        permissions: { canDelete: false, disabled: { delete: true } },
      }),
    );
    expect(itemNames(await openMenu())).not.toContain("Delete");
  });
});
