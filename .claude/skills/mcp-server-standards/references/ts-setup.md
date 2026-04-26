# TypeScript Server Setup

Read this when creating a new TypeScript MCP server from scratch. Covers project scaffolding, both transports (stdio + Streamable HTTP), session management, logging, and complete starter templates.

## Table of Contents
1. [Project Scaffolding](#1-project-scaffolding)
2. [Dependencies](#2-dependencies)
3. [McpServer Class](#3-mcpserver-class)
4. [Stdio Transport](#4-stdio-transport)
5. [Streamable HTTP Transport](#5-streamable-http-transport)
6. [Session Management](#6-session-management)
7. [Logging](#7-logging)
8. [MCP Logging Capability](#8-mcp-logging-capability)
9. [Complete Starter: Stdio Server](#9-complete-starter-stdio-server)
10. [Complete Starter: Streamable HTTP Server](#10-complete-starter-streamable-http-server)
11. [Common Starter Errors](#11-common-starter-errors)

---

## 1. Project Scaffolding

```bash
# Create project
mkdir my-mcp-server && cd my-mcp-server
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk zod
npm install -D @types/node typescript

# For Streamable HTTP, also install Express:
npm install express
npm install -D @types/express

# Create source directory
mkdir src
touch src/index.ts
```

### package.json — Required Settings

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-mcp-server": "./build/index.js"
  },
  "scripts": {
    "build": "tsc && chmod 755 build/index.js",
    "start": "node build/index.js",
    "dev": "tsc --watch"
  },
  "files": ["build"],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.26.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

**Critical:** `"type": "module"` is required. Without it, ESM imports fail at runtime.

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Critical settings:**
- `target: "ES2022"` — required for top-level await, modern JS features
- `module: "Node16"` + `moduleResolution: "Node16"` — required for ESM `.js` extension resolution
- `strict: true` — recommended for type safety with Zod schemas

---

## 2. Dependencies

| Package | Purpose | Required? |
|---|---|---|
| `@modelcontextprotocol/sdk` | MCP server + transport classes | Yes |
| `zod` | Schema validation (peer dep of SDK) | Yes |
| `express` | HTTP server for Streamable HTTP transport | Only for HTTP |
| `@types/node` | Node.js type definitions | Dev |
| `typescript` | TypeScript compiler | Dev |

### Zod Version

The SDK uses Zod v4 internally (`zod/v4`). For new projects, use Zod v4. Projects on v3.25+ work via backwards compat layer. Import normally:

```typescript
import { z } from "zod";
// or explicitly: import { z } from "zod/v4";
```

---

## 3. McpServer Class

The high-level server class that handles protocol negotiation, capability declaration, and request routing:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "my-server",        // Server name (shown during initialize)
  version: "1.0.0",         // Server version
});
```

The `McpServer` class automatically:
- Handles the `initialize` handshake
- Declares capabilities based on what you register (tools, resources, prompts)
- Routes incoming requests to the right handler
- Manages the JSON-RPC message protocol

After creating the server, register your tools/resources/prompts, then connect to a transport.

---

## 4. Stdio Transport

For local servers that communicate over stdin/stdout (process pipes):

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

**When to use:** Local development, Claude Desktop, Claude Code, CLI tools.

**How it works:**
- Client spawns the server as a child process
- Messages flow over stdin (client→server) and stdout (server→client)
- stderr is available for logging (never corrupts the protocol)

**Critical rule:** NEVER write to stdout. No `console.log()`, no `process.stdout.write()`. Use `console.error()` for all logging.

---

## 5. Streamable HTTP Transport

For remote servers accessible over HTTP:

```typescript
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: Map<string, StreamableHTTPServerTransport> = new Map();

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId) {
    // New session — create transport
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    const server = createServer();  // Your server factory
    await server.connect(transport);
    transports.set(transport.sessionId!, transport);

    await transport.handleRequest(req, res);
  } else {
    // Existing session — route to transport
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    await transport.handleRequest(req, res);
  }
});

app.get("/mcp", async (req, res) => {
  // SSE endpoint for server-to-client messages
  const sessionId = req.headers["mcp-session-id"] as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  await transport.handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  // Session cleanup
  const sessionId = req.headers["mcp-session-id"] as string;
  const transport = transports.get(sessionId);
  if (transport) {
    await transport.close();
    transports.delete(sessionId);
  }
  res.status(200).end();
});

app.listen(3000, () => console.error("MCP HTTP server on port 3000"));
```

**When to use:** Remote/production deployments, multi-client servers, web-accessible tools.

**Key concepts:**
- Client sends `POST /mcp` with JSON-RPC messages
- `mcp-session-id` header tracks the session
- `GET /mcp` opens an SSE stream for server→client messages
- `DELETE /mcp` closes the session
- First request should be `initialize` — check with `isInitializeRequest()`

---

## 6. Session Management

### Stateful Sessions (default)
Each client gets a unique session with its own state:

```typescript
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
});
```

### Stateless Mode
For simple servers that don't need session state:

```typescript
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,  // No session tracking
});
```

### Resumability
For production servers that need to survive reconnects:

```typescript
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
  eventStore: new InMemoryEventStore(),  // Enables resumability
});
```

With `eventStore`, clients can reconnect and replay missed events using the `Last-Event-ID` header.

---

## 7. Logging

### Stdio Servers — stderr Only

```typescript
// ❌ NEVER — corrupts JSON-RPC on stdout
console.log("Processing...");
process.stdout.write("debug info");

