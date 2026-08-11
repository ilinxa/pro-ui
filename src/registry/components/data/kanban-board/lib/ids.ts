// Non-authoritative client-side draft ids — stable only within a session.
// The consumer/server remains the source of truth for persistent ids.
let counter = 0;

function rand(): string {
  // Prefer crypto for collision resistance; fall back for older runtimes.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 8);
}

export function newItemId(): string {
  counter += 1;
  return `item-${rand()}-${counter.toString(36)}`;
}

export function newColumnId(): string {
  counter += 1;
  return `col-${rand()}-${counter.toString(36)}`;
}
