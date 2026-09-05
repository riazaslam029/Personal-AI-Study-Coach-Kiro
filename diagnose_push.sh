#!/bin/bash
# Diagnostic script to check push issue

echo "════════════════════════════════════════════════════════"
echo "  🔍 DIAGNOSING PUSH ISSUE"
echo "════════════════════════════════════════════════════════"
echo ""

echo "1. Checking Git Repository Status:"
echo "-----------------------------------"
git status
echo ""

echo "2. Checking Commit History:"
echo "-----------------------------------"
git log --oneline | head -10
echo ""

echo "3. Checking Remote Configuration:"
echo "-----------------------------------"
git remote -v
echo ""

echo "4. Checking Branch Information:"
echo "-----------------------------------"
git branch -vv
echo ""

echo "5. Trying to Push with Verbose Output:"
echo "-----------------------------------"
git push -u origin main --verbose 2>&1
PUSH_EXIT_CODE=$?
echo ""

echo "════════════════════════════════════════════════════════"
echo "  📊 DIAGNOSIS RESULTS"
echo "════════════════════════════════════════════════════════"
echo ""

if [ $PUSH_EXIT_CODE -eq 0 ]; then
    echo "✅ Push was SUCCESSFUL!"
    echo ""
    echo "View your project at:"
    echo "https://github.com/riazaslam029/Personal-AI-Study-Coach-Kiro"
else
    echo "❌ Push failed with exit code: $PUSH_EXIT_CODE"
    echo ""
    echo "Common causes and solutions:"
    echo ""
    echo "1. Empty repository needs first push:"
    echo "   → git push -u origin main --force"
    echo ""
    echo "2. Branch mismatch (main vs master):"
    echo "   → git branch -M main"
    echo "   → git push -u origin main"
    echo ""
    echo "3. No commits in repository:"
    echo "   → Check: git log (should show commits)"
    echo ""
    echo "4. Token lacks permissions:"
    echo "   → Get new token: https://github.com/settings/tokens/new"
    echo "   → Check ALL boxes under 'repo'"
    echo ""
fi

echo ""
echo "════════════════════════════════════════════════════════"
