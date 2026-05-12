"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FieldDefinition, FieldOption, FieldOptionsResolver } from "../types";

export interface AsyncOptionsState {
  options: FieldOption[];
  loading: boolean;
  error: string | null;
  /** Triggers a re-fetch with the same query (used by the Retry button). */
  retry: () => void;
  /** Update the search query (combobox typing). */
  setQuery: (q: string) => void;
}

const DEFAULT_DEBOUNCE = 200;

/**
 * Manages an async options resolver: debounce, loading state, error+retry.
 * Static options pass through directly (no state — derived on render).
 */
export function useAsyncOptions(field: FieldDefinition): AsyncOptionsState {
  const { getValues } = useFormContext();
  const [asyncOptions, setAsyncOptions] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQueryState] = useState("");
  const [tick, setTick] = useState(0);
  const generation = useRef(0);

  const isAsync = typeof field.options === "function";
  const staticOptions = useMemo<FieldOption[]>(
    () => (Array.isArray(field.options) ? (field.options as FieldOption[]) : []),
    [field.options],
  );
  const debounce = field.optionsDebounce ?? DEFAULT_DEBOUNCE;

  useEffect(() => {
    if (!isAsync) return;
    const resolver = field.options as FieldOptionsResolver;
    // Loading + error reset before the network call is intentional —
    // ergonomic "spinner before fetch" UX. Suppress the React Compiler
    // cascading-render lint; the subsequent then/catch are stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const myGen = ++generation.current;

    const handle = setTimeout(() => {
      resolver({ query, allValues: getValues() as Record<string, unknown> })
        .then((next) => {
          if (myGen !== generation.current) return;
          setAsyncOptions(next);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (myGen !== generation.current) return;
          setAsyncOptions([]);
          setLoading(false);
          setError(err instanceof Error ? err.message : String(err));
        });
    }, debounce);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAsync, query, debounce, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);
  const setQuery = useCallback((q: string) => setQueryState(q), []);

  return {
    options: isAsync ? asyncOptions : staticOptions,
    loading: isAsync ? loading : false,
    error: isAsync ? error : null,
    retry,
    setQuery,
  };
}
