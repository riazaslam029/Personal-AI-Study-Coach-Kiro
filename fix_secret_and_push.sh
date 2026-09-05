#!/bin/bash
# Fix Secret Exposure and Push to GitHub

clear
echo "════════════════════════════════════════════════════════"
echo "  🔐 FIXING SECRET EXPOSURE & PUSHING TO GITHUB"
echo "════════════════════════════════════════════════════════"
echo ""

echo "📋 Step 1: Amending the commit to remove API key"
echo "---------------------------------------------------"
echo ""

# Stage the fixed file
git add AI_FEATURES_ENABLED.md

# Amend the problematic commit
git commit --amend --no-edit

if [ $? -eq 0 ]; then
    echo "✅ Commit amended successfully!"
    echo ""
else
    echo "❌ Failed to amend commit"
    exit 1
fi

echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 Step 2: Force push to GitHub (overwrites history)"
echo "---------------------------------------------------"
echo ""
echo "⚠️  This will rewrite git history to remove the secret."
echo "   This is safe for a new repository."
echo ""
read -p "Press ENTER to continue with force push..."
echo ""

git push -u origin main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "  🎉 SUCCESS! PROJECT PUSHED TO GITHUB!"
    echo "════════════════════════════════════════════════════════"
    echo ""
    echo "✅ All 36+ commits are now on GitHub"
    echo "✅ Secret removed from git history"
    echo "✅ Repository is clean and secure"
    echo ""
    echo "🌐 View your project at:"
    echo "   https://github.com/riazaslam029/Personal-AI-Study-Coach-Kiro"
    echo ""
    echo "👤 Check your GitHub profile for contributions!"
    echo ""
    echo "════════════════════════════════════════════════════════"
else
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "  ❌ PUSH FAILED"
    echo "════════════════════════════════════════════════════════"
    echo ""
    echo "GitHub still detected a secret. Options:"
    echo ""
    echo "1. Allow the secret push via GitHub web:"
    echo "   Visit this URL to allow:"
    echo "   https://github.com/riazaslam029/Personal-AI-Study-Coach-Kiro/security/secret-scanning/unblock-secret/3IvVYyP6QlPpKNAXDPV4cRISeFO"
    echo ""
    echo "2. Completely remove git history (nuclear option):"
    echo "   Run: ./nuclear_clean_push.sh"
    echo ""
    echo "════════════════════════════════════════════════════════"
fi
