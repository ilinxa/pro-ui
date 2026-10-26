/** U4 — a failed lazy calendar chunk shows a recoverable fallback instead of crashing. */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { FilterBar } from "../filter-bar";

let attempts = 0;
vi.mock("../parts/date-range-calendar", async (importOriginal) => {
  attempts += 1;
  if (attempts === 1) throw new Error("chunk load failed");
  return await importOriginal<typeof import("../parts/date-range-calendar")>();
});

describe("calendar chunk failure", { timeout: 60000 }, () => {
  // Warm the real calendar graph (not the mocked part) so the re-import after Retry does not
  // depend on cold module-load time under a loaded test run.
  beforeAll(async () => {
    await import("@/components/ui/calendar");
  }, 60000);

  it("shows an alert with Retry; Retry re-imports and the grid renders", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <FilterBar labels={{ calendarLoadErrorText: "Takvim yuklenemedi.", calendarRetryText: "Tekrar dene" }} />,
    );
    await user.click(screen.getByRole("button", { name: "Filter by date" }));
    const alert = await screen.findByRole("alert", {}, { timeout: 10000 });
    expect(alert).toHaveTextContent("Takvim yuklenemedi.");
    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect((await screen.findAllByRole("grid", {}, { timeout: 20000 })).length).toBe(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(attempts).toBeGreaterThanOrEqual(2);
    error.mockRestore();
  });
});
