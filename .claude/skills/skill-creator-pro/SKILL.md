---
name: skill-creator-pro
description: Create, validate, improve, or restructure Claude skills for any platform (Claude Code, claude.ai, API, Agent SDK). Use when user wants to create a new skill, improve an existing skill, review a skill for issues, scaffold a skill directory, or turn a workflow into a reusable skill. Covers the full lifecycle from intent capture through testing, packaging, and CLAUDE.md integration.
---

# Skill Creator Pro

Comprehensive skill creation, validation, improvement, and packaging — aligned with official Anthropic specs (Feb 2026).

## How Skills Work — Read This First

Three loading stages control context window cost:

1. **Metadata** — `name` + `description` from frontmatter. Always in context (~100 tokens per skill). This is what Claude reads to decide whether to trigger. Nothing else fires until this matches.
2. **SKILL.md body** — Loads after the skill triggers. Keep under 500 lines. This is the only file that auto-loads.
3. **Bundled resources** — Do NOT auto-load. Claude must actively decide to read them. Only reliable when SKILL.md gives a specific, concrete trigger condition.

**Consequence:** If knowledge needs to be available when the skill triggers, it goes in SKILL.md. If it genuinely only fires under a narrow condition, it can go in references/. When in doubt, put it in SKILL.md.

---

## Determine Where The User Is

When invoked, figure out which phase the user is in and jump in:

| User Says | Phase | Action |
|-----------|-------|--------|
| "Create a skill for X" | **Create** | Run full creation workflow (below) |
| "Turn this into a skill" | **Extract** | Mine conversation history for patterns, then create |
| "Review / improve my skill" | **Improve** | Read skill, diagnose issues, iterate |
| "Validate my skill" | **Validate** | Run validation script, report issues |
| "Package my skill" | **Package** | Validate + ZIP |
| "I just want to vibe" | **Freeform** | Skip formal process, collaborate naturally |

Always be flexible. If the user says skip evals, skip evals.

---

## CREATE — Full Workflow

### Phase 1: Capture Intent

Ask (or extract from conversation history):

1. **What should this skill enable Claude to do?** — The core capability
2. **What does Claude get wrong WITHOUT this skill?** — This is the only reason a skill should exist
3. **When should this skill trigger?** — User phrases, contexts, keywords
4. **What's the expected output?** — Format, files, behavior
5. **What platform(s)?** — Claude Code, claude.ai, API, Agent SDK (affects constraints)
6. **Should we set up test cases?** — Suggest yes for verifiable outputs, skip for subjective ones

If the current conversation already contains a workflow to capture, extract: tools used, step sequence, corrections made, input/output formats.

### Phase 2: Plan Before Writing

Before writing any file, answer these internally:

**Is this coupled to another skill?** If 80%+ of the time this skill fires, another skill's knowledge is also needed → merge them into one.

**What's the mandate vs the how-to?** Mandate ("must/never") → CLAUDE.md hard rule. How-to → skill body. Never duplicate both.

**Platform constraints check:** If targeting a specific platform (or the user asks about compatibility), read [references/platform-constraints.md](references/platform-constraints.md) for full details. Quick summary:

| Platform | Network | Package Install | `allowed-tools` | `context: fork` |
|----------|---------|-----------------|------------------|------------------|
| claude.ai | Varying | npm, PyPI, GitHub | No | No |
| API | **None** | **None** (pre-installed only) | No | No |
| Claude Code CLI | Full | Full | **Yes** | **Yes** |
| Agent SDK | Full | Full | No (use `allowedTools` in code) | No |

**Description limit:** 1024 chars (API, Claude Code, SDK) or **200 chars** (claude.ai). If targeting claude.ai, write a tight description.

### Phase 3: Initialize

Run the scaffolding script:

```bash
python3 {SKILL_BASE_DIR}/scripts/init_skill.py <skill-name> --path <output-directory>
```

Or create manually — the minimum is just a directory with a SKILL.md file. No empty directories.

### Phase 4: Write the Description

The description is the **routing mechanism**. It's the only thing Claude reads before deciding to trigger. Get this wrong and the skill is invisible.

**Rules:**
- Include WHAT the skill does AND WHEN to use it
- Include every trigger keyword a user might say
- Write in **third person** ("Processes Excel files", not "I can help you")
- Be "pushy" — Claude undertriggers skills, so cast a wide net
- No angle brackets (`<` or `>`)
- Front-load trigger keywords in the first 50 characters

**Claude Code budget note:** There's a ~16,000 character budget for all skill metadata in the system prompt. Each skill uses ~109 chars overhead + description length. For large collections (60+ skills), keep descriptions under 130 chars.

**Template:**
```yaml
description: >
  [What it does — 1 sentence]. [File types/domains covered].
  Use when [specific triggers — actions, keywords, contexts].
  [Mandate language if applicable — "MUST use X, never use Y"].
```

