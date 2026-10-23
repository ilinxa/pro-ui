/**
 * B6 — `item.updatedAt` is documented-then-unrendered; it is now self-disclosing:
 * exactly one dev warning when passed, none when absent.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NewsCard } from "../news-card";
import type { NewsCardItem } from "../types";

const BASE: NewsCardItem = {
  id: "n1",
  title: "Headline",
  image: "https://example.test/i.jpg",
  excerpt: "Body",
  date: "2026-10-01T10:00:00Z",
};

afterEach(() => vi.restoreAllMocks());

describe("NewsCard updatedAt disclosure", () => {
  it("emits exactly one dev warning when updatedAt is passed (even across re-renders)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const item = { ...BASE, updatedAt: "2026-10-02T10:00:00Z" };
    const { rerender } = render(<NewsCard item={item} />);
    rerender(<NewsCard item={{ ...item }} />);

    const hits = warn.mock.calls.filter((c) => String(c[0]).includes("updatedAt"));
    expect(hits).toHaveLength(1);
    expect(String(hits[0][0])).toContain("not rendered yet");
  });

  it("stays silent when updatedAt is absent", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<NewsCard item={BASE} />);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("updatedAt"))).toHaveLength(0);
  });
});
