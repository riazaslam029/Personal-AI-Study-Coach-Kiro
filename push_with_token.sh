#!/bin/bash
# Safe Token Push Script
# Run this script and paste your token when prompted

echo "════════════════════════════════════════════════════════"
echo "  🔐 GITHUB TOKEN AUTHENTICATION"
echo "════════════════════════════════════════════════════════"
echo ""
echo "This script will securely configure your GitHub token"
echo "Your token will NOT be displayed on screen"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
read -sp "Paste your GitHub token here (won't be visible): " TOKEN
echo ""
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo "🔧 Configuring remote with token..."
git remote set-url origin "https://${TOKEN}@github.com/riazaslam029/Personal-AI-Study-Coach-Kiro.git"

if [ $? -eq 0 ]; then
    echo "✅ Token configured successfully!"
    echo ""
    echo "🚀 Pushing to GitHub..."
    echo ""
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "════════════════════════════════════════════════════════"
        echo "  ✅ SUCCESS! Project pushed to GitHub!"
        echo "════════════════════════════════════════════════════════"
        echo ""
        echo "View your project at:"
        echo "https://github.com/riazaslam029/Personal-AI-Study-Coach-Kiro"
        echo ""
        echo "Check your contribution graph on your GitHub profile!"
        echo ""
    else
        echo ""
        echo "❌ Push failed. Check the error above."
        echo ""
        echo "Common issues:"
        echo "- Token doesn't have 'repo' permissions"
        echo "- Repository doesn't exist"
        echo "- Internet connection issue"
        echo ""
    fi
else
    echo "❌ Failed to configure remote. Check your token."
fi
