"use client";

import { Suspense, lazy, useEffect, useRef } from "react";
import { ARTICLE_BODY_EMPTY_VALUE } from "@/registry/components/data/article-body-01/article-body-01";
import type { BodySlotValue, SlotHandle, SlotRenderArgs } from "../types";
import { assignRef } from "../lib/assign-ref";
import {
  bodyContentKey,
  defaultBodyValue,
  isBodyEmpty,
  useBodyDirty,
} from "../hooks/use-body-dirty";
import { BodySubstratePlaintext } from "./body-substrate-plaintext";

// Lazy-load the Plate bundle (~165 KB) — only paid when a richtext body mounts.
// The default-export requirement lives on body-substrate-plate.tsx.
const BodySubstratePlate = lazy(() => import("./body-substrate-plate"));

/**
 * `bodySlot` substrate mount. Dispatches plate-vs-plaintext on
 * `slotConfig.substrate`, wraps the lazy Plate editor in `<Suspense>`, and
 * populates the uniform `SlotHandle`. Dirty is derived by JSON baseline-compare
 * (Plate has no dirty signal) — `loadValue` resets the baseline (#1 trap).
 */
export function BodySubstrateMount({
  slotConfig,
  value,
  onChange,
  ctx,
  handleRef,
}: SlotRenderArgs<"bodySlot">) {
  const current = value ?? defaultBodyValue(slotConfig);
  const { valueRef, getIsDirty, rebaseline } = useBodyDirty(current);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const handle: SlotHandle<BodySlotValue> = {
      getValue: () => valueRef.current,
      getIsDirty,
      // Structural non-empty self-check (for headless use). The shell's gate
      // layers the CONFIGURED minLength rule — it owns step.validation.
      validate: async () => !isBodyEmpty(valueRef.current),
      loadValue: (v) => {
        if (bodyContentKey(v) !== bodyContentKey(valueRef.current)) {
          onChangeRef.current(v);
        }
        rebaseline(v); // reset baseline (#1 trap)
      },
    };
    assignRef(handleRef, handle);
  }, [handleRef, getIsDirty, rebaseline, valueRef]);

  const labelledBy = `composer-step-${ctx.stepId}-label`;

  if (slotConfig.substrate === "plaintext") {
    return (
      <BodySubstratePlaintext
        value={current.kind === "plaintext" ? current.value : ""}
        onChange={(s) => onChange({ kind: "plaintext", value: s })}
        placeholder={slotConfig.placeholder}
        labelledBy={labelledBy}
      />
    );
  }

  return (
    <Suspense fallback={<BodyLoading />}>
      <BodySubstratePlate
        value={
          current.kind === "richtext" ? current.value : ARTICLE_BODY_EMPTY_VALUE
        }
        onChange={(v) => onChange({ kind: "richtext", value: v })}
        placeholder={slotConfig.placeholder}
        labelledBy={labelledBy}
      />
    </Suspense>
  );
}

function BodyLoading() {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      Loading editor…
    </div>
  );
}
