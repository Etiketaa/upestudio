# Skill Categories Reference

Detailed guide for each of the 9 skill categories with templates, examples, and improvement patterns.

## Category 1: Library & API Reference

**Signature**: Reference snippets + gotchas list

**When to use**: Teaching Claude how to use a specific library, API, or SDK correctly.

**Template structure**:
```markdown
# Library Name Skill

## Quick Start
[Minimal working example]

## Core Concepts
[2-3 key concepts Claude must understand]

## Common Patterns
[Most frequent usage patterns with code]

## Gotchas
- [Library-specific pitfall 1]
- [Library-specific pitfall 2]
- [Library-specific pitfall 3]

## API Reference
[Link to detailed reference or inline snippets]
```

**Example**: A skill for using the Stripe API

**Improvement patterns**:
- Add gotchas as you discover them through testing
- Include version-specific notes if the library has breaking changes
- Link to official docs for comprehensive reference

## Category 2: Product Verification

**Signature**: External tool pairing + programmatic assertions

**When to use**: Testing or verifying that a product/service works correctly.

**Template structure**:
```markdown
# Product Verification Skill

## Prerequisites
[Required tools, credentials, setup]

## Test Scenarios
### Happy Path
[Steps and expected outcomes]

### Edge Cases
[Boundary conditions to test]

## Assertions
[Programmatic checks to verify]

## Reporting
[How to format and share results]
```

**Example**: A skill for verifying Stripe webhook integration

**Improvement patterns**:
- Add more assertion types as failure modes are discovered
- Include rollback procedures for destructive tests
- Create scripts for common verification sequences

## Category 3: Data Fetching & Analysis

**Signature**: Credential helpers + dashboard IDs + workflows

**When to use**: Fetching data from APIs, databases, or services and analyzing it.

**Template structure**:
```markdown
# Data Fetching Skill

## Authentication
[How to obtain and use credentials]

## Data Sources
[APIs, databases, or services to query]

## Fetching Patterns
[Common query patterns and workflows]

## Analysis
[How to process and interpret the data]

## Caching
[Optional: how to cache responses]
```

**Example**: A skill for fetching and analyzing GitHub repository metrics

**Improvement patterns**:
- Add rate limiting guidance
- Include pagination patterns
- Create dashboard templates for common analyses

## Category 4: Business Process & Team Automation

**Signature**: Simple instructions + log-based consistency

**When to use**: Automating repetitive business processes or team workflows.

**Template structure**:
```markdown
# Business Process Skill

## Trigger
[When this process should be invoked]

## Steps
1. [Step 1 with clear outcome]
2. [Step 2 with clear outcome]
3. [Continue...]

## Stakeholders
[Who is involved and their roles]

## Logging
[How to record that this process ran]

## Exceptions
[What to do when things go wrong]
```

**Example**: A skill for onboarding new team members

**Improvement patterns**:
- Add approval gates where needed
- Include notification patterns
- Create checklists for complex processes

## Category 5: Code Scaffolding & Templates

**Signature**: Composable scripts + natural-language requirements

**When to use**: Generating code, projects, or files from templates.

**Template structure**:
```markdown
# Scaffolding Skill

## Input Format
[What information is needed to generate]

## Templates
[Available templates and when to use each]

## Generation Rules
[Constraints and conventions to follow]

## Customization
[How to modify generated output]

## Validation
[How to verify generated code is correct]
```

**Example**: A skill for scaffolding React component projects

**Improvement patterns**:
- Add more template variants
- Include testing scaffolds
- Create customization hooks

## Category 6: Code Quality & Review

**Signature**: Deterministic scripts + hooks/CI integration

**When to use**: Reviewing code for quality, security, or style issues.

**Template structure**:
```markdown
# Code Review Skill

## Review Criteria
[What to check for]

## Automated Checks
[Scripts or tools to run]

## Manual Review
[What requires human judgment]

## Reporting
[How to format findings]

## Fix Suggestions
[Common fixes for common issues]
```

**Example**: A skill for reviewing Python code for security issues

**Improvement patterns**:
- Add more check patterns
- Include severity levels
- Create fix suggestion templates

## Category 7: CI/CD & Deployment

**Signature**: Multi-skill composition + error-rate monitoring

**When to use**: Managing continuous integration, deployment, or delivery pipelines.

**Template structure**:
```markdown
# CI/CD Skill

## Pipeline Overview
[What the pipeline does]

## Stages
[Each stage and its purpose]

## Triggers
[What initiates each stage]

## Rollback
[How to undo deployments]

## Monitoring
[How to verify deployment success]
```

**Example**: A skill for deploying to AWS Lambda

**Improvement patterns**:
- Add more deployment strategies
- Include health check patterns
- Create monitoring dashboards

## Category 8: Runbooks

**Signature**: Symptom-to-report investigation flows

**When to use**: Diagnosing and resolving issues systematically.

**Template structure**:
```markdown
# Runbook Skill

## Symptoms
[What the user might observe]

## Diagnosis
[How to identify the root cause]

## Resolution
[Steps to fix the issue]

## Prevention
[How to avoid this in the future]

## Escalation
[When to involve others]
```

**Example**: A skill for diagnosing database connection issues

**Improvement patterns**:
- Add more symptoms and their causes
- Include diagnostic scripts
- Create escalation matrices

## Category 9: Infrastructure Operations

**Signature**: Destructive-action guardrails + confirmation gates

**When to use**: Managing infrastructure with safety guardrails.

**Template structure**:
```markdown
# Infrastructure Skill

## Operations
[What operations are available]

## Safety Guardrails
[What protections are in place]

## Confirmation Gates
[When user confirmation is required]

## Rollback Procedures
[How to undo changes]

## Audit Trail
[How changes are logged]
```

**Example**: A skill for managing Kubernetes deployments

**Improvement patterns**:
- Add more guardrails
- Include backup procedures
- Create approval workflows

## Cross-Category Patterns

### Capability Uplift Skills
These teach Claude something it doesn't know by default. They need:
- Clear before/after comparison
- Regression detection tests
- Version compatibility notes

### Encoded Preference Skills
These document established workflows. They need:
- Workflow fidelity tests
- Step-by-step verification
- Consistency checks

### Hybrid Skills
Some skills span categories. When this happens:
1. Identify the primary category
2. Split into multiple skills if the secondary category is significant
3. Use composition (one skill calling another) for complex workflows
