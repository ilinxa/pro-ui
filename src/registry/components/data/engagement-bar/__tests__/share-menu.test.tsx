import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareMenu, defaultShareMenuLabels } from "../parts/share-menu";
import type { EngagementLikerProfile } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

const u = (id: string, name: string, username?: string): EngagementLikerProfile => ({
  id,
  name,
  username,
});
const USERS = [u("1", "Ada Lovelace", "ada"), u("2", "Grace Hopper", "grace")];

function deferred() {
  let resolve!: (v: EngagementLikerProfile[]) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<EngagementLikerProfile[]>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const input = () => screen.getByRole("textbox");

describe("ShareMenu", () => {
  it("renders heading, users and a labelled search input", () => {
    render(<ShareMenu users={USERS} onShareTo={() => {}} />);
    expect(screen.getByText("Share with…")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("textbox", { name: "Search people" })).toBeInTheDocument();
    expect(input()).toHaveAttribute("placeholder", "Search people…");
  });

  it("calls onShareTo", async () => {
    const onShareTo = vi.fn();
    render(<ShareMenu users={USERS} onShareTo={onShareTo} />);
    await userEvent.click(screen.getByRole("button", { name: /Grace/ }));
    expect(onShareTo).toHaveBeenCalledWith(USERS[1]);
  });

  it("overrides every label key", () => {
    render(
      <ShareMenu
        users={[]}
        onShareTo={() => {}}
        onClose={() => {}}
        labels={{
          heading: "Paylaş",
          searchPlaceholder: "Ara…",
          searchLabel: "Kişi ara",
          empty: "Sonuç yok",
          close: "Gizle",
        }}
      />,
    );
    expect(screen.getByText("Paylaş")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Kişi ara" })).toHaveAttribute("placeholder", "Ara…");
    expect(screen.getByRole("status")).toHaveTextContent("Sonuç yok");
    expect(screen.getByRole("button", { name: "Gizle" })).toBeInTheDocument();
  });

  it("an undefined label value does not erase the default", () => {
    render(
      <ShareMenu
        users={[]}
        onShareTo={() => {}}
        onClose={() => {}}
        labels={{ heading: undefined, searchLabel: undefined, empty: undefined, close: undefined }}
      />,
    );
    expect(screen.getByText(defaultShareMenuLabels.heading)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search people" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No matches.");
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
  });

  it("legacy aliases work and labels win over them", () => {
    const { rerender } = render(
      <ShareMenu
        users={[]}
        onShareTo={() => {}}
        onClose={() => {}}
        heading="H"
        searchPlaceholder="P"
        emptyLabel="E"
        closeLabel="C"
      />,
    );
    expect(screen.getByText("H")).toBeInTheDocument();
    expect(input()).toHaveAttribute("placeholder", "P");
    expect(screen.getByRole("status")).toHaveTextContent("E");
    expect(screen.getByRole("button", { name: "C" })).toBeInTheDocument();
    rerender(
      <ShareMenu
        users={[]}
        onShareTo={() => {}}
        onClose={() => {}}
        heading="H"
        emptyLabel="E"
        labels={{ heading: "H2", empty: "E2" }}
      />,
    );
    expect(screen.getByText("H2")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("E2");
  });

  describe("local filter", () => {
    it("filters by name/username and shows the empty state", async () => {
      render(<ShareMenu users={USERS} onShareTo={() => {}} />);
      await userEvent.type(input(), "hop");
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      await userEvent.clear(input());
      await userEvent.type(input(), "zzz");
      expect(screen.queryAllByRole("listitem")).toHaveLength(0);
      expect(screen.getByRole("status")).toHaveTextContent("No matches.");
    });

    it("locale tr folds case the Turkish way (IŞIK matches ışık)", async () => {
      const users = [u("1", "IŞIK"), u("2", "Other")];
      const { unmount } = render(<ShareMenu users={users} locale="tr" onShareTo={() => {}} />);
      await userEvent.type(input(), "ışık");
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      unmount();
      render(<ShareMenu users={users} onShareTo={() => {}} />);
      await userEvent.type(input(), "ışık");
      expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    });

    it("tr initials: ilker -> İ", () => {
      render(<ShareMenu users={[u("1", "ilker")]} locale="tr" onShareTo={() => {}} />);
      expect(screen.getByText("İ")).toBeInTheDocument();
    });
  });

  describe("async onSearch", () => {
    it("latest request wins even if an older one resolves last", async () => {
      const first = deferred();
      const second = deferred();
      const onSearch = vi.fn((q: string) => (q === "a" ? first.promise : second.promise));
      render(<ShareMenu users={USERS} onSearch={onSearch} onShareTo={() => {}} />);
      await userEvent.type(input(), "ab");
      expect(onSearch).toHaveBeenCalledTimes(2);
      await act(async () => second.resolve([u("9", "Newer")]));
      await act(async () => first.resolve([u("8", "Older")]));
      expect(screen.getByText("Newer")).toBeInTheDocument();
      expect(screen.queryByText("Older")).toBeNull();
    });

    it("a rejected latest search falls back to the local filter", async () => {
      const onSearch = vi.fn(async () => {
        throw new Error("down");
      });
      render(<ShareMenu users={USERS} onSearch={onSearch} onShareTo={() => {}} />);
      await userEvent.type(input(), "grace");
      await waitFor(() => expect(onSearch).toHaveBeenCalled());
      await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
      expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    });

    it("a rejection of a stale request is ignored", async () => {
      const first = deferred();
      const second = deferred();
      const onSearch = vi.fn((q: string) => (q === "a" ? first.promise : second.promise));
      render(<ShareMenu users={USERS} onSearch={onSearch} onShareTo={() => {}} />);
      await userEvent.type(input(), "ab");
      await act(async () => second.resolve([u("9", "Newer")]));
      await act(async () => first.reject(new Error("late")));
      expect(screen.getByText("Newer")).toBeInTheDocument();
    });

    it("clearing the query cancels pending results", async () => {
      const pending = deferred();
      const onSearch = vi.fn(() => pending.promise);
      render(<ShareMenu users={USERS} onSearch={onSearch} onShareTo={() => {}} />);
      await userEvent.type(input(), "a");
      await userEvent.clear(input());
      await act(async () => pending.resolve([u("9", "Late")]));
      expect(screen.queryByText("Late")).toBeNull();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });
  });

  describe("axe", () => {
    it("menu with results", async () => {
      const { container } = render(
        <ShareMenu users={USERS} onShareTo={() => {}} onClose={() => {}} />,
      );
      await expectNoAxeViolations(container);
    });
    it("empty menu", async () => {
      const { container } = render(<ShareMenu users={[]} onShareTo={() => {}} />);
      expect(screen.getByRole("status")).toBeInTheDocument();
      await expectNoAxeViolations(container);
    });
  });
});
