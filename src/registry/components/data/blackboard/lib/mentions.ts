import type { BlackboardMember, Mention } from "../types";

/** A `@` token currently being typed: its start offset + the query after the `@`. */
export interface ActiveMention {
  /** Index of the `@`. */
  at: number;
  /** Text between `@` and the caret. */
  query: string;
}

const MENTION_BOUNDARY = /[\s.,!?;:()[\]{}"']/;

/**
 * Given the full text and the caret position, detect whether the caret sits inside
 * an in-progress `@mention` token. Returns null if not (e.g. there's whitespace
 * between the `@` and the caret, or no `@` precedes the caret on this run).
 */
export function detectActiveMention(text: string, caret: number): ActiveMention | null {
  // Walk backwards from the caret to find a preceding "@" with no boundary char in between.
  for (let i = caret - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === "@") {
      // "@" must start the string or follow a boundary char (avoid emails like a@b).
      const prev = text[i - 1];
      if (i === 0 || MENTION_BOUNDARY.test(prev)) {
        return { at: i, query: text.slice(i + 1, caret) };
      }
      return null;
    }
    if (MENTION_BOUNDARY.test(ch)) return null;
  }
  return null;
}

/** Filter members by a (case-insensitive) name query. */
export function filterMembers(members: BlackboardMember[], query: string): BlackboardMember[] {
  const q = query.trim().toLowerCase();
  if (!q) return members.slice(0, 8);
  return members.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 8);
}

/**
 * Insert a chosen member as an `@name ` token, replacing the active `@query`.
 * Returns the new text + the caret position after the inserted token.
 */
export function insertMention(
  text: string,
  active: ActiveMention,
  member: BlackboardMember,
): { text: string; caret: number } {
  const token = `@${member.name}`;
  const before = text.slice(0, active.at);
  const after = text.slice(active.at + 1 + active.query.length);
  const insert = `${token} `;
  return { text: before + insert + after, caret: before.length + insert.length };
}

/**
 * Re-scan the final text against the roster and produce the canonical `mentions[]`
 * (offset-anchored). Longest names first so "@Anna Lee" wins over "@Anna".
 */
export function extractMentions(text: string, members: BlackboardMember[]): Mention[] {
  const byLongest = [...members].sort((a, b) => b.name.length - a.name.length);
  const out: Mention[] = [];
  const claimed: boolean[] = new Array(text.length).fill(false);

  for (const m of byLongest) {
    const needle = `@${m.name}`;
    let from = 0;
    for (;;) {
      const idx = text.indexOf(needle, from);
      if (idx === -1) break;
      const end = idx + needle.length;
      const prevOk = idx === 0 || MENTION_BOUNDARY.test(text[idx - 1]);
      const nextOk = end >= text.length || MENTION_BOUNDARY.test(text[end]);
      const free = !claimed.slice(idx, end).some(Boolean);
      if (prevOk && nextOk && free) {
        out.push({ memberId: m.id, display: needle, start: idx, length: needle.length });
        for (let k = idx; k < end; k++) claimed[k] = true;
      }
      from = idx + 1;
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Unique member ids referenced by a mention list. */
export function dedupeMemberIds(mentions: Mention[]): string[] {
  return Array.from(new Set(mentions.map((m) => m.memberId)));
}
