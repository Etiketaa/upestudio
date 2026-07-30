# Analyzer Agent

Analyze benchmark patterns and comparison results to surface insights.

## Purpose

The analyzer agent takes aggregated benchmark data and identifies patterns, improvements, and areas for further optimization. It goes beyond simple pass rates to find meaningful insights.

## Input

- **benchmark.json**: Aggregated benchmark results
- **Previous iterations** (optional): For trend analysis
- **Comparison results** (optional): For A/B insights

## Output

```json
{
  "summary": "Overall assessment",
  "patterns": [
    {
      "type": "improvement",
      "description": "Skill shows consistent improvement across all evals",
      "evidence": "Pass rate increased from 0.6 to 0.85"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "Add gotcha for API rate limiting",
      "reason": "3 evals failed due to rate limit errors"
    }
  ],
  "risks": [
    {
      "type": "regression",
      "description": "Evals 3 and 4 show decreased performance",
      "mitigation": "Review changes between iterations"
    }
  ]
}
```

## Analysis Process

### Step 1: Calculate Key Metrics

```python
def calculate_metrics(benchmark):
    summary = benchmark["summary"]
    
    metrics = {
        "baseline_pass_rate": summary["baseline_pass_rate"],
        "with_skill_pass_rate": summary["with_skill_pass_rate"],
        "improvement": summary["improvement"],
        "total_evals": summary["total_evals"],
        "avg_baseline_tokens": summary["avg_baseline_tokens"],
        "avg_with_skill_tokens": summary["avg_with_skill_tokens"],
        "token_efficiency": summary["avg_with_skill_tokens"] / summary["avg_baseline_tokens"]
    }
    
    return metrics
```

### Step 2: Identify Patterns

Look for patterns in the results:

#### Improvement Patterns
```python
def find_improvement_patterns(evals):
    patterns = []
    
    for eval in evals:
        if eval["with_skill"]["pass_rate"] > eval["baseline"]["pass_rate"]:
            patterns.append({
                "type": "improvement",
                "eval_id": eval["eval_id"],
                "description": f"Eval {eval['eval_id']} improved",
                "evidence": f"Pass rate: {eval['baseline']['pass_rate']} -> {eval['with_skill']['pass_rate']}"
            })
    
    return patterns
```

#### Regression Patterns
```python
def find_regression_patterns(evals):
    patterns = []
    
    for eval in evals:
        if eval["with_skill"]["pass_rate"] < eval["baseline"]["pass_rate"]:
            patterns.append({
                "type": "regression",
                "eval_id": eval["eval_id"],
                "description": f"Eval {eval['eval_id']} regressed",
                "evidence": f"Pass rate: {eval['baseline']['pass_rate']} -> {eval['with_skill']['pass_rate']}"
            })
    
    return patterns
```

#### Consistency Patterns
```python
def find_consistency_patterns(evals):
    patterns = []
    
    pass_rates = [eval["with_skill"]["pass_rate"] for eval in evals]
    avg_rate = sum(pass_rates) / len(pass_rates)
    variance = sum((r - avg_rate) ** 2 for r in pass_rates) / len(pass_rates)
    
    if variance < 0.01:
        patterns.append({
            "type": "consistency",
            "description": "Skill performs consistently across all evals",
            "evidence": f"Variance: {variance:.3f}"
        })
    elif variance > 0.1:
        patterns.append({
            "type": "inconsistency",
            "description": "Skill performance varies significantly across evals",
            "evidence": f"Variance: {variance:.3f}"
        })
    
    return patterns
```

### Step 3: Analyze Token Usage

```python
def analyze_token_usage(metrics):
    insights = []
    
    if metrics["token_efficiency"] < 1.0:
        insights.append({
            "type": "efficiency",
            "description": "Skill uses fewer tokens than baseline",
            "evidence": f"Token ratio: {metrics['token_efficiency']:.2f}"
        })
    elif metrics["token_efficiency"] > 1.5:
        insights.append({
            "type": "overhead",
            "description": "Skill uses significantly more tokens than baseline",
            "evidence": f"Token ratio: {metrics['token_efficiency']:.2f}",
            "recommendation": "Consider optimizing SKILL.md length"
        })
    
    return insights
```

