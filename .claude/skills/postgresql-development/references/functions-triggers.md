# Functions, Procedures & Triggers

Read this when writing SQL or PL/pgSQL functions, stored procedures, triggers, event triggers, or custom aggregates.

## 1. SQL Functions

```sql
CREATE FUNCTION full_name(first text, last text) RETURNS text AS $$
    SELECT first || ' ' || last;
$$ LANGUAGE sql IMMUTABLE;

CREATE FUNCTION active_users() RETURNS SETOF users AS $$
    SELECT * FROM users WHERE is_active = true;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION user_summary(p_user_id bigint)
RETURNS TABLE(name text, order_count bigint, total_spent numeric) AS $$
    SELECT u.name, count(o.id), coalesce(sum(o.total), 0)
    FROM users u LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.id = p_user_id GROUP BY u.id;
$$ LANGUAGE sql STABLE;
```

| Volatility | Meaning | Can Index? |
|------------|---------|-----------|
| `IMMUTABLE` | Same input → same output, no DB reads | ✅ |
| `STABLE` | Consistent within query, reads DB | ❌ |
| `VOLATILE` | May differ per call, side effects (default) | ❌ |

**SQL function inlining:** simple SQL functions marked IMMUTABLE/STABLE can be inlined by planner. PL/pgSQL never inlined.

## 2. PL/pgSQL

```sql
CREATE OR REPLACE FUNCTION calculate_discount(p_user_id bigint, p_total numeric)
RETURNS numeric AS $$
DECLARE v_tier text; v_discount numeric := 0;
BEGIN
    SELECT tier INTO v_tier FROM users WHERE id = p_user_id;
    IF v_tier = 'gold' THEN v_discount := 0.15;
    ELSIF v_tier = 'silver' THEN v_discount := 0.10;
    END IF;
    RETURN p_total * (1 - v_discount);
END; $$ LANGUAGE plpgsql STABLE;
```

**Control flow:** IF/ELSIF/ELSE, CASE, FOR i IN 1..10 LOOP, FOR rec IN SELECT, WHILE, LOOP/EXIT WHEN, FOREACH item IN ARRAY.

**Error handling:**
```sql
EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'Failed: %', SQLERRM; RETURN false;
    WHEN OTHERS THEN RAISE NOTICE 'Error: % %', SQLSTATE, SQLERRM; RETURN false;
```

**Dynamic SQL:**
```sql
EXECUTE format('SELECT * FROM %I WHERE %I = $1', p_table, p_column) USING p_value;
-- %I = identifier quoting (prevents SQL injection), %L = literal, $1 USING = parameterized
```

## 3. Function Overloading

Same name, different argument types. `DROP FUNCTION format_value(integer)` requires signature.

## 4. Stored Procedures (PG11+)

Can COMMIT/ROLLBACK within (unlike functions). Called with `CALL`.

```sql
CREATE PROCEDURE batch_archive(p_batch_size int DEFAULT 1000)
LANGUAGE plpgsql AS $$
DECLARE v_count int;
BEGIN
    LOOP
        WITH moved AS (
            DELETE FROM orders WHERE status = 'completed'
              AND placed_at < now() - interval '1 year' LIMIT p_batch_size RETURNING *
        ) INSERT INTO orders_archive SELECT * FROM moved;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        COMMIT;  -- commit each batch
        EXIT WHEN v_count < p_batch_size;
    END LOOP;
END; $$;
CALL batch_archive(5000);
```

## 5. Triggers

```sql
-- updated_at trigger
CREATE FUNCTION update_timestamp() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

| Timing | Can Modify? | Use Case |
|--------|-----------|----------|
| BEFORE INSERT/UPDATE | Yes (NEW) | Validate, defaults, compute fields |
| AFTER INSERT/UPDATE/DELETE | No | Audit, notifications, cascading |
| INSTEAD OF (views) | N/A | Make views writable |

**Audit trail:**
```sql
CREATE FUNCTION audit_changes() RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_log (table_name, action, old_data, new_data, changed_at, changed_by)
    VALUES (TG_TABLE_NAME, TG_OP,
        CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END,
        now(), current_setting('app.current_user_id', true));
    RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;
```

**Conditional trigger:** `AFTER UPDATE OF price ON products FOR EACH ROW WHEN (OLD.price IS DISTINCT FROM NEW.price)`

**Statement-level:** `FOR EACH STATEMENT` — fires once per statement, not per row.

**PG18:** AFTER triggers execute as the role active when events were queued, not at commit time.

## 6. Event Triggers

```sql
CREATE EVENT TRIGGER log_ddl ON ddl_command_end EXECUTE FUNCTION log_ddl_changes();
CREATE EVENT TRIGGER prevent_drop ON sql_drop WHEN TAG IN ('DROP TABLE', 'DROP INDEX')
    EXECUTE FUNCTION prevent_drops();
```

## 7. Security Definer vs Invoker

```sql
-- SECURITY DEFINER: runs with owner's privileges (caller doesn't need table access)
-- Always set search_path:
CREATE FUNCTION safe_func() RETURNS void AS $$ ... $$
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- SECURITY INVOKER (PG15+): runs with caller's privileges, respects RLS
```

## 8. Performance

1. Prefer SQL functions (can be inlined) 2. Avoid function calls in WHERE (prevents index use) 3. PL/pgSQL plans cached per-session 4. BEFORE ROW triggers add per-row overhead 5. Mark volatility correctly (VOLATILE prevents optimization)
