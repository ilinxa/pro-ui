---
name: configuring-project-memory
description: >
  Configure, create, review, restructure, or improve CLAUDE.md files and memory hierarchy for Claude Code projects.
  Use when setting up a new project's CLAUDE.md, reviewing an existing CLAUDE.md for issues, splitting a large
  CLAUDE.md into rules/ or skills, integrating skills with CLAUDE.md mandates, or when the user mentions
  CLAUDE.md, project memory, /init, /memory, memory hierarchy, or project configuration.
---

# Configuring CLAUDE.md

CLAUDE.md is Claude Code's persistent project memory — loaded into the system prompt every session, before any user message. Getting it right is high-leverage; getting it wrong wastes context on every single session.

## Quick Start

To bootstrap a new project:

```bash
cd your-project && claude
/init              # generates starter CLAUDE.md from codebase analysis
```

Then immediately: review output, delete generic filler, add what's unique to YOUR project. The `/init` output is a starting point, never a finished product.

To edit during a session: type `#` followed by your instruction, or use `/memory` to open in your editor.

---

## Memory Hierarchy

Claude Code loads four memory levels. Higher = higher priority, loaded first.

| Level | Location | Shared With |
|-------|----------|-------------|
| **Enterprise** (highest) | OS-specific system path (see [references/enterprise-and-advanced.md]) | All org users |
| **Project** | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team via git |
| **User** | `~/.claude/CLAUDE.md` | Just you, all projects |
| **Project Local** (lowest) | `./CLAUDE.local.md` (auto-gitignored) | Just you, this project |

**How lookup works:**

1. Claude walks **up** from `cwd` to root `/`, reading every CLAUDE.md and CLAUDE.local.md it finds
2. CLAUDE.md in **child** directories load on-demand only when Claude reads files in those subtrees (not at launch)
3. All levels **combine** — they don't replace each other. Conflicts resolve by priority.

---

## What Belongs in CLAUDE.md

The core question: **does this instruction apply to every session?**

### YES → Put in CLAUDE.md

- Project identity (1-liner: what this is)
- Tech stack
- Key directories and architecture
- Build / test / lint commands (exact commands)
- 3-5 critical coding conventions
- Domain terminology (jargon, acronyms, entity names)
- Workflow rules (branch naming, commit format, PR process)
- Gotchas and "never touch X" warnings
- MCP tool guidance (when/how to use configured servers)
- Skill mandates (one line per skill — see §Skills Integration below)

### NO → Put somewhere else

| Content | Where Instead | Why |
|---------|---------------|-----|
| Code style details (spacing, indentation) | Linter/formatter config | Deterministic tools are faster and cheaper — never send an LLM to do a linter's job |
| Specialized procedures (>10 lines) | A skill's SKILL.md | Only loads when needed; doesn't tax every session |
| API keys, credentials, secrets | `.env` files + deny in `settings.json` | CLAUDE.md is in the system prompt; treat as public if committed |
| Exhaustive library docs | `@import` or skill references/ | Load on-demand, not every session |
| Content that changes daily | Conversation or auto memory | CLAUDE.md should be relatively stable |
| Generic programming knowledge | Nowhere — Claude already knows | Wastes tokens |

---

## Recommended Structure

```markdown
# Project Context
One-liner: what this project is and does.

## Tech Stack
- [framework], [language], [database], [key libraries]

## Key Directories
- `src/apps/` — Django applications
- `src/core/` — shared utilities and base classes

## Commands
​```bash
make dev        # start development server
make test       # run all tests
make lint       # run linter + formatter
​```

## Conventions
- [3-5 critical rules, not 30]
- Type hints required on all public functions

## Gotchas
- Never import from `legacy/` — it's being removed

## Workflow
- Branch: `feature/<ticket-id>-<short-description>`
- Commits: conventional commits format

## Skills Mandates
- IMPORTANT: Use `my-skill` for [task type]. Never [anti-pattern].
```

**Why this order:** Project identity and tech stack orient Claude immediately. Commands give it operational capability. Conventions and gotchas prevent mistakes. Skills mandates enforce tool usage. Everything else is noise until these are covered.

---

## Conciseness Rules

CLAUDE.md competes for context window with your actual work. Community research (HumanLayer, 2025) indicates frontier LLMs can follow ~150-200 instructions with reasonable consistency, and Claude Code's system prompt already contains ~50 instructions before your CLAUDE.md loads.

**Practical implications:**

- Every line must justify its token cost — challenge every paragraph
- 3-5 convention rules, not 30. If you need 30, most belong in a linter config.
- Each bullet should be a specific, actionable instruction. "Format code properly" is useless. "Use 2-space indentation, 100-char line limit, PEP 8" is actionable.
- If you find a section growing past 10 lines of procedure → extract it into a skill

---

## Imports — The `@` Syntax

CLAUDE.md can import other files for modular organization:

