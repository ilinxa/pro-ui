import type { BlackboardAuthor, BlackboardMember, BlackboardNote } from "./types";

/** The mention-able team roster. */
export const BLACKBOARD_01_MEMBERS: BlackboardMember[] = [
  { id: "u-hessam", name: "Hessam" },
  { id: "u-maryam", name: "Maryam" },
  { id: "u-ali", name: "Ali" },
  { id: "u-sara", name: "Sara" },
  { id: "u-devran", name: "Devran" },
];

/** Who's writing in the demo. */
export const BLACKBOARD_01_CURRENT_USER: BlackboardAuthor = {
  id: "u-hessam",
  name: "Hessam",
  inkColor: "oklch(0.86 0.18 132)",
};

const AUTHOR: Record<string, BlackboardAuthor> = {
  "u-hessam": { id: "u-hessam", name: "Hessam", inkColor: "oklch(0.86 0.18 132)" },
  "u-maryam": { id: "u-maryam", name: "Maryam", inkColor: "oklch(0.82 0.12 230)" },
  "u-ali": { id: "u-ali", name: "Ali", inkColor: "oklch(0.84 0.14 80)" },
  "u-sara": { id: "u-sara", name: "Sara", inkColor: "oklch(0.80 0.14 18)" },
  "u-devran": { id: "u-devran", name: "Devran", inkColor: "oklch(0.96 0.01 250)" },
};

/** Seed notes (oldest → newest), fixed ISO timestamps so SSR stays deterministic. */
export const BLACKBOARD_01_NOTES: BlackboardNote[] = [
  {
    id: "n-101",
    text: "Standup moved to 10:30 from tomorrow 👋",
    author: AUTHOR["u-maryam"],
    createdAt: "2026-06-16T08:05:00.000Z",
    style: { color: "sky", width: "regular", font: "caveat" },
    pinned: true,
  },
  {
    id: "n-102",
    text: "Shipped the media-library smoke fix — green ✅",
    author: AUTHOR["u-ali"],
    createdAt: "2026-06-16T09:20:00.000Z",
    style: { color: "lime", width: "bold", font: "kalam" },
  },
  {
    id: "n-103",
    text: "@Hessam can you review the blackboard plan?",
    author: AUTHOR["u-sara"],
    createdAt: "2026-06-16T11:48:00.000Z",
    style: { color: "amber", width: "regular", font: "patrick" },
    mentions: [{ memberId: "u-hessam", display: "@Hessam", start: 0, length: 7 }],
  },
  {
    id: "n-104",
    text: "On it — pushing the GATE 2 plan now.",
    author: AUTHOR["u-hessam"],
    createdAt: "2026-06-16T12:02:00.000Z",
    style: { color: "chalk", width: "regular", font: "kalam" },
  },
  {
    id: "n-105",
    text: "Coffee machine on 3rd floor is fixed ☕",
    author: AUTHOR["u-devran"],
    createdAt: "2026-06-17T07:15:00.000Z",
    style: { color: "chalk", width: "thin", font: "shadows" },
  },
  {
    id: "n-106",
    text: "Design review @Maryam @Ali at 4pm in the slate room",
    author: AUTHOR["u-hessam"],
    createdAt: "2026-06-17T09:40:00.000Z",
    style: { color: "rose", width: "regular", font: "caveat" },
    mentions: [
      { memberId: "u-maryam", display: "@Maryam", start: 14, length: 7 },
      { memberId: "u-ali", display: "@Ali", start: 22, length: 4 },
    ],
  },
];

const OLDER_TEXTS = [
  "Don't forget to update STATUS.md",
  "Lunch & learn moved to Friday",
  "New hire starts Monday — say hi 👋",
  "Prod deploy window: Thu 2–4pm",
  "Retro action items are in the doc",
  "Anyone seen the staging creds?",
  "Great demo today 🎉",
  "Remember to file your expenses",
];
const OLDER_AUTHORS = ["u-maryam", "u-ali", "u-sara", "u-devran"];
const OLDER_COLORS = ["chalk", "sky", "amber", "lime", "rose"];
const OLDER_FONTS = ["kalam", "caveat", "patrick", "shadows"];
const OLDER_WIDTHS = ["thin", "regular", "bold"] as const;

/**
 * Deterministic synthetic older notes for the lazy-load demo. `page` (0-based) +
 * `count` produce stable ids/timestamps decreasing into the past, so repeated
 * scroll-ups paginate cleanly without randomness (SSR-safe).
 */
export function makeOlderNotes(page: number, count: number): BlackboardNote[] {
  const base = Date.parse("2026-06-16T07:00:00.000Z");
  return Array.from({ length: count }, (_, i) => {
    const n = page * count + i;
    const minutesAgo = (n + 1) * 37;
    return {
      id: `n-old-${page}-${i}`,
      text: OLDER_TEXTS[n % OLDER_TEXTS.length],
      author: AUTHOR[OLDER_AUTHORS[n % OLDER_AUTHORS.length]],
      createdAt: new Date(base - minutesAgo * 60_000).toISOString(),
      style: {
        color: OLDER_COLORS[n % OLDER_COLORS.length],
        width: OLDER_WIDTHS[n % OLDER_WIDTHS.length],
        font: OLDER_FONTS[n % OLDER_FONTS.length],
      },
    } satisfies BlackboardNote;
  });
}
