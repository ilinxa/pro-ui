import type {
  GraphDelta,
  GraphInput,
  GraphSnapshot,
  GraphSource,
  MutationResult,
  UserMutation,
} from "../../types";

/**
 * Per plan §10: source-adapter helpers. Adapters themselves live OUTSIDE
 * the registry (decision #27); this file ships only the contract types
 * + small dispatchers that the in-component bootstrap uses.
 */

export interface BootstrapResult {
  ok: boolean;
  snapshot?: GraphSnapshot;
  error?: { code: string; message: string };
}

export type DeltaCallback = (delta: GraphDelta) => void;
export type Unsubscribe = () => void;

/**
 * Type guard for the GraphInput union. Mirrors the runtime guard exported
 * from `../types.ts` (re-exported here so the source-adapter folder is
 * self-contained when consumed at the bootstrap layer).
 */
export function isGraphSource(input: GraphInput): input is GraphSource {
  return typeof (input as GraphSource).loadInitial === "function";
}

/**
 * Apply a `subscribe` callback safely. Live sources may invoke the
 * callback synchronously inside `subscribe`; we capture each invocation
 * and rethrow asynchronously to the host's onError so a single bad delta
 * doesn't take down the subscription.
 *
 * Used by `live-mode.ts`. Pure function.
 */
export function safeDispatchDelta(
  delta: GraphDelta,
  apply: DeltaCallback,
  onError?: (error: { code: string; message: string }) => void,
): void {
  try {
    apply(delta);
  } catch (err) {
    onError?.({
      code: "DELTA_DISPATCH_FAILED",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Helper to invoke `applyMutation` with a uniform error envelope. Pure.
 * v0.1 doesn't dispatch any user mutations; this is here for v0.3 wiring
 * + so hosts that supply `applyMutation` can be type-checked against the
 * full surface today.
 */
export async function dispatchMutation(
  source: GraphSource,
  mutation: UserMutation,
): Promise<MutationResult> {
  if (!source.applyMutation) {
    return {
      ok: false,
      error: {
        code: "APPLY_MUTATION_NOT_SUPPORTED",
        message: "GraphSource has no applyMutation; mutation rejected",
      },
    };
  }
  try {
    return await source.applyMutation(mutation);
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "APPLY_MUTATION_THREW",
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
