# Fastify Architecture

Read this when working with plugins, encapsulation, hooks lifecycle, decorators, error handling, graceful shutdown, or plugin registration order.

## 1. Plugin System

Everything is a plugin — routes, DB, auth. Registered via `fastify.register()`.

```typescript
import type { FastifyPluginAsync } from 'fastify';
const myPlugin: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/hello', async () => ({ message: 'world' }));
};
await app.register(myPlugin, { prefix: '/api/v1' });
```

## 2. Encapsulation

Each `register()` creates a new context. Decorators/hooks inside don't leak to parent/siblings.

```typescript
app.register(async (instance) => {
  instance.decorate('pluginOnly', 'secret');
  instance.get('/inside', async () => instance.pluginOnly);  // ✅
});
app.get('/outside', async function () { return this.pluginOnly; });  // ❌ undefined
```

**Break encapsulation with `fp()`** for globally-needed plugins (Prisma, auth):

```typescript
import fp from 'fastify-plugin';
export default fp(async (fastify) => {
  fastify.decorate('prisma', prismaClient);
}, { name: 'prisma' });
```

| Use `fp()` | Don't use `fp()` |
|-----------|-----------------|
| Database connections, auth decorators | Route modules |
| Shared utilities, global error handlers | Resource-specific logic |

## 3. Request Lifecycle & Hooks

```
Incoming → Routing → onRequest → preParsing → Parsing → preValidation → Validation
→ preHandler → Handler → preSerialization → onSend → Response → onResponse
```

```typescript
// Async (preferred)
fastify.addHook('preHandler', async (request, reply) => {
  request.user = await verifyToken(request.headers.authorization);
});

// Route-level hooks (after global hooks)
fastify.get('/admin', { onRequest: async (req, reply) => { await requireAdmin(req); } }, handler);
```

**Hook rules:**
- `onRequest`: `request.body` always undefined (parsing hasn't happened)
- `preHandler`: body parsed and validated — use for permission checks
- `onSend`: can modify serialized payload
- `onResponse`: response already sent — logging/metrics only
- `onError`: fires on error, but use `setErrorHandler` for replies
- Hooks fire in registration order, are encapsulated (except `fp()`)

## 4. Decorators

```typescript
import { env } from '../lib/env.js';

fastify.decorate('config', { jwtSecret: env.JWT_SECRET });
fastify.decorateRequest('user', null);  // initialized per-request
fastify.decorateReply('sendSuccess', function (data) { this.status(200).send({ data }); });
```

**Always declare before use** — Fastify uses decorators for V8 hidden class optimization.

```typescript
// ❌ (request as any).user = ... — breaks V8 optimization
// ✅ fastify.decorateRequest('user', null); then request.user = ... in hook
```

## 5. Error Handling

```typescript
app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, 'Request error');
  if (error.validation) return reply.status(400).send({ error: 'Validation Error', message: error.message, statusCode: 400 });
  if (error.statusCode) return reply.status(error.statusCode).send({ error: error.name, message: error.message, statusCode: error.statusCode });
  return reply.status(500).send({ error: 'Internal Server Error',
    message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message, statusCode: 500 });
});

app.setNotFoundHandler((request, reply) => {
  return reply.status(404).send({ error: 'Not Found', message: `Route ${request.method} ${request.url} not found`, statusCode: 404 });
});
```

**Custom errors:**
```typescript
import { createError } from '@fastify/error';
export const NotFoundError = createError('NOT_FOUND', '%s not found', 404);
export const ConflictError = createError('CONFLICT', '%s already exists', 409);
// Usage: throw new NotFoundError('User');
```

## 6. Graceful Shutdown

```typescript
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => { app.log.info(`Received ${sig}`); await app.close(); process.exit(0); });
}
```

`app.close()`: stops new connections, waits for in-flight requests, runs all `onClose` hooks.

## 7. Plugin Registration Order

```typescript
// 1. Compilers (Zod)
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
// 2. Infrastructure (fp() — globally available)
await app.register(sensible); await app.register(cors); await app.register(helmet);
await app.register(prismaPlugin);
// 3. Auth (fp())
await app.register(authPlugin);
// 4. Documentation (before routes)
await app.register(swaggerPlugin);
// 5. Routes (encapsulated per-resource)
await app.register(userRoutes, { prefix: '/api/v1/users' });
// 6. Error handlers
app.setErrorHandler(globalErrorHandler);
```

## 8. Route Organization

```typescript
// src/routes/users/index.ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { getUsersSchema, createUserSchema } from './schemas.js';
import { getUsers, createUser } from './handlers.js';

const userRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', { schema: getUsersSchema }, getUsers);
  fastify.post('/', { schema: createUserSchema }, createUser);
};
export default userRoutes;
```

**Handler separation:**
```typescript
// src/routes/users/handlers.ts
export async function createUser(request, reply) {
  const user = await userService.create(request.server.prisma, request.body);
  return reply.status(201).send(user);
}
```

**Service layer:** services accept `prisma` as parameter (testable, no global singleton):
```typescript
// src/services/user.service.ts
export async function create(prisma: PrismaClient, data: { email: string; name: string }) {
  return prisma.user.create({ data });
}
```

## 9. Anti-Patterns

❌ Express middleware directly → ✅ Fastify hooks or `@fastify/middie`
❌ `(request as any).user` → ✅ `decorateRequest('user', null)` first
❌ `console.log` → ✅ `request.log` or `fastify.log`
❌ Business logic in handlers → ✅ Delegate to service layer
❌ Routes call Prisma directly → ✅ Routes → Services → Prisma
❌ Skip `fp()` for shared plugins → ✅ `fp()` for Prisma, auth, config
❌ Skip `onClose` hooks → ✅ Disconnect DB, close pools
❌ Arrow functions needing `this` → ✅ Regular functions for `this` access
❌ `reply.send()` without `return` in async hooks/guards → ✅ `return reply.send()` — the request continues otherwise and fails with `FST_ERR_REP_ALREADY_SENT` ([Fastify v5 Hooks](https://fastify.dev/docs/latest/Reference/Hooks/#respond-to-a-request-from-a-hook))
