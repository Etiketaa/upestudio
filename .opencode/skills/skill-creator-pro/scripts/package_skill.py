#!/usr/bin/env python3
"""
Package a skill folder into a distributable archive.

Usage:
    python -m scripts.package_skill <path/to/skill-folder>

This script:
1. Validates the skill structure
2. Checks frontmatter syntax
3. Creates a .tar.gz archive
4. Outputs the archive path
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tarfile
from pathlib import Path


def validate_skill_structure(skill_path: Path) -> list[str]:
    """Validate the skill folder structure."""
    errors = []
    
    # Check for SKILL.md
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        errors.append("Missing SKILL.md file")
    
    # Check for README.md (should not exist)
    readme = skill_path / "README.md"
    if readme.exists():
        errors.append("README.md should not exist in skill folder")
    
    # Check folder name matches skill name
    folder_name = skill_path.name
    if not re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', folder_name):
        errors.append(f"Folder name '{folder_name}' is not valid (must be lowercase hyphen-separated)")
    
    return errors


def validate_frontmatter(skill_path: Path) -> list[str]:
    """Validate SKILL.md frontmatter."""
    errors = []
    
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        return errors
    
    content = skill_md.read_text()
    
    # Check for frontmatter
    if not content.startswith("---"):
        errors.append("Missing frontmatter (SKILL.md should start with ---)")
        return errors
    
    # Extract frontmatter
    parts = content.split("---", 2)
    if len(parts) < 3:
        errors.append("Malformed frontmatter (unclosed ---)")
        return errors
    
    frontmatter = parts[1].strip()
    
    # Check for required fields
    if "name:" not in frontmatter:
        errors.append("Missing 'name' field in frontmatter")
    
    if "description:" not in frontmatter:
        errors.append("Missing 'description' field in frontmatter")
    
    # Check for common issues
    lines = frontmatter.split("\n")
    for line in lines:
        # Check for unquoted colons in description
        if "description:" in line and "Use when:" in line:
            if not re.search(r'description:\s*["\']', line):
                errors.append("Description contains unquoted colon (YAML may parse incorrectly)")
        
        # Check for boolean keywords as name
        if re.match(r'^name:\s*(true|false|yes|no|on|off)$', line, re.IGNORECASE):
            errors.append("Name is a YAML boolean keyword (will parse incorrectly)")
        
        # Check for invalid characters in name
        if "name:" in line:
            name_match = re.search(r'name:\s*(.+)', line)
            if name_match:
                name = name_match.group(1).strip().strip('"').strip("'")
                if not re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', name):
                    errors.append(f"Name '{name}' is not valid (must be lowercase hyphen-separated)")
    
    # Check description length
    desc_match = re.search(r'description:\s*["\'](.+?)["\']', frontmatter, re.DOTALL)
    if not desc_match:
        desc_match = re.search(r'description:\s*(.+)', frontmatter)
    if desc_match:
        desc = desc_match.group(1).strip()
        if len(desc) > 1024:
            errors.append(f"Description is too long ({len(desc)} chars, max 1024)")
    
    return errors


def check_skill_quality(skill_path: Path) -> list[str]:
    """Check skill quality indicators."""
    warnings = []
    
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        return warnings
    
    content = skill_md.read_text()
    
    # Check for gotchas section
    if "## Gotchas" not in content and "## Gotchas" not in content.lower():
        warnings.append("No 'Gotchas' section found")
    
    # Check SKILL.md length
    lines = content.split("\n")
    if len(lines) > 500:
        warnings.append(f"SKILL.md is {len(lines)} lines (recommended max: 500)")
    
    # Check for bundled files
    references_dir = skill_path / "references"
    scripts_dir = skill_path / "scripts"
    
    if references_dir.exists() or scripts_dir.exists():
        # Check if SKILL.md references them
        if "${CLAUDE_SKILL_DIR}" not in content:
            warnings.append("Has bundled files but SKILL.md doesn't reference them with ${CLAUDE_SKILL_DIR}")
    
    # Check for scripts without shebang
    if scripts_dir.exists():
        for script in scripts_dir.glob("*.py"):
            content = script.read_text()
            if not content.startswith("#!"):
                warnings.append(f"Script {script.name} missing shebang line")
    
    return warnings


def create_archive(skill_path: Path, output_dir: Path) -> Path:
    """Create a .tar.gz archive of the skill."""
    skill_name = skill_path.name
    archive_name = f"{skill_name}.tar.gz"
    archive_path = output_dir / archive_name
    
    with tarfile.open(archive_path, "w:gz") as tar:
        # Add all files in skill directory
        for item in skill_path.rglob("*"):
            if item.is_file():
                # Calculate arcname (relative path within archive)
                arcname = item.relative_to(skill_path.parent)
                tar.add(item, arcname=arcname)
    
    return archive_path


def main():
    parser = argparse.ArgumentParser(description="Package a skill folder")
    parser.add_argument("skill_path", help="Path to the skill folder")
    parser.add_argument("-o", "--output", help="Output directory (default: current directory)")
    
    args = parser.parse_args()
    
    skill_path = Path(args.skill_path).resolve()
    
    if not skill_path.exists():
        print(f"Error: Skill path does not exist: {skill_path}", file=sys.stderr)
        sys.exit(1)
    
    if not skill_path.is_dir():
        print(f"Error: Skill path is not a directory: {skill_path}", file=sys.stderr)
        sys.exit(1)
    
    # Validate structure
    print("Validating skill structure...")
    structure_errors = validate_skill_structure(skill_path)
    if structure_errors:
        print("Structure errors:")
        for error in structure_errors:
            print(f"  - {error}")
        sys.exit(1)
    
    # Validate frontmatter
    print("Validating frontmatter...")
    frontmatter_errors = validate_frontmatter(skill_path)
    if frontmatter_errors:
        print("Frontmatter errors:")
        for error in frontmatter_errors:
            print(f"  - {error}")
        sys.exit(1)
    
    # Check quality
    print("Checking quality...")
    warnings = check_skill_quality(skill_path)
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"  - {warning}")
    
    # Create archive
    output_dir = Path(args.output) if args.output else Path.cwd()
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Creating archive...")
    archive_path = create_archive(skill_path, output_dir)
    
    print(f"\nSuccess! Archive created: {archive_path}")
    print(f"Size: {archive_path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
