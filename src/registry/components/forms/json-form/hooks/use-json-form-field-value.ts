"use client";

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { useJsonFormContext } from "../json-form-context";
import { setByPath } from "../lib/path";

/**
 * v0.1.7 — narrow-deps single-field watch. Pure ergonomic wrapper around
 * RHF's `useWatch({ control, name })` scoped to one path, resolved against
 * the active `<JsonFormProvider>` context.
 *
 * **Typing caveat:** the generic `<T>` is consumer-asserted. RHF values
 * aren't statically known — the runtime returns whatever the form currently
 * holds at `name`. Treat the generic as a typed-assertion convenience, not a
 * runtime guarantee.
 *
 * Use this hook to build fully-custom form layouts that subscribe to one
 * field's value without re-rendering on every other field's change. Mirrors
 * the narrow-deps pattern shipped in `useConditional` + `useComputed`
 * (v0.1.6) and exposes it to consumer code.
 *
 * @example
 * ```tsx
 * const country = useJsonFormFieldValue<string>("country");
 * return <p>You selected {country}</p>;
 * ```
 */
export function useJsonFormFieldValue<T = unknown>(name: string): T {
  const ctx = useJsonFormContext();
  // `as never` matches the codebase's RHF-overload-disambiguation pattern
  // (see `use-conditional.ts` for the precedent rationale). The v7.76
  // `compute` overload ambiguates single-string-name calls when the
  // resolved Control's value type is unknown.
  return useWatch({ control: ctx.rhf.control, name } as never) as T;
}

/**
 * v0.1.7 — narrow-deps multi-field watch. Returns a path-keyed bag with
 * only the named fields rehydrated via `setByPath` — so consumers can read
 * `bag["address.city"]` via `getByPath` or destructure nested paths
 * naturally.
 *
 * **Typing caveat:** same as `useJsonFormFieldValue<T>` — the generic is
 * consumer-asserted. The returned shape is structurally a `Record<string,
 * unknown>` enriched with whatever `setByPath` walks produce.
 *
 * @example
 * ```tsx
 * const { firstName, lastName } = useJsonFormFieldsValue<{
 *   firstName: string;
 *   lastName: string;
 * }>(["firstName", "lastName"]);
 * ```
 */
export function useJsonFormFieldsValue<
  T extends Record<string, unknown> = Record<string, unknown>,
>(names: ReadonlyArray<string>): T {
  const ctx = useJsonFormContext();
  // `as never` per the same overload-disambiguation rationale above.
  const watched = useWatch({ control: ctx.rhf.control, name: names } as never);

  return useMemo<T>(() => {
    const arr = Array.isArray(watched) ? watched : [];
    const bag: Record<string, unknown> = {};
    names.forEach((n, i) => {
      setByPath(bag, n, arr[i]);
    });
    return bag as T;
  }, [watched, names]);
}
