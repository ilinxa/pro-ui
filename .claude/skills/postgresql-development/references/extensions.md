# Extensions & Advanced Features

Read this when using pg_trgm (fuzzy search), pgcrypto, full-text search, foreign data wrappers, LISTEN/NOTIFY, materialized views, or custom types/domains.

## 1. pg_stat_statements

```sql
-- postgresql.conf: shared_preload_libraries = 'pg_stat_statements'
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT calls, round(mean_exec_time::numeric, 2) AS mean_ms, query
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
SELECT pg_stat_statements_reset();
```

**Query normalization:** replaces literal values with `$1`, `$2`, grouping structurally identical queries.

## 2. pg_trgm (Fuzzy Search)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SELECT similarity('PostgreSQL', 'Postgre');  -- ~0.54
SELECT * FROM users WHERE name % 'Jon';      -- matches John, Jonas
SET pg_trgm.similarity_threshold = 0.4;

-- GIN index (faster, accelerates ILIKE too)
CREATE INDEX idx_name_trgm ON users USING gin (name gin_trgm_ops);
-- GiST index (KNN distance)
CREATE INDEX idx_name_gist ON users USING gist (name gist_trgm_ops);
SELECT * FROM users ORDER BY name <-> 'Jon' LIMIT 5;

-- Also accelerates: WHERE name ILIKE '%john%'
```

## 3. pgcrypto

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT encode(digest('hello', 'sha256'), 'hex');
SELECT hmac('message', 'secret_key', 'sha256');
SELECT crypt('password', gen_salt('bf', 12));     -- bcrypt
SELECT (crypt('password', stored_hash) = stored_hash);  -- verify
SELECT pgp_sym_encrypt('data', 'key');  SELECT pgp_sym_decrypt(col, 'key');
SELECT gen_random_bytes(32);
```

## 4. Full-Text Search

```sql
-- Types
to_tsvector('english', 'The quick brown foxes')  -- 'brown':3 'fox':4 'quick':2
to_tsquery('english', 'quick & fox')
websearch_to_tsquery('english', 'quick fox -lazy')  -- PG11+ user-friendly

-- Search with ranking
CREATE TABLE articles (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL, body text NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', title), 'A') ||
        setweight(to_tsvector('english', body), 'B')
    ) STORED
);
CREATE INDEX idx_fts ON articles USING gin (search_vector);

SELECT id, title, ts_rank(search_vector, q) AS rank,
       ts_headline('english', body, q) AS snippet
FROM articles, websearch_to_tsquery('english', 'database performance') AS q
WHERE search_vector @@ q ORDER BY rank DESC LIMIT 10;
```

## 5. Foreign Data Wrappers (FDW)

```sql
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
CREATE SERVER remote FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'remote-host', port '5432', dbname 'remote_db');
CREATE USER MAPPING FOR app_user SERVER remote
    OPTIONS (user 'remote_user', password 'pass');
IMPORT FOREIGN SCHEMA public FROM SERVER remote INTO remote_schema;
-- Query as normal: SELECT * FROM remote_schema.users
```

## 6. LISTEN / NOTIFY

```sql
LISTEN new_order;
NOTIFY new_order, '{"order_id": 42}';
SELECT pg_notify('new_order', '{"order_id": 42}');

-- Trigger pattern
CREATE FUNCTION notify_new_order() RETURNS trigger AS $$
BEGIN PERFORM pg_notify('new_order', row_to_json(NEW)::text); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER order_notify AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION notify_new_order();
```

**Limits:** payload max 8000 bytes, notifications lost if no listener, no persistence.

## 7. Materialized Views

```sql
CREATE MATERIALIZED VIEW mv_monthly_sales AS
SELECT date_trunc('month', placed_at) AS month, sum(total) AS revenue, count(*) AS orders
FROM orders GROUP BY 1;

SELECT * FROM mv_monthly_sales WHERE month >= '2026-01-01';  -- fast, uses stored data
REFRESH MATERIALIZED VIEW mv_monthly_sales;  -- full rebuild, blocks reads
-- Concurrent refresh (no read blocking):
CREATE UNIQUE INDEX idx_mv ON mv_monthly_sales (month);
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_sales;
```

**Caveats:** not auto-updated. Refresh via cron, trigger, or app logic.

## 8. Table Inheritance vs Partitioning

Use declarative partitioning (schema-design.md §8). Inheritance is legacy — only for polymorphic tables with different columns per child.

## 9. Custom Types

```sql
-- Enums
CREATE TYPE status AS ENUM ('draft', 'published', 'archived');
ALTER TYPE status ADD VALUE 'review' BEFORE 'published';  -- cannot remove

-- Domains
CREATE DOMAIN email AS text CHECK (VALUE ~ '^[^@]+@[^@]+\.[^@]+$');
CREATE DOMAIN positive_int AS integer CHECK (VALUE > 0);

-- Composite
CREATE TYPE address AS (street text, city text, state text, zip text);
```

## 10. hstore

Key-value pairs (text only, no nesting). Generally prefer JSONB for new projects.
```sql
CREATE EXTENSION IF NOT EXISTS hstore;
attrs -> 'brand'  -- access
attrs ? 'ram'     -- key exists
```

## 11. PostGIS (Brief)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
-- geography(POINT, 4326) for lat/lon, ST_Distance for meters, ST_DWithin for radius
CREATE INDEX idx_geog ON locations USING gist (geog);
```