```markdown
See @README for project overview and @package.json for available npm commands.

# Per-developer preferences (not committed)
- @~/.claude/my-project-instructions.md
```

**Rules:**
- Relative and absolute paths both work
- Imports inside markdown code spans and code blocks are NOT evaluated (safe for `@anthropic-ai/sdk`)
- Recursive imports supported, max depth of **5 hops**
- Importing from `~/` is a clean alternative to CLAUDE.local.md that works across git worktrees
- Run `/memory` to see what files are loaded

---

## Skills Integration — The Mandate Pattern

This is the critical architectural boundary between CLAUDE.md and skills.

### The Rule

CLAUDE.md gets the **mandate** (WHAT must be used, WHEN). The skill gets the **procedure** (HOW).

```markdown
## Skills Mandates
- IMPORTANT: Use the `pdf-processing` skill for all PDF operations. Never use raw pypdf.
- IMPORTANT: Use the `django-models` skill when creating Django models. Never create models without it.
```

### Why This Matters

Skills load on-demand (~100 tokens metadata cost, full body only when triggered). If you duplicate the skill's procedure in CLAUDE.md, you pay the full token cost on every session — even when PDFs or Django models aren't involved. The mandate pattern gives Claude enough to know WHEN to reach for the skill, without loading the HOW until it's needed.

### When Adding a Skill to a Project

1. Create the skill in `.claude/skills/my-skill/SKILL.md`
2. Add exactly **one mandate line** to CLAUDE.md under a Skills Mandates section
3. If CLAUDE.md already has a detailed section on that domain, **trim it down** to just the mandate. The skill now owns the detail.
4. Commit both the skill and the CLAUDE.md update together

---

## Modular Rules with `.claude/rules/`

For larger projects, organize instructions into multiple files instead of one big CLAUDE.md:

```
your-project/
├── .claude/
│   ├── CLAUDE.md              # Main project instructions
│   └── rules/
│       ├── code-style.md      # Code style guidelines
│       ├── testing.md         # Testing conventions
│       └── security.md        # Security requirements
```

All `.md` files in `.claude/rules/` are automatically loaded as project memory, with the same priority as `.claude/CLAUDE.md`.

### Path-Specific Rules

Rules can be scoped to specific files using YAML frontmatter:

```yaml
---
paths:
  - "src/api/**/*.ts"
---
# API Development Rules
- All API endpoints must include input validation
- Use the standard error response format
```

Rules without a `paths` field are loaded unconditionally. Glob patterns are supported.

### User-Level Rules

Personal rules for all your projects go in `~/.claude/rules/`:

```
~/.claude/rules/
├── preferences.md      # Your personal coding preferences
└── workflows.md        # Your preferred workflows
```

User-level rules load before project rules, giving project rules higher priority.

### When to Use rules/ vs CLAUDE.md

