# pgvector & Vector Search

Read this when setting up pgvector, creating HNSW/IVFFlat indexes, doing filtered/hybrid vector search, implementing RAG patterns, or tuning vector performance.

## 1. Setup

```sql
CREATE EXTENSION IF NOT EXISTS vector;
-- Docker: image: pgvector/pgvector:pg18
-- Verify: SELECT extversion FROM pg_extension WHERE extname = 'vector';
```

## 2. Vector Type & Distance

```sql
CREATE TABLE documents (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content text NOT NULL,
    embedding vector(1536),  -- fixed dimensions (e.g., OpenAI text-embedding-3-small)
    metadata jsonb DEFAULT '{}'
);

INSERT INTO documents (content, embedding) VALUES ($1, $2::vector);
```

| Operator | Distance | Ops Class | Use |
|----------|----------|-----------|-----|
| `<->` | L2 (Euclidean) | `vector_l2_ops` | General |
| `<=>` | Cosine | `vector_cosine_ops` | **Normalized embeddings (most common)** |
| `<#>` | Neg inner product | `vector_ip_ops` | Max inner product |

```sql
SELECT id, content, embedding <=> $1::vector AS distance
FROM documents ORDER BY embedding <=> $1::vector LIMIT 10;
```

Without indexes this is **exact search** (sequential scan, perfect recall, slow for large tables).

## 3. HNSW Index (Default Choice)

```sql
CREATE INDEX idx_hnsw ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

SET hnsw.ef_search = 100;  -- default 40, higher = better recall
```

| Param | Default | Effect |
|-------|---------|--------|
| `m` | 16 | Connections/node. Higher = better recall, more memory |
| `ef_construction` | 64 | Build search width. Higher = better index, slower build |
| `hnsw.ef_search` | 40 | Query search width (SET per session) |

~99%+ recall with proper tuning. Supports INSERT without rebuild. O(log n) query.

## 4. IVFFlat Index

```sql
CREATE INDEX idx_ivf ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
SET ivfflat.probes = 10;  -- default 1, probes = sqrt(lists) for ~95% recall
```

| | HNSW | IVFFlat |
|---|------|---------|
| Default recall | ~99% | ~70-80% (probes=1) |
| Build speed | Slower | **Faster** |
| Query speed | **Faster** | Slower at high probes |
| Insert | ✅ No rebuild | ❌ Degrades |
| **Recommendation** | **Default** | Budget, large datasets |

## 5. Iterative Scans (0.8.0+)

```sql
SET hnsw.iterative_scan = relaxed_order;
SET ivfflat.iterative_scan = on;
-- Keeps fetching from index until enough rows pass filter
SELECT id FROM documents WHERE metadata->>'category' = 'science'
ORDER BY embedding <=> $1::vector LIMIT 10;

-- Tuning
SET hnsw.max_scan_tuples = 20000;   -- max tuples to scan
SET ivfflat.max_probes = 100;        -- max clusters to check
```

## 6. Quantization

```sql
-- halfvec (16-bit, half memory)
embedding halfvec(1536)
CREATE INDEX idx_half ON docs USING hnsw (embedding halfvec_cosine_ops);

-- Binary (1 bit/dim, 1/32 memory)
embedding bit(1536)
CREATE INDEX idx_bin ON docs USING hnsw (embedding bit_hamming_ops);
-- Use: binary search top-1000 candidates → re-rank with full vectors
```

## 7. Filtered Vector Search

```sql
-- Partial index
CREATE INDEX idx_active ON documents USING hnsw (embedding vector_cosine_ops) WHERE is_active = true;

-- With iterative scan + structured filter
SET hnsw.iterative_scan = relaxed_order;
SELECT id FROM documents WHERE metadata @> '{"type":"article"}' AND created_at > '2026-01-01'
ORDER BY embedding <=> $1::vector LIMIT 10;
```

## 8. Hybrid Search (Vector + FTS)

```sql
-- RRF: Reciprocal Rank Fusion
WITH vector_results AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank_v
    FROM articles ORDER BY embedding <=> $1::vector LIMIT 50
), fts_results AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(search_vector, q) DESC) AS rank_f
    FROM articles, websearch_to_tsquery('english', $2) AS q
    WHERE search_vector @@ q LIMIT 50
)
SELECT COALESCE(v.id, f.id),
       COALESCE(1.0/(60+v.rank_v), 0) + COALESCE(1.0/(60+f.rank_f), 0) AS rrf_score
FROM vector_results v FULL OUTER JOIN fts_results f ON v.id = f.id
ORDER BY rrf_score DESC LIMIT 10;
```

## 9. RAG Patterns

```sql
CREATE TABLE chunks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id bigint REFERENCES documents(id),
    chunk_index int NOT NULL, content text NOT NULL,
    embedding vector(1536), token_count int
);
CREATE INDEX idx_chunks_hnsw ON chunks USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=100);

-- Context enrichment: get surrounding chunks
WITH top AS (SELECT id, document_id, chunk_index, embedding <=> $1::vector AS dist
    FROM chunks ORDER BY embedding <=> $1::vector LIMIT 5)
SELECT tc.content, prev.content AS prev, nxt.content AS next
FROM top tc
LEFT JOIN chunks prev ON prev.document_id = tc.document_id AND prev.chunk_index = tc.chunk_index - 1
LEFT JOIN chunks nxt ON nxt.document_id = tc.document_id AND nxt.chunk_index = tc.chunk_index + 1;
```

## 10. Performance

```sql
SET maintenance_work_mem = '2GB';            -- for index builds
SET max_parallel_maintenance_workers = 4;    -- PG18 parallel HNSW build
SELECT pg_size_pretty(pg_relation_size('idx_hnsw'));
```

## 11. When to Use pgvector vs Dedicated DBs

**pgvector sufficient:** ≤10M vectors, already using PG, filtered/hybrid search, moderate-scale RAG.
**Dedicated (Pinecone/Qdrant/Weaviate):** billions of vectors, specialized quantization, vector search as primary workload.
