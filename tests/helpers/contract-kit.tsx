import { cleanup, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations, renderWithContext } from "./render";

type Props = Record<string, unknown>;
type Screen = typeof screen;

/**
 * A check that does not apply to this component (no strings, no controlled data, nothing
 * focusable), with the reason. It registers a skipped test named with the reason, so the
 * exemption shows in every run instead of being faked with an empty assertion.
 */
export interface NotApplicable {
  notApplicable: string;
}

export interface ContractSpec {
  /** The component, with `props` merged over whatever defaults the spec chooses. */
  render: (props?: Props) => ReactElement;
  /** Per-check environment (mocks). Return a restore function. */
  setup?: () => () => void;
  /** Smoke assertion for a default render. */
  renders: (s: Screen) => void;
  /** Labels override: props carrying a partial `labels`, and how to see it took effect. */
  labels: { props: Props; expect: (s: Screen) => void } | NotApplicable;
  /**
   * Controlled data: `next` must re-render (the prop wins on every render). With `request`,
   * an interaction asks for a change: the `callback` prop is called and the rendered value
   * stays the prop's.
   */
  controlled:
    | {
        initial: Props;
        next: Props;
        expectInitial: (s: Screen) => void;
        expectNext: (s: Screen) => void;
        callback: string;
        request?: (user: UserEvent, s: Screen) => Promise<void>;
      }
    | NotApplicable;
  /**
   * RTL render inside `<div dir="rtl" lang="ar">`: what must be true in RTL (mirrored order,
   * logical alignment, an arrow that points the other way …) — plus axe. Required: an RTL
   * check that asserts nothing only proves the component did not crash.
   */
  rtl: { props?: Props; expect: (s: Screen, root: HTMLElement) => void };
  /** A keyboard path: drive it with `user.keyboard` / `user.tab`, then assert. */
  keyboard: { props?: Props; run: (user: UserEvent, s: Screen) => Promise<void>; expect: (s: Screen) => void } | NotApplicable;
  /** Extra states to run axe over (the default render is always checked). */
  axeStates?: Props[];
}

export interface ContractCheck {
  name: string;
  run: () => Promise<void>;
  /** Set when the check does not apply: the reason. `run` then does nothing. */
  skip?: string;
}

function isNotApplicable(value: object): value is NotApplicable {
  if (!("notApplicable" in value)) return false;
  const reason = (value as NotApplicable).notApplicable;
  if (typeof reason !== "string" || !reason.trim()) {
    throw new Error("contract kit: `notApplicable` needs a non-empty reason");
  }
  return true;
}

const notApplicableCheck = (name: string, reason: string): ContractCheck => ({
  name: `${name} — not applicable: ${reason}`,
  run: async () => {},
  skip: reason,
});

/**
 * The six consumer-contract checks (C11) for one component, as plain async functions:
 * render, labels override, controlled re-render (+ a requested change), RTL render with axe,
 * a keyboard path, axe. Each runs its own setup / restore and cleans up its render, so a
 * check can also be called directly (tests/helpers.test.tsx proves a broken component fails).
 */
export function contractChecks(spec: ContractSpec): ContractCheck[] {
  const guarded = (body: () => Promise<void> | void) => async () => {
    const restore = spec.setup?.();
    try {
      await body();
    } finally {
      cleanup();
      restore?.();
    }
  };
  const { labels, controlled, keyboard } = spec;
  const checks: ContractCheck[] = [
    {
      name: "renders",
      run: guarded(() => {
        render(spec.render());
        spec.renders(screen);
      }),
    },
    isNotApplicable(labels)
      ? notApplicableCheck("applies a labels override", labels.notApplicable)
      : {
          name: "applies a labels override",
          run: guarded(() => {
            render(spec.render(labels.props));
            labels.expect(screen);
          }),
        },
  ];
  if (isNotApplicable(controlled)) {
    checks.push(notApplicableCheck("re-renders when the controlled prop changes", controlled.notApplicable));
  } else {
    checks.push({
      name: "re-renders when the controlled prop changes",
      run: guarded(() => {
        const onChange = vi.fn();
        const { rerender } = render(spec.render({ ...controlled.initial, [controlled.callback]: onChange }));
        controlled.expectInitial(screen);
        rerender(spec.render({ ...controlled.next, [controlled.callback]: onChange }));
        controlled.expectNext(screen);
      }),
    });
    if (controlled.request) {
      const request = controlled.request;
      checks.push({
        name: "reports a requested change and keeps rendering the prop",
        run: guarded(async () => {
          const onChange = vi.fn();
          const user = userEvent.setup();
          render(spec.render({ ...controlled.initial, [controlled.callback]: onChange }));
          await request(user, screen);
          expect(onChange).toHaveBeenCalled();
          controlled.expectInitial(screen);
        }),
      });
    }
  }
  checks.push(
    {
      name: "renders right-to-left without axe violations",
      run: guarded(async () => {
        const { getByTestId } = renderWithContext(spec.render(spec.rtl.props), { dir: "rtl", locale: "ar" });
        const root = getByTestId("context-root");
        spec.rtl.expect(screen, root);
        await expectNoAxeViolations(root);
      }),
    },
    isNotApplicable(keyboard)
      ? notApplicableCheck("supports the keyboard path", keyboard.notApplicable)
      : {
          name: "supports the keyboard path",
          run: guarded(async () => {
            const user = userEvent.setup();
            render(spec.render(keyboard.props));
            await keyboard.run(user, screen);
            keyboard.expect(screen);
          }),
        },
    {
      name: "has no axe violations",
      run: guarded(async () => {
        for (const props of [undefined, ...(spec.axeStates ?? [])]) {
          const { container, unmount } = render(spec.render(props));
          await expectNoAxeViolations(container);
          unmount();
        }
      }),
    },
  );
  return checks;
}

/**
 * Register the six checks as a `describe` block. Per-bug regression tests stay in the
 * component's own test files.
 *
 * Reference use: `src/registry/components/data/expandable-text/__tests__/contract.test.tsx`.
 */
export function describeContract(name: string, spec: ContractSpec): void {
  describe(`${name} — consumer contract (C11)`, () => {
    for (const check of contractChecks(spec)) {
      if (check.skip) it.skip(check.name, check.run);
      else it(check.name, check.run);
    }
  });
}
