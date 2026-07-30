# Eval Writing Guide

How to write good assertions for skill evaluation.

## Principles

### 1. Binary Outcomes
Good assertions are pass/fail. Avoid subjective measures in programmatic assertions.

```markdown
# Bad (subjective)
- Output is well-formatted
- Code is clean

# Good (binary)
- File exists: output.json
- File contains: "status": "success"
- Command succeeds: python validate.py
```

### 2. Objectively Verifiable
Each assertion should be checkable without human judgment.

```markdown
# Bad (requires judgment)
- Code follows best practices

# Good (verifiable)
- File contains no TODO comments
- All functions have docstrings
- No imports from deprecated modules
```

### 3. Descriptive Names
Assertion names should describe what they check.

```markdown
# Bad
- check1
- assertion_a

# Good
- file_contains_valid_json
- command_exits_with_zero
- output_has_required_fields
```

### 4. Independent
Assertions shouldn't depend on each other.

```markdown
# Bad (dependent)
1. File exists
2. File contains X (depends on 1)

# Good (independent)
1. File output.json exists
2. File config.json contains valid structure
3. Command python test.py succeeds
```

## Assertion Types

### file_exists
Check that a file was created.

```json
{
  "name": "output_file_created",
  "type": "file_exists",
  "check": "output.json"
}
```

### file_contains
Check that a file contains specific content.

```json
{
  "name": "output_has_success_status",
  "type": "file_contains",
  "check": "output.json",
  "expected": "\"status\": \"success\""
}
```

### file_not_contains
Check that a file does NOT contain specific content.

```json
{
  "name": "no_todo_comments",
  "type": "file_not_contains",
  "check": "src/**/*.py",
  "expected": "TODO"
}
```

### command_succeeds
Check that a command exits with code 0.

```json
{
  "name": "tests_pass",
  "type": "command_succeeds",
  "check": "python -m pytest tests/ -v"
}
```

### command_fails
Check that a command exits with non-zero code.

```json
{
  "name": "validation_catches_error",
  "type": "command_fails",
  "check": "python validate.py --expect-failure"
}
```

### custom
For complex checks that need custom logic.

```json
{
  "name": "output_matches_schema",
  "type": "custom",
  "check": "python -c \"import json; import jsonschema; jsonschema.validate(json.load(open('output.json')), json.load(open('schema.json')))\""
}
```

## Writing Assertions

### Step 1: Identify Verifiable Outcomes
What can be objectively checked after the skill runs?

- Files created or modified
- Commands that succeed or fail
- Content that is present or absent
- Exit codes

### Step 2: Prioritize Critical Checks
Focus on the most important outcomes first:

1. **Required outputs**: Did the skill produce what it should?
2. **Correctness**: Is the output correct?
3. **Quality**: Does it meet standards?
4. **Edge cases**: Are boundary conditions handled?

### Step 3: Write Clear Assertions
Each assertion should:
- Have a descriptive name
- Check one thing
- Be independently verifiable
- Have clear expected values

### Step 4: Avoid Over-Testing
Don't assert everything. Focus on:
- Critical success criteria
- Common failure modes
- Non-obvious requirements

## Examples

### Code Generation Skill
```json
{
  "assertions": [
    {
      "name": "main_py_exists",
      "type": "file_exists",
      "check": "main.py"
    },
    {
      "name": "main_py_has_main_function",
      "type": "file_contains",
      "check": "main.py",
      "expected": "def main()"
    },
    {
      "name": "main_py_runs_without_error",
      "type": "command_succeeds",
      "check": "python main.py --help"
    },
    {
      "name": "requirements_txt_exists",
      "type": "file_exists",
      "check": "requirements.txt"
    }
  ]
}
```

### Code Review Skill
```json
{
  "assertions": [
    {
      "name": "review_output_exists",
      "type": "file_exists",
      "check": "review.md"
    },
    {
      "name": "review_mentions_security",
      "type": "file_contains",
      "check": "review.md",
      "expected": "security"
    },
    {
      "name": "review_has_recommendations",
      "type": "file_contains",
      "check": "review.md",
      "expected": "recommend"
    }
  ]
}
```

### Deployment Skill
```json
{
  "assertions": [
    {
      "name": "deploy_script_exists",
      "type": "file_exists",
      "check": "deploy.sh"
    },
    {
      "name": "deploy_script_is_executable",
      "type": "command_succeeds",
      "check": "test -x deploy.sh"
    },
    {
      "name": "deploy_script_has_shebang",
      "type": "file_contains",
      "check": "deploy.sh",
      "expected": "#!/bin/bash"
    }
  ]
}
```

## Testing Assertions

Before using assertions in evals:

1. **Run the skill manually** and check what it produces
2. **Write assertions** based on actual outputs
3. **Verify assertions pass** with correct input
4. **Verify assertions fail** with incorrect input
5. **Refine** based on what you learn

## Common Patterns

### File Structure Check
```json
{
  "assertions": [
    {"name": "src_dir_exists", "type": "file_exists", "check": "src/"},
    {"name": "tests_dir_exists", "type": "file_exists", "check": "tests/"},
    {"name": "readme_exists", "type": "file_exists", "check": "README.md"},
    {"name": "config_exists", "type": "file_exists", "check": "config.json"}
  ]
}
```

### Code Quality Check
```json
{
  "assertions": [
    {"name": "no_syntax_errors", "type": "command_succeeds", "check": "python -m py_compile src/*.py"},
    {"name": "has_docstrings", "type": "file_not_contains", "check": "src/**/*.py", "expected": "pass"},
    {"name": "no_hardcoded_secrets", "type": "file_not_contains", "check": "src/**/*.py", "expected": "password|secret|key"}
  ]
}
```

### Documentation Check
```json
{
  "assertions": [
    {"name": "readme_has_title", "type": "file_contains", "check": "README.md", "expected": "#"},
    {"name": "readme_has_installation", "type": "file_contains", "check": "README.md", "expected": "install"},
    {"name": "readme_has_usage", "type": "file_contains", "check": "README.md", "expected": "usage"}
  ]
}
```
