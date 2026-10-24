/** EB2 / C5 — controlled data, optimistic promises, rollback, delta overlays (I4, I5, I6, R2, R5, R6). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { EngagementBar } from "../engagement-bar";
import type { EngagementAction, EngagementDelta } from "../types";
import { deferred, installDomStubs, KINDS, makeSubscribe } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const flush = () => act(async () => {});

/** Open the picker and choose a kind (reaction selection is microtask-deferred). */
async function pickKind(user: UserEvent, container: HTMLElement, name: string) {
  await user.click(within(container).getByRole("button"));
  const group = await screen.findByRole("group", { name: "Pick a reaction" });
  await user.click(within(group).getByRole("button", { name: new RegExp(`^${name}`) }));
  await flush();
}

// -- adapters: the same C5 contract, three groups ---------------------------------------------

interface Adapter {
  name: string;
  handlerKey: "onToggle" | "onSelect";
  arg: unknown;
  action: (props: Record<string, unknown>) => EngagementAction;
  controlled: Record<string, unknown>;
  uncontrolled: Record<string, unknown>;
  adopt: Record<string, unknown>;
  request: (user: UserEvent, container: HTMLElement) => Promise<void>;
  expectBase: () => void;
  expectChanged: () => void;
}

const adapters: Adapter[] = [
  {
    name: "like",
    handlerKey: "onToggle",
    arg: true,
    action: (p) => ({ kind: "like", ...p }) as EngagementAction,
    controlled: { liked: false, count: 12 },
    uncontrolled: { count: 12 },
    adopt: { liked: true, count: 13 },
    request: async (user) => {
      await user.click(screen.getByRole("button", { name: /^(Like|Unlike)/ }));
      await flush();
    },
    expectBase: () => expect(screen.getByRole("button", { name: "Like 12" })).toHaveAttribute("aria-pressed", "false"),
    expectChanged: () => expect(screen.getByRole("button", { name: "Unlike 13" })).toHaveAttribute("aria-pressed", "true"),
  },
  {
    name: "bookmark",
    handlerKey: "onToggle",
    arg: true,
    action: (p) => ({ kind: "bookmark", ...p }) as EngagementAction,
    controlled: { bookmarked: false },
    uncontrolled: {},
    adopt: { bookmarked: true },
    request: async (user) => {
      await user.click(screen.getByRole("button", { name: /bookmark/i }));
      await flush();
    },
    expectBase: () => expect(screen.getByRole("button", { name: "Bookmark" })).toHaveAttribute("aria-pressed", "false"),
    expectChanged: () =>
      expect(screen.getByRole("button", { name: "Remove bookmark" })).toHaveAttribute("aria-pressed", "true"),
  },
  {
    name: "reaction",
    handlerKey: "onSelect",
    arg: "love",
    action: (p) => ({ kind: "reaction", kinds: KINDS, totalCount: 9, ...p }) as EngagementAction,
    controlled: { viewerReaction: null },
    uncontrolled: {},
    adopt: {
      viewerReaction: "love",
      totalCount: 10,
      kinds: KINDS.map((k) => (k.key === "love" ? { ...k, count: 6 } : k)),
    },
    request: (user, container) => pickKind(user, container, "Love"),
    expectBase: () => expect(screen.getByRole("button", { name: "React 9" })).toBeInTheDocument(),
    expectChanged: () => expect(screen.getByRole("button", { name: "Love 10" })).toBeInTheDocument(),
  },
];

