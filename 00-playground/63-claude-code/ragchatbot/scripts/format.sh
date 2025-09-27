#!/bin/bash

# Code Quality Format Script - MODIFIES FILES
# This script automatically fixes code style issues and runs quality checks.
# Use this when you want to clean up your code automatically.
#
# What it does:
# 1. Sorts import statements (modifies files)
# 2. Formats code style with Black (modifies files) 
# 3. Runs flake8 linting (reports remaining issues)
# 4. Runs mypy type checking (reports type issues)
#
# Usage: ./scripts/format.sh
# Prerequisites: uv sync --group dev

echo "🔧 Running code quality format script (will modify files)..."

echo "1. Sorting imports with isort..."
uv run isort backend/ main.py

echo "2. Formatting code with Black..."
uv run black backend/ main.py

echo "3. Running flake8 linting..."
uv run flake8 backend/ main.py

echo "4. Running mypy type checking..."
uv run mypy backend/ main.py

echo "Code quality checks completed!"