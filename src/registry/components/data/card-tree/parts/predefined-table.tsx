import { cn } from "@/lib/utils";
import type { FlatFieldValue, TableValue } from "../types";

function renderCell(v: FlatFieldValue) {
  if (v === null) return <span className="text-muted-foreground">—</span>;
  if (typeof v === "boolean")
    return (
      <span
        className={
          v ? "text-primary" : "text-muted-foreground"
        }
      >
        {v ? "✓" : "—"}
      </span>
    );
  return String(v);
}

export function PredefinedTable({
  value,
  className,
}: {
  value: TableValue;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-md border border-border/70 bg-card",
        className,
      )}
    >
      <table className="w-full text-[13px]">
        <thead className="border-b border-border/70 bg-muted/40">
          <tr>
            {value.headers.map((h, i) => (
              <th
                key={`${h}-${i}`}
                className="px-2.5 py-1.5 text-left font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {value.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/40 last:border-0 hover:bg-muted/20"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-2.5 py-1.5 align-top",
                    typeof cell === "number" &&
                      "text-right font-mono tabular-nums",
                  )}
                >
                  {renderCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
