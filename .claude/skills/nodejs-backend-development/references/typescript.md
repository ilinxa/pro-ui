# TypeScript Conventions

Read this when configuring TypeScript, handling ESM imports, validating env vars, organizing types, or using branded types.

## 1. Strict Mode (Non-Negotiable)

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "paths": { "@/*": ["./src/*"], "@generated/*": ["./src/generated/*"] }
  },
  "include": ["src/**/*", "prisma/seed.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## 2. ESM

```typescript
// ✅ .js extension for local imports (tsx resolves in dev, tsup bundles in prod)
import { buildApp } from './app.js';
import { prisma } from '../plugins/prisma.js';
// ✅ Package imports — no extension
import Fastify from 'fastify';
// ❌ .ts extension, ❌ missing extension for local files
```

## 3. Environment Validation

```typescript
// src/lib/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  // Unset → true (reflect request origin, works with credentials). Comma-separated
  // list → array of origins (strict allowlist). Never defaults to '*' because
  // `origin: '*'` is rejected by browsers when `credentials: true` is also set.
  CORS_ORIGIN: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()) : true)),
});

export type Env = z.infer<typeof EnvSchema>;

function validateEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) { console.error('❌ Invalid env:', result.error.format()); process.exit(1); }
  return result.data;
}

export const env = validateEnv();
```

Call once at startup. Import `env` everywhere — never use `process.env` directly after. The one allowed exception is this file (the validator must read raw `process.env` to hydrate the schema).

## 4. Type Organization

| Type | Location |
|------|----------|
| Route schemas (Zod) | `src/routes/{resource}/schemas.ts` |
| Service I/O | Inline in service files |
| Shared types | `src/types/index.ts` |
| Prisma generated | `src/generated/prisma/` — never edit |
| Fastify augmentations | Alongside the plugin that registers the decorator |
| Environment | `src/lib/env.ts` |

### Infer from Zod

```typescript
export const CreateUserBody = z.object({ email: z.string().email(), name: z.string().min(1) });
export type CreateUserInput = z.infer<typeof CreateUserBody>;  // never duplicate manually
```

### Infer from Prisma

```typescript
import type { User, Prisma } from '../generated/prisma/client.js';
type UserWithPosts = Prisma.UserGetPayload<{ include: { posts: true } }>;
type CreateUserData = Prisma.UserCreateInput;
```

## 5. Fastify Type Augmentation

```typescript
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string; type?: 'access' | 'refresh' };
    user: { sub: string; role: string; type?: 'access' | 'refresh' };
  }
}
```

Place in the same file as the plugin that registers the decorator.

## 6. Branded Types (Optional)

```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };
export type UserId = Brand<string, 'UserId'>;
export type PostId = Brand<string, 'PostId'>;
export const UserId = (id: string) => id as UserId;
// getUser(UserId('abc')) ✅ | getUser(PostId('abc')) ❌ | getUser('abc') ❌
```

## 7. Utility Patterns

```typescript
// Result type
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Readonly by default
function processItems(items: readonly string[]) { /* items.push('x') ❌ */ }
```

## 8. Anti-Patterns

❌ `any` → ✅ `unknown` + type guards
❌ `as` without validation → ✅ Zod runtime validation, then `z.infer`
❌ Duplicate types Zod defines → ✅ `z.infer<typeof Schema>`
❌ Duplicate types Prisma generates → ✅ `Prisma.UserGetPayload<...>`
❌ `process.env.X` everywhere → ✅ validated `env` from `src/lib/env.ts`
❌ `// @ts-ignore` → ✅ fix the error or `// @ts-expect-error` with reason
❌ CommonJS `require()` → ✅ ESM `import`
❌ `String`, `Number` wrappers → ✅ `string`, `number` primitives
