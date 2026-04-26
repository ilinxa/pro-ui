#!/usr/bin/env python3
"""
Skill Validator — Comprehensive validation against official Anthropic spec (Feb 2026).

Usage:
    python validate_skill.py <skill-directory> [--platform claude-code|claude-ai|api|all]

Examples:
    python validate_skill.py .claude/skills/my-skill
    python validate_skill.py .claude/skills/my-skill --platform claude-ai
"""

import sys
import os
import re
import yaml
from pathlib import Path
from typing import List, Tuple

# ─── Constants ────────────────────────────────────────────────────────────────

MAX_NAME_LENGTH = 64
MAX_DESC_LENGTH_GENERAL = 1024
MAX_DESC_LENGTH_CLAUDE_AI = 200
MAX_COMPATIBILITY_LENGTH = 500
MAX_BODY_LINES = 500
MAX_REFERENCE_LINES = 300
RESERVED_WORDS = {"anthropic", "claude"}
ALLOWED_FRONTMATTER_KEYS = {
    "name", "description", "license", "allowed-tools", "metadata",
    "compatibility", "context", "agent", "disable-model-invocation",
}
CLAUDE_CODE_ONLY_KEYS = {"allowed-tools", "context", "agent", "disable-model-invocation"}
FORBIDDEN_FILES = {"README.md", "INSTALLATION_GUIDE.md", "CHANGELOG.md"}

# ─── Result Types ─────────────────────────────────────────────────────────────

class Issue:
    def __init__(self, level: str, category: str, message: str):
        self.level = level  # "error", "warning", "info"
        self.category = category
        self.message = message

    def __str__(self):
        icons = {"error": "❌", "warning": "⚠️", "info": "ℹ️"}
        return f"{icons.get(self.level, '?')} [{self.category}] {self.message}"


