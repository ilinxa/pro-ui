import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ShareMenu } from "../parts/share-menu";
import type { EngagementLikerProfile } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

const users: EngagementLikerProfile[] = [
  { id: "1", name: "Ada Lovelace", username: "ada" },
  { id: "2", name: "Bob Ray" },
];

describe("ShareMenu 0.8.0", () => {
  it("renders header above the search", () => {
    render(<ShareMenu users={users} onShareTo={vi.fn()} header={<div data-testid="h" />} />);
    const h = screen.getByTestId("h");
    const input = screen.getByRole("textbox");
    expect(h.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("pending row: spinner, sending text, aria-disabled, press ignored", () => {
    const onShareTo = vi.fn();
    const { container } = render(
      <ShareMenu users={users} onShareTo={onShareTo} pendingIds={["1"]} />,
    );
    const row = screen.getByRole("button", { name: /Ada Lovelace.*@ada.*Sending/ });
    expect(row).toHaveAttribute("aria-disabled", "true");
    expect(row).not.toBeDisabled();
    expect(container.querySelector(".motion-safe\\:animate-spin")).not.toBeNull();
    fireEvent.click(row);
    expect(onShareTo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Bob Ray/ }));
    expect(onShareTo).toHaveBeenCalledTimes(1);
  });

  it("sent row: Sent text, aria-disabled, press ignored", () => {
    const onShareTo = vi.fn();
    render(<ShareMenu users={users} onShareTo={onShareTo} sentIds={["2"]} />);
    const row = screen.getByRole("button", { name: /Bob Ray.*Sent/ });
    expect(row).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(row);
    expect(onShareTo).not.toHaveBeenCalled();
  });

  it("status region exists at mount, is silent for ids present at mount, announces additions", () => {
    const { rerender } = render(<ShareMenu users={users} onShareTo={vi.fn()} sentIds={["2"]} />);
    const announcer = () => document.querySelector<HTMLElement>("[data-share-announcer]")!;
    expect(announcer().getAttribute("aria-live")).toBe("polite");
    expect(announcer().textContent).toBe("");
    rerender(<ShareMenu users={users} onShareTo={vi.fn()} sentIds={["2", "1"]} />);
    expect(announcer()).toHaveTextContent("Sent to Ada Lovelace");
    expect(announcer()).not.toHaveTextContent("Bob");
  });

  it("labels: overrides apply and undefined keeps defaults", () => {
    render(
      <ShareMenu
        users={users}
        onShareTo={vi.fn()}
        pendingIds={["1"]}
        sentIds={["2"]}
        labels={{ sending: "Sending now", sent: undefined }}
      />,
    );
    expect(screen.getByText("Sending now")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();
  });

  it("username is dir=ltr; size touch floors", () => {
    render(<ShareMenu users={users} onShareTo={vi.fn()} onClose={vi.fn()} size="touch" />);
    expect(screen.getByText("@ada")).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("button", { name: "Hide" }).className).toContain("min-h-11");
    expect(screen.getByRole("textbox").className).toContain("min-h-11");
    expect(screen.getByRole("button", { name: /Bob Ray/ }).className).toContain("min-h-11");
  });

  it("axe clean with states", async () => {
    const { container } = render(
      <ShareMenu users={users} onShareTo={vi.fn()} pendingIds={["1"]} sentIds={["2"]} />,
    );
    await expectNoAxeViolations(container);
  });
});
