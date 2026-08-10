"use client";

import { forwardRef, useId, type KeyboardEventHandler } from "react";
import { ChevronDown } from "lucide-react";
import { PopoverTrigger } from "@/components/ui/popover";
import type { EntityLike, KindMeta, PickerMode } from "../types";
import { ChipCluster } from "./chip-cluster";
import { KindBadge } from "./kind-badge";
import { cn } from "@/lib/utils";

interface TriggerButtonProps<T extends EntityLike> {
  id?: string;
  mode: PickerMode;
  value: T | T[] | null;
  open: boolean;
  disabled?: boolean;
  triggerLabel?: string;
  kinds?: Record<string, KindMeta>;
  showKindBadges: boolean;
  listboxId: string;
  ariaLabelledBy?: string;
  className?: string;
  onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
  onRemoveChip: (id: string) => void;
}

function TriggerButtonInner<T extends EntityLike>(
  props: TriggerButtonProps<T>,
  ref: React.Ref<HTMLButtonElement>,
) {
  const {
    id,
    mode,
    value,
    open,
    disabled,
    triggerLabel,
    kinds,
    showKindBadges,
    listboxId,
    ariaLabelledBy,
    className,
    onKeyDown,
    onRemoveChip,
  } = props;

  const contentId = useId();
  const placeholder = triggerLabel ?? "Select…";
  const isMulti = mode === "multi";
  const multiValue = Array.isArray(value) ? value : [];
  const singleValue = !Array.isArray(value) ? value : null;
  const empty = isMulti ? multiValue.length === 0 : singleValue === null;
  const singleKindMeta =
    singleValue?.kind && kinds ? kinds[singleValue.kind] : undefined;

  return (
    <div
      id={id}
      className={cn(
        "group relative flex min-h-9 w-full cursor-default items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1 text-sm transition-colors",
        // parity with the old focusable field div: border shifts with the ring
        "has-focus-visible:border-ring",
        "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
        "dark:bg-input/30",
        className,
      )}
      data-disabled={disabled || undefined}
      data-state={open ? "open" : "closed"}
    >
      {/* F-cross-13: no `asChild` — the Popover trigger is a real <button>
          (both backends) rendered as a full-field overlay. It can't WRAP the
          chips (button-in-button is illegal), so the chip layer paints above
          it (see ChipCluster) and every other click falls through to here. */}
      <PopoverTrigger
        ref={ref}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={!ariaLabelledBy && triggerLabel ? triggerLabel : undefined}
        aria-labelledby={ariaLabelledBy ?? (triggerLabel ? undefined : contentId)}
        onKeyDown={onKeyDown}
        className="absolute inset-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <span id={contentId} className="flex min-w-0 flex-1 items-center gap-1.5">
        {isMulti ? (
          multiValue.length === 0 ? (
            <span className="flex-1 truncate text-muted-foreground">
              {placeholder}
            </span>
          ) : (
            <ChipCluster
              value={multiValue}
              kinds={kinds}
              showKindBadges={showKindBadges}
              onRemove={onRemoveChip}
              disabled={disabled}
            />
          )
        ) : empty ? (
          <span className="flex-1 truncate text-muted-foreground">
            {placeholder}
          </span>
        ) : (
          <span className="flex flex-1 items-center gap-2 truncate">
            {showKindBadges && singleValue?.kind ? (
              <KindBadge
                kindKey={singleValue.kind}
                meta={singleKindMeta}
              />
            ) : null}
            <span className="truncate text-foreground">
              {singleValue?.label}
            </span>
          </span>
        )}
      </span>
      <ChevronDown
        aria-hidden="true"
        className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
      />
    </div>
  );
}

// forwardRef over a generic component — the cast preserves the generic call
// signature. The ref lands on the internal PopoverTrigger <button> (the field's
// single focusable element); the F-cross-13 sweep removed the asChild-Slot
// composition this file previously relied on.
export const TriggerButton = forwardRef(TriggerButtonInner) as <
  T extends EntityLike,
>(
  props: TriggerButtonProps<T> & { ref?: React.Ref<HTMLButtonElement> },
) => React.ReactElement;
