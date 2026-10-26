/**
 * filter-bar 0.3.0 — FB1 (onChange from handlers only, controlled debounce), FB2 (locale),
 * FB3 (align on both rows), FB4 (lazy calendar boundary), FB5 (searchAccessory), plural count.
 * See docs/procomps/filter-bar-procomp/filter-bar-loop.md (U1).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { tr } from "date-fns/locale";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { FilterBar } from "../filter-bar";
import { createCountText, createDateFormatters, resolveLocale } from "../lib/format-default";
import type { FilterBarValue } from "../types";

const CATS = [
  { value: "tech", label: "Technology" },
  { value: "events", label: "Events" },
];
const EMPTY = { from: undefined, to: undefined };

afterEach(() => {
  vi.useRealTimers();
});

describe("FB1 — onChange fires from user handlers only", () => {
  it("does nothing on mount", () => {
    const onChange = vi.fn();
    render(<FilterBar categories={CATS} onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does nothing when onChange changes identity", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<FilterBar categories={CATS} onChange={first} />);
    rerender(<FilterBar categories={CATS} onChange={second} />);
    rerender(<FilterBar categories={CATS} onChange={() => second()} />);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it("does nothing when a controlled prop changes from outside", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FilterBar categories={CATS} search="a" category={null} dateRange={EMPTY} onChange={onChange} />,
    );
    rerender(<FilterBar categories={CATS} search="b" category="tech" dateRange={EMPTY} onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("one chip click is one call, with the merged next value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar categories={CATS} defaultSearch="x" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Events" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ search: "x", category: "events", dateRange: EMPTY });
  });

  it("the All chip emits category null", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar categories={CATS} defaultCategory="tech" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].category).toBeNull();
  });

  it("per-control callbacks keep firing alongside onChange (I1)", async () => {
    const onChange = vi.fn();
    const onCategoryChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar categories={CATS} category="tech" onCategoryChange={onCategoryChange} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Events" }));
    expect(onCategoryChange).toHaveBeenCalledWith("events");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Technology" })).toHaveAttribute("aria-pressed", "true");
  });

  it("emitInitialChange fires exactly once on mount, and not again on rerender", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FilterBar categories={CATS} defaultSearch="q" emitInitialChange onChange={onChange} />,
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ search: "q", category: null, dateRange: EMPTY });
    rerender(<FilterBar categories={CATS} defaultSearch="q" emitInitialChange onChange={onChange} />);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("an inline onChange that sets parent state does not loop", async () => {
    const renders = vi.fn();
    function Host() {
      const [value, setValue] = useState<FilterBarValue | null>(null);
      renders();
      return <FilterBar categories={CATS} onChange={(v) => setValue(v)} resultsCount={value ? 1 : 0} />;
    }
    const user = userEvent.setup();
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Events" }));
    expect(renders.mock.calls.length).toBeLessThan(6);
  });
});

describe("FB1 — search debounce", () => {
  it("uncontrolled: one onChange per debounced commit, none while typing", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onSearchChange = vi.fn();
    render(<FilterBar categories={CATS} onChange={onChange} onSearchChange={onSearchChange} />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "a" } });
    act(() => void vi.advanceTimersByTime(100));
    fireEvent.change(input, { target: { value: "ab" } });
    act(() => void vi.advanceTimersByTime(249));
    expect(onChange).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ search: "ab", category: null, dateRange: EMPTY });
    expect(onSearchChange).toHaveBeenCalledTimes(1);
    act(() => void vi.advanceTimersByTime(1000));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("an inline onSearchChange identity change does not restart the timer", () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const { rerender } = render(<FilterBar categories={CATS} onSearchChange={(s) => calls.push(s)} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "z" } });
    act(() => void vi.advanceTimersByTime(200));
    rerender(<FilterBar categories={CATS} onSearchChange={(s) => calls.push(s)} />);
    act(() => void vi.advanceTimersByTime(60));
    expect(calls).toEqual(["z"]);
  });

  it("controlled, default: every keystroke calls back immediately and the prop wins", () => {
    const onSearchChange = vi.fn();
    render(<FilterBar categories={CATS} search="" onSearchChange={onSearchChange} />);
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a" } });
    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith("a");
    expect(input.value).toBe("");
  });

  it("controlled + debounceControlledSearch: echoes locally, commits once after the delay", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    const onChange = vi.fn();
    render(
      <FilterBar
        categories={CATS}
        search=""
        debounceControlledSearch
        onSearchChange={onSearchChange}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "h" } });
    fireEvent.change(input, { target: { value: "he" } });
    expect(input.value).toBe("he");
    expect(onSearchChange).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(250));
    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith("he");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("controlled + debounce: resyncs when the prop moves to a value that was not committed", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    const { rerender } = render(
      <FilterBar categories={CATS} search="" debounceControlledSearch onSearchChange={onSearchChange} />,
    );
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "typing" } });
    rerender(<FilterBar categories={CATS} search="from-url" debounceControlledSearch onSearchChange={onSearchChange} />);
    expect(input.value).toBe("from-url");
    act(() => void vi.advanceTimersByTime(1000));
    expect(onSearchChange).not.toHaveBeenCalled();
  });

  it("controlled + debounce: adopting the committed value keeps what the user typed next", () => {
    vi.useFakeTimers();
    function Host() {
      const [s, setS] = useState("");
      return <FilterBar categories={CATS} search={s} debounceControlledSearch onSearchChange={setS} />;
    }
    render(<Host />);
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "ab" } });
    act(() => void vi.advanceTimersByTime(250));
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input.value).toBe("abc");
    act(() => void vi.advanceTimersByTime(250));
    expect(input.value).toBe("abc");
  });
});

describe("FB2 — locale, time zone, count text", () => {
  const D1 = new Date(2026, 9, 5);
  const D2 = new Date(2026, 9, 19);

  it("locale=\"tr\" formats the trigger range in Turkish; no locale is English", () => {
    const { unmount } = render(<FilterBar locale="tr" defaultDateRange={{ from: D1, to: D2 }} />);
    expect(screen.getByRole("button", { name: /5 Eki - 19 Eki/ })).toBeInTheDocument();
    unmount();
    render(<FilterBar defaultDateRange={{ from: D1, to: D2 }} />);
    expect(screen.getByRole("button", { name: /Oct 5 - Oct 19/ })).toBeInTheDocument();
  });

  it("a single date uses the long format; an invalid locale falls back to en", () => {
    render(<FilterBar locale="not a locale!!" defaultDateRange={{ from: D1, to: undefined }} />);
    expect(screen.getByRole("button", { name: /October 5, 2026/ })).toBeInTheDocument();
    expect(resolveLocale("not a locale!!")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale("tr")).toBe("tr");
  });

  it("timeZone moves the formatted day", () => {
    const utcMidnight = new Date(Date.UTC(2026, 9, 5, 0, 30));
    expect(createDateFormatters("en", "UTC").formatDate(utcMidnight)).toBe("October 5, 2026");
    expect(createDateFormatters("en", "America/Los_Angeles").formatDate(utcMidnight)).toBe("October 4, 2026");
    expect(() => createDateFormatters("en", "Not/AZone").formatDate(utcMidnight)).not.toThrow();
  });

  it("formatDate / formatDateRange overrides still win", () => {
    render(
      <FilterBar
        locale="tr"
        formatDateRange={() => "custom range"}
        defaultDateRange={{ from: D1, to: D2 }}
      />,
    );
    expect(screen.getByRole("button", { name: /custom range/ })).toBeInTheDocument();
  });

  it("hydrates the same markup on server and client with a locale (no mismatch)", async () => {
    const el = <FilterBar categories={CATS} locale="tr" defaultDateRange={{ from: D1, to: D2 }} resultsCount={1234} />;
    const html = renderToString(el);
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const recoverable = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(host, el, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(host.textContent).toContain("1.234 items found");
    root.unmount();
    host.remove();
    error.mockRestore();
  });

  it("count text: singular and plural", () => {
    const { rerender } = render(<FilterBar resultsCount={1} />);
    expect(screen.getByText("1 item found")).toBeInTheDocument();
    rerender(<FilterBar resultsCount={42} />);
    expect(screen.getByText("42 items found")).toBeInTheDocument();
    rerender(<FilterBar resultsCount={0} />);
    expect(screen.getByText("0 items found")).toBeInTheDocument();
  });

  it("count is grouped only when a locale is passed", () => {
    const { rerender } = render(<FilterBar resultsCount={1234567} />);
    expect(screen.getByText("1234567 items found")).toBeInTheDocument();
    rerender(<FilterBar resultsCount={1234567} locale="en" />);
    expect(screen.getByText("1,234,567 items found")).toBeInTheDocument();
    expect(createCountText("de")(1234)).toBe("1.234 items found");
  });

  it("a labels.resultsCountText override wins, and undefined does not erase the default", () => {
    const { rerender } = render(<FilterBar resultsCount={3} labels={{ resultsCountText: (n) => `${n} haber` }} />);
    expect(screen.getByText("3 haber")).toBeInTheDocument();
    rerender(<FilterBar resultsCount={3} labels={{ resultsCountText: undefined }} />);
    expect(screen.getByText("3 items found")).toBeInTheDocument();
  });
});

describe("FB3 — align drives both rows", () => {
  const rows = (container: HTMLElement) => {
    const chipRow = screen.getByRole("group", { name: "Filter by category" });
    return { chipRow, filterRow: chipRow.parentElement as HTMLElement, root: container.firstElementChild as HTMLElement };
  };

  it.each([
    ["left", "justify-start", "justify-center", "justify-end"],
    ["center", "justify-center", "justify-start", "justify-end"],
    ["right", "justify-end", "justify-start", "justify-center"],
  ] as const)("align=%s sets %s on the filter row and the chip row", (align, yes, no1, no2) => {
    const { container } = render(<FilterBar categories={CATS} align={align} />);
    const { chipRow, filterRow } = rows(container);
    for (const el of [chipRow, filterRow]) {
      expect(el).toHaveClass(yes);
      expect(el).not.toHaveClass(no1);
      expect(el).not.toHaveClass(no2);
    }
  });

  it("default is center", () => {
    const { container } = render(<FilterBar categories={CATS} />);
    const { chipRow, filterRow, root } = rows(container);
    expect(chipRow).toHaveClass("justify-center");
    expect(filterRow).toHaveClass("justify-center");
    expect(root).toHaveClass("items-center");
  });
});

describe("FB4 — lazy calendar boundary", { timeout: 20000 }, () => {
  const dir = join(__dirname, "..");
  // Pre-warm the lazy module so the "0 grids before open, grids after" proof does not depend
  // on cold dynamic-import time under full-suite load.
  beforeAll(async () => {
    await import("../parts/date-range-calendar");
  }, 60000);
  const read = (p: string) => readFileSync(join(dir, p), "utf8");
  const importsOf = (src: string) =>
    [...src.matchAll(/^\s*import\s[^;]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);

  it("the entry graph has no static import of the calendar or react-day-picker", () => {
    for (const file of ["filter-bar.tsx", "parts/date-range-picker.tsx", "index.ts", "types.ts"]) {
      const specs = importsOf(read(file));
      expect(specs, file).not.toContain("@/components/ui/calendar");
      expect(specs.filter((s) => s.includes("date-range-calendar")), file).toEqual([]);
      expect(specs.filter((s) => s.includes("date-fns")), file).toEqual([]);
    }
  });

  it("react-day-picker is imported only as a type outside the calendar part", () => {
    for (const file of ["filter-bar.tsx", "parts/date-range-picker.tsx", "types.ts"]) {
      for (const m of read(file).matchAll(/^\s*import\s+(type\s+)?[^;]*?from\s+["']react-day-picker["']/gm)) {
        expect(m[1], file).toBeTruthy();
      }
    }
  });

  it("the picker reaches the calendar through React.lazy + a dynamic import", () => {
    const src = read("parts/date-range-picker.tsx");
    expect(src).toMatch(/lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/date-range-calendar["']\s*\)/);
    expect(read("parts/date-range-calendar.tsx")).toContain('from "@/components/ui/calendar"');
  });

  it("the calendar renders only after the popover opens", async () => {
    const user = userEvent.setup();
    render(<FilterBar locale="tr" />);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Filter by date" }));
    const grids = await screen.findAllByRole("grid", {}, { timeout: 10000 });
    expect(grids).toHaveLength(2);
  });

  it("selecting a range from the lazy calendar emits onChange once per click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar defaultDateRange={{ from: new Date(2026, 9, 5), to: undefined }} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /October 5, 2026/ }));
    const day = await screen.findByRole("button", { name: /October 19/ }, { timeout: 10000 });
    await user.click(day);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].dateRange.to).toBeInstanceOf(Date);
  });

  it("hideDateRange never mounts the picker", () => {
    render(<FilterBar categories={CATS} hideDateRange />);
    expect(screen.queryByRole("button", { name: "Filter by date" })).not.toBeInTheDocument();
  });
});

describe("FB5 — searchAccessory", () => {
  it("sits after the input in tab order and the input gets end padding only then", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FilterBar categories={CATS} searchAccessory={<button type="button">Acc</button>} />,
    );
    const input = screen.getByRole("searchbox");
    expect(input).toHaveClass("pe-14");
    await user.tab();
    expect(input).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Acc" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "All" })).toHaveFocus();
    rerender(<FilterBar categories={CATS} />);
    expect(screen.getByRole("searchbox")).not.toHaveClass("pe-14");
  });

  it("is inside the search landmark, after the input in DOM order", () => {
    render(<FilterBar searchAccessory={<span data-testid="acc" />} />);
    const input = screen.getByRole("searchbox");
    const acc = screen.getByTestId("acc");
    expect(screen.getByRole("search")).toContainElement(acc);
    expect(input.compareDocumentPosition(acc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("invariants", () => {
  it("role=search, chip group, polite count region (I3)", () => {
    render(<FilterBar categories={CATS} resultsCount={2} />);
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Filter by category" })).toBeInTheDocument();
    expect(screen.getByText("2 items found")).toHaveAttribute("aria-live", "polite");
  });

  it("the polite count region is mounted even with no count, and the same node announces later", () => {
    const { rerender } = render(<FilterBar categories={CATS} />);
    const region = document.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(region).not.toBeNull();
    expect(region).toBeEmptyDOMElement();
    rerender(<FilterBar categories={CATS} resultsCount={5} />);
    expect(document.querySelector('[aria-live="polite"]')).toBe(region);
    expect(region).toHaveTextContent("5 items found");
  });
});

describe("U4 — pending search is part of the merged value", () => {
  const typeThen = (input: HTMLElement, v: string) => fireEvent.change(input, { target: { value: v } });

  it("uncontrolled: a chip click inside the debounce window carries the visible search; no late call", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onSearchChange = vi.fn();
    render(<FilterBar categories={CATS} onChange={onChange} onSearchChange={onSearchChange} />);
    typeThen(screen.getByRole("searchbox"), "abc");
    act(() => void vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByRole("button", { name: "Events" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ search: "abc", category: "events", dateRange: EMPTY });
    expect(onSearchChange).toHaveBeenCalledWith("abc");
    act(() => void vi.advanceTimersByTime(1000));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledTimes(1);
  });

  it("controlled + debounceControlledSearch: same, and the host sees the flushed search", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onSearchChange = vi.fn();
    render(
      <FilterBar
        categories={CATS}
        search=""
        debounceControlledSearch
        onChange={onChange}
        onSearchChange={onSearchChange}
      />,
    );
    typeThen(screen.getByRole("searchbox"), "abc");
    fireEvent.click(screen.getByRole("button", { name: "Events" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ search: "abc", category: "events", dateRange: EMPTY });
    expect(onSearchChange).toHaveBeenCalledWith("abc");
    act(() => void vi.advanceTimersByTime(1000));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledTimes(1);
  });

  it("clearing the date range while a search is pending also folds the search in", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <FilterBar defaultDateRange={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 6) }} onChange={onChange} />,
    );
    typeThen(screen.getByRole("searchbox"), "q");
    fireEvent.click(screen.getByRole("button", { name: "Clear date filter" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].search).toBe("q");
    act(() => void vi.advanceTimersByTime(1000));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("with nothing pending, a chip click does not invent a search commit", () => {
    const onSearchChange = vi.fn();
    render(<FilterBar categories={CATS} defaultSearch="x" onSearchChange={onSearchChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Events" }));
    expect(onSearchChange).not.toHaveBeenCalled();
  });
});

describe("U4 — late host adoption does not regress the input", () => {
  it("a host that adopts the older commit after a newer one keeps what the user typed", () => {
    vi.useFakeTimers();
    let setHost!: (v: string) => void;
    function Host() {
      const [s, setS] = useState("");
      setHost = setS;
      return <FilterBar categories={CATS} search={s} debounceControlledSearch />;
    }
    render(<Host />);
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a" } });
    act(() => void vi.advanceTimersByTime(250));
    fireEvent.change(input, { target: { value: "ab" } });
    act(() => void vi.advanceTimersByTime(250));
    act(() => setHost("a"));
    expect(input.value).toBe("ab");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input.value).toBe("abc");
    act(() => setHost("ab"));
    expect(input.value).toBe("abc");
  });

  it("a value that is not a pending commit still resyncs the input", () => {
    vi.useFakeTimers();
    const { rerender } = render(<FilterBar categories={CATS} search="" debounceControlledSearch />);
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a" } });
    act(() => void vi.advanceTimersByTime(250));
    rerender(<FilterBar categories={CATS} search="elsewhere" debounceControlledSearch />);
    expect(input.value).toBe("elsewhere");
  });

  it("works with a host that adopts through setTimeout", () => {
    vi.useFakeTimers();
    function Host() {
      const [s, setS] = useState("");
      return (
        <FilterBar
          categories={CATS}
          search={s}
          debounceControlledSearch
          onSearchChange={(v) => setTimeout(() => setS(v), 400)}
        />
      );
    }
    render(<Host />);
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a" } });
    act(() => void vi.advanceTimersByTime(250));
    fireEvent.change(input, { target: { value: "ab" } });
    act(() => void vi.advanceTimersByTime(250));
    act(() => void vi.advanceTimersByTime(200));
    expect(input.value).toBe("ab");
    act(() => void vi.advanceTimersByTime(1000));
    expect(input.value).toBe("ab");
  });
});

describe("U4 — timeZone reaches the calendar", () => {
  it("the day picked is the day shown on the trigger, in a zone unlike the runner's", async () => {
    const runnerOffset = -new Date(2026, 9, 5).getTimezoneOffset();
    const timeZone = runnerOffset === -660 ? "Pacific/Kiritimati" : "Pacific/Pago_Pago";
    const user = userEvent.setup();
    render(
      <FilterBar
        timeZone={timeZone}
        defaultDateRange={{ from: new Date("2026-10-05T12:00:00Z"), to: undefined }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /October \d, 2026/ }));
    const day = await screen.findByRole("button", { name: /October 19th/ }, { timeout: 10000 });
    await user.click(day);
    // second click completes nothing; the trigger now shows the picked day in the zone
    expect(screen.getByRole("button", { name: /Oct \d+ - Oct 19|October 19, 2026/ })).toBeInTheDocument();
  });
});

describe("U4 — labels, locale, StrictMode", () => {
  it("an undefined label keeps its default, for every key", () => {
    render(
      <FilterBar
        categories={CATS}
        labels={{ allLabel: undefined, searchAriaLabel: undefined, dateButtonText: "Tarih" }}
      />,
    );
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tarih" })).toBeInTheDocument();
  });

  it("a well-formed but unsupported locale tag falls back to en", () => {
    expect(resolveLocale("xx")).toBe("en");
    expect(resolveLocale("tr")).toBe("tr");
    expect(resolveLocale("de-DE")).toBe("de-DE");
  });

  it("emitInitialChange fires exactly once under StrictMode", () => {
    const onChange = vi.fn();
    render(
      <StrictMode>
        <FilterBar categories={CATS} emitInitialChange onChange={onChange} />
      </StrictMode>,
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("U4 — dir and calendarLocale", () => {
  it("dir=rtl reaches the popover content and the calendar", async () => {
    const user = userEvent.setup();
    render(<FilterBar dir="rtl" />);
    await user.click(screen.getByRole("button", { name: "Filter by date" }));
    const grids = await screen.findAllByRole("grid", {}, { timeout: 10000 });
    expect(grids[0].closest('[data-slot="popover-content"]')).toHaveAttribute("dir", "rtl");
    expect(grids[0].closest('[dir="rtl"]')).not.toBeNull();
  });

  it("calendarLocale renders localized month names", async () => {
    const user = userEvent.setup();
    render(<FilterBar calendarLocale={tr} defaultDateRange={{ from: new Date(2026, 9, 5), to: undefined }} />);
    await user.click(screen.getByRole("button", { name: /October 5, 2026/ }));
    await screen.findAllByRole("grid", {}, { timeout: 10000 });
    expect(document.body.textContent).toMatch(/Ekim/);
  });
});

