# Troubleshooting Guide

Common issues during skill development and how to fix them.

## 1. Skill Doesn't Trigger

**Symptoms**:
- User asks for something the skill should handle
- Skill is never invoked
- Model uses generic approach instead

**Causes & Fixes**:

### Description is too vague
**Problem**: Description doesn't include enough trigger keywords.

**Fix**: Front-load trigger phrases in description:
```yaml
# Bad
description: Helps with code tasks

# Good  
description: Review Python code for security vulnerabilities. Use when someone asks to "check for security issues", "audit code", "find vulnerabilities", or mentions OWASP, injection, or XSS.
```

### Description is too long
**Problem**: Platform truncates long descriptions, losing trigger keywords.

**Fix**: Keep description under 1024 characters. Put most important triggers first.

### Name conflicts with built-in
**Problem**: Skill name collides with a built-in slash command.

**Fix**: Check list of built-ins: init, review, security-review, etc. Rename if needed.

### YAML parsing error
**Problem**: Description contains colons or special characters without quotes.

**Fix**: Quote the description:
```yaml
description: "Use when: user asks for X, Y, or Z"
```

### Skill is in wrong location
**Problem**: Skill file not in scanned directory.

**Fix**: Ensure skill is in one of:
- `.opencode/skills/` (project)
- `~/.config/opencode/skills/` (global)
- `~/.claude/skills/` (external)
- `~/.agents/skills/` (external)

## 2. Skill Triggers Too Often

**Symptoms**:
- Skill activates for unrelated requests
- User complains about false positives
- Skill interferes with other tasks

**Causes & Fixes**:

### Description too broad
**Problem**: Description matches too many contexts.

**Fix**: Add negative triggers and be specific:
```yaml
# Bad
description: Use for any code task

# Good
description: Review Python code specifically for security vulnerabilities. Do NOT use for general code review, style checks, or non-Python code.
```

### Missing scope boundaries
**Problem**: Skill doesn't define what it doesn't do.

**Fix**: Add explicit scope in description:
```yaml
description: "Deploy to AWS Lambda. ONLY for Lambda deployments, not EC2, ECS, or other AWS services."
```

## 3. Instructions Not Followed

**Symptoms**:
- Skill triggers but output is wrong
- Steps are skipped
- Gotchas are ignored

**Causes & Fixes**:

### Instructions too implicit
**Problem**: Skill assumes knowledge Claude doesn't have.

**Fix**: Be explicit about non-obvious steps:
```markdown
# Bad
Transform the data

# Good
1. Parse the JSON response
2. Extract the "users" array
3. Map each user to {name, email}
4. Filter out entries where email is null
```

### Gotchas not prominent enough
**Problem**: Critical warnings buried in text.

**Fix**: Put gotchas in a dedicated section near the top:
```markdown
## Gotchas (read this first!)
- API returns snake_case but SDK expects camelCase
- Batch size > 100 silently drops records
- Never use datetime.now() in tests
```

### Missing reasoning
**Problem**: Claude doesn't understand why steps matter.

**Fix**: Explain the why:
```markdown
We validate timestamps because the API silently accepts future dates 
but the downstream system crashes when processing them.
```

### SKILL.md too long
**Problem**: Claude loses focus in long documents.

**Fix**: Keep under 500 lines. Move details to bundled files.

## 4. Large Context / Token Usage

**Symptoms**:
- Skill uses excessive tokens
- Slow responses
- Context window filling up

**Causes & Fixes**:

### Bundled files loaded unnecessarily
**Problem**: All reference files loaded at once.

**Fix**: Use progressive disclosure:
- Level 1: Frontmatter (always loaded)
- Level 2: SKILL.md body (loaded when triggered)
- Level 3: Bundled files (loaded as needed)

Reference bundled files with when-to-read guidance:
```markdown
## Additional Resources
- For API details: read `${CLAUDE_SKILL_DIR}/references/api.md`
```

### SKILL.md includes obvious content
**Problem**: Restating things Claude already knows.

**Fix**: Remove obvious instructions. Focus on gotchas and non-obvious patterns.

### No compaction strategy
**Problem**: Long conversations exhaust context.

**Fix**: Use compaction settings in opencode.json:
```json
{
  "compaction": {
    "auto": true,
    "tail_turns": 15
  }
}
```

## 5. Frontmatter Errors

**Symptoms**:
- Skill fails to load
- YAML parsing errors
- Unexpected behavior

**Common Errors & Fixes**:

### Invalid YAML syntax
```yaml
# Bad - colon without quotes
description: Use when: user asks for X

# Good
description: "Use when: user asks for X"
```

### Boolean keywords as name
```yaml
# Bad - these parse as booleans
name: true
name: yes
name: on

# Good
name: my-skill
```

### Missing required fields
```yaml
# Bad - missing name and description
# ---
# ---

# Good
---
name: my-skill
description: What this skill does and when to use it
---
```

### Invalid characters in name
```yaml
# Bad
name: my skill!  # spaces and special chars

# Good
name: my-skill  # lowercase hyphen-separated
```

### Description too short
```yaml
# Bad
description: Code stuff

# Good
description: "Review Python code for security vulnerabilities. Use when someone asks to audit code, check for security issues, or mentions OWASP."
```

## Debugging Steps

When something isn't working:

1. **Check the schema**: Fetch https://opencode.ai/config.json and validate your config
2. **Check file location**: Ensure skill is in a scanned directory
3. **Check YAML syntax**: Use a YAML validator
4. **Check description**: Ensure it includes trigger keywords
5. **Check name**: No conflicts with built-ins
6. **Test with minimal skill**: Strip down to just frontmatter and test
7. **Check logs**: Look for error messages in opencode output

## Getting More Help

If the issue isn't covered here:

1. Fetch official docs index: https://code.claude.com/docs/llms.txt
2. Identify relevant page (skills.md, hooks.md, etc.)
3. Fetch that page and compare your skill against current spec
4. Check GitHub issues for known problems
