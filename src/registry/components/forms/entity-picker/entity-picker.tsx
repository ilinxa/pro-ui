"use client";

import {
  useCallback,
  useId,
  useImperativeHandle,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import type {
  EntityLike,
  EntityPickerHandle,
  EntityPickerProps,
  KindMeta,
  MultiPickerProps,
  PickerMode,
  SinglePickerProps,
} from "./types";
import { defaultMatch } from "./lib/default-match";
import {
  multiSelectionEqual,
  singleSelectionEqual,
} from "./lib/selection-equality";
import { useItemsById } from "./hooks/use-items-by-id";
import { useOpenState } from "./hooks/use-open-state";
import { TriggerButton } from "./parts/trigger-button";
import { ResultRow } from "./parts/result-row";
import { DefaultEmptyState } from "./parts/default-empty-state";

function EntityPickerImpl<T extends EntityLike>(props: EntityPickerProps<T>) {
  const {
    items,
    match,
    placeholder = "Search…",
    open: controlledOpen,
    onOpenChange,
    kinds,
    showKindBadges: showKindBadgesProp,
    renderItem,
    renderTrigger,
    renderEmpty,
    disabled = false,
    triggerLabel,
    id,
    className,
    ref,
  } = props;

  const mode: PickerMode = props.mode === "multi" ? "multi" : "single";
  const value = props.value as T | T[] | null;

  const reactId = useId();
  const listboxId = `${reactId}-listbox`;

  const { open, setOpen: rawSetOpen } = useOpenState({
    controlled: controlledOpen,
    onOpenChange,
  });

  const [query, setQuery] = useState("");

  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) setQuery("");
      rawSetOpen(next);
    },
    [rawSetOpen],
  );

  const itemsById = useItemsById(items);

  const showKindBadges =
    showKindBadgesProp !== undefined
      ? showKindBadgesProp
      : items.some((i) => !!i.kind);

  // Track the trigger element via state (not a ref) so the setter is React's
  // own setState — passes the React Compiler-aware lint rule that flags
  // ref-accessor functions passed to user-rendered functions during render.
  // The ref-fn is stable across renders (React guarantees setState identity).
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);

  const handleSelect = useCallback(
    (item: T) => {
      if (mode === "multi") {
        const multiProps = props as MultiPickerProps<T>;
        const current = multiProps.value;
        const isSelected = current.some((v) => v.id === item.id);
        const next = isSelected
          ? current.filter((v) => v.id !== item.id)
          : [...current, item];
        if (!multiSelectionEqual(current, next)) {
          multiProps.onChange(next);
        }
      } else {
        const singleProps = props as SinglePickerProps<T>;
        const current = singleProps.value;
        const next = item;
        if (!singleSelectionEqual(current, next)) {
          singleProps.onChange(next);
        }
        setOpen(false);
      }
    },
    [mode, props, setOpen],
  );

  const handleRemoveChip = useCallback(
    (idToRemove: string) => {
      if (mode !== "multi") return;
      const multiProps = props as MultiPickerProps<T>;
      const next = multiProps.value.filter((v) => v.id !== idToRemove);
      if (!multiSelectionEqual(multiProps.value, next)) {
        multiProps.onChange(next);
      }
    },
    [mode, props],
  );

  const handleClear = useCallback(() => {
    if (mode === "multi") {
      const multiProps = props as MultiPickerProps<T>;
      if (multiProps.value.length > 0) multiProps.onChange([]);
    } else {
      const singleProps = props as SinglePickerProps<T>;
      if (singleProps.value !== null) singleProps.onChange(null);
    }
  }, [mode, props]);

  const focusTrigger = useCallback(() => {
    if (!triggerNode) return;
    triggerNode.focus();
  }, [triggerNode]);

  useImperativeHandle(
    ref as Ref<EntityPickerHandle>,
    (): EntityPickerHandle => ({
      focus: focusTrigger,
      open: () => setOpen(true),
      close: () => setOpen(false),
      clear: handleClear,
    }),
    [focusTrigger, setOpen, handleClear],
  );

  const handleTriggerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
    },
    [disabled, setOpen],
  );

  const handleSearchKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Backspace" &&
        query.length === 0 &&
        mode === "multi"
      ) {
        const multiProps = props as MultiPickerProps<T>;
        if (multiProps.value.length > 0) {
          e.preventDefault();
          const last = multiProps.value[multiProps.value.length - 1];
          handleRemoveChip(last.id);
        }
      }
    },
    [query, mode, props, handleRemoveChip],
  );

  const filterFn = useCallback(
    (entityId: string, search: string): number => {
      const item = itemsById.get(entityId);
      if (!item) return 0;
      try {
        const result = match
          ? match(item, search)
          : defaultMatch(item, search);
        return result ? 1 : 0;
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            `[entity-picker] match threw for item "${item.id}":`,
            err,
          );
        }
        return 0;
      }
    },
    [itemsById, match],
  );

  const renderTriggerNode = renderTrigger ? (
    renderTrigger({
      value,
      open,
      triggerRef: setTriggerNode,
    })
  ) : (
    <TriggerButton<T>
      ref={setTriggerNode}
      id={id}
      mode={mode}
      value={value}
      open={open}
      disabled={disabled}
      triggerLabel={triggerLabel}
      kinds={kinds}
      showKindBadges={showKindBadges}
      listboxId={listboxId}
      className={className}
      onClick={() => setOpen(!open)}
      onKeyDown={handleTriggerKeyDown}
      onRemoveChip={handleRemoveChip}
    />
  );

  const valueMap = (() => {
    const out = new Set<string>();
    if (mode === "multi") {
      const m = props as MultiPickerProps<T>;
      for (const v of m.value) out.add(v.id);
    } else {
      const s = props as SinglePickerProps<T>;
      if (s.value) out.add(s.value.id);
    }
    return out;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{renderTriggerNode}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-(--radix-popover-trigger-width) min-w-60 p-0"
      >
        <Command filter={filterFn} loop>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleSearchKeyDown}
            aria-label={triggerLabel ?? "Search entities"}
          />
          <CommandList id={listboxId} aria-multiselectable={mode === "multi"}>
            <CommandEmpty>
              {renderEmpty ? (
                renderEmpty({ query, itemCount: items.length })
              ) : (
                <DefaultEmptyState query={query} itemCount={items.length} />
              )}
            </CommandEmpty>
            {items.map((item) => {
              const selected = valueMap.has(item.id);
              const kindMeta: KindMeta | undefined =
                item.kind && kinds ? kinds[item.kind] : undefined;
              const customNode = renderItem
                ? renderItem(item, { selected, query })
                : undefined;
              return (
                <ResultRow<T>
                  key={item.id}
                  item={item}
                  selected={selected}
                  kindMeta={kindMeta}
                  showKindBadges={showKindBadges}
                  onSelect={() => handleSelect(item)}
                  customRender={customNode}
                />
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function EntityPicker<T extends EntityLike>(
  props: SinglePickerProps<T>,
): React.JSX.Element;
export function EntityPicker<T extends EntityLike>(
  props: MultiPickerProps<T>,
): React.JSX.Element;
export function EntityPicker<T extends EntityLike>(
  props: EntityPickerProps<T>,
): React.JSX.Element {
  return EntityPickerImpl(props);
}
