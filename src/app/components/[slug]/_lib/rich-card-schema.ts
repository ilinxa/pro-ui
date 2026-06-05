import type { RichCardJsonNode } from "@/registry/components/data/rich-card";

/**
 * A `RichCardJsonNode` is an open JSON object — scalar keys are fields, nested
 * objects are subcards, `__rcmeta` holds metadata. The only hard rule is that
 * the root is an object (not an array or scalar), so validation is intentionally
 * light; the original parsed JSON is returned at full fidelity.
 */
export type ValidateRichCardResult =
  | { ok: true; value: RichCardJsonNode }
  | { ok: false; error: string };

export function validateRichCardNode(text: string): ValidateRichCardResult {
  if (!text.trim())
    return { ok: false, error: "Write a RichCardJsonNode to begin." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Invalid JSON — ${(e as Error).message}` };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      error: "The root must be a JSON object (a card node), not an array or scalar.",
    };
  }
  return { ok: true, value: parsed as RichCardJsonNode };
}

/** Pre-loaded starter — fields of every scalar type, `__rcmeta`, a `list`
 *  predefined key, and a nested subcard with a `quote`. */
export const STARTER_RICH_CARD = `{
  "__rcid": "project-apollo",
  "__rcmeta": { "owner": "Ada Lovelace", "created": "2026-06-05" },
  "title": "Project Apollo",
  "status": "in-progress",
  "budget": 50000,
  "public": true,
  "shipped_at": null,
  "list": ["design", "build", "launch"],
  "Specs": {
    "__rcid": "specs",
    "deadline": "2026-09-01T09:00:00Z",
    "priority": "high",
    "quote": "Ship it when it's right, not when it's late."
  },
  "Team": {
    "__rcid": "team",
    "lead": "Grace Hopper",
    "size": 6,
    "remote": true
  }
}
`;
