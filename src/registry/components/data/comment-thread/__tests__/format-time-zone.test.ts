/** `timeZone` alone never changes the English relative text — it only moves absolute dates. */
import { describe, expect, it } from "vitest";
import { createRelativeTimeFormatter, defaultRelativeTime } from "../lib/format-time";

const NOW = new Date("2026-03-10T12:00:00Z");
const MIN = 60_000;
const DAY = 24 * 60 * MIN;

describe('createRelativeTimeFormatter("en", timeZone)', () => {
  const utc = createRelativeTimeFormatter("en", "UTC");

  it("keeps the exact English relative output", () => {
    for (const ms of [10_000, 5 * MIN, 2 * 60 * MIN, 3 * DAY, 14 * DAY]) {
      const date = new Date(NOW.getTime() - ms);
      expect(utc(date, NOW)).toBe(defaultRelativeTime(date, NOW));
    }
    expect(utc(new Date(NOW.getTime() - 5 * MIN), NOW)).toBe("5m");
  });

  it("formats an absolute date in the zone", () => {
    const auckland = createRelativeTimeFormatter("en", "Pacific/Auckland");
    // 2025-12-31T20:00Z is January 1, 2026 in Auckland (UTC+13) — same year as NOW there.
    expect(auckland(new Date("2025-12-31T20:00:00Z"), NOW)).toBe("January 1");
    expect(utc(new Date("2025-12-31T20:00:00Z"), NOW)).toBe("December 31, 2025");
  });

  it("a future date still reads 'in …'", () => {
    expect(utc(new Date(NOW.getTime() + 3 * DAY), NOW)).toBe("in 3d");
  });
});
