#!/bin/bash

# Script to push code to GitHub
echo "Starting GitHub push script..."

# Make sure we're on the right branch
git checkout backup-2025-03-10

# Add all changes
git add .

# Commit any uncommitted changes
git commit -m "Update code for GitHub push" --allow-empty

# Push to GitHub
git push -u origin backup-2025-03-10 --force

echo "Push completed. Check GitHub repository at https://github.com/BarisRahimi123/fresh02" 