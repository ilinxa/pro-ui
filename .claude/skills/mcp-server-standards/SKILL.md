---
name: mcp-server-standards
description: >
  Build MCP servers in TypeScript (primary) and Python (secondary) following the 2025-11-25 spec.
  Covers tools, resources, prompts, Streamable HTTP, stdio, OAuth 2.1, Zod schemas, structured outputs,
  deployment (Docker, Cloudflare Workers), client integration (Claude Desktop, Claude Code, VS Code, Cursor).
  Use when building, debugging, deploying, or configuring any MCP server or connecting MCP to a client.
  Triggers: MCP, Model Context Protocol, MCP server, MCP tool, MCP resource, registerTool, FastMCP,
  Streamable HTTP, stdio transport, MCP Inspector, claude_desktop_config, mcp.json, mcp-remote.
---

# MCP Server Standards

ilinxa standard · Model Context Protocol · TypeScript-first, Python secondary
Target: MCP spec `2025-11-25` · TS SDK v1.x (`@modelcontextprotocol/sdk` ^1.26.0) · Python SDK (`mcp` ^1.26.0)

## Quick Start — Minimal TS Server (stdio)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.registerTool("greet", {
  title: "Greet a user",
  inputSchema: { name: z.string().describe("User's name") },
  annotations: { readOnlyHint: true },
}, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}!` }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Server running on stdio");  // NEVER console.log on stdio
```

```json
// package.json essentials
{ "type": "module" }

// tsconfig.json essentials
{ "compilerOptions": { "target": "ES2022", "module": "Node16", "moduleResolution": "Node16", "strict": true } }
```

## Quick Start — Minimal Python Server (stdio)

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")

@mcp.tool()
async def greet(name: str) -> str:
    """Greet a user by name."""
    return f"Hello, {name}!"

if __name__ == "__main__":
    mcp.run(transport="stdio")  # NEVER print() on stdio — corrupts JSON-RPC
