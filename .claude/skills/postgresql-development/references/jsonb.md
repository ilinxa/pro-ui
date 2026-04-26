# JSONB & Document Patterns

Read this when working with JSONB operators, functions, SQL/JSON path queries, GIN indexing, or hybrid relational+document patterns.

**Rule: Always use JSONB** (not JSON) — indexable, modifiable, containment operators.

## 1. Operators

**Extraction:**
```sql
data->>'name'                    -- text extraction
data->'address'->>'city'         -- nested text
(data->>'age')::int              -- cast to int
data#>>'{address,zip}'           -- path extraction
data->0                          -- array element
```

**Containment & existence:**
```sql
data @> '{"role":"admin"}'       -- contains
data ? 'email'                   -- key exists
data ?| array['email','phone']   -- any key exists
data ?& array['email','name']    -- all keys exist
```

**Modification:**
```sql
jsonb_set(data, '{role}', '"admin"')                     -- set key
jsonb_set(data, '{address,city}', '"NYC"', true)         -- set nested (create path)
data - 'temporary_field'                                  -- remove key
data #- '{address,suite}'                                 -- remove nested
data || '{"verified": true}'                              -- merge/concatenate
jsonb_insert(data, '{tags,0}', '"important"')            -- insert into array
```

## 2. Functions

```sql
-- Construction
jsonb_build_object('name', 'Alice', 'age', 30)
jsonb_build_array('a', 'b', 'c')
to_jsonb(row)
jsonb_object_agg(key, value)

-- Decomposition
jsonb_each(obj)            -- key-value rows
jsonb_array_elements(arr)  -- array to rows
jsonb_object_keys(obj)     -- keys only

-- Utility
jsonb_typeof(val)          -- 'object', 'array', 'string', 'number', 'boolean', 'null'
jsonb_strip_nulls(obj)     -- remove null values
jsonb_pretty(obj)          -- pretty print
jsonb_array_length(arr)
```

## 3. SQL/JSON Path (PG12+)

```sql
jsonb_path_query(data, '$.items[*] ? (@.price > 20)')     -- matching elements
jsonb_path_exists(data, '$.items[*] ? (@.price > 20)')    -- boolean
jsonb_path_match(data, '$.age > 18')                       -- predicate

-- Path syntax: $ (root), .key, [n], [*] (all), ?() (filter), @ (current), .size(), .type()
```

## 4. Indexing

```sql
-- GIN default: @>, ?, ?|, ?&
CREATE INDEX idx_data ON docs USING gin (data);
-- GIN jsonb_path_ops: @> only, 2-3× smaller
CREATE INDEX idx_data_path ON docs USING gin (data jsonb_path_ops);
-- B-tree on expression
CREATE INDEX idx_role ON users ((data->>'role'));
CREATE INDEX idx_age ON users (((data->>'age')::int));
-- Partial GIN
CREATE INDEX idx_active_tags ON docs USING gin (tags) WHERE status = 'active';
```

**default ops:** varied queries (?/|/&/@>). **jsonb_path_ops:** exclusively @> containment.

## 5. Common Patterns

**Hybrid model (structured + JSONB):**
```sql
CREATE TABLE products (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL, sku text NOT NULL UNIQUE, price numeric(10,2) NOT NULL,
    attributes jsonb NOT NULL DEFAULT '{}',  -- variable per category
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attrs ON products USING gin (attributes);
WHERE price < 50 AND attributes @> '{"color": "red", "type": "shirt"}'
```

**Audit log detail:** `changes jsonb -- {"field": {"old": "X", "new": "Y"}}`

**Config storage:** `CREATE TABLE app_settings (key text PK, value jsonb NOT NULL)`

**Aggregating into JSONB:**
```sql
SELECT jsonb_build_object('user_id', u.id, 'name', u.name,
    'orders', (SELECT jsonb_agg(jsonb_build_object('id', o.id, 'total', o.total))
               FROM orders o WHERE o.user_id = u.id)) FROM users u;
```

## 6. Anti-Patterns

❌ Everything in one JSONB column (name, email, role all in `data jsonb`)
✅ Structured columns for queried/constrained fields, JSONB for variable data

❌ Containment queries without GIN index → sequential scan
✅ `CREATE INDEX idx_docs ON docs USING gin (data jsonb_path_ops)`

❌ Using `json` type instead of `jsonb`
✅ Always `jsonb` — indexable, efficient operators
