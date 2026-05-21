import type { ReactNode } from "react";
import type {
  FieldDefinition,
  FieldRenderer,
  FieldRendererArgs,
} from "../types";

/**
 * v0.1.7 — narrowed argument shape passed to the typed factory's `impl`
 * callback. Inherits all `FieldRendererArgs` keys except `value` (narrowed
 * to `TValue`) and `field` (narrowed so `field.config[k]` reads as `TConfig`).
 *
 * Internal. The factory unwraps it back to a plain `FieldRenderer` for
 * registry storage — registry consumers see the standard `FieldRendererArgs`
 * shape.
 */
export interface NarrowedRendererArgs<TValue, TConfig>
  extends Omit<FieldRendererArgs, "value" | "field"> {
  value: TValue;
  field: FieldDefinition & {
    config?: { [key: string]: TConfig };
  };
}

export interface DefineFieldRendererConfig<TValue, TConfig> {
  /**
   * Display name surfaced in `<JsonFormDevtools>` and dev-tools panels.
   * Defaults to `"AnonymousRenderer"` when omitted. Attached as a
   * non-enumerable `displayName` property on the returned `FieldRenderer`
   * so registry-walker code can pick it up.
   */
  displayName?: string;
  /**
   * The renderer body. Receives the narrowed args; returns the rendered
   * React node.
   */
  impl: (args: NarrowedRendererArgs<TValue, TConfig>) => ReactNode;
}

/**
 * v0.1.7 — typed factory for custom field renderers.
 *
 * Returns a plain `FieldRenderer` (the same shape consumers use today via
 * `Record<string, FieldRenderer>`) — so the result drops directly into a
 * registry without any other plumbing. The factory is **type-narrowing
 * only**: there's no runtime narrowing of `value` or `field.config`,
 * because RHF values aren't statically known. The generics are
 * consumer-asserted convenience.
 *
 * @example
 * ```tsx
 * import { defineFieldRenderer } from "@ilinxa/json-form";
 *
 * interface ColorConfig {
 *   palette?: string[];
 * }
 *
 * const ColorSwatch = defineFieldRenderer<string, ColorConfig>({
 *   displayName: "ColorSwatch",
 *   impl: ({ value, onChange, field, disabled }) => {
 *     const palette = field.config?.color?.palette ?? ["#FF595E", "#FFCA3A"];
 *     return palette.map((c) => (
 *       <button key={c} onClick={() => onChange(c)} disabled={disabled}>
 *         {value === c ? "✓" : ""}
 *       </button>
 *     ));
 *   },
 * });
 *
 * const registry = { ...defaultJsonFormRegistry, color: ColorSwatch };
 * ```
 */
export function defineFieldRenderer<TValue = unknown, TConfig = unknown>(
  config: DefineFieldRendererConfig<TValue, TConfig>,
): FieldRenderer {
  const renderer: FieldRenderer = (args) =>
    config.impl(args as unknown as NarrowedRendererArgs<TValue, TConfig>);

  // Attach displayName as a non-enumerable property so registry-walker code
  // (e.g., `<JsonFormDevtools>`) can read it without it leaking into
  // `Object.keys` / JSON.stringify of registry maps.
  Object.defineProperty(renderer, "displayName", {
    value: config.displayName ?? "AnonymousRenderer",
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return renderer;
}
