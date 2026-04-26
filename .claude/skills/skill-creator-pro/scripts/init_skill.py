#!/usr/bin/env python3
"""
Skill Initializer — scaffolds a lean skill directory with best-practice template.

Usage:
    python init_skill.py <skill-name> --path <output-directory> [--platform claude-code|claude-ai|api|all]

Examples:
    python init_skill.py processing-pdfs --path .claude/skills
    python init_skill.py brand-guidelines --path .claude/skills --platform claude-ai
"""

import sys
import re
from pathlib import Path


SKILL_TEMPLATE_FULL = """---
name: {skill_name}
description: >
  [TODO: What this skill does — 1 sentence]. [File types/domains covered].
  Use when [specific triggers — actions, keywords, user contexts].
  [Optional: mandate language — "MUST use X, never use Y"].
---

# {skill_title}

[TODO: One-line location statement. Example: "All observability code lives in `backend/apps/core/observability/`"]

## Quick Start

[TODO: Minimum viable code to start using this system. Must be useful within these first ~20 lines.]

```python
# TODO: imports and entry point
```

## Core Patterns

### [TODO: Pattern Name]

```python
# TODO: Show the CORRECT way to do the primary task
```

### Rules

[TODO: Project-specific conventions Claude won't know. Naming, field conventions, etc.]

## Anti-Patterns — NEVER Do This

[TODO: CRITICAL. This is the highest-value section. Show what Claude would naturally
do wrong, and what this project actually requires.]

```python
# ❌ WRONG — what Claude's training data suggests
# [wrong code]

# ✅ CORRECT — what this project requires
# [correct code]
```

## Integration Notes

[TODO: Environment variables, middleware config, dependencies, etc.]
"""

SKILL_TEMPLATE_CLAUDEAI = """---
name: {skill_name}
description: "[TODO: Max 200 chars. What + when. Be specific.]"
---

# {skill_title}

## Quick Start

```python
# TODO: entry point code
```

## Core Patterns

[TODO: Main instructions]

## Anti-Patterns

[TODO: What Claude gets wrong without this skill]
"""


def title_case(name: str) -> str:
    return " ".join(word.capitalize() for word in name.split("-"))


def init_skill(skill_name: str, path: str, platform: str = "all") -> Path | None:
    skill_dir = Path(path).resolve() / skill_name

    if skill_dir.exists():
        print(f"❌ Directory already exists: {skill_dir}")
        return None

    # Validate name
    if not re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", skill_name):
        print(f"❌ Name must be kebab-case (lowercase letters, digits, hyphens): {skill_name}")
        return None
    if len(skill_name) > 64:
        print(f"❌ Name too long ({len(skill_name)} chars, max 64)")
        return None
    for reserved in ("anthropic", "claude"):
        if reserved in skill_name:
            print(f"❌ Name cannot contain reserved word '{reserved}'")
            return None

    try:
        skill_dir.mkdir(parents=True)

        # Choose template based on platform
        if platform == "claude-ai":
            template = SKILL_TEMPLATE_CLAUDEAI
        else:
            template = SKILL_TEMPLATE_FULL

        skill_md = skill_dir / "SKILL.md"
        skill_md.write_text(template.format(
            skill_name=skill_name,
            skill_title=title_case(skill_name),
        ))

        print(f"✅ Created: {skill_dir}/")
        print(f"✅ Created: SKILL.md ({platform} template)")
        print(f"\n📝 Next steps:")
        print(f"   1. Edit {skill_md} — fill in the TODOs")
        print(f"   2. Write the description FIRST (it's the routing mechanism)")
        print(f"   3. Add scripts/ or references/ ONLY if you have a specific need")
        if platform == "claude-ai":
            print(f"   ⚠️  claude.ai: description max 200 chars, no allowed-tools/context frontmatter")
        return skill_dir

    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def main():
    if len(sys.argv) < 4 or sys.argv[2] != "--path":
        print("Usage: python init_skill.py <skill-name> --path <directory> [--platform claude-code|claude-ai|api|all]")
        print("\nExamples:")
        print("  python init_skill.py processing-pdfs --path .claude/skills")
        print("  python init_skill.py brand-guidelines --path .claude/skills --platform claude-ai")
        sys.exit(1)

    skill_name = sys.argv[1]
    path = sys.argv[3]

    platform = "all"
    if "--platform" in sys.argv:
        idx = sys.argv.index("--platform")
        if idx + 1 < len(sys.argv):
            platform = sys.argv[idx + 1]

    print(f"🔧 Initializing skill: {skill_name} (platform: {platform})")
    result = init_skill(skill_name, path, platform)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
