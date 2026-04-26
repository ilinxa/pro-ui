# Enterprise & Advanced CLAUDE.md Configuration

Read this when the user asks about enterprise deployment, organization-level memory, team setup patterns, or advanced configuration topics.

## Table of Contents
1. [Enterprise Memory Paths](#enterprise-memory-paths)
2. [Enterprise Managed Policies](#enterprise-managed-policies)
3. [Team Setup Pattern](#team-setup-pattern)
4. [Monorepo Pattern](#monorepo-pattern)
5. [The .claude/ Directory Structure](#the-claude-directory-structure)
6. [Context Window Management](#context-window-management)
7. [Slash Commands (Legacy)](#slash-commands-legacy)

---

## Enterprise Memory Paths

Enterprise CLAUDE.md files are deployed to system directories by IT/DevOps. They apply to ALL users in the organization and cannot be overridden by user or project settings.

| OS | Path |
|----|------|
| macOS | `/Library/Application Support/ClaudeCode/CLAUDE.md` |
| Linux / WSL | `/etc/claude-code/CLAUDE.md` |
| Windows | `C:\Program Files\ClaudeCode\CLAUDE.md` |

**Note:** These are system-wide paths (NOT user home directories). They require administrator privileges and are designed to be deployed via MDM, Group Policy, Ansible, or similar configuration management systems.

### Enterprise Content Examples

```markdown
# Acme Corp — Claude Code Standards

## Security Requirements
- NEVER include API keys, secrets, or credentials in any file
- NEVER access production databases directly
- All database changes must go through migrations

## Compliance
- All code must pass security scanning before merge
- Use company-approved packages only (see @approved-packages.md)
- Log all destructive operations

## Standard Tools
- Use the company Slack MCP for deployment notifications
- Use GitHub MCP for PR management — never push directly to main
```

---

## Enterprise Managed Policies

Beyond CLAUDE.md, enterprise admins can deploy `managed-settings.json` for technical controls:

| OS | Path |
|----|------|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux / WSL | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

These enforce permission rules that users cannot override:

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(./secrets/**)",
      "Bash(curl:*)",
      "Bash(wget:*)"
    ]
  },
  "companyAnnouncements": [
    "Reminder: All PRs require security review before merge"
  ]
}
```

Enterprise managed MCP servers go in `managed-mcp.json` at the same system path.

---

## Team Setup Pattern

Recommended structure for a team project:

```
project/
├── CLAUDE.md                      # Shared project rules (committed)
├── CLAUDE.local.md                # Your personal overrides (gitignored)
├── .claude/
│   ├── settings.json              # Shared permissions & env (committed)
│   ├── settings.local.json        # Personal settings (gitignored)
│   ├── rules/                     # Modular rule files (committed)
│   │   ├── code-style.md
│   │   └── testing.md
│   ├── skills/                    # Shared skills (committed)
│   │   ├── deployment/SKILL.md
│   │   └── code-review/SKILL.md
│   ├── agents/                    # Shared subagents (committed)
│   │   └── security-reviewer.md
│   └── commands/                  # Legacy slash commands (still work)
│       └── deploy.md
```

### What Goes Where

| File | Committed? | Content |
|------|-----------|---------|
| `CLAUDE.md` | Yes | Project architecture, commands, conventions, skill mandates |
| `CLAUDE.local.md` | No | Your sandbox URLs, personal test data, local paths |
| `.claude/settings.json` | Yes | Permission rules, env vars, hooks for the team |
| `.claude/settings.local.json` | No | Personal model preference, experimental flags |
| `.claude/rules/*.md` | Yes | Modular domain-specific rules (auto-loaded with project priority) |
| `.claude/skills/*/SKILL.md` | Yes | Shared procedural knowledge |
| `.claude/agents/*.md` | Yes | Shared subagent configurations |

### Per-Developer Preferences via @import

Instead of CLAUDE.local.md (which doesn't work across git worktrees), team members can use imports:

```markdown
# In project CLAUDE.md (committed)
# Per-developer preferences (each dev creates their own file)
- @~/.claude/project-overrides/acme-backend.md
```

Each developer creates their own file at that path. This works across worktrees since the import path points to the home directory.

---

## Monorepo Pattern

For large monorepos, use subdirectory CLAUDE.md files:

```
monorepo/
├── CLAUDE.md                      # Universal rules (always loaded)
├── frontend/
│   ├── CLAUDE.md                  # React/TS rules (loads when working in frontend/)
│   └── src/
├── backend/
│   ├── CLAUDE.md                  # Django/Python rules (loads when working in backend/)
│   └── apps/
├── infrastructure/
│   ├── CLAUDE.md                  # Terraform/K8s rules (loads when working in infra/)
│   └── modules/
└── shared/
    └── CLAUDE.md                  # Shared library conventions
```

**Key behavior:** Child CLAUDE.md files are NOT loaded at launch. They load on-demand only when Claude reads files in that subtree. This keeps context lean — frontend rules don't load when you're working on backend.

### Root CLAUDE.md for Monorepo

Keep the root file minimal — only truly universal rules:

```markdown
# Acme Monorepo

## Structure
- `frontend/` — React TypeScript SPA
- `backend/` — Django REST API
- `infrastructure/` — Terraform + K8s
- `shared/` — Shared libraries

## Universal Rules
- All PRs require at least one approving review
- Conventional commits format
- Never commit directly to main

## Commands
​```bash
make test-all      # run all tests across packages
make lint-all      # lint everything
​```

## Skills Mandates
- IMPORTANT: Use `deployment` skill for all deploy operations.
```

Domain-specific conventions go in each subdirectory's CLAUDE.md.

---

## The .claude/ Directory Structure

Complete reference of what can live in `.claude/`:

```
.claude/
├── CLAUDE.md              # Alternative location for project memory
├── settings.json          # Shared project settings (committed)
├── settings.local.json    # Personal project settings (gitignored)
├── rules/                 # Modular rule files (auto-loaded, committed)
│   ├── code-style.md
│   ├── testing.md
│   └── security.md
├── skills/                # Project skills
│   └── my-skill/
│       ├── SKILL.md
│       ├── scripts/
│       └── references/
├── agents/                # Custom subagents
│   └── reviewer.md
└── commands/              # Legacy slash commands (still work)
    └── deploy.md
```

**Note:** Project CLAUDE.md can live at either `./CLAUDE.md` (repo root) or `./.claude/CLAUDE.md`. Both are valid. Root placement is more conventional and visible; `.claude/` placement keeps the repo root cleaner.

---

## Context Window Management

### What Consumes Context

1. Claude Code system prompt (~50 instructions, fixed)
2. CLAUDE.md files (all levels, loaded at launch)
3. Auto memory (first 200 lines of MEMORY.md)
4. Skills metadata (~100 tokens per skill, always present)
5. Loaded skill bodies (on-demand, ~2-5k tokens each)
6. File contents, command outputs, conversation history

### Budget Tracking

- Run `/context` to see what's consuming space
- Skills metadata budget: 2% of context window, fallback 16,000 chars
- Override with `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var
- If skills are being excluded, `/context` will show a warning

### Compact Instructions

Add a section to CLAUDE.md that tells Claude what to preserve during automatic compaction:

```markdown
## Compact Instructions
When compacting this conversation, always preserve:
- The current task objective and acceptance criteria
- Any API schemas or data models discussed
- Test results from the current task
- File paths being actively worked on
```

### Between Tasks

Use `/clear` to reset context when switching to a completely different task. This removes accumulated history while preserving CLAUDE.md configuration.

Use `/compact focus on the API changes` to compact while keeping specific context.

---

## Slash Commands (Legacy)

Custom slash commands (`.claude/commands/*.md`) have been merged into skills. Both still work:

- `.claude/commands/review.md` → creates `/review`
- `.claude/skills/review/SKILL.md` → creates `/review`

Skills are recommended because they support:
- Supporting files (scripts, references, assets)
- Frontmatter for auto-invocation by Claude (model-invoked)
- `allowed-tools` to restrict tool access
- `disable-model-invocation: true` for user-invoke-only

Existing command files keep working — no migration required.
