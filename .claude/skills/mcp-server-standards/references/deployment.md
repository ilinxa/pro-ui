# Deployment Patterns

Read this when deploying MCP servers to production. Covers local stdio, Docker, Cloudflare Workers, VPS/Node.js, Python deployment, CI/CD, and versioning.

## Table of Contents
1. [Deployment Overview](#1-deployment-overview)
2. [Local (stdio)](#2-local-stdio)
3. [Docker](#3-docker)
4. [Cloudflare Workers](#4-cloudflare-workers)
5. [VPS / Node.js](#5-vps--nodejs)
6. [Python Deployment](#6-python-deployment)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Versioning Strategy](#8-versioning-strategy)
9. [Environment Configuration](#9-environment-configuration)

---

## 1. Deployment Overview

| Target | Transport | Complexity | Best For |
|---|---|---|---|
| Local (stdio) | stdio | Low | Personal tools, development, Claude Desktop |
| Docker | Streamable HTTP | Medium | Consistent environments, team sharing |
| Cloudflare Workers | Streamable HTTP | Medium | Global edge deployment, low latency |
| VPS / Node.js | Streamable HTTP | Medium | Full control, custom infrastructure |
| Python (uvicorn) | Streamable HTTP | Medium | Python-first teams |

---

## 2. Local (stdio)

The simplest deployment — client spawns the server as a child process.

### TypeScript

```bash
# Build
npm run build

# Configure in Claude Desktop
# claude_desktop_config.json:
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"]
    }
  }
}
```

### Python

```bash
# Configure in Claude Desktop
{
  "mcpServers": {
    "my-server": {
      "command": "uv",
      "args": ["--directory", "/absolute/path/to/project", "run", "server.py"]
    }
  }
}
```

### npm Global Install

Publish your server as an npm package for easy distribution:

```json
// package.json
{
  "name": "my-mcp-server",
  "bin": { "my-mcp-server": "./build/index.js" },
  "files": ["build"]
}
```

```bash
# Users install globally
npm install -g my-mcp-server

# Configure in client
{
  "mcpServers": {
    "my-server": {
      "command": "my-mcp-server"
    }
  }
}
```

### npx (Zero Install)

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"]
    }
  }
}
```

---

## 3. Docker

### Dockerfile (TypeScript)

```dockerfile
FROM node:22-slim

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --production

# Copy built server
COPY build/ ./build/

# Non-root user
RUN addgroup --system mcp && adduser --system --ingroup mcp mcp
USER mcp

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "build/index.js"]
```

### Dockerfile (Python)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy project files
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .

# Non-root user
RUN addgroup --system mcp && adduser --system --ingroup mcp mcp
USER mcp

EXPOSE 3000

CMD ["uv", "run", "server.py"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_KEY=${API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  # Optional: for stdio servers in Docker
  mcp-stdio:
    build: .
    stdin_open: true
    command: ["node", "build/index.js"]
```

### Docker for stdio Transport

For clients that spawn processes, use Docker as the command:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "my-mcp-server:latest"]
    }
  }
}
```

The `-i` flag keeps stdin open (required for stdio transport).

---

## 4. Cloudflare Workers

Deploy MCP servers to Cloudflare's edge network:

### wrangler.toml

```toml
name = "my-mcp-server"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[vars]
API_KEY = "your-key"
```

### Worker Entry Point

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

function createServer(): McpServer {
  const server = new McpServer({ name: "cf-mcp-server", version: "1.0.0" });

  server.registerTool("hello", {
    title: "Hello",
    inputSchema: { name: z.string().describe("Name") },
    annotations: { readOnlyHint: true },
  }, async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  }));

  return server;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      // Handle MCP Streamable HTTP
      return handleMcpRequest(request, env);
    }

    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  },
};
```

### Deploy

```bash
npx wrangler deploy
# Server available at: https://my-mcp-server.your-subdomain.workers.dev/mcp
```

### Cloudflare Advantages

- Global edge deployment (low latency worldwide)
- Auto-scaling, no server management
- Built-in DDoS protection
- Free tier available
- Durable Objects for session state (if needed)

