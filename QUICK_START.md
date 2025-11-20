# Quick Start: Deploy to GitHub & Vercel

## 🚀 Fast Track (5 minutes)

### 1. Create GitHub Repository
```bash
# Go to https://github.com/new and create a new repo
# Don't initialize with README
```

### 2. Connect & Push
```bash
cd nobad-day-static
git add .
git commit -m "Initial commit: Static mirror of nobad.day"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 3. Deploy to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repository
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `npm run mirror:exact`
   - **Output Directory**: `static-mirror`
   - **Install Command**: `npm install`
5. Click "Deploy"

That's it! Your site will be live in ~2 minutes.

## 🔄 Updating the Site

When you want to update the mirror:

```bash
git add .
git commit -m "Update static mirror"
git push
```

Vercel will automatically rebuild and redeploy.

## 📝 Notes

- The `vercel.json` file handles URL rewriting automatically
- All assets are included in the `static-mirror/` directory
- The site works completely offline after mirroring

## 🆘 Need Help?

See `DEPLOY.md` for detailed instructions and troubleshooting.

