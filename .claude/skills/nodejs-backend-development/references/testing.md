# Testing

Read this when setting up Vitest, writing Fastify inject() tests, configuring test databases, or organizing integration tests.

## 1. Setup

```bash
pnpm add -D vitest @vitest/coverage-v8
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true, environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8', reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'], exclude: ['src/generated/**', 'src/test/**', 'src/types/**'],
    },
    poolOptions: { forks: { singleFork: true } },
  },
});
```

## 2. Test Database

```typescript
// src/test/setup.ts
import 'dotenv/config';
if (!process.env.DATABASE_URL?.includes('_test'))
  throw new Error('Tests must use a test database (URL must contain "_test")');
```

```bash
# .env.test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapi_test
JWT_SECRET=test-secret-at-least-32-characters-long
NODE_ENV=test
LOG_LEVEL=silent
```

```bash
docker compose exec postgres createdb -U postgres myapi_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapi_test npx prisma migrate deploy
```

## 3. Test Helpers

```typescript
// src/test/helpers.ts
import { buildApp } from '../app.js';
export async function createTestApp() { return buildApp({ logger: false }); }
export async function cleanDatabase(app) {
  await app.prisma.post.deleteMany();
  await app.prisma.user.deleteMany();
}
export function authHeader(token: string) { return { authorization: `Bearer ${token}` }; }
```

## 4. Route Testing with inject()

```typescript
describe('POST /api/v1/users', () => {
  let app;
  beforeAll(async () => { app = await createTestApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  beforeEach(async () => { await cleanDatabase(app); });

  it('creates a user', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/users',
      payload: { email: 'test@example.com', name: 'Test' },
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.email).toBe('test@example.com');
  });

  it('returns 400 for invalid email', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/users',
      payload: { email: 'not-email', name: 'Test' }, headers: authHeader(adminToken) });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 for duplicate', async () => {
    const payload = { email: 'dupe@test.com', name: 'First' };
    await app.inject({ method: 'POST', url: '/api/v1/users', payload, headers: authHeader(adminToken) });
    const res = await app.inject({ method: 'POST', url: '/api/v1/users', payload, headers: authHeader(adminToken) });
    expect(res.statusCode).toBe(409);
  });
});
```

**Key:** `inject()` = no network, no port. `response.json()`, `response.statusCode`, `response.headers`. `beforeEach` cleanup for isolation.

## 5. Service Layer Testing

```typescript
it('creates a user', async () => {
  const user = await userService.create(app.prisma, { email: 'test@example.com', name: 'Test' });
  expect(user.id).toBeDefined();
});
it('throws on duplicate', async () => {
  await userService.create(app.prisma, { email: 'dupe@test.com', name: 'A' });
  await expect(userService.create(app.prisma, { email: 'dupe@test.com', name: 'B' })).rejects.toThrow();
});
```

## 6. Organization

```
routes/users/users.test.ts      ← Route tests (integration)
services/user.service.test.ts   ← Service tests (integration)
lib/password.test.ts            ← Unit test (no DB)
test/setup.ts + helpers.ts      ← Shared
```

| Type | Database | Speed | Focus |
|------|----------|-------|-------|
| Unit | No | Fast | Pure functions |
| Integration | Yes (test DB) | Medium | Routes + services via inject() |
| E2E | Yes | Slow | Full HTTP |

**Focus on integration tests** — inject() + test DB gives best coverage-to-effort.

## 7. Running

```bash
pnpm test                                         # all
pnpm test:coverage                                 # with coverage
pnpm vitest src/routes/users/users.test.ts         # specific
pnpm vitest --watch                                # watch mode
```

## 8. Anti-Patterns

❌ Test against production DB → ✅ Dedicated test database
❌ Share state between tests → ✅ `beforeEach` cleanup
❌ Start real HTTP server → ✅ `app.inject()`
❌ Mock Prisma for integration → ✅ Real test database
❌ Skip error paths → ✅ Test 400, 401, 403, 404, 409
❌ Test implementation → ✅ Test behavior (inputs → outputs)
