#!/bin/bash

# Get current date in YYYY-MM-DD format
today=$(date +"%Y-%m-%d")

# Find files modified today and calculate total size
find . -type f -newermt "$today" -exec du -ch {} + | grep total$