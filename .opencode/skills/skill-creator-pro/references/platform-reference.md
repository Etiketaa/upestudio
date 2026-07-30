# Platform Reference

Frontmatter fields, string substitutions, hook system, and platform gotchas for skill development.

## Frontmatter Fields

### Required Fields

```yaml
---
name: my-skill
description: What this skill does and when to trigger it
---
```

- **name**: Lowercase hyphen-separated, max 64 chars, matches folder name
- **description**: Effectively required (skills without one are filtered out). Cover WHAT and WHEN. Front-load trigger keywords.

### Optional Fields

```yaml
---
name: my-skill
description: "Use when user asks for X"
license: MIT
compatibility: ">=2.1.0"
metadata:
  author: "Your Name"
  version: "1.0.0"
---
```

- **license**: SPDX license identifier
- **compatibility**: Version constraint for the skill
- **metadata**: String-string map for additional info

## String Substitutions

### ${CLAUDE_SKILL_DIR}
Resolves to the skill's root directory. Use when referencing bundled files:

```markdown
## Resources
- Read `${CLAUDE_SKILL_DIR}/references/api.md`
- Copy `${CLAUDE_SKILL_DIR}/assets/template.md`
```

### ${CLAUDE_PLUGIN_DATA}
Resolves to a stable storage directory that persists across upgrades. Use for config and data:

```markdown
## Setup
1. Check `${CLAUDE_PLUGIN_DATA}/config.json`
2. If missing, prompt user for settings
3. Save to `${CLAUDE_PLUGIN_DATA}/config.json`
```

### $ARGUMENTS
Resolves to the arguments passed to the skill (if any).

## Hook System

### Hook Types

#### PreToolUse
Runs before a tool executes. Can modify arguments or block execution.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "handler": "block-destructive-commands"
      }
    ]
  }
}
```

#### PostToolUse
Runs after a tool executes. Can inspect results.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "handler": "log-file-changes"
      }
    ]
  }
}
```

#### Notification
Runs on notifications. Can route or filter.

```json
{
  "hooks": {
    "Notification": [
      {
        "handler": "send-to-slack"
      }
    ]
  }
}
```

### Hook Events

- **PreToolUse**: Before tool execution
- **PostToolUse**: After tool execution
- **Notification**: On notifications

### Conditional Filtering

Hooks can filter by tool name, command pattern, or other conditions:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "pattern": "rm -rf *",
        "handler": "block-rm-rf"
      }
    ]
  }
}
```

### Permission Decisions

Hooks can return:
- `"allow"`: Allow the action
- `"deny"`: Block the action
- `"ask"`: Ask user for confirmation

## Allowed Tools

Skills can specify which tools they're allowed to use:

```yaml
---
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---
```

## Plugin Manifest

For skills that are also plugins:

```json
{
  "name": "my-skill",
  "version": "1.0.0",
  "description": "What this skill does",
  "main": "index.js",
  "hooks": {
    "PreToolUse": []
  }
}
```

## Platform Gotchas

### YAML Parsing
- Colons in values need quotes: `description: "Use when: X"`
- Boolean keywords (true, false, yes, no, on, off) parse as booleans
- Use lowercase hyphen-separated for names

### File Naming
- Skill folder must match skill name
- SKILL.md must be exactly that name (case-sensitive)
- No README.md inside skill folder

### Description Length
- Keep under 1024 characters
- Front-load trigger keywords
- Include WHAT and WHEN

### Name Conflicts
- Don't use built-in slash command names
- Don't use "claude" or "anthropic" in name
- Don't use YAML boolean keywords as name

### Context Loading
- Frontmatter always loaded (~100 words)
- SKILL.md body loaded when triggered (<500 lines ideal)
- Bundled files loaded as needed (unlimited)

### Hook Scope
- Hooks register globally but can be filtered
- Use matchers to limit scope
- Consider on-demand hooks for skill-specific guardrails

### Persistent Data
- Use ${CLAUDE_PLUGIN_DATA} for storage
- Don't write to skill directory
- Don't write to project directory without permission

### Progressive Disclosure
- Put most important info first
- Use bundled files for details
- Reference with ${CLAUDE_SKILL_DIR}

## Version Compatibility

This reference covers features available in Claude Code v2.1.112+. For older versions:

1. Fetch official docs index: https://code.claude.com/docs/llms.txt
2. Check feature availability
3. Use fallback approaches if needed

## Resources

- Official docs: https://code.claude.com/docs/llms.txt
- Skills documentation: https://code.claude.com/docs/skills.md
- Hooks documentation: https://code.claude.com/docs/hooks.md
- Plugins reference: https://code.claude.com/docs/plugins-reference.md
