/**
 * Unified cross-surface task clipboard (the canonical family module). Every
 * task-family surface — todo-rich-card / todo-tree / gantt-timeline / calendar —
 * copies & pastes `TodoItem`s through the OS clipboard using ONE envelope, so a
 * copy on any surface pastes on any other.
 *
 * Wire format — a versioned envelope:
 *   { kind: "ilinxa/task", version, source?, items: TodoItem[] }
 *
 * Transports:
 *   - `text/plain` carries the envelope (universally portable; the guaranteed path).
 *   - The custom MIME `application/x-ilinxa-todo+json` also carries the envelope on
 *     the async `navigator.clipboard.write` path (typed fast-path).
 * Read is omnivorous: it accepts the envelope from either transport AND a legacy
 * bare `TodoItem` (the pre-unify rich-card payload), wrapping it as `items:[item]`.
 * Foreign clipboard text parses to `null` so a normal paste falls through.
 *
 * Pure + framework-free (Vitest-ready): `serialize`/`parse`/`reassignTaskIds` are
 * deterministic; the event + async adapters are the only DOM touch-points and are
 * called from client clipboard handlers.
 */

import type { TodoItem } from "../types";
import { TODO_CLIPBOARD_MIME } from "../types";

/** Envelope sentinel — a foreign payload (plain text, other app's JSON) lacks it. */
export const TASK_CLIPBOARD_KIND = "ilinxa/task";
export const TASK_CLIPBOARD_VERSION = 1;

export interface TaskClipboardEnvelope {
  kind: typeof TASK_CLIPBOARD_KIND;
  version: number;
  /** Provenance hint (e.g. "calendar-01"); informational only. */
  source?: string;
  items: TodoItem[];
}

/** Fresh id (crypto-guarded fallback). Neutral prefix — this module is shared. */
function freshId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `task-${crypto.randomUUID()}`;
  }
  return `task-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Deep-clone a `TodoItem` subtree with fresh ids so a paste can never collide
 * with the source (or with an item pasted twice). Canonical home for the family —
 * supersedes calendar's local mirror and `normalize.ts#reassignIds` (which isn't
 * barrel-exported).
 */
export function reassignTaskIds(item: TodoItem): TodoItem {
  return {
    ...item,
    id: freshId(),
    children: item.children?.map(reassignTaskIds),
  };
}

/** Serialize tasks to the clipboard text payload (JSON envelope). */
export function serializeTasks(items: TodoItem[], source?: string): string {
  const envelope: TaskClipboardEnvelope = {
    kind: TASK_CLIPBOARD_KIND,
    version: TASK_CLIPBOARD_VERSION,
    source,
    items,
  };
  return JSON.stringify(envelope);
}

/**
 * Structural fence for the legacy bare-item back-compat branch. Matches the
 * required `TodoItem` core (id / name / status / active / setAt) so a foreign
 * `{id, name}` JSON can't false-positive as a task and get pasted as junk.
 */
function looksLikeTodoItem(v: unknown): v is TodoItem {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.name === "string" &&
    typeof o.status === "string" &&
    typeof o.active === "boolean" &&
    typeof o.setAt === "string"
  );
}

/**
 * Parse a clipboard text payload back to tasks; `null` if it isn't ours. Accepts
 * the envelope OR a legacy bare `TodoItem` (pre-unify rich-card copy) → `[item]`.
 */
export function parseTasks(text: string | null | undefined): TodoItem[] | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as Partial<TaskClipboardEnvelope>).kind === TASK_CLIPBOARD_KIND &&
      Array.isArray((parsed as TaskClipboardEnvelope).items) &&
      (parsed as TaskClipboardEnvelope).items.length > 0
    ) {
      return (parsed as TaskClipboardEnvelope).items;
    }
    // Back-compat: a legacy bare TodoItem (pre-unify rich-card) → wrap as one.
    if (looksLikeTodoItem(parsed)) return [parsed];
  } catch {
    // Not JSON / not ours — let the native paste proceed.
  }
  return null;
}

/* ───────── ClipboardEvent adapters (copy / cut / paste handlers) ───────── */

/**
 * Write tasks onto a `copy`/`cut` ClipboardEvent. text/plain only — the
 * guaranteed path on synthetic events (custom MIME types are unreliable here).
 */
export function writeTasksToClipboardEvent(
  e: ClipboardEvent,
  items: TodoItem[],
  source?: string,
): void {
  e.clipboardData?.setData("text/plain", serializeTasks(items, source));
}

/** Read tasks from a `paste` ClipboardEvent; `null` if foreign. */
export function readTasksFromClipboardEvent(
  e: ClipboardEvent,
): TodoItem[] | null {
  const dt = e.clipboardData;
  if (!dt) return null;
  return parseTasks(dt.getData(TODO_CLIPBOARD_MIME) || dt.getData("text/plain"));
}

/* ───────── async navigator.clipboard variants (handle / keyboard) ───────── */

/**
 * Programmatic copy: writes the envelope to the OS clipboard via the typed
 * ClipboardItem (custom MIME + text/plain), falling back to `writeText`.
 */
export async function copyTasksToClipboard(
  items: TodoItem[],
  source?: string,
): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    throw new Error("Clipboard API not available");
  }
  const payload = serializeTasks(items, source);
  if (navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [TODO_CLIPBOARD_MIME]: new Blob([payload], { type: TODO_CLIPBOARD_MIME }),
          "text/plain": new Blob([payload], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      // Typed write blocked — fall through to text/plain.
    }
  }
  if (navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(payload);
    return;
  }
  throw new Error("Clipboard API not available");
}

/**
 * Programmatic paste: reads the OS clipboard (typed MIME first, then text/plain),
 * returning the tasks or `null`. Omnivorous via `parseTasks`.
 */
export async function readTasksFromClipboard(): Promise<TodoItem[] | null> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return null;
  if (navigator.clipboard.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        if (it.types.includes(TODO_CLIPBOARD_MIME)) {
          const text = await (await it.getType(TODO_CLIPBOARD_MIME)).text();
          const parsed = parseTasks(text);
          if (parsed) return parsed;
        }
        if (it.types.includes("text/plain")) {
          const text = await (await it.getType("text/plain")).text();
          const parsed = parseTasks(text);
          if (parsed) return parsed;
        }
      }
      return null;
    } catch {
      // Typed read blocked — fall through to readText.
    }
  }
  if (navigator.clipboard.readText) {
    try {
      return parseTasks(await navigator.clipboard.readText());
    } catch {
      return null;
    }
  }
  return null;
}
