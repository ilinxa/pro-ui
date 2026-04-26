# Security & Access Control

Read this when creating roles, setting up RLS, configuring pg_hba.conf, implementing SCRAM authentication, SSL, encryption, or auditing.

## 1. Roles

```sql
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';
CREATE ROLE app_readonly NOLOGIN;
CREATE ROLE app_readwrite NOLOGIN;
GRANT app_readonly TO app_user;

-- NOINHERIT: must SET ROLE to activate
CREATE ROLE special_access NOLOGIN NOINHERIT;

ALTER ROLE app_user SET statement_timeout = '30s';
ALTER ROLE app_user CONNECTION LIMIT 10;
-- Role attributes: SUPERUSER, CREATEDB, CREATEROLE, REPLICATION, VALID UNTIL
SET password_encryption = 'scram-sha-256';  -- default since PG14
```

## 2. Privileges

```sql
GRANT USAGE ON SCHEMA app TO app_readonly;
GRANT CREATE ON SCHEMA app TO app_readwrite;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO app_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_readwrite;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO app_readwrite;

-- Specific columns
GRANT SELECT (id, name, email) ON users TO limited_role;

-- Default privileges (future objects)
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT ON TABLES TO app_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_readwrite;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA app FROM app_user;
REVOKE CONNECT ON DATABASE myapp FROM public;
```

## 3. Row-Level Security (RLS)

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;  -- force even for owner

CREATE POLICY users_own ON documents FOR SELECT
    USING (owner_id = current_setting('app.current_user_id')::bigint);
CREATE POLICY users_insert ON documents FOR INSERT
    WITH CHECK (owner_id = current_setting('app.current_user_id')::bigint);
CREATE POLICY admin_all ON documents FOR ALL
    USING (current_setting('app.current_role') = 'admin');

-- Multi-tenant
CREATE POLICY tenant_isolation ON tenant_data FOR ALL
    USING (tenant_id = current_setting('app.tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
SET LOCAL app.tenant_id = 'abc-123-def';  -- per request
```

## 4. pg_hba.conf

```
# TYPE    DATABASE    USER        ADDRESS             METHOD
local     all         postgres                        peer
local     all         all                             scram-sha-256
host      all         all         127.0.0.1/32        scram-sha-256
hostssl   myapp       app_user    0.0.0.0/0           scram-sha-256
host      all         all         0.0.0.0/0           reject
```

| Method | Use |
|--------|-----|
| `scram-sha-256` | **Default.** All password auth |
| `md5` | **Deprecated PG18.** Migrate to SCRAM |
| `peer` | Local unix socket (OS user = PG role) |
| `cert` | Client TLS certificate |
| `trust` | **NEVER in production** |
| `oauth` (PG18) | OAuth 2.0 token validation |

Order matters: first matching rule wins.

## 5. SCRAM-SHA-256

```sql
SET password_encryption = 'scram-sha-256';
ALTER ROLE app_user WITH PASSWORD 'new_password';
-- Verify: SELECT rolname, rolpassword LIKE 'SCRAM-SHA-256$%' FROM pg_authid WHERE rolcanlogin;
```

## 6. SSL/TLS

```sql
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
ssl_min_protocol_version = 'TLSv1.2'
```

| sslmode | Check | Encrypt | Use |
|---------|-------|---------|-----|
| `verify-full` | CA + hostname | Yes | **Production** |
| `verify-ca` | CA only | Yes | Verify issuer |
| `require` | No | Yes | Encrypted only |
| `disable` | No | No | Never in production |

Connection: `postgresql://user:pass@host:5432/db?sslmode=verify-full&sslrootcert=/path/ca.crt`

## 7. Encryption (pgcrypto)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT crypt('password', gen_salt('bf', 12));  -- bcrypt hash
SELECT (crypt('password', stored_hash) = stored_hash);  -- verify
SELECT pgp_sym_encrypt('sensitive', 'key');  -- AES symmetric
SELECT pgp_sym_decrypt(encrypted_col, 'key');
```

## 8. Auditing

```sql
log_statement = 'ddl'            -- none, ddl, mod, all
log_min_duration_statement = 500
log_connections = on
log_disconnections = on
log_lock_waits = on

-- pgAudit extension
CREATE EXTENSION IF NOT EXISTS pgaudit;
pgaudit.log = 'write, ddl'
```

## 9. Security Checklist

1. SCRAM-SHA-256 (not MD5) 2. SSL verify-full 3. Restrict pg_hba.conf 4. Least-privilege roles 5. RLS for multi-tenant 6. Default privileges 7. No trust auth 8. Rotate passwords 9. Audit DDL 10. Connection limits + timeouts
