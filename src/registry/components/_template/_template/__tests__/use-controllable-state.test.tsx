import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useControllableState } from "../hooks/use-controllable-state";

type Props = {
  value?: number;
  onChange?: (n: number) => void | Promise<unknown>;
  optimistic?: boolean;
};

function Counter({ value, onChange, optimistic }: Props) {
  const [n, setN] = useControllableState({ value, defaultValue: 0, onChange, optimistic });
  return (
    <button type="button" onClick={() => setN(n + 1)}>
      {n}
    </button>
  );
}

const shown = () => screen.getByRole("button").textContent;
const click = () => act(() => screen.getByRole("button").click());

describe("useControllableState (consumer contract C5)", () => {
  it("uncontrolled: applies a change itself", () => {
    render(<Counter />);
    click();
    expect(shown()).toBe("1");
  });

  it("controlled: a prop change re-renders (the prop wins every render)", () => {
    const { rerender } = render(<Counter value={3} onChange={() => {}} />);
    expect(shown()).toBe("3");
    rerender(<Counter value={7} onChange={() => {}} />);
    expect(shown()).toBe("7");
  });

  it("controlled: an internal change calls the callback and leaves the rendered value alone", () => {
    const onChange = vi.fn();
    render(<Counter value={3} onChange={onChange} />);
    click();
    expect(onChange).toHaveBeenCalledWith(4);
    expect(shown()).toBe("3");
  });

  it("controlled + async: shows the change at once, then reconciles to the next prop", async () => {
    function Host() {
      const [v, setV] = useState(3);
      return <Counter value={v} onChange={(n) => new Promise((ok) => setTimeout(() => ok(setV(n * 10)), 5))} />;
    }
    render(<Host />);
    click();
    expect(shown()).toBe("4");
    await act(() => new Promise((r) => setTimeout(r, 20)));
    expect(shown()).toBe("40");
  });

  it("a rejected callback rolls an optimistic change back (controlled and uncontrolled)", async () => {
    const reject = () => Promise.reject(new Error("no"));
    const { unmount } = render(<Counter value={3} onChange={reject} />);
    click();
    expect(shown()).toBe("4");
    await act(async () => {});
    expect(shown()).toBe("3");
    unmount();
    render(<Counter onChange={reject} />);
    click();
    expect(shown()).toBe("1");
    await act(async () => {});
    expect(shown()).toBe("0");
  });

  it("overlapping requests: only the latest decides; a late rejection of an older one is ignored", async () => {
    // b rejects, c resolves → c
    const { unmount } = render(
      <Counter onChange={(n) => (n === 1 ? Promise.reject(new Error("b")) : Promise.resolve())} />,
    );
    click();
    click();
    expect(shown()).toBe("2");
    await act(async () => {});
    expect(shown()).toBe("2");
    unmount();
    // both reject → back to the last settled value, never to the rejected first request
    render(<Counter onChange={() => Promise.reject(new Error("no"))} />);
    click();
    click();
    await act(async () => {});
    expect(shown()).toBe("0");
  });

  it("an older request resolving after a newer one never overwrites it (out of order)", async () => {
    const resolvers: Array<() => void> = [];
    function Picker() {
      const [v, setV] = useControllableState({
        defaultValue: 0,
        onChange: () => new Promise<void>((ok) => resolvers.push(ok)),
        optimistic: false,
      });
      return (
        <>
          <output>{v}</output>
          <button type="button" onClick={() => setV(5)}>five</button>
          <button type="button" onClick={() => setV(9)}>nine</button>
        </>
      );
    }
    render(<Picker />);
    act(() => screen.getByText("five").click()); // request 1
    act(() => screen.getByText("nine").click()); // request 2
    await act(async () => resolvers[1]()); // the newer one settles first
    await act(async () => resolvers[0]()); // the older one settles late
    expect(screen.getByRole("status")).toHaveTextContent("9");
  });

  it("controlled + async: a resolved request the parent did not adopt falls back to the prop", async () => {
    render(<Counter value={3} onChange={() => Promise.resolve()} />);
    click();
    expect(shown()).toBe("4");
    await act(async () => {});
    expect(shown()).toBe("3");
  });

  it("isEqual keeps an optimistic value across parent re-renders that pass a fresh object", async () => {
    let release = () => {};
    function Box({ tick }: { tick: number }) {
      const [v, setV] = useControllableState({
        value: { n: 1 },
        defaultValue: { n: 0 },
        onChange: () => new Promise<void>((ok) => (release = ok)),
        isEqual: (a, b) => a?.n === b?.n,
      });
      return (
        <button type="button" data-tick={tick} onClick={() => setV({ n: v.n + 1 })}>
          {v.n}
        </button>
      );
    }
    const { rerender } = render(<Box tick={0} />);
    click();
    expect(shown()).toBe("2");
    rerender(<Box tick={1} />);
    expect(shown()).toBe("2");
    await act(async () => release());
    expect(shown()).toBe("1");
  });

  it("warns in development when a component switches between controlled and uncontrolled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Counter value={1} onChange={() => {}} />);
    rerender(<Counter onChange={() => {}} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("switched from controlled to uncontrolled"));
    warn.mockRestore();
  });

  it("optimistic={false}: controlled shows only the prop; uncontrolled only a settled change", async () => {
    const { unmount } = render(<Counter value={3} onChange={() => Promise.resolve()} optimistic={false} />);
    click();
    expect(shown()).toBe("3");
    unmount();
    render(<Counter onChange={() => Promise.resolve()} optimistic={false} />);
    click();
    expect(shown()).toBe("0");
    await act(async () => {});
    expect(shown()).toBe("1");
  });
});
