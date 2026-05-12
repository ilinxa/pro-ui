"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { JsonFormContextValue } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- `Record<string, any>` is required to satisfy react-hook-form's `FieldValues` constraint; `unknown` won't type-check there. */

const JsonFormContext = createContext<JsonFormContextValue | null>(null);

/**
 * Narrow context that ONLY carries `hasSubmitted`. Split from the main
 * `JsonFormContext` (v0.1.3) so that flipping `hasSubmitted` false→true on
 * the first submit doesn't invalidate the memoized main context — which
 * would re-render every field that consumes it. Only `<JsonFormErrorSummary>`
 * actually needs to react to this flag.
 */
const JsonFormSubmittedContext = createContext<boolean>(false);

export interface JsonFormProviderProps<TValues extends Record<string, any> = Record<string, any>> {
  value: JsonFormContextValue<TValues>;
  /**
   * Has the form attempted a submit at least once? Drives the
   * `post-submit` error-summary strategy. Optional — defaults to `false`.
   * Provided as a sibling prop (not on `value`) so updating it doesn't
   * invalidate the memoized main context.
   */
  hasSubmitted?: boolean;
  children: ReactNode;
}

export function JsonFormProvider<TValues extends Record<string, any> = Record<string, any>>({
  value,
  hasSubmitted = false,
  children,
}: JsonFormProviderProps<TValues>) {
  return (
    <JsonFormContext.Provider value={value as JsonFormContextValue}>
      <JsonFormSubmittedContext.Provider value={hasSubmitted}>
        {children}
      </JsonFormSubmittedContext.Provider>
    </JsonFormContext.Provider>
  );
}

/**
 * Accessor hook for the JsonForm context. Use inside standalone parts
 * (`<JsonFormField>`, `<JsonFormErrorSummary>`, etc.) or to build a fully
 * headless layout while still using our context.
 *
 * v0.1.3 — the returned context's `hasSubmitted` is a read-time snapshot
 * from the narrow `JsonFormSubmittedContext` so consumers that depend on it
 * re-render only when it flips. Most consumers should not need this; reach
 * for `useJsonFormHasSubmitted()` if you only need the flag.
 */
export function useJsonFormContext<TValues extends Record<string, any> = Record<string, any>>(): JsonFormContextValue<TValues> {
  const ctx = useContext(JsonFormContext);
  const hasSubmitted = useContext(JsonFormSubmittedContext);
  if (!ctx) {
    throw new Error(
      "[json-form] useJsonFormContext must be used inside a <JsonForm> or <JsonFormProvider>.",
    );
  }
  // Reattach `hasSubmitted` so callers reading `ctx.hasSubmitted` still work,
  // even though it lives on a separate context internally.
  return { ...ctx, hasSubmitted } as JsonFormContextValue<TValues>;
}

/**
 * Narrow accessor — returns just the `hasSubmitted` flag. Use this in
 * standalone parts that ONLY care about post-submit state (e.g.,
 * `<JsonFormErrorSummary>`) so they don't re-render on every main-context
 * change.
 */
export function useJsonFormHasSubmitted(): boolean {
  return useContext(JsonFormSubmittedContext);
}

/* eslint-enable @typescript-eslint/no-explicit-any */
