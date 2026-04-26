# Database Conventions

Read this when choosing PostgreSQL data types, naming database objects, configuring connection pooling, or setting up health checks.

## 1. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case`, plural | `users`, `team_members` |
| Columns | `snake_case` | `created_at`, `author_id` |
| Primary keys | `id` | `id UUID` |
| Foreign keys | `{referenced_singular}_id` | `user_id`, `post_id` |
| Indexes | `idx_{table}_{columns}` | `idx_posts_author_id` |
| Unique constraints | `uq_{table}_{columns}` | `uq_users_email` |
| Enums | `snake_case` | `post_status`, `user_role` |

## 2. Standard Columns

Every table: `id UUID DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`.

```prisma
model Example {
  id        String   @id @default(uuid()) @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("examples")
}
```

## 3. Data Types

| Use | PostgreSQL | Prisma | Notes |
|-----|-----------|--------|-------|
| Identifiers | `UUID` | `String @db.Uuid` | `gen_random_uuid()` default |
| Text | `TEXT` | `String` | Never `VARCHAR(n)` — no perf difference |
| Money | `INTEGER` (cents) | `Int` | Never `FLOAT`. `DECIMAL` only for accounting |
| Timestamps | `TIMESTAMPTZ` | `DateTime` | Always timezone-aware |
| JSON | `JSONB` | `Json` | Never `JSON` — JSONB indexed, faster |
| Booleans | `BOOLEAN` | `Boolean` | |
| Bounded text | `TEXT` + `CHECK` | `String` + Zod `.max()` | Enforce in app layer |

## 4. Connection Pooling (Prisma 7)

```typescript
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../lib/env.js';

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 20,                        // pool size — node-postgres default is 10
  idleTimeoutMillis: 300_000,     // node-postgres default is 10s — too aggressive
                                  // for long-lived servers; kill idle clients after 5min
  connectionTimeoutMillis: 5_000, // node-postgres default is 0 (wait forever) —
                                  // explicit timeout prevents silent hangs
});
```

**Why explicit timeouts are required in Prisma 7.** Starting with v7, Prisma delegates pooling to the underlying driver (here `node-postgres` via `@prisma/adapter-pg`). Its defaults differ significantly from the v6 Rust-engine pool:

| Setting | Prisma v6 (Rust) | Prisma v7 (`@prisma/adapter-pg`) |
|--------|-----------------|-----------------------------------|
| Pool size (`max`) | `num_cpus * 2 + 1` | `10` |
| Idle timeout (`idleTimeoutMillis`) | `300s` | `10s` |
| Connection timeout (`connectionTimeoutMillis`) | `5s` | `0` (no timeout) |

Leaving `connectionTimeoutMillis` at its v7 default can cause requests to hang forever when the pool is exhausted. Leaving `idleTimeoutMillis` at 10s churns connections unnecessarily on a long-running API. Always set both explicitly. ([Prisma docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool), [node-postgres Pool](https://node-postgres.com/apis/pool))

| Environment | `max` | Rationale |
|-------------|-------|-----------|
| Development | 5 | Single developer |
| Production (single) | 20 | General API |
| Production (multi) | `total_db_connections / instances` | Distribute |

PG default `max_connections` is 100. 4 instances × 20 = 80, leaves room for admin.

## 5. Health Check

```typescript
fastify.get('/health', async () => {
  await fastify.prisma.$queryRaw`SELECT 1`;
  return { status: 'ok', timestamp: new Date().toISOString() };
});
fastify.get('/ready', async (request, reply) => {
  try { await fastify.prisma.$queryRaw`SELECT 1`; return { status: 'ready' }; }
  catch { return reply.status(503).send({ status: 'not ready' }); }
});
```

## 6. Anti-Patterns

❌ `VARCHAR(n)` → ✅ `TEXT`
❌ `FLOAT`/`REAL` for money → ✅ `INTEGER` (cents) or `DECIMAL`
❌ `TIMESTAMP` without tz → ✅ `TIMESTAMPTZ`
❌ `JSON` column → ✅ `JSONB`
❌ Auto-increment PKs → ✅ UUID
❌ Hardcode pool size → ✅ Scale by environment/instances
❌ Skip health endpoint → ✅ `/health` + `/ready`