### Step 4: Generate Recommendations

Based on patterns, generate actionable recommendations:

```python
def generate_recommendations(patterns, metrics):
    recommendations = []
    
    # Check for regressions
    regressions = [p for p in patterns if p["type"] == "regression"]
    if regressions:
        recommendations.append({
            "priority": "high",
            "action": "Investigate regressions",
            "reason": f"{len(regressions)} evals showed decreased performance"
        })
    
    # Check for token overhead
    if metrics["token_efficiency"] > 1.5:
        recommendations.append({
            "priority": "medium",
            "action": "Optimize SKILL.md for token efficiency",
            "reason": f"Skill uses {metrics['token_efficiency']:.1f}x more tokens than baseline"
        })
    
    # Check for inconsistency
    inconsistency = [p for p in patterns if p["type"] == "inconsistency"]
    if inconsistency:
        recommendations.append({
            "priority": "medium",
            "action": "Add more gotchas for edge cases",
            "reason": "Performance varies significantly across evals"
        })
    
    return recommendations
```

### Step 5: Identify Risks

```python
def identify_risks(patterns, metrics):
    risks = []
    
    # Regression risk
    regressions = [p for p in patterns if p["type"] == "regression"]
    if regressions:
        risks.append({
            "type": "regression",
            "description": f"{len(regressions)} evals show regression",
            "mitigation": "Review changes and consider rollback"
        })
    
    # Low pass rate risk
    if metrics["with_skill_pass_rate"] < 0.7:
        risks.append({
            "type": "quality",
            "description": "Overall pass rate is below threshold",
            "mitigation": "Focus on fundamental improvements"
        })
    
    # Token budget risk
    if metrics["avg_with_skill_tokens"] > 10000:
        risks.append({
            "type": "cost",
            "description": "High token usage may impact cost",
            "mitigation": "Optimize skill for token efficiency"
        })
    
    return risks
```

### Step 6: Write Analysis

Combine all insights into a coherent analysis:

```python
def write_analysis(benchmark, patterns, recommendations, risks):
    metrics = calculate_metrics(benchmark)
    
    analysis = {
        "summary": write_summary(metrics, patterns),
        "patterns": patterns,
        "recommendations": recommendations,
        "risks": risks,
        "metrics": metrics
    }
    
    return analysis
```

## Trend Analysis

When previous iterations are available:

```python
def analyze_trends(current, previous):
    trends = []
    
    current_metrics = calculate_metrics(current)
    previous_metrics = calculate_metrics(previous)
    
    # Pass rate trend
    rate_change = current_metrics["with_skill_pass_rate"] - previous_metrics["with_skill_pass_rate"]
    if rate_change > 0.1:
        trends.append({
            "type": "improving",
            "metric": "pass_rate",
            "change": rate_change
        })
    elif rate_change < -0.1:
        trends.append({
            "type": "declining",
            "metric": "pass_rate",
            "change": rate_change
        })
    
    # Token usage trend
    token_change = current_metrics["avg_with_skill_tokens"] - previous_metrics["avg_with_skill_tokens"]
    if token_change > 1000:
        trends.append({
            "type": "increasing",
            "metric": "token_usage",
            "change": token_change
        })
    
    return trends
```

## Example Analysis

### Input
benchmark.json with 5 evals, showing improvement from 0.6 to 0.85 pass rate.

### Analysis Output
```json
{
  "summary": "Skill shows strong improvement with 25% pass rate increase. Token usage is reasonable. One eval shows regression that needs investigation.",
  "patterns": [
    {
      "type": "improvement",
      "description": "4 of 5 evals improved with skill",
      "evidence": "Pass rates increased by 0.2-0.4"
    },
    {
      "type": "regression",
      "eval_id": 3,
      "description": "Eval 3 regressed",
      "evidence": "Pass rate: 0.8 -> 0.6"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "Investigate eval 3 regression",
      "reason": "Only regressing eval"
    },
    {
      "priority": "medium",
      "action": "Add gotcha for edge case in eval 3",
      "reason": "May prevent similar regressions"
    }
  ],
  "risks": [
    {
      "type": "regression",
      "description": "Eval 3 shows regression",
      "mitigation": "Review changes and add specific gotcha"
    }
  ]
}
```
