# PostgreSQL Architecture & Internals

Read this when configuring PostgreSQL memory, WAL, VACUUM, checkpoints, understanding MVCC/bloat, setting up Docker, or tuning server parameters.

## 1. Process Architecture

Process-per-connection model. Postmaster forks a backend for each client.

| Process | Role |
|---------|------|
| **Postmaster** | Listens for connections, forks backends |
| **Backend** | One per connection — parses, plans, executes |
| **Background Writer** | Writes dirty pages from shared buffers to disk |
| **WAL Writer** | Flushes WAL buffers to disk for durability |
| **Checkpointer** | Writes all dirty pages at checkpoint intervals |
| **Autovacuum Launcher** | Spawns workers to reclaim dead tuples |
| **AIO Workers (PG18)** | Handle async I/O with `io_method = worker` |

## 2. Memory

**Shared memory** (startup-allocated, all backends share): shared_buffers, WAL buffers, CLOG, lock table.
**Local memory** (per-backend): work_mem, maintenance_work_mem, temp_buffers.

## 3. Storage — 8KB Pages

All data stored in 8 KB pages. Tuple headers (23 bytes): `t_xmin` (inserting tx), `t_xmax` (deleting tx, 0 if live), `t_ctid` (physical location).

**TOAST:** Values > ~2KB auto-compressed and/or moved to TOAST table.

```sql
-- TOAST strategies: PLAIN, EXTENDED (default text/jsonb), EXTERNAL, MAIN
ALTER TABLE my_table ALTER COLUMN data SET STORAGE EXTERNAL;
```

**Tablespaces:**
```sql
CREATE TABLESPACE fast_ssd LOCATION '/mnt/ssd/pg_data';
CREATE TABLE hot_data (id int, data jsonb) TABLESPACE fast_ssd;
```

## 4. MVCC

Every write creates a new tuple version. Readers see a consistent snapshot — no read locks.

```
Tx 100 inserts row:  Tuple A: xmin=100, xmax=0 [LIVE]
Tx 200 updates row:  Tuple A: xmin=100, xmax=200 [DEAD]
                     Tuple B: xmin=200, xmax=0 [LIVE]
Tx 150 (started before 200): sees Tuple A
Tx 300 (started after 200 commits): sees Tuple B
```

**Visibility rule:** tuple visible if xmin committed & before snapshot, AND xmax is 0, uncommitted, or after snapshot.

```sql
-- Check dead tuples (bloat indicator)
SELECT relname, n_dead_tup, n_live_tup,
       round(n_dead_tup::numeric / greatest(n_live_tup, 1) * 100, 1) AS dead_pct
FROM pg_stat_user_tables WHERE n_dead_tup > 1000 ORDER BY n_dead_tup DESC;
```

## 5. WAL (Write-Ahead Log)

Every change written to WAL **before** data page modified. On crash, replays WAL.

```
1. Backend modifies data in shared buffers
2. Backend writes WAL record to WAL buffers
3. On COMMIT → WAL flushed to disk → client gets success
4. Background writer / checkpointer writes dirty pages later
```

```sql
wal_level = 'replica'              -- minimal | replica | logical
max_wal_size = '1GB'
min_wal_size = '80MB'
wal_buffers = '64MB'               -- -1 = auto
checkpoint_completion_target = 0.9
synchronous_commit = 'on'          -- on/off/local/remote_write/remote_apply
```

| `wal_level` | Use | WAL Volume |
|-------------|-----|-----------|
| `minimal` | Standalone, no replication | Smallest |
| `replica` | Streaming replication + PITR | Default |
| `logical` | Logical replication | Largest |

## 6. VACUUM

Without VACUUM: dead tuples accumulate, tables bloat, **transaction ID wraparound** shuts DB down.

**What VACUUM does:** 1) Reclaims dead tuples 2) Updates visibility map (index-only scans) 3) Updates free space map 4) Freezes old txids (prevents wraparound)

