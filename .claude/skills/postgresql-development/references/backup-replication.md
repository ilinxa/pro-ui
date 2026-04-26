# Backup, Recovery & Replication

Read this when doing pg_dump, pg_basebackup, PITR, setting up streaming/logical replication, configuring HA (Patroni), or planning backup strategies.

## 1. Logical Backup (pg_dump)

```bash
pg_dump -Fc -d mydb -f backup.dump           # custom format (compressed, selective restore)
pg_dump -Fd -d mydb -f backup_dir/ -j 4      # directory (parallel)
pg_dump -s -d mydb -f schema.sql              # schema only
pg_dump -t users -t orders -d mydb -f partial.dump  # specific tables
pg_dump -T audit_log -d mydb -Fc -f backup.dump     # exclude tables
```

| Format | Compression | Parallel | Selective | Best For |
|--------|-----------|----------|-----------|----------|
| Custom `-Fc` | Yes | Restore only | Yes | **General purpose** |
| Directory `-Fd` | Yes | Dump & restore | Yes | **Large databases** |
| Plain `-Fp` | No | No | No | Simple, readable |

```bash
pg_restore -d mydb -j 4 backup.dump          # parallel restore
pg_restore -d mydb -t users backup.dump       # selective
pg_dumpall -g -U postgres -f globals.sql      # roles & tablespaces
```

## 2. Physical Backup (pg_basebackup)

```bash
pg_basebackup -h localhost -U repl_user -D /backups/base \
    --wal-method=stream --checkpoint=fast --compress=gzip:9
```

**WAL archiving:**
```
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'
```

## 3. Point-in-Time Recovery (PITR)

```
# postgresql.conf
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2026-02-25 14:30:00 UTC'
# Or: recovery_target_lsn, recovery_target_name, recovery_target_xid
# Create: touch /data/recovery.signal
# After recovery: SELECT pg_wal_replay_resume();
```

Each recovery creates a new **timeline**. PostgreSQL tracks timeline history in WAL segment names.

## 4. Streaming Replication

**Primary:**
```
wal_level = replica
max_wal_senders = 5
wal_keep_size = '1GB'
# pg_hba.conf: host replication repl_user 10.0.0.0/8 scram-sha-256
```

**Standby:**
```bash
pg_basebackup -h primary -U repl_user -D /data/standby --wal-method=stream --write-recovery-conf
# Auto-creates standby.signal + primary_conninfo
```

**Sync vs async:** `synchronous_standby_names = 'standby1'` + `synchronous_commit = on` for sync (guarantees no data loss).

**Replication slots:**
```sql
SELECT pg_create_physical_replication_slot('standby1_slot');
SELECT slot_name, active, pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS lag_bytes
FROM pg_replication_slots;
-- WARNING: inactive slots accumulate WAL — monitor and drop unused
```

## 5. Logical Replication

```sql
-- Publisher
CREATE PUBLICATION my_pub FOR TABLE users, orders;
CREATE PUBLICATION filtered FOR TABLE orders WHERE (region = 'US');  -- PG15+

-- Subscriber
CREATE SUBSCRIPTION my_sub CONNECTION 'host=pub dbname=mydb user=repl'
    PUBLICATION my_pub;

SELECT * FROM pg_stat_subscription;
SELECT * FROM pg_stat_replication;  -- on publisher
```

## 6. pg_upgrade

```bash
pg_upgrade --old-datadir=/data/pg17 --new-datadir=/data/pg18 \
    --old-bindir=/usr/lib/postgresql/17/bin --new-bindir=/usr/lib/postgresql/18/bin --jobs=4
# PG18: --swap mode (rename dirs, much faster)
# PG18: statistics preserved automatically
```

## 7. Backup Strategies

- Full (pg_basebackup weekly/nightly) + continuous WAL archiving
- Retention: 7 days WAL + 2 weekly full backups minimum
- PG17+: `--incremental` for space-efficient backups
- **pgBackRest** (recommended): parallel, encryption, S3/GCS, incremental, verification
- **Barman:** SSH and streaming modes
- **Test restores regularly** — untested backup is not a backup

## 8. High Availability

**Patroni:** Industry standard. etcd/Consul for consensus. Auto-failover, REST API, works with PgBouncer.
**repmgr:** Simpler, lighter. Switchover/failover commands.

## 9. Cloud Managed

AWS RDS/Aurora, GCP Cloud SQL, Azure Database — use provider backup features. pg_dump only for cross-provider migration.
