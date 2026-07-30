# Schemas Reference

JSON schemas for evals, grading, benchmark, and comparison files.

## evals.json

Schema for test cases and assertions.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["skill_name", "evals"],
  "properties": {
    "skill_name": {
      "type": "string",
      "description": "Name of the skill being tested"
    },
    "evals": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "prompt", "expected_output"],
        "properties": {
          "id": {
            "type": "integer",
            "description": "Unique identifier for this eval"
          },
          "prompt": {
            "type": "string",
            "description": "The user prompt to test"
          },
          "expected_output": {
            "type": "string",
            "description": "Description of expected result"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Files that should exist after execution"
          },
          "assertions": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/assertion"
            },
            "description": "Programmatic checks to verify"
          }
        }
      }
    }
  },
  "definitions": {
    "assertion": {
      "type": "object",
      "required": ["name", "type", "check"],
      "properties": {
        "name": {
          "type": "string",
          "description": "Descriptive name for the assertion"
        },
        "type": {
          "type": "string",
          "enum": ["file_exists", "file_contains", "file_not_contains", "command_succeeds", "command_fails", "custom"],
          "description": "Type of assertion"
        },
        "check": {
          "type": "string",
          "description": "What to check (file path, command, or code)"
        },
        "expected": {
          "type": "string",
          "description": "Expected value for comparison assertions"
        }
      }
    }
  }
}
```

## eval_metadata.json

Schema for individual eval run metadata.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["eval_id", "eval_name", "prompt", "assertions"],
  "properties": {
    "eval_id": {
      "type": "integer",
      "description": "ID from evals.json"
    },
    "eval_name": {
      "type": "string",
      "description": "Descriptive name for this eval"
    },
    "prompt": {
      "type": "string",
      "description": "The prompt that was tested"
    },
    "assertions": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/assertion"
      },
      "description": "Assertions to check"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "created_at": {
          "type": "string",
          "format": "date-time"
        },
        "skill_version": {
          "type": "string"
        },
        "model": {
          "type": "string"
        }
      }
    }
  }
}
```

## grading.json

Schema for grading results.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["eval_id", "run_type", "expectations", "score"],
  "properties": {
    "eval_id": {
      "type": "integer",
      "description": "ID from evals.json"
    },
    "run_type": {
      "type": "string",
      "enum": ["baseline", "with_skill"],
      "description": "Whether this was baseline or with-skill run"
    },
    "expectations": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/expectation"
      }
    },
    "score": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "description": "Overall score (0-1)"
    },
    "summary": {
      "type": "string",
      "description": "Brief summary of grading"
    }
  },
  "definitions": {
    "expectation": {
      "type": "object",
      "required": ["text", "passed", "evidence"],
      "properties": {
        "text": {
          "type": "string",
          "description": "What was expected"
        },
        "passed": {
          "type": "boolean",
          "description": "Whether expectation was met"
        },
        "evidence": {
          "type": "string",
          "description": "Evidence supporting the pass/fail"
        }
      }
    }
  }
}
```

## benchmark.json

Schema for aggregated benchmark results.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["skill_name", "iteration", "summary", "evals"],
  "properties": {
    "skill_name": {
      "type": "string"
    },
    "iteration": {
      "type": "integer",
      "description": "Iteration number (1, 2, 3...)"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "summary": {
      "$ref": "#/definitions/summary"
    },
    "evals": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/eval_result"
      }
    }
  },
  "definitions": {
    "summary": {
      "type": "object",
      "properties": {
        "total_evals": {
          "type": "integer"
        },
        "baseline_pass_rate": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "with_skill_pass_rate": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "improvement": {
          "type": "number",
          "description": "Difference in pass rates"
        },
        "avg_baseline_tokens": {
          "type": "integer"
        },
        "avg_with_skill_tokens": {
          "type": "integer"
        },
        "avg_baseline_duration_ms": {
          "type": "integer"
        },
        "avg_with_skill_duration_ms": {
          "type": "integer"
        }
      }
    },
    "eval_result": {
      "type": "object",
      "properties": {
        "eval_id": {
          "type": "integer"
        },
        "prompt": {
          "type": "string"
        },
        "baseline": {
          "$ref": "#/definitions/run_result"
        },
        "with_skill": {
          "$ref": "#/definitions/run_result"
        }
      }
    },
    "run_result": {
      "type": "object",
      "properties": {
        "pass_rate": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "passed_assertions": {
          "type": "integer"
        },
        "total_assertions": {
          "type": "integer"
        },
        "duration_ms": {
          "type": "integer"
        },
        "tokens": {
          "type": "integer"
        }
      }
    }
  }
}
```

## timing.json

Schema for timing data collected during runs.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["eval_id", "run_type", "duration_ms", "tokens"],
  "properties": {
    "eval_id": {
      "type": "integer"
    },
    "run_type": {
      "type": "string",
      "enum": ["baseline", "with_skill"]
    },
    "duration_ms": {
      "type": "integer",
      "description": "Execution time in milliseconds"
    },
    "tokens": {
      "type": "object",
      "properties": {
        "input": {
          "type": "integer"
        },
        "output": {
          "type": "integer"
        },
        "total": {
          "type": "integer"
        }
      }
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

## feedback.json

Schema for user feedback collected during review.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "overall_rating": {
      "type": "string",
      "enum": ["excellent", "good", "acceptable", "needs_improvement", "poor"]
    },
    "comments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "eval_id": {
            "type": "integer"
          },
          "run_type": {
            "type": "string",
            "enum": ["baseline", "with_skill"]
          },
          "issue": {
            "type": "string"
          },
          "suggestion": {
            "type": "string"
          },
          "severity": {
            "type": "string",
            "enum": ["critical", "major", "minor", "cosmetic"]
          }
        }
      }
    },
    "approved_iterations": {
      "type": "array",
      "items": {
        "type": "integer"
      },
      "description": "Iterations that were approved"
    }
  }
}
```

## comparison.json

Schema for blind A/B comparison results.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["eval_id", "option_a", "option_b", "winner", "confidence"],
  "properties": {
    "eval_id": {
      "type": "integer"
    },
    "option_a": {
      "$ref": "#/definitions/option"
    },
    "option_b": {
      "$ref": "#/definitions/option"
    },
    "winner": {
      "type": "string",
      "enum": ["a", "b", "tie"],
      "description": "Which option was better"
    },
    "confidence": {
      "type": "string",
      "enum": ["high", "medium", "low"],
      "description": "Confidence in the comparison"
    },
    "reasoning": {
      "type": "string",
      "description": "Why this option was chosen"
    }
  },
  "definitions": {
    "option": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string",
          "description": "Blind label (Option A/Option B)"
        },
        "skill_version": {
          "type": "string",
          "description": "Which version this was"
        },
        "score": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "strengths": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "weaknesses": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

## Validation

To validate a JSON file against these schemas:

```bash
# Using jsonschema (Python)
pip install jsonschema
python -c "
import json
import jsonschema

with open('your-file.json') as f:
    data = json.load(f)

with open('schema.json') as f:
    schema = json.load(f)

jsonschema.validate(data, schema)
print('Valid!')
"

# Using ajv (Node.js)
npm install -g ajv-cli
ajv validate -s schema.json -d your-file.json
```