```sql
VACUUM my_table;                 -- standard, no lock
VACUUM FULL my_table;            -- rewrites table — ACCESS EXCLUSIVE lock!
VACUUM ANALYZE my_table;         -- vacuum + update statistics
```

**Autovacuum:**
```sql
autovacuum = on                              -- must be on
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.2
-- Trigger: dead_tuples > threshold + scale_factor * reltuples
-- 1M row table: 50 + 0.2 * 1,000,000 = 200,050 dead tuples

-- Per-table override for hot tables
ALTER TABLE hot_table SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_vacuum_cost_delay = 0
);
```

**Transaction ID wraparound:**
```sql
SELECT datname, age(datfrozenxid) AS age FROM pg_database ORDER BY age DESC;
SELECT relname, age(relfrozenxid) AS age FROM pg_class WHERE relkind = 'r' ORDER BY age DESC LIMIT 10;
-- WARNING if age > 1 billion. autovacuum_freeze_max_age (200M) triggers aggressive freeze.
```

## 7. PG18: Asynchronous I/O

Up to 3× read improvement for sequential scans, bitmap heap scans, VACUUM.

```sql
io_method = 'worker'                    -- or 'io_uring' on Linux (best, needs --with-liburing)
io_max_concurrency = 0                  -- 0 = auto
io_combine_limit = '128kB'
-- AIO accelerates reads only. Writes/WAL not yet affected.
```

## 8. Configuration Reference

```sql
-- Memory
shared_buffers = '4GB'                  -- 25% RAM
effective_cache_size = '12GB'           -- 75% RAM (hint to planner, not allocated)
work_mem = '64MB'                       -- per-operation sort/hash
maintenance_work_mem = '1GB'            -- VACUUM, CREATE INDEX
huge_pages = 'try'

-- Connections (keep low, use pooler)
max_connections = 200
superuser_reserved_connections = 3

-- Planner (SSD)
random_page_cost = 1.1                  -- default 4.0 for HDD
effective_io_concurrency = 200

-- Logging
log_min_duration_statement = 500        -- queries > 500ms
log_checkpoints = on
log_lock_waits = on

-- PG18
io_method = 'worker'
```

```sql
-- Changing config
ALTER SYSTEM SET work_mem = '128MB';
SELECT pg_reload_conf();                -- no restart for most params
SET work_mem = '256MB';                 -- per-session
SET LOCAL work_mem = '256MB';           -- current transaction only
-- Restart required: shared_buffers, max_connections, wal_level
```

## 9. System Catalogs

```sql
-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) AS total,
       pg_size_pretty(pg_table_size(oid)) AS table, pg_size_pretty(pg_indexes_size(oid)) AS indexes
FROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
ORDER BY pg_total_relation_size(oid) DESC;

-- Column info
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

-- All indexes on table
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users';
```

| View | Purpose |
|------|---------|
| `pg_stat_activity` | Current connections and queries |
| `pg_stat_user_tables` | Seq/idx scans, dead tuples |
| `pg_stat_user_indexes` | Index usage stats |
| `pg_statio_user_tables` | Buffer hits vs reads |
| `pg_locks` | Current locks |
| `pg_stat_bgwriter` | Checkpoint and bgwriter stats |
| `pg_stat_io` (PG16+) | I/O by backend type |

## 10. Docker Quick Start

```yaml
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: changeme123
      POSTGRES_DB: myapp
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    command: >
      postgres -c shared_buffers=256MB -c work_mem=64MB
      -c random_page_cost=1.1 -c log_min_duration_statement=200
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  pgdata:
```

```bash
docker compose up -d
psql postgresql://app:changeme123@localhost:5432/myapp
\l   \dt   \di   \d+ users   \x   \timing
```

## 11. Buffer Hit Ratio

```sql
-- Target > 99%
SELECT round(sum(heap_blks_hit)::numeric /
      greatest(sum(heap_blks_hit) + sum(heap_blks_read), 1) * 100, 2) AS hit_ratio
FROM pg_statio_user_tables;
```
