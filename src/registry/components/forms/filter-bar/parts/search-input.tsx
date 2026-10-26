"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Commits awaiting an echo are capped, so a host that never adopts them cannot grow the list. */
const MAX_UNECHOED = 10;

/**
 * Search input with magnifier icon.
 *
 * `debounced` (uncontrolled mode, or controlled with `debounceControlledSearch`): the input
 * keeps a local echo and commits to `onChange` after `debounceMs`. When the controlled
 * `value` later differs from the last commit (URL change, reset), the echo resyncs to it.
 * Otherwise the prop is the source of truth and every keystroke calls `onChange`.
 *
 * Commits the host has not yet echoed back are tracked in order: a prop value equal to one of
 * them is an echo (it and every earlier entry are dropped), never an external change.
 *
 * `flushRef` is internal: the parent calls it when another control is used while a commit
 * is pending. It commits the pending text (no `onChange`) and returns it, so the parent can
 * fold it into the one combined emission for that interaction.
 */
export function SearchInput({
  value,
  onChange,
  debounced,
  debounceMs,
  placeholder,
  ariaLabel,
  accessory,
  className,
  flushRef,
}: {
  value: string;
  onChange: (next: string) => void;
  debounced: boolean;
  debounceMs: number;
  placeholder: string;
  ariaLabel: string;
  accessory?: ReactNode;
  className?: string;
  flushRef?: RefObject<(() => string | undefined) | null>;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [committed, setCommitted] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  // Commits not yet echoed back by the host, oldest first.
  const [unechoed, setUnechoed] = useState<string[]>([]);

  // Structural resync: the prop moved. An echo of one of our commits is not external.
  if (value !== seenValue) {
    setSeenValue(value);
    const at = unechoed.indexOf(value);
    if (at >= 0) {
      setUnechoed(unechoed.slice(at + 1));
    } else {
      setUnechoed([]);
      setCommitted(value);
      setLocalValue(value);
    }
  }

  const live = useRef({ localValue, committed, debounced });
  useEffect(() => {
    live.current = { localValue, committed, debounced };
  });

  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = () => {
      const cur = live.current;
      if (!cur.debounced || cur.localValue === cur.committed) return undefined;
      live.current = { ...cur, committed: cur.localValue };
      setCommitted(cur.localValue);
      setUnechoed((list) => [...list, cur.localValue].slice(-MAX_UNECHOED));
      return cur.localValue;
    };
    return () => {
      flushRef.current = null;
    };
  }, [flushRef]);

  // Latest callback without restarting the debounce timer when its identity changes.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!debounced) return;
    if (localValue === committed) return;
    const id = setTimeout(() => {
      setCommitted(localValue);
      setUnechoed((list) => [...list, localValue].slice(-MAX_UNECHOED));
      onChangeRef.current(localValue);
    }, debounceMs);
    return () => clearTimeout(id);
  }, [localValue, committed, debounced, debounceMs]);

  const hasAccessory = accessory !== undefined && accessory !== null && accessory !== false;

  return (
    <div role="search" className={cn("relative", className)}>
      <Search
        aria-hidden="true"
        className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={debounced ? localValue : value}
        onChange={(event) => {
          const next = event.target.value;
          if (debounced) setLocalValue(next);
          else onChange(next);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "h-14 rounded-xl border-border/50 ps-12 text-lg focus-visible:border-primary",
          hasAccessory && "pe-14",
        )}
      />
      {hasAccessory ? (
        <div className="absolute end-3 top-1/2 flex -translate-y-1/2 items-center">
          {accessory}
        </div>
      ) : null}
    </div>
  );
}
