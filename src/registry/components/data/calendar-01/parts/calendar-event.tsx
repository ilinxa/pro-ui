"use client";

import { forwardRef } from "react";
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactElement,
  ReactNode,
} from "react";
import { format } from "date-fns";
import { Flag } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CalendarOccurrence, TodoStatusOption } from "../types";

/** A small solid priority flag (color = the item's priority color). */
function PriorityFlag({ color }: { color?: string }) {
  if (!color) return null;
  return (
    <Flag
      className="size-3 shrink-0 fill-current"
      style={{ color }}
      aria-label="High priority"
    />
  );
}

/**
 * Inline CSS var carrying the resolved accent. The tint / border / text / ring
 * are Tailwind classes referencing this var; only the var (and time-block
 * geometry) is inline, so there's no inline-vs-class specificity conflict.
 */
function accentStyle(
  occ: CalendarOccurrence,
  extra?: CSSProperties,
): CSSProperties {
  return {
    ...extra,
    ["--cal-accent" as string]: occ.color.fill,
  } as CSSProperties;
}

const SURFACE =
  "bg-[color-mix(in_oklch,var(--cal-accent)_16%,transparent)] text-(--cal-accent) hover:bg-[color-mix(in_oklch,var(--cal-accent)_30%,transparent)]";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--cal-accent)";
const SELECTED =
  "data-[selected=true]:ring-2 data-[selected=true]:ring-(--cal-accent)";

function compactTime(ms: number): string {
  const d = new Date(ms);
  return d.getMinutes() === 0 ? format(d, "h a") : format(d, "h:mm a");
}

/** Build the native-title summary (the lightweight default tooltip). */
export function eventTitle(occ: CalendarOccurrence): string {
  const name = occ.item.name;
  if (occ.invalid) return `${name} — (unscheduled)`;
  if (occ.kind === "milestone")
    return `${name} — ${format(new Date(occ.startMs), "PP")}`;
  if (occ.allDay)
    return `${name} — ${format(new Date(occ.startMs), "PP")} (all day)`;
  return `${name} — ${compactTime(occ.startMs)}–${compactTime(occ.endMs)}`;
}

