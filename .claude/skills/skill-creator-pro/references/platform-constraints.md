# Platform Constraints Reference

Read this when building a skill targeted at a specific platform, or when the user asks about platform compatibility.

## Table of Contents
1. [Claude Code CLI](#claude-code-cli)
2. [Claude Agent SDK](#claude-agent-sdk)
3. [Claude.ai](#claudeai)
4. [Claude API](#claude-api)
5. [Cross-Platform Strategy](#cross-platform-strategy)
6. [API Beta Headers](#api-beta-headers)

---

## Claude Code CLI

**The most feature-rich platform for skills.**

- Network: Full access
- Package install: Full (global install discouraged)
- Filesystem: User's actual filesystem
- Skill locations: `~/.claude/skills/` (personal), `.claude/skills/` (project), or via plugins
- Sharing: Personal or team via git / plugins
- All frontmatter fields supported: `allowed-tools`, `context: fork`, `agent`, `disable-model-invocation`
- Slash commands: `name` becomes `/skill-name`
- Dynamic substitution: `$ARGUMENTS`, `${CLAUDE_SESSION_ID}`
- Metadata budget: ~16,000 chars total for `<available_skills>` in system prompt. Each skill = ~109 chars overhead + description length.

### Known Issues (as of Feb 2026)
- **User skills token loading bug:** Skills in `~/.claude/skills/` may fully load into context (~5-10k tokens per skill) instead of just frontmatter (~50 tokens). Workaround: convert to local plugin format.
- **`context: fork` ignored:** When invoked via the Skill tool programmatically, `context: fork` and `agent:` may be ignored. Workaround: restructure as custom subagents.

---

## Claude Agent SDK

- Network: Full access
- Package install: Full
- Filesystem: Depends on `cwd` configuration
- Skill locations: `.claude/skills/` (project) or `~/.claude/skills/` (user)
- Discovery: Must include `"Skill"` in `allowed_tools` AND set `setting_sources` to `["user", "project"]`
- **`allowed-tools` frontmatter NOT supported.** Use `allowedTools` in query options instead.
- **`context: fork`, `agent:`, `disable-model-invocation` NOT supported.**

### Minimal SDK Setup
```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    cwd="/path/to/project",
    setting_sources=["user", "project"],  # Load skills from filesystem
    allowed_tools=["Skill", "Read", "Write", "Bash"],  # Enable Skill tool
)

async for message in query(prompt="...", options=options):
    print(message)
```

---

## Claude.ai

**Most restrictive for skill authoring.**

- Network: Varying (depends on user/admin settings)
- Package install: Can install from npm, PyPI, and pull from GitHub
- Filesystem: Sandboxed container
- Skill upload: Settings > Features > Upload ZIP
- Description limit: **200 characters** (not 1024!)
- Sharing: **Individual user only** — NOT shared org-wide, no centralized admin management
- No `allowed-tools`, `context: fork`, `agent`, `disable-model-invocation`
- ZIP format: Skill folder as root of the ZIP, not nested in a subfolder

### ZIP Structure
```
my-skill.zip
└── my-skill/
    ├── SKILL.md
    ├── scripts/
    │   └── helper.py
    └── references/
        └── advanced.md
```

### Plan Availability
- Pro, Max, Team, Enterprise: Can upload custom skills + use pre-built
- Free: NO access to skills
- Enterprise: Owners can provision skills organization-wide (pre-built only)

---

## Claude API

**Most restrictive runtime environment.**

- Network: **NONE** — skills cannot make external API calls
- Package install: **NONE** — only pre-installed packages available
- Filesystem: Sandboxed container
- Skill management: `/v1/skills` endpoints (Skills API)
- Description limit: 1024 characters
- Sharing: **Workspace-wide** — all workspace members can access
- No `allowed-tools`, `context: fork`, `agent`, `disable-model-invocation`

### Required Beta Headers (3 total)
```
anthropic-beta: code-execution-2025-08-25
anthropic-beta: skills-2025-10-02
anthropic-beta: files-api-2025-04-14
```

### Pre-built Skills
Available `skill_id` values: `pptx`, `xlsx`, `docx`, `pdf`

### Custom Skills Upload
```python
# Upload
skill = client.beta.skills.create(
    display_title="My Skill",
    files=[("SKILL.md", open("my-skill/SKILL.md", "rb"))],
    betas=["skills-2025-10-02"]
)

# Use in messages
response = client.beta.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02", "files-api-2025-04-14"],
    container={"skills": [{"type": "custom", "skill_id": skill.id, "version": "latest"}]},
    messages=[...],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
)
```

---

## Cross-Platform Strategy

If targeting multiple platforms, design for the **most restrictive**:

1. Description ≤ 200 chars (claude.ai limit)
2. No network calls in scripts (API limit)
3. No runtime package installation in scripts (API limit)
4. No `allowed-tools`, `context: fork`, `agent`, `disable-model-invocation` (claude.ai + API)
5. Only use pre-installed packages (API limit)

**Skills do NOT sync across surfaces.** You must upload/create separately for each platform.

---

## API Beta Headers

Always include all three when using skills via the API:

| Header | Purpose |
|--------|---------|
| `code-execution-2025-08-25` | Skills run in code execution container |
| `skills-2025-10-02` | Enables Skills functionality |
| `files-api-2025-04-14` | Required for file upload/download |
