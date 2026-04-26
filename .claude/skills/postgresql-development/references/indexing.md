# Indexing & Query Optimization

Read this when creating indexes, analyzing EXPLAIN plans, diagnosing slow queries, tuning statistics, or choosing between index types.

## 1. Index Types

### B-tree (Default)
Supports `=`, `<`, `>`, `<=`, `>=`, `BETWEEN`, `ORDER BY`, `LIKE 'abc%'`.

```sql
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_orders_status_date ON orders (status, placed_at DESC);  -- composite
```

**Leftmost prefix rule:** index on `(a, b, c)` serves `(a)`, `(a, b)`, `(a, b, c)`, NOT `(b)` or `(c)` alone.

**PG18 Skip Scan:** relaxes prefix rule. Composite index on `(status, placed_at)` can serve queries on `placed_at` alone by skipping through distinct `status` values. Best when prefix has few distinct values.

### Hash
Equality-only (`=`). Smaller than B-tree for pure equality. WAL-logged since PG10.
```sql
CREATE INDEX idx_sessions_token ON sessions USING hash (token);
```

### GIN (Generalized Inverted Index)
For multi-valued data: arrays, JSONB, full-text search, trigrams.
```sql
CREATE INDEX idx_data ON users USING gin (metadata);                      -- @>, ?, ?|, ?&
CREATE INDEX idx_data_path ON users USING gin (metadata jsonb_path_ops);  -- @> only, smaller
CREATE INDEX idx_tags ON posts USING gin (tags);                          -- array containment
CREATE INDEX idx_fts ON articles USING gin (to_tsvector('english', title || ' ' || body));
CREATE INDEX idx_trgm ON products USING gin (name gin_trgm_ops);         -- fuzzy/ILIKE
```

### GiST (Generalized Search Tree)
Range types, geometric data, PostGIS, nearest-neighbor.
```sql
CREATE INDEX idx_bookings ON bookings USING gist (room_id, during);  -- exclusion constraint
CREATE INDEX idx_geom ON locations USING gist (geom);                -- PostGIS
```
**GIN vs GiST for FTS:** GIN = faster lookups, slower updates, larger (read-heavy). GiST = faster updates, lossy, smaller (write-heavy).

### BRIN (Block Range Index)
Extremely compact for **naturally ordered** data (timestamps, serial IDs). Stores min/max per block range.
```sql
CREATE INDEX idx_logs_created ON logs USING brin (created_at);
-- Tiny index (KBs vs GBs) for huge append-only tables
CREATE INDEX idx_logs_created ON logs USING brin (created_at) WITH (pages_per_range = 32);
```

### Partial Indexes
```sql
CREATE INDEX idx_users_email_active ON users (email) WHERE is_active = true;
-- Query MUST include matching WHERE to use partial index
```

### Expression Indexes
```sql
CREATE INDEX idx_email_lower ON users (lower(email));       -- WHERE lower(email) = lower($1)
CREATE INDEX idx_year ON orders ((extract(year FROM placed_at)));
CREATE INDEX idx_role ON users ((metadata->>'role'));        -- JSONB field
```

### Covering Indexes (INCLUDE)
```sql
CREATE INDEX idx_email_cover ON users (email) INCLUDE (name, created_at);
-- Index-only scan: SELECT name, created_at FROM users WHERE email = $1
```

## 2. Index Management

```sql
CREATE INDEX CONCURRENTLY idx_name ON users (name);   -- no blocking
REINDEX INDEX CONCURRENTLY idx_name;                  -- rebuild without lock
DROP INDEX CONCURRENTLY idx_name;

-- Unused indexes (removal candidates)
SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelname NOT LIKE '%pkey%' AND indexrelname NOT LIKE '%unique%';
```

## 3. EXPLAIN & Query Plans

```sql
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alice@example.com';
EXPLAIN (ANALYZE, BUFFERS, FORMAT json) SELECT * FROM users WHERE email = $1;
-- PG18: ANALYZE auto-includes BUFFERS
```

**Reading plans:**

| Field | Meaning |
|-------|---------|
| `cost=0.42..8.44` | Estimated startup..total cost |
| `rows=1` estimated | From statistics |
| `actual time`, `rows` | Real execution |
| `loops=N` | Multiply actual time × loops |
| `Buffers: shared hit=3` | Pages from cache |

**Key nodes:** Index Scan ✅, Index Only Scan ✅ (best), Bitmap Scan ✅, Seq Scan ⚠️ (OK small tables), Hash Join ✅, Merge Join ✅, Nested Loop ✅ (small inner).

**Red flags:**
- Seq Scan on large table with WHERE → missing index
- `Sort Method: external merge Disk` → work_mem too low
- `rows=1` estimated, `rows=100000` actual → stale stats, run ANALYZE
- Type mismatch: `WHERE user_id = '123'::text` prevents index use
- Function in WHERE without expression index

```sql
-- Fix type mismatch: WHERE user_id = 123 (not '123')
-- Fix function: CREATE INDEX idx_upper ON users (upper(email))
-- Fix stale stats: ANALYZE users;
-- Fix OR: WHERE status IN ('active', 'pending') instead of OR
```

## 4. Statistics

```sql
SELECT attname, n_distinct, most_common_vals, correlation
FROM pg_stats WHERE tablename = 'users' AND attname = 'status';

ANALYZE users;  -- refresh stats for table
ALTER TABLE users ALTER COLUMN status SET STATISTICS 500;  -- increase sample (default 100, max 10000)

-- Extended statistics (correlated columns, PG10+)
CREATE STATISTICS stats_city_zip ON city, zip_code FROM addresses;
CREATE STATISTICS stats_mcv (mcv) ON user_id, status FROM orders;
```

## 5. Query Tuning

```sql
SET LOCAL work_mem = '256MB';                    -- large sort/hash
SET LOCAL enable_seqscan = off;                  -- force index
SET LOCAL max_parallel_workers_per_gather = 4;   -- more parallelism

-- PgBouncer transaction mode: use set_config instead of SET
SELECT set_config('statement_timeout', '5000', true);  -- true = local to tx
```

**Optimization checklist:** 1) EXPLAIN ANALYZE 2) Check Seq Scans → add indexes 3) Check est vs actual rows → ANALYZE 4) Check disk sort → increase work_mem 5) Check hit ratio → increase shared_buffers 6) Covering indexes → eliminate heap 7) Partial indexes → smaller, faster 8) `random_page_cost = 1.1` on SSD 9) Parallel queries 10) COPY for bulk ops
