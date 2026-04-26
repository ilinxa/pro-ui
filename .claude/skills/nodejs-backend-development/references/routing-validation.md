# Routing & Validation

Read this when setting up Zod type provider, defining route schemas, generating Swagger/OpenAPI docs, handling file uploads, or API versioning.

## 1. Zod Type Provider

```typescript
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
```

Set ONCE at app level. Works with Zod v3 and v4 (`fastify-type-provider-zod` v6.1+). Don't mix v3 and v4 imports.

## 2. Schema Definitions

Schemas live in `schemas.ts` alongside the route module:

```typescript
// src/routes/users/schemas.ts
import { z } from 'zod';

export const UserIdParams = z.object({ id: z.string().uuid() });

export const CreateUserBody = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

export const UpdateUserBody = CreateUserBody.partial();

export const UserResponse = z.object({
  id: z.string().uuid(), email: z.string(), name: z.string(),
  role: z.string(), createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});

// Route schema object
export const createUserSchema = {
  tags: ['Users'], description: 'Create a new user',
  body: CreateUserBody,
  response: { 201: UserResponse },
};

export const getUsersSchema = {
  tags: ['Users'], description: 'List users with pagination',
  querystring: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  }),
  response: { 200: z.object({ data: z.array(UserResponse), meta: PaginationMeta }) },
};
```

**Schema object anatomy:** `tags`, `description`, `params`, `querystring`, `body`, `headers`, `response`.

## 3. Applying to Routes

```typescript
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const userRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/', { schema: createUserSchema }, async (request, reply) => {
    const { email, name, role } = request.body;  // ✅ fully typed from Zod
    const user = await fastify.prisma.user.create({ data: { email, name, role } });
    return reply.status(201).send(user);
  });
};
```

**Validation behavior:** request fails → 400 auto. Response fails → 500. Extra properties stripped by Zod.

## 4. Query Parameters

Always `z.coerce` for numeric/boolean — query params are always strings:

```typescript
z.coerce.number().int().min(1).default(1)   // "3" → 3
z.enum(['asc', 'desc']).default('desc')
z.string().optional()                        // undefined if not provided
```

## 5. Shared Schemas

```typescript
// src/lib/schemas.ts
export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const PaginationMeta = z.object({ total: z.number(), page: z.number(), limit: z.number(), totalPages: z.number() });
export function paginatedResponse<T extends z.ZodType>(schema: T) {
  return z.object({ data: z.array(schema), meta: PaginationMeta });
}
export const IdParams = z.object({ id: z.string().uuid() });
```

## 6. Swagger / OpenAPI

```typescript
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

await fastify.register(swagger, {
  openapi: {
    info: { title: 'My API', version: '1.0.0' },
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  },
  transform: jsonSchemaTransform,
});
await fastify.register(swaggerUi, { routePrefix: '/documentation' });
```

Protected routes: add `security: [{ bearerAuth: [] }]` to schema.
Access: `/documentation` (UI), `/documentation/json`, `/documentation/yaml`.

## 7. File Uploads

```typescript
import multipart from '@fastify/multipart';
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
fastify.post('/upload', async (request) => {
  const file = await request.file();
  if (!file) throw fastify.httpErrors.badRequest('No file');
  const buffer = await file.toBuffer();
  return { filename: file.filename, size: buffer.length };
});
```

## 8. API Versioning

```typescript
await app.register(userRoutes, { prefix: '/api/v1/users' });
await app.register(userRoutesV2, { prefix: '/api/v2/users' });
```

URL prefix versioning — explicit, cacheable, works with all clients.

## 9. Anti-Patterns

❌ Inline schemas in routes → ✅ Separate `schemas.ts` files
❌ Raw JSON Schema with Zod provider → ✅ Zod objects (auto-converted)
❌ Forget `z.coerce` for query params → ✅ Coerce all numeric/boolean
❌ Skip response schemas → ✅ Define them (serialization + docs)
❌ Return raw Prisma objects → ✅ Map to response schema types
❌ Mix Zod v3 and v4 → ✅ One version consistently
❌ Swagger in prod → ✅ Disable or restrict in production
