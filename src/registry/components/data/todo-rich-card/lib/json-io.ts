/**
 * JSON I/O + clipboard helpers. Pure modules (no React).
 *
 * Mirrors rich-card v0.3 patterns: pretty-printed canonical JSON, structural
 * validation distinct from full normalization (which lives in normalize.ts).
 */

import type { TodoItem } from "../types";
import { TODO_CLIPBOARD_MIME } from "../types";

export class TodoValidationError extends Error {
  readonly path: string;
  readonly expected: string;
  readonly actual: string;
  constructor(path: string, expected: string, actual: string) {
    super(`${path}: expected ${expected}, got ${actual}`);
    this.name = "TodoValidationError";
    this.path = path;
    this.expected = expected;
    this.actual = actual;
  }
}

/** Pretty-printed canonical JSON. */
export function serialize(item: TodoItem): string {
  return JSON.stringify(item, null, 2);
}

/** Cheap structural fence — throws TodoValidationError on the first miss. */
export function validate(value: unknown, path = "$"): asserts value is TodoItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TodoValidationError(path, "object", typeof value);
  }
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || v.id.length === 0) {
    throw new TodoValidationError(`${path}.id`, "non-empty string", String(v.id));
  }
  if (typeof v.name !== "string") {
    throw new TodoValidationError(`${path}.name`, "string", String(v.name));
  }
  if (typeof v.status !== "string") {
    throw new TodoValidationError(`${path}.status`, "string", String(v.status));
  }
  if (typeof v.active !== "boolean") {
    throw new TodoValidationError(`${path}.active`, "boolean", String(v.active));
  }
  if (typeof v.setAt !== "string") {
    throw new TodoValidationError(`${path}.setAt`, "ISO-8601 string", String(v.setAt));
  }
  if (v.children !== undefined) {
    if (!Array.isArray(v.children)) {
      throw new TodoValidationError(
        `${path}.children`,
        "array | undefined",
        typeof v.children,
      );
    }
    v.children.forEach((child, i) => validate(child, `${path}.children[${i}]`));
  }
}

export function parse(json: string): TodoItem {
  const obj: unknown = JSON.parse(json);
  validate(obj);
  return obj;
}

/* ───────── clipboard ───────── */

/** Build a ClipboardItem with both our MIME and text/plain fallback. */
export function toClipboardItem(item: TodoItem): ClipboardItem {
  const payload = serialize(item);
  return new ClipboardItem({
    [TODO_CLIPBOARD_MIME]: new Blob([payload], { type: TODO_CLIPBOARD_MIME }),
    "text/plain": new Blob([payload], { type: "text/plain" }),
  });
}

/**
 * Read a TodoItem from clipboard data (clipboard read or DnD dataTransfer).
 * Returns null when the payload isn't a valid Todo (no throw — silent no-op).
 */
export async function fromClipboardItems(
  items: readonly ClipboardItem[],
): Promise<TodoItem | null> {
  for (const item of items) {
    if (item.types.includes(TODO_CLIPBOARD_MIME)) {
      const blob = await item.getType(TODO_CLIPBOARD_MIME);
      const text = await blob.text();
      try {
        return parse(text);
      } catch {
        // Malformed our-MIME payload — fall through to text/plain.
      }
    }
    if (item.types.includes("text/plain")) {
      const blob = await item.getType("text/plain");
      const text = await blob.text();
      try {
        return parse(text);
      } catch {
        // Not JSON, or not a Todo.
      }
    }
  }
  return null;
}

/** DnD variant — reads from DataTransfer synchronously. */
export function fromDataTransfer(dt: DataTransfer): TodoItem | null {
  const ourPayload = dt.getData(TODO_CLIPBOARD_MIME);
  if (ourPayload) {
    try {
      return parse(ourPayload);
    } catch {
      // fall through
    }
  }
  const text = dt.getData("text/plain");
  if (text) {
    try {
      return parse(text);
    } catch {
      // not a Todo
    }
  }
  return null;
}

/** Programmatic copy: writes ClipboardItem to the system clipboard. */
export async function copyToClipboard(item: TodoItem): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Clipboard API not available");
  }
  await navigator.clipboard.write([toClipboardItem(item)]);
}

/** Programmatic paste: reads from the system clipboard and returns a TodoItem. */
export async function readFromClipboard(): Promise<TodoItem | null> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.read) {
    return null;
  }
  try {
    const items = await navigator.clipboard.read();
    return await fromClipboardItems(items);
  } catch {
    return null;
  }
}
