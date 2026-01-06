#!/bin/bash
# Deploy CES Demo to GitHub

REPO_NAME="ces-demo"
GITHUB_USER="asifdhanani"
REPO_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"

echo "🚀 Deploying CES Demo to GitHub..."
echo ""

# Check if repo exists
if git ls-remote "$REPO_URL" &> /dev/null; then
    echo "✅ Repository already exists!"
else
    echo "📦 Repository doesn't exist. Creating it..."
    echo ""
    echo "To create the repository, you have two options:"
    echo ""
    echo "Option 1: Create via GitHub website (easiest):"
    echo "  1. Go to: https://github.com/new"
    echo "  2. Repository name: $REPO_NAME"
    echo "  3. Make it Public"
    echo "  4. DO NOT check 'Initialize with README'"
    echo "  5. Click 'Create repository'"
    echo "  6. Then run this script again"
    echo ""
    echo "Option 2: Create via GitHub API (requires token):"
    echo "  Set GITHUB_TOKEN environment variable, then run:"
    echo "  curl -X POST -H \"Authorization: token \$GITHUB_TOKEN\" \\"
    echo "    -H \"Accept: application/vnd.github.v3+json\" \\"
    echo "    https://api.github.com/user/repos \\"
    echo "    -d '{\"name\":\"$REPO_NAME\",\"public\":true}'"
    echo ""
    read -p "Have you created the repository? (y/n) " -n 1 -r
    echo
    if [[ ! $REPO =~ ^[Yy]$ ]]; then
        echo "Please create the repository first, then run this script again."
        exit 1
    fi
fi

# Now push the code
echo "📤 Pushing code to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Code pushed successfully!"
    echo ""
    echo "🌐 Next steps to enable GitHub Pages:"
    echo "  1. Go to: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
    echo "  2. Under 'Source', select:"
    echo "     - Branch: main"
    echo "     - Folder: / (root)"
    echo "  3. Click 'Save'"
    echo "  4. Wait 1-2 minutes"
    echo "  5. Your site will be live at:"
    echo "     https://$GITHUB_USER.github.io/$REPO_NAME/"
    echo ""
else
    echo ""
    echo "❌ Push failed. You may need to:"
    echo "  1. Create the repository on GitHub first"
    echo "  2. Authenticate with: git credential approve"
    echo "  3. Or use SSH: git remote set-url origin git@github.com:$GITHUB_USER/$REPO_NAME.git"
fi

