"use client";

import { useMemo, useState } from "react";
import { Filter, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type {
  TodoItem,
  TodoPerson,
  TodoStatusOption,
} from "../../todo-rich-card/types";
import type { TodoTreeFilter } from "../types";
import { forEachItem } from "../lib/tree-walker";
import { cn } from "@/lib/utils";

export interface TodoTreeFilterDropdownProps {
  value: TodoTreeFilter;
  onChange: (next: TodoTreeFilter) => void;
  items: TodoItem[];
  statusOptions?: ReadonlyArray<TodoStatusOption>;
  className?: string;
}

/**
 * Multi-select Popover for status + person + clear. Status chips come from
 * the consumer's statusOptions; persons are gathered lazily from the live
 * items tree on first open (and recomputed when items change while the
 * popover is open). Empty arrays mean "no filter applied" semantically.
 */
export function TodoTreeFilterDropdown({
  value,
  onChange,
  items,
  statusOptions,
  className,
}: TodoTreeFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const persons = useMemo(() => collectPersons(items), [items]);
  const activeStatusCount = value.statuses?.length ?? 0;
  const activePersonCount = value.personIds?.length ?? 0;
  const totalActive = activeStatusCount + activePersonCount;

  const toggleStatus = (statusValue: string) => {
    const current = value.statuses ?? [];
    const next = current.includes(statusValue)
      ? current.filter((s) => s !== statusValue)
      : [...current, statusValue];
    onChange({ ...value, statuses: next });
  };

  const togglePerson = (personId: string) => {
    const current = value.personIds ?? [];
    const next = current.includes(personId)
      ? current.filter((p) => p !== personId)
      : [...current, personId];
    onChange({ ...value, personIds: next });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Filter"
          className={cn("h-8 gap-1", className)}
        >
          <Filter className="size-3.5" />
          <span>Filter</span>
          {totalActive > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {totalActive}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 max-h-[60vh] overflow-y-auto p-3"
        align="end"
      >
        <div className="space-y-3">
          {statusOptions && statusOptions.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">
                Status
              </div>
              <div className="space-y-1">
                {statusOptions.map((opt) => {
                  const checked = value.statuses?.includes(opt.value) ?? false;
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleStatus(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {persons.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">
                Person
              </div>
              <div className="space-y-1">
                {persons.map((p) => {
                  const checked = value.personIds?.includes(p.id) ?? false;
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => togglePerson(p.id)}
                      />
                      <span>{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {totalActive > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...value, statuses: [], personIds: [] })}
              className="w-full justify-start gap-1 px-1 h-7 text-xs"
            >
              <X className="size-3" /> Clear status + person
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Lazy person collection: walks the tree once collecting every unique
 * person id from both targetPerson and creatorPerson fields. Preserves
 * insertion order for stable rendering.
 */
function collectPersons(items: ReadonlyArray<TodoItem>): TodoPerson[] {
  const map = new Map<string, TodoPerson>();
  forEachItem(items, (item) => {
    if (item.targetPerson && !map.has(item.targetPerson.id)) {
      map.set(item.targetPerson.id, item.targetPerson);
    }
    if (item.creatorPerson && !map.has(item.creatorPerson.id)) {
      map.set(item.creatorPerson.id, item.creatorPerson);
    }
  });
  return Array.from(map.values());
}