// ✅ ALWAYS — stderr is safe
console.error("Processing...");
console.error("[DEBUG]", JSON.stringify(debugData));
```

### HTTP Servers — Anything Works

```typescript
// ✅ All fine for HTTP transport
console.log("Request received");
console.error("Error occurred");
```

---

## 8. MCP Logging Capability

The protocol provides structured logging that works on ALL transports:

```typescript
// The McpServer automatically declares logging capability
// Clients can set minimum level via logging/setLevel

// In your tool handlers, use server.sendLoggingMessage():
server.registerTool("process-data", { ... }, async (args) => {
  // Send structured log to client
  await server.server.sendLoggingMessage({
    level: "info",
    logger: "process-data",
    data: "Starting data processing...",
  });

  // ... do work ...

  await server.server.sendLoggingMessage({
    level: "warning",
    logger: "process-data",
    data: "Large dataset detected, may take longer",
  });

  return { content: [{ type: "text", text: "Done" }] };
});
```

**Severity levels** (RFC 5424): `debug` | `info` | `notice` | `warning` | `error` | `critical` | `alert` | `emergency`

---

## 9. Complete Starter: Stdio Server

```typescript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server
const server = new McpServer({
  name: "example-stdio-server",
  version: "1.0.0",
});

// Register a tool
server.registerTool("hello", {
  title: "Say Hello",
  description: "Returns a greeting for the given name",
  inputSchema: {
    name: z.string().describe("Name to greet"),
  },
  annotations: {
    readOnlyHint: true,
  },
}, async ({ name }) => ({
  content: [{
    type: "text",
    text: `Hello, ${name}! Welcome to MCP.`,
  }],
}));

// Register a resource
server.resource(
  "server-info",
  "info://server",
  { title: "Server Information", description: "Basic server metadata" },
  async () => ({
    contents: [{
      uri: "info://server",
      text: JSON.stringify({
        name: "example-stdio-server",
        version: "1.0.0",
        uptime: process.uptime(),
      }),
    }],
  })
);

// Connect to stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Example stdio server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

**Build and run:**
```bash
npm run build
node build/index.js  # Or configure in Claude Desktop
```

---

## 10. Complete Starter: Streamable HTTP Server

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/protocol.js";
import express from "express";
import { z } from "zod";
import { randomUUID } from "crypto";

function createServer(): McpServer {
  const server = new McpServer({
    name: "example-http-server",
    version: "1.0.0",
  });

  server.registerTool("hello", {
    title: "Say Hello",
    description: "Returns a greeting",
    inputSchema: { name: z.string().describe("Name to greet") },
    annotations: { readOnlyHint: true },
  }, async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  }));

  return server;
}

const app = express();
app.use(express.json());

const transports = new Map<string, StreamableHTTPServerTransport>();

// Handle POST (JSON-RPC requests from client)
app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (!sessionId || !transports.has(sessionId)) {
    // Verify this is an initialize request for new sessions
    if (!isInitializeRequest(req.body)) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32600, message: "First request must be initialize" },
        id: null,
      });
      return;
    }

    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    const server = createServer();
    await server.connect(transport);
    transports.set(transport.sessionId!, transport);
  } else {
    transport = transports.get(sessionId)!;
  }

  await transport.handleRequest(req, res);
});

// Handle GET (SSE stream for server→client messages)
app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  await transport.handleRequest(req, res);
});

// Handle DELETE (session cleanup)
app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string;
  const transport = transports.get(sessionId);
  if (transport) {
    await transport.close();
    transports.delete(sessionId);
  }
  res.status(200).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.error(`MCP Streamable HTTP server running on port ${PORT}`);
});
```

**Build and run:**
```bash
npm run build
node build/index.js
# Test: curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

---

## 11. Common Starter Errors

| Error | Cause | Fix |
|---|---|---|
| `ERR_MODULE_NOT_FOUND` | Missing `.js` extension in imports | Add `.js` to all import paths |
| `SyntaxError: Cannot use import` | Missing `"type": "module"` | Add to package.json |
| `Error: Cannot find module` | Wrong `module`/`moduleResolution` | Use `Node16` for both in tsconfig |
| Server hangs, no output | Using `console.log` on stdio | Switch to `console.error` |
| `TypeError: server.tool is not a function` | Using old API on new SDK | Use `registerTool()` instead of `.tool()` |
| JSON parse errors on client | `console.log` corrupting stdout | Remove ALL stdout writes |
| Session not found (HTTP) | Missing `mcp-session-id` header | Ensure client sends session header after init |
| `EADDRINUSE` | Port already in use | Change PORT or kill existing process |
| Zod validation errors | Schema type mismatch | Check `.describe()` annotations match expected types |

### Pre-Flight Checklist

Before running your server:
- [ ] `"type": "module"` in package.json
- [ ] tsconfig: `target: "ES2022"`, `module: "Node16"`, `moduleResolution: "Node16"`
- [ ] All imports have `.js` extension
- [ ] No `console.log()` in stdio server code
- [ ] `npm run build` succeeds with no errors
- [ ] Dependencies installed: `@modelcontextprotocol/sdk`, `zod`
