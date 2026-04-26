# Client Integration

Read this when connecting an MCP server to a client — Claude Desktop, Claude Code, VS Code, Cursor — or when configuring remote server connections, mcp-remote proxy, or troubleshooting connection issues.

## Table of Contents
1. [Client Overview](#1-client-overview)
2. [Claude Desktop](#2-claude-desktop)
3. [Claude Code CLI](#3-claude-code-cli)
4. [VS Code](#4-vs-code)
5. [Cursor](#5-cursor)
6. [Roots Capability](#6-roots-capability)
7. [Remote Server Connections](#7-remote-server-connections)
8. [mcp-remote Proxy](#8-mcp-remote-proxy)
9. [Environment Variables](#9-environment-variables)
10. [Multiple Servers](#10-multiple-servers)
11. [Client Feature Support Matrix](#11-client-feature-support-matrix)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Client Overview

MCP clients are embedded in host applications. Each client connects to one MCP server:

| Client | Transport | Config Location |
|---|---|---|
| Claude Desktop | stdio (local) | `claude_desktop_config.json` |
| Claude Code CLI | stdio (local) | `.mcp.json` or `claude mcp add` |
| VS Code | stdio (local) or HTTP | `.vscode/mcp.json` |
| Cursor | stdio (local) or HTTP | `.cursor/mcp.json` |

---

## 2. Claude Desktop

### Config File Location

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Create the file if it doesn't exist.

### Stdio Server Configuration

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"]
    }
  }
}
```

### With Environment Variables

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"],
      "env": {
        "API_KEY": "your-api-key",
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

### Python Server

```json
{
  "mcpServers": {
    "my-python-server": {
      "command": "uv",
      "args": ["--directory", "/absolute/path/to/project", "run", "server.py"]
    }
  }
}
```

### Using npx

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server-package"]
    }
  }
}
```

**Important:**
- Always use **absolute paths** (get with `pwd` on macOS/Linux)
- You may need the full path to `node`, `uv`, or `npx` (get with `which node`)
- Restart Claude Desktop after config changes
- On macOS: Cmd+Q to fully quit (closing the window isn't enough)

---

## 3. Claude Code CLI

### Add a Server

```bash
# Add stdio server
claude mcp add my-server node /absolute/path/to/build/index.js

# Add with environment variables
claude mcp add my-server node /absolute/path/to/build/index.js \
  --env API_KEY=your-key \
  --env DATABASE_URL=postgresql://...

# Add Python server
claude mcp add my-python-server uv -- --directory /path/to/project run server.py
```

### Project Config (.mcp.json)

Create `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

### List and Manage Servers

```bash
claude mcp list                    # List all configured servers
claude mcp remove my-server        # Remove a server
```

---

## 4. VS Code

### Config File

Create `.vscode/mcp.json` in the workspace root:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["${workspaceFolder}/build/index.js"],
      "env": {
        "API_KEY": "${env:MY_API_KEY}"
      }
    }
  }
}
```

VS Code supports variable substitution:
- `${workspaceFolder}` — workspace root path
- `${env:VAR_NAME}` — environment variable

### Remote Server (Streamable HTTP)

```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://my-server.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${env:MCP_TOKEN}"
      }
    }
  }
}
```

---

## 5. Cursor

### Config File

Create `.cursor/mcp.json` in the workspace root:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"]
    }
  }
}
```

Cursor follows the same format as VS Code / Claude Code.

---

## 6. Roots Capability

Roots let servers discover the client's workspace context:

### What Roots Provide

- File paths to project directories
- Workspace boundaries (what the server should/shouldn't access)
- Project context for file-based operations

### Server-Side Usage

```typescript
// Server requests roots from client
server.registerTool("list_project_files", { ... }, async () => {
  const rootsResult = await server.server.listRoots();
  const roots = rootsResult.roots;

  // roots = [{ uri: "file:///home/user/myproject", name: "My Project" }]
  const files = [];
  for (const root of roots) {
    const rootPath = new URL(root.uri).pathname;
    const dirFiles = await fs.readdir(rootPath);
    files.push(...dirFiles.map(f => `${root.name}: ${f}`));
  }

  return { content: [{ type: "text", text: files.join("\n") }] };
});
```

### Root Change Notifications

Client sends `notifications/roots/list_changed` when the workspace changes (new folder opened, folder removed):

```typescript
// Server can listen for root changes
server.server.setNotificationHandler(
  "notifications/roots/list_changed",
  async () => {
    // Re-fetch roots and update internal state
    const roots = await server.server.listRoots();
    updateServerState(roots);
  }
);
```

### Use Cases

- **File operations:** Scope reads/writes to workspace directories
- **Search:** Limit search to project boundaries
- **Context:** Understand what project the user is working on
- **Security:** Prevent path traversal outside workspace

---

## 7. Remote Server Connections

For Streamable HTTP servers accessible over the network:

### URL-Based Config

```json
{
  "mcpServers": {
    "remote-api": {
      "url": "https://my-server.example.com/mcp"
    }
  }
}
```

### With Authentication

```json
{
  "mcpServers": {
    "remote-api": {
      "url": "https://my-server.example.com/mcp",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }
}
```

---

## 8. mcp-remote Proxy

Bridge remote Streamable HTTP servers to clients that only support stdio:

```bash
# Install
npm install -g mcp-remote

# Use in client config
{
  "mcpServers": {
    "remote-via-proxy": {
      "command": "npx",
      "args": ["mcp-remote", "https://my-server.example.com/mcp"]
    }
  }
}
```

**How it works:**
1. Client spawns `mcp-remote` as a stdio process
2. `mcp-remote` connects to the remote Streamable HTTP server
3. Messages are relayed between stdio and HTTP

Useful for connecting Claude Desktop (stdio-only) to remote servers.

---

## 9. Environment Variables

### In Client Configs

```json
{
  "env": {
    "API_KEY": "value",
    "DATABASE_URL": "postgresql://localhost/mydb",
    "NODE_ENV": "production"
  }
}
```

### VS Code Variable Substitution

```json
{
  "env": {
    "API_KEY": "${env:MY_API_KEY}",
    "PROJECT_PATH": "${workspaceFolder}"
  }
}
```

### Best Practices

- Never commit API keys to version control
- Use `.env` files or OS-level env vars, referenced via substitution
- Different environments (dev/staging/prod) should use different configs

---

## 10. Multiple Servers

Connect to multiple MCP servers simultaneously:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/github-server/build/index.js"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    },
    "database": {
      "command": "node",
      "args": ["/path/to/db-server/build/index.js"],
      "env": { "DATABASE_URL": "postgresql://..." }
    },
    "file-system": {
      "command": "node",
      "args": ["/path/to/fs-server/build/index.js"]
    }
  }
}
```

Each server gets its own client connection. Tools from all servers are available simultaneously — the LLM sees all tools and decides which to use.

**Naming:** Use descriptive names — they appear in client UIs and help disambiguate tools with similar names.

---

## 11. Client Feature Support Matrix

| Feature | Claude Desktop | Claude Code | VS Code | Cursor |
|---|---|---|---|---|
| stdio transport | ✅ | ✅ | ✅ | ✅ |
| Streamable HTTP | Via mcp-remote | Via mcp-remote | ✅ | ✅ |
| Sampling | ✅ | ✅ | Varies | Varies |
| Elicitation (Form) | ✅ | ✅ | Varies | Varies |
| Elicitation (URL) | Varies | Varies | — | — |
| Roots | ✅ | ✅ | ✅ | ✅ |
| Resource selection | Manual | Auto | Varies | Varies |
| Multiple servers | ✅ | ✅ | ✅ | ✅ |

**"Varies"** = depends on client version and configuration. Always check capabilities at runtime.

---

## 12. Troubleshooting

### Server Not Appearing in Client

| Issue | Fix |
|---|---|
| Config file syntax error | Validate JSON (no trailing commas, correct quotes) |
| Wrong file path | Use absolute paths. Verify with `ls /path/to/file` |
| Wrong command path | Use `which node` / `which uv` to get full path |
| Config not reloaded | Restart client (Claude Desktop: Cmd+Q, not just close window) |
| Permission denied | Check file permissions: `chmod 755 build/index.js` |

### Server Starts but Tools Don't Work

| Issue | Fix |
|---|---|
| `console.log` on stdio | Remove all `console.log`, use `console.error` |
| Missing dependencies | Run `npm install` / `uv sync` before starting |
| Build not up to date | Run `npm run build` after code changes |
| Runtime error in handler | Check stderr output for stack traces |

### Connection Drops / Timeouts

| Issue | Fix |
|---|---|
| Server crashes on bad input | Add try/catch in tool handlers |
| Memory leak | Profile with `--inspect` flag |
| Session lost (HTTP) | Enable resumability with `eventStore` |
| Firewall blocking | Check port accessibility for Streamable HTTP |

### Debug Logging

```bash
# TS — run with debug output
NODE_DEBUG=mcp node build/index.js

# Python — verbose logging
PYTHONUNBUFFERED=1 python server.py 2>debug.log

# Inspect with MCP Inspector (see testing.md)
npx @modelcontextprotocol/inspector node build/index.js
```
