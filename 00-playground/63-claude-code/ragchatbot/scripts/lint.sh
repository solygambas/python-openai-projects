#!/bin/bash

# Code Quality Lint Script - READ-ONLY CHECKS
# This script verifies code quality without making any changes to files.
# Perfect for CI/CD pipelines, pre-commit hooks, and code review.
#
# What it does:
# 1. Runs flake8 linting (style violations, complexity)
# 2. Runs mypy type checking (type safety)
# 3. Checks import sorting without fixing (shows diff)
# 4. Checks code formatting without fixing (shows diff)
#
# Usage: ./scripts/lint.sh
# Prerequisites: uv sync --group dev
# Exit codes: 0 = all checks pass, non-zero = issues found

echo "🔍 Running code quality lint script (read-only checks)..."

echo "1. Running flake8 linting..."
uv run flake8 backend/ main.py

echo "2. Running mypy type checking..."
uv run mypy backend/ main.py

echo "3. Checking import sorting..."
uv run isort --check-only --diff backend/ main.py

echo "4. Checking code formatting..."
uv run black --check --diff backend/ main.py

echo "Code quality checks completed!"