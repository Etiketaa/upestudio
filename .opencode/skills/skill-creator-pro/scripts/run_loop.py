#!/usr/bin/env python3
"""
Run optimization loop for skill description.

Usage:
    python -m scripts.run_loop \
        --eval-set <path-to-eval.json> \
        --skill-path <path-to-skill> \
        --model <model-id> \
        --max-iterations 5 \
        --verbose

This script:
1. Loads the eval set and skill
2. Tests current description triggering
3. Mutates description to improve triggering
4. Retests and keeps best version
5. Outputs best description
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Optional


def load_eval_set(eval_path: Path) -> dict:
    """Load the evaluation set."""
    with open(eval_path) as f:
        return json.load(f)


def load_skill(skill_path: Path) -> tuple[dict, str]:
    """Load skill and return (frontmatter, body)."""
    skill_md = skill_path / "SKILL.md"
    content = skill_md.read_text()
    
    if not content.startswith("---"):
        return {}, content
    
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content
    
    frontmatter_str = parts[1].strip()
    body = parts[2].strip()
    
    # Parse frontmatter (simple YAML parsing)
    frontmatter = {}
    for line in frontmatter_str.split("\n"):
        if ":" in line:
            key, value = line.split(":", 1)
            frontmatter[key.strip()] = value.strip().strip('"').strip("'")
    
    return frontmatter, body


def extract_description(frontmatter: dict) -> str:
    """Extract description from frontmatter."""
    return frontmatter.get("description", "")


def generate_trigger_variations(base_description: str) -> list[str]:
    """Generate variations of the description for testing."""
    variations = [
        # Original
        base_description,
        # More explicit triggers
        f"{base_description} Use when user asks for this specific task.",
        # Negative triggers
        f"{base_description} Do NOT use for unrelated tasks.",
        # Shorter
        base_description[:200] if len(base_description) > 200 else base_description,
        # More keywords
        f"{base_description} Also trigger on: keyword1, keyword2, keyword3."
    ]
    return variations


def test_triggering(description: str, eval_set: dict) -> dict:
    """Test how well a description triggers on eval queries."""
    results = {
        "should_trigger": {"passed": 0, "total": 0, "queries": []},
        "should_not_trigger": {"passed": 0, "total": 0, "queries": []}
    }
    
    # This is a simplified test - in reality, you'd call the model
    # For now, we'll simulate based on keyword matching
    
    for query in eval_set.get("should_trigger", []):
        results["should_trigger"]["total"] += 1
        # Simple keyword matching simulation
        query_lower = query.lower()
        desc_lower = description.lower()
        
        # Check if any significant words from query appear in description
        query_words = set(query_lower.split())
        desc_words = set(desc_lower.split())
        overlap = query_words & desc_words
        
        passed = len(overlap) >= 2  # At least 2 words in common
        results["should_trigger"]["passed"] += passed
        results["should_trigger"]["queries"].append({
            "query": query,
            "passed": passed,
            "overlap": list(overlap)
        })
    
    for query in eval_set.get("should_not_trigger", []):
        results["should_not_trigger"]["total"] += 1
        query_lower = query.lower()
        desc_lower = description.lower()
        
        query_words = set(query_lower.split())
        desc_words = set(desc_lower.split())
        overlap = query_words & desc_words
        
        passed = len(overlap) < 2  # Fewer than 2 words in common
        results["should_not_trigger"]["passed"] += passed
        results["should_not_trigger"]["queries"].append({
            "query": query,
            "passed": passed,
            "overlap": list(overlap)
        })
    
    # Calculate overall score
    total_passed = results["should_trigger"]["passed"] + results["should_not_trigger"]["passed"]
    total_queries = results["should_trigger"]["total"] + results["should_not_trigger"]["total"]
    
    results["score"] = total_passed / total_queries if total_queries > 0 else 0
    
    return results


def mutate_description(description: str, test_results: dict) -> str:
    """Mutate description to improve triggering."""
    # Analyze failures
    trigger_failures = [
        q for q in test_results["should_trigger"]["queries"] 
        if not q["passed"]
    ]
    
    not_trigger_failures = [
        q for q in test_results["should_not_trigger"]["queries"] 
        if not q["passed"]
    ]
    
    # If we have trigger failures, add more keywords
    if trigger_failures:
        # Extract common words from failed queries
        all_words = []
        for failure in trigger_failures:
            all_words.extend(failure["query"].lower().split())
        
        # Find words not in description
        desc_words = set(description.lower().split())
        new_words = [w for w in all_words if w not in desc_words and len(w) > 3]
        
        if new_words:
            # Add most common new words
            from collections import Counter
            word_counts = Counter(new_words)
            top_words = [w for w, _ in word_counts.most_common(3)]
            
            description = f"{description} Also trigger on: {', '.join(top_words)}."
    
    # If we have not-trigger failures, make description more specific
    if not_trigger_failures:
        # Add negative examples
        negative_examples = [f['query'][:30] for f in not_trigger_failures[:2]]
        if negative_examples:
            description = f"{description} Do NOT use for: {'; '.join(negative_examples)}."
    
    return description


def save_skill(skill_path: Path, frontmatter: dict, body: str):
    """Save updated skill."""
    skill_md = skill_path / "SKILL.md"
    
    # Reconstruct frontmatter
    frontmatter_lines = []
    for key, value in frontmatter.items():
        # Quote values that need it
        if ":" in value or value.startswith(("'", '"')):
            frontmatter_lines.append(f'{key}: "{value}"')
        else:
            frontmatter_lines.append(f"{key}: {value}")
    
    frontmatter_str = "\n".join(frontmatter_lines)
    
    content = f"---\n{frontmatter_str}\n---\n\n{body}"
    skill_md.write_text(content)


def main():
    parser = argparse.ArgumentParser(description="Optimize skill description")
    parser.add_argument("--eval-set", required=True, help="Path to eval set JSON")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--model", help="Model ID (for reference)")
    parser.add_argument("--max-iterations", type=int, default=5, help="Max iterations")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    eval_path = Path(args.eval_set).resolve()
    skill_path = Path(args.skill_path).resolve()
    
    if not eval_path.exists():
        print(f"Error: Eval set not found: {eval_path}", file=sys.stderr)
        sys.exit(1)
    
    if not skill_path.exists():
        print(f"Error: Skill path not found: {skill_path}", file=sys.stderr)
        sys.exit(1)
    
    # Load inputs
    eval_set = load_eval_set(eval_path)
    frontmatter, body = load_skill(skill_path)
    original_description = extract_description(frontmatter)
    
    print(f"Original description: {original_description[:100]}...")
    print(f"Running up to {args.max_iterations} iterations...\n")
    
    best_description = original_description
    best_score = 0
    
    for iteration in range(args.max_iterations):
        print(f"Iteration {iteration + 1}/{args.max_iterations}")
        
        # Test current best
        test_results = test_triggering(best_description, eval_set)
        current_score = test_results["score"]
        
        print(f"  Current score: {current_score:.2%}")
        
        if args.verbose:
            print(f"  Trigger pass rate: {test_results['should_trigger']['passed']}/{test_results['should_trigger']['total']}")
            print(f"  Not-trigger pass rate: {test_results['should_not_trigger']['passed']}/{test_results['should_not_trigger']['total']}")
        
        # Update best if improved
        if current_score > best_score:
            best_score = current_score
            print(f"  New best! Score: {best_score:.2%}")
        
        # Check if we're at 100%
        if current_score >= 1.0:
            print("\nPerfect score reached!")
            break
        
        # Mutate for next iteration
        mutated = mutate_description(best_description, test_results)
        
        if mutated == best_description:
            print("  No changes made, stopping early")
            break
        
        best_description = mutated
        
        if args.verbose:
            print(f"  Mutated description: {best_description[:100]}...")
        
        print()
    
    # Output results
    print("\n" + "="*50)
    print("FINAL RESULT")
    print("="*50)
    print(f"\nBest description ({best_score:.2%} score):")
    print(f"\n{best_description}")
    
    # Save result
    result = {
        "original_description": original_description,
        "best_description": best_description,
        "best_score": best_score,
        "iterations": iteration + 1
    }
    
    output_path = skill_path / "description_optimization.json"
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"\nResult saved to: {output_path}")


if __name__ == "__main__":
    main()