/** Wrap an event trigger in a rich Tooltip when a `renderTooltip` node is given. */
export function EventHoverWrap({
  tooltip,
  children,
}: {
  tooltip?: ReactNode;
  children: ReactElement;
}) {
  if (!tooltip) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs border-border bg-popover p-0 text-popover-foreground">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

type ChipProps = {
  occ: CalendarOccurrence;
  selected?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "style" | "title" | "type" | "children">;

/** Month single-day / timed chip (Tier C). Spreads `...rest` so wrappers like
 *  the context menu (`ContextMenuTrigger asChild`) can inject `onContextMenu`. */
export const CalendarEventChip = forwardRef<HTMLButtonElement, ChipProps>(
  function CalendarEventChip({ occ, selected, className, ...rest }, ref) {
    const milestone = occ.kind === "milestone";
    return (
      <button
        ref={ref}
        type="button"
        {...rest}
        title={eventTitle(occ)}
        data-selected={selected || undefined}
        data-occ-id={occ.id}
        style={accentStyle(occ)}
        className={cn(
          "flex w-full items-center gap-1 truncate rounded-sm border-l-2 border-(--cal-accent) px-1.5 py-0.5 text-left text-xs leading-tight",
          SURFACE,
          FOCUS,
          SELECTED,
          occ.inactive && "opacity-50",
          className,
        )}
      >
        <PriorityFlag color={occ.flagColor} />
        {milestone ? (
          <span
            className="size-1.5 shrink-0 rotate-45 bg-(--cal-accent)"
            aria-hidden
          />
        ) : !occ.allDay ? (
          <span className="shrink-0 tabular-nums opacity-80">
            {compactTime(occ.startMs)}
          </span>
        ) : null}
        <span className="truncate">{occ.item.name}</span>
      </button>
    );
  },
);

type BarProps = ChipProps & {
  continuesLeft?: boolean;
  continuesRight?: boolean;
};

/** Month multi-day spanning bar segment (Tier C). */
export const CalendarEventBar = forwardRef<HTMLButtonElement, BarProps>(
  function CalendarEventBar(
    { occ, selected, continuesLeft, continuesRight, className, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        {...rest}
        title={eventTitle(occ)}
        data-selected={selected || undefined}
        data-occ-id={occ.id}
        style={accentStyle(occ)}
        className={cn(
          "flex h-5 w-full items-center truncate px-1.5 text-left text-xs font-medium leading-none",
          SURFACE,
          FOCUS,
          SELECTED,
          continuesLeft
            ? "rounded-l-none"
            : "rounded-l-sm border-l-2 border-(--cal-accent)",
          continuesRight ? "rounded-r-none" : "rounded-r-sm",
          occ.inactive && "opacity-50",
          className,
        )}
      >
        {!continuesLeft ? (
          <span className="mr-1 inline-flex shrink-0">
            <PriorityFlag color={occ.flagColor} />
          </span>
        ) : null}
        <span className="truncate">
          {continuesLeft ? "◀ " : ""}
          {occ.item.name}
          {continuesRight ? " ▶" : ""}
        </span>
      </button>
    );
  },
);

type TimeBlockProps = ChipProps & {
  /** top / height as 0..1 fractions of the day; left / width as 0..1 of the column. */
  top: number;
  height: number;
  left: number;
  width: number;
};

/** Week/Day positioned timed block (Tier C). */
export const CalendarTimeBlock = forwardRef<HTMLButtonElement, TimeBlockProps>(
  function CalendarTimeBlock(
    { occ, selected, top, height, left, width, className, ...rest },
    ref,
  ) {
    const milestone = occ.kind === "milestone";
    return (
      <button
        ref={ref}
        type="button"
        {...rest}
        title={eventTitle(occ)}
        data-selected={selected || undefined}
        data-occ-id={occ.id}
        style={accentStyle(occ, {
          top: `${top * 100}%`,
          height: milestone ? "0.5rem" : `${height * 100}%`,
          left: `calc(${left * 100}% + 1px)`,
          width: `calc(${width * 100}% - 2px)`,
        })}
        className={cn(
          "absolute z-10 flex flex-col overflow-hidden rounded-sm border-l-2 border-(--cal-accent) px-1.5 py-0.5 text-left text-xs leading-tight",
          SURFACE,
          FOCUS,
          "hover:z-20 focus-visible:z-20 data-[selected=true]:z-20",
          SELECTED,
          occ.inactive && "opacity-50",
          className,
        )}
      >
        <span className="flex items-center gap-1">
          <PriorityFlag color={occ.flagColor} />
          <span className="truncate font-medium">{occ.item.name}</span>
        </span>
        {!milestone && height > 0.04 ? (
          <span className="truncate tabular-nums opacity-75">
            {compactTime(occ.startMs)}–{compactTime(occ.endMs)}
          </span>
        ) : null}
      </button>
    );
  },
);

/** A horizontal "now" line crossing a day column (Tier C). */
export function NowIndicator({
  topFraction,
  className,
}: {
  topFraction: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      style={{ top: `${topFraction * 100}%` }}
      className={cn(
        "pointer-events-none absolute inset-x-0 z-30 flex items-center",
        className,
      )}
    >
      <span className="size-2 -translate-x-1/2 rounded-full bg-destructive" />
      <span className="h-px w-full bg-destructive" />
    </div>
  );
}

/** The default lightweight tooltip content (Tier C). Exported for composition. */
export function EventTooltip({
  occ,
  statusOptions,
}: {
  occ: CalendarOccurrence;
  statusOptions?: TodoStatusOption[];
}) {
  const status = statusOptions?.find((o) => o.value === occ.item.status);
  return (
    <div className="flex flex-col gap-1 p-3">
      <span className="text-sm font-semibold text-foreground">
        {occ.item.name}
      </span>
      <span className="text-xs text-muted-foreground">{eventTitle(occ)}</span>
      {status ? (
        <Badge variant={status.variant ?? "secondary"} className="w-fit">
          {status.label}
        </Badge>
      ) : null}
    </div>
  );
}
