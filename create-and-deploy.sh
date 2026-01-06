#!/bin/bash
# Create GitHub repo and deploy

REPO_NAME="ces-demo"
GITHUB_USER="adhan81"

echo "🚀 Creating GitHub repository: $GITHUB_USER/$REPO_NAME"
echo ""

# Try to create via GitHub API (requires token)
if [ -z "$GITHUB_TOKEN" ]; then
    echo "📝 To create the repository automatically, you need a GitHub Personal Access Token."
    echo ""
    echo "Option 1: Create repo manually (easiest):"
    echo "  1. Go to: https://github.com/new"
    echo "  2. Repository name: $REPO_NAME"
    echo "  3. Make it Public"
    echo "  4. DO NOT check 'Initialize with README'"
    echo "  5. Click 'Create repository'"
    echo "  6. Then run: git push -u origin main"
    echo ""
    echo "Option 2: Create with token:"
    echo "  export GITHUB_TOKEN=your_token_here"
    echo "  ./create-and-deploy.sh"
    exit 0
fi

# Create repository via API
echo "Creating repository via GitHub API..."
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"public\":true,\"description\":\"CES Demo - Revenue Scanner / Deal Watch\"}")

if echo "$RESPONSE" | grep -q '"id"'; then
    echo "✅ Repository created successfully!"
    echo ""
    echo "📤 Pushing code..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment complete!"
        echo "🌐 Enable GitHub Pages:"
        echo "   https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
        echo ""
        echo "Your site will be at:"
        echo "   https://$GITHUB_USER.github.io/$REPO_NAME/"
    fi
else
    echo "❌ Failed to create repository:"
    echo "$RESPONSE"
    echo ""
    echo "Please create it manually at: https://github.com/new"
fi

