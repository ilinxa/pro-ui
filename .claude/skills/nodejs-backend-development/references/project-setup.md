# Project Setup

Read this when initializing a new project, installing dependencies, configuring Prisma 7, setting up the app factory, or structuring the project directory.

## 1. Prerequisites

Node.js 22 LTS+, pnpm 9+, Docker (for PostgreSQL), PostgreSQL 16+.

## 2. Init & Package.json

```bash
mkdir my-api && cd my-api && pnpm init
```

```json
{
  "type": "module",
  "engines": { "node": ">=22.0.0" },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm --out-dir dist --clean",
    "start": "node dist/index.js",
    "generate": "prisma generate",
    "migrate": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "seed": "tsx prisma/seed.ts",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "typecheck": "tsc --noEmit"
  }
}
```

ESM is mandatory — Fastify v5 and Prisma 7 are ESM-first.

## 3. Dependencies

**Core:**
```bash
pnpm add fastify fastify-plugin @fastify/cors @fastify/helmet @fastify/sensible @fastify/error @fastify/jwt @fastify/swagger @fastify/swagger-ui @fastify/rate-limit @fastify/cookie
pnpm add zod fastify-type-provider-zod
pnpm add dotenv
```

Pino is bundled with Fastify — don't install separately.

**Prisma 7:**
```bash
pnpm add @prisma/client @prisma/adapter-pg
pnpm add -D prisma
```

Prisma 7 requires a driver adapter. `@prisma/adapter-pg` manages its own `pg.Pool` internally.

**Dev:**
```bash
pnpm add -D typescript @types/node tsx tsup pino-pretty
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D vitest @vitest/coverage-v8
```

## 4. Project Structure

```
my-api/
├── prisma/
│   ├── schema.prisma          # Models, enums, indexes
│   ├── migrations/
│   └── seed.ts
├── prisma.config.ts           # DB URL, migrations path, seed command
├── src/
│   ├── generated/prisma/      # Prisma generated client (gitignore or commit)
│   ├── plugins/               # Fastify plugins (prisma, auth, cors, swagger)
│   ├── routes/                # One folder per resource
│   │   └── users/
│   │       ├── index.ts       # Route registration
│   │       ├── handlers.ts    # Handler functions
│   │       └── schemas.ts     # Zod schemas
│   ├── services/              # Business logic (routes delegate here)
│   ├── lib/                   # Shared utilities (env, errors, schemas)
│   ├── types/                 # Global type definitions
│   ├── test/                  # Test setup + helpers
│   ├── app.ts                 # App factory (buildApp)
│   └── index.ts               # Entry point
├── docker-compose.yml
├── Dockerfile
├── .env / .env.example
├── tsconfig.json
└── vitest.config.ts
```

**Routes:** one folder per resource with `index.ts`, `handlers.ts`, `schemas.ts`.
**Services:** business logic layer — routes never call Prisma directly.
**Plugins:** registered via `fastify.register()`, shared ones use `fp()`.

## 5. Prisma 7 Configuration

```typescript
// prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: env('DATABASE_URL') },
});
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
datasource db {
  provider = "postgresql"
}
```

**Key Prisma 7 changes:** `prisma-client` (not `prisma-client-js`), `output` required, no `url` in schema (it's in `prisma.config.ts`), must `import 'dotenv/config'` explicitly.

## 6. Prisma Plugin

```typescript
// src/plugins/prisma.ts
import fp from 'fastify-plugin';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../lib/env.js';

export default fp(async (fastify) => {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();
  fastify.decorate('prisma', prisma);
  fastify.addHook('onClose', async () => { await prisma.$disconnect(); });
}, { name: 'prisma' });

declare module 'fastify' {
  interface FastifyInstance { prisma: PrismaClient; }
}
```

`fp()` breaks encapsulation so `prisma` is available globally. `onClose` hook disconnects on shutdown.

## 7. App Factory

```typescript
// src/app.ts
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './lib/env.js';

export async function buildApp(opts = {}) {
  const app = Fastify({ logger: { level: env.LOG_LEVEL }, ...opts });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(import('@fastify/sensible'));
  // env.CORS_ORIGIN is `true` (reflect origin) when unset, or `string[]` (allowlist)
  // when set to a comma-separated value. See src/lib/env.ts for the transform.
  await app.register(import('@fastify/cors'), { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(import('@fastify/helmet'));
  await app.register(import('./plugins/prisma.js'));
  await app.register(import('./plugins/swagger.js'));
  await app.register(import('./routes/health/index.js'));
  await app.register(import('./routes/users/index.js'), { prefix: '/api/v1/users' });

  return app;
}
```

Factory enables testability (tests call `buildApp()`) and separation (index.ts starts server).

## 8. Entry Point

```typescript
// src/index.ts
import 'dotenv/config';
import { env } from './lib/env.js';
import { buildApp } from './app.js';

const app = await buildApp();
await app.listen({ port: env.PORT, host: env.HOST });  // 0.0.0.0 for Docker

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => { app.log.info(`Received ${sig}`); await app.close(); process.exit(0); });
}
```

## 9. Docker Compose (Dev)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapi
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
volumes:
  pgdata:
```

Hybrid recommended: PostgreSQL in Docker, API locally with `pnpm dev`.

## 10. Environment Variables

```bash
# .env.example (committed)
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapi?schema=public
# JWT_SECRET must be at least 32 characters (enforced by Zod in src/lib/env.ts)
JWT_SECRET=replace-me-with-a-32-char-or-longer-random-string
# JWT_EXPIRES_IN=15m           # optional, defaults to 15m
# CORS_ORIGIN unset → reflect request origin (credential-safe). Set to a
# comma-separated allowlist (e.g. https://app.example.com,https://admin.example.com) in prod.
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

Never use `NEXT_PUBLIC_` or `VITE_` prefixes — backend only. Validate with Zod (see typescript.md).
