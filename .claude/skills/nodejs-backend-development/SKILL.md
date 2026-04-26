---
name: nodejs-backend-development
description: >
  Node.js 22 backend development with Fastify v5, Prisma 7, PostgreSQL, TypeScript, and Zod.
  ALWAYS use this skill when building any Node.js backend, REST API, or server-side application —
  even if the user doesn't explicitly mention Fastify or Prisma. Covers project setup, ESM config,
  Fastify plugins/hooks/decorators, Prisma 7 schemas and queries (driver adapter required),
  JWT authentication, RBAC guards, Zod validation, Swagger/OpenAPI, Vitest testing, Pino logging,
  Docker deployment, and production hardening. Also use when the user mentions Express and would
  benefit from Fastify instead, or when they mention any ORM and the project fits Prisma.
  Trigger on: API development, backend architecture, database schema design, auth implementation,
  rate limiting, CORS, middleware, route validation, integration testing, or Docker deployment
  for Node.js projects.
---

<!--
  Versions last verified: April 2026.
  Fastify v5.8.4 (2026-03-23) · Prisma 7.6.0 (2026-03-27) · @fastify/jwt 10.0.0 · Node.js 22 LTS
  If significantly newer major versions exist, verify breaking changes before following patterns.
-->

# Node.js Backend Development

Node.js 22 LTS · Fastify v5.8+ · Prisma 7.x · PostgreSQL 16+ · TypeScript 5.9+ · Zod v3/v4 · Docker

## Quick Start

```typescript
// src/app.ts — App factory pattern
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './lib/env.js';

export async function buildApp(opts = {}) {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
    },
    ...opts,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(import('@fastify/sensible'));
  // env.CORS_ORIGIN: `true` (reflect origin) when unset, `string[]` (allowlist)
  // when set. The Zod transform in src/lib/env.ts handles the splitting.
  await app.register(import('@fastify/cors'), { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(import('@fastify/helmet'));
  await app.register(import('./plugins/prisma.js'));
  await app.register(import('./routes/users/index.js'), { prefix: '/api/v1/users' });

  return app;
}
```

```typescript
// src/index.ts — Entry point
import 'dotenv/config';
import { env } from './lib/env.js';
import { buildApp } from './app.js';

const app = await buildApp();
await app.listen({ port: env.PORT, host: env.HOST });

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => { await app.close(); process.exit(0); });
}
```

## Stack Versions

| Technology | Version | Key Notes |
|-----------|---------|-----------|
| Node.js | 22 LTS | Fastify v5 requires Node 20+; Prisma 7 requires 20.19+ |
| Fastify | v5.8+ | Plugin architecture, Pino logging, hooks lifecycle |
| Prisma ORM | v7.x | Pure TypeScript (Rust-free), ESM-first, driver adapters |
| PostgreSQL | 16+ | UUID PKs, TIMESTAMPTZ, JSONB, TEXT |
| TypeScript | 5.9+ | Strict mode, ESM, bundler moduleResolution |
| Zod | v3/v4 | Validation + type provider via `fastify-type-provider-zod` 6.1+ |

## Task Router

| Task | Reference |
|------|-----------|
| Project init, dependencies, directory structure, Prisma 7 config, app factory | [references/project-setup.md](references/project-setup.md) |
| Strict tsconfig, ESM patterns, env validation with Zod, type organization | [references/typescript.md](references/typescript.md) |
| Fastify plugins, encapsulation, hooks lifecycle, decorators, error handling | [references/fastify-architecture.md](references/fastify-architecture.md) |
| Prisma models, relations, enums, indexes, migrations, seeding | [references/prisma-schema.md](references/prisma-schema.md) |
| Prisma CRUD, select/include, filtering, pagination, transactions, error codes | [references/prisma-queries.md](references/prisma-queries.md) |
| PostgreSQL naming, data types, connection pooling, health checks | [references/database-conventions.md](references/database-conventions.md) |
| JWT with @fastify/jwt, access/refresh tokens, bcrypt, protected routes | [references/authentication.md](references/authentication.md) |
| RBAC guards, CORS, Helmet, rate limiting, input sanitization, security checklist | [references/authorization-security.md](references/authorization-security.md) |
| Zod type provider, route schemas, Swagger/OpenAPI, file uploads, versioning | [references/routing-validation.md](references/routing-validation.md) |
| REST patterns, response envelope, pagination, filtering, status codes | [references/api-conventions.md](references/api-conventions.md) |
| Vitest setup, Fastify inject(), test database, integration test patterns | [references/testing.md](references/testing.md) |
| Pino logging, health endpoints, multi-stage Docker, nginx, CI migrations | [references/logging-deployment.md](references/logging-deployment.md) |

## Universal Rules

