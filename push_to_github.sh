#!/bin/bash
# Script to push project to GitHub
# Usage: ./push_to_github.sh

echo "========================================="
echo "Pushing to GitHub Repository"
echo "========================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Show current commits
echo "📊 Commits ready to push:"
git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline | head -10
echo ""

# Count commits
COMMIT_COUNT=$(git log --oneline origin/main..HEAD 2>/dev/null | wc -l)
if [ "$COMMIT_COUNT" -eq 0 ]; then
    COMMIT_COUNT=$(git log --oneline | wc -l)
fi

echo "✅ Total commits: $COMMIT_COUNT"
echo ""

# Push to GitHub
echo "🚀 Pushing to GitHub..."
echo "Repository: https://github.com/riazaslam029/Personal-AI-Study-Coach-Kiro"
echo ""

# Try push with better output
git push -u origin main --verbose 2>&1

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "========================================="
    echo "✅ Successfully pushed to GitHub!"
    echo "========================================="
    echo ""
    echo "🎉 Your contribution graph will show $COMMIT_COUNT contributions!"
    echo ""
    echo "View your repository at:"
    echo "https://github.com/riazaslam029/Personal-AI-Study-Coach-Kiro"
else
    echo "========================================="
    echo "⚠️  Push failed - Authentication needed"
    echo "========================================="
    echo ""
    echo "Please run ONE of these commands:"
    echo ""
    echo "Option 1 - Using GitHub CLI (gh):"
    echo "  gh auth login"
    echo "  git push -u origin main"
    echo ""
    echo "Option 2 - Using Personal Access Token:"
    echo "  git remote set-url origin https://YOUR_TOKEN@github.com/riazaslam029/Personal-AI-Study-Coach-Kiro.git"
    echo "  git push -u origin main"
    echo ""
    echo "Option 3 - Using SSH:"
    echo "  git remote set-url origin git@github.com:riazaslam029/Personal-AI-Study-Coach-Kiro.git"
    echo "  git push -u origin main"
    echo ""
    echo "Get your token from: https://github.com/settings/tokens"
fi

echo ""
