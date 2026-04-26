# API Conventions

Read this when designing REST endpoints, choosing response formats, implementing pagination/filtering, or selecting HTTP status codes.

## 1. URL Structure

```
GET    /api/v1/users          # List
POST   /api/v1/users          # Create
GET    /api/v1/users/:id      # Read
PATCH  /api/v1/users/:id      # Update (partial)
DELETE /api/v1/users/:id      # Delete
GET    /api/v1/users/:id/posts # Nested (max 2 levels)
POST   /api/v1/users/:id/deactivate  # Action
```

Plural nouns. `PATCH` for partial (not `PUT`). Max 2 nesting levels, then flatten. Actions as `POST`.

## 2. Response Format

**Success:** `{ "data": { ... } }`
**List:** `{ "data": [...], "meta": { "total": 150, "page": 1, "limit": 20, "totalPages": 8 } }`
**Error:** `{ "error": "NOT_FOUND", "message": "User not found", "statusCode": 404 }`

## 3. Status Codes

| Code | Method | When |
|------|--------|------|
| 200 | GET, PATCH | Returned or updated |
| 201 | POST | Created |
| 204 | DELETE | Deleted (no body) |
| 400 | Any | Validation failure |
| 401 | Any | Not authenticated |
| 403 | Any | Not authorized |
| 404 | GET/PATCH/DELETE | Not found |
| 409 | POST | Duplicate (unique violation) |
| 422 | Any | Business rule violation |
| 429 | Any | Rate limited |
| 500 | Any | Unhandled exception |
| 503 | Any | Service unavailable |

## 4. Pagination

Query: `?page=1&limit=20` (1-indexed, max 100).

```typescript
const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

Service helper:
```typescript
export async function paginate(model, args, page, limit) {
  const [data, total] = await prisma.$transaction([
    model.findMany({ ...args, skip: (page - 1) * limit, take: limit }),
    model.count({ where: args.where }),
  ]);
  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
```

## 5. Filtering & Sorting

```
GET /api/v1/posts?status=published&search=fastify&sort=createdAt&order=desc
```

```typescript
const PostListQuery = PaginationQuery.extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().optional(),
  sort: z.enum(['createdAt', 'title', 'views']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

function buildWhere(query) {
  const where: Prisma.PostWhereInput = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.search) where.OR = [
    { title: { contains: query.search, mode: 'insensitive' } },
    { content: { contains: query.search, mode: 'insensitive' } },
  ];
  return where;
}
```

## 6. Date Format

ISO 8601 with timezone: `2026-02-14T12:00:00.000Z`. Prisma DateTime serializes to this by default.

## 7. Documentation

Every route schema must include: `tags`, `description`, `security` (if authenticated). Swagger UI at `/documentation` in dev.

## 8. Anti-Patterns

❌ Singular names (`/user`) → ✅ Plural (`/users`)
❌ `PUT` for partial → ✅ `PATCH` partial, `PUT` full replace
❌ No pagination → ✅ Always `page` + `limit`
❌ 200 for everything → ✅ Correct codes (201 created, 204 deleted)
❌ Deep nesting → ✅ Max 2 levels, flatten with query params
❌ `GET` for mutations → ✅ `POST`/`PATCH`/`DELETE`
