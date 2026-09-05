#!/bin/bash
# Quick Push Script
# Run this to push your project to GitHub

clear
echo "════════════════════════════════════════════════════════"
echo "  🚀 PUSH TO GITHUB - Personal AI Study Coach"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Repository: Personal-AI-Study-Coach-Kiro"
echo "Commits ready: 36+"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

# Check if authenticated
if gh auth status &> /dev/null; then
    echo "✅ Already authenticated with GitHub"
    echo ""
    echo "🚀 Pushing to GitHub..."
    echo ""
    git push -u origin main
else
    echo "⚠️  Not authenticated with GitHub"
    echo ""
    echo "Please choose authentication method:"
    echo ""
    echo "1) GitHub CLI (gh auth login) - Interactive browser"
    echo "2) Personal Access Token - Manual"
    echo ""
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" = "1" ]; then
        echo ""
        echo "Starting GitHub authentication..."
        echo "Follow the prompts in your browser"
        echo ""
        gh auth login
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Authentication successful!"
            echo ""
            echo "🚀 Pushing to GitHub..."
            echo ""
            git push -u origin main
        fi
    else
        echo ""
        echo "Please follow these steps:"
        echo ""
        echo "1. Go to: https://github.com/settings/tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Select: repo (all permissions)"
        echo "4. Copy the token"
        echo ""
        read -p "Paste your token here: " token
        
        if [ -n "$token" ]; then
            echo ""
            echo "Setting up remote with token..."
            git remote set-url origin "https://$token@github.com/riazaslam029/Personal-AI-Study-Coach-Kiro.git"
            
            echo "🚀 Pushing to GitHub..."
            echo ""
            git push -u origin main
        fi
    fi
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "If successful, check your repository at:"
echo "https://github.com/riazaslam029/Personal-AI-Study-Coach-Kiro"
echo ""
echo "Your contribution graph will show 36+ commits! 🎉"
echo ""
echo "════════════════════════════════════════════════════════"
