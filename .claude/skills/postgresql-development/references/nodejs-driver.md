# Node.js / TypeScript Driver (node-postgres)

Read this when connecting to PostgreSQL from Node.js/TypeScript, using pg Pool, transactions, TypeScript types, LISTEN/NOTIFY, streaming, or SSL.

## 1. Setup

```bash
npm install pg
npm install -D @types/pg
```

```typescript
import { Pool } from "pg";
const pool = new Pool({
  connectionString: "postgresql://app:secret@localhost:5432/mydb",
  max: 20, min: 5, idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, statement_timeout: 30000,
});
// Or auto-detect: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
```

**Queries:**
```typescript
const result = await pool.query("SELECT * FROM users WHERE active = $1", [true]);
// result.rows, result.rowCount, result.fields
const { rows: [user] } = await pool.query("SELECT * FROM users WHERE id = $1", [1]);
const { rows: [created] } = await pool.query(
  "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id", ["Alice", "alice@e.com"]);

// ❌ NEVER: pool.query(`SELECT * FROM users WHERE email = '${email}'`)
```

## 2. Transactions

```typescript
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [100, fromId]);
  await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [100, toId]);
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();  // ALWAYS release back to pool
}
```

**Transaction helper:**
```typescript
async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try { await client.query("BEGIN"); const r = await fn(client); await client.query("COMMIT"); return r; }
  catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
}
```

**Savepoints:** `SAVEPOINT sp1` → try → `ROLLBACK TO sp1` on error.

## 3. TypeScript Types

```typescript
interface User { id: number; name: string; email: string; created_at: Date; }
const result = await pool.query<User>("SELECT * FROM users WHERE id = $1", [1]);
const user: User = result.rows[0];
```

**Custom type parsers:**
```typescript
import { types } from "pg";
types.setTypeParser(types.builtins.INT8, (val) => parseInt(val, 10));   // BIGINT as number
types.setTypeParser(types.builtins.NUMERIC, (val) => parseFloat(val));  // NUMERIC as number
types.setTypeParser(types.builtins.DATE, (val) => val);                 // DATE as string
```

## 4. Streaming

```typescript
import QueryStream from "pg-query-stream";  // npm install pg-query-stream
const client = await pool.connect();
const stream = client.query(new QueryStream("SELECT * FROM large_table WHERE created_at > $1", [since], { batchSize: 100 }));
stream.on("data", (row) => { /* process */ });
stream.on("end", () => client.release());
```

## 5. LISTEN / NOTIFY

```typescript
import { Client } from "pg";
const listener = new Client({ connectionString: connStr });  // dedicated client, not pool
await listener.connect();
await listener.query("LISTEN new_order");
listener.on("notification", (msg) => {
  const payload = JSON.parse(msg.payload || "{}");
  if (msg.channel === "new_order") handleNewOrder(payload);
});

// Send
await pool.query("SELECT pg_notify($1, $2)", ["new_order", JSON.stringify({ order_id: 123 })]);
```

## 6. Prepared Statements

```typescript
const result = await pool.query({ name: "get-user", text: "SELECT * FROM users WHERE email = $1", values: [email] });
// Plan cached per-connection after first execution
```

## 7. SSL

```typescript
const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: true, ca: readFileSync("/path/ca.pem").toString() },
});
```

## 8. Error Handling

```typescript
import { DatabaseError } from "pg";
try { await pool.query(...); }
catch (err) {
  if (err instanceof DatabaseError) {
    switch (err.code) {
      case "23505": /* unique_violation */ break;
      case "23503": /* foreign_key_violation */ break;
      case "23514": /* check_violation */ break;
      case "23502": /* not_null_violation */ break;
      case "57014": /* query_canceled (timeout) */ break;
      case "40P01": /* deadlock_detected — retry */ break;
    }
  }
}
pool.on("error", (err) => console.error("Pool error:", err));
```

## 9. Best Practices

1. Always Pool (not Client per request) 2. Always parameterize ($1, $2) 3. Always release clients (finally) 4. Set timeouts 5. Handle pool.on('error') 6. Dedicated Client for LISTEN 7. Custom type parsers for BIGINT/NUMERIC 8. `pool.end()` on shutdown
