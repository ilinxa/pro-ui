import type { TodoItem } from "../../todo-rich-card/types";

/**
 * Cross-procomp MIME — identical to todo-rich-card's TODO_CLIPBOARD_MIME so
 * payloads round-trip between tree rows, rich-cards, and the clipboard.
 */
export const TODO_TREE_MIME = "application/x-ilinxa-todo+json" as const;

export function serializeForDataTransfer(item: TodoItem): string {
  return JSON.stringify(item);
}

/**
 * Parse a payload off a DataTransfer object. Returns null when the payload is
 * missing, malformed, or doesn't look like a TodoItem. Callers decide whether
 * to fall back to text/plain (which carries the same JSON body in our setter).
 */
export function parseFromDataTransfer(dt: DataTransfer): TodoItem | null {
  const raw =
    dt.getData(TODO_TREE_MIME) || dt.getData("text/plain") || "";
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isTodoItemShape(parsed)) return null;
    return parsed as TodoItem;
  } catch {
    return null;
  }
}

function isTodoItemShape(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.status === "string" &&
    typeof v.active === "boolean" &&
    typeof v.setAt === "string"
  );
}