for (const a of adapters) {
  describe(`I4/I5: ${a.name} - controlled data and promise handlers`, () => {
    const setup = (props: Record<string, unknown>, handler: (v: unknown) => unknown, bar: Record<string, unknown> = {}) => {
      const make = (over: Record<string, unknown> = {}) => (
        <EngagementBar actions={[a.action({ ...props, ...over, [a.handlerKey]: handler })]} {...bar} />
      );
      const view = render(make());
      return { ...view, make };
    };

    it("sync handler, controlled: the handler is called and the DOM keeps the prop", async () => {
      const user = userEvent.setup();
      const handler = vi.fn();
      const { container } = setup(a.controlled, handler);
      a.expectBase();
      await a.request(user, container);
      expect(handler).toHaveBeenCalledWith(a.arg);
      a.expectBase();
    });

    it("sync handler, uncontrolled: the change applies", async () => {
      const user = userEvent.setup();
      const handler = vi.fn();
      const { container } = setup(a.uncontrolled, handler);
      await a.request(user, container);
      expect(handler).toHaveBeenCalledWith(a.arg);
      a.expectChanged();
    });

    it("pending promise, controlled: shows the change at once; resolving without the parent adopting shows the prop again", async () => {
      const user = userEvent.setup();
      const d = deferred();
      const { container } = setup(a.controlled, () => d.promise);
      await a.request(user, container);
      a.expectChanged();
      await act(async () => d.resolve());
      a.expectBase();
    });

    it("pending promise, controlled: a rejection rolls back to the prop", async () => {
      const user = userEvent.setup();
      const d = deferred();
      const { container } = setup(a.controlled, () => d.promise);
      await a.request(user, container);
      a.expectChanged();
      await act(async () => d.reject(new Error("nope")));
      a.expectBase();
    });

    it("pending promise, controlled: the parent adopting mid-flight shows the prop and keeps it after resolve", async () => {
      const user = userEvent.setup();
      const d = deferred();
      const { container, rerender, make } = setup(a.controlled, () => d.promise);
      await a.request(user, container);
      rerender(make(a.adopt));
      await flush();
      a.expectChanged();
      await act(async () => d.resolve());
      a.expectChanged();
    });

    it("pending promise, uncontrolled: resolve keeps the change", async () => {
      const user = userEvent.setup();
      const d = deferred();
      const { container } = setup(a.uncontrolled, () => d.promise);
      await a.request(user, container);
      a.expectChanged();
      await act(async () => d.resolve());
      a.expectChanged();
    });

    it("pending promise, uncontrolled: reject rolls back to the last accepted value", async () => {
      const user = userEvent.setup();
      const d = deferred();
      const { container } = setup(a.uncontrolled, () => d.promise);
      await a.request(user, container);
      a.expectChanged();
      await act(async () => d.reject(new Error("nope")));
      a.expectBase();
    });

    it("optimistic={false}, uncontrolled: DOM unchanged until the promise resolves", async () => {
      const user = userEvent.setup();
      const d = deferred();
      const { container } = setup(a.uncontrolled, () => d.promise, { optimistic: false });
      await a.request(user, container);
      a.expectBase();
      await act(async () => d.resolve());
      a.expectChanged();
    });

    it("optimistic={false}, controlled: DOM unchanged until the props change", async () => {
      const user = userEvent.setup();
      const d = deferred();
      const { container, rerender, make } = setup(a.controlled, () => d.promise, { optimistic: false });
      await a.request(user, container);
      a.expectBase();
      await act(async () => d.resolve());
      a.expectBase();
      rerender(make(a.adopt));
      a.expectChanged();
    });
  });
}

describe("I4: controlled like - props win on every render", () => {
  it("re-render with new liked + count updates the DOM; a delta does not override", () => {
    const { subscribe, emit } = makeSubscribe<EngagementDelta>();
    const { rerender } = render(
      <EngagementBar subscribe={subscribe} actions={[{ kind: "like", liked: false, count: 12 }]} />,
    );
    expect(screen.getByRole("button", { name: "Like 12" })).toBeInTheDocument();
    act(() => emit({ kind: "like-changed", count: 99, liked: true }));
    expect(screen.getByRole("button", { name: "Like 12" })).toBeInTheDocument();
    rerender(<EngagementBar subscribe={subscribe} actions={[{ kind: "like", liked: true, count: 20 }]} />);
    expect(screen.getByRole("button", { name: "Unlike 20" })).toBeInTheDocument();
  });

  it("controlled bookmark follows its prop", () => {
    const { rerender } = render(<EngagementBar actions={[{ kind: "bookmark", bookmarked: false }]} />);
    expect(screen.getByRole("button", { name: "Bookmark" })).toBeInTheDocument();
    rerender(<EngagementBar actions={[{ kind: "bookmark", bookmarked: true }]} />);
    expect(screen.getByRole("button", { name: "Remove bookmark" })).toBeInTheDocument();
  });
});

