# Rule: Subagent model selection

> Size budget: ≤2KB (always-loaded, enforced by `pnpm validate:doc-budget`). Established 2026-08-11 (user directive).

Applies to EVERY spawned subagent: Agent-tool calls, workflow `agent()` calls, fix/review/verify/smoke agents.

- **Allowed models:** **Opus 4.8** (`claude-opus-4-8[1m]`) or **Sonnet 5** (`claude-sonnet-5[1m]`) — both natively 1M-context.
- **NEVER Opus 5** (`claude-opus-5`) — observed to not follow project rules/instructions correctly. This includes aliases: if `model: "opus"` resolves to Opus 5 in the current harness, do not use the alias — pass the explicit ID or use Sonnet 5. When unsure what an alias resolves to, use Sonnet 5.
- **Tier by job type:**
  - *Judgment-heavy* (adversarial verify, architecture/plan review, cross-cutting audits): **Opus 4.8** — never downgrade these to save tokens.
  - *Standard implementation* (scoped component fixes, feature slices): **Sonnet 5**.
  - *Chunky/bulk mechanical* (sweeps over many identical sites, scaffolds, format conversions, list regeneration): cheaper tier — **Sonnet 5**, or **Haiku 4.5** only for trivially mechanical work — ALWAYS with accuracy safeguards: tightly scoped prompts naming in-repo templates + coordinator re-runs the central gate battery (tsc/lint/validators) + adversarial verification for anything with judgment in it (the P1/P1.5 method).
- Inheriting the session model (omitting `model`) is acceptable only when the session model is not Opus 5.