**Example:**
```yaml
description: >
  Extract text and tables from PDF files, fill forms, merge and split documents.
  Use when working with PDF files or when the user mentions PDFs, forms, document
  extraction, or any .pdf file operations.
```

### Phase 5: Write SKILL.md Body

**Order matters.** Claude reads top-down mid-task. Must be useful within 20 lines.

```
Lines 1-4:    Frontmatter (name + description)
Lines 5-6:    One-line location statement (where code lives)
Lines 7-24:   Quick Start — imports, entry point, minimum to start
Lines 25+:    Topic sections:
              - Code example FIRST, explanation after
              - Rules / conventions
              - Anti-patterns (highest-value content)
End:          Integration notes (env vars, middleware, config)
```

**Key principles:**

1. **Concise.** Claude is already smart. Only add what Claude doesn't know. Challenge every paragraph: "Does this justify its token cost?"

2. **Degrees of freedom.** Match specificity to fragility:
   - High freedom (text instructions) → multiple valid approaches
   - Medium (pseudocode/params) → preferred pattern, some variation OK
   - Low (exact scripts) → fragile operations, consistency critical

3. **Anti-patterns are the highest-value content.** Claude's training data has generic patterns. Your skill's job is to override those:
   ```markdown
   ## Anti-Patterns — NEVER Do This

   ❌ WRONG:
   ```python
   import logging
   logger = logging.getLogger(__name__)
   ```

   ✅ CORRECT:
   ```python
   from apps.core.observability import get_logger
   logger = get_logger(__name__)
   ```
   ```

4. **Explain WHY, not just WHAT.** LLMs respond better to reasoning than rigid MUSTs. If you find yourself writing ALWAYS/NEVER in all caps, reframe with reasoning.

5. **Use consistent terminology.** Pick one term and stick with it throughout.

### Phase 6: Organize Files

```
skill-name/
├── SKILL.md              # Required — main instructions
├── scripts/              # Optional — deterministic, repetitive code
│   └── helper.py
├── references/           # Optional — docs loaded on-demand
│   └── advanced.md
└── assets/               # Optional — files used in output (templates, fonts)
    └── template.html
```

**When to use references/:** ONLY when ALL true:
- You can write a single concrete sentence for when Claude should read it
- Content is only needed for that narrow case (<20% of triggers)
- Putting it in SKILL.md would bloat with rarely-used content

**When to use scripts/:** When same code gets rewritten every session, output must be deterministic, script can run standalone.

**Never include:** README.md, INSTALLATION_GUIDE.md, CHANGELOG.md, empty directories. Skills are for AI agents, not human onboarding.

**Reference depth:** Keep ONE level deep from SKILL.md. Claude may only `head -100` files referenced from other referenced files.

**Large reference files (>300 lines):** Include a table of contents at the top.

### Phase 7: Cross-Skill Integrity

**Cross-skill references DON'T work.** If Skill A needs knowledge from Skill B, duplicate it into Skill A — or merge the skills.

- Small overlap (<10 lines): duplicate
- Large overlap: merge — the coupling says they're one skill

Check for description conflicts with existing skills. Use **distinct trigger terms**.

### Phase 8: Test

**Always have something cooking.** After writing the draft:

1. Come up with 2-3 realistic test prompts — what a real user would say
2. Share with user: "Here are test cases I'd like to try. Look right?"
3. Run them — first runs in main loop so user sees the transcript
4. Observe: where does Claude struggle, forget rules, make unexpected choices?
5. Iterate based on real behavior, not assumptions

**If user wants formal evals**, create `evals/evals.json`:
```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": [],
      "assertions": ["Output includes X", "Correctly handles Y"]
    }
  ]
}
```

### Phase 9: CLAUDE.md Integration

Every skill needs exactly **one enforcement line** in CLAUDE.md:

```markdown
- IMPORTANT: [mandate — what must be used]. Never [what must not be used].
```

Short. States WHAT and WHERE, not the how. The skill handles the how.

If an existing CLAUDE.md section covers the same domain in detail, trim it down to the mandate. The skill now owns the detail.

### Phase 10: Validate and Package

```bash
# Validate
python3 {SKILL_BASE_DIR}/scripts/validate_skill.py <skill-directory>

# Package for distribution (creates .zip for claude.ai upload)
python3 {SKILL_BASE_DIR}/scripts/package_skill.py <skill-directory> [output-directory]
```

---

## IMPROVE — Existing Skill

When asked to improve a skill:

1. **Read the full skill** — SKILL.md, all references, all scripts
2. **Run the diagnostic checklist** (see below)
3. **Identify issues** — rank by impact
4. **Fix iteratively** — one concern at a time, test between changes
5. **Generalize from feedback** — don't overfit to specific examples

