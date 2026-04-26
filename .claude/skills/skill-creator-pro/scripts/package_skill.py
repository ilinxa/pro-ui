#!/usr/bin/env python3
"""
Skill Packager — validates and creates a distributable .zip file.

The .zip format is what claude.ai expects for skill uploads.
The skill folder is the root of the ZIP (not nested in a subfolder).

Usage:
    python package_skill.py <skill-directory> [output-directory] [--platform claude-code|claude-ai|api|all]

Examples:
    python package_skill.py .claude/skills/my-skill
    python package_skill.py .claude/skills/my-skill ./dist --platform claude-ai
"""

import sys
import zipfile
from pathlib import Path

# Import validation from sibling module
sys.path.insert(0, str(Path(__file__).parent))
from validate_skill import validate_skill, print_report


EXCLUDED_PATTERNS = {
    "__pycache__", ".pyc", ".git", ".DS_Store", "Thumbs.db",
    ".env", ".venv", "node_modules",
}


def should_exclude(path: Path) -> bool:
    """Check if a file/directory should be excluded from packaging."""
    for part in path.parts:
        if part in EXCLUDED_PATTERNS or part.startswith("."):
            return True
        for pattern in EXCLUDED_PATTERNS:
            if part.endswith(pattern):
                return True
    return False


def package_skill(skill_path: str, output_dir: str = None, platform: str = "all") -> Path | None:
    """Package a skill directory into a distributable .zip file."""
    skill_path = Path(skill_path).resolve()

    if not skill_path.exists() or not skill_path.is_dir():
        print(f"❌ Not a valid directory: {skill_path}")
        return None

    if not (skill_path / "SKILL.md").exists():
        print(f"❌ SKILL.md not found in {skill_path}")
        return None

    # Run validation first
    print("🔍 Validating skill...\n")
    issues = validate_skill(str(skill_path), platform)
    passed = print_report(issues, str(skill_path))

    errors = [i for i in issues if i.level == "error"]
    if errors:
        print("❌ Fix validation errors before packaging.")
        return None

    # Determine output location
    skill_name = skill_path.name
    out_path = Path(output_dir).resolve() if output_dir else Path.cwd()
    out_path.mkdir(parents=True, exist_ok=True)

    zip_filename = out_path / f"{skill_name}.zip"

    try:
        file_count = 0
        with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_path in sorted(skill_path.rglob("*")):
                if file_path.is_file() and not should_exclude(file_path.relative_to(skill_path)):
                    # Archive with skill folder as root
                    arcname = str(Path(skill_name) / file_path.relative_to(skill_path))
                    zf.write(file_path, arcname)
                    print(f"  📄 {arcname}")
                    file_count += 1

        size_kb = zip_filename.stat().st_size / 1024
        print(f"\n✅ Packaged {file_count} files → {zip_filename} ({size_kb:.1f} KB)")

        if platform in ("claude-ai", "all"):
            print(f"\n📋 To upload to claude.ai:")
            print(f"   1. Go to Settings > Features (or Capabilities)")
            print(f"   2. Scroll to Skills section")
            print(f"   3. Click 'Upload skill' and select {zip_filename.name}")

        return zip_filename

    except Exception as e:
        print(f"❌ Packaging error: {e}")
        return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python package_skill.py <skill-directory> [output-directory] [--platform ...]")
        sys.exit(1)

    skill_dir = sys.argv[1]
    output_dir = None
    platform = "all"

    # Parse args
    positional = []
    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == "--platform" and i + 1 < len(sys.argv):
            platform = sys.argv[i + 1]
            i += 2
        else:
            positional.append(sys.argv[i])
            i += 1

    if positional:
        output_dir = positional[0]

    print(f"📦 Packaging: {skill_dir}")
    if output_dir:
        print(f"   Output: {output_dir}")
    print(f"   Platform: {platform}\n")

    result = package_skill(skill_dir, output_dir, platform)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
