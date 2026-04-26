# MCP Architecture & Concepts

Read this when the user needs to understand how MCP works, the protocol lifecycle, capability negotiation, primitives comparison, notification types, pagination, or spec version targeting.

## Table of Contents
1. [What MCP Is (and Is Not)](#1-what-mcp-is-and-is-not)
2. [Architecture: Hosts, Clients, Servers](#2-architecture-hosts-clients-servers)
3. [JSON-RPC 2.0 Wire Format](#3-json-rpc-20-wire-format)
4. [Protocol Lifecycle](#4-protocol-lifecycle)
5. [Capability Negotiation](#5-capability-negotiation)
6. [Server Primitives: Tools vs Resources vs Prompts](#6-server-primitives-tools-vs-resources-vs-prompts)
7. [Client Capabilities: Roots, Sampling, Elicitation](#7-client-capabilities-roots-sampling-elicitation)
8. [Notifications](#8-notifications)
9. [Pagination](#9-pagination)
10. [MCP Logging Capability](#10-mcp-logging-capability)
11. [Spec Version Targeting](#11-spec-version-targeting)

---

## 1. What MCP Is (and Is Not)

**MCP IS:**
- An open protocol for connecting LLM applications to external data sources, tools, and services
- A standardized JSON-RPC 2.0 based communication layer between AI hosts and capability providers
- A way to solve the N×M integration problem (N tools × M model frontends → N+M with MCP)
- Inspired by the Language Server Protocol (LSP) but for AI context, not programming languages
- Donated to the Agentic AI Foundation (Linux Foundation) in Dec 2025

**MCP IS NOT:**
- A REST API framework — MCP is a stateful protocol with sessions, not request/response HTTP
- A replacement for your existing APIs — MCP wraps your APIs as tools/resources
- An AI model or agent framework — MCP is the transport/protocol layer only
- Limited to Anthropic/Claude — any LLM host can implement an MCP client

---

## 2. Architecture: Hosts, Clients, Servers

```
┌─────────────────────────────────────────┐
│              HOST APPLICATION            │
│  (Claude Desktop, IDE, AI Agent)         │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ MCP      │  │ MCP      │  │ MCP    │ │
│  │ Client 1 │  │ Client 2 │  │ Client │ │
│  └────┬─────┘  └────┬─────┘  └───┬────┘ │
└───────┼──────────────┼────────────┼──────┘
        │              │            │
   ┌────┴─────┐  ┌─────┴────┐ ┌────┴─────┐
   │ MCP      │  │ MCP      │ │ MCP      │
   │ Server A │  │ Server B │ │ Server C │
   │ (Files)  │  │ (GitHub) │ │ (DB)     │
   └──────────┘  └──────────┘ └──────────┘
```

**Three layers:**

| Component | Role | Responsibility |
|---|---|---|
| **Host** | Container application | Creates clients, manages security/consent, coordinates between clients |
| **Client** | Protocol endpoint inside host | Maintains 1:1 connection with a server, handles protocol negotiation |
| **Server** | Capability provider | Exposes tools, resources, prompts to the client over a transport |

**Key constraint:** Each client connects to exactly ONE server. A host may create multiple clients to connect to multiple servers.

**Communication is bidirectional:**
- Client → Server: tool calls, resource reads, prompt gets, initialize, ping
- Server → Client: sampling requests, elicitation requests, roots list requests, notifications, logging

---

## 3. JSON-RPC 2.0 Wire Format

All MCP messages follow JSON-RPC 2.0:

### Request (expects a response)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "city": "London" }
  }
}
```

### Success Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "Sunny, 22°C" }]
  }
}
```

### Error Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": { "details": "Missing required field: city" }
  }
}
```

### Notification (no response expected — no `id`)
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed"
}
```

**Standard JSON-RPC error codes:**

| Code | Name | When |
|---|---|---|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid request | Missing required fields |
| -32601 | Method not found | Unknown method name |
| -32602 | Invalid params | Wrong parameter types/values |
| -32603 | Internal error | Server-side failure |

---

## 4. Protocol Lifecycle

```
Client                          Server
  │                               │
  │──── initialize ──────────────►│  Client sends capabilities + protocolVersion
  │◄─── initialize response ──── │  Server responds with capabilities + protocolVersion
  │                               │
  │──── notifications/initialized►│  Client confirms ready
  │                               │
  │         ═══ OPERATING ═══     │  Normal request/response/notification flow
  │                               │
  │──── ping ────────────────────►│  Keepalive (either direction)
  │◄─── pong ─────────────────── │
  │                               │
  │  (transport closes)           │  Connection ends
  │                               │
```

### Initialize Handshake

The `initialize` request is the **first** message from client to server:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {},
      "elicitation": {}
    },
    "clientInfo": {
      "name": "claude-desktop",
      "version": "1.0.0"
    }
  }
}
```

Server responds with its own capabilities:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true, "listChanged": true },
      "prompts": { "listChanged": true },
      "logging": {}
    },
    "serverInfo": {
      "name": "my-server",
      "version": "1.0.0"
    }
  }
}
```

**Rules:**
- Server MUST NOT send requests to client before `initialize` completes
- Client MUST send `notifications/initialized` after receiving the response
- Protocol version is negotiated — both sides agree on the highest mutually supported version

---

## 5. Capability Negotiation

Capabilities declared during `initialize` determine what features are available:

### Server Capabilities

| Capability | Enables |
|---|---|
| `tools` | Server can list and execute tools. `listChanged`: server will notify when tool list updates |
| `resources` | Server can list and read resources. `subscribe`: clients can subscribe to changes. `listChanged`: list change notifications |
| `prompts` | Server can list and provide prompts. `listChanged`: list change notifications |
| `logging` | Server can send log messages via `notifications/message` |
| `completions` | Server supports argument autocompletion for resources/prompts |

### Client Capabilities

| Capability | Enables |
|---|---|
| `roots` | Client can provide workspace roots. `listChanged`: client will notify on workspace changes |
| `sampling` | Client allows server to request LLM completions |
| `elicitation` | Client allows server to request user input |

**Feature detection pattern:** Before using a capability, check that the other side declared it:
```typescript
// Server-side: check if client supports sampling before requesting it
if (clientCapabilities.sampling) {
  const result = await server.createMessage({ ... });
}
```

---

## 6. Server Primitives: Tools vs Resources vs Prompts

This is the most important architectural decision — choosing the right primitive:

| Aspect | Tool | Resource | Prompt |
|---|---|---|---|
| **Controlled by** | Model (LLM) | Application (client) | User (human) |
| **Purpose** | Execute actions, compute | Provide data/context | Guide interactions |
| **Side effects?** | Yes (can modify state) | No (read-only) | No |
| **Discovery** | `tools/list` | `resources/list` | `prompts/list` |
| **Invocation** | `tools/call` | `resources/read` | `prompts/get` |
| **Input** | Zod schema / type hints | URI (with optional template params) | Arguments (schema-validated) |
| **Output** | `content[]` + optional `structuredContent` | `contents[]` (text or blob) | `messages[]` (role + content) |
| **Addressing** | By name | By URI (`file:///path`, `db://table`) | By name |
| **When to use** | API calls, DB writes, computations, file ops | Config files, docs, data feeds, API responses | Code review templates, analysis workflows |

### Decision Flowchart

```
Does the LLM need to decide when to use it?
  ├── YES → Is it read-only with no side effects?
  │          ├── YES → Consider Resource (if URI-addressable) or Tool (if computed)
  │          └── NO  → TOOL
  └── NO  → Does the user explicitly select it?
             ├── YES → PROMPT
             └── NO  → RESOURCE (application integrates it as context)
```

### Common Mistake
Don't use tools when resources would work. If data is static or changes infrequently and has no side effects, expose it as a resource. Tools are for actions; resources are for data.

---

## 7. Client Capabilities: Roots, Sampling, Elicitation

### Roots
Workspace paths the client provides to help servers understand the project context:
- Client declares `roots` capability during initialize
- Server calls `roots/list` to discover paths
- Client sends `notifications/roots/list_changed` when workspace changes
- Use for: scoping file operations, limiting search, providing project context

### Sampling
Server asks the client's LLM to generate a completion:
- Client declares `sampling` capability during initialize
- Server calls `sampling/createMessage` with messages + model preferences
- Returns the LLM's response to the server
- Use for: summarization, classification, content generation within a tool

### Elicitation
Server asks the user for input during tool execution:
- Client declares `elicitation` capability during initialize
- **Form mode:** structured input with JSON schema (non-sensitive data)
- **URL mode:** redirect user to external URL (OAuth flows, payments, API keys)
- Protocol method: `elicitation/create`
- Use for: missing parameters, confirmation dialogs, auth flows

---

## 8. Notifications

Notifications are one-way messages (no response expected). They have no `id` field.

### Server → Client Notifications

| Method | When Sent | Server Must Declare |
|---|---|---|
| `notifications/tools/list_changed` | Tool list was modified (added/removed/changed) | `tools: { listChanged: true }` |
| `notifications/resources/list_changed` | Resource list was modified | `resources: { listChanged: true }` |
| `notifications/prompts/list_changed` | Prompt list was modified | `prompts: { listChanged: true }` |
| `notifications/progress` | Progress update on a request with `progressToken` | — |
| `notifications/message` | Log message (debug/info/warning/error/etc.) | `logging: {}` |
| `notifications/cancelled` | Server cancelled an operation | — |
| `notifications/resources/updated` | A specific subscribed resource changed | `resources: { subscribe: true }` |

### Client → Server Notifications

| Method | When Sent | Client Must Declare |
|---|---|---|
| `notifications/initialized` | Client confirmed ready after initialize | — |
| `notifications/roots/list_changed` | Workspace roots changed | `roots: { listChanged: true }` |
| `notifications/cancelled` | Client cancelled an operation | — |

### Progress Notification Format
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "token-from-request-meta",
    "progress": 50,
    "total": 100,
    "message": "Processing file 50 of 100..."
  }
}
```

The `progressToken` comes from the original request's `_meta.progressToken` field.

---

## 9. Pagination

List operations (`tools/list`, `resources/list`, `prompts/list`) support cursor-based pagination:

### Request with cursor
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {
    "cursor": "eyJwYWdlIjogMn0="
  }
}
```

### Response with nextCursor
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [ ... ],
    "nextCursor": "eyJwYWdlIjogM30="
  }
}
```

**Rules:**
- Cursors are **opaque tokens** — clients must not parse or construct them
- Absence of `nextCursor` means no more pages
- Page size is **server-determined** — clients cannot request a specific page size
- First request omits `cursor` (or sends `null`)
- Critical for servers exposing 50+ tools/resources — prevents oversized responses

---

## 10. MCP Logging Capability

MCP provides a structured logging mechanism as an alternative to stderr:

### Server declares capability
```json
{ "logging": {} }
```

### Client sets minimum log level
```json
{
  "method": "logging/setLevel",
  "params": { "level": "warning" }
}
```

### Server sends log messages
```json
{
  "method": "notifications/message",
  "params": {
    "level": "info",
    "logger": "my-tool",
    "data": "Processing request for user X"
  }
}
```

### Severity Levels (RFC 5424 / syslog)

| Level | Severity | Use For |
|---|---|---|
| `debug` | 7 | Detailed diagnostic information |
| `info` | 6 | General operational messages |
| `notice` | 5 | Normal but significant events |
| `warning` | 4 | Potential issues |
| `error` | 3 | Error conditions |
| `critical` | 2 | Critical failures |
| `alert` | 1 | Action must be taken immediately |
| `emergency` | 0 | System is unusable |

This is the **proper** way to log from any transport — works on both stdio and HTTP, doesn't corrupt the JSON-RPC channel, and clients can filter by level.

---

## 11. Spec Version Targeting

Our playbook targets **`2025-11-25`** (current latest). Version timeline:

| Version | Date | Key Additions |
|---|---|---|
| `2024-11-05` | Nov 2024 | Original release — tools, resources, prompts, stdio + SSE |
| `2025-03-26` | Mar 2025 | Streamable HTTP transport (replaces SSE), SSE deprecated |
| `2025-06-18` | Jun 2025 | Structured outputs (`outputSchema`), OAuth 2.1, elicitation, security best practices |
| `2025-11-25` | Nov 2025 | Tasks (experimental), Extensions framework, Auth Extensions (CIMD, M2M, Cross App), sampling with tools, improved error codes |

### Version Negotiation

During `initialize`, both sides declare their supported `protocolVersion`. The agreed version is the highest version both support. If versions are incompatible, the connection fails.

### Feature Guards

When using features from newer spec versions, guard against older clients:
```typescript
// Only use outputSchema if we know the client supports 2025-06-18+
// In practice: if the client sends protocolVersion >= "2025-06-18", use it
```

### Governance

MCP is governed by the Agentic AI Foundation (Linux Foundation) since Dec 2025. Changes go through the SEP (Specification Enhancement Proposal) process. Active working groups handle different areas of the spec.