```

---

## Task Router

Read the appropriate reference(s) based on the user's task:

| User Task | Load Reference(s) |
|---|---|
| Understand MCP architecture, lifecycle, capabilities | [references/architecture.md](references/architecture.md) |
| Create a new TypeScript MCP server | [references/ts-setup.md](references/ts-setup.md) |
| Create a new Python MCP server | [references/python-setup.md](references/python-setup.md) |
| TypeScript conventions, Zod, errors, annotations | [references/ts-conventions.md](references/ts-conventions.md) |
| Build or register tools | [references/tools.md](references/tools.md) |
| Build or register resources | [references/resources.md](references/resources.md) |
| Build or register prompts | [references/prompts.md](references/prompts.md) |
| Configure transports (stdio, Streamable HTTP, SSE) | [references/transports.md](references/transports.md) |
| Implement sampling or elicitation | [references/sampling-elicitation.md](references/sampling-elicitation.md) |
| Add OAuth, auth, or token handling | [references/oauth.md](references/oauth.md) |
| Security hardening, threat model | [references/security.md](references/security.md) |
| Connect to Claude Desktop, Claude Code, VS Code, Cursor | [references/client-integration.md](references/client-integration.md) |
| Test or debug MCP server (Inspector, unit tests) | [references/testing.md](references/testing.md) |
| Deploy (Docker, Cloudflare Workers, VPS, Python) | [references/deployment.md](references/deployment.md) |
| Production hardening (health, scaling, monitoring) | [references/production.md](references/production.md) |
| Full new server project setup | [references/ts-setup.md](references/ts-setup.md) + [references/tools.md](references/tools.md) + [references/client-integration.md](references/client-integration.md) |
| Debug connection issues | [references/client-integration.md](references/client-integration.md) + [references/testing.md](references/testing.md) |

---

## Universal Rules — ALWAYS Follow

### SDK & Import Paths (TS)

The current production SDK is **v1.x** (`@modelcontextprotocol/sdk` ^1.26.0). Import paths:

```typescript
// Server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// Always include .js extension in imports (ESM requirement)
// Always "type": "module" in package.json
// Always target ES2022, module Node16 in tsconfig.json
```

**v2 monorepo** (separate packages: `@modelcontextprotocol/server`, `@modelcontextprotocol/client`, middleware for Express/Hono/Node) is in development. When v2 ships, add migration notes but keep v1.x as primary until ecosystem adoption is confirmed.

### SDK & Setup (Python)

```python
from mcp.server.fastmcp import FastMCP  # Official high-level API (built into mcp package)
# Pin: mcp>=1.25,<2  (v2 in development)
# Use uv for project management: uv init, uv add mcp
```

The standalone `fastmcp` package (by Jlowin, v2.14.5 / v3.0.0rc2) is a **separate** community framework — not the same as `mcp.server.fastmcp`. Do not confuse them.

### Transport Defaults

| Context | Transport | Rationale |
|---|---|---|
| Local / CLI / Claude Desktop | **stdio** | No network needed, process-level isolation |
| Remote / production / multi-client | **Streamable HTTP** | Modern, supports sessions, resumability |
| Legacy backwards compat only | SSE (deprecated) | Only if client doesn't support Streamable HTTP |

SSE transport is **deprecated** since spec `2025-03-26`. Never use for new servers.

### Logging — Critical Rule

| Transport | ❌ NEVER | ✅ ALWAYS |
|---|---|---|
| stdio (TS) | `console.log()` | `console.error()` or MCP logging capability |
| stdio (Python) | `print()` | `print(..., file=sys.stderr)` or `logging` module or `ctx.info()`/`ctx.error()` |
| HTTP (both) | — | Any logging is fine (doesn't interfere with HTTP responses) |

Writing to stdout on stdio **corrupts JSON-RPC messages** and breaks the server. This is the #1 beginner mistake.

### Tool Registration (TS) — Use `registerTool()`

```typescript
server.registerTool("tool-name", {
  title: "Human-Readable Title",
  description: "What this tool does",
  inputSchema: { param: z.string().describe("Param description") },  // Zod, NOT JSON Schema
  outputSchema: { ... },     // Optional: structured output (spec 2025-06-18+)
  annotations: {             // Optional: client behavior hints
    readOnlyHint: true,      // No side effects
    destructiveHint: false,  // Doesn't delete/modify data
    idempotentHint: true,    // Safe to retry
    openWorldHint: true,     // Interacts with external systems
  },
}, async (args) => ({
  content: [{ type: "text", text: "result" }],
}));
```

### Wire Format

All MCP communication is **JSON-RPC 2.0**. Notifications have no `id`. Protocol lifecycle: `initialize` → operate → `close`.

### Schema Validation

- **TS:** Zod v4 for new projects. v3.25+ supported via compat. `inputSchema` takes Zod types directly (object shorthand), NOT JSON Schema objects.
- **Python:** Type hints + docstrings. FastMCP converts them to JSON Schema automatically.

---

## Anti-Patterns — NEVER Do This

❌ `console.log()` on stdio → ✅ `console.error()`
❌ JSON Schema objects in `inputSchema` (TS) → ✅ Zod types: `{ name: z.string() }`
❌ Missing `"type": "module"` in package.json → ✅ Always add it
❌ Missing `.js` extensions in TS imports → ✅ Always include: `"...server/mcp.js"`
❌ Exposing secrets in tool outputs → ✅ Use `_meta` for client-only data, never in `content`
❌ Trusting tool descriptions from untrusted servers → ✅ Validate; descriptions can be injection attacks
❌ Using SSE for new servers → ✅ Streamable HTTP for remote, stdio for local
❌ Changing schemas between sessions (rug-pulling) → ✅ Stable schemas per version
❌ `from fastmcp import FastMCP` → ✅ `from mcp.server.fastmcp import FastMCP` (official SDK)

---

## Key Concepts Quick Reference

| Concept | Control | Description |
|---|---|---|
| **Tool** | Model-controlled | Function the LLM decides to call. Side effects possible. |
| **Resource** | Application-controlled | Read-only data. Client decides when to fetch. URI-addressed. |
| **Prompt** | User-controlled | Template the user selects via UI. Returns message array. |
| **Sampling** | Server-initiated | Server asks client's LLM to generate a completion. |
| **Elicitation** | Server-initiated | Server asks user for input (form or URL redirect). |
| **Roots** | Client-initiated | Client tells server about workspace paths. |
| **Tasks** | Server-managed | Async long-running ops (experimental, 2025-11-25). Not in this standard yet. |

### Notification Types

| Notification | Direction | Purpose |
|---|---|---|
| `notifications/tools/list_changed` | Server→Client | Tool list updated |
| `notifications/resources/list_changed` | Server→Client | Resource list updated |
| `notifications/prompts/list_changed` | Server→Client | Prompt list updated |
| `notifications/roots/list_changed` | Client→Server | Workspace roots changed |
| `notifications/progress` | Server→Client | Progress on long-running operation |
| `notifications/cancelled` | Either | Operation cancelled |
| `notifications/message` | Server→Client | Log message (MCP logging capability) |

### Spec Version Features

| Feature | Min Spec |
|---|---|
| Tools, Resources, Prompts, stdio, SSE | `2024-11-05` |
| Streamable HTTP (replaces SSE) | `2025-03-26` |
| `outputSchema`, OAuth 2.1, Elicitation | `2025-06-18` |
| Tasks, Extensions, CIMD, Auth Extensions | `2025-11-25` |

---

## Integration Notes

- **CLAUDE.md mandate:** `IMPORTANT: Always use the mcp-server-standards skill when building, configuring, or debugging MCP servers. Never use SSE for new servers. Always use registerTool() with Zod schemas in TypeScript.`
- **Platform target:** Claude Code CLI (primary), claude.ai (secondary — description exceeds 200 char limit)
- **Domains:** TypeScript, Python, MCP protocol, server development, deployment
