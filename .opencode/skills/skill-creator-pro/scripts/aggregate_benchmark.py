#!/usr/bin/env python3
"""
Aggregate benchmark results from individual eval runs.

Usage:
    python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>

This script:
1. Reads all eval_metadata.json and grading.json files
2. Reads timing.json files
3. Aggregates results into benchmark.json
4. Calculates summary statistics
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path


def load_json(file_path: Path) -> dict | None:
    """Load a JSON file, returning None if it doesn't exist."""
    if not file_path.exists():
        return None
    with open(file_path) as f:
        return json.load(f)


def collect_eval_results(iteration_dir: Path) -> list[dict]:
    """Collect results from all eval directories."""
    results = []
    
    for eval_dir in iteration_dir.iterdir():
        if not eval_dir.is_dir():
            continue
        
        metadata = load_json(eval_dir / "eval_metadata.json")
        grading = load_json(eval_dir / "grading.json")
        timing = load_json(eval_dir / "timing.json")
        
        if metadata and grading:
            result = {
                "eval_id": metadata["eval_id"],
                "eval_name": metadata.get("eval_name", ""),
                "prompt": metadata["prompt"],
                "baseline": None,
                "with_skill": None
            }
            
            # Process grading results
            if grading.get("run_type") == "baseline":
                result["baseline"] = {
                    "pass_rate": grading["score"],
                    "passed_assertions": sum(1 for e in grading["expectations"] if e["passed"]),
                    "total_assertions": len(grading["expectations"])
                }
            elif grading.get("run_type") == "with_skill":
                result["with_skill"] = {
                    "pass_rate": grading["score"],
                    "passed_assertions": sum(1 for e in grading["expectations"] if e["passed"]),
                    "total_assertions": len(grading["expectations"])
                }
            
            # Add timing data
            if timing:
                if timing.get("run_type") == "baseline":
                    if result["baseline"]:
                        result["baseline"]["duration_ms"] = timing.get("duration_ms")
                        result["baseline"]["tokens"] = timing.get("tokens", {}).get("total")
                elif timing.get("run_type") == "with_skill":
                    if result["with_skill"]:
                        result["with_skill"]["duration_ms"] = timing.get("duration_ms")
                        result["with_skill"]["tokens"] = timing.get("tokens", {}).get("total")
            
            results.append(result)
    
    return results


def merge_eval_results(results: list[dict]) -> list[dict]:
    """Merge baseline and with_skill results for the same eval."""
    merged = {}
    
    for result in results:
        eval_id = result["eval_id"]
        if eval_id not in merged:
            merged[eval_id] = result
        else:
            # Merge with_skill if we have it
            if result.get("with_skill"):
                merged[eval_id]["with_skill"] = result["with_skill"]
            # Merge baseline if we have it
            if result.get("baseline"):
                merged[eval_id]["baseline"] = result["baseline"]
    
    return list(merged.values())


def calculate_summary(results: list[dict]) -> dict:
    """Calculate summary statistics."""
    baseline_pass_rates = []
    with_skill_pass_rates = []
    baseline_tokens = []
    with_skill_tokens = []
    baseline_durations = []
    with_skill_durations = []
    
    for result in results:
        if result.get("baseline"):
            baseline_pass_rates.append(result["baseline"]["pass_rate"])
            if result["baseline"].get("tokens"):
                baseline_tokens.append(result["baseline"]["tokens"])
            if result["baseline"].get("duration_ms"):
                baseline_durations.append(result["baseline"]["duration_ms"])
        
        if result.get("with_skill"):
            with_skill_pass_rates.append(result["with_skill"]["pass_rate"])
            if result["with_skill"].get("tokens"):
                with_skill_tokens.append(result["with_skill"]["tokens"])
            if result["with_skill"].get("duration_ms"):
                with_skill_durations.append(result["with_skill"]["duration_ms"])
    
    summary = {
        "total_evals": len(results),
        "baseline_pass_rate": sum(baseline_pass_rates) / len(baseline_pass_rates) if baseline_pass_rates else 0,
        "with_skill_pass_rate": sum(with_skill_pass_rates) / len(with_skill_pass_rates) if with_skill_pass_rates else 0,
        "avg_baseline_tokens": int(sum(baseline_tokens) / len(baseline_tokens)) if baseline_tokens else 0,
        "avg_with_skill_tokens": int(sum(with_skill_tokens) / len(with_skill_tokens)) if with_skill_tokens else 0,
        "avg_baseline_duration_ms": int(sum(baseline_durations) / len(baseline_durations)) if baseline_durations else 0,
        "avg_with_skill_duration_ms": int(sum(with_skill_durations) / len(with_skill_durations)) if with_skill_durations else 0
    }
    
    summary["improvement"] = summary["with_skill_pass_rate"] - summary["baseline_pass_rate"]
    
    return summary


def main():
    parser = argparse.ArgumentParser(description="Aggregate benchmark results")
    parser.add_argument("iteration_dir", help="Path to iteration directory")
    parser.add_argument("--skill-name", required=True, help="Name of the skill")
    
    args = parser.parse_args()
    
    iteration_dir = Path(args.iteration_dir).resolve()
    
    if not iteration_dir.exists():
        print(f"Error: Directory does not exist: {iteration_dir}", file=sys.stderr)
        sys.exit(1)
    
    # Extract iteration number from directory name
    dir_name = iteration_dir.name
    iteration_match = dir_name.replace("iteration-", "")
    try:
        iteration = int(iteration_match)
    except ValueError:
        print(f"Error: Cannot determine iteration number from: {dir_name}", file=sys.stderr)
        sys.exit(1)
    
    # Collect results
    print(f"Collecting results from {iteration_dir}...")
    results = collect_eval_results(iteration_dir)
    
    if not results:
        print("Error: No eval results found", file=sys.stderr)
        sys.exit(1)
    
    # Merge results
    results = merge_eval_results(results)
    
    # Calculate summary
    summary = calculate_summary(results)
    
    # Create benchmark
    benchmark = {
        "skill_name": args.skill_name,
        "iteration": iteration,
        "created_at": datetime.now().isoformat(),
        "summary": summary,
        "evals": results
    }
    
    # Save benchmark
    output_path = iteration_dir / "benchmark.json"
    with open(output_path, "w") as f:
        json.dump(benchmark, f, indent=2)
    
    print(f"\nBenchmark saved to: {output_path}")
    print(f"\nSummary:")
    print(f"  Total evals: {summary['total_evals']}")
    print(f"  Baseline pass rate: {summary['baseline_pass_rate']:.2%}")
    print(f"  With skill pass rate: {summary['with_skill_pass_rate']:.2%}")
    print(f"  Improvement: {summary['improvement']:+.2%}")


if __name__ == "__main__":
    main()
