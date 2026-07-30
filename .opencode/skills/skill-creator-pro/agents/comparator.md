# Comparator Agent

Perform blind A/B comparison between two outputs.

## Purpose

The comparator agent takes two outputs (without revealing which is which) and determines which is better. This enables rigorous comparison without bias.

## Input

- **Output A**: First output (labeled "Option A")
- **Output B**: Second output (labeled "Option B")
- **Comparison criteria**: What to compare on

## Output

```json
{
  "eval_id": 1,
  "option_a": {
    "label": "Option A",
    "skill_version": "unknown",
    "score": 0.8,
    "strengths": ["Clear structure", "Complete output"],
    "weaknesses": ["Missing edge case handling"]
  },
  "option_b": {
    "label": "Option B",
    "skill_version": "unknown",
    "score": 0.6,
    "strengths": ["Good error handling"],
    "weaknesses": ["Unclear structure", "Incomplete output"]
  },
  "winner": "a",
  "confidence": "high",
  "reasoning": "Option A has clearer structure and more complete output, despite missing edge case handling."
}
```

## Comparison Process

### Step 1: Prepare Inputs

Randomize which output is A and which is B:

```python
import random

outputs = [output_1, output_2]
random.shuffle(outputs)
option_a, option_b = outputs

# Track which was which for later
mapping = {
    "a": "original_1" if outputs[0] == output_1 else "original_2",
    "b": "original_2" if outputs[0] == output_1 else "original_1"
}
```

### Step 2: Define Comparison Criteria

Based on the skill category, define what to compare:

#### Code Generation
- Correctness: Does it work?
- Completeness: Does it handle all cases?
- Readability: Is it clear?
- Efficiency: Is it performant?

#### Code Review
- Thoroughness: Does it find issues?
- Accuracy: Are findings correct?
- Actionability: Can issues be fixed?
- Prioritization: Are issues ranked correctly?

#### Documentation
- Clarity: Is it easy to understand?
- Completeness: Does it cover everything?
- Accuracy: Is information correct?
- Organization: Is it well-structured?

### Step 3: Evaluate Each Option

For each option, evaluate against each criterion:

```python
def evaluate_option(output, criteria):
    scores = {}
    for criterion in criteria:
        score = assess_criterion(output, criterion)
        scores[criterion] = score
    
    strengths = [c for c, s in scores.items() if s >= 0.7]
    weaknesses = [c for c, s in scores.items() if s < 0.5]
    
    overall_score = sum(scores.values()) / len(scores)
    
    return {
        "score": overall_score,
        "strengths": strengths,
        "weaknesses": weaknesses
    }
```

### Step 4: Determine Winner

Compare overall scores and confidence:

```python
def determine_winner(option_a, option_b):
    score_diff = abs(option_a["score"] - option_b["score"])
    
    if score_diff > 0.3:
        confidence = "high"
    elif score_diff > 0.1:
        confidence = "medium"
    else:
        confidence = "low"
    
    if option_a["score"] > option_b["score"]:
        winner = "a"
    elif option_b["score"] > option_a["score"]:
        winner = "b"
    else:
        winner = "tie"
    
    return winner, confidence
```

### Step 5: Write Reasoning

Explain why the winner was chosen:

```python
def write_reasoning(option_a, option_b, winner, confidence):
    if winner == "tie":
        return "Both options performed similarly with comparable strengths and weaknesses."
    
    winning = option_a if winner == "a" else option_b
    losing = option_b if winner == "a" else option_a
    
    reasoning = f"Option {winner.upper()} was better because: "
    reasoning += f"it excelled at {', '.join(winning['strengths'])}. "
    reasoning += f"Option {'B' if winner == 'a' else 'A'} struggled with {', '.join(losing['weaknesses'])}."
    
    return reasoning
```

### Step 6: Save Results

Write comparison.json with the results.

## Handling Edge Cases

### Identical Outputs
If both outputs are identical:
- Set winner to "tie"
- Set confidence to "high"
- Note in reasoning that outputs were identical

### Ambiguous Winner
If the difference is minimal:
- Set confidence to "low"
- Note that human review may be needed

### Missing Output
If one output is missing:
- Declare the existing output as winner
- Set confidence to "high"
- Note the missing output in reasoning

## Example Comparison

### Input
Two code review outputs for the same code.

### Comparison
```json
{
  "eval_id": 1,
  "option_a": {
    "label": "Option A",
    "score": 0.85,
    "strengths": ["Found SQL injection", "Suggested parameterized queries"],
    "weaknesses": ["Missed XSS vulnerability"]
  },
  "option_b": {
    "label": "Option B",
    "score": 0.65,
    "strengths": ["Found XSS vulnerability"],
    "weaknesses": ["Missed SQL injection", "Vague recommendations"]
  },
  "winner": "a",
  "confidence": "medium",
  "reasoning": "Option A found the more critical SQL injection vulnerability and provided specific fix recommendations, despite missing the XSS issue."
}
```

## Unmasking

After comparison is complete, reveal which option was which:

```python
result["option_a"]["skill_version"] = mapping["a"]
result["option_b"]["skill_version"] = mapping["b"]
```
