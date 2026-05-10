import type { CodeBlockAnnotation, TerminalLine } from "./types";

export const SAMPLE_TS = `import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Counter() {
  const [n, setN] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => setN(n - 1)}>−</Button>
      <span className="font-mono">{n}</span>
      <Button onClick={() => setN(n + 1)}>+</Button>
    </div>
  );
}
`;

export const SAMPLE_TS_HIGHLIGHTED = [5, 6, 7];

export const SAMPLE_JSON = `{
  "name": "ilinxa-ui-pro",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "next": "^16.2.0",
    "react": "^19.2.0",
    "shiki": "^4.0.2",
    "@codemirror/state": "^6.6.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint"
  }
}
`;

export const SAMPLE_PYTHON = `from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    email: str | None = None

def greet(user: User) -> str:
    if user.email:
        return f"Hello {user.name} <{user.email}>"
    return f"Hello {user.name}"

users = [
    User(id=1, name="Ada", email="ada@example.com"),
    User(id=2, name="Linus"),
]

for u in users:
    print(greet(u))
`;

export const SAMPLE_LONG_JSON = `{
  "type": "FeatureCollection",
  "features": [
    ${Array.from(
      { length: 60 },
      (_, i) =>
        `{ "type": "Feature", "id": ${i + 1}, "geometry": { "type": "Point", "coordinates": [${(Math.random() * 360 - 180).toFixed(4)}, ${(Math.random() * 180 - 90).toFixed(4)}] } }`,
    ).join(",\n    ")}
  ]
}
`;

export const SAMPLE_TERMINAL: TerminalLine[] = [
  { kind: "input", text: "$ pnpm install" },
  { kind: "output", text: "Resolving dependencies..." },
  { kind: "output", text: "Adding 247 packages from 38 contributors..." },
  { kind: "output", text: "✓ Done in 8.3s" },
  { kind: "input", text: "$ pnpm dev" },
  { kind: "output", text: "" },
  { kind: "output", text: "  ▲ Next.js 16.2.0 (Turbopack)" },
  { kind: "output", text: "  - Local:    http://localhost:3000" },
  { kind: "output", text: "  - Network:  http://192.168.1.4:3000" },
  { kind: "output", text: "" },
  { kind: "output", text: " ✓ Ready in 1.1s" },
  { kind: "input", text: "$ pnpm build" },
  { kind: "error", text: "✗ Failed to compile" },
  { kind: "error", text: "  Type error: Property 'foo' does not exist on type 'Bar'" },
];

export const SAMPLE_ERROR_TRACE = `TypeError: Cannot read property 'name' of undefined
    at processUser (/app/src/users.ts:7:24)
    at /app/src/index.ts:15:3
    at Array.map (<anonymous>)
    at greetAll (/app/src/index.ts:14:18)
    at Object.<anonymous> (/app/src/index.ts:42:1)
    at Module._compile (node:internal/modules/cjs/loader.js:1234:30)
`;

export const SAMPLE_ERROR_ANNOTATIONS: CodeBlockAnnotation[] = [
  { line: 1, type: "error", message: "Cannot read property 'name' of undefined" },
  { line: 4, type: "warn", message: "Unhandled rejection in greetAll" },
];

export const SAMPLE_EDIT_DEFAULT = `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

greet("ilinxa");
`;

/** Helper for the streaming demo — emit value in chunks. */
export function chunkString(s: string, size = 10): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) {
    out.push(s.slice(i, i + size));
  }
  return out;
}
