"use client";

import { forwardRef, type KeyboardEventHandler } from "react";
import { ChevronDown } from "lucide-react";
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
  onClick: () => void;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onRemoveChip: (id: string) => void;
}

function TriggerButtonInner<T extends EntityLike>(
  props: TriggerButtonProps<T>,
  ref: React.Ref<HTMLDivElement>,
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
    onClick,
    onKeyDown,
    onRemoveChip,
  } = props;

  const placeholder = triggerLabel ?? "Select…";
  const isMulti = mode === "multi";
  const multiValue = Array.isArray(value) ? value : [];
  const singleValue = !Array.isArray(value) ? value : null;
  const empty = isMulti ? multiValue.length === 0 : singleValue === null;
  const singleKindMeta =
    singleValue?.kind && kinds ? kinds[singleValue.kind] : undefined;

  return (
    <div
      ref={ref}
      id={id}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-disabled={disabled || undefined}
      aria-label={!ariaLabelledBy ? triggerLabel : undefined}
      aria-labelledby={ariaLabelledBy}
      onClick={() => {
        if (!disabled) onClick();
      }}
      onKeyDown={onKeyDown}
      className={cn(
        "group flex min-h-9 w-full cursor-default items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none transition-colors",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
        "dark:bg-input/30",
        className,
      )}
      data-disabled={disabled || undefined}
      data-state={open ? "open" : "closed"}
    >
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
      <ChevronDown
        aria-hidden="true"
        className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
      />
    </div>
  );
}

// React 19's first-class ref-as-prop would also work, but Radix's
// PopoverTrigger asChild-Slot ref composition expects forwardRef-style
// children for legacy reasons in some chains. forwardRef is safe here
// since this component is non-generic over its own DOM type.
export const TriggerButton = forwardRef(TriggerButtonInner) as <
  T extends EntityLike,
>(
  props: TriggerButtonProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;
