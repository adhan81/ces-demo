#!/bin/bash
# Script to create GitHub repository and deploy

REPO_NAME="ces-demo"
GITHUB_USER="asifdhanani"  # Based on your email

echo "🚀 Creating GitHub repository for CES Demo..."
echo ""

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI found!"
    gh auth status 2>&1 | grep -q "Logged in" && echo "✅ Already authenticated" || {
        echo "🔐 Please authenticate with GitHub:"
        gh auth login
    }
    
    echo "📦 Creating repository..."
    gh repo create $REPO_NAME --public --source=. --remote=origin --push 2>&1
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Repository created and code pushed!"
        echo "🌐 Enable GitHub Pages:"
        echo "   1. Go to: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
        echo "   2. Source: main branch, / (root)"
        echo "   3. Your site will be at: https://$GITHUB_USER.github.io/$REPO_NAME/"
    fi
else
    echo "⚠️  GitHub CLI not found. Please:"
    echo "   1. Create repo at: https://github.com/new"
    echo "   2. Name it: $REPO_NAME"
    echo "   3. Don't initialize with README"
    echo "   4. Then run:"
    echo "      git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git"
    echo "      git branch -M main"
    echo "      git push -u origin main"
fi

