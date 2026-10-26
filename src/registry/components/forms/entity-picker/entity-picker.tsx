"use client";

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
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
import { formatCount, resolveLabels } from "./lib/labels";
import {
  multiSelectionEqual,
  singleSelectionEqual,
} from "./lib/selection-equality";
import { useItemsById } from "./hooks/use-items-by-id";
import { useOpenState } from "./hooks/use-open-state";
import { useDirection } from "./hooks/use-direction";
import { TriggerButton } from "./parts/trigger-button";
import { ResultRow } from "./parts/result-row";
import { DefaultEmptyState } from "./parts/default-empty-state";
import { ErrorRow, LoadingRow } from "./parts/status-rows";

function EntityPickerImpl<T extends EntityLike>(props: EntityPickerProps<T>) {
  const {
    items,
    match,
    placeholder,
    query: controlledQuery,
    onQueryChange,
    filterItems = true,
    loading = false,
    error,
    onRetry,
    renderLoading,
    renderError,
    hasMore,
    onLoadMore,
    loadingMore = false,
    labels: labelsProp,
    locale,
    dir: dirProp,
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

  const labels = resolveLabels(labelsProp);
  // Deprecated aliases win over their label keys. `triggerLabel` has always named
  // the trigger text, the trigger button and the search input.
  const searchPlaceholder = placeholder ?? labels.searchPlaceholder;
  const triggerPlaceholder = triggerLabel ?? labels.triggerPlaceholder;
  const searchLabel = triggerLabel ?? labels.searchLabel;

  const queryControlled = controlledQuery !== undefined;
  const [internalQuery, setInternalQuery] = useState("");
  const query = queryControlled ? controlledQuery : internalQuery;

  const onQueryChangeRef = useRef(onQueryChange);
  useLayoutEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  });

  const handleQueryInput = useCallback((next: string) => {
    setInternalQuery(next);
    onQueryChangeRef.current?.(next, "input");
  }, []);

  const itemsById = useItemsById(items);

  // The one predicate behind the list: cmdk's `filter` and the announced count.
  const matchItem = useCallback(
    (item: T, search: string): boolean => {
      try {
        return match ? match(item, search) : defaultMatch(item, search, locale);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            `[entity-picker] match threw for item "${item.id}":`,
            err,
          );
        }
        return false;
      }
    },
    [match, locale],
  );

  const filterFn = useCallback(
    (entityId: string, search: string): number => {
      const item = itemsById.get(entityId);
      return item && matchItem(item, search) ? 1 : 0;
    },
    [itemsById, matchItem],
  );

  // Server mode: cmdk keeps its highlight on the row it was on when the list is
  // swapped, so the highlight is controlled there and returns to the first row
  // whenever the rows change (and when the popover closes).
  const [highlight, setHighlight] = useState<string>(items[0]?.id ?? "");
  const [prevItems, setPrevItems] = useState(items);
  if (prevItems !== items) {
    setPrevItems(items);
    const same =
      prevItems.length === items.length &&
      prevItems.every((it, i) => it.id === items[i].id);
    if (!same) setHighlight(items[0]?.id ?? "");
  }

  const [announcement, setAnnouncement] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevLoading, setPrevLoading] = useState(loading);
  // Derived-state transitions (set during render, never in an effect): the
  // uncontrolled query clears when the popover closes, however it closes; the
  // results announcement is armed when loading settles while open, once.
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setInternalQuery("");
      setAnnouncement("");
      setHighlight(items[0]?.id ?? "");
    }
  }
  if (prevLoading !== loading) {
    setPrevLoading(loading);
    if (loading) {
      setAnnouncement("");
    } else if (open && !error) {
      // Count what the list shows: all rows in server mode, the matching rows
      // in client mode. An errored settle announces nothing (the alert speaks).
      const shown =
        filterItems && query !== ""
          ? items.filter((it) => matchItem(it, query)).length
          : items.length;
      setAnnouncement(labels.resultsCount(shown, formatCount(shown, locale)));
    }
  }

  // The host hears the reset after commit, for every way the popover can close
  // (selection, Esc, outside press, handle, a controlled `open` going false).
  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (wasOpenRef.current && !open) onQueryChangeRef.current?.("", "reset");
    wasOpenRef.current = open;
  }, [open]);

  const setOpen = rawSetOpen;

  // Kind badges come from the rows AND the selection: chips must keep their
  // badge while `items` is empty (loading, server returned nothing).
  const selectedHasKind = Array.isArray(props.value)
    ? props.value.some((v) => !!v.kind)
    : !!props.value?.kind;
  const showKindBadges =
    showKindBadgesProp !== undefined
      ? showKindBadgesProp
      : items.some((i) => !!i.kind) || selectedHasKind;

  // Track the trigger element via state (not a ref) so the setter is React's
  // own setState — passes the React Compiler-aware lint rule that flags
  // ref-accessor functions passed to user-rendered functions during render.
  // The ref-fn is stable across renders (React guarantees setState identity).
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);

  // The popover is portalled out of the host's layout, so it cannot inherit `dir`: resolve
  // it from the trigger (canonical useDirection snippet) and set it on the content.
  const popoverDir = useDirection(triggerNode, dirProp);

  // F-cross-13 consumer-trigger path: when a press lands while the popover is
  // open, Radix/Base UI's outside-press dismiss closes it BEFORE the click
  // event — the wrapper's click handler must not immediately re-open. The
  // capture-phase pointerdown snapshots the pre-dismiss open state.
  const openRef = useRef(open);
  // Layout effect: the capture-phase pointerdown guard reads this ref, and a
  // press can land between commit and a passive effect's flush.
  useLayoutEffect(() => {
    openRef.current = open;
  });
  const pointerDownWhileOpenRef = useRef(false);

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
    (e: KeyboardEvent<HTMLButtonElement>) => {
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

  // F-cross-13: no `asChild` on either path. Default path — TriggerButton
  // renders the PopoverTrigger <button> internally. Consumer path — the node
  // can no longer BE the trigger (Slot semantics need asChild), so a hidden
  // full-size PopoverTrigger anchors the popover to the node's box while the
  // wrapper span owns open-on-click; the consumer node keeps its own
  // interactivity, hover styles, and the documented `triggerRef` contract.
  const renderTriggerNode = renderTrigger ? (
    <span
      className="relative inline-flex max-w-full"
      onPointerDownCapture={() => {
        pointerDownWhileOpenRef.current = openRef.current;
      }}
      onClick={(e) => {
        const wasOpen = pointerDownWhileOpenRef.current;
        pointerDownWhileOpenRef.current = false;
        if (disabled) return;
        // Keyboard "clicks" (detail 0) have no preceding pointerdown, so no
        // outside-press dismiss ran — toggle both ways here (Enter closes).
        if (e.detail === 0) {
          setOpen(!openRef.current);
          return;
        }
        if (wasOpen) return;
        setOpen(true);
      }}
    >
      <PopoverTrigger
        aria-hidden="true"
        tabIndex={-1}
        // Close-autofocus lands here (it's the backend's registered trigger);
        // bounce it to the consumer's real trigger element.
        onFocus={() => triggerNode?.focus()}
        className="pointer-events-none absolute inset-0"
      />
      {renderTrigger({
        value,
        open,
        triggerRef: setTriggerNode,
      })}
    </span>
  ) : (
    <TriggerButton<T>
      ref={setTriggerNode}
      id={id}
      mode={mode}
      value={value}
      open={open}
      disabled={disabled}
      triggerLabel={triggerLabel}
      placeholderText={triggerPlaceholder}
      removeChipLabel={labels.removeChip}
      kinds={kinds}
      showKindBadges={showKindBadges}
      listboxId={listboxId}
      className={className}
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

  const errorActive = !loading && !!error;
  const errorMessage = typeof error === "string" ? error : labels.error;
  const emptyNode = renderEmpty ? (
    renderEmpty({ query, itemCount: items.length })
  ) : (
    <DefaultEmptyState
      query={query}
      itemCount={items.length}
      nothingToPick={labels.nothingToPick}
      noResults={labels.noResults}
      serverFiltered={!filterItems}
    />
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {renderTriggerNode}
      <PopoverContent
        id={listboxId}
        dir={popoverDir}
        align="start"
        sideOffset={4}
        aria-label={searchLabel}
        // Radix exposes --radix-popover-trigger-width, Base UI --anchor-width
        // (F-cross-13) — cover both; min-w-60 is the last-resort floor.
        className="w-(--radix-popover-trigger-width,var(--anchor-width)) min-w-60 p-0"
      >
        {/* cmdk names the input through its own `label` (aria-labelledby wins
            over aria-label), so the search name must be passed here too. */}
        <Command
          label={searchLabel}
          filter={filterFn}
          shouldFilter={filterItems}
          value={filterItems ? undefined : highlight}
          onValueChange={setHighlight}
          loop
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={handleQueryInput}
            onKeyDown={handleSearchKeyDown}
            aria-label={searchLabel}
          />
          <CommandList
            label={labels.listLabel}
            aria-multiselectable={mode === "multi"}
            aria-busy={loading || undefined}
          >
            {filterItems && !loading && !errorActive ? (
              <CommandEmpty>{emptyNode}</CommandEmpty>
            ) : null}
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
                  selectedText={labels.selectedState}
                  onSelect={() => handleSelect(item)}
                  customRender={customNode}
                />
              );
            })}
          </CommandList>
          {/* Status rows and Load more sit beside the listbox, not inside it: a
              listbox may only own options, and status/alert children fail axe.
              cmdk's root swallows Enter (preventDefault + selects the
              highlighted row), so Enter/Space on these controls must not
              bubble to it or the button never clicks. */}
          <div
            data-slot="entity-picker-footer"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.stopPropagation();
            }}
          >
          {loading
            ? renderLoading
              ? renderLoading({ query, itemCount: items.length })
              : <LoadingRow text={labels.loading} />
            : null}
          {errorActive
            ? renderError
              ? renderError({ message: errorMessage, query, onRetry })
              : (
                  <ErrorRow
                    message={errorMessage}
                    retryText={labels.retry}
                    onRetry={onRetry}
                  />
                )
            : null}
          {!filterItems && !loading && !errorActive && items.length === 0
            ? emptyNode
            : null}
          {hasMore && onLoadMore ? (
            <button
              type="button"
              data-slot="entity-picker-load-more"
              // aria-disabled, not disabled: a disabled button drops keyboard focus to <body>
              // the moment the host sets loadingMore, stranding the user outside the popover.
              aria-disabled={loadingMore || undefined}
              onClick={() => {
                if (!loadingMore) onLoadMore();
              }}
              className="flex w-full items-center justify-center rounded-sm px-2 py-1.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted-foreground"
            >
              {loadingMore ? labels.loading : labels.loadMore}
            </button>
          ) : null}
          </div>
          <div
            aria-live="polite"
            aria-atomic="true"
            data-slot="entity-picker-announcer"
            className="sr-only"
          >
            {open ? announcement : ""}
          </div>
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
