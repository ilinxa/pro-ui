/**
 * entity-picker 0.2.0 — controlled query, host-owned async states, labels, locale, kind-badge fix.
 * See docs/procomps/entity-picker-procomp/entity-picker-loop.md (U1).
 */
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";
import { defaultEntityPickerLabels } from "../types";
import { EntityPicker } from "../entity-picker";
import {
  ITEMS,
  KINDS,
  TR_ITEMS,
  installDomStubs,
  list,
  Multi,
  Single,
  type Ent,
} from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => {
  restore();
  vi.unstubAllEnvs();
});

const announcer = () =>
  document.body.querySelector<HTMLElement>('[data-slot="entity-picker-announcer"]')!;
const optionNames = () => screen.queryAllByRole("option").map((o) => o.textContent ?? "");
const input = () => screen.getByRole("combobox");

describe("I1 — no new props", () => {
  it("renders today's markup, filtering and English text", async () => {
    const user = userEvent.setup();
    render(<Multi value={[ITEMS[0]]} open />);
    expect(screen.getByRole("button", { name: "Remove Alpha" })).toBeInTheDocument();
    expect(input()).toHaveAttribute("placeholder", "Search…");
    expect(screen.getByRole("combobox", { name: "Search entities" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    await user.type(input(), "br");
    expect(optionNames()).toHaveLength(1);
    expect(optionNames()[0]).toMatch(/Bravo$/);
    await user.clear(input());
    await user.type(input(), "zzz");
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("empty items say 'Nothing to pick from'; the closed trigger says 'Select…'", () => {
    const { unmount } = render(<Single />);
    expect(screen.getByText("Select…")).toBeInTheDocument();
    unmount();
    render(<Single items={[]} open />);
    expect(screen.getByText("Nothing to pick from")).toBeInTheDocument();
  });

  it("selection is id-based: re-picking the same id does not fire onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Single value={{ ...ITEMS[0] }} onChange={onChange} open />);
    await user.click(screen.getByRole("option", { name: /Alpha/ }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("option", { name: /Bravo/ }));
    expect(onChange).toHaveBeenCalledWith(ITEMS[1]);
  });

  it("Backspace on an empty search removes the last chip", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Multi value={[ITEMS[0], ITEMS[1]]} onChange={onChange} open />);
    await user.click(input());
    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenCalledWith([ITEMS[0]]);
  });

  it("the uncontrolled query resets on close", async () => {
    const user = userEvent.setup();
    render(<Single />);
    await user.click(screen.getAllByRole("button")[0]!);
    await user.type(input(), "br");
    expect(input()).toHaveValue("br");
    await user.keyboard("{Escape}");
    await user.click(screen.getAllByRole("button")[0]!);
    expect(input()).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });
});

describe("EP1 — controlled query", () => {
  it("the prop wins: a host that ignores input keeps the host value", async () => {
    const onQueryChange = vi.fn();
    const user = userEvent.setup();
    render(<Single open query="al" onQueryChange={onQueryChange} />);
    await user.type(input(), "x");
    expect(onQueryChange).toHaveBeenCalledWith("alx", "input");
    expect(input()).toHaveValue("al");
    expect(optionNames()).toHaveLength(1);
    expect(optionNames()[0]).toMatch(/Alpha$/);
  });

  it("closing reports ('', 'reset') once, whether the picker or the host closes it", async () => {
    const onQueryChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Single query="al" onQueryChange={onQueryChange} />);
    await user.click(screen.getAllByRole("button")[0]!);
    expect(onQueryChange).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenLastCalledWith("", "reset");

    onQueryChange.mockClear();
    rerender(<Single open query="" onQueryChange={onQueryChange} />);
    expect(onQueryChange).not.toHaveBeenCalled();
    rerender(<Single open={false} query="" onQueryChange={onQueryChange} />);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenLastCalledWith("", "reset");
  });

  it("uncontrolled input still reports 'input'", async () => {
    const onQueryChange = vi.fn();
    const user = userEvent.setup();
    render(<Single open onQueryChange={onQueryChange} />);
    await user.type(input(), "b");
    expect(onQueryChange).toHaveBeenCalledWith("b", "input");
    expect(input()).toHaveValue("b");
  });

  it("Backspace-on-empty reads the controlled query", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Multi value={[ITEMS[0]]} onChange={onChange} open query="zz" />);
    await user.click(input());
    await user.keyboard("{Backspace}");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("EP1 — filterItems={false}", () => {
  const SERVER: Ent[] = [
    { id: "s1", label: "Zed" },
    { id: "s2", label: "Yan" },
  ];

  it("renders items as given and ignores match", async () => {
    const match = vi.fn<(item: Ent, query: string) => boolean>(() => false);
    render(<Single open items={SERVER} query="al" filterItems={false} match={match} />);
    expect(optionNames()).toEqual(["Zed", "Yan"]);
    // cmdk may score rows at registration (empty query); a real query must never reach `match`.
    expect(match.mock.calls.filter(([, q]) => q !== "")).toHaveLength(0);
  });

  it("filtering stays on by default (same items, same query)", () => {
    render(<Single open items={SERVER} query="al" />);
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("the empty row follows items.length, not cmdk's count", () => {
    const { rerender } = render(<Single open items={[]} query="" filterItems={false} />);
    expect(screen.getByText("Nothing to pick from")).toBeInTheDocument();
    rerender(<Single open items={[]} query="zz" filterItems={false} />);
    expect(screen.getByText("No results")).toBeInTheDocument();
    rerender(<Single open items={SERVER} query="zz" filterItems={false} />);
    expect(screen.queryByText("No results")).toBeNull();
    expect(screen.queryByText("Nothing to pick from")).toBeNull();
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("renderEmpty receives the server-mode empty state", () => {
    render(
      <Single
        open
        items={[]}
        query="q"
        filterItems={false}
        renderEmpty={({ query, itemCount }) => <p>{`none:${query}:${itemCount}`}</p>}
      />,
    );
    expect(screen.getByText("none:q:0")).toBeInTheDocument();
  });
});

describe("EP1 — states", () => {
  it("precedence loading > error > empty", () => {
    const { rerender } = render(<Single open items={[]} loading error="boom" />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText("Nothing to pick from")).toBeNull();
    rerender(<Single open items={[]} error="boom" />);
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    expect(screen.queryByText("Loading…")).toBeNull();
    expect(screen.queryByText("Nothing to pick from")).toBeNull();
    rerender(<Single open items={[]} />);
    expect(screen.getByText("Nothing to pick from")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("loading hides the filtered 'No results' too", () => {
    render(<Single open query="zzz" loading />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("No results")).toBeNull();
  });

  it("loading with items keeps the rows and adds a loading row; aria-busy follows loading", () => {
    const { rerender } = render(<Single open loading />);
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(list()).toHaveAttribute("aria-busy", "true");
    rerender(<Single open />);
    expect(list()).not.toHaveAttribute("aria-busy");
    expect(screen.queryByText("Loading…")).toBeNull();
  });

  it("error=true shows labels.error; a string shows the string", () => {
    const { rerender } = render(<Single open error />);
    expect(screen.getByRole("alert")).toHaveTextContent(defaultEntityPickerLabels.error);
    rerender(<Single open error labels={{ error: "Hata" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Hata");
    rerender(<Single open error="Sunucu yok" labels={{ error: "Hata" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sunucu yok");
    rerender(<Single open error={false} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("Retry renders only with onRetry, and calls it", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Single open error />);
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    rerender(<Single open error onRetry={onRetry} labels={{ retry: "Tekrar dene" }} />);
    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renderLoading / renderError replace the default rows", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <Single open loading query="q" renderLoading={({ query }) => <i>{`wait:${query}`}</i>} />,
    );
    expect(screen.getByText("wait:q")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).toBeNull();
    rerender(
      <Single
        open
        error="bad"
        onRetry={onRetry}
        renderError={({ message, onRetry: retry }) => (
          <button type="button" onClick={retry}>{`custom:${message}`}</button>
        )}
      />,
    );
    expect(screen.getByRole("button", { name: "custom:bad" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("EP1 — live region", () => {
  it("announces the count once when loading settles while open, not per keystroke", async () => {
    const resultsCount = vi.fn((n: number) => `${n} sonuç`);
    const user = userEvent.setup();
    const labels = { resultsCount };
    const { rerender } = render(<Single open filterItems={false} labels={labels} />);
    expect(announcer()).toHaveTextContent("");
    await user.type(input(), "abc");
    expect(announcer()).toHaveTextContent("");
    expect(resultsCount).not.toHaveBeenCalled();

    rerender(<Single open filterItems={false} labels={labels} loading />);
    expect(announcer()).toHaveTextContent("");
    rerender(<Single open filterItems={false} labels={labels} items={ITEMS.slice(0, 2)} />);
    expect(announcer()).toHaveTextContent("2 sonuç");
    expect(announcer()).toHaveAttribute("aria-live", "polite");
    expect(resultsCount).toHaveBeenCalledTimes(1);

    await user.type(input(), "d");
    rerender(<Single open filterItems={false} labels={labels} items={ITEMS} />);
    expect(announcer()).toHaveTextContent("2 sonuç");
    expect(resultsCount).toHaveBeenCalledTimes(1);

    rerender(<Single open filterItems={false} labels={labels} items={ITEMS} loading />);
    expect(announcer()).toHaveTextContent("");
    rerender(<Single open filterItems={false} labels={labels} items={ITEMS} />);
    expect(announcer()).toHaveTextContent("3 sonuç");
    expect(resultsCount).toHaveBeenCalledTimes(2);
  });

  it("does not announce when loading settles while the picker is closed", () => {
    const resultsCount = vi.fn(() => "x");
    const { rerender } = render(<Single loading labels={{ resultsCount }} />);
    rerender(<Single labels={{ resultsCount }} />);
    expect(resultsCount).not.toHaveBeenCalled();
  });

  it("passes a locale-formatted count as the second argument", () => {
    const resultsCount = vi.fn((_n: number, f: string) => f);
    const many = Array.from({ length: 1234 }, (_, i) => ({ id: `i${i}`, label: `L${i}` }));
    const { rerender } = render(<Single open items={many} loading locale="tr" labels={{ resultsCount }} />);
    rerender(<Single open items={many} locale="tr" labels={{ resultsCount }} />);
    expect(announcer()).toHaveTextContent("1.234");
  });
});

describe("EP1 — pagination", () => {
  it("the Load more row needs both hasMore and onLoadMore", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<Single open hasMore />);
    expect(screen.queryByText("Load more")).toBeNull();
    rerender(<Single open onLoadMore={onLoadMore} />);
    expect(screen.queryByText("Load more")).toBeNull();
    rerender(<Single open hasMore onLoadMore={onLoadMore} />);
    expect(screen.getByText("Load more")).toBeInTheDocument();
  });

  it("selecting the row calls onLoadMore and keeps the picker open; it survives a query", async () => {
    const onLoadMore = vi.fn();
    const user = userEvent.setup();
    render(<Single open hasMore onLoadMore={onLoadMore} labels={{ loadMore: "Daha fazla" }} />);
    await user.click(screen.getByText("Daha fazla"));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    await user.type(input(), "zzz");
    expect(screen.getByText("Daha fazla")).toBeInTheDocument();
  });

  it("loadingMore makes the row inert (aria-disabled) and shows the loading text", async () => {
    const onLoadMore = vi.fn();
    const user = userEvent.setup();
    render(<Single open hasMore onLoadMore={onLoadMore} loadingMore />);
    const row = screen.getByRole("button", { name: "Loading…" });
    expect(row).toHaveAttribute("aria-disabled", "true");
    await user.click(row);
    expect(onLoadMore).not.toHaveBeenCalled();
    expect(screen.queryByText("Load more")).toBeNull();
  });

  it("the focused Load more button stays focusable while loadingMore (never `disabled`)", () => {
    // A real browser moves focus to <body> when a focused button becomes `disabled`
    // (jsdom does not), so the guard is that the button never gets the attribute.
    const onLoadMore = vi.fn();
    const { rerender } = render(<Single open hasMore onLoadMore={onLoadMore} />);
    const row = screen.getByRole("button", { name: "Load more" });
    row.focus();
    rerender(<Single open hasMore onLoadMore={onLoadMore} loadingMore />);
    const busy = screen.getByRole("button", { name: "Loading…" });
    expect(busy).not.toBeDisabled();
    expect(busy).toBe(row);
    expect(document.activeElement).toBe(busy);
  });
});

describe("U5 — popover direction", () => {
  const popover = () => screen.getByRole("dialog");

  it("follows the trigger's direction (the popover is portalled out of the host's dir)", () => {
    render(
      <div dir="rtl">
        <Single open />
      </div>,
    );
    expect(popover()).toHaveAttribute("dir", "rtl");
  });

  it("is ltr by default and the dir prop wins", () => {
    const { unmount } = render(<Single open />);
    expect(popover()).toHaveAttribute("dir", "ltr");
    unmount();
    render(
      <div dir="rtl">
        <Single open dir="ltr" />
      </div>,
    );
    expect(popover()).toHaveAttribute("dir", "ltr");
  });
});

describe("EP2 — labels", () => {
  it("every label key is applied", () => {
    const labels = {
      searchPlaceholder: "Ara…",
      searchLabel: "Varlık ara",
      triggerPlaceholder: "Seç…",
      removeChip: (l: string) => `${l} kaldır`,
      nothingToPick: "Seçenek yok",
      noResults: "Sonuç yok",
      loading: "Yükleniyor…",
      error: "Hata",
      retry: "Tekrar",
      loadMore: "Daha fazla",
      resultsCount: (n: number) => `${n} sonuç`,
      listLabel: "Sonuçlar",
      selectedState: "seçili",
    };
    const { rerender } = render(<Multi labels={labels} value={[ITEMS[0]]} />);
    expect(screen.getByRole("button", { name: "Alpha kaldır" })).toBeInTheDocument();
    rerender(<Multi labels={labels} />);
    expect(screen.getByText("Seç…")).toBeInTheDocument();
    rerender(<Multi labels={labels} open query="zz" />);
    expect(input()).toHaveAttribute("placeholder", "Ara…");
    expect(screen.getByRole("combobox", { name: "Varlık ara" })).toBeInTheDocument();
    expect(screen.getByText("Sonuç yok")).toBeInTheDocument();
    rerender(<Multi labels={labels} open items={[]} />);
    expect(screen.getByText("Seçenek yok")).toBeInTheDocument();
    rerender(<Multi labels={labels} open loading />);
    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
    rerender(<Multi labels={labels} open error onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Hata");
    expect(screen.getByRole("button", { name: "Tekrar" })).toBeInTheDocument();
    rerender(<Multi labels={labels} open hasMore onLoadMore={() => {}} />);
    expect(screen.getByText("Daha fazla")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Search|Select|Remove|No results|Nothing|Loading|Retry|Load more/);
    // The listbox name is a label too: scan aria-label attributes, not only text.
    expect(screen.getByRole("listbox", { name: "Sonuçlar" })).toBeInTheDocument();
    const ariaLabels = Array.from(document.body.querySelectorAll("[aria-label]")).map((el) =>
      el.getAttribute("aria-label"),
    );
    expect(ariaLabels.join("|")).not.toMatch(/Suggestions|Search|Remove/);
  });

  it("an explicit undefined keeps the default", () => {
    render(
      <Single
        open
        labels={{ searchPlaceholder: undefined, searchLabel: undefined, noResults: undefined }}
        query="zz"
      />,
    );
    expect(input()).toHaveAttribute("placeholder", "Search…");
    expect(screen.getByRole("combobox", { name: "Search entities" })).toBeInTheDocument();
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("deprecated placeholder / triggerLabel win over their label keys", () => {
    render(
      <Single
        open
        placeholder="P!"
        triggerLabel="T!"
        labels={{ searchPlaceholder: "L-search", triggerPlaceholder: "L-trigger", searchLabel: "L-label" }}
      />,
    );
    expect(input()).toHaveAttribute("placeholder", "P!");
    expect(screen.getByRole("combobox", { name: "T!" })).toBeInTheDocument();
    expect(screen.getAllByText("T!").length).toBeGreaterThan(0);
    expect(screen.queryByText("L-trigger")).toBeNull();
    expect(screen.getAllByRole("button", { name: "T!" })).toHaveLength(1);
  });

  it("without the aliases the label keys apply", () => {
    render(<Single labels={{ triggerPlaceholder: "L-trigger" }} />);
    expect(screen.getByText("L-trigger")).toBeInTheDocument();
  });
});

describe("EP2 — locale", () => {
  it('locale="tr": typing "istanbul" finds "İstanbul"', async () => {
    const user = userEvent.setup();
    render(<Single open items={TR_ITEMS} locale="tr" />);
    await user.type(input(), "istanbul");
    expect(optionNames()).toEqual(["İstanbul"]);
  });

  it("without a locale the old toLowerCase behaviour stays (I1)", async () => {
    const user = userEvent.setup();
    render(<Single open items={TR_ITEMS} />);
    await user.type(input(), "istanbul");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    await user.clear(input());
    await user.type(input(), "ANK");
    expect(optionNames()).toEqual(["Ankara"]);
  });

  it("an invalid locale falls back instead of hiding every item", async () => {
    const user = userEvent.setup();
    render(<Single open items={TR_ITEMS} locale="not_a_locale!" />);
    await user.type(input(), "ank");
    expect(optionNames()).toEqual(["Ankara"]);
  });
});

describe("kind-badge regression", () => {
  it("chips keep their kind badge while items is empty", () => {
    render(<Multi items={[]} value={[ITEMS[0], ITEMS[1]]} kinds={KINDS} />);
    const trigger = screen.getAllByRole("button")[0]!.parentElement!;
    expect(within(trigger).getByText("Person")).toBeInTheDocument();
    expect(within(trigger).getByText("Project")).toBeInTheDocument();
  });

  it("the single-mode trigger keeps its badge too", () => {
    render(<Single items={[]} value={ITEMS[1]} kinds={KINDS} />);
    expect(screen.getByText("Project")).toBeInTheDocument();
  });

  it("showKindBadges={false} still wins", () => {
    render(<Multi items={[]} value={[ITEMS[0]]} kinds={KINDS} showKindBadges={false} />);
    expect(screen.queryByText("Person")).toBeNull();
  });
});

describe("server render", () => {
  it("hydrates with chips, labels, locale and async state without warnings", async () => {
    const el = (
      <EntityPicker<Ent>
        mode="multi"
        items={TR_ITEMS}
        value={[TR_ITEMS[0]]}
        onChange={() => {}}
        locale="tr"
        loading
        error="x"
        query="ist"
        labels={{ triggerPlaceholder: "Seç…", removeChip: (l) => `${l} kaldır` }}
      />
    );
    const html = renderToString(el);
    expect(html).toContain("İstanbul");
    expect(html).toContain("İstanbul kaldır");
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

describe("axe — the portaled popover", () => {
  it("has no violations open, loading, in error and with Load more", async () => {
    const { rerender } = render(<Multi open value={[ITEMS[0]]} hasMore onLoadMore={() => {}} />);
    await expectNoAxeViolations(document.body, { disable: ["color-contrast", "region"] });
    rerender(<Multi open loading />);
    await expectNoAxeViolations(document.body, { disable: ["color-contrast", "region"] });
    rerender(<Multi open error="boom" onRetry={() => {}} />);
    await expectNoAxeViolations(document.body, { disable: ["color-contrast", "region"] });
  });
});

describe("U4 — keyboard, announcement, accessibility fixes", () => {
  it("Retry works from the keyboard: Enter calls onRetry only, no selection, popover stays open", async () => {
    const onRetry = vi.fn();
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Single open error onRetry={onRetry} onChange={onChange} />);
    const retry = screen.getByRole("button", { name: "Retry" });
    retry.focus();
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    await user.keyboard(" ");
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Load more is not a cmdk item: a no-match query + Enter never calls onLoadMore", async () => {
    const onLoadMore = vi.fn();
    const user = userEvent.setup();
    render(<Single open hasMore onLoadMore={onLoadMore} />);
    expect(document.body.querySelector("[data-slot=entity-picker-load-more]")!.closest("[cmdk-item]")).toBeNull();
    await user.type(input(), "zzz{Enter}");
    expect(onLoadMore).not.toHaveBeenCalled();
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("items=[] with hasMore shows the empty row AND the Load more button", () => {
    render(<Single open items={[]} hasMore onLoadMore={() => {}} />);
    expect(screen.getByText("Nothing to pick from")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
    expect(screen.queryByText("No results")).toBeNull();
  });

  it("Load more works from the keyboard and keeps the popover open", async () => {
    const onLoadMore = vi.fn();
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Single open hasMore onLoadMore={onLoadMore} onChange={onChange} />);
    screen.getByRole("button", { name: "Load more" }).focus();
    await user.keyboard("{Enter}");
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    await user.keyboard(" ");
    expect(onLoadMore).toHaveBeenCalledTimes(2);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("does not announce a count when loading settles into an error", () => {
    const resultsCount = vi.fn(() => "x");
    const { rerender } = render(<Single open loading labels={{ resultsCount }} />);
    rerender(<Single open error="boom" labels={{ resultsCount }} />);
    expect(resultsCount).not.toHaveBeenCalled();
    expect(announcer()).toHaveTextContent("");
  });

  it("client filtering announces the rows that match the query, not items.length", () => {
    const resultsCount = vi.fn((n: number) => `${n} hit`);
    const labels = { resultsCount };
    const { rerender } = render(<Single open loading query="br" labels={labels} />);
    rerender(<Single open query="br" labels={labels} />);
    expect(announcer()).toHaveTextContent("1 hit");
    expect(resultsCount).toHaveBeenCalledWith(1, "1");
  });

  it("the listbox name comes from labels.listLabel (default 'Suggestions')", () => {
    const { rerender } = render(<Single open />);
    expect(screen.getByRole("listbox", { name: "Suggestions" })).toBeInTheDocument();
    rerender(<Single open labels={{ listLabel: "Sonuçlar" }} />);
    expect(screen.getByRole("listbox", { name: "Sonuçlar" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Suggestions")).toBeNull();
  });

  it("server mode: the highlight returns to the first row when the results change", async () => {
    const A: Ent[] = [
      { id: "a1", label: "One" },
      { id: "a2", label: "Two" },
      { id: "a3", label: "Three" },
    ];
    const B: Ent[] = [
      { id: "a2", label: "Two" },
      { id: "a3", label: "Three" },
      { id: "a1", label: "One" },
    ];
    const user = userEvent.setup();
    const { rerender } = render(<Single open filterItems={false} items={A} />);
    const selectedName = () =>
      screen.getAllByRole("option").find((o) => o.getAttribute("aria-selected") === "true")?.textContent;
    expect(selectedName()).toBe("One");
    await user.type(input(), "{ArrowDown}");
    expect(selectedName()).toBe("Two");
    rerender(<Single open filterItems={false} items={B} />);
    expect(optionNames()).toEqual(["Two", "Three", "One"]);
    expect(selectedName()).toBe("Two");
    // old first ("One") moved to third: highlight must not stay on it
    rerender(<Single open filterItems={false} items={A} />);
    expect(selectedName()).toBe("One");
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("data-selected", "true");
  });

  it("multi mode exposes chosen rows to screen readers", () => {
    render(<Multi open value={[ITEMS[1]]} />);
    const opts = screen.getAllByRole("option");
    const bravo = opts.find((o) => /Bravo/.test(o.textContent ?? ""))!;
    const alpha = opts.find((o) => /Alpha/.test(o.textContent ?? ""))!;
    expect(within(bravo).getByText("selected")).toBeInTheDocument();
    expect(within(alpha).queryByText("selected")).toBeNull();
  });

  it("aria-controls points at an element that exists while open, and is absent while closed", () => {
    const { rerender } = render(<Single />);
    const trigger = screen.getAllByRole("button")[0]!;
    expect(trigger).not.toHaveAttribute("aria-controls");
    rerender(<Single open />);
    const ref = screen.getAllByRole("button")[0]!.getAttribute("aria-controls");
    expect(ref).toBeTruthy();
    expect(document.getElementById(ref!)).not.toBeNull();
  });
});

describe("doc review — unstable-items dev warning", () => {
  it("does not fire for a host that swaps items between ordinary renders (server search)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Single items={[...ITEMS]} />);
    for (let fetch = 0; fetch < 8; fetch++) {
      const results = [...ITEMS];
      rerender(<Single items={results} />); // results arrive
      rerender(<Single items={results} query="a" />); // typing re-renders with the same array
      rerender(<Single items={results} query="ab" />);
    }
    expect(warn.mock.calls.flat().join(" ")).not.toMatch(/changing every render/);
    warn.mockRestore();
  });

  it("still fires for an array re-created on every render", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Single items={[...ITEMS]} />);
    for (let i = 0; i < 8; i++) rerender(<Single items={[...ITEMS]} />);
    expect(warn.mock.calls.flat().join(" ")).toMatch(/changing every render/);
    warn.mockRestore();
  });
});
