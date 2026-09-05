#!/bin/bash
# Fresh Token Setup and Push Script

clear
echo "════════════════════════════════════════════════════════"
echo "  🔐 GITHUB TOKEN - FRESH SETUP"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Your current token is invalid or expired."
echo "Let's get a fresh one and push your project!"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 STEP 1: Get a Fresh Token"
echo ""
echo "1. Open this URL in your browser:"
echo "   https://github.com/settings/tokens/new"
echo ""
echo "2. Configure the token:"
echo "   - Note: Personal-AI-Study-Coach"
echo "   - Expiration: 90 days (or No expiration)"
echo "   - ☑️ Check ALL boxes under 'repo'"
echo "     (repo:status, repo_deployment, public_repo, etc.)"
echo ""
echo "3. Scroll down and click 'Generate token'"
echo ""
echo "4. COPY the token (it starts with 'ghp_')"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
read -p "Press ENTER when you have copied your token..."
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 STEP 2: Enter Your Token"
echo ""
read -sp "Paste your token here (it won't show): " TOKEN
echo ""
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

# Verify token format
if [[ ! "$TOKEN" =~ ^ghp_ ]] && [[ ! "$TOKEN" =~ ^github_pat_ ]]; then
    echo "⚠️  Warning: Token doesn't match expected format (ghp_* or github_pat_*)"
    echo "   But we'll try it anyway..."
    echo ""
fi

echo "🔧 Configuring remote with new token..."
git remote set-url origin "https://${TOKEN}@github.com/riazaslam029/Personal-AI-Study-Coach-Kiro.git"

if [ $? -ne 0 ]; then
    echo "❌ Failed to configure remote."
    exit 1
fi

echo "✅ Token configured!"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 STEP 3: Push to GitHub"
echo ""
echo "🚀 Pushing all 36+ commits..."
echo ""

git push -u origin main --force --verbose

if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "  🎉 SUCCESS! PROJECT PUSHED TO GITHUB! 🎉"
    echo "════════════════════════════════════════════════════════"
    echo ""
    echo "✅ All 36+ commits are now on GitHub"
    echo "✅ Your contribution graph will show green squares"
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
    echo "Possible issues:"
    echo ""
    echo "1. Token doesn't have correct permissions:"
    echo "   → Go back and make sure ALL 'repo' boxes are checked"
    echo ""
    echo "2. Repository doesn't exist:"
    echo "   → Create it at: https://github.com/new"
    echo "   → Name: Personal-AI-Study-Coach-Kiro"
    echo "   → Leave it EMPTY (no README, no .gitignore)"
    echo ""
    echo "3. Wrong GitHub account:"
    echo "   → Make sure you're logged into riazaslam029"
    echo ""
    echo "════════════════════════════════════════════════════════"
fi
