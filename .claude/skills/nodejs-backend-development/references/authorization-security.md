# Authorization & Security

Read this when implementing RBAC guards, CORS, Helmet, rate limiting, input sanitization, or reviewing security.

## 1. RBAC Guards

```typescript
export function requireRole(...allowedRoles: string[]) {
  return async (request, reply) => {
    await request.jwtVerify();
    if (!allowedRoles.includes(request.user.role))
      return reply.status(403).send({ error: 'Forbidden', message: `Requires: ${allowedRoles.join(', ')}`, statusCode: 403 });
  };
}

export function requireOwnerOrRole(getOwnerId: (req) => Promise<string | null>, ...roles: string[]) {
  return async (request, reply) => {
    await request.jwtVerify();
    if (roles.includes(request.user.role)) return;
    const ownerId = await getOwnerId(request);
    if (ownerId !== request.user.sub)
      return reply.status(403).send({ error: 'Forbidden', statusCode: 403 });
  };
}
```

## 2. CORS

```typescript
import cors from '@fastify/cors';
import { env } from '../lib/env.js';

await fastify.register(cors, {
  // env.CORS_ORIGIN is a strict allowlist (string[]) when set, or `true`
  // (reflect the request origin) when unset. The Zod transform in src/lib/env.ts
  // handles the string splitting — never call .split(',') at the use site.
  origin: env.CORS_ORIGIN,
  credentials: true,   // required for cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});
```

Always `credentials: true` for HTTP-only cookie refresh tokens. **Never** combine `credentials: true` with `origin: '*'` — browsers reject this combination. Leaving `CORS_ORIGIN` unset gives you `origin: true` (reflect the request origin), which is credential-compatible.

## 3. Helmet

```typescript
import helmet from '@fastify/helmet';
await app.register(helmet, { contentSecurityPolicy: false }); // disable CSP for APIs
```

Sets: `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Strict-Transport-Security`, etc.

## 4. Rate Limiting

```typescript
import rateLimit from '@fastify/rate-limit';
await fastify.register(rateLimit, {
  global: true, max: 100, timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
  errorResponseBuilder: (req, context) => ({
    error: 'Too Many Requests', message: `Try again in ${Math.ceil(context.ttl / 1000)}s`, statusCode: 429,
  }),
});

// Per-route (auth endpoints — aggressive)
fastify.post('/login', { config: { rateLimit: { max: 5, timeWindow: '5 minutes' } } }, loginHandler);
fastify.post('/register', { config: { rateLimit: { max: 3, timeWindow: '15 minutes' } } }, registerHandler);
```

## 5. Input Sanitization

Zod handles validation. Extra sanitization:
```typescript
const LoginBody = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(100),
});
```

**SQL injection:** Prisma Client and `$queryRaw` tagged templates are safe. Never `$queryRawUnsafe` with user input.

## 6. Request Size

```typescript
const app = Fastify({ bodyLimit: 1048576 }); // 1 MB default
fastify.post('/upload', { bodyLimit: 10485760 }, handler); // 10 MB per-route
```

## 7. Cookie Security (Production)

```typescript
{ httpOnly: true, secure: true, sameSite: 'strict', path: '/api/v1/auth/refresh', maxAge: 7 * 24 * 60 * 60 }
```

## 8. Security Checklist

HTTPS (reverse proxy) ∘ Helmet ∘ CORS whitelist ∘ Rate limit (global + auth) ∘ JWT short-lived ∘ HTTP-only cookies ∘ bcrypt 12+ ∘ Zod validation ∘ Prisma (no raw unsafe) ∘ Redact logs ∘ No stack traces in prod ∘ `pnpm audit` regularly ∘ `trustProxy: true` behind nginx

## 9. Anti-Patterns

❌ `cors({ origin: '*' })` in prod → ✅ Whitelist origins
❌ Skip rate limiting auth → ✅ 5 login/5min, 3 register/15min
❌ `$queryRawUnsafe` with user input → ✅ `$queryRaw` tagged template
❌ Stack traces in prod → ✅ Generic error message
❌ Secrets in code → ✅ Environment variables
❌ Trust X-Forwarded-For without config → ✅ `trustProxy: true`
❌ Skip Helmet → ✅ Register on every project
