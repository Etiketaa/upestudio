# Grader Agent

Evaluate assertions against outputs and produce grading results.

## Purpose

The grader agent takes an eval run (baseline or with-skill) and checks it against the defined assertions. It produces a grading.json file with pass/fail results for each assertion and an overall score.

## Input

- **eval_metadata.json**: Contains the assertions to check
- **Run output**: The actual output from the eval run
- **Run type**: Whether this is baseline or with_skill

## Output

```json
{
  "eval_id": 1,
  "run_type": "with_skill",
  "expectations": [
    {
      "text": "Output file exists",
      "passed": true,
      "evidence": "File output.json exists and is 1.2KB"
    },
    {
      "text": "Output contains valid JSON",
      "passed": false,
      "evidence": "File contains malformed JSON at line 5"
    }
  ],
  "score": 0.5,
  "summary": "1 of 2 assertions passed"
}
```

## Grading Process

### Step 1: Load Assertions

Read eval_metadata.json and extract the assertions array.

```python
import json

with open('eval_metadata.json') as f:
    metadata = json.load(f)

assertions = metadata['assertions']
```

### Step 2: Check Each Assertion

For each assertion, run the appropriate check:

#### file_exists
```python
import os

def check_file_exists(path):
    exists = os.path.exists(path)
    return {
        "passed": exists,
        "evidence": f"File {'exists' if exists else 'not found'}: {path}"
    }
```

#### file_contains
```python
def check_file_contains(path, expected):
    try:
        with open(path) as f:
            content = f.read()
        found = expected in content
        return {
            "passed": found,
            "evidence": f"{'Found' if found else 'Missing'} '{expected}' in {path}"
        }
    except FileNotFoundError:
        return {
            "passed": False,
            "evidence": f"File not found: {path}"
        }
```

#### file_not_contains
```python
def check_file_not_contains(path, expected):
    try:
        with open(path) as f:
            content = f.read()
        found = expected in content
        return {
            "passed": not found,
            "evidence": f"{'Found' if found else 'Correctly absent'} '{expected}' in {path}"
        }
    except FileNotFoundError:
        return {
            "passed": True,
            "evidence": f"File not found (OK): {path}"
        }
```

#### command_succeeds
```python
import subprocess

def check_command_succeeds(command):
    result = subprocess.run(command, shell=True, capture_output=True)
    return {
        "passed": result.returncode == 0,
        "evidence": f"Command exited with code {result.returncode}"
    }
```

#### command_fails
```python
def check_command_fails(command):
    result = subprocess.run(command, shell=True, capture_output=True)
    return {
        "passed": result.returncode != 0,
        "evidence": f"Command exited with code {result.returncode}"
    }
```

#### custom
```python
def check_custom(command):
    result = subprocess.run(command, shell=True, capture_output=True)
    return {
        "passed": result.returncode == 0,
        "evidence": result.stdout.decode() or result.stderr.decode()
    }
```

### Step 3: Calculate Score

Score = number of passed assertions / total assertions

```python
passed_count = sum(1 for e in expectations if e['passed'])
total_count = len(expectations)
score = passed_count / total_count if total_count > 0 else 0
```

### Step 4: Generate Summary

```python
summary = f"{passed_count} of {total_count} assertions passed"
```

### Step 5: Save Results

Write grading.json with the results.

## Handling Edge Cases

### Missing Files
If an assertion checks for a file that doesn't exist:
- file_exists: fails
- file_contains: fails
- file_not_contains: passes (correctly absent)

### Command Timeouts
If a command times out:
- Mark as failed
- Include timeout in evidence

### Ambiguous Assertions
If an assertion is unclear:
- Mark as failed
- Include explanation in evidence

## Example Grading

### Input
eval_metadata.json:
```json
{
  "eval_id": 1,
  "assertions": [
    {
      "name": "output_exists",
      "type": "file_exists",
      "check": "output.json"
    },
    {
      "name": "output_valid_json",
      "type": "custom",
      "check": "python -c \"import json; json.load(open('output.json'))\""
    }
  ]
}
```

### Run Output
- File output.json exists
- File contains invalid JSON

### Grading Result
```json
{
  "eval_id": 1,
  "run_type": "with_skill",
  "expectations": [
    {
      "text": "output_exists",
      "passed": true,
      "evidence": "File exists: output.json"
    },
    {
      "text": "output_valid_json",
      "passed": false,
      "evidence": "Expecting value: line 1 column 1 (char 0)"
    }
  ],
  "score": 0.5,
  "summary": "1 of 2 assertions passed"
}
```
