# Resources

Read this when building MCP resources — static or dynamic data exposed to clients. Covers registration in TS and Python, URI templates, metadata, content types, completions, subscriptions, and use cases.

## Table of Contents
1. [What Resources Are](#1-what-resources-are)
2. [Static Resources (TypeScript)](#2-static-resources-typescript)
3. [Dynamic Resources with URI Templates (TypeScript)](#3-dynamic-resources-with-uri-templates-typescript)
4. [Resources in Python](#4-resources-in-python)
5. [Resource Metadata](#5-resource-metadata)
6. [Content Types](#6-content-types)
7. [Argument Completion](#7-argument-completion)
8. [Resource Subscriptions & list_changed](#8-resource-subscriptions--list_changed)
9. [Resources vs Tools — Decision Guide](#9-resources-vs-tools--decision-guide)
10. [Real-World Use Cases](#10-real-world-use-cases)

---

## 1. What Resources Are

Resources are **application-controlled** data. The client application decides how and when to surface them — not the LLM. Resources are read-only and URI-addressed.

**Protocol methods:**
- `resources/list` — client discovers available resources
- `resources/read` — client fetches resource content by URI
- `resources/templates/list` — client discovers URI templates
- `resources/subscribe` / `resources/unsubscribe` — client subscribes to changes
- `notifications/resources/list_changed` — server signals resource list changed
- `notifications/resources/updated` — server signals a specific resource changed

**Key distinction:** Resources are for data the client or user explicitly requests. If the LLM needs to decide when to access data, use a tool instead.

**How different clients handle resources:**
- Claude Desktop: Users explicitly select resources before they're used
- Some clients: Auto-select based on heuristics
- Others: Let the model decide (treating resources more like tools)

Server authors should be prepared for any of these patterns.

---

## 2. Static Resources (TypeScript)

Resources with fixed URIs — one handler per resource:

```typescript
// Using the shorthand .resource() method
server.resource(
  "server-status",                           // Name (identifier)
  "status://server",                         // URI
  {
    title: "Server Status",                  // Display name
    description: "Current server health and uptime",
    mimeType: "application/json",
  },
  async () => ({
    contents: [{
      uri: "status://server",
      text: JSON.stringify({
        status: "healthy",
        uptime: process.uptime(),
        version: "1.0.0",
      }),
    }],
  })
);
```

### Using registerResource (explicit API)

```typescript
server.registerResource(
  "app-config",
  "config://app",
  { title: "Application Config", mimeType: "application/json" },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(config),
    }],
  })
);
```

---

## 3. Dynamic Resources with URI Templates (TypeScript)

For parameterized resources that follow a pattern:

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

server.resource(
  "user-profile",
  new ResourceTemplate("users://{userId}/profile", {
    list: async () => {
      // Return known instances for resource discovery
      const users = await db.listUsers();
      return users.map(u => ({
        uri: `users://${u.id}/profile`,
        name: `${u.name}'s Profile`,
      }));
    },
  }),
  {
    title: "User Profile",
    description: "Profile data for a specific user",
    mimeType: "application/json",
  },
  async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(await db.getUser(userId)),
    }],
  })
);
```

**URI Template syntax:** Uses RFC 6570 Level 1 — `{variable}` in the URI path. Variables are extracted and passed to the handler.

---

## 4. Resources in Python

### Static Resource

```python
@mcp.resource("config://app/settings", description="Application configuration")
async def get_config() -> str:
    """Return application settings as JSON."""
    import json
    return json.dumps({"theme": "dark", "language": "en"})
```

### Dynamic Resource with URI Template

```python
@mcp.resource("users://{user_id}/profile", description="User profile by ID")
async def get_user_profile(user_id: str) -> str:
    """Get a user's profile data.

    Args:
        user_id: Unique user identifier.
    """
    user = await db.get_user(user_id)
    import json
    return json.dumps({"id": user_id, "name": user.name, "email": user.email})
```

**Always provide `description=` explicitly** — FastMCP's docstring extraction is unreliable for resources.

---

## 5. Resource Metadata

Metadata helps clients and users understand resources:

| Field | Required | Purpose |
|---|---|---|
| `uri` | Yes | Unique identifier (follows URI spec) |
| `name` | Yes | Display name for the resource |
| `title` | No | Human-readable title (overrides name in UI) |
| `description` | No | What this resource provides |
| `mimeType` | No | Content type hint (`application/json`, `text/plain`, `text/markdown`, etc.) |

### URI Schemes

You can use any URI scheme. Common patterns:

| Scheme | Use Case | Example |
|---|---|---|
| `file://` | Local files | `file:///home/user/config.json` |
| `http://` / `https://` | Web resources | `https://api.example.com/data` |
| `db://` | Database records | `db://users/123` |
| `config://` | Application config | `config://app/settings` |
| `info://` | Server metadata | `info://server/status` |
| Custom | Domain-specific | `github://repos/owner/name` |

---

## 6. Content Types

Resource responses use the `contents` array:

### Text Content

```typescript
{
  contents: [{
    uri: "config://app",
    text: '{"key": "value"}',
    mimeType: "application/json",
  }]
}
```

### Binary Content (base64)

```typescript
{
  contents: [{
    uri: "images://logo",
    blob: "iVBORw0KGgoAAAANSUhEUgAA...",  // base64 encoded
    mimeType: "image/png",
  }]
}
```

### Multiple Contents

A single resource read can return multiple content items:

```typescript
{
  contents: [
    { uri: "docs://readme", text: "# README\n...", mimeType: "text/markdown" },
    { uri: "docs://changelog", text: "## v1.0.0\n...", mimeType: "text/markdown" },
  ]
}
```

---

## 7. Argument Completion

Help clients auto-complete resource template parameters:

### TypeScript

```typescript
import { ResourceTemplate, completable } from "@modelcontextprotocol/sdk/server/mcp.js";

server.resource(
  "user-profile",
  new ResourceTemplate("users://{userId}/profile", {
    list: async () => {
      const users = await db.listUsers();
      return users.map(u => ({ uri: `users://${u.id}/profile`, name: u.name }));
    },
    complete: {
      userId: async (partial) => {
        // Return matching user IDs for autocompletion
        const users = await db.searchUsers(partial);
        return users.map(u => u.id);
      },
    },
  }),
  { title: "User Profile" },
  async (uri, { userId }) => ({
    contents: [{ uri: uri.href, text: JSON.stringify(await db.getUser(userId)) }],
  })
);
```

Completions help clients suggest valid parameter values as the user types.

---

## 8. Resource Subscriptions & list_changed

### List Changed Notifications

When the available set of resources changes (new resource added, one removed):

```typescript
// Server must declare: capabilities.resources.listChanged = true
// Then send notification when list changes:
await server.server.notification({
  method: "notifications/resources/list_changed",
});
```

### Resource Subscriptions

Clients can subscribe to changes in specific resources:

```typescript
// Server must declare: capabilities.resources.subscribe = true
// Client sends: resources/subscribe { uri: "data://live-feed" }
// Server sends notifications/resources/updated when content changes:
await server.server.notification({
  method: "notifications/resources/updated",
  params: { uri: "data://live-feed" },
});
```

After receiving `resources/updated`, the client re-reads the resource to get new content.

---

## 9. Resources vs Tools — Decision Guide

| Question | → Resource | → Tool |
|---|---|---|
| Is it read-only data? | ✅ | |
| Does the LLM decide when to fetch it? | | ✅ |
| Is it URI-addressable? | ✅ | |
| Does it have side effects? | | ✅ |
| Is it application/user-selected? | ✅ | |
| Does it require computation each time? | | ✅ |
| Is it configuration or metadata? | ✅ | |
| Does it modify external state? | | ✅ |

**Rule of thumb:** If the data exists regardless of whether someone asks for it (like a config file, a document, or server status), it's a resource. If the data only exists because someone asked for it (like a search result or API response), it's a tool.

---

## 10. Real-World Use Cases

### Config Endpoint

```typescript
server.resource("app-config", "config://app", {
  title: "Application Configuration",
  mimeType: "application/json",
}, async () => ({
  contents: [{
    uri: "config://app",
    text: JSON.stringify(await loadConfig()),
  }],
}));
```

### Documentation Pages

```typescript
const docs = ["getting-started", "api-reference", "troubleshooting"];

for (const doc of docs) {
  server.resource(
    `doc-${doc}`,
    `docs://${doc}`,
    { title: doc.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), mimeType: "text/markdown" },
    async () => ({
      contents: [{ uri: `docs://${doc}`, text: await readDoc(doc) }],
    })
  );
}
```

### Live Data Feed (Python)

```python
@mcp.resource("metrics://system/current", description="Current system metrics")
async def system_metrics() -> str:
    """Live system performance metrics."""
    import json, psutil
    return json.dumps({
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage("/").percent,
    })
```

### Database Schema

```python
@mcp.resource("db://schema/{table_name}", description="Database table schema")
async def table_schema(table_name: str) -> str:
    """Get column definitions for a database table.

    Args:
        table_name: Name of the table.
    """
    import json
    columns = await db.get_table_schema(table_name)
    return json.dumps([{
        "name": c.name,
        "type": c.type,
        "nullable": c.nullable,
    } for c in columns])
```
