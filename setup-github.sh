#!/bin/bash
# Quick setup script for GitHub and Vercel deployment

set -e

echo "🚀 Setting up GitHub and Vercel deployment..."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
fi

# Check if remote exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ Git remote already configured:"
    git remote -v
    echo ""
    read -p "Do you want to change the remote URL? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your GitHub repository URL: " REPO_URL
        git remote set-url origin "$REPO_URL"
    fi
else
    echo "🔗 Please provide your GitHub repository URL"
    echo "   Example: https://github.com/username/nobad-day-static.git"
    read -p "GitHub repo URL: " REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo "✅ Remote added: $REPO_URL"
    else
        echo "⚠️  No remote URL provided. You can add it later with:"
        echo "   git remote add origin YOUR_REPO_URL"
    fi
fi

echo ""
echo "📝 Creating initial commit..."
git add .
git commit -m "Initial commit: Static mirror of nobad.day" || echo "⚠️  Nothing to commit or already committed"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Create a GitHub repository (if you haven't already):"
echo "   https://github.com/new"
echo ""
echo "2. Push to GitHub:"
if git remote get-url origin >/dev/null 2>&1; then
    echo "   git push -u origin main"
else
    echo "   git remote add origin YOUR_REPO_URL"
    echo "   git push -u origin main"
fi
echo ""
echo "3. Deploy to Vercel:"
echo "   - Go to https://vercel.com/new"
echo "   - Import your GitHub repository"
echo "   - Configure:"
echo "     • Build Command: npm run mirror:exact"
echo "     • Output Directory: static-mirror"
echo "   - Deploy!"
echo ""
echo "📖 See DEPLOY.md for detailed instructions"

