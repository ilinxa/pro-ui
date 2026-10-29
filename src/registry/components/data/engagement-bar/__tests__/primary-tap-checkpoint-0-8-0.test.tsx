/**
 * 0.8.0 U5 (browser): a real click runs a microtask checkpoint between React's capture and bubble
 * listeners, so a flag set in the capture phase and cleared in a microtask was already gone when the
 * trigger toggled — a primary tap opened the picker in Chromium while every jsdom test passed. This
 * mock toggles after a microtask (as that checkpoint lets it), so only a flag that lives until the
 * click has been fully dispatched holds.
 */
import { createContext, useContext, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { EngagementBar } from "../engagement-bar";
import type { EngagementAction } from "../types";
import { installDomStubs, KINDS } from "./support";

vi.mock("@/components/ui/popover", () => {
  const Ctx = createContext<{ open: boolean; onOpenChange: (o: boolean) => void }>({
    open: false,
    onOpenChange: () => {},
  });
  return {
    Popover: ({
      open,
      onOpenChange,
      children,
    }: {
      open: boolean;
      onOpenChange: (o: boolean) => void;
      children: ReactNode;
    }) => <Ctx.Provider value={{ open, onOpenChange }}>{children}</Ctx.Provider>,
    PopoverTrigger: ({ onClick, children, ...rest }: React.ComponentProps<"button">) => {
      const ctx = useContext(Ctx);
      return (
        <button
          {...rest}
          onClick={(e) => {
            onClick?.(e);
            const open = ctx.open;
            queueMicrotask(() => ctx.onOpenChange(!open)); // the toggle, after a checkpoint
          }}
        >
          {children}
        </button>
      );
    },
    PopoverContent: ({ children, ...rest }: React.ComponentProps<"div">) => {
      const ctx = useContext(Ctx);
      return ctx.open ? <div {...rest}>{children}</div> : null;
    },
  };
});

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const primary = (over: Record<string, unknown> = {}): EngagementAction =>
  ({ kind: "reaction", kinds: KINDS, totalCount: 3, tapAction: "primary", viewerReaction: null, ...over }) as EngagementAction;

describe("primary tap when the trigger toggles after a microtask checkpoint", () => {
  it("selects the primary kind and never opens the picker or reports it", async () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    render(<EngagementBar actions={[primary({ onSelect })]} onReactionPickerOpenChange={onOpen} />);
    fireEvent.click(screen.getAllByRole("button")[0]!);
    // Let the queued toggle, the state update and its effects all run.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(onSelect).toHaveBeenCalledWith(KINDS[0]!.key);
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull();
  });

  it("picker mode still opens on a tap (the capture flag is primary-only)", async () => {
    render(<EngagementBar actions={[primary({ tapAction: "picker" })]} />);
    fireEvent.click(screen.getAllByRole("button")[0]!);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole("group", { name: "Pick a reaction" })).toBeTruthy();
  });
});
