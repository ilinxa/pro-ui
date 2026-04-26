# Prisma Schema & Migrations

Read this when designing Prisma models, setting up relations, enums, indexes, running migrations, or seeding data.

## 1. Schema Structure (Prisma 7)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
datasource db {
  provider = "postgresql"
}
```

`prisma-client` (not `prisma-client-js`), `output` required, no `url` (it's in `prisma.config.ts`), adapter required at runtime.

## 2. Model Conventions

```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  posts     Post[]
  @@map("users")
}
```

| Element | Prisma Schema | PostgreSQL |
|---------|--------------|------------|
| Models | `PascalCase` | `snake_case` via `@@map` |
| Fields | `camelCase` | `snake_case` via `@map` |
| Enums | `PascalCase` | `snake_case` via `@@map` |
| Enum values | `UPPER_CASE` | `snake_case` via `@map` |

**Standard columns:** `id` (UUID `@db.Uuid`), `createdAt` (`@default(now())`), `updatedAt` (`@updatedAt`).

**Soft deletes:** `deletedAt DateTime? @map("deleted_at")` — filter with `where: { deletedAt: null }`.

## 3. Relations

**One-to-Many:**
```prisma
model Post {
  id       String @id @default(uuid()) @db.Uuid
  authorId String @map("author_id") @db.Uuid
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  @@index([authorId])
  @@map("posts")
}
```

**One-to-One:** FK as `@id` on child, `onDelete: Cascade`.

**Many-to-Many (explicit junction):**
```prisma
model TeamMember {
  teamId String   @map("team_id") @db.Uuid
  userId String   @map("user_id") @db.Uuid
  role   TeamRole @default(MEMBER)
  team   Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([teamId, userId])
  @@index([userId])
  @@map("team_members")
}
```

Always use explicit junction tables — implicit M2M doesn't support extra fields.

**Cascade rules:** `Cascade` (disposable children), `Restrict` (independent value), `SetNull` (outlives parent). Always specify `onDelete` explicitly — default is `Restrict`.

## 4. Enums

```prisma
enum Role {
  USER  @map("user")
  ADMIN @map("admin")
  @@map("role")
}
```

## 5. Indexes

```prisma
@@index([authorId])                  // FK index (required — PG doesn't auto-create)
@@index([authorId, status])          // Composite (most selective column first)
@@unique([authorId, title])          // Business rule uniqueness
```

Always index FK columns and columns in frequent WHERE clauses.

## 6. Migrations

```bash
npx prisma migrate dev --name add_posts_table    # dev: create + apply
npx prisma migrate dev --reset                    # reset: drop + recreate + seed
npx prisma migrate deploy                         # prod/CI: apply pending
npx prisma db push                                # prototyping only (no migration files)
```

One concern per migration. Never edit old migrations. Name descriptively: `add_users_table`, `add_index_posts_author_id`.

## 7. Seeding

```typescript
// prisma/seed.ts — standalone script; runs outside the Fastify app but still
// validates env through the same Zod schema for consistency.
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../src/lib/env.js';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seed() {
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin', role: 'ADMIN' },
  });
}
seed().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

Always `upsert` in seeds — idempotent, safe to run multiple times.

## 8. Anti-Patterns

❌ `prisma-client-js` → ✅ `prisma-client`
❌ Omit `output` → ✅ Specify path
❌ URL in `schema.prisma` → ✅ URL in `prisma.config.ts`
❌ `new PrismaClient()` without adapter → ✅ Pass `PrismaPg` adapter
❌ Implicit M2M → ✅ Explicit junction tables
❌ Skip `@map`/`@@map` → ✅ Map everything to snake_case
❌ Edit old migrations → ✅ Create new ones
❌ Auto-increment IDs → ✅ UUID `@default(uuid())`
❌ Skip FK indexes → ✅ `@@index` on every FK column
