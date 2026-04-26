---
name: postgresql-development
description: >
  PostgreSQL 18 database development, schema design, query optimization, and operations.
  Use when writing SQL, designing schemas, creating indexes, writing PL/pgSQL functions,
  configuring psycopg3/asyncpg/node-postgres drivers, setting up JSONB patterns, pgvector
  search, backup/replication, monitoring, security (RLS, SCRAM), or tuning PostgreSQL.
  Covers DDL, DML, EXPLAIN plans, partitioning, transactions, triggers, FTS, PgBouncer.
---

# PostgreSQL Development

PostgreSQL 18 · psycopg 3.3 · asyncpg 0.31 · node-postgres 8.13 · pgvector 0.8.1

## Quick Start

```sql
-- Identity columns (not SERIAL), timestamptz (not timestamp), text (not varchar)
CREATE TABLE users (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email       text NOT NULL UNIQUE,
    name        text NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    metadata    jsonb DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- UUIDv7 PK (PG18 — time-ordered, better B-tree locality than v4)
CREATE TABLE orders (
    id      uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total   numeric(12,2) NOT NULL CHECK (total >= 0),
    status  text NOT NULL DEFAULT 'pending'
);

-- Always index foreign keys
CREATE INDEX idx_orders_user_id ON orders (user_id);

-- UPSERT
INSERT INTO users (email, name) VALUES ('alice@example.com', 'Alice')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

-- Always CONCURRENTLY in production
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);
```

## Key Type Decisions

| Decision | Prefer | Avoid | Why |
|----------|--------|-------|-----|
| Primary key | `bigint IDENTITY` or `uuid DEFAULT uuidv7()` | `SERIAL`, `uuid v4` for PKs | Identity is SQL-standard; v7 has B-tree locality |
| Text | `text` | `varchar(n)` unless limit is meaningful | No perf difference in PG |
| Timestamps | `timestamptz` | `timestamp` (no tz) | Always store with timezone |
| Money | `numeric(p,s)` | `float`, `real`, `money` | Exact arithmetic |
| JSONB | `jsonb` | `json` | Indexable, modifiable, containment ops |

## Task Router

| Task | Reference |
|------|-----------|
| MVCC, WAL, VACUUM, shared_buffers, config params, Docker setup | [references/fundamentals.md](references/fundamentals.md) |
| DDL, data types, INSERT/UPDATE/UPSERT/MERGE, CTEs, window functions, aggregates | [references/sql-data-types.md](references/sql-data-types.md) |
| B-tree/GIN/GiST/BRIN indexes, EXPLAIN plans, statistics, query tuning | [references/indexing.md](references/indexing.md) |
| PKs, FKs, constraints, partitioning, generated columns, naming, migrations | [references/schema-design.md](references/schema-design.md) |
| Isolation levels, locking, deadlocks, advisory locks, SKIP LOCKED queues | [references/transactions.md](references/transactions.md) |
| Roles, RLS, pg_hba.conf, SCRAM-SHA-256, SSL, pgcrypto, auditing | [references/security.md](references/security.md) |
| SQL/PL/pgSQL functions, stored procedures, triggers, event triggers | [references/functions-triggers.md](references/functions-triggers.md) |
| JSONB operators, functions, SQL/JSON path, GIN indexes, hybrid model | [references/jsonb.md](references/jsonb.md) |
| psycopg 3, asyncpg, connection pools, row factories, COPY, pipeline | [references/python-drivers.md](references/python-drivers.md) |
| node-postgres Pool, TypeScript types, LISTEN/NOTIFY, streaming, SSL | [references/nodejs-driver.md](references/nodejs-driver.md) |
| pg_trgm, pgcrypto, full-text search, FDW, materialized views, enums/domains | [references/extensions.md](references/extensions.md) |
| pg_dump, pg_basebackup, PITR, streaming/logical replication, Patroni, HA | [references/backup-replication.md](references/backup-replication.md) |
| VACUUM tuning, PgBouncer, pg_stat_statements, bloat, memory/WAL tuning | [references/monitoring.md](references/monitoring.md) |
| pgvector HNSW/IVFFlat, hybrid search, RAG patterns, quantization | [references/pgvector.md](references/pgvector.md) |

## Universal Rules

