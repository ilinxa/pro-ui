/**
 * Cross-surface task clipboard (v0.2.0). A small, framework-free envelope so any
 * task-family surface (calendar / gantt / kanban / tree / rich-card) can copy &
 * paste `TodoItem`s through the OS clipboard — they all speak the same canonical
 * shape, so a copy here pastes there and vice-versa.
 *
 * The payload rides in `text/plain` (universally portable; custom MIME types are
 * unreliable across browsers/apps). Foreign clipboard text parses to `null` so a
 * normal paste falls through untouched. Calendar is the first adopter; the intent
 * is to hoist this verbatim into todo-rich-card (the shared vocabulary every task
 * surface already imports) and wire the others.
 *
 * Pure + framework-free (Vitest-ready): `serialize`/`parse`/`reassignTaskIds` are
 * deterministic given their inputs; the two `*Event` adapters are the only DOM
 * touch-points and are called from client clipboard handlers.
 */

import type { TodoItem } from "../types";

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

/** Fresh id (crypto-guarded fallback) — mirrors `use-calendar-edit`'s `freshId`. */
function freshId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cal-${crypto.randomUUID()}`;
  }
  return `cal-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Deep-clone a `TodoItem` subtree with fresh ids so a paste can never collide
 * with the source (or with an item pasted twice). Local mirror of
 * `todo-rich-card/lib/normalize.ts#reassignIds` — that one isn't barrel-exported,
 * and registry rules forbid reaching past the barrel.
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

/** Parse a clipboard text payload back to tasks; `null` if it isn't our envelope. */
export function parseTasks(text: string | null | undefined): TodoItem[] | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as Partial<TaskClipboardEnvelope>;
    if (
      parsed &&
      parsed.kind === TASK_CLIPBOARD_KIND &&
      Array.isArray(parsed.items) &&
      parsed.items.length > 0
    ) {
      return parsed.items as TodoItem[];
    }
  } catch {
    // Not JSON / not ours — let the native paste proceed.
  }
  return null;
}

/** Write tasks onto a clipboard event (the `copy`/`cut` handlers). */
export function writeTasksToClipboardEvent(
  e: ClipboardEvent,
  items: TodoItem[],
  source?: string,
): void {
  e.clipboardData?.setData("text/plain", serializeTasks(items, source));
}

/** Read tasks from a clipboard event (the `paste` handler); `null` if foreign. */
export function readTasksFromClipboardEvent(
  e: ClipboardEvent,
): TodoItem[] | null {
  return parseTasks(e.clipboardData?.getData("text/plain"));
}
