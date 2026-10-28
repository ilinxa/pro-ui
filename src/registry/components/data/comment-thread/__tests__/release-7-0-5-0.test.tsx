/**
 * Release 7 (comment-thread 0.5.0): CT-1 renderContent, CT-2 labels that reach the rows, CT-4 author
 * links, CT-6 closed, the "View replies" disclosure state and locale-aware initials. Each test
 * was falsified against its fix (see the loop doc).
 */
import { createRef } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import { CommentComposer } from "../parts/comment-composer";
import { defaultCommentThreadLabels } from "../types";
import type { Comment, CommentThreadHandle, CommentThreadProps } from "../types";
import { defaultEngagementBarLabels } from "../../engagement-bar/types";
import { expectNoAxeViolations, mockLayout } from "../../../../../../tests/helpers";
import { ME, NOW, comment, installDomStubs, row, rowQueries } from "./support";

let restore: () => void;
let restoreLayout: () => void;
beforeEach(() => {
  restore = installDomStubs();
  restoreLayout = () => {};
});
afterEach(() => {
  restoreLayout();
  restore();
});

function setup(props: Partial<CommentThreadProps> & { comments: Comment[]; ref?: React.Ref<CommentThreadHandle> }) {
  const utils = render(<CommentThread now={NOW} currentUser={ME} {...props} />);
  return { user: userEvent.setup(), ...utils };
}

const LONG = "word ".repeat(120).trim();

describe("CT-1 renderContent", () => {
  it("renders its result inside the clamped body; the clamp and Show more still work", async () => {
    restoreLayout = mockLayout({ scrollHeight: 400, lineHeight: "20px" });
    const renderContent = vi.fn((c: Comment) => (
      <p>
        <a href="https://example.test/x">link in {c.id}</a> {LONG}
      </p>
    ));
    const { user } = setup({
      comments: [comment("a", { content: LONG })],
      bodyMaxLines: 3,
      renderContent,
    });
    const link = screen.getByRole("link", { name: "link in a" });
    const body = link.closest("div[style]") as HTMLElement | null;
    expect(body).not.toBeNull();
    expect(body!.style.maxHeight).toBe("3lh");
    expect(renderContent).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }), { depth: 0 });
    const toggle = within(link.closest("article") as HTMLElement).getByRole("button", { name: "Show more" });
    await user.click(toggle);
    expect(body!.style.maxHeight).toBe("");
    expect(within(link.closest("article") as HTMLElement).getByRole("button", { name: "Show less" })).toBeInTheDocument();
  });

  it("without renderContent the plain-content path is unchanged (a <p>)", () => {
    setup({ comments: [comment("a")] });
    expect(screen.getByText("Body a").tagName).toBe("P");
  });

  it("passes depth for replies", () => {
    const seen: Array<[string, number]> = [];
    setup({
      comments: [comment("a", { replies: [comment("b")] })],
      renderContent: (c, { depth }) => {
        seen.push([c.id, depth]);
        return <span>{c.id}</span>;
      },
    });
    expect(seen).toEqual(expect.arrayContaining([["a", 0], ["b", 1]]));
  });
});