describe("I5: ordering of overlapping requests", () => {
  it("an OLDER request resolving last never overrides the newer one (uncontrolled like)", async () => {
    const user = userEvent.setup();
    const d1 = deferred();
    const d2 = deferred();
    const queue = [d1, d2];
    render(
      <EngagementBar
        actions={[{ kind: "like", count: 12, onToggle: () => queue.shift()!.promise }]}
      />,
    );
    const btn = () => screen.getByRole("button", { name: /^(Like|Unlike)/ });
    await user.click(btn()); // request 1 -> like
    await user.click(btn()); // request 2 -> unlike
    expect(btn()).toHaveAccessibleName("Like 12");
    await act(async () => d2.resolve());
    expect(btn()).toHaveAccessibleName("Like 12");
    await act(async () => d1.resolve());
    expect(btn()).toHaveAccessibleName("Like 12");
  });

  it("an OLDER request rejecting while the newer is pending leaves the newer optimistic value showing", async () => {
    const user = userEvent.setup();
    const d1 = deferred();
    const d2 = deferred();
    const queue = [d1, d2];
    const { container } = render(
      <EngagementBar
        actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9, clearOnTap: false, onSelect: () => queue.shift()!.promise }]}
      />,
    );
    await pickKind(userEvent.setup(), container, "Love");
    expect(screen.getByRole("button", { name: "Love 10" })).toBeInTheDocument();
    await pickKind(user, container, "Laugh");
    expect(screen.getByRole("button", { name: "Laugh 10" })).toBeInTheDocument();
    await act(async () => d1.reject(new Error("older")));
    expect(screen.getByRole("button", { name: "Laugh 10" })).toBeInTheDocument();
    await act(async () => d2.resolve());
    expect(screen.getByRole("button", { name: "Laugh 10" })).toBeInTheDocument();
  });

  it("the OLDER request rejecting last leaves the newer's accepted result standing", async () => {
    const user = userEvent.setup();
    const d1 = deferred();
    const d2 = deferred();
    const queue = [d1, d2];
    const { container } = render(
      <EngagementBar
        actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9, clearOnTap: false, onSelect: () => queue.shift()!.promise }]}
      />,
    );
    await pickKind(user, container, "Love");
    await pickKind(user, container, "Laugh");
    await act(async () => d2.resolve());
    expect(screen.getByRole("button", { name: "Laugh 10" })).toBeInTheDocument();
    await act(async () => d1.reject(new Error("older")));
    expect(screen.getByRole("button", { name: "Laugh 10" })).toBeInTheDocument();
  });
});