1. **ESM mandatory** — `"type": "module"` in package.json, `"module": "ESNext"` + `"moduleResolution": "bundler"` in tsconfig
2. **`strict: true`** — non-negotiable, plus `noUncheckedIndexedAccess`, `noImplicitReturns`
3. **App factory pattern** — `buildApp()` function in `app.ts`, separate `index.ts` for server start (testability)
4. **Prisma 7 adapter required** — `new PrismaClient({ adapter })` with `PrismaPg`, not bare `new PrismaClient()`
5. **`prisma-client` generator** — not `prisma-client-js` (deprecated). Output to `src/generated/prisma/`
6. **UUID primary keys** — `@default(uuid()) @db.Uuid`, never auto-increment integers
7. **`@map`/`@@map` everywhere** — camelCase in Prisma, snake_case in PostgreSQL
8. **Zod type provider** — `validatorCompiler` + `serializerCompiler` set once at app level
9. **Routes never call Prisma directly** — Routes → Services → Prisma
10. **`fastify-plugin` (`fp()`) for shared plugins** — breaks encapsulation for Prisma, auth, config
11. **Always parameterize SQL** — `$queryRaw` tagged template, never `$queryRawUnsafe` with user input
12. **Validate env at startup** — Zod schema in `src/lib/env.ts`, fail fast on invalid config
13. **Graceful shutdown** — handle SIGINT/SIGTERM → `app.close()` → `process.exit(0)`
14. **`host: '0.0.0.0'`** in Docker — default `127.0.0.1` only accepts container-internal connections

## Top Anti-Patterns

❌ `prisma-client-js` generator — deprecated, Rust-based
✅ `prisma-client` generator with `output` path

❌ `new PrismaClient()` without adapter — fails in Prisma 7
✅ `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`

❌ `require()` / CommonJS — breaks Fastify v5 + Prisma 7
✅ ESM `import` with `"type": "module"`

❌ `(request as any).user = ...` — breaks V8 hidden class optimization
✅ `fastify.decorateRequest('user', null)` then assign in hook

❌ `console.log()` — unstructured, not serialized
✅ `request.log.info({ userId }, 'User created')` — Pino structured logging

❌ `process.env.X` scattered everywhere — no validation, no types
✅ Validated `env` object from `src/lib/env.ts` with Zod

❌ Routes calling Prisma directly — untestable, no business logic layer
✅ Routes → Services → Prisma (services accept `prisma` as parameter)

❌ `findMany()` without `select` for API responses — leaks all columns
✅ `select: { id: true, email: true, name: true }` — only what client needs

❌ `cors({ origin: '*' })` in production — allows any origin
✅ Whitelist specific origins from `CORS_ORIGIN` env var

❌ Long-lived access tokens (hours/days) — security risk
✅ 15-minute access tokens + HTTP-only cookie refresh tokens

❌ `docker run` as root — security risk
✅ Non-root `appuser` in multi-stage Dockerfile with `node:22-alpine`

❌ `app.inject()` skipped in favor of real HTTP tests — slow
✅ `app.inject()` for all route testing (no network, no port binding)

## Architecture Checklist

**Project:** ESM ∘ strict TypeScript ∘ app factory ∘ env validation ∘ graceful shutdown ∘ `pnpm`

**Fastify:** Zod type provider ∘ plugin encapsulation ∘ `fp()` for shared ∘ hooks lifecycle ∘ `setErrorHandler` ∘ `setNotFoundHandler`

**Data:** Prisma 7 adapter ∘ `prisma-client` generator ∘ UUID PKs ∘ `@map`/`@@map` ∘ explicit junction tables ∘ FK indexes ∘ `onDelete` specified ∘ service layer

**API:** `/api/v1/` prefix ∘ Zod schemas in `schemas.ts` ∘ `z.coerce.number()` for query params ∘ response schemas ∘ paginated lists ∘ consistent error envelope

**Auth:** @fastify/jwt ∘ 15min access + 7d refresh ∘ bcrypt 12+ rounds ∘ HTTP-only cookies ∘ RBAC guards ∘ rate limit auth endpoints

**Security:** Helmet ∘ CORS whitelist ∘ rate limiting ∘ no `$queryRawUnsafe` ∘ no stack traces in prod ∘ `trustProxy: true` behind nginx

**Testing:** Vitest ∘ `inject()` ∘ test database ∘ `beforeEach` cleanup ∘ real DB (not mocks)

**Deploy:** Multi-stage Dockerfile ∘ `node:22-alpine` ∘ non-root user ∘ `prisma migrate deploy` in CI ∘ `/health` + `/ready` endpoints

## CLAUDE.md Integration

```markdown
- IMPORTANT: Always use nodejs-backend-development skill when building Node.js backends with Fastify, Prisma, or Zod. Use ESM, strict TypeScript, app factory pattern, Prisma 7 with driver adapter, UUID PKs, @map/@@map, Zod type provider, service layer between routes and Prisma, and fp() for shared plugins.
```
