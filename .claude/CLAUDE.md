

## Skills Mandates

- **IMPORTANT:** Use the `mcp-server-standards` skill for any MCP work — server, tool, resource, prompt, transport, client integration, OAuth, Inspector, deployment. Never SSE; always `registerTool()` with Zod object shorthand (not JSON Schema).
- **IMPORTANT:** Use the `nodejs-backend-development` skill for Fastify, JWT, Zod validation, Pino, Vitest, or Docker work in [webapp/server/](webapp/server/), [webapp/worker/](webapp/worker/), and any [packages/](packages/) backend code. *(Note: the skill's default ORM is Prisma; this project uses Drizzle 0.45 — apply the skill's guidance to Drizzle equivalents.)*
- **IMPORTANT:** Use the `postgresql-development` skill for platform schema design, indexes, PL/pgSQL, JSONB patterns, EXPLAIN tuning, RLS, or PgBouncer config. SQLite tier is out of scope for that skill.
- **IMPORTANT:** Use the `frontend-design` (a.k.a. `designer`) skill when designing or refactoring any visual surface in [packages/ui/](packages/ui/), [webapp/frontend/](webapp/frontend/), or `modules/frontend/*/`. Hold the line on the design system tokens defined in [packages/ui/src/styles/globals.css](packages/ui/src/styles/globals.css) — aurora-cyan accent (`oklch(0.78 0.16 195)` dark / `oklch(0.62 0.19 200)` light), warm-charcoal backgrounds, Onest + JetBrains Mono. **Never** use Inter / Roboto / Geist / system-font defaults; **never** ship purple-on-white gradient clichés. One orchestrated reveal per major page (`reveal-up` keyframe + 60ms stagger).
- **IMPORTANT:** Use the `configuring-project-memory` skill when editing this CLAUDE.md, adding `.claude/rules/`, or restructuring memory.
- **IMPORTANT:** Use the `skill-creator-pro` skill to author or restructure any skill in `.claude/skills/`.
