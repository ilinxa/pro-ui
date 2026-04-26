# Production Hardening

Read this when preparing an MCP server for production. Covers health checks, graceful shutdown, monitoring, performance, scaling, session affinity, and HTTPS.

## Table of Contents
1. [Health Checks](#1-health-checks)
2. [Graceful Shutdown](#2-graceful-shutdown)
3. [Monitoring & Observability](#3-monitoring--observability)
4. [Performance](#4-performance)
5. [Scaling Patterns](#5-scaling-patterns)
6. [Session Affinity](#6-session-affinity)
7. [HTTPS & TLS](#7-https--tls)
8. [Production Checklist](#8-production-checklist)

---

## 1. Health Checks

Expose a health endpoint for load balancers and monitoring:

### TypeScript (Express)

```typescript
app.get("/health", (req, res) => {
  const status = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    activeSessions: transports.size,
  };
  res.json(status);
});

// Readiness check (is the server ready to accept requests?)
app.get("/ready", (req, res) => {
  if (isReady()) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: "Initializing..." });
  }
});
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## 2. Graceful Shutdown

Close active sessions cleanly when the server stops:

```typescript
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  console.error(`Received ${signal}. Shutting down gracefully...`);
  isShuttingDown = true;

  // Stop accepting new connections
  httpServer.close();

  // Close all active MCP sessions
  const closePromises = Array.from(transports.entries()).map(
    async ([id, transport]) => {
      try {
        await transport.close();
        transports.delete(id);
        console.error(`Closed session ${id}`);
      } catch (err) {
        console.error(`Error closing session ${id}:`, err);
      }
    }
  );

  await Promise.allSettled(closePromises);
  console.error("All sessions closed. Exiting.");
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Reject new requests during shutdown
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.status(503).json({ error: "Server is shutting down" });
    return;
  }
  next();
});
```

### Python

```python
import signal
import asyncio

async def shutdown(sig):
    print(f"Received {sig.name}. Shutting down...", file=sys.stderr)
    # Close all sessions
    tasks = [t.cancel() for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    await asyncio.gather(*tasks, return_exceptions=True)

loop = asyncio.get_event_loop()
for sig in (signal.SIGTERM, signal.SIGINT):
    loop.add_signal_handler(sig, lambda s=sig: asyncio.create_task(shutdown(s)))
```

---

## 3. Monitoring & Observability

### Structured Logging

```typescript
function log(level: string, message: string, meta: Record<string, unknown> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  console.error(JSON.stringify(entry));
}

// Usage
log("info", "Tool called", { tool: "search", sessionId: "abc", durationMs: 45 });
log("error", "Tool failed", { tool: "search", error: err.message });
```

### Key Metrics to Track

| Metric | Type | Why |
|---|---|---|
| Active sessions | Gauge | Capacity planning |
| Tool calls per minute | Counter | Usage patterns |
| Tool latency (p50, p95, p99) | Histogram | Performance |
| Error rate | Counter | Reliability |
| Session duration | Histogram | Usage patterns |
| Memory usage | Gauge | Resource planning |

### Request Timing Middleware

```typescript
app.use("/mcp", (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    log("info", "Request completed", {
      method: req.method,
      status: res.statusCode,
      durationMs: duration,
      sessionId: req.headers["mcp-session-id"],
    });
  });

  next();
});
```

---

## 4. Performance

### Response Optimization

```typescript
// Cache expensive computations
const cache = new Map<string, { data: unknown; expires: number }>();

function withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data as Promise<T>;
  }

  const result = fn();
  result.then(data => {
    cache.set(key, { data, expires: Date.now() + ttlMs });
  });
  return result;
}

// Use in tool handler
server.registerTool("get_status", { ... }, async () => {
  const status = await withCache("status", 30_000, fetchSystemStatus);
  return { content: [{ type: "text", text: JSON.stringify(status) }] };
});
```

### Memory Management

- Clean up closed sessions immediately
- Set `max_old_space_size` for Node.js: `node --max-old-space-size=512 build/index.js`
- Monitor for memory leaks in long-running tool handlers
- Use streaming for large data instead of buffering

### Connection Pooling

```typescript
// Reuse HTTP connections for external API calls
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 10 });

// Reuse database connections
const pool = new Pool({ max: 10, idleTimeoutMillis: 30_000 });
```

---

## 5. Scaling Patterns

### Single-Node (Stateful)

```
Client A ─┐
Client B ─┼── MCP Server (all sessions in memory)
Client C ─┘
```

Simplest. Works for most use cases. Limited by single-server resources.

### Multi-Node with Session Affinity

```
             ┌── Node 1 (sessions A, B)
LB ──────────┤
             └── Node 2 (sessions C, D)
```

Scale horizontally. Requires sticky sessions on the load balancer.

### Multi-Node with Shared State

```
Node 1 ──┐
Node 2 ──┼── Redis (session store + event store)
Node 3 ──┘
```

Most flexible. Any node handles any request. Requires external state store.

---

## 6. Session Affinity

For stateful Streamable HTTP servers behind a load balancer:

### Nginx Sticky Sessions

```nginx
upstream mcp_servers {
    hash $http_mcp_session_id consistent;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

### HAProxy

```
backend mcp_servers
    balance hdr(mcp-session-id)
    server node1 127.0.0.1:3001
    server node2 127.0.0.1:3002
```

### AWS ALB

Use `mcp-session-id` header-based stickiness in Target Group settings.

---

## 7. HTTPS & TLS

**Always use HTTPS for Streamable HTTP servers** — tokens and data are transmitted in the clear over HTTP.

### Let's Encrypt (with nginx)

```bash
sudo certbot --nginx -d mcp.example.com
```

### Node.js Direct TLS

```typescript
import https from "https";
import fs from "fs";

const httpsServer = https.createServer({
  key: fs.readFileSync("/path/to/privkey.pem"),
  cert: fs.readFileSync("/path/to/fullchain.pem"),
}, app);

httpsServer.listen(443);
```

### Cloudflare

HTTPS is automatic on Cloudflare Workers — no configuration needed.

---

## 8. Production Checklist

### Before Deploying

- [ ] All tests pass (unit + integration)
- [ ] MCP Inspector verification complete
- [ ] No `console.log` in stdio code paths
- [ ] Environment variables validated at startup
- [ ] Secrets in env vars, not in code

### Infrastructure

- [ ] Health check endpoint (`/health`)
- [ ] Graceful shutdown (SIGTERM/SIGINT handlers)
- [ ] HTTPS enabled (for Streamable HTTP)
- [ ] DNS rebinding protection (for local HTTP servers)
- [ ] Non-root user in Docker

### Reliability

- [ ] Rate limiting enabled
- [ ] Error handling in all tool handlers (no unhandled rejections)
- [ ] Session cleanup on disconnect/timeout
- [ ] Resource limits set (memory, CPU, file descriptors)

### Observability

- [ ] Structured logging (JSON to stderr)
- [ ] Request timing tracked
- [ ] Error rate monitored
- [ ] Active session count tracked
- [ ] Alerting configured for errors/latency spikes

### Security

- [ ] Input validation on all tool arguments
- [ ] No secrets in tool outputs
- [ ] CORS configured (for browser-accessible servers)
- [ ] Auth tokens validated on every request (if using OAuth)
- [ ] Audit logging for tool invocations
