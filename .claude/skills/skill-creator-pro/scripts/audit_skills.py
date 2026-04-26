#!/usr/bin/env python3
"""
Skill Auditor — batch-audit all skills in a parent directory.

Scans for common issues: description conflicts, duplicate content,
token budget overruns, and cross-skill reference problems.

Usage:
    python audit_skills.py <skills-parent-directory> [--platform claude-code|claude-ai|api|all]

Examples:
    python audit_skills.py .claude/skills
    python audit_skills.py ~/.claude/skills --platform claude-ai
"""

import sys
import re
import yaml
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict

sys.path.insert(0, str(Path(__file__).parent))
from validate_skill import validate_skill, Issue

# Claude Code has ~16,000 char budget for <available_skills> in system prompt
# Each skill uses ~109 chars overhead + description length
METADATA_BUDGET_CHARS = 16000
PER_SKILL_OVERHEAD_CHARS = 109


def load_frontmatter(skill_dir: Path) -> dict | None:
    """Load frontmatter from a skill's SKILL.md."""
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        return None
    content = skill_md.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None
    try:
        fm = yaml.safe_load(match.group(1))
        return fm if isinstance(fm, dict) else None
    except yaml.YAMLError:
        return None


def audit_skills(skills_parent: str, platform: str = "all"):
    """Audit all skills in a parent directory."""
    parent = Path(skills_parent).resolve()

    if not parent.exists():
        print(f"❌ Directory not found: {parent}")
        return

    # Find all skill directories (contain SKILL.md)
    skill_dirs = sorted([
        d for d in parent.iterdir()
        if d.is_dir() and (d / "SKILL.md").exists()
    ])

    if not skill_dirs:
        print(f"No skills found in {parent}")
        return

    print(f"\n{'=' * 70}")
    print(f"  Skill Audit Report — {len(skill_dirs)} skills in {parent.name}/")
    print(f"{'=' * 70}\n")

    # ── Phase 1: Individual validation ────────────────────────────────────
    all_issues: Dict[str, List[Issue]] = {}
    all_frontmatters: Dict[str, dict] = {}
    total_errors = 0
    total_warnings = 0

    for skill_dir in skill_dirs:
        issues = validate_skill(str(skill_dir), platform)
        all_issues[skill_dir.name] = issues
        all_frontmatters[skill_dir.name] = load_frontmatter(skill_dir) or {}

        errors = len([i for i in issues if i.level == "error"])
        warnings = len([i for i in issues if i.level == "warning"])
        total_errors += errors
        total_warnings += warnings

        icon = "❌" if errors else "⚠️" if warnings else "✅"
        print(f"  {icon} {skill_dir.name:40s} {errors}E {warnings}W")

    # ── Phase 2: Cross-skill analysis ─────────────────────────────────────
    print(f"\n{'─' * 70}")
    print(f"  Cross-Skill Analysis")
    print(f"{'─' * 70}\n")

    cross_issues = []

    # Token budget check
    total_meta_chars = 0
    for name, fm in all_frontmatters.items():
        desc = fm.get("description", "")
        if isinstance(desc, str):
            total_meta_chars += PER_SKILL_OVERHEAD_CHARS + len(desc)

    budget_pct = (total_meta_chars / METADATA_BUDGET_CHARS) * 100
    if total_meta_chars > METADATA_BUDGET_CHARS:
        overflow = total_meta_chars - METADATA_BUDGET_CHARS
        cross_issues.append(
            f"❌ Metadata budget EXCEEDED by {overflow} chars ({budget_pct:.0f}%). "
            f"Some skills will be hidden from Claude in Claude Code."
        )
    elif budget_pct > 80:
        cross_issues.append(
            f"⚠️ Metadata budget at {budget_pct:.0f}% ({total_meta_chars}/{METADATA_BUDGET_CHARS} chars). "
            f"Consider shortening descriptions."
        )
    else:
        cross_issues.append(
            f"✅ Metadata budget at {budget_pct:.0f}% ({total_meta_chars}/{METADATA_BUDGET_CHARS} chars)"
        )

    # Description similarity / conflict detection
    descriptions = {}
    for name, fm in all_frontmatters.items():
        desc = fm.get("description", "")
        if isinstance(desc, str) and desc:
            descriptions[name] = set(desc.lower().split())

    checked = set()
    for name_a, words_a in descriptions.items():
        for name_b, words_b in descriptions.items():
            if name_a >= name_b:
                continue
            pair = (name_a, name_b)
            if pair in checked:
                continue
            checked.add(pair)

            if not words_a or not words_b:
                continue

            overlap = words_a & words_b
            union = words_a | words_b
            similarity = len(overlap) / len(union) if union else 0

            if similarity > 0.6:
                cross_issues.append(
                    f"⚠️ High description similarity ({similarity:.0%}): "
                    f"'{name_a}' ↔ '{name_b}'. "
                    f"Claude may confuse these. Use distinct trigger terms."
                )

    # Cross-skill reference detection
    for skill_dir in skill_dirs:
        skill_md = skill_dir / "SKILL.md"
        content = skill_md.read_text(encoding="utf-8").lower()
        for other_dir in skill_dirs:
            if other_dir == skill_dir:
                continue
            other_name = other_dir.name
            # Check if one skill references another by name
            if f"see {other_name}" in content or f"use {other_name}" in content:
                cross_issues.append(
                    f"⚠️ Cross-skill reference: '{skill_dir.name}' references '{other_name}'. "
                    f"This won't work — duplicate the knowledge or merge the skills."
                )

    for issue in cross_issues:
        print(f"  {issue}")

    # ── Summary ───────────────────────────────────────────────────────────
    print(f"\n{'=' * 70}")
    print(f"  Summary: {len(skill_dirs)} skills, {total_errors} errors, {total_warnings} warnings")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python audit_skills.py <skills-parent-directory> [--platform ...]")
        sys.exit(1)

    skills_dir = sys.argv[1]
    platform = "all"
    if "--platform" in sys.argv:
        idx = sys.argv.index("--platform")
        if idx + 1 < len(sys.argv):
            platform = sys.argv[idx + 1]

    audit_skills(skills_dir, platform)
