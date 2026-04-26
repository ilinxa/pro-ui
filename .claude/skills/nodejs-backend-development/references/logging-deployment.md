# Logging, Monitoring & Deployment

Read this when configuring Pino logging, health/readiness endpoints, writing Dockerfiles, setting up nginx, or running CI migrations.

## 1. Pino Configuration

```typescript
const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password'], censor: '[REDACTED]' },
    transport: env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } } : undefined,
    serializers: {
      req: (r) => ({ method: r.method, url: r.url, hostname: r.hostname, remoteAddress: r.ip }),
      res: (r) => ({ statusCode: r.statusCode }),
    },
  },
  genReqId: () => crypto.randomUUID(),
});
```

Always redact auth headers/passwords. Pretty in dev, raw JSON in prod. UUID request IDs for tracing.

## 2. Log Levels

| Level | Usage |
|-------|-------|
| `fatal` | App cannot continue |
| `error` | Failed operation |
| `warn` | Approaching limits, recoverable |
| `info` | Successful ops, startup, shutdown |
| `debug` | Detailed flow |
| `trace` | Very verbose |

```typescript
request.log.info({ userId: user.id, action: 'create' }, 'User created');       // ✅ structured
request.log.error({ err: error, userId }, 'Failed to update');                  // ✅ err property
// ❌ request.log.info(`User ${user.id} created`)  — unstructured, unparseable
```

Always `{ err: error }` for stack trace serialization. Use `request.log` (includes reqId) inside handlers, `fastify.log` outside.

## 3. Request Timing

```typescript
fastify.addHook('onResponse', async (request, reply) => {
  if (reply.elapsedTime > 1000)
    request.log.warn({ url: request.url, ms: reply.elapsedTime }, 'Slow request');
});
```

## 4. Health & Readiness

```typescript
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() }));
fastify.get('/ready', async (request, reply) => {
  try { await fastify.prisma.$queryRaw`SELECT 1`; return { status: 'ready', db: 'connected' }; }
  catch (error) {
    request.log.error({ err: error }, 'Readiness failed');
    return reply.status(503).send({ status: 'not ready' });
  }
});
```

Kubernetes probes: liveness → `/health`, readiness → `/ready`.

## 5. Multi-Stage Dockerfile

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && pnpm build && pnpm prune --prod

FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
COPY --from=build --chown=appuser:nodejs /app/dist ./dist
COPY --from=build --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=appuser:nodejs /app/src/generated ./src/generated
COPY --from=build --chown=appuser:nodejs /app/prisma ./prisma
COPY --from=build --chown=appuser:nodejs /app/package.json ./
USER appuser
EXPOSE 3000
ENV NODE_ENV=production HOST=0.0.0.0
CMD ["node", "dist/index.js"]
```

3-stage (deps → build → production). Non-root `appuser`. Alpine for smallest image. No dev deps in final.

## 6. Docker Compose (Production)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment: { POSTGRES_USER: ${POSTGRES_USER}, POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}, POSTGRES_DB: ${POSTGRES_DB} }
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"], interval: 10s }
  api:
    build: { context: ., target: production }
    restart: always
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    depends_on: { postgres: { condition: service_healthy } }
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: [./nginx.conf:/etc/nginx/conf.d/default.conf:ro]
    depends_on: [api]
volumes:
  pgdata:
```

## 7. Nginx Reverse Proxy

```nginx
upstream api { server api:3000; }
server {
  listen 443 ssl http2;
  ssl_certificate /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  location / {
    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location /health { proxy_pass http://api; access_log off; }
}
```

With reverse proxy: `Fastify({ trustProxy: true })`.

## 8. CI/CD Migrations

```bash
npx prisma migrate deploy    # in CI, after deploy, before new version starts
```

Or in Docker entrypoint:
```bash
#!/bin/sh
set -e
npx prisma migrate deploy
exec node dist/index.js
```

## 9. Environment Variables

Never hardcode. Use Docker secrets, K8s secrets, or cloud secret managers (AWS SSM, GCP Secret Manager).

## 10. .dockerignore

```
node_modules
dist
.git
.env
.env.*
*.md
coverage
```

## 11. Production Settings

| Setting | Dev | Prod |
|---------|-----|------|
| Log level | debug | info |
| Transport | pino-pretty | None (JSON) |
| Stack traces in response | Yes | No |
| Swagger | Enabled | Disabled |

## 12. Anti-Patterns

❌ `console.log` → ✅ `request.log` / `fastify.log`
❌ Log tokens/passwords → ✅ Pino `redact`
❌ String interpolation logs → ✅ Structured `{ key: value }`
❌ Skip `{ err: error }` → ✅ Always for stack traces
❌ Run as root → ✅ Non-root `appuser`
❌ Dev deps in prod image → ✅ Multi-stage + `pnpm prune --prod`
❌ Hardcode secrets → ✅ Env vars / secret managers
❌ Skip `trustProxy` with proxy → ✅ `trustProxy: true`
❌ Skip SIGTERM handling → ✅ `app.close()` on signal
❌ `node:22` full image → ✅ `node:22-alpine`
❌ Skip health endpoints → ✅ `/health` + `/ready`
