/**
 * JSON I/O + clipboard helpers. Pure modules (no React).
 *
 * Mirrors card-tree v0.3 patterns: pretty-printed canonical JSON, structural
 * validation distinct from full normalization (which lives in normalize.ts).
 */

import type { TaskItem } from "../types";
import { TASK_CLIPBOARD_MIME } from "../types";

export class TaskValidationError extends Error {
  readonly path: string;
  readonly expected: string;
  readonly actual: string;
  constructor(path: string, expected: string, actual: string) {
    super(`${path}: expected ${expected}, got ${actual}`);
    this.name = "TaskValidationError";
    this.path = path;
    this.expected = expected;
    this.actual = actual;
  }
}

/** Pretty-printed canonical JSON. */
export function serialize(item: TaskItem): string {
  return JSON.stringify(item, null, 2);
}

/** Cheap structural fence — throws TaskValidationError on the first miss. */
export function validate(value: unknown, path = "$"): asserts value is TaskItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TaskValidationError(path, "object", typeof value);
  }
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || v.id.length === 0) {
    throw new TaskValidationError(`${path}.id`, "non-empty string", String(v.id));
  }
  if (typeof v.name !== "string") {
    throw new TaskValidationError(`${path}.name`, "string", String(v.name));
  }
  if (typeof v.status !== "string") {
    throw new TaskValidationError(`${path}.status`, "string", String(v.status));
  }
  if (typeof v.active !== "boolean") {
    throw new TaskValidationError(`${path}.active`, "boolean", String(v.active));
  }
  if (typeof v.setAt !== "string") {
    throw new TaskValidationError(`${path}.setAt`, "ISO-8601 string", String(v.setAt));
  }
  if (v.children !== undefined) {
    if (!Array.isArray(v.children)) {
      throw new TaskValidationError(
        `${path}.children`,
        "array | undefined",
        typeof v.children,
      );
    }
    v.children.forEach((child, i) => validate(child, `${path}.children[${i}]`));
  }
}

export function parse(json: string): TaskItem {
  const obj: unknown = JSON.parse(json);
  validate(obj);
  return obj;
}

/* ───────── DnD ───────── */

/**
 * Read a TaskItem from a DnD DataTransfer synchronously. Returns null when the
 * payload isn't a valid Todo (no throw — silent no-op). Clipboard copy/paste now
 * lives in the shared `clipboard.ts` envelope; this stays for drag payloads.
 */
export function fromDataTransfer(dt: DataTransfer): TaskItem | null {
  const ourPayload = dt.getData(TASK_CLIPBOARD_MIME);
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