describe("CT-2 labels reach every row", () => {
  it("a non-English labels object leaves no English default in the DOM or accessible names", async () => {
    restoreLayout = mockLayout({ scrollHeight: 400, lineHeight: "20px" });
    const es = {
      composerPlaceholder: "Escribe un comentario…",
      composerSend: "Enviar",
      composerCancel: "Anular",
      like: "Me gusta",
      unlike: "Ya no me gusta",
      reply: "Responder",
      delete: "Borrar",
      report: "Denunciar",
      viewReplies: (n: number) => `Ver ${n} respuestas`,
      loadMore: "Cargar anteriores",
      emptyState: "Sin comentarios",
      editedSuffix: "(editado)",
      kebabAriaLabel: (n: string) => `Opciones de ${n}`,
      replyTo: (n: string) => `Responder a ${n}`,
      showMore: "Ver más",
      showLess: "Ver menos",
      closed: "Comentarios cerrados.",
      engagement: {
        like: "Me gusta (barra)",
        unlike: "Ya no (barra)",
        openLikersPanel: "Ver quién",
        comment: "Comentar",
        share: "Compartir",
        bookmark: "Guardar",
        unbookmark: "Quitar guardado",
        viewCount: "Vistas",
        react: "Reaccionar",
        removeReaction: "Quitar reacción",
        openReactionsPanel: "Ver reacciones",
        reactionPickerLabel: "Elige una reacción",
      },
    };
    setup({
      comments: [comment("a", { content: LONG, edited: true, likes: 2, reactions: { totalCount: 1, counts: { love: 1 }, viewerReaction: null } })],
      reactionKinds: [{ key: "love", icon: "♥", label: "Amor" }],
      onReactComment: () => {},
      engagementActions: (_c, { defaultActions }) => [
        ...defaultActions,
        { kind: "comment", count: 3, onClick: () => {} },
        { kind: "share", count: 1, onClick: () => {} },
        { kind: "bookmark" },
        { kind: "view-count", count: 5 },
      ],
      bodyMaxLines: 3,
      labels: es,
    });

    const container = document.body;
    const names = Array.from(container.querySelectorAll("[aria-label],[title],[placeholder]")).flatMap((el) =>
      ["aria-label", "title", "placeholder"].map((a) => el.getAttribute(a) ?? ""),
    );
    const haystack = [container.textContent ?? "", ...names].join("\n");
    const english = [
      ...Object.values(defaultCommentThreadLabels).filter((v): v is string => typeof v === "string"),
      ...Object.values(defaultEngagementBarLabels),
    ];
    for (const phrase of new Set(english)) {
      expect(haystack, `English default "${phrase}" leaked`).not.toContain(phrase);
    }
    expect(screen.getByRole("button", { name: "Ver más" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Comentar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Compartir/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Reaccionar/ })).toBeInTheDocument();
  });

  it("Show more / Show less forward to the row's expandable-text", async () => {
    restoreLayout = mockLayout({ scrollHeight: 400, lineHeight: "20px" });
    const { user } = setup({
      comments: [comment("a", { content: LONG })],
      labels: { showMore: "Más", showLess: "Menos" },
    });
    await user.click(screen.getByRole("button", { name: "Más" }));
    expect(screen.getByRole("button", { name: "Menos" })).toBeInTheDocument();
  });

  it("the thread's like / unlike win over engagement.like / engagement.unlike", () => {
    setup({
      comments: [comment("a", { likes: 1, isLiked: false }), comment("b", { likes: 1, isLiked: true })],
      labels: { like: "A", unlike: "B", engagement: { like: "X", unlike: "Y" } },
    });
    expect(screen.getByRole("button", { name: /^A/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^B/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^[XY]/ })).toBeNull();
  });

  it("engagement.like / engagement.unlike alone localize the heart (the thread defaults don't mask them)", () => {
    setup({
      comments: [comment("a", { likes: 1, isLiked: false }), comment("b", { likes: 1, isLiked: true })],
      labels: { engagement: { like: "Beğen", unlike: "Vazgeç" } },
    });
    expect(screen.getByRole("button", { name: /^Beğen/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Vazgeç/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^(Like|Unlike)\b/ })).toBeNull();
  });

  it("initials follow the thread locale (Turkish dotted capital I)", () => {
    const { rerender } = render(
      <CommentThread
        now={NOW}
        locale="tr"
        comments={[comment("a", { author: { id: "u", name: "ilker" } })]}
      />,
    );
    expect(screen.getByText("İ")).toBeInTheDocument();
    rerender(
      <CommentThread now={NOW} locale="en" comments={[comment("a", { author: { id: "u", name: "ilker" } })]} />,
    );
    expect(screen.getByText("I")).toBeInTheDocument();
  });

  it("the composer avatar uses the thread locale; standalone it stays English", () => {
    const { unmount } = render(
      <CommentThread now={NOW} locale="tr" currentUser={{ id: "m", name: "ilker" }} comments={[]} />,
    );
    expect(screen.getByText("İ")).toBeInTheDocument();
    unmount();
    render(<CommentComposer currentUser={{ id: "m", name: "ilker" }} onSubmit={() => {}} />);
    expect(screen.getByText("I")).toBeInTheDocument();
  });
});