describe("R5: controlled reaction counts follow the props", () => {
  const make = (over: Record<string, unknown> = {}, kinds = KINDS) => (
    <EngagementBar actions={[{ kind: "reaction", kinds, totalCount: 9, viewerReaction: null, ...over } as EngagementAction]} />
  );

  it("I4: new totalCount updates the trigger name", () => {
    const { rerender } = render(make());
    expect(screen.getByRole("button", { name: "React 9" })).toBeInTheDocument();
    rerender(make({ totalCount: 20 }));
    expect(screen.getByRole("button", { name: "React 20" })).toBeInTheDocument();
  });

  it("I4: new kinds[i].count updates the picker (and goes through the formatter)", async () => {
    const user = userEvent.setup();
    const { rerender } = render(make());
    await user.click(screen.getByRole("button", { name: "React 9" }));
    const group = await screen.findByRole("group", { name: "Pick a reaction" });
    expect(within(group).getByRole("button", { name: "Love 5" })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "Wow 1.5K" })).toBeInTheDocument();
    rerender(make({}, KINDS.map((k) => (k.key === "love" ? { ...k, count: 7 } : k))));
    expect(within(group).getByRole("button", { name: "Love 7" })).toBeInTheDocument();
  });

  it("I4: new viewerReaction updates the trigger", () => {
    const { rerender } = render(make());
    rerender(make({ viewerReaction: "laugh", totalCount: 10 }));
    expect(screen.getByRole("button", { name: "Laugh 10" })).toHaveAttribute("aria-pressed", "true");
  });

  it("a controlled reaction ignores reaction-changed for display but still calls onSubscribeDelta", () => {
    const { subscribe, emit } = makeSubscribe<EngagementDelta>();
    const onSubscribeDelta = vi.fn();
    render(
      <EngagementBar
        subscribe={subscribe}
        onSubscribeDelta={onSubscribeDelta}
        actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9, viewerReaction: null }]}
      />,
    );
    const delta: EngagementDelta = { kind: "reaction-changed", counts: { love: 50 }, totalCount: 99, viewerReaction: "love" };
    act(() => emit(delta));
    expect(onSubscribeDelta).toHaveBeenCalledWith(delta);
    expect(screen.getByRole("button", { name: "React 9" })).toBeInTheDocument();
  });

  it("an uncontrolled reaction applies reaction-changed", () => {
    const { subscribe, emit } = makeSubscribe<EngagementDelta>();
    const onSubscribeDelta = vi.fn();
    render(
      <EngagementBar
        subscribe={subscribe}
        onSubscribeDelta={onSubscribeDelta}
        actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9 }]}
      />,
    );
    act(() => emit({ kind: "reaction-changed", counts: { love: 50 }, totalCount: 99, viewerReaction: "love" }));
    expect(onSubscribeDelta).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Love 99" })).toBeInTheDocument();
  });

  it("R6: a rejected onSelect rolls the optimistic reaction back (controlled)", async () => {
    const user = userEvent.setup();
    const d = deferred();
    const { container } = render(
      <EngagementBar
        actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9, viewerReaction: null, onSelect: () => d.promise }]}
      />,
    );
    await pickKind(user, container, "Love");
    expect(screen.getByRole("button", { name: "Love 10" })).toBeInTheDocument();
    await act(async () => d.reject(new Error("fail")));
    expect(screen.getByRole("button", { name: "React 9" })).toBeInTheDocument();
  });
});

describe("R2 / I6: comment, share and view-count deltas", () => {
  const cases: Array<[string, string, string, EngagementAction["kind"], EngagementDelta["kind"]]> = [
    ["comment", "button", "Comment", "comment", "comment-count-changed"],
    ["share", "button", "Share", "share", "share-count-changed"],
    ["view-count", "group", "Views", "view-count", "view-count-changed"],
  ];
  for (const [label, role, base, kind, deltaKind] of cases) {
    describe(label, () => {
      const make = (count: number | null) => [{ kind, count } as EngagementAction];
      const delta = (count: number) => ({ kind: deltaKind, count }) as EngagementDelta;

      it("the delta's count shows", () => {
        const { subscribe, emit } = makeSubscribe<EngagementDelta>();
        render(<EngagementBar actions={make(5)} subscribe={subscribe} />);
        expect(screen.getByRole(role, { name: `${base} 5` })).toBeInTheDocument();
        act(() => emit(delta(8)));
        expect(screen.getByRole(role, { name: `${base} 8` })).toBeInTheDocument();
      });

      it("a re-render with a CHANGED prop count shows the prop", () => {
        const { subscribe, emit } = makeSubscribe<EngagementDelta>();
        const { rerender } = render(<EngagementBar actions={make(5)} subscribe={subscribe} />);
        act(() => emit(delta(8)));
        rerender(<EngagementBar actions={make(6)} subscribe={subscribe} />);
        expect(screen.getByRole(role, { name: `${base} 6` })).toBeInTheDocument();
      });

      it("a re-render with the SAME prop count keeps the delta value", () => {
        const { subscribe, emit } = makeSubscribe<EngagementDelta>();
        const { rerender } = render(<EngagementBar actions={make(5)} subscribe={subscribe} />);
        act(() => emit(delta(8)));
        rerender(<EngagementBar actions={make(5)} subscribe={subscribe} />);
        expect(screen.getByRole(role, { name: `${base} 8` })).toBeInTheDocument();
      });
    });
  }
});
