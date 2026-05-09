// Demo fixtures — exercise the variant matrix + edge cases.
// Numbers are illustrative; consumers always supply their own.

export const STAT_CARD_DUMMY_REVENUE = {
  value: 12431,
  label: "Revenue this month",
  trend: [8200, 8800, 9100, 10200, 10900, 11500, 12100, 12431],
  // Default delta semantics — up is good (revenue ↑ green).
  delta: { value: 0.124 },
};

export const STAT_CARD_DUMMY_ERROR_RATE = {
  value: 0.42,
  label: "Error rate (last 24h)",
  trend: [0.31, 0.34, 0.36, 0.39, 0.41, 0.42, 0.42],
  // betterIsHigher: false — up is bad (red on positive delta).
  delta: { value: 0.08, betterIsHigher: false },
};

export const STAT_CARD_DUMMY_ACTIVE_USERS = {
  value: 1234,
  label: "Active users",
};

export const STAT_CARD_DUMMY_LATENCY = {
  value: 42.7,
  label: "Average response time",
  // Latency went DOWN by 8% — good (green) when betterIsHigher=false.
  delta: { value: -0.08, betterIsHigher: false },
};

export const STAT_CARD_DUMMY_SIGNUPS = {
  value: 42138,
  label: "New signups this week",
  // Absolute count delta (not a percentage) — override the format.
  delta: {
    value: 1240,
    format: (v: number) =>
      v.toLocaleString(undefined, { signDisplay: "exceptZero" }),
  },
  trend: [38000, 38800, 39400, 40200, 41100, 41800, 42138],
};

export const STAT_CARD_DUMMY_UPTIME = {
  value: 0.987,
  label: "Uptime (last 30 days)",
  trend: [0.992, 0.991, 0.987, 0.989, 0.987, 0.987, 0.987],
  delta: { value: -0.005, betterIsHigher: true },
};
