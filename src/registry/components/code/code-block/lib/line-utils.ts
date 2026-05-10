import type { CodeBlockLineRange } from "../types";

export function splitToLines(value: string): string[] {
  if (value === "") return [];
  return value.split("\n");
}

export function lineCount(value: string): number {
  if (value === "") return 0;
  return value.split("\n").length;
}

export function rangeToLines(
  highlighted: Array<number | CodeBlockLineRange> | undefined,
): Set<number> {
  const out = new Set<number>();
  if (!highlighted) return out;
  for (const entry of highlighted) {
    if (typeof entry === "number") {
      if (entry > 0) out.add(entry);
      continue;
    }
    const { from, to } = entry;
    const start = Math.max(1, Math.min(from, to));
    const end = Math.max(from, to);
    for (let i = start; i <= end; i++) out.add(i);
  }
  return out;
}

export function gutterWidth(totalLines: number): number {
  if (totalLines < 10) return 1;
  if (totalLines < 100) return 2;
  if (totalLines < 1000) return 3;
  return 4;
}
