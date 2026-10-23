import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Template, defaultTemplateLabels } from "../index";

describe("Template — consumer contract starters", () => {
  it("names the count through labels, with the defaults", () => {
    render(<Template title="T" count={3} />);
    expect(screen.getByText(defaultTemplateLabels.itemCount(3))).toBeInTheDocument();
    expect(screen.getByText("3")).toHaveAttribute("aria-hidden", "true");
  });

  it("merges a partial labels override over the defaults", () => {
    render(<Template title="T" count={2} labels={{ itemCount: (n) => `${n} öğe` }} />);
    expect(screen.getByText("2 öğe")).toBeInTheDocument();
  });

  it("a withheld (null) count renders nothing — no number, no accessible name (C6)", () => {
    const { container } = render(<Template title="T" count={null} />);
    expect(container.textContent).toBe("T");
  });

  it("formats the count with the locale prop (C3), and an empty locale falls back to en", () => {
    render(<Template title="T" count={1200} locale="tr" />);
    expect(screen.getByText("1.200")).toBeInTheDocument();
    render(<Template title="U" count={1200} locale="" />);
    expect(screen.getByText("1,200")).toBeInTheDocument();
  });
});
