# Tools

Read this when building, registering, or debugging MCP tools. Covers registration in both TS and Python, input/output validation, structured outputs, annotations, error handling, progress reporting, cancellation, and real-world patterns.

## Table of Contents
1. [What Tools Are](#1-what-tools-are)
2. [Tool Registration (TypeScript)](#2-tool-registration-typescript)
3. [Tool Registration (Python)](#3-tool-registration-python)
4. [Input Validation](#4-input-validation)
5. [Output Formats](#5-output-formats)
6. [Structured Outputs with outputSchema](#6-structured-outputs-with-outputschema)
7. [Error Handling Patterns](#7-error-handling-patterns)
8. [Tool Annotations](#8-tool-annotations)
9. [Progress Reporting](#9-progress-reporting)
10. [Cancellation Handling](#10-cancellation-handling)
11. [Async & Long-Running Patterns](#11-async--long-running-patterns)
12. [Real-World Examples](#12-real-world-examples)

---

## 1. What Tools Are

Tools are **model-controlled** functions. The LLM decides when to call them based on the tool's name, description, and input schema. Tools can have side effects (create, update, delete data).

**Protocol methods:**
- `tools/list` — client discovers available tools
- `tools/call` — client invokes a tool
- `notifications/tools/list_changed` — server notifies when tools change

**Key design rule:** The `description` is what the LLM reads to decide whether to use your tool. Write it like you're explaining the tool to a capable but literal-minded coworker. Be specific about what it does, what it returns, and any limitations.

---

## 2. Tool Registration (TypeScript)

Use `registerTool()` — the current documented API:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.registerTool("search_documents", {
  title: "Search Documents",
  description: "Search the document database by query. Returns matching documents with titles and snippets.",
  inputSchema: {
    query: z.string().min(1).describe("Search query text"),
    limit: z.number().int().min(1).max(50).default(10).describe("Max results (1-50, default 10)"),
    category: z.enum(["all", "reports", "articles", "memos"]).default("all")
      .describe("Filter by document category"),
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
  },
}, async ({ query, limit, category }) => {
  const results = await searchDB(query, { limit, category });

  return {
    content: [{
      type: "text",
      text: results.length > 0
        ? results.map(r => `- ${r.title}: ${r.snippet}`).join("\n")
        : "No documents found matching your query.",
    }],
  };
});
```

### The Older .tool() API

Still works but `registerTool()` is the current standard:

```typescript
// Older API — still functional, not recommended for new code
server.tool("search_documents", { query: z.string() }, async ({ query }) => ({
  content: [{ type: "text", text: "result" }],
}));
```

---

## 3. Tool Registration (Python)

Use the `@mcp.tool()` decorator with FastMCP:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")

@mcp.tool()
async def search_documents(
    query: str,
    limit: int = 10,
    category: str = "all",
) -> str:
    """Search the document database by query. Returns matching documents with titles and snippets.

    Args:
        query: Search query text (non-empty).
        limit: Maximum results to return (1-50, default 10).
        category: Filter by category — all, reports, articles, or memos.
    """
    results = await search_db(query, limit=limit, category=category)
    if not results:
        return "No documents found matching your query."
    return "\n".join(f"- {r.title}: {r.snippet}" for r in results)
```

**FastMCP automatic mapping:**
- Function name → tool name
- First docstring line → description
- `Args:` section → parameter descriptions
- Type hints → JSON Schema types
- Default values → schema defaults

---

## 4. Input Validation

### TypeScript (Zod)

Validation is automatic — Zod schemas validate before the handler runs:

```typescript
inputSchema: {
  email: z.string().email().describe("Valid email address"),
  age: z.number().int().min(0).max(150).describe("Age in years"),
  tags: z.array(z.string()).max(10).describe("Up to 10 tags"),
  config: z.object({
    verbose: z.boolean().default(false),
    format: z.enum(["json", "csv", "text"]).default("json"),
  }).optional().describe("Optional configuration"),
}
```

If validation fails, the SDK returns a JSON-RPC error automatically — your handler never runs.

### Python (Type Hints)

FastMCP validates types at runtime:

```python
@mcp.tool()
async def create_user(
    name: str,
    email: str,
    age: int = 0,
    roles: list[str] = None,
) -> str:
    """Create a new user.

    Args:
        name: User's full name (required).
        email: Valid email address (required).
        age: User's age (default 0).
        roles: List of role names to assign.
    """
    roles = roles or []
    # Implementation...
```

For complex validation beyond type hints, validate inside the handler and return error messages.

---

## 5. Output Formats

### content Array (Required)

Every tool response must include a `content` array with typed blocks:

```typescript
// Text
return { content: [{ type: "text", text: "Result text" }] };

// Image
return { content: [{
  type: "image",
  data: base64EncodedData,
  mimeType: "image/png",
}] };

// Multiple blocks
return { content: [
  { type: "text", text: "Chart generated:" },
  { type: "image", data: chartData, mimeType: "image/png" },
  { type: "text", text: "3 anomalies found in dataset." },
] };

// Embedded resource
return { content: [{
  type: "resource",
  resource: {
    uri: "data://result.json",
    text: JSON.stringify(result),
    mimeType: "application/json",
  },
}] };
```

### Python Output

FastMCP wraps return values automatically:

```python
# String return → TextContent
@mcp.tool()
async def simple() -> str:
    return "Hello"  # Becomes content: [{ type: "text", text: "Hello" }]

# Dict with json_response → structured content
@mcp.tool(json_response=True)
async def structured() -> dict:
    return {"key": "value"}
```

---

## 6. Structured Outputs with outputSchema

Since spec `2025-06-18`, tools can declare output schemas for client-side validation:

### TypeScript

```typescript
server.registerTool("get_weather", {
  title: "Get Weather",
  description: "Get current weather for a city",
  inputSchema: {
    city: z.string().describe("City name"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius").describe("Temperature units"),
  },
  outputSchema: {
    temperature: z.number().describe("Current temperature"),
    conditions: z.string().describe("Weather conditions description"),
    humidity: z.number().min(0).max(100).describe("Humidity percentage"),
    wind_speed: z.number().describe("Wind speed in km/h"),
  },
}, async ({ city, units }) => {
  const data = await fetchWeatherAPI(city, units);

  return {
    structuredContent: {
      temperature: data.temp,
      conditions: data.conditions,
      humidity: data.humidity,
      wind_speed: data.wind,
    },
    content: [{
      type: "text",
      text: `${city}: ${data.temp}°${units === "celsius" ? "C" : "F"}, ${data.conditions}`,
    }],
  };
});
```

**Rules:**
- `structuredContent` is validated against `outputSchema` — mismatches throw errors
- `content` is always required as fallback for older clients
- Clients supporting structured outputs use `structuredContent`; others fall back to `content`

### Python

```python
@mcp.tool(json_response=True)
async def get_weather(city: str) -> dict:
    """Get current weather for a city.

    Args:
        city: City name to look up.
    """
    data = await fetch_weather(city)
    return {
        "temperature": data.temp,
        "conditions": data.conditions,
        "humidity": data.humidity,
    }
```

---

## 7. Error Handling Patterns

### Expected Errors — isError: true (TS)

For errors the LLM should see and potentially handle:

```typescript
server.registerTool("read_file", { ... }, async ({ path }) => {
  try {
    const content = await fs.readFile(path, "utf-8");
    return { content: [{ type: "text", text: content }] };
  } catch (err) {
    if (err.code === "ENOENT") {
      return {
        isError: true,
        content: [{ type: "text", text: `File not found: ${path}` }],
      };
    }
    if (err.code === "EACCES") {
      return {
        isError: true,
        content: [{ type: "text", text: `Permission denied: ${path}` }],
      };
    }
    // Unexpected errors — let them propagate as protocol errors
    throw err;
  }
});
```

### Expected Errors — Python

```python
@mcp.tool()
async def read_file(path: str) -> str:
    """Read a file's contents.

    Args:
        path: Path to the file.
    """
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        return f"Error: File not found at {path}"
    except PermissionError:
        return f"Error: Permission denied for {path}"
```

### Protocol Errors — McpError (TS)

For protocol-level failures:

```typescript
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

throw new McpError(ErrorCode.InvalidParams, "Parameter 'limit' must be positive");
throw new McpError(ErrorCode.InternalError, "Database connection failed");
```

### Error Strategy Summary

| Error Type | How to Handle | LLM Sees It? |
|---|---|---|
| Input validation failure | Zod/type hints catch it automatically | Yes (error response) |
| Expected failure (not found, denied) | Return `isError: true` with message | Yes (can retry/adjust) |
| Unexpected failure (bugs, infra) | Throw `McpError` or let propagate | Yes (generic error) |
| Sensitive failure (secrets leaked) | Catch, return sanitized message | Only sanitized message |

---

## 8. Tool Annotations

Behavioral hints for clients. These are advisory — clients MAY ignore them:

```typescript
annotations: {
  readOnlyHint: true,      // No side effects — safe to auto-approve
  destructiveHint: false,  // Doesn't delete/irreversibly modify
  idempotentHint: true,    // Multiple calls = same result
  openWorldHint: true,     // Interacts with external systems
}
```

**Important:** Annotations are **hints from the server**, not guarantees. Clients should not rely on them for security decisions. They're primarily for UX (auto-approve read-only, confirm destructive).

---

## 9. Progress Reporting

For long-running tools, report progress via `progressToken`:

### How It Works

1. Client includes `_meta.progressToken` in the tool call request
2. Server sends `notifications/progress` with that token
3. Client displays progress to the user

### TypeScript Pattern

```typescript
server.registerTool("process_batch", {
  description: "Process a batch of records",
  inputSchema: {
    records: z.array(z.string()).describe("Record IDs to process"),
  },
}, async ({ records }, { meta }) => {
  const progressToken = meta?.progressToken;
  const total = records.length;

  for (let i = 0; i < total; i++) {
    await processRecord(records[i]);

    // Report progress if client requested it
    if (progressToken) {
      await server.server.notification({
        method: "notifications/progress",
        params: {
          progressToken,
          progress: i + 1,
          total,
          message: `Processing record ${i + 1} of ${total}`,
        },
      });
    }
  }

  return {
    content: [{ type: "text", text: `Processed ${total} records.` }],
  };
});
```

### Progress Notification Format

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "token-from-request",
    "progress": 50,
    "total": 100,
    "message": "Processing file 50 of 100..."
  }
}
```

- `progress` and `total` are numbers (total is optional)
- `message` is an optional human-readable status string

---

## 10. Cancellation Handling

Clients can cancel long-running requests via `notifications/cancelled`:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": {
    "requestId": 42,
    "reason": "User cancelled the operation"
  }
}
```

### TypeScript Pattern

```typescript
server.registerTool("long_operation", { ... }, async (args, { signal }) => {
  for (const item of items) {
    // Check for cancellation
    if (signal?.aborted) {
      return {
        isError: true,
        content: [{ type: "text", text: "Operation cancelled by user." }],
      };
    }
    await processItem(item);
  }
  return { content: [{ type: "text", text: "Done" }] };
});
```

**Best practice:** Check for cancellation in loops and between expensive operations. Clean up partial work before returning.

---

## 11. Async & Long-Running Patterns

### Pattern: Timeout Guard

```typescript
server.registerTool("fetch_data", { ... }, async ({ url }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.text();
    return { content: [{ type: "text", text: data }] };
  } catch (err) {
    if (err.name === "AbortError") {
      return { isError: true, content: [{ type: "text", text: "Request timed out after 30s" }] };
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
});
```

### Pattern: Batch with Progress

```typescript
server.registerTool("batch_process", {
  description: "Process multiple items with progress reporting",
  inputSchema: {
    items: z.array(z.string()).describe("Items to process"),
    concurrency: z.number().int().min(1).max(10).default(3).describe("Parallel workers"),
  },
}, async ({ items, concurrency }, { meta }) => {
  const results = [];
  const progressToken = meta?.progressToken;

  // Process in chunks
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(processItem));
    results.push(...chunkResults);

    if (progressToken) {
      await server.server.notification({
        method: "notifications/progress",
        params: {
          progressToken,
          progress: Math.min(i + concurrency, items.length),
          total: items.length,
        },
      });
    }
  }

  return {
    content: [{ type: "text", text: `Processed ${results.length} items.` }],
  };
});
```

---

## 12. Real-World Examples

### API Wrapper (TS)

```typescript
server.registerTool("github_create_issue", {
  title: "Create GitHub Issue",
  description: "Create a new issue in a GitHub repository",
  inputSchema: {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    title: z.string().min(1).describe("Issue title"),
    body: z.string().optional().describe("Issue body (markdown)"),
    labels: z.array(z.string()).optional().describe("Labels to apply"),
  },
  annotations: { destructiveHint: false, openWorldHint: true },
}, async ({ owner, repo, title, body, labels }) => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body, labels }),
  });

  if (!response.ok) {
    return {
      isError: true,
      content: [{ type: "text", text: `GitHub API error: ${response.status} ${response.statusText}` }],
    };
  }

  const issue = await response.json();
  return {
    content: [{ type: "text", text: `Created issue #${issue.number}: ${issue.html_url}` }],
  };
});
```

### Database Query (Python)

```python
@mcp.tool()
async def query_database(sql: str) -> str:
    """Execute a read-only SQL query against the application database.

    Only SELECT statements are allowed. Returns results as formatted text.

    Args:
        sql: SQL SELECT query to execute.
    """
    sql_stripped = sql.strip().upper()
    if not sql_stripped.startswith("SELECT"):
        return "Error: Only SELECT queries are allowed."

    ctx = mcp.get_context()
    try:
        results = await ctx.db.fetch(sql)
        if not results:
            return "Query returned no results."
        # Format as table
        headers = list(results[0].keys())
        rows = ["\t".join(str(r[h]) for h in headers) for r in results]
        return "\t".join(headers) + "\n" + "\n".join(rows)
    except Exception as e:
        return f"Query error: {str(e)}"
```

### File Processor (TS)

```typescript
server.registerTool("analyze_csv", {
  title: "Analyze CSV File",
  description: "Read and analyze a CSV file, returning summary statistics",
  inputSchema: {
    path: z.string().describe("Path to CSV file"),
    columns: z.array(z.string()).optional().describe("Specific columns to analyze"),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
}, async ({ path, columns }, { meta }) => {
  const progressToken = meta?.progressToken;

  // Read file
  if (progressToken) {
    await server.server.notification({
      method: "notifications/progress",
      params: { progressToken, progress: 0, total: 3, message: "Reading file..." },
    });
  }

  const raw = await fs.readFile(path, "utf-8");
  const rows = parseCSV(raw);

  // Analyze
  if (progressToken) {
    await server.server.notification({
      method: "notifications/progress",
      params: { progressToken, progress: 1, total: 3, message: "Analyzing..." },
    });
  }

  const stats = computeStats(rows, columns);

  // Format
  if (progressToken) {
    await server.server.notification({
      method: "notifications/progress",
      params: { progressToken, progress: 3, total: 3, message: "Done" },
    });
  }

  return {
    content: [{
      type: "text",
      text: `CSV Analysis for ${path}:\n- Rows: ${rows.length}\n- Columns: ${stats.columns.join(", ")}\n${stats.summary}`,
    }],
  };
});
```
