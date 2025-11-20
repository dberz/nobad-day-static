# No Bad Days - Static Site Clone

This is a static mirror of nobad.day, created by downloading the production site.

## Quick Start - Exact 1:1 Mirror

To create a complete 1:1 static clone of nobad.day:

```bash
npm run mirror:exact
```

This will:
1. Discover all pages and assets on the site
2. Download all HTML pages, CSS, JavaScript, images, fonts, and other assets
3. Rewrite all URLs to be relative/local so the site works offline
4. Output everything to `static-mirror/` directory

The result is a complete static copy that can be hosted anywhere (Vercel, Netlify, GitHub Pages, S3, etc.) without Shopify hosting costs.

## Other Mirror Options

- `npm run mirror:exact` - **Recommended**: Complete 1:1 mirror with URL rewriting
- `npm run mirror:node` - Basic mirror using Node.js
- `npm run mirror:simple` - Simple mirror script
- `npm run mirror` - Uses wget (if available)

## Testing the Static Mirror

After running `mirror:exact`, test locally:

```bash
cd static-mirror
python3 -m http.server 8000
# or
npx serve .
```

Then visit http://localhost:8000

## Deploying the Static Site

The `static-mirror/` directory contains everything needed. You can:

1. **Vercel**: Deploy the `static-mirror/` directory
2. **Netlify**: Drag and drop the `static-mirror/` folder
3. **GitHub Pages**: Push `static-mirror/` contents to `gh-pages` branch
4. **AWS S3**: Upload `static-mirror/` contents to an S3 bucket with static hosting
5. **Any static host**: Upload the entire `static-mirror/` directory

## Structure

- `static-mirror/` - Complete static mirror (ready to deploy)
- `site-mirror/` - Raw mirrored files from production (older method)
- `public/` - Static assets (CSS, JS, fonts, images) served by Next.js
- `src/app/` - Next.js App Router pages

## Notes

- The exact mirror (`mirror:exact`) downloads everything and rewrites URLs to be relative
- All assets from Shopify CDN are downloaded locally
- The site works completely offline after mirroring
- All pages, blog posts, products, and assets are included

