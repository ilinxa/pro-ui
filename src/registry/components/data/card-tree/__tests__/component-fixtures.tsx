/**
 * Shared custom-key fixtures for the card-tree COMPONENT suite (jsdom +
 * Testing Library). Deliberately NOT a `*.test.tsx` file — Vitest's
 * `components` project only includes `*.test.tsx`, so this module is
 * import-only and never collected as its own test file (mirrors
 * `./fixtures.ts`'s note for the `lib` project).
 *
 * A separate file from `./fixtures.ts` per the task's scope rules (a
 * concurrent process may be reading that file), and because these fixtures
 * are React components — `.tsx`, not `.ts` — with instrumentation hooks the
 * lib-tier fixtures have no reason to carry.
 */
import type { ReactNode } from "react";
import type { CustomKeyContext, CustomPredefinedKey } from "../types";

/* ───────── object-valued key: exercises CustomKeyContext ───────── */

export type MetricValue = { value: number; unit: string };

export function makeMetricKey(opts?: {
  onRender?: (value: unknown, ctx: CustomKeyContext) => void;
}): CustomPredefinedKey {
  return {
    key: "metric",
    description: "Metric",
    defaultValue: () => ({ value: 0, unit: "" }) as MetricValue,
    validate: (v) =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as Record<string, unknown>).value === "number"
        ? { ok: true }
        : { ok: false, errors: [{ code: "shape", message: "bad metric" }] },
    render: (value, ctx) => {
      opts?.onRender?.(value, ctx);
      const v = value as MetricValue;
      return (
        <div
          data-testid="metric-render"
          data-card-id={ctx.cardId}
          data-level={String(ctx.level)}
          data-editing={String(ctx.isEditing)}
        >
          {v.value} {v.unit}
        </div>
      );
    },
  };
}

/* ───────── array-valued key: render() must iterate every item itself ─────────
 * (the parser hands the WHOLE array to render() as a single `value` — see
 * lib/parse.ts's "custom" branch, which pushes `{ key, custom: true, value }`
 * verbatim; iterating is the host's job, not card-tree's.) */

export type BodyBlock = { text: string };

export function makeBodyKey(opts?: {
  onRender?: (value: unknown, ctx: CustomKeyContext) => void;
}): CustomPredefinedKey {
  return {
    key: "body",
    description: "Body",
    defaultValue: () => [] as BodyBlock[],
    validate: (v) => ({ ok: Array.isArray(v) }),
    render: (value, ctx) => {
      opts?.onRender?.(value, ctx);
      const items = (value as BodyBlock[] | undefined) ?? [];
      return (
        <ul data-testid="body-render">
          {items.map((item, i) => (
            <li key={i} data-testid="body-item">
              {item.text}
            </li>
          ))}
        </ul>
      );
    },
  };
}

/* ───────── throwing host render() — only HostRenderBoundary catches this ─────────
 * `registration.render(...)` is called inside a try/catch at the call site
 * (parts/predefined-custom.tsx PredefinedCustom), which only catches a
 * SYNCHRONOUS throw from calling render() itself. Returning an element whose
 * OWN render throws is a different failure: the throw happens later, inside
 * React's render pass, past that try/catch — only the HostRenderBoundary
 * class component (componentDidCatch) catches it. */

function ThrowingBlock(): ReactNode {
  throw new Error("host render() exploded during React's render pass");
}

export function makeThrowingRenderKey(): CustomPredefinedKey {
  return {
    key: "boom",
    description: "Boom",
    defaultValue: () => ({ armed: true }),
    validate: () => ({ ok: true }),
    render: () => <ThrowingBlock />,
  };
}

/* ───────── throwing host icon — predefined-add-menu.tsx wraps `reg.icon`
 * in the same HostRenderBoundary; this proves that wrapping actually works. */

function ThrowingIcon(): ReactNode {
  throw new Error("host icon exploded during React's render pass");
}

export function makeThrowingIconKey(): CustomPredefinedKey {
  return {
    key: "flagged",
    description: "Flagged",
    icon: <ThrowingIcon />,
    defaultValue: () => ({ armed: true }),
    validate: () => ({ ok: true }),
    render: (value) => (
      <div data-testid="flagged-render">{JSON.stringify(value)}</div>
    ),
  };
}

/* ───────── throwing defaultValue() — predefined-add-menu.tsx's
 * `defaultCustomEntry` try/catches this and degrades to `null` rather than
 * blocking the add. `validate` accepts anything (including the degraded
 * `null`) so the add still commits and the degrade path actually renders. */

export function makeThrowingDefaultValueKey(): CustomPredefinedKey {
  return {
    key: "brittle",
    description: "Brittle",
    defaultValue: () => {
      throw new Error("host defaultValue() exploded");
    },
    validate: () => ({ ok: true }),
    render: (value) => (
      <div data-testid="brittle-render">{JSON.stringify(value)}</div>
    ),
  };
}

/* ───────── validate() that always rejects — the add is silently refused,
 * never committed, and the tree keeps rendering normally. */

export function makeRejectingKey(): CustomPredefinedKey {
  return {
    key: "strict",
    description: "Strict",
    defaultValue: () => ({ note: "auto-added" }),
    validate: () => ({
      ok: false,
      errors: [{ code: "shape", message: "always rejects" }],
    }),
    render: (value) => (
      <div data-testid="strict-render">{JSON.stringify(value)}</div>
    ),
  };
}

/* ───────── no `edit` registered — forces the JSON-textarea fallback editor
 * (parts/predefined-custom.tsx's CustomJsonFallbackEdit). */

export function makeNoEditKey(): CustomPredefinedKey {
  return {
    key: "freeform",
    description: "Freeform",
    defaultValue: () => ({ note: "hello" }),
    validate: (v) => ({ ok: typeof v === "object" && v !== null }),
    render: (value) => (
      <div data-testid="freeform-render">{JSON.stringify(value)}</div>
    ),
    // `edit` intentionally omitted.
  };
}