- **rules/**: Team members own separate domain files (avoids merge conflicts), path-scoped rules needed, many focused rule sets
- **CLAUDE.md**: Smaller projects, fewer than ~10 rules, project identity and key commands

---

## Scaling — When CLAUDE.md Gets Too Big

Signs you need to split:

- CLAUDE.md exceeds ~100 lines of actual instructions
- Different team members keep having merge conflicts
- Large sections only apply to specific subdirectories

### Strategy 1: Extract to Skills

The best option for procedural knowledge. Move the procedure to a skill, leave a mandate in CLAUDE.md.

### Strategy 2: Use @imports

Good for reference content that's stable and shared:

```markdown
# See detailed API patterns
- @docs/api-conventions.md
```

### Strategy 3: Subdirectory CLAUDE.md Files

CLAUDE.md in child directories loads on-demand when Claude reads files there:

```
project/
├── CLAUDE.md                    # Project-wide rules
├── frontend/
│   └── CLAUDE.md                # Frontend-specific rules (loads when working in frontend/)
└── backend/
    └── CLAUDE.md                # Backend-specific rules (loads when working in backend/)
```

This is powerful for monorepos — each subdomain gets its own rules without bloating the root file.

### Strategy 4: Use `.claude/rules/`

Best when you want team members to own individual rule files without merge conflicts on CLAUDE.md. See §Modular Rules above.

---

## Relationship to settings.json

These serve different roles and should not be confused:

| | CLAUDE.md | settings.json |
|---|---|---|
| **Format** | Markdown | JSON |
| **Content** | Instructions for Claude | Permissions and runtime config |
| **Example** | "Use conventional commits" | `{"permissions": {"deny": ["Read(.env)"]}}` |

settings.json hierarchy (highest to lowest):

1. Enterprise managed policies (`managed-settings.json`)
2. Command line arguments
3. Local project settings (`.claude/settings.local.json`)
4. Shared project settings (`.claude/settings.json`)
5. User settings (`~/.claude/settings.json`)

---

## Relationship to Subagents

- CLAUDE.md = persistent rules for the **main** Claude session
- Subagents (`.claude/agents/`) = isolated specialists with their own context window and system prompt
- Subagents do NOT inherit the main CLAUDE.md — they get their own `.md` body + first 200 lines of MEMORY.md
- Use subagents when you need context isolation, different tool permissions, or parallel execution

---

## Reviewing an Existing CLAUDE.md

When asked to review, run this checklist:

### Content Quality
- [ ] Has a project identity one-liner
- [ ] Lists tech stack
- [ ] Lists key directories (not an exhaustive tree — just the important ones)
- [ ] Includes exact build/test/lint commands
- [ ] Conventions are specific and actionable (not vague like "write clean code")
- [ ] No more than ~5-7 convention rules (rest should be linter config or skills)
- [ ] Gotchas section exists for project-specific traps
- [ ] Skills mandates section exists if project has skills

### Conciseness
- [ ] No generic programming knowledge Claude already knows
- [ ] No code style rules that a linter/formatter enforces
- [ ] No detailed procedures that should be skills (>10 lines of how-to)
- [ ] No secrets, API keys, or credentials
- [ ] No library documentation (use @imports or skills instead)
- [ ] Total instruction count is reasonable (<100 bullet points)

### Architecture
- [ ] Mandate-only references to skills (no duplicated procedures)
- [ ] @imports used for large reference content instead of inline
- [ ] `.claude/rules/` used for multi-file rule organization if CLAUDE.md is large
- [ ] Subdirectory CLAUDE.md files used in monorepos rather than one massive root file
- [ ] CLAUDE.local.md exists for developer-specific settings (sandbox URLs, test data)

### Integration
- [ ] Matches actual project state (not stale/outdated)
- [ ] settings.json exists with deny rules for sensitive files
- [ ] Skills in `.claude/skills/` have corresponding mandate lines

---

## Anti-Patterns — NEVER Do This

### ❌ Stuffing Everything In

```markdown
# BAD: 200-line CLAUDE.md with every possible instruction
## Database Queries
Always use the ORM. Never write raw SQL. When using aggregations...
[40 more lines of database procedure]
## PDF Processing
When working with PDFs, always use pdfplumber for extraction...
[30 more lines of PDF procedure]
```

These procedures should be skills. CLAUDE.md should only have:
```markdown
- IMPORTANT: Use `database-queries` skill for all DB operations. Never write raw SQL.
- IMPORTANT: Use `pdf-processing` skill for all PDF work.
```

### ❌ Vague Instructions

```markdown
# BAD
- Format code properly
- Write good tests
- Follow best practices
```

Claude already tries to do these things. These instructions add zero value and waste tokens. Be specific or don't include them.

### ❌ Using CLAUDE.md as a Linter

```markdown
# BAD
- Use 2-space indentation
- Maximum line length 80 characters
- Always add trailing commas
- Import order: stdlib, third-party, local
```

Configure `prettier`, `ruff`, or `eslint` instead. Optionally set up a Claude Code hook to auto-format after edits. Linters are deterministic, fast, and free of token costs.

### ❌ Duplicating Skill Procedures

```markdown
# BAD: Full procedure AND a skill for the same thing
## Deployment
1. Run make build
2. Run docker push
3. Run kubectl apply
4. Verify with curl...

## Skills Mandates
- Use `deployment` skill for all deployments
```

The procedure in CLAUDE.md will be loaded every session even when nobody is deploying. Delete it — the skill owns the HOW.

### ❌ Including Secrets

```markdown
# BAD
## API Keys
- Stripe: sk_live_abc123...
- Database: postgresql://user:pass@host/db
```

CLAUDE.md becomes part of the system prompt. If committed to git, it's public. Use `.env` files and deny them via settings.json:
```json
{"permissions": {"deny": ["Read(.env)", "Read(.env.*)"]}}
```

---

## Commands Reference

| Command / Shortcut | Purpose |
|---------------------|---------|
| `/init` | Bootstrap CLAUDE.md from codebase analysis |
| `/memory` | Open any memory file in system editor |
| `/context` | See what's consuming context window space |
| `/clear` | Reset context between tasks |
| `/compact [focus]` | Compact context, preserving optional focus area |
| `/config` | Open settings interface |
| `#` prefix | Quick-add a memory to a chosen file |
| `--debug` flag | See skill loading errors and diagnostics |

---

## Auto Memory

Claude Code also maintains **auto memory** — notes Claude writes for itself based on what it discovers during sessions.

- Location: `~/.claude/projects/<project>/memory/MEMORY.md`
- Only first **200 lines** load into context
- Opt in: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=0` / Opt out: `=1`
- Different from CLAUDE.md: auto memory is Claude's notes to itself, not your instructions to Claude
- Tell Claude "remember that we use pnpm, not npm" to save specific learnings
