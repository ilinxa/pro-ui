// Safe JSON parse — does NOT throw. Returns the parsed value on success or
// `undefined` on any error (with a dev-only `console.warn`). Used by the
// drop / paste pipelines so an invalid payload aborts cleanly.

export function parseJsonSafe(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[flow-canvas-01] could not parse JSON payload:", err);
    }
    return undefined;
  }
}
