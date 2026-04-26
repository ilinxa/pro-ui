# Monitoring, Maintenance & Production

Read this when tuning VACUUM/autovacuum, configuring PgBouncer, using pg_stat_statements, detecting bloat, tuning memory/WAL, or setting up production logging.

## 1. Autovacuum Tuning

```
autovacuum = on
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.2
-- Trigger: threshold + scale_factor * table_size
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.1
autovacuum_vacuum_cost_delay = 2ms
autovacuum_vacuum_cost_limit = 200            -- per-worker cost limit
```

```sql
-- Per-table override (hot tables)
ALTER TABLE events SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_vacuum_cost_delay = 0);
```

## 2. Transaction ID Wraparound

32-bit txids (~4B). If not frozen, DB shuts down.
```sql
SELECT relname, age(relfrozenxid) AS xid_age FROM pg_class WHERE relkind = 'r' ORDER BY age(relfrozenxid) DESC LIMIT 10;
SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;
-- CRITICAL if age > 2 billion. Emergency: VACUUM FREEZE problematic_table;
```

## 3. PgBouncer

Each PG connection = ~10MB process. PgBouncer multiplexes thousands of app connections onto small pool.

| Mode | Description | Use |
|------|-------------|-----|
| `transaction` | Returned after each tx | **Default choice** |
| `session` | Held for session | Prepared statements, LISTEN/NOTIFY |
| `statement` | Returned after each statement | Rare, autocommit only |

```ini
pool_mode = transaction
default_pool_size = 25
max_client_conn = 1000
reserve_pool_size = 5
server_idle_timeout = 600
auth_type = scram-sha-256
```

**Pool sizing:** `(CPU cores × 2) + 1`. Typically 25-50 connections.

## 4. Monitoring Views

```sql
-- Active queries
SELECT pid, usename, state, now() - query_start AS duration, wait_event, query
FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;
SELECT pg_cancel_backend(pid);     -- graceful
SELECT pg_terminate_backend(pid);  -- forceful

-- Table health
SELECT relname, n_live_tup, n_dead_tup,
       round(100.0 * n_dead_tup / greatest(n_live_tup + n_dead_tup, 1), 1) AS dead_pct,
       last_vacuum, last_autovacuum FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;

-- Unused indexes
SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes WHERE idx_scan = 0 AND NOT indisunique ORDER BY pg_relation_size(indexrelid) DESC;

-- Cache hit ratio (target > 99%)
SELECT round(sum(heap_blks_hit)::numeric / greatest(sum(heap_blks_hit + heap_blks_read), 1) * 100, 2) FROM pg_statio_user_tables;
```

## 5. pg_stat_statements

```
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
pg_stat_statements.max = 10000
```

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Slowest by total time
SELECT calls, round(total_exec_time::numeric, 2) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms, rows, query
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;

-- Worst I/O
SELECT calls, shared_blks_read, shared_blks_hit,
       round(100.0 * shared_blks_hit / greatest(shared_blks_hit + shared_blks_read, 1), 1) AS hit_pct, query
FROM pg_stat_statements ORDER BY shared_blks_read DESC LIMIT 20;
```

## 6. Bloat Detection & Fix

```sql
-- Table bloat
SELECT relname, pg_size_pretty(pg_relation_size(relid)),
       round(100.0 * n_dead_tup / greatest(n_live_tup + n_dead_tup, 1), 1) AS dead_pct
FROM pg_stat_user_tables WHERE n_dead_tup > 1000 ORDER BY n_dead_tup DESC;
```

```bash
# pg_repack: online defrag without locking (unlike VACUUM FULL)
pg_repack -d mydb -t bloated_table
pg_repack -d mydb -i idx_bloated
```

## 7. Memory Tuning

```
shared_buffers = '4GB'          -- 25% RAM
effective_cache_size = '12GB'   -- 75% RAM (hint only)
work_mem = '64MB'               -- per-operation (conservative: connections × work_mem × ops < RAM)
maintenance_work_mem = '1GB'    -- VACUUM, CREATE INDEX
huge_pages = try
```

## 8. WAL Tuning

```
wal_buffers = '64MB'
max_wal_size = '4GB'
min_wal_size = '1GB'
checkpoint_completion_target = 0.9
checkpoint_timeout = '10min'
```

## 9. Logging

```
log_min_duration_statement = 500    -- slow queries > 500ms
log_statement = 'ddl'
log_lock_waits = on
log_connections = on
log_disconnections = on
log_destination = 'jsonlog'         -- PG15+ structured JSON
```

## 10. Production Checklist

| Category | Item |
|----------|------|
| **Security** | SCRAM-SHA-256, SSL verify-full, restrict pg_hba, RLS |
| **Backup** | Automated backups, WAL archiving, restore testing |
| **Monitoring** | pg_stat_statements, dead tuple alerts, connection alerts, replication lag, txid age |
| **Performance** | PgBouncer, shared_buffers 25% RAM, work_mem tuned, autovacuum tuned |
| **Operations** | statement_timeout, idle_in_transaction_timeout, slow query logging, data checksums |
| **HA** | Streaming replication, Patroni for auto-failover |