**Improvement writing style:**
- Generalize, don't overfit. The skill will be used millions of times across many prompts.
- Keep the prompt lean — remove what isn't pulling its weight.
- Read transcripts, not just outputs — find where the skill wastes time.
- Explain WHY behind instructions. LLMs respond to reasoning, not rigid rules.
- If writing ALWAYS/NEVER in caps → yellow flag. Reframe with reasoning.

---

## DIAGNOSTIC CHECKLIST

Run this against any skill being created or reviewed:

### Frontmatter
- [ ] `name`: lowercase, numbers, hyphens only. Max 64 chars. No "anthropic"/"claude".
- [ ] `description`: non-empty. Max 1024 chars (API/Code) or 200 chars (claude.ai).
- [ ] Description in third person. No angle brackets.
- [ ] Description contains WHAT it does AND WHEN to trigger.
- [ ] Description contains all relevant trigger keywords.
- [ ] Description front-loads keywords in first 50 chars.
- [ ] No unexpected frontmatter keys (allowed: name, description, license, allowed-tools, metadata, compatibility, context, agent, disable-model-invocation).

### Body Quality
- [ ] Quick start / imports visible within first 20 lines of body.
- [ ] Code examples come BEFORE explanations.
- [ ] Anti-patterns section exists with project-specific "never do this" examples.
- [ ] Body under 500 lines. If over, content split to references/.
- [ ] Consistent terminology throughout.
- [ ] Explains WHY, not just WHAT.

### File Organization
- [ ] No references/ files unless each has a concrete trigger sentence in SKILL.md.
- [ ] No assets/ unless files genuinely used in output.
- [ ] No README, INSTALLATION_GUIDE, empty directories.
- [ ] References max one level deep from SKILL.md.
- [ ] Large reference files (>300 lines) have table of contents.
- [ ] Scripts are standalone-executable (not templates Claude generates inline).

### Integration
- [ ] No duplicate information between this skill and other skills.
- [ ] No cross-skill references (duplicated or merged instead).
- [ ] CLAUDE.md has exactly one hard rule (mandate only, no how-to).
- [ ] Hard rule uses mandate language matching description.

### Platform Compatibility
- [ ] If targeting claude.ai: description ≤ 200 chars.
- [ ] If targeting API: no external network calls in scripts.
- [ ] If using allowed-tools: only targeting Claude Code CLI.
- [ ] If using context: fork / agent: / disable-model-invocation: only Claude Code CLI.

---

## QUICK REFERENCE — Frontmatter Fields

| Field | Required | Platform | Constraints |
|-------|----------|----------|-------------|
| `name` | Yes | All | Lowercase + numbers + hyphens. Max 64 chars. No "anthropic"/"claude". No XML. |
| `description` | Yes | All | Max 1024 (API/Code) or 200 (claude.ai). No XML. Third person. |
| `license` | No | All | License info string |
| `allowed-tools` | No | **Claude Code CLI only** | Comma-separated tool names |
| `context` | No | **Claude Code CLI only** | `fork` — run in isolated subagent |
| `agent` | No | **Claude Code CLI only** | Subagent type (e.g., `Explore`) when using `context: fork` |
| `disable-model-invocation` | No | **Claude Code CLI only** | `true` — only user can invoke via `/name` |
| `metadata` | No | All | Arbitrary key-value pairs |
| `compatibility` | No | All | Tool/dependency requirements. Max 500 chars. |

---

## NAMING CONVENTIONS

**Recommended: gerund form** (verb + -ing):
- ✅ `processing-pdfs`, `analyzing-spreadsheets`, `managing-databases`
- ✅ Also OK: `pdf-processing`, `process-pdfs`
- ❌ Avoid: `helper`, `utils`, `tools`, `data`, `files`

---

## SCRIPTS

This skill includes utility scripts in `scripts/`:

| Script | Purpose | Usage |
|--------|---------|-------|
| `init_skill.py` | Scaffold a new skill directory | `python3 scripts/init_skill.py <name> --path <dir>` |
| `validate_skill.py` | Full validation against official spec | `python3 scripts/validate_skill.py <skill-dir>` |
| `package_skill.py` | Validate + ZIP for distribution | `python3 scripts/package_skill.py <skill-dir> [output-dir]` |
| `audit_skills.py` | Audit all skills in a directory for issues | `python3 scripts/audit_skills.py <skills-parent-dir>` |

---

## TEMPLATE — Minimal Viable Skill

```markdown
---
name: my-skill-name
description: >
  [What it does]. [File types/domains].
  Use when [triggers — actions, keywords, contexts].
---

# [Skill Title]

All relevant code lives in `[path/]`.

## Quick Start

```[lang]
from mypackage import key_function
result = key_function(input)
```

## Core Patterns

### [Pattern Name]
```[lang]
# correct way
```

## Anti-Patterns — NEVER Do This

❌ **Wrong:**
```[lang]
# common mistake Claude would make
```

✅ **Correct:**
```[lang]
# project-specific right way
```

## Integration Notes
- [env vars, middleware, config]
```
