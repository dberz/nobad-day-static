# Deployment Guide

This guide will help you deploy the static mirror of nobad.day to GitHub and Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Git installed locally

## Step 1: Initialize Git Repository

```bash
cd nobad-day-static
git init
git add .
git commit -m "Initial commit: Static mirror of nobad.day"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `nobad-day-static`)
3. **Don't** initialize with README, .gitignore, or license (we already have these)

## Step 3: Connect to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/nobad-day-static.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 4: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `nobad-day-static` repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `nobad-day-static` (if repo is at root) or leave blank if repo IS the project
   - **Build Command**: `npm run mirror:exact`
   - **Output Directory**: `static-mirror`
   - **Install Command**: `npm install`
5. Click "Deploy"

### Option B: Via Vercel CLI

```bash
npm install -g vercel
cd nobad-day-static
vercel login
vercel
```

Follow the prompts to link your project.

## Step 5: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project → Settings → Domains
2. Add your domain (e.g., `nobad.day`)
3. Follow DNS configuration instructions

## How It Works

- Vercel will run `npm run mirror:exact` on each deployment
- This creates/updates the `static-mirror/` directory
- Vercel serves files from `static-mirror/` directory
- The `vercel.json` config handles URL rewriting (e.g., `/products/no-bad-days` → `/products/no-bad-days.html`)

## Updating the Site

To update the static mirror:

1. Make changes locally
2. Run `npm run mirror:exact` to regenerate the mirror
3. Commit and push:
   ```bash
   git add .
   git commit -m "Update static mirror"
   git push
   ```
4. Vercel will automatically rebuild and redeploy

## Manual Deployment

If you want to manually trigger a rebuild:

1. Go to Vercel dashboard → Your Project → Deployments
2. Click "Redeploy" on the latest deployment
3. Or push an empty commit: `git commit --allow-empty -m "Trigger rebuild" && git push`

## Troubleshooting

### Build fails on Vercel

- Check that `package.json` has the `mirror:exact` script
- Ensure Node.js version is compatible (Vercel uses Node 18+ by default)
- Check build logs in Vercel dashboard

### URLs return 404

- Verify `vercel.json` rewrites are configured correctly
- Check that files exist in `static-mirror/` directory
- Ensure file paths match URL structure

### Assets not loading

- Check that all assets were downloaded during mirror process
- Verify URLs in HTML files are relative (not absolute)
- Check browser console for 404 errors

