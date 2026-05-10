import type { TerminalLine, TerminalLineKind } from "../types";

const PROMPT_PATTERNS = ["$ ", "> ", "# "] as const;

export function promptDetect(line: string): TerminalLineKind {
  for (const p of PROMPT_PATTERNS) {
    if (line.startsWith(p)) return "input";
  }
  return "output";
}

export function parseTerminalLines(value: string): TerminalLine[] {
  if (value === "") return [];
  return value.split("\n").map((text) => ({ kind: promptDetect(text), text }));
}

export function promptPrefix(text: string): { prefix: string; rest: string } {
  for (const p of PROMPT_PATTERNS) {
    if (text.startsWith(p)) {
      return { prefix: p, rest: text.slice(p.length) };
    }
  }
  return { prefix: "", rest: text };
}

export function joinTerminalLines(lines: TerminalLine[]): string {
  return lines.map((l) => l.text).join("\n");
}
