#!/usr/bin/env python3
"""
Generate an HTML review viewer for benchmark results.

Usage:
    python -m eval-viewer.generate_review <iteration-dir> \
        --skill-name "my-skill" \
        --benchmark <benchmark.json> \
        [--previous-workspace <prev-iteration-dir>] \
        [--static <output.html>]

This script:
1. Reads benchmark.json and grading data
2. Generates an interactive HTML viewer
3. Optionally serves it on a local port
4. Or generates a static HTML file
"""

import argparse
import json
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Optional
import threading


def load_json(file_path: Path) -> dict | None:
    """Load a JSON file."""
    if not file_path.exists():
        return None
    with open(file_path) as f:
        return json.load(f)


def generate_html(
    benchmark: dict,
    skill_name: str,
    previous_benchmark: Optional[dict] = None
) -> str:
    """Generate HTML viewer."""
    
    summary = benchmark.get("summary", {})
    evals = benchmark.get("evals", [])
    
    # Calculate comparison metrics
    comparison_data = None
    if previous_benchmark:
        prev_summary = previous_benchmark.get("summary", {})
        comparison_data = {
            "prev_pass_rate": prev_summary.get("with_skill_pass_rate", 0),
            "curr_pass_rate": summary.get("with_skill_pass_rate", 0),
            "change": summary.get("with_skill_pass_rate", 0) - prev_summary.get("with_skill_pass_rate", 0)
        }
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skill Benchmark Review - {skill_name}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        header {{
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2c3e50;
            margin-bottom: 10px;
        }}
        .summary-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}
        .summary-card {{
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }}
        .summary-card h3 {{
            color: #666;
            font-size: 0.9em;
            margin-bottom: 5px;
        }}
        .summary-card .value {{
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }}
        .summary-card.positive .value {{
            color: #27ae60;
        }}
        .summary-card.negative .value {{
            color: #e74c3c;
        }}
        .eval-list {{
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .eval-item {{
            padding: 20px;
            border-bottom: 1px solid #eee;
        }}
        .eval-item:last-child {{
            border-bottom: none;
        }}
        .eval-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }}
        .eval-id {{
            background: #3498db;
            color: #fff;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }}
        .eval-prompt {{
            color: #666;
            font-style: italic;
        }}
        .eval-scores {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 10px;
        }}
        .score-box {{
            padding: 10px;
            border-radius: 4px;
            background: #f8f9fa;
        }}
        .score-box h4 {{
            font-size: 0.85em;
            color: #666;
            margin-bottom: 5px;
        }}
        .score-bar {{
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
        }}
        .score-fill {{
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }}
        .score-fill.baseline {{
            background: #95a5a6;
        }}
        .score-fill.with-skill {{
            background: #3498db;
        }}
        .score-value {{
            margin-top: 5px;
            font-weight: bold;
        }}
        .comparison {{
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 20px;
        }}
        .comparison h2 {{
            margin-bottom: 15px;
            color: #2c3e50;
        }}
        .change-positive {{
            color: #27ae60;
        }}
        .change-negative {{
            color: #e74c3c;
        }}
        .expectations {{
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }}
        .expectation {{
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }}
        .expectation:last-child {{
            border-bottom: none;
        }}
        .expectation.passed {{
            color: #27ae60;
        }}
        .expectation.failed {{
            color: #e74c3c;
        }}
        .controls {{
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
        }}
        .btn {{
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
        }}
        .btn-primary {{
            background: #3498db;
            color: #fff;
        }}
        .btn-secondary {{
            background: #95a5a6;
            color: #fff;
        }}
        #feedback-form {{
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1000;
            max-width: 500px;
            width: 90%;
        }}
        #feedback-form.active {{
            display: block;
        }}
        .form-group {{
            margin-bottom: 15px;
        }}
        .form-group label {{
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }}
        .form-group textarea {{
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            min-height: 100px;
        }}
        .overlay {{
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        }}
        .overlay.active {{
            display: block;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Skill Benchmark Review</h1>
            <p>Skill: <strong>{skill_name}</strong> | Iteration: {benchmark.get('iteration', 'N/A')}</p>
            <p>Generated: {benchmark.get('created_at', 'N/A')}</p>
        </header>
        
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Evals</h3>
                <div class="value">{summary.get('total_evals', 0)}</div>
            </div>
            <div class="summary-card {'positive' if summary.get('improvement', 0) > 0 else 'negative' if summary.get('improvement', 0) < 0 else ''}">
                <h3>Improvement</h3>
                <div class="value">{summary.get('improvement', 0):+.1%}</div>
            </div>
            <div class="summary-card">
                <h3>Baseline Pass Rate</h3>
                <div class="value">{summary.get('baseline_pass_rate', 0):.1%}</div>
            </div>
            <div class="summary-card">
                <h3>With Skill Pass Rate</h3>
                <div class="value">{summary.get('with_skill_pass_rate', 0):.1%}</div>
            </div>
        </div>
        
        <div class="eval-list">
            <h2 style="padding: 20px; border-bottom: 1px solid #eee;">Eval Results</h2>
"""
    
    # Add each eval
    for eval_data in evals:
        baseline = eval_data.get("baseline", {})
        with_skill = eval_data.get("with_skill", {})
        
        html += f"""
            <div class="eval-item">
                <div class="eval-header">
                    <span class="eval-id">#{eval_data.get('eval_id', 'N/A')}</span>
                    <span class="eval-prompt">{eval_data.get('prompt', 'N/A')[:100]}...</span>
                </div>
                <div class="eval-scores">
                    <div class="score-box">
                        <h4>Baseline</h4>
                        <div class="score-bar">
                            <div class="score-fill baseline" style="width: {baseline.get('pass_rate', 0) * 100}%"></div>
                        </div>
                        <div class="score-value">{baseline.get('pass_rate', 0):.1%}</div>
                    </div>
                    <div class="score-box">
                        <h4>With Skill</h4>
                        <div class="score-bar">
                            <div class="score-fill with-skill" style="width: {with_skill.get('pass_rate', 0) * 100}%"></div>
                        </div>
                        <div class="score-value">{with_skill.get('pass_rate', 0):.1%}</div>
                    </div>
                </div>
            </div>
"""
    
    html += """
        </div>
"""
    
    # Add comparison section if we have previous benchmark
    if comparison_data:
        change_class = "change-positive" if comparison_data["change"] > 0 else "change-negative" if comparison_data["change"] < 0 else ""
        html += f"""
        <div class="comparison">
            <h2>Comparison with Previous Iteration</h2>
            <p>Previous pass rate: {comparison_data['prev_pass_rate']:.1%}</p>
            <p>Current pass rate: {comparison_data['curr_pass_rate']:.1%}</p>
            <p class="{change_class}">Change: {comparison_data['change']:+.1%}</p>
        </div>
"""
    
    html += """
    </div>
    
    <div class="controls">
        <button class="btn btn-primary" onclick="openFeedback()">Submit Feedback</button>
        <button class="btn btn-secondary" onclick="downloadFeedback()">Download Feedback</button>
    </div>
    
    <div class="overlay" id="overlay" onclick="closeFeedback()"></div>
    <div id="feedback-form">
        <h2>Submit Feedback</h2>
        <div class="form-group">
            <label>Overall Rating</label>
            <select id="rating" style="width: 100%; padding: 10px;">
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="acceptable">Acceptable</option>
                <option value="needs_improvement">Needs Improvement</option>
                <option value="poor">Poor</option>
            </select>
        </div>
        <div class="form-group">
            <label>Comments</label>
            <textarea id="comments" placeholder="Enter your feedback..."></textarea>
        </div>
        <button class="btn btn-primary" onclick="submitFeedback()">Submit</button>
        <button class="btn btn-secondary" onclick="closeFeedback()">Cancel</button>
    </div>
    
    <script>
        function openFeedback() {
            document.getElementById('feedback-form').classList.add('active');
            document.getElementById('overlay').classList.add('active');
        }
        
        function closeFeedback() {
            document.getElementById('feedback-form').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
        }
        
        function submitFeedback() {
            const feedback = {
                rating: document.getElementById('rating').value,
                comments: document.getElementById('comments').value,
                timestamp: new Date().toISOString()
            };
            
            // Store in localStorage for now
            const feedbacks = JSON.parse(localStorage.getItem('skill_feedback') || '[]');
            feedbacks.push(feedback);
            localStorage.setItem('skill_feedback', JSON.stringify(feedbacks));
            
            alert('Feedback submitted!');
            closeFeedback();
        }
        
        function downloadFeedback() {
            const feedbacks = JSON.parse(localStorage.getItem('skill_feedback') || '[]');
            const blob = new Blob([JSON.stringify(feedbacks, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'feedback.json';
            a.click();
        }
    </script>
</body>
</html>
"""
    
    return html


def serve_html(html: str, port: int = 8080):
    """Serve the HTML on a local port."""
    
    # Write to a temp file
    temp_path = Path("/tmp/skill-review.html")
    temp_path.write_text(html)
    
    print(f"Serving review at http://localhost:{port}")
    print("Press Ctrl+C to stop")
    
    # Simple HTTP server
    os.chdir("/tmp")
    
    handler = SimpleHTTPRequestHandler
    httpd = HTTPServer(("", port), handler)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")


def main():
    parser = argparse.ArgumentParser(description="Generate skill review viewer")
    parser.add_argument("iteration_dir", help="Path to iteration directory")
    parser.add_argument("--skill-name", required=True, help="Skill name")
    parser.add_argument("--benchmark", help="Path to benchmark.json")
    parser.add_argument("--previous-workspace", help="Previous iteration directory")
    parser.add_argument("--static", help="Generate static HTML file")
    parser.add_argument("--port", type=int, default=8080, help="Port for serving")
    
    args = parser.parse_args()
    
    iteration_dir = Path(args.iteration_dir).resolve()
    
    # Load benchmark
    benchmark_path = Path(args.benchmark) if args.benchmark else iteration_dir / "benchmark.json"
    benchmark = load_json(benchmark_path)
    
    if not benchmark:
        print(f"Error: Benchmark not found: {benchmark_path}", file=sys.stderr)
        sys.exit(1)
    
    # Load previous benchmark if provided
    previous_benchmark = None
    if args.previous_workspace:
        prev_path = Path(args.previous_workspace).resolve() / "benchmark.json"
        previous_benchmark = load_json(prev_path)
    
    # Generate HTML
    html = generate_html(benchmark, args.skill_name, previous_benchmark)
    
    # Output
    if args.static:
        output_path = Path(args.static).resolve()
        output_path.write_text(html)
        print(f"Static HTML saved to: {output_path}")
    else:
        serve_html(html, args.port)


if __name__ == "__main__":
    main()
