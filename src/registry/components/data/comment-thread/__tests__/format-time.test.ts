/**
 * Relative time (C2/C3): the English output is frozen (post-card imports `defaultRelativeTime`),
 * every other locale goes through Intl, and a fixed time zone fixes the absolute date.
 */
import { describe, expect, it } from "vitest";
import {
  createRelativeTimeFormatter,
  defaultRelativeTime,
  toDate,
} from "../lib/format-time";

const NOW = new Date("2026-06-01T12:00:00");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("defaultRelativeTime (English, frozen)", () => {
  it.each([
    [10 * SEC, "Just now"],
    [59 * SEC, "Just now"],
    [5 * MIN, "5m"],
    [59 * MIN, "59m"],
    [2 * HOUR, "2h"],
    [23 * HOUR, "23h"],
    [3 * DAY, "3d"],
    [6 * DAY, "6d"],
    [14 * DAY, "2w"],
    [34 * DAY, "4w"],
  ])("%i ms ago -> %s", (ms, expected) => {
    expect(defaultRelativeTime(ago(ms), NOW)).toBe(expected);
  });

  it("beyond five weeks: month and day, with the year only when it differs", () => {
    expect(defaultRelativeTime(new Date("2026-01-15T10:00:00"), NOW)).toBe("January 15");
    expect(defaultRelativeTime(new Date("2025-10-01T10:00:00"), NOW)).toBe("October 1, 2025");
  });

  it("toDate coerces strings and numbers and passes a Date through", () => {
    const d = new Date(0);
    expect(toDate(d)).toBe(d);
    expect(toDate(0).getTime()).toBe(0);
    expect(toDate("1970-01-01T00:00:00Z").getTime()).toBe(0);
  });
});

describe("createRelativeTimeFormatter", () => {
  it('"en" without a time zone is exactly the English output', () => {
    const format = createRelativeTimeFormatter("en");
    for (const ms of [SEC, 5 * MIN, 2 * HOUR, 3 * DAY, 14 * DAY, 60 * DAY, 400 * DAY]) {
      expect(format(ago(ms), NOW)).toBe(defaultRelativeTime(ago(ms), NOW));
    }
  });

  it("defaults to English", () => {
    expect(createRelativeTimeFormatter()(ago(5 * MIN), NOW)).toBe("5m");
  });

  it("another locale uses Intl.RelativeTimeFormat (narrow, numeric auto)", () => {
    const tr = createRelativeTimeFormatter("tr");
    expect(tr(ago(10 * SEC), NOW)).toBe("şimdi");
    expect(tr(ago(5 * MIN), NOW)).toBe("5 dk. önce");
    expect(tr(ago(2 * HOUR), NOW)).toBe("2 sa. önce");
    expect(tr(ago(DAY), NOW)).toBe("dün");
    expect(tr(ago(14 * DAY), NOW)).toBe("2 hf. önce");
    const ar = createRelativeTimeFormatter("ar");
    expect(ar(ago(5 * MIN), NOW)).toContain("دقائق");
  });

  it("beyond five weeks it prints a long date in the locale, with the year only when it differs", () => {
    const tr = createRelativeTimeFormatter("tr");
    expect(tr(new Date("2026-01-15T10:00:00"), NOW)).toBe("15 Ocak");
    expect(tr(new Date("2025-10-01T10:00:00"), NOW)).toBe("1 Ekim 2025");
  });

  it("a time zone fixes the absolute date (and 'en' with a zone still goes through Intl)", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    const date = new Date("2026-03-01T00:30:00Z");
    expect(createRelativeTimeFormatter("en", "America/Los_Angeles")(date, now)).toBe("February 28");
    expect(createRelativeTimeFormatter("en", "UTC")(date, now)).toBe("March 1");
  });

  it("falls back instead of throwing on a bad locale or time zone", () => {
    expect(() => createRelativeTimeFormatter("not a locale!!")(ago(5 * MIN), NOW)).not.toThrow();
    expect(() => createRelativeTimeFormatter("en", "Mars/Olympus")(ago(40 * DAY), NOW)).not.toThrow();
  });

  it("a future date reads as 'in …' (a poll's closing time), in English too", () => {
    expect(createRelativeTimeFormatter("tr")(new Date(NOW.getTime() + HOUR), NOW)).toBe("1 sa. sonra");
    expect(createRelativeTimeFormatter("en")(new Date(NOW.getTime() + 3 * 24 * HOUR), NOW)).toBe(
      "in 3d",
    );
    // under a minute ahead is still "now"
    expect(createRelativeTimeFormatter("en")(new Date(NOW.getTime() + 30_000), NOW)).toBe("Just now");
  });
});
