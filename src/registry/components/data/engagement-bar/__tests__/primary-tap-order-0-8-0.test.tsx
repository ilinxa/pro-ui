/**
 * 0.8.0 U4: a primary tap must not open the picker whichever order the popover backend runs the
 * trigger's own toggle and the host's `onClick` in. Radix runs the host's first; this mock runs its
 * own toggle FIRST (as a Base UI-style trigger may), so only a flag set in the capture phase holds.
 */
import { createContext, useContext, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
            ctx.onOpenChange(!ctx.open); // the backend's own toggle runs first
            onClick?.(e);
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

describe("primary tap with a toggle-first trigger", () => {
  it("selects the primary kind and never opens the picker or reports it", async () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    render(<EngagementBar actions={[primary({ onSelect })]} onReactionPickerOpenChange={onOpen} />);
    fireEvent.click(screen.getAllByRole("button")[0]!);
    await Promise.resolve();
    await Promise.resolve();
    expect(onSelect).toHaveBeenCalledWith(KINDS[0]!.key);
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull();
  });

  it("picker mode still opens on a tap (the capture flag is primary-only)", () => {
    render(<EngagementBar actions={[primary({ tapAction: "picker" })]} />);
    fireEvent.click(screen.getAllByRole("button")[0]!);
    expect(screen.getByRole("group", { name: "Pick a reaction" })).toBeTruthy();
  });
});