1. **Always use `GENERATED ALWAYS AS IDENTITY`** for integer PKs — not `SERIAL` (SQL-standard, prevents accidental overwrites)
2. **Always use `timestamptz`** — never bare `timestamp` without timezone
3. **Always use `text`** — `varchar(n)` only when the length limit is a business rule
4. **Always use `jsonb`** — never `json` unless preserving key order/duplicates is required
5. **Always use parameterized queries** — `$1` / `%s`, never string interpolation (SQL injection)
6. **Always use connection pools** — creating connections costs ~50ms; use psycopg_pool / asyncpg.create_pool / pg Pool
7. **Always `CREATE INDEX CONCURRENTLY`** in production — avoid blocking writes
8. **Always index foreign key columns** — without this, CASCADE deletes do sequential scans
9. **Always use `numeric(p,s)` for money** — never float/real (floating-point errors)
10. **Use `uuidv7()` for UUID PKs** (PG18) — time-ordered, better B-tree performance than v4
11. **Set `random_page_cost = 1.1`** on SSD — default 4.0 assumes spinning disk
12. **Keep transactions short** — long transactions block VACUUM globally
13. **Use `EXPLAIN (ANALYZE, BUFFERS)`** to diagnose slow queries — not just EXPLAIN

## Top Anti-Patterns

❌ `CREATE TABLE users (id SERIAL PRIMARY KEY)` — deprecated, use IDENTITY
✅ `CREATE TABLE users (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY)`

❌ `created_at timestamp DEFAULT now()` — loses timezone
✅ `created_at timestamptz NOT NULL DEFAULT now()`

❌ `price float NOT NULL` — imprecise for money
✅ `price numeric(12,2) NOT NULL CHECK (price >= 0)`

❌ `data json` — no indexing, no containment operators
✅ `data jsonb DEFAULT '{}'`

❌ `cur.execute(f"SELECT * FROM users WHERE email = '{email}'")` — SQL injection
✅ `cur.execute("SELECT * FROM users WHERE email = %s", (email,))`

❌ `CREATE INDEX idx_name ON users (name);` — blocks writes in production
✅ `CREATE INDEX CONCURRENTLY idx_name ON users (name);`

❌ `SELECT * FROM orders` on large table without WHERE — full table scan
✅ Add appropriate indexes, use LIMIT, add WHERE clauses

❌ `VACUUM FULL my_table;` as routine maintenance — ACCESS EXCLUSIVE lock
✅ Let autovacuum handle it; use `pg_repack` for online defrag if needed

❌ `max_connections = 1000` — 1000 processes × ~10MB = 10GB RAM
✅ Use PgBouncer: app → PgBouncer (1000 clients) → PG (50 connections)

❌ `REFERENCES users(id)` on orders.user_id without indexing user_id
✅ Always `CREATE INDEX idx_orders_user_id ON orders (user_id)`

❌ Long-running transactions with no timeout — blocks VACUUM for all tables
✅ `SET statement_timeout = '30s'; SET idle_in_transaction_session_timeout = '60s';`

❌ `WHERE upper(email) = 'ALICE@EXAMPLE.COM'` without expression index
✅ `CREATE INDEX idx_email_lower ON users (lower(email)); WHERE lower(email) = lower($1)`

## Architecture Checklist

**Schema:** Identity columns ∘ timestamptz ∘ text not varchar ∘ jsonb not json ∘ FK indexes ∘ naming conventions (idx_, uq_, chk_, fk_) ∘ CHECK constraints on business rules

**Indexing:** B-tree for equality/range ∘ GIN for JSONB/arrays/FTS ∘ BRIN for time-series ∘ partial indexes for filtered queries ∘ INCLUDE for index-only scans ∘ CONCURRENTLY in production

**Queries:** Parameterized always ∘ EXPLAIN ANALYZE for diagnostics ∘ RETURNING on INSERT/UPDATE ∘ ON CONFLICT for upsert ∘ CTEs for readability ∘ Window functions over self-joins

**Operations:** PgBouncer (transaction mode) ∘ pg_stat_statements enabled ∘ autovacuum tuned for hot tables ∘ shared_buffers = 25% RAM ∘ work_mem conservative ∘ statement_timeout set

**Security:** SCRAM-SHA-256 (not MD5) ∘ SSL verify-full ∘ RLS for multi-tenant ∘ least-privilege roles ∘ default privileges ∘ no trust auth

**Backup:** WAL archiving ∘ pg_basebackup ∘ restore testing ∘ replication monitoring ∘ txid wraparound monitoring

## CLAUDE.md Integration

```markdown
- IMPORTANT: Always use postgresql-development skill when writing PostgreSQL SQL or configuring PG drivers. Use IDENTITY columns (not SERIAL), timestamptz (not timestamp), text (not varchar), jsonb (not json), parameterized queries, connection pools, and CREATE INDEX CONCURRENTLY in production.
```
