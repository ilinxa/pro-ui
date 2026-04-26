# Authentication

Read this when setting up JWT auth, access/refresh tokens, password hashing, protecting routes, or managing sessions.

## 1. Setup

```bash
pnpm add @fastify/jwt @fastify/cookie bcrypt
pnpm add -D @types/bcrypt
```

## 2. Auth Plugin

```typescript
// src/plugins/auth.ts
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { env } from '../lib/env.js';

export default fp(async (fastify) => {
  await fastify.register(cookie);
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
    cookie: { cookieName: 'refreshToken', signed: false },
  });

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
      // Reject refresh tokens on API routes — @fastify/jwt reads from the refresh
      // cookie automatically when the `cookie` option is set, so without this check
      // a valid refresh token would pass authentication on any protected route.
      if (request.user.type === 'refresh') {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Refresh tokens cannot be used for API access',
          statusCode: 401,
        });
      }
    } catch {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        statusCode: 401,
      });
    }
  });
}, { name: 'auth' });

declare module 'fastify' {
  interface FastifyInstance { authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>; }
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string; type?: 'access' | 'refresh' };
    user: { sub: string; role: string; type?: 'access' | 'refresh' };
  }
}
```

## 3. Token Strategy

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| Access | `Authorization: Bearer ...` header | 15 min | API access |
| Refresh | HTTP-only cookie | 7 days | Get new access token |

```typescript
export function generateTokens(fastify, userId: string, role: string) {
  const accessToken = fastify.jwt.sign({ sub: userId, role, type: 'access' }, { expiresIn: '15m' });
  const refreshToken = fastify.jwt.sign({ sub: userId, role, type: 'refresh' }, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}
```

## 4. Password Hashing

```typescript
import bcrypt from 'bcrypt';
const SALT_ROUNDS = 12;
export async function hashPassword(password: string) { return bcrypt.hash(password, SALT_ROUNDS); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }
```

Always bcrypt 12+ rounds (or argon2). Never MD5/SHA for passwords.

## 5. Auth Routes

Register, Login, Refresh, Logout — all set refresh token as HTTP-only cookie:

```typescript
reply.setCookie('refreshToken', refreshToken, {
  path: '/api/v1/auth/refresh',
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60,
});
```

**Login:** find user → verify password → generate tokens → set cookie + return access token.
**Refresh:** verify cookie token → check `type: 'refresh'` → issue new pair → rotate cookie.
**Logout:** `reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' })`.

## 6. Protecting Routes

```typescript
// All routes in plugin
const userRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate);
  fastify.get('/', { schema: getUsersSchema }, getUsers);
};

// Per-route
fastify.get('/profile', { onRequest: [fastify.authenticate] }, handler);

// Role-based
export function requireRole(...roles: string[]) {
  return async (request, reply) => {
    await request.jwtVerify();
    if (!roles.includes(request.user.role))
      return reply.status(403).send({ error: 'Forbidden', statusCode: 403 });
  };
}
fastify.delete('/:id', { onRequest: [requireRole('admin')] }, deleteUser);
```

## 7. Current User

```typescript
fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request) => {
  return fastify.prisma.user.findUnique({ where: { id: request.user.sub }, select: { id: true, email: true, name: true, role: true } });
});
```

## 8. Security Rules

- Access: 15 min. Refresh: 7 days. Rotate refresh on every use.
- Refresh in HTTP-only cookie, never localStorage or response body.
- `secure: true` + `sameSite: 'strict'` in production.
- Never log tokens/passwords — use Pino `redact`.
- Rate limit auth endpoints (see authorization-security.md).
- **Always enforce `type` claim in `authenticate`** — reject `type: 'refresh'` tokens on API routes. Because `@fastify/jwt` reads from the configured cookie when the `Authorization` header is missing, a refresh token could otherwise pass authentication on any protected route.

## 9. Anti-Patterns

❌ JWT in localStorage → ✅ Bearer header (access) + HTTP-only cookie (refresh)
❌ Long-lived access tokens → ✅ 15 min + refresh rotation
❌ MD5/SHA passwords → ✅ bcrypt 12+ or argon2
❌ Return passwordHash → ✅ `select` non-sensitive fields only
❌ Trust JWT without verify → ✅ Always `await request.jwtVerify()`
❌ Skip rate limiting auth → ✅ Rate limit login/register
