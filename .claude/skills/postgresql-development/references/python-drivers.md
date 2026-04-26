# Python Drivers (psycopg 3 & asyncpg)

Read this when connecting to PostgreSQL from Python, using psycopg3 or asyncpg, managing connections pools, row factories, COPY operations, or handling errors.

## 1. psycopg 3 Setup

```bash
pip install "psycopg[binary,pool]"   # full install
pip install "psycopg[c,pool]"        # C acceleration (fastest)
```

```python
import psycopg
with psycopg.connect("postgresql://user:pass@localhost/mydb") as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM users WHERE active = %s", (True,))
        rows = cur.fetchall()
```

**Always parameterize:**
```python
cur.execute("SELECT * FROM users WHERE email = %s", (email,))  # ✅ positional
cur.execute("SELECT * FROM users WHERE name = %(name)s", {"name": "Alice"})  # ✅ named
# ❌ NEVER: cur.execute(f"SELECT * FROM users WHERE email = '{email}'")
```

**Fetch:** `fetchone()`, `fetchall()`, `fetchmany(10)`, or iterate `for row in cur`.

## 2. Transactions

```python
with conn.transaction():  # auto-commit on exit, rollback on exception
    conn.execute("UPDATE accounts SET balance = balance - %s WHERE id = %s", (100, 1))
    conn.execute("UPDATE accounts SET balance = balance + %s WHERE id = %s", (100, 2))

# Savepoints
with conn.transaction():
    conn.execute("INSERT INTO orders ...")
    with conn.transaction():  # nested = savepoint
        conn.execute("INSERT INTO order_items ...")

# Autocommit (required for VACUUM)
conn = psycopg.connect(conninfo, autocommit=True)
```

## 3. Row Factories

```python
from psycopg.rows import dict_row, namedtuple_row, class_row
from pydantic import BaseModel

class User(BaseModel):
    id: int; name: str; email: str

with conn.cursor(row_factory=class_row(User)) as cur:
    cur.execute("SELECT id, name, email FROM users WHERE id = %s", (1,))
    user = cur.fetchone()  # User(id=1, name='Alice', email='alice@example.com')

# Also works with dataclasses via class_row
conn = psycopg.connect(conninfo, row_factory=dict_row)  # default for connection
```

## 4. Async

```python
async with await psycopg.AsyncConnection.connect(conninfo) as aconn:
    async with aconn.cursor(row_factory=dict_row) as cur:
        await cur.execute("SELECT * FROM users WHERE id = %s", (1,))
        user = await cur.fetchone()
```

## 5. Connection Pool

```python
from psycopg_pool import ConnectionPool, AsyncConnectionPool

pool = ConnectionPool(conninfo="postgresql://user:pass@localhost/mydb",
    min_size=5, max_size=20, max_idle=300, max_lifetime=3600)
with pool.connection() as conn: conn.execute("SELECT 1")
pool.close()

# Async pool (FastAPI lifespan)
apool = AsyncConnectionPool(conninfo=conninfo, min_size=5, max_size=20, open=False)
async def lifespan(app):
    await apool.open(); yield; await apool.close()
async def get_db():
    async with apool.connection() as conn: yield conn
```

## 6. Pipeline Mode (3.1+)

```python
with conn.pipeline():  # all sent in one round-trip
    conn.execute("INSERT INTO events (type) VALUES (%s)", ("click",))
    conn.execute("INSERT INTO events (type) VALUES (%s)", ("view",))
```

## 7. COPY Operations

```python
with cur.copy("COPY users (name, email) FROM STDIN") as copy:
    copy.write_row(("Alice", "alice@example.com"))

with cur.copy("COPY users TO STDOUT WITH (FORMAT csv, HEADER)") as copy:
    with open("export.csv", "wb") as f:
        for data in copy: f.write(data)
```

## 8. asyncpg

Fastest Python PG driver (~5× faster). Native protocol, not DB-API. Uses `$1, $2` (not `%s`).

```python
import asyncpg
conn = await asyncpg.connect(user="app", password="secret", database="mydb", host="localhost")
row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", 1)
rows = await conn.fetch("SELECT * FROM users WHERE active = $1", True)
value = await conn.fetchval("SELECT count(*) FROM users")
await conn.execute("INSERT INTO users (name) VALUES ($1)", "Alice")

# Pool
pool = await asyncpg.create_pool(dsn=dsn, min_size=5, max_size=20)
async with pool.acquire() as conn: rows = await conn.fetch("SELECT * FROM users")

# Transactions
async with conn.transaction():
    await conn.execute("UPDATE accounts SET balance = balance - $1 WHERE id = $2", 100, 1)

# Batch (fastest bulk insert)
await conn.copy_records_to_table("users", columns=("name","email"), records=[("A","a@e.com")])
await conn.executemany("INSERT INTO users (name, email) VALUES ($1, $2)",
    [("Alice", "alice@e.com"), ("Bob", "bob@e.com")])
```

## 9. Error Handling

```python
# psycopg
import psycopg.errors
try: conn.execute(...)
except psycopg.errors.UniqueViolation: ...
except psycopg.errors.ForeignKeyViolation: ...
except psycopg.errors.CheckViolation: ...
except psycopg.OperationalError: ...

# asyncpg
import asyncpg
except asyncpg.UniqueViolationError: ...
except asyncpg.ForeignKeyViolationError: ...
```

## 10. Type Mapping (psycopg 3)

| Python | PostgreSQL |
|--------|-----------|
| int | integer/bigint |
| Decimal | numeric |
| str | text |
| bool | boolean |
| datetime (tz-aware) | timestamptz |
| UUID | uuid |
| dict/list | jsonb |

## 11. Best Practices

1. Always parameterize 2. Always use pools 3. Set max_lifetime to recycle 4. Close with context managers 5. psycopg3 for new projects (row factories, pipeline) 6. asyncpg for max throughput (5×) 7. Match driver to framework (asyncpg for raw async, psycopg for SQLAlchemy/FastAPI)
