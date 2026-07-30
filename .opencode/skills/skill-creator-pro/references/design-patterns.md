# Design Patterns Reference

Detailed guidance on implementation patterns, writing patterns, and composability for skill design.

## Implementation Patterns

### Sequential Workflow
Best for: Step-by-step processes with clear order.

```markdown
## Workflow

1. **First step** - Description of what to do
   - Sub-detail if needed
   - Expected outcome

2. **Second step** - Description
   - Depends on step 1 output

3. **Final step** - Description
   - Produces final output
```

**When to use**: Linear processes, data pipelines, deployment sequences.

### Multi-MCP Coordination
Best for: Tasks requiring multiple external tools.

```markdown
## Tool Coordination

1. **Fetch data** from Tool A
   - Use specific endpoint
   - Handle pagination

2. **Transform** using Tool B
   - Map fields correctly
   - Validate output

3. **Store results** in Tool C
   - Check for duplicates
   - Handle conflicts
```

**When to use**: ETL processes, multi-service integrations, complex automations.

### Iterative Refinement
Best for: Tasks requiring multiple passes to get right.

```markdown
## Refinement Loop

1. **Initial attempt** - Make best guess
2. **Validate** - Check against requirements
3. **Improve** - Fix issues found
4. **Repeat** until validation passes
```

**When to use**: Code generation, content creation, design work.

### Context-Aware Tool Selection
Best for: Tasks where tool choice depends on situation.

```markdown
## Decision Logic

- If data is small (< 1MB): Use Tool A
- If data is large (> 1MB): Use Tool B
- If real-time needed: Use Tool C
- If batch processing: Use Tool D
```

**When to use**: Performance optimization, cost management, compatibility handling.

### Domain-Specific Intelligence
Best for: Tasks requiring specialized knowledge.

```markdown
## Domain Rules

1. **Rule 1**: Explanation of domain constraint
2. **Rule 2**: Why this matters
3. **Rule 3**: How to handle exceptions
```

**When to use**: Industry-specific tasks, regulatory compliance, specialized workflows.

## Writing Patterns

### Gotchas Design

**Structure each gotcha as**:
```markdown
- **Problem**: What goes wrong
  **Fix**: How to prevent it
  **Why**: Reason this matters
```

**Good gotchas**:
- Name the specific failure mode
- Provide a concrete fix
- Explain the reasoning
- Are discovered through testing, not guessed

**Bad gotchas**:
- Vague warnings ("be careful")
- Obvious statements ("check your input")
- Missing the fix ("this can fail")

### Progressive Disclosure

**Level 1: Frontmatter** (~100 words)
- Name, description, trigger conditions
- Decides if skill is invoked

**Level 2: SKILL.md Body** (<500 lines)
- Core instructions
- Quick start
- Key gotchas

**Level 3: Bundled Files** (unlimited)
- Detailed references
- Scripts and templates
- Extended examples

**Principle**: Put the most important information first. Claude reads the full SKILL.md when triggered, but attention is strongest at the start.

### Hooks Integration

**On-demand hooks** activate only during skill session:

```markdown
## Hooks

### /careful
- Blocks destructive commands
- Matcher: `rm -rf`, `DROP TABLE`, `--force`

### /freeze  
- Blocks file modifications outside project
- Scope: During debugging sessions
```

**When to add hooks**:
- Skill touches production data
- Involves destructive operations
- Needs directory boundaries
- Requires confirmation gates

### Setup Pattern

**Lazy initialization** for user-specific context:

```markdown
## Setup

On first invocation:
1. Check for ${CLAUDE_PLUGIN_DATA}/config.json
2. If missing, prompt for:
   - API credentials
   - Project name
   - Preferred settings
3. Save to config.json
4. Subsequent invocations skip setup
```

### Composability

**Skills can compose other skills**:

```markdown
## Related Skills

- For data fetching: use `data-fetcher` skill
- For validation: use `validator` skill
- For deployment: use `deployer` skill

This skill orchestrates those skills in sequence.
```

**Benefits**:
- Reuse existing skills
- Maintain single responsibility
- Enable complex workflows

## Anti-Patterns to Avoid

### 1. Over-Specification
**Problem**: Skill is so rigid it breaks on variations.

**Fix**: Give principles, not just steps. Explain why, not just what.

### 2. Under-Specification
**Problem**: Skill is too vague to be useful.

**Fix**: Include concrete examples and gotchas.

### 3. Context Overload
**Problem**: Skill tries to do too much in one file.

**Fix**: Split into multiple skills or use bundled files.

### 4. Missing Gotchas
**Problem**: Claude hits failure modes not covered.

**Fix**: Test thoroughly, add gotchas as you discover them.

### 5. Ignoring Platform Features
**Problem**: Not using hooks, composability, or other platform capabilities.

**Fix**: Read platform reference, use features that fit.

## Design Checklist

- [ ] Clear trigger conditions in description
- [ ] Gotchas section with 2-3+ entries
- [ ] Progressive disclosure (frontmatter → body → files)
- [ ] Concrete examples
- [ ] Reasoning explained, not just commands
- [ ] Flexibility for variations
- [ ] Composition with other skills where appropriate
- [ ] Platform features used appropriately