def validate_skill(skill_path: str, platform: str = "all") -> List[Issue]:
    """Full validation of a skill directory. Returns list of issues."""
    issues = []
    skill_path = Path(skill_path).resolve()

    # ── Existence checks ──────────────────────────────────────────────────
    if not skill_path.exists():
        issues.append(Issue("error", "structure", f"Path does not exist: {skill_path}"))
        return issues

    if not skill_path.is_dir():
        issues.append(Issue("error", "structure", f"Path is not a directory: {skill_path}"))
        return issues

    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        issues.append(Issue("error", "structure", "SKILL.md not found"))
        return issues

    content = skill_md.read_text(encoding="utf-8")
    lines = content.splitlines()

    # ── Frontmatter parsing ───────────────────────────────────────────────
    if not content.startswith("---"):
        issues.append(Issue("error", "frontmatter", "File must start with '---' (YAML frontmatter)"))
        return issues

    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        issues.append(Issue("error", "frontmatter", "Invalid frontmatter: missing closing '---'"))
        return issues

    frontmatter_text = match.group(1)

    try:
        fm = yaml.safe_load(frontmatter_text)
        if not isinstance(fm, dict):
            issues.append(Issue("error", "frontmatter", "Frontmatter must be a YAML mapping"))
            return issues
    except yaml.YAMLError as e:
        issues.append(Issue("error", "frontmatter", f"YAML parse error: {e}"))
        return issues

    # ── Frontmatter key validation ────────────────────────────────────────
    unexpected = set(fm.keys()) - ALLOWED_FRONTMATTER_KEYS
    if unexpected:
        issues.append(Issue("error", "frontmatter",
            f"Unexpected key(s): {', '.join(sorted(unexpected))}. "
            f"Allowed: {', '.join(sorted(ALLOWED_FRONTMATTER_KEYS))}"))

    # Check Claude Code-only keys on non-Claude-Code platforms
    if platform in ("claude-ai", "api"):
        used_cc_keys = set(fm.keys()) & CLAUDE_CODE_ONLY_KEYS
        if used_cc_keys:
            issues.append(Issue("warning", "platform",
                f"Key(s) {', '.join(sorted(used_cc_keys))} only work in Claude Code CLI. "
                f"They will be ignored on {platform}."))

    # ── Name validation ───────────────────────────────────────────────────
    if "name" not in fm:
        issues.append(Issue("error", "name", "Missing required 'name' field"))
    else:
        name = fm["name"]
        if not isinstance(name, str):
            issues.append(Issue("error", "name", f"Name must be a string, got {type(name).__name__}"))
        else:
            name = name.strip()
            if not name:
                issues.append(Issue("error", "name", "Name cannot be empty"))
            elif len(name) > MAX_NAME_LENGTH:
                issues.append(Issue("error", "name",
                    f"Name too long ({len(name)} chars, max {MAX_NAME_LENGTH})"))
            elif not re.match(r"^[a-z0-9-]+$", name):
                issues.append(Issue("error", "name",
                    "Name must contain only lowercase letters, numbers, and hyphens"))
            else:
                if name.startswith("-") or name.endswith("-") or "--" in name:
                    issues.append(Issue("error", "name",
                        "Name cannot start/end with hyphen or contain consecutive hyphens"))
                if "<" in name or ">" in name:
                    issues.append(Issue("error", "name", "Name cannot contain XML tags"))
                for word in RESERVED_WORDS:
                    if word in name:
                        issues.append(Issue("error", "name",
                            f"Name cannot contain reserved word '{word}'"))

            # Verify directory name matches skill name
            if skill_path.name != name:
                issues.append(Issue("warning", "name",
                    f"Directory name '{skill_path.name}' doesn't match skill name '{name}'"))

    # ── Description validation ────────────────────────────────────────────
    if "description" not in fm:
        issues.append(Issue("error", "description", "Missing required 'description' field"))
    else:
        desc = fm["description"]
        if not isinstance(desc, str):
            issues.append(Issue("error", "description",
                f"Description must be a string, got {type(desc).__name__}"))
        else:
            desc = desc.strip()
            if not desc:
                issues.append(Issue("error", "description", "Description cannot be empty"))
            else:
                if "<" in desc or ">" in desc:
                    issues.append(Issue("error", "description",
                        "Description cannot contain angle brackets (XML tags)"))

                if len(desc) > MAX_DESC_LENGTH_GENERAL:
                    issues.append(Issue("error", "description",
                        f"Description too long ({len(desc)} chars, max {MAX_DESC_LENGTH_GENERAL})"))
                elif platform == "claude-ai" and len(desc) > MAX_DESC_LENGTH_CLAUDE_AI:
                    issues.append(Issue("error", "description",
                        f"Description too long for claude.ai ({len(desc)} chars, max {MAX_DESC_LENGTH_CLAUDE_AI})"))
                elif platform == "all" and len(desc) > MAX_DESC_LENGTH_CLAUDE_AI:
                    issues.append(Issue("warning", "description",
                        f"Description is {len(desc)} chars — exceeds claude.ai limit of {MAX_DESC_LENGTH_CLAUDE_AI}. "
                        f"OK for API/Code, but won't work if uploaded to claude.ai."))

                # Quality checks
                desc_lower = desc.lower()
                if not any(kw in desc_lower for kw in ["use when", "use for", "use this", "trigger"]):
                    issues.append(Issue("warning", "description",
                        "Description should include 'when to use' guidance (e.g., 'Use when...')"))

                if desc_lower.startswith(("i ", "i'm", "you ", "you can", "this skill")):
                    issues.append(Issue("warning", "description",
                        "Description should be in third person "
                        "(e.g., 'Processes files' not 'I can process files')"))

    # ── Compatibility validation ──────────────────────────────────────────
    if "compatibility" in fm:
        compat = fm["compatibility"]
        if isinstance(compat, str) and len(compat) > MAX_COMPATIBILITY_LENGTH:
            issues.append(Issue("error", "frontmatter",
                f"Compatibility too long ({len(compat)} chars, max {MAX_COMPATIBILITY_LENGTH})"))

    # ── Body validation ───────────────────────────────────────────────────
    body_start = content.find("---", 3)
    if body_start != -1:
        body = content[body_start + 3:].strip()
        body_lines = body.splitlines()
        body_line_count = len(body_lines)

        if body_line_count > MAX_BODY_LINES:
            issues.append(Issue("warning", "body",
                f"SKILL.md body is {body_line_count} lines (recommended max: {MAX_BODY_LINES}). "
                f"Consider moving content to references/."))

        if not body:
            issues.append(Issue("warning", "body", "SKILL.md body is empty — no instructions for Claude"))

        # Check for "when to use" in body (should be in description instead)
        if re.search(r"(?i)##?\s*when to use", body):
            issues.append(Issue("warning", "body",
                "Found 'When to Use' section in body. This should be in the description — "
                "body only loads after triggering."))

    # ── File structure validation ─────────────────────────────────────────
    for f in skill_path.iterdir():
        if f.name in FORBIDDEN_FILES:
            issues.append(Issue("warning", "structure",
                f"Found {f.name} — skills are for AI agents, not human onboarding. Remove it."))

    # Check for empty directories
    for d in skill_path.rglob("*"):
        if d.is_dir() and not any(d.iterdir()):
            issues.append(Issue("warning", "structure",
                f"Empty directory: {d.relative_to(skill_path)}"))

    # ── References validation ─────────────────────────────────────────────
    refs_dir = skill_path / "references"
    if refs_dir.exists():
        body_content = content.lower() if content else ""
        for ref_file in refs_dir.glob("*.md"):
            ref_name = ref_file.name.lower()
            # Check if referenced from SKILL.md
            if ref_name not in body_content and ref_file.stem.lower() not in body_content:
                issues.append(Issue("warning", "references",
                    f"references/{ref_file.name} not referenced in SKILL.md — "
                    f"Claude won't know to read it"))

            # Check reference file length
            ref_lines = ref_file.read_text(encoding="utf-8").splitlines()
            if len(ref_lines) > MAX_REFERENCE_LINES:
                ref_content = ref_file.read_text(encoding="utf-8")
                if not re.search(r"(?i)##?\s*(table of contents|toc|contents)", ref_content):
                    issues.append(Issue("warning", "references",
                        f"references/{ref_file.name} is {len(ref_lines)} lines "
                        f"(>{MAX_REFERENCE_LINES}) without a table of contents"))

    # ── Scripts validation ────────────────────────────────────────────────
    scripts_dir = skill_path / "scripts"
    if scripts_dir.exists():
        for script in scripts_dir.glob("*.py"):
            if not os.access(script, os.X_OK):
                issues.append(Issue("info", "scripts",
                    f"scripts/{script.name} is not executable (chmod +x)"))

        if platform == "api":
            issues.append(Issue("warning", "platform",
                "API platform has no network access and no runtime package install. "
                "Ensure scripts only use pre-installed packages."))

    return issues


