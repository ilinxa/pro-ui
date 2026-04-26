# Transports

Read this when configuring MCP transports — stdio for local servers, Streamable HTTP for remote/production, or SSE for backwards compatibility. Covers session lifecycle, DNS rebinding protection, CORS, resumability, and multi-node patterns.

## Table of Contents
1. [Transport Overview](#1-transport-overview)
2. [Stdio Transport](#2-stdio-transport)
3. [Streamable HTTP Transport](#3-streamable-http-transport)
4. [Streamable HTTP Session Lifecycle](#4-streamable-http-session-lifecycle)
5. [DNS Rebinding Protection](#5-dns-rebinding-protection)
6. [CORS Configuration](#6-cors-configuration)
7. [Resumability](#7-resumability)
8. [Stateless vs Stateful Servers](#8-stateless-vs-stateful-servers)
9. [SSE Backwards Compatibility](#9-sse-backwards-compatibility)
10. [Multi-Node Deployment](#10-multi-node-deployment)
11. [Transport Selection Guide](#11-transport-selection-guide)

---

## 1. Transport Overview

MCP supports three transports. The transport is the communication channel — the protocol (JSON-RPC 2.0) is the same on all transports.

| Transport | Status | Direction | Use Case |
|---|---|---|---|
| **stdio** | Stable | Bidirectional via stdin/stdout | Local servers, CLI tools, Claude Desktop |
| **Streamable HTTP** | Stable (since `2025-03-26`) | HTTP POST + optional SSE stream | Remote servers, production, multi-client |
| **SSE** (HTTP+SSE) | **Deprecated** (since `2025-03-26`) | HTTP POST + SSE | Legacy clients only |

**Default rule:** stdio for local, Streamable HTTP for remote. Never SSE for new servers.

---

## 2. Stdio Transport

Communication over standard input/output streams of a child process.

### How It Works

```
Host Application
  │
  ├── spawns child process ──► MCP Server
  │                            │
  │   stdin  ──────────────►   │  (client→server: JSON-RPC requests)
  │                            │
  │   stdout ◄──────────────   │  (server→client: JSON-RPC responses)
  │                            │
  │   stderr ◄──────────────   │  (logging only — not protocol)
  │
```

### TypeScript

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Python

```python
mcp.run(transport="stdio")

# Or low-level:
import mcp.server.stdio
async with mcp.server.stdio.stdio_server() as (read, write):
    await server.run(read, write, server.create_initialization_options())
```

### Critical Rules

- **NEVER write to stdout** — it's the JSON-RPC channel. Any non-JSON-RPC output corrupts the protocol.
- TS: No `console.log()`, no `process.stdout.write()`
- Python: No `print()` (default goes to stdout), no `sys.stdout.write()`
- Use `console.error()` (TS) or `print(..., file=sys.stderr)` (Python) for all logging
- MCP logging capability (`notifications/message`) is the preferred structured alternative

### When to Use

- Claude Desktop local server configuration
- Claude Code CLI (`claude mcp add`)
- VS Code / Cursor local MCP servers
- CLI tools and scripts
- Development and testing

---

## 3. Streamable HTTP Transport

Modern HTTP-based transport for remote/production servers.

### How It Works

```
Client                                 Server
  │                                      │
  │── POST /mcp ────────────────────────►│  JSON-RPC request(s)
  │◄── Response (JSON-RPC) ──────────── │  Immediate response
  │                                      │
  │── GET /mcp (SSE) ──────────────────►│  Open event stream
  │◄── SSE events ──────────────────── │  Server→client notifications
  │                                      │
  │── DELETE /mcp ─────────────────────►│  Close session
  │◄── 200 OK ─────────────────────── │
```

**Three HTTP methods on a single endpoint:**
- `POST /mcp` — Client sends JSON-RPC requests, server responds
- `GET /mcp` — Client opens SSE stream for server-initiated messages
- `DELETE /mcp` — Client closes the session

### TypeScript

```typescript
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (!sessionId || !transports.has(sessionId)) {
    // New session
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

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string;
  const transport = transports.get(sessionId);
  if (!transport) { res.status(404).end(); return; }
  await transport.handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string;
  const transport = transports.get(sessionId);
  if (transport) {
    await transport.close();
    transports.delete(sessionId);
  }
  res.status(200).end();
});
```

### Python

```python
mcp.run(transport="streamable-http", host="0.0.0.0", port=3000)
```

FastMCP handles all the HTTP endpoint setup automatically.

### When to Use

- Production deployments
- Remote servers (accessible over network)
- Multi-client servers
- Servers behind load balancers
- Cloudflare Workers, Docker, VPS deployments

---

## 4. Streamable HTTP Session Lifecycle

Step-by-step flow of a Streamable HTTP session:

### Step 1: Client sends `initialize` via POST

```http
POST /mcp HTTP/1.1
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
  "protocolVersion":"2025-11-25",
  "capabilities":{"roots":{"listChanged":true},"sampling":{}},
  "clientInfo":{"name":"my-client","version":"1.0.0"}
}}
```

### Step 2: Server responds with session ID

```http
HTTP/1.1 200 OK
Content-Type: application/json
mcp-session-id: abc-123-def

{"jsonrpc":"2.0","id":1,"result":{
  "protocolVersion":"2025-11-25",
  "capabilities":{"tools":{"listChanged":true}},
  "serverInfo":{"name":"my-server","version":"1.0.0"}
}}
```

### Step 3: Client sends `initialized` notification

```http
POST /mcp HTTP/1.1
Content-Type: application/json
mcp-session-id: abc-123-def

{"jsonrpc":"2.0","method":"notifications/initialized"}
```

### Step 4: Client opens SSE stream (optional)

```http
GET /mcp HTTP/1.1
mcp-session-id: abc-123-def
Accept: text/event-stream
```

Server keeps this connection open for pushing notifications (progress, logging, list changes).

### Step 5: Normal operation

Client sends tool calls, resource reads, etc. via POST with the session ID header.

### Step 6: Session cleanup

```http
DELETE /mcp HTTP/1.1
mcp-session-id: abc-123-def
```

### Key Rules

- First POST **must** be `initialize` — use `isInitializeRequest()` to check
- `mcp-session-id` header is required on all subsequent requests
- Server should reject requests with unknown session IDs (404)
- Server should reject non-initialize requests without a session ID (400)

---

## 5. DNS Rebinding Protection

Local Streamable HTTP servers are vulnerable to DNS rebinding attacks. A malicious website can resolve its domain to `127.0.0.1` and send requests to your local MCP server.

### TS SDK v2 Middleware (Recommended)

```typescript
import { createMcpExpressApp } from "@modelcontextprotocol/express";

// Auto-protection when binding to 127.0.0.1 (default)
const app = createMcpExpressApp();

// Auto-protection for localhost
const app = createMcpExpressApp({ host: "localhost" });

// When binding to 0.0.0.0 — provide allowed hosts explicitly
const app = createMcpExpressApp({
  host: "0.0.0.0",
  allowedHosts: ["localhost", "127.0.0.1", "myhost.local"],
});
```

### Manual Protection (v1.x)

If using v1.x without the Express middleware, validate the `Host` header:

```typescript
app.use((req, res, next) => {
  const host = req.headers.host;
  const allowedHosts = ["localhost", "127.0.0.1", "localhost:3000", "127.0.0.1:3000"];

  if (!host || !allowedHosts.includes(host)) {
    res.status(403).json({ error: "Forbidden: DNS rebinding protection" });
    return;
  }
  next();
});
```

### When Needed

- **Always** for servers listening on localhost/127.0.0.1
- **Not needed** for servers behind a reverse proxy with proper Host header validation
- **Not needed** for servers only accessible on private networks with auth

---

## 6. CORS Configuration

For Streamable HTTP servers accessed from web browsers:

```typescript
import cors from "cors";

app.use(cors({
  origin: ["https://your-client.example.com"],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "mcp-session-id", "Last-Event-ID"],
  exposedHeaders: ["mcp-session-id"],
  credentials: true,
}));
```

**Key headers to allow:**
- `mcp-session-id` — session tracking
- `Last-Event-ID` — SSE resumability
- `Content-Type` — JSON-RPC messages
- `Authorization` — OAuth tokens (if using auth)

---

## 7. Resumability

For production servers that need to survive client reconnects:

```typescript
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  eventStore: new InMemoryEventStore(),
});
```

### How Resumability Works

1. Server assigns an ID to each SSE event
2. If client's SSE connection drops, client reconnects with `Last-Event-ID` header
3. Server replays missed events from the event store
4. Client catches up without losing any notifications

### Custom Event Store

For multi-node deployments, implement a shared event store (Redis, database):

```typescript
interface EventStore {
  storeEvent(streamId: string, event: SSEEvent): Promise<string>;  // Returns event ID
  replayEvents(streamId: string, lastEventId: string): AsyncIterable<SSEEvent>;
}
```

The `InMemoryEventStore` works for single-node. For multi-node, you need a shared store.

---

## 8. Stateless vs Stateful Servers

### Stateful (Default)

Each session has its own state, managed by session ID:

```typescript
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),  // Each session gets a unique ID
});
```

- Sessions track their own tool state, context, etc.
- Requires session affinity in load-balanced deployments
- Session cleanup on DELETE or timeout

### Stateless

No session tracking — each request is independent:

```typescript
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,  // No sessions
});
```

- Simpler to scale (no affinity needed)
- No SSE stream (no session to associate with)
- Good for simple API-wrapper servers with no conversation state
- Cannot use features that require sessions (progress, notifications, logging)

---

## 9. SSE Backwards Compatibility

SSE is deprecated since spec `2025-03-26`, but some clients may only support it.

### Fallback Pattern: Try Streamable HTTP → Fall Back to SSE

Clients should attempt Streamable HTTP first. If the server returns an error (e.g., 404 on POST), fall back to SSE.

### Server Supporting Both (Not Recommended for New Servers)

If you must support legacy clients:

```typescript
// Check Accept header to determine transport
app.post("/mcp", async (req, res) => {
  // Streamable HTTP request handling
  // ...
});

// Legacy SSE endpoint
app.get("/sse", async (req, res) => {
  // SSE transport handling for legacy clients
  // Use SSEServerTransport from SDK
  // ...
});

app.post("/messages", async (req, res) => {
  // Legacy SSE message endpoint
  // ...
});
```

**Recommendation:** Don't implement SSE unless you have specific legacy clients that require it. Focus on Streamable HTTP.

---

## 10. Multi-Node Deployment

For Streamable HTTP servers behind a load balancer:

### Stateful Servers — Require Session Affinity

```
           ┌─── Node 1 (sessions A, B)
           │
LB ────────┼─── Node 2 (sessions C, D)
           │
           └─── Node 3 (sessions E, F)
```

- Configure sticky sessions in the load balancer (based on `mcp-session-id` header)
- Or use a shared session store (Redis) so any node can handle any session

### Stateless Servers — No Affinity Needed

```
           ┌─── Node 1
           │
LB ────────┼─── Node 2  (any node handles any request)
           │
           └─── Node 3
```

### Shared Event Store for Resumability

If using resumability across nodes, the event store must be shared:

```
Node 1 ──┐
Node 2 ──┼── Redis/DB (shared event store)
Node 3 ──┘
```

Each node writes events to the shared store; any node can replay events for any session.

---

## 11. Transport Selection Guide

| Question | → stdio | → Streamable HTTP |
|---|---|---|
| Is the server local to the client machine? | ✅ | |
| Does the client spawn the server process? | ✅ | |
| Is the server remote / on a different machine? | | ✅ |
| Do multiple clients connect simultaneously? | | ✅ |
| Is the server behind a load balancer? | | ✅ |
| Claude Desktop / Claude Code / VS Code local? | ✅ | |
| Cloudflare Workers / Docker / VPS? | | ✅ |
| Need HTTPS? | | ✅ |
| Simplest possible setup? | ✅ | |

**Both in one server?** You can support both transports in the same codebase:

```typescript
const args = process.argv.slice(2);

if (args.includes("--http")) {
  // Start Streamable HTTP server
  const app = express();
  // ... HTTP setup ...
  app.listen(3000);
} else {
  // Default to stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```