describe("CT-4 author links", () => {
  const withHref: Partial<CommentThreadProps> = {
    getAuthorHref: (author) => `/u/${author.id}`,
  };

  it("one accessible link per row named by the author; the avatar link is hidden and out of the tab order", () => {
    setup({ comments: [comment("a", { author: { id: "x", name: "Ada", username: "ada" } }), comment("b")], ...withHref });
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/u/x", "/u/u-b"]);
    expect(screen.getByRole("link", { name: "Ada" })).toBeInTheDocument();
    const hidden = document.querySelectorAll('a[aria-hidden="true"]');
    expect(hidden).toHaveLength(2);
    hidden.forEach((a) => expect(a.getAttribute("tabindex")).toBe("-1"));
  });

  it("an RTL name sits in <bdi> and the @handle is dir=ltr", () => {
    setup({
      comments: [comment("a", { author: { id: "x", name: "عائشة", username: "aisha" } })],
      ...withHref,
    });
    const link = screen.getByRole("link", { name: "عائشة" });
    expect(link.querySelector("bdi")).toHaveTextContent("عائشة");
    expect(screen.getByText("@aisha")).toHaveAttribute("dir", "ltr");
  });

  it("no href (or undefined) renders no links", () => {
    setup({ comments: [comment("a"), comment("b")], getAuthorHref: () => undefined });
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("without author links the name is still isolated and the @handle stays left-to-right (RTL fix)", () => {
    setup({ comments: [comment("a", { author: { id: "x", name: "سارة", username: "sara" } })] });
    expect(screen.getByText("سارة").tagName).toBe("BDI");
    expect(screen.getByText("@sara")).toHaveAttribute("dir", "ltr");
  });

  it("linkComponent receives the href", () => {
    const Custom = ({ href, children, ...rest }: React.ComponentProps<"a">) => (
      <a data-custom="1" href={href} {...rest}>
        {children}
      </a>
    );
    setup({ comments: [comment("a")], ...withHref, linkComponent: Custom });
    expect(document.querySelectorAll("[data-custom]")).toHaveLength(2);
  });

  it("axe: a linked thread has no violations", async () => {
    const { container } = setup({ comments: [comment("a", { author: { id: "x", name: "Ada", username: "ada" } })], ...withHref });
    await expectNoAxeViolations(container);
  });
});

describe("CT-6 closed", () => {
  const tree = () => [comment("a", { likes: 1, replies: [comment("b")] })];

  it("hides the composer and every Reply, shows the notice; likes and menus stay", () => {
    setup({ comments: [comment("m", { author: ME, likes: 1 })], closed: true, onLikeComment: () => {}, onDeleteComment: () => {} });
    expect(screen.queryByPlaceholderText("Write a comment…")).toBeNull();
    expect(screen.queryByRole("button", { name: "Reply" })).toBeNull();
    expect(screen.getByText("Comments are turned off.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Like/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Comment actions for/ }).length).toBeGreaterThan(0);
  });

  it("renderComposer is not called while closed", () => {
    const renderComposer = vi.fn(() => <div>custom</div>);
    setup({ comments: tree(), closed: true, renderComposer });
    expect(renderComposer).not.toHaveBeenCalled();
    expect(screen.getByText("Comments are turned off.")).toBeInTheDocument();
  });

  it("uses labels.closed", () => {
    setup({ comments: tree(), closed: true, labels: { closed: "Cerrado" } });
    expect(screen.getByText("Cerrado")).toBeInTheDocument();
  });

  it("closing drops an open reply composer", async () => {
    const { user, rerender } = setup({ comments: tree() });
    await user.click(within(row("Body a")).getAllByRole("button", { name: "Reply" })[0]);
    expect(screen.getByRole("textbox", { name: "Reply to User a" })).toBeInTheDocument();
    rerender(<CommentThread now={NOW} currentUser={ME} comments={tree()} closed />);
    expect(screen.queryByRole("textbox")).toBeNull();
    // Re-opening the thread does not resurrect the old composer.
    rerender(<CommentThread now={NOW} currentUser={ME} comments={tree()} />);
    expect(screen.queryByRole("textbox", { name: "Reply to User a" })).toBeNull();
  });

  it("handle.openReply / focusComposer do nothing and warn once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ref = createRef<CommentThreadHandle>();
    setup({ comments: tree(), closed: true, ref });
    act(() => {
      ref.current!.openReply("a");
      ref.current!.focusComposer();
      ref.current!.openReply("a");
    });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("closed"))).toHaveLength(1);
    warn.mockRestore();
  });

  it("the renderNode helper's onReply does nothing while closed", async () => {
    const { user } = setup({
      comments: tree(),
      closed: true,
      renderNode: (c, _depth, helpers) => (
        <button type="button" onClick={helpers.onReply}>
          {`reply-${c.id}`}
        </button>
      ),
    });
    await user.click(screen.getAllByRole("button", { name: /^reply-/ })[0]!);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("not closed: the handle still opens a reply", () => {
    const ref = createRef<CommentThreadHandle>();
    setup({ comments: tree(), ref });
    act(() => ref.current!.openReply("a"));
    expect(screen.getByRole("textbox", { name: "Reply to User a" })).toBeInTheDocument();
  });

  it("axe: a closed thread has no violations", async () => {
    const { container } = setup({ comments: tree(), closed: true });
    await expectNoAxeViolations(container);
  });
});

describe("View replies disclosure", () => {
  const deep = () => [comment("a", { replies: [comment("b", { replies: [comment("c", { replies: [comment("d")] })] })] })];

  it("a collapsed link says aria-expanded=false and has no dangling aria-controls", () => {
    setup({ comments: deep(), maxDepth: 1 });
    const link = screen.getByRole("button", { name: /^View 1 reply/ });
    expect(link).toHaveAttribute("aria-expanded", "false");
    expect(link).not.toHaveAttribute("aria-controls");
  });

  it("expanding past maxDepth hands focus to the first revealed reply (the link unmounts)", async () => {
    const { user } = setup({ comments: deep(), maxDepth: 1 });
    await user.click(screen.getByRole("button", { name: /^View 1 reply/ }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement?.closest("[data-comment-id]")?.getAttribute("data-comment-id")).toBe("c");
  });

  it("any aria-controls on the page points at an element that exists", async () => {
    const { user } = setup({ comments: deep(), maxDepth: 1 });
    await user.click(screen.getByRole("button", { name: /^View 1 reply/ }));
    for (const el of document.querySelectorAll("[aria-controls]")) {
      const id = el.getAttribute("aria-controls")!;
      expect(document.getElementById(id), `aria-controls="${id}" dangles`).not.toBeNull();
    }
  });

  it("the paged 'more replies' link is not a disclosure (no aria-expanded) and controls the shown list", () => {
    setup({
      comments: [comment("a", { replyCount: 3, replies: [comment("b")] })],
      onLoadReplies: async () => ({ items: [], hasMore: false } as never),
    });
    const more = screen.getByRole("button", { name: "View more replies" });
    expect(more).not.toHaveAttribute("aria-expanded");
    const id = more.getAttribute("aria-controls")!;
    expect(document.getElementById(id)).not.toBeNull();
  });
});

void rowQueries;
