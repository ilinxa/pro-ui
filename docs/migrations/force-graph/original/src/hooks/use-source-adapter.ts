"use client";

import { useEffect, useRef, useState } from "react";
import type {
  GraphInput,
  GraphSnapshot,
  ValidationError,
} from "../types";
import {
  bootstrapLiveMode,
  attachLiveSubscription,
} from "../lib/source-adapter/live-mode";
import { bootstrapSnapshotMode } from "../lib/source-adapter/snapshot-mode";
import { isGraphSource } from "../lib/source-adapter/source-types";
import { useGraphologyAdapter } from "./use-graphology-adapter";

/**
 * Per plan §10: orchestrates `loadInitial` + `subscribe` for the two
 * GraphInput modes (static snapshot OR live source).
 *
 * Lifecycle:
 *   - On `input` change: re-bootstrap (static = synchronous; live = async).
 *   - On unmount or input change: tear down any live subscription.
 *
 * Async resolution is fundamentally a non-derivable external signal, so
 * setStatus inside useEffect is the right pattern here (per HANDOFF §5.1
 * the "no setState in effect" rule applies to derivable state only —
 * promise resolution is not derivable).
 *
 * Callbacks (`onError`) are stashed in refs so the bootstrap effect
 * doesn't re-fire when an inline-defined handler changes identity.
 */
export type SourceStatus = "loading" | "ready" | "error";

export interface SourceState {
  status: SourceStatus;
  error?: { code: string; message: string };
}

export interface UseSourceAdapterOptions {
  onError?: (error: ValidationError | { code: string; message: string }) => void;
  onChange?: (snapshot: GraphSnapshot) => void;
}

export function useSourceAdapter(
  input: GraphInput,
  options: UseSourceAdapterOptions = {},
): SourceState {
  const adapter = useGraphologyAdapter();

  const onErrorRef = useRef(options.onError);
  const onChangeRef = useRef(options.onChange);

  // Mirror callbacks into refs post-commit so the bootstrap effect
  // doesn't re-run when host re-creates inline handlers.
  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);
  useEffect(() => {
    onChangeRef.current = options.onChange;
  }, [options.onChange]);

  // Per HANDOFF §5.1: derive "loading on input change" from a key-paired
  // snapshot rather than calling setState({ status: "loading" }) inside
  // the effect body (which the React Compiler-aware lint flags as
  // setState-for-derivable-state). The async setState calls below are
  // post-await — those are not flagged.
  const [resolved, setResolved] = useState<{
    input: GraphInput;
    result: SourceState;
  }>(() => ({ input, result: { status: "loading" } }));

  const state: SourceState =
    resolved.input === input
      ? resolved.result
      : { status: "loading" };

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    async function run(): Promise<void> {
      if (isGraphSource(input)) {
        const result = await bootstrapLiveMode(input, (warning) => {
          onErrorRef.current?.(warning);
        });
        if (cancelled) return;
        if (!result.ok || !result.snapshot) {
          setResolved({
            input,
            result: {
              status: "error",
              error: result.error ?? {
                code: "BOOTSTRAP_FAILED",
                message: "Live source bootstrap failed",
              },
            },
          });
          return;
        }

        adapter.importSnapshot(result.snapshot);
        onChangeRef.current?.(result.snapshot);

        unsubscribe = attachLiveSubscription(
          input,
          (delta) => {
            adapter.applyDelta(delta);
          },
          (err) => onErrorRef.current?.(err),
        );

        setResolved({ input, result: { status: "ready" } });
      } else {
        const result = bootstrapSnapshotMode(input, (warning) => {
          onErrorRef.current?.(warning);
        });
        if (cancelled) return;
        if (!result.ok || !result.snapshot) {
          setResolved({
            input,
            result: {
              status: "error",
              error: result.error ?? {
                code: "BOOTSTRAP_FAILED",
                message: "Snapshot bootstrap failed",
              },
            },
          });
          return;
        }

        adapter.importSnapshot(result.snapshot);
        onChangeRef.current?.(result.snapshot);

        setResolved({ input, result: { status: "ready" } });
      }
    }

    run();

    return () => {
      cancelled = true;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, [input, adapter]);

  return state;
}
