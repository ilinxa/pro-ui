# Prisma Queries & Patterns

Read this when writing Prisma CRUD operations, using select/include, filtering, pagination, transactions, handling errors, or optimizing queries.

## 1. CRUD

```typescript
// Create
const user = await prisma.user.create({ data: { email, name, role: 'USER' } });
const post = await prisma.post.create({ data: { title, content, author: { connect: { id: userId } } } });

// Read
const user = await prisma.user.findUnique({ where: { id } });          // null if not found
const user = await prisma.user.findUniqueOrThrow({ where: { id } });  // throws if not found
const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
const users = await prisma.user.findMany({ where: { role: 'USER' }, orderBy: { createdAt: 'desc' }, take: 20 });

// Update
const user = await prisma.user.update({ where: { id }, data: { name: 'New Name' } });
const count = await prisma.user.updateMany({ where: { role: 'USER' }, data: { role: 'MEMBER' } });

// Upsert
const user = await prisma.user.upsert({ where: { email }, create: { email, name }, update: { name } });

// Delete / Soft delete
await prisma.user.delete({ where: { id } });
await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
```

## 2. Select vs Include

```typescript
// select — pick specific fields (fewer columns)
await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } });

// include — fetch related records (joins)
await prisma.user.findUnique({ where: { id }, include: {
  posts: { where: { status: 'PUBLISHED' }, take: 5 },
  _count: { select: { posts: true } },
}});
```

**Rules:** use `select` for API responses (only what client needs). Use `include` for relations. Never use both at same level. Use `_count` instead of loading full relations to count.

## 3. Filtering

```typescript
await prisma.post.findMany({ where: {
  status: 'PUBLISHED',                                    // exact
  title: { contains: 'prisma', mode: 'insensitive' },    // ILIKE
  views: { gte: 100, lt: 1000 },                         // range
  createdAt: { gte: new Date('2026-01-01') },             // date
  deletedAt: null,                                         // IS NULL
  authorId: { in: [id1, id2] },                           // IN
  NOT: { status: 'DRAFT' },
  OR: [{ title: { contains: 'fastify' } }, { title: { contains: 'prisma' } }],
}});
```

## 4. Pagination

**Offset-based:**
```typescript
const [data, total] = await prisma.$transaction([
  prisma.user.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
  prisma.user.count(),
]);
return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
```

**Cursor-based (large datasets):**
```typescript
const users = await prisma.user.findMany({
  take: limit + 1,
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  orderBy: { createdAt: 'desc' },
});
const hasNextPage = users.length > limit;
if (hasNextPage) users.pop();
return { data: users, meta: { hasNextPage, nextCursor: hasNextPage ? users.at(-1)?.id : undefined } };
```

## 5. Transactions

```typescript
// Sequential (independent operations)
const [user, profile] = await prisma.$transaction([
  prisma.user.create({ data: { email, name } }),
  prisma.profile.create({ data: { userId, displayName } }),
]);

// Interactive (complex logic — use tx, not prisma)
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUniqueOrThrow({ where: { id } });
  if (user.balance < amount) throw new Error('Insufficient balance');
  await tx.user.update({ where: { id }, data: { balance: { decrement: amount } } });
  return tx.transfer.create({ data: { fromUserId: id, toUserId: recipientId, amount } });
}, { maxWait: 5000, timeout: 10000, isolationLevel: 'Serializable' });
```

Keep transactions short (hold locks). Always use `tx` inside callback, not global `prisma`.

## 6. Error Handling

```typescript
import { Prisma } from '../generated/prisma/client.js';

try { await prisma.user.create({ data }); }
catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': throw new ConflictError(`Duplicate ${error.meta?.target}`);     // 409
      case 'P2025': throw new NotFoundError('Record');                               // 404
      case 'P2003': throw new BadRequestError('Referenced record missing');           // 400
    }
  }
  throw error;
}
```

| Code | Meaning | HTTP |
|------|---------|------|
| `P2002` | Unique constraint violation | 409 |
| `P2025` | Record not found (update/delete) | 404 |
| `P2003` | Foreign key constraint failure | 400 |
| `P2024` | Connection pool timeout | 503 |

## 7. Raw SQL

```typescript
// Tagged template (safe — parameterized)
const users = await prisma.$queryRaw<User[]>`SELECT id, email FROM users WHERE email ILIKE ${`%${search}%`}`;
await prisma.$executeRaw`UPDATE users SET last_login = NOW() WHERE id = ${userId}`;
// ❌ NEVER: prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`)
```

Prefer Prisma Client methods. Use raw SQL only for CTEs, window functions, complex FTS.

## 8. Performance

```typescript
// ❌ N+1
for (const user of users) { await prisma.post.findMany({ where: { authorId: user.id } }); }
// ✅ Single query
const users = await prisma.user.findMany({ include: { posts: true } });

// ❌ All columns
await prisma.user.findMany();
// ✅ Only needed
await prisma.user.findMany({ select: { id: true, email: true } });

// ❌ Loop creates
for (const item of items) { await prisma.item.create({ data: item }); }
// ✅ Batch
await prisma.item.createMany({ data: items });

// ❌ Load all to count
const count = (await prisma.user.findMany({ where })).length;
// ✅ Count query
const count = await prisma.user.count({ where });
```