def print_report(issues: List[Issue], skill_path: str):
    """Print a formatted validation report."""
    errors = [i for i in issues if i.level == "error"]
    warnings = [i for i in issues if i.level == "warning"]
    infos = [i for i in issues if i.level == "info"]

    print(f"\n{'=' * 60}")
    print(f"  Skill Validation Report: {Path(skill_path).name}")
    print(f"{'=' * 60}\n")

    if not issues:
        print("✅ All checks passed! Skill is valid.\n")
        return True

    for section_name, section_issues in [("Errors", errors), ("Warnings", warnings), ("Info", infos)]:
        if section_issues:
            print(f"  {section_name} ({len(section_issues)}):")
            for issue in section_issues:
                print(f"    {issue}")
            print()

    print(f"{'─' * 60}")
    print(f"  Summary: {len(errors)} error(s), {len(warnings)} warning(s), {len(infos)} info(s)")
    print(f"  Result: {'❌ FAILED' if errors else '⚠️ PASSED with warnings' if warnings else '✅ PASSED'}")
    print(f"{'─' * 60}\n")

    return len(errors) == 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_skill.py <skill-directory> [--platform claude-code|claude-ai|api|all]")
        sys.exit(1)

    skill_dir = sys.argv[1]
    platform = "all"

    if "--platform" in sys.argv:
        idx = sys.argv.index("--platform")
        if idx + 1 < len(sys.argv):
            platform = sys.argv[idx + 1]
            if platform not in ("claude-code", "claude-ai", "api", "all"):
                print(f"Invalid platform: {platform}. Use: claude-code, claude-ai, api, all")
                sys.exit(1)

    issues = validate_skill(skill_dir, platform)
    passed = print_report(issues, skill_dir)
    sys.exit(0 if passed else 1)