### Limitations

- No stdio (HTTP only)
- Execution time limits (Workers: 30s CPU time)
- No filesystem access (use KV, R2, or D1 for storage)
- Must handle stateless or use Durable Objects for state

---

## 5. VPS / Node.js

### Production Setup with PM2

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start build/index.js --name mcp-server

# Enable startup on boot
pm2 startup
pm2 save
```

### ecosystem.config.cjs

```javascript
module.exports = {
  apps: [{
    name: "mcp-server",
    script: "build/index.js",
    instances: 1,           // MCP sessions are stateful — careful with clustering
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
    },
    env_file: ".env",
    max_memory_restart: "500M",
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
  }],
};
```

### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name mcp.example.com;

    ssl_certificate /etc/letsencrypt/live/mcp.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.example.com/privkey.pem;

    location /mcp {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Required for SSE (GET /mcp)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;  # Long timeout for SSE

        # Required for WebSocket upgrade (if used)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /health {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

**Critical nginx settings for MCP:**
- `proxy_buffering off` — SSE events must not be buffered
- `proxy_read_timeout 86400s` — SSE connections are long-lived
- Pass `Host` header for DNS rebinding protection

---

## 6. Python Deployment

### uvicorn (Standalone)

```bash
# Production
uvicorn server:app --host 0.0.0.0 --port 3000 --workers 1

# With FastMCP, just run:
uv run server.py
```

### Gunicorn + Uvicorn Workers

```bash
gunicorn server:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 1 \
  --bind 0.0.0.0:3000 \
  --timeout 120
```

**Workers = 1** for stateful MCP sessions. Multiple workers need a shared session store.

### systemd Service

```ini
[Unit]
Description=MCP Server
After=network.target

[Service]
Type=simple
User=mcp
WorkingDirectory=/opt/mcp-server
ExecStart=/opt/mcp-server/.venv/bin/python server.py
Restart=always
RestartSec=5
Environment=API_KEY=your-key

[Install]
WantedBy=multi-user.target
```

---

## 7. CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy MCP Server
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: npm ci
      - run: npm run build
      - run: npm test

  deploy-docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        run: |
          docker build -t my-mcp-server:${{ github.sha }} .
          docker tag my-mcp-server:${{ github.sha }} my-mcp-server:latest
          # Push to registry...

  deploy-cloudflare:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: npm ci && npm run build
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

---

## 8. Versioning Strategy

### Semantic Versioning

```
MAJOR.MINOR.PATCH
  │     │     └── Bug fixes (no schema changes)
  │     └──────── New tools/resources (backwards compatible)
  └────────────── Breaking changes (schema changes, removed tools)
```

### What Counts as Breaking

- Removing a tool or resource
- Changing a tool's `inputSchema` (removing/renaming fields)
- Changing a tool's `outputSchema` structure
- Changing a resource URI scheme
- Removing or renaming prompt arguments

### What's Non-Breaking

- Adding new tools, resources, or prompts
- Adding optional fields to existing schemas
- Improving descriptions or titles
- Adding annotations
- Performance improvements

### Version in Server Info

```typescript
const server = new McpServer({
  name: "my-server",
  version: "2.1.0",  // Semantic version
});
```

Clients see this during `initialize` — useful for debugging and compatibility checks.

---

## 9. Environment Configuration

### .env File Pattern

```bash
# .env (never commit to git)
API_KEY=sk-abc123
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
LOG_LEVEL=info
PORT=3000
NODE_ENV=production
```

### Validation at Startup

```typescript
function validateConfig() {
  const required = ["API_KEY"];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  return {
    apiKey: process.env.API_KEY!,
    port: parseInt(process.env.PORT || "3000"),
    logLevel: process.env.LOG_LEVEL || "info",
  };
}

const config = validateConfig();
```

### Multi-Environment Setup

```
.env.development    # Local dev
.env.staging        # Staging
.env.production     # Production (never in git)
.env.example        # Template (committed to git)
```
