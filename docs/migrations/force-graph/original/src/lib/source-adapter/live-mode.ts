import type {
  GraphDelta,
  GraphSnapshot,
  GraphSource,
  ValidationError,
} from "../../types";
import { bootstrapSnapshotMode } from "./snapshot-mode";
import type { BootstrapResult, Unsubscribe } from "./source-types";
import { safeDispatchDelta } from "./source-types";

/**
 * Per plan §10.2: live source mode bootstrap.
 *
 * Steps:
 *   1. Await `source.loadInitial()`.
 *   2. Run the snapshot through `bootstrapSnapshotMode` (validation +
 *      auto-register + derive groupIds).
 *   3. Caller wires `source.subscribe(callback)` and stores the
 *      unsubscribe via `attachLiveSubscription`.
 *
 * Per decision #22: live deltas preserve UI state and do NOT enter undo.
 * The actual delta-application is in `lib/store/apply-delta.ts`; this
 * file owns only the subscription lifecycle wrapper.
 */
export async function bootstrapLiveMode(
  source: GraphSource,
  onWarning?: (warning: ValidationError) => void,
): Promise<BootstrapResult> {
  let initial: GraphSnapshot;
  try {
    initial = await source.loadInitial();
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "LOAD_INITIAL_FAILED",
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }

  return bootstrapSnapshotMode(initial, onWarning);
}

/**
 * Wrap `source.subscribe` so each delta is dispatched through
 * `safeDispatchDelta` (per-delta try/catch + onError forwarding). Returns
 * the unsubscribe function from the source, or a no-op when the source
 * has no `subscribe`.
 */
export function attachLiveSubscription(
  source: GraphSource,
  apply: (delta: GraphDelta) => void,
  onError?: (error: { code: string; message: string }) => void,
): Unsubscribe {
  if (!source.subscribe) {
    return noop;
  }

  try {
    const unsubscribe = source.subscribe((delta) => {
      safeDispatchDelta(delta, apply, onError);
    });
    return typeof unsubscribe === "function" ? unsubscribe : noop;
  } catch (err) {
    onError?.({
      code: "SUBSCRIBE_THREW",
      message: err instanceof Error ? err.message : String(err),
    });
    return noop;
  }
}

function noop(): void {
  // no-op unsubscribe
}
