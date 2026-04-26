# Transactions & Concurrency

Read this when working with isolation levels, row/table locking, deadlocks, advisory locks, optimistic concurrency, or SKIP LOCKED queue patterns.

## 1. Transaction Basics

```sql
BEGIN;
    INSERT INTO orders (user_id, total) VALUES (1, 99.99);
    UPDATE users SET order_count = order_count + 1 WHERE id = 1;
COMMIT;

-- Savepoints
BEGIN;
    INSERT INTO orders (...) VALUES (...);
    SAVEPOINT sp1;
    INSERT INTO order_items (...) VALUES (...);  -- might fail
    ROLLBACK TO SAVEPOINT sp1;  -- partial rollback
COMMIT;
```

## 2. Isolation Levels

```sql
BEGIN ISOLATION LEVEL READ COMMITTED;    -- default
BEGIN ISOLATION LEVEL REPEATABLE READ;
BEGIN ISOLATION LEVEL SERIALIZABLE;
```

| Level | Snapshot | Anomalies | Retry Required |
|-------|----------|-----------|----------------|
| READ COMMITTED | Per statement | Non-repeatable reads, phantoms | No |
| REPEATABLE READ | First query | Serialization failures | Yes |
| SERIALIZABLE | First query | Serialization failures (write skew) | Yes |

**REPEATABLE READ/SERIALIZABLE:** application MUST retry on serialization error.

## 3. Row Locks

```sql
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;          -- exclusive
SELECT * FROM accounts WHERE id = 1 FOR NO KEY UPDATE;   -- allows FK checks
SELECT * FROM accounts WHERE id = 1 FOR SHARE;           -- shared
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;   -- fail if locked
SELECT * FROM accounts WHERE id = 1 FOR UPDATE SKIP LOCKED;  -- skip locked rows
```

## 4. Table Locks

| Lock Mode | Conflicts With | Acquired By |
|-----------|---------------|-------------|
| ACCESS SHARE | ACCESS EXCLUSIVE | SELECT |
| ROW EXCLUSIVE | SHARE, EXCLUSIVE, ACCESS EXCLUSIVE | INSERT, UPDATE, DELETE |
| SHARE | ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE | CREATE INDEX |
| ACCESS EXCLUSIVE | Everything | ALTER TABLE, VACUUM FULL, TRUNCATE |

## 5. Lock Monitoring

```sql
-- Blocked queries
SELECT pid, locktype, relation::regclass, mode, granted, waitstart
FROM pg_locks WHERE NOT granted;

-- Blocking chains
SELECT blocked.pid, blocked.query, blocking.pid, blocking.query
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid AND NOT bl.granted
JOIN pg_locks bk ON bk.relation = bl.relation AND bk.granted
JOIN pg_stat_activity blocking ON blocking.pid = bk.pid
WHERE blocked.pid != blocking.pid;
```

## 6. Deadlocks

PG auto-detects and aborts one transaction. **Prevention:** lock in consistent order (by ID), keep transactions short, use `lock_timeout`.

```sql
SET lock_timeout = '5s';
SET statement_timeout = '30s';
SET idle_in_transaction_session_timeout = '60s';
```

## 7. Advisory Locks

Application-level locks not tied to tables/rows.

```sql
SELECT pg_advisory_lock(12345);           -- session-level
SELECT pg_advisory_xact_lock(12345);      -- transaction-level (released on COMMIT)
SELECT pg_try_advisory_lock(12345);       -- non-blocking, returns true/false
SELECT pg_advisory_lock(1, 42);           -- two-param (namespace, key)

-- Job processing
SELECT pg_try_advisory_xact_lock(hashtext('import-users'))  -- true = proceed
```

## 8. Optimistic Concurrency (CAS)

```sql
-- Version column pattern
UPDATE documents SET title = $2, content = $3, version = version + 1
WHERE id = $1 AND version = $4
RETURNING version;
-- 0 rows affected → concurrent modification, reload and retry
```

## 9. Queue Pattern (SKIP LOCKED)

```sql
BEGIN;
SELECT id, payload FROM job_queue WHERE status = 'pending'
ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
-- process job...
UPDATE job_queue SET status = 'completed' WHERE id = $1;
COMMIT;
```

## 10. Common Pitfalls

**Long txns block VACUUM:** monitor with `SELECT pid, age(clock_timestamp(), xact_start) FROM pg_stat_activity`.

**Idle-in-transaction:** kill with `idle_in_transaction_session_timeout = '60s'` or `pg_terminate_backend(pid)`.

**No lock escalation:** PG never escalates row → table locks (unlike SQL Server/Oracle). Locking millions of rows is fine memory-wise.

**Connection exhaustion:** each connection = ~10MB process. Use PgBouncer.
