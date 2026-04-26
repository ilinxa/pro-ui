# TypeScript Conventions

Read this when working with TypeScript MCP servers and need guidance on Zod schemas, error handling, tool annotations, display names, content types, or structured outputs.

## Table of Contents
1. [ESM & Strict Mode](#1-esm--strict-mode)
2. [Zod Schema Patterns](#2-zod-schema-patterns)
3. [inputSchema — Zod Object Shorthand](#3-inputschema--zod-object-shorthand)
4. [outputSchema — Structured Tool Outputs](#4-outputschema--structured-tool-outputs)
5. [Error Handling](#5-error-handling)
6. [Tool Annotations](#6-tool-annotations)
7. [Display Names](#7-display-names)
8. [Content Types](#8-content-types)
9. [The _meta Field](#9-the-_meta-field)
10. [Tool Naming Conventions](#10-tool-naming-conventions)

---

## 1. ESM & Strict Mode

All MCP TypeScript servers must use ESM (ES Modules):

```json
// package.json — REQUIRED
{ "type": "module" }
```

```json
// tsconfig.json — REQUIRED
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true
  }
}
```

**Import rules:**
```typescript
// ✅ Always include .js extension (even for .ts source files)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ❌ Missing extension — fails at runtime
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
```

This is a Node16 module resolution requirement — TypeScript compiles `.ts` to `.js`, so imports must reference the output extension.

---

## 2. Zod Schema Patterns

The SDK uses Zod for schema validation. `inputSchema` takes Zod types directly — NOT JSON Schema objects.

### Basic Types

```typescript
import { z } from "zod";

z.string()                          // string
z.number()                          // number (float)
z.number().int()                    // integer
z.boolean()                         // boolean
z.null()                            // null
```

### Descriptions (Critical for LLM tool use)

```typescript
// Always add .describe() — this is what the LLM reads to understand parameters
z.string().describe("The user's email address")
z.number().min(1).max(100).describe("Page number (1-100)")
z.boolean().describe("Whether to include archived items")
```

### Objects

```typescript
z.object({
  name: z.string().describe("User's full name"),
  age: z.number().int().min(0).describe("User's age in years"),
  email: z.string().email().describe("Valid email address"),
})
```

### Arrays

```typescript
z.array(z.string()).describe("List of tag names")
z.array(z.object({
  id: z.string(),
  value: z.number(),
})).describe("List of data points")
```

### Enums / Literals

```typescript
z.enum(["asc", "desc"]).describe("Sort direction")
z.literal("active").describe("Must be 'active'")
```

### Optional & Defaults

```typescript
z.string().optional().describe("Optional filter query")
z.number().default(10).describe("Results per page (default: 10)")
```

### Union Types

```typescript
z.union([z.string(), z.number()]).describe("ID as string or number")
z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), content: z.string() }),
  z.object({ type: z.literal("image"), url: z.string() }),
]).describe("Content block")
```

### Refinements

```typescript
z.string().min(1).max(500).describe("Query (1-500 chars)")
z.number().positive().describe("Positive number only")
z.string().regex(/^[A-Z]{2}$/).describe("Two-letter state code")
```

---

## 3. inputSchema — Zod Object Shorthand

The `registerTool` API takes an **object of Zod types** as `inputSchema`, not a Zod `z.object()`:

```typescript
// ✅ CORRECT — object shorthand (SDK wraps in z.object internally)
server.registerTool("search", {
  inputSchema: {
    query: z.string().describe("Search query"),
    limit: z.number().int().default(10).describe("Max results"),
  },
}, async ({ query, limit }) => { ... });

// ❌ WRONG — don't pass z.object() directly
server.registerTool("search", {
  inputSchema: z.object({
    query: z.string(),
    limit: z.number(),
  }),
}, handler);

// ❌ WRONG — don't pass JSON Schema
server.registerTool("search", {
  inputSchema: {
    type: "object",
    properties: { query: { type: "string" } },
  },
}, handler);
```

The handler receives destructured, validated arguments matching the schema keys.

---

## 4. outputSchema — Structured Tool Outputs

Since spec `2025-06-18`, tools can declare their output schema for client-side validation:

```typescript
server.registerTool("get-weather", {
  title: "Get Weather",
  description: "Get current weather for a city",
  inputSchema: {
    city: z.string().describe("City name"),
  },
  outputSchema: {
    temperature: z.number().describe("Temperature in Celsius"),
    conditions: z.string().describe("Weather conditions"),
    humidity: z.number().min(0).max(100).describe("Humidity percentage"),
  },
}, async ({ city }) => {
  const weather = await fetchWeather(city);
  return {
    // structuredContent is validated against outputSchema
    structuredContent: {
      temperature: weather.temp,
      conditions: weather.conditions,
      humidity: weather.humidity,
    },
    // content is the human-readable fallback
    content: [{
      type: "text",
      text: `${city}: ${weather.temp}°C, ${weather.conditions}`,
    }],
  };
});
```

**Rules:**
- `structuredContent` is validated against `outputSchema` — mismatches cause errors
- `content` is always required as fallback (for clients that don't support structured outputs)
- If `outputSchema` is defined and validation passes, clients use `structuredContent`
- If no `outputSchema`, only `content` is returned

---

## 5. Error Handling

### Expected Errors (Tool-Level)

For errors the LLM should see and handle (not found, invalid input, etc.):

```typescript
server.registerTool("fetch-data", { ... }, async ({ id }) => {
  const data = await db.find(id);
  if (!data) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Record with ID '${id}' not found.`,
      }],
    };
  }
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
});
```

`isError: true` signals to the LLM that the tool call failed — it can retry or adjust.

### Protocol Errors (Exceptions)

For unexpected server errors or protocol violations:

```typescript
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

// Throw McpError for protocol-level errors
server.registerTool("admin-only", { ... }, async (args) => {
  if (!isAuthorized) {
    throw new McpError(ErrorCode.InvalidRequest, "Unauthorized access");
  }
  // ...
});
```

**ErrorCode values:**

| Code | Name | Use When |
|---|---|---|
| `-32700` | `ParseError` | Invalid JSON received |
| `-32600` | `InvalidRequest` | Request structure is wrong |
| `-32601` | `MethodNotFound` | Unknown method called |
| `-32602` | `InvalidParams` | Invalid parameters |
| `-32603` | `InternalError` | Server-side failure |

### Pattern: Expected vs Unexpected

```typescript
// Expected: user-facing, LLM can handle → isError: true
// Unexpected: server bug, infrastructure → throw McpError or let it propagate
```

---

## 6. Tool Annotations

Hints for clients about tool behavior. These are **advisory** — clients may ignore them:

```typescript
server.registerTool("delete-file", {
  description: "Delete a file from the filesystem",
  inputSchema: { path: z.string().describe("File path to delete") },
  annotations: {
    destructiveHint: true,     // Modifies/deletes data
    idempotentHint: true,      // Safe to call multiple times
    readOnlyHint: false,       // Has side effects
    openWorldHint: true,       // Interacts with external systems (filesystem)
  },
}, handler);
```

| Annotation | Type | Default | Meaning |
|---|---|---|---|
| `readOnlyHint` | boolean | `false` | Tool has no side effects (safe to call freely) |
| `destructiveHint` | boolean | `true` | Tool may delete or irreversibly modify data |
| `idempotentHint` | boolean | `false` | Calling multiple times with same args = same result |
| `openWorldHint` | boolean | `true` | Tool interacts with external entities (APIs, files, DBs) |

**Annotation guidelines:**

| Tool Type | readOnly | destructive | idempotent | openWorld |
|---|---|---|---|---|
| GET API call | ✅ | ❌ | ✅ | ✅ |
| POST API call (create) | ❌ | ❌ | ❌ | ✅ |
| DELETE API call | ❌ | ✅ | ✅ | ✅ |
| Pure computation | ✅ | ❌ | ✅ | ❌ |
| Database write | ❌ | ❌/✅ | depends | ✅ |
| File read | ✅ | ❌ | ✅ | ✅ |

Clients may use these to:
- Show confirmation dialogs for destructive tools
- Auto-approve read-only tools
- Retry idempotent tools on failure

---

## 7. Display Names

The `title` field provides a human-friendly name for tools, resources, and prompts:

```typescript
server.registerTool("get_user_profile", {
  title: "Get User Profile",  // Human sees this
  description: "...",           // LLM sees this
  inputSchema: { ... },
}, handler);
```

- `name`: Machine identifier (lowercase, underscores/hyphens). Used in `tools/call`.
- `title`: Human-readable display name. Used in UIs.
- `description`: Instruction text for the LLM. Used for tool selection.

---

## 8. Content Types

Tool responses use the `content` array with typed blocks:

### TextContent

```typescript
{ type: "text", text: "Plain text result" }
```

### ImageContent

```typescript
{
  type: "image",
  data: "base64-encoded-image-data",
  mimeType: "image/png",
}
```

### EmbeddedResource

```typescript
{
  type: "resource",
  resource: {
    uri: "file:///path/to/data.json",
    text: '{"key": "value"}',
    mimeType: "application/json",
  },
}
```

### Multiple Content Blocks

```typescript
return {
  content: [
    { type: "text", text: "Analysis complete. Here are the results:" },
    { type: "image", data: chartBase64, mimeType: "image/png" },
    { type: "text", text: "Summary: 3 anomalies detected." },
  ],
};
```

---

## 9. The _meta Field

`_meta` carries data for the **client application** that is NOT exposed to the model:

```typescript
return {
  content: [{ type: "text", text: "File processed successfully" }],
  _meta: {
    processingTimeMs: 1234,
    cacheHit: false,
    requestId: "req-abc-123",
  },
};
```

**Use for:** Telemetry, cache headers, internal IDs, debugging info.
**Never use for:** Data the LLM needs to see — put that in `content`.

---

## 10. Tool Naming Conventions

Tool names are the primary interface for LLMs — clarity is critical:

```typescript
// ✅ Good names — clear, action-oriented, descriptive
"get_weather"           // verb + noun
"search_database"       // verb + target
"create_github_issue"   // verb + service + object
"list_active_users"     // verb + qualifier + noun

// ❌ Bad names — ambiguous, too generic
"process"               // Process what?
"data"                  // Not an action
"do_thing"              // Meaningless
"handle_request"        // Too generic
```

**Rules:**
- Use `snake_case` or `kebab-case` (prefer snake_case for consistency)
- Start with a verb: `get_`, `create_`, `delete_`, `search_`, `list_`, `update_`
- Include the domain if multiple services: `github_create_issue`, `slack_send_message`
- Keep under 64 characters
- The description matters more than the name for LLM tool selection — but a clear name helps
