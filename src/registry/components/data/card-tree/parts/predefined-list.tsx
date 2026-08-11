import { cn } from "@/lib/utils";
import type { FlatFieldValue, ListValue } from "../types";

function renderItem(v: FlatFieldValue) {
  if (v === null) return <span className="text-muted-foreground">—</span>;
  if (typeof v === "boolean")
    return (
      <span className={v ? "text-primary" : "text-muted-foreground"}>
        {v ? "true" : "false"}
      </span>
    );
  if (typeof v === "number")
    return <span className="font-mono tabular-nums">{v}</span>;
  return String(v);
}

export function PredefinedList({
  value,
  className,
}: {
  value: ListValue;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "list-disc space-y-0.5 ps-4 text-[13px] marker:text-muted-foreground/60",
        className,
      )}
    >
      {value.map((item, i) => (
        <li key={i}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
