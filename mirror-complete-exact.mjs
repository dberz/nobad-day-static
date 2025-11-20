#!/usr/bin/env node
/**
 * Complete 1:1 exact mirror of nobad.day
 * Phase 1: Discover all pages and assets
 * Phase 2: Download everything
 * Phase 3: Rewrite all URLs to be local/relative
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIRROR_DIR = path.join(__dirname, 'static-mirror');
const BASE_URL = 'https://nobad.day';

const pagesToDownload = new Set();
const assetsToDownload = new Map(); // url -> localPath
const visitedPages = new Set();
const visitedAssets = new Set();
const downloadedAssets = new Set(); // Track which assets have been downloaded

// Priority URLs to start with
const priorityUrls = [
  BASE_URL,
  `${BASE_URL}/blogs/news`,
  `${BASE_URL}/pages/about`,
  `${BASE_URL}/pages/contact`,
  `${BASE_URL}/pages/terms-and-conditions`,
  `${BASE_URL}/pages/privacy-policy`,
  `${BASE_URL}/products/no-bad-days`,
  `${BASE_URL}/products/daily-support`,
  `${BASE_URL}/products/k-balance`,
  `${BASE_URL}/products/m-balance`,
  `${BASE_URL}/collections/all`,
  `${BASE_URL}/cart`,
];

const ASSET_DOMAINS = [
  'nobad.day',
  'cdn.shopify.com',
  'shopifycdn.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

function shouldMirror(url) {
  try {
    const urlObj = new URL(url);
    return ASSET_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

function getLocalPath(url, isAsset = false) {
  try {
    const urlObj = new URL(url);
    let filePath = urlObj.pathname.split('?')[0].split('#')[0];
    
    if (filePath === '/') {
      return '/index.html';
    }
    
    // For external CDN assets, preserve structure
    if (isAsset && !urlObj.hostname.includes('nobad.day')) {
      const domain = urlObj.hostname.replace(/\./g, '_');
      if (!filePath.startsWith('/')) filePath = '/' + filePath;
      filePath = `/cdn/${domain}${filePath}`;
    }
    
    // Add extension if missing
    if (!path.extname(filePath)) {
      if (urlObj.pathname.match(/^\/(blogs|pages|products|collections|cart)/)) {
        filePath += '.html';
      } else {
        // Infer from URL pattern
        if (url.includes('.css') || url.match(/\/css\//)) filePath += '.css';
        else if (url.includes('.js') || url.match(/\/js\//)) filePath += '.js';
        else filePath += '.html';
      }
    }
    
    return filePath;
  } catch {
    return null;
  }
}

function extractAllUrls(html, baseUrl) {
  const urls = new Set();
  
  // href attributes
  html.replace(/href=["']([^"']+)["']/gi, (_, urlStr) => {
    try {
      const url = new URL(urlStr, baseUrl).href;
      if (shouldMirror(url)) urls.add(url);
    } catch {}
  });
  
  // src attributes
  html.replace(/src=["']([^"']+)["']/gi, (_, urlStr) => {
    try {
      const url = new URL(urlStr, baseUrl).href;
      if (shouldMirror(url)) urls.add(url);
    } catch {}
  });
  
  // CSS url() in style attributes and <style> tags
  html.replace(/url\(["']?([^"')]+)["']?\)/gi, (_, urlStr) => {
    try {
      const url = new URL(urlStr, baseUrl).href;
      if (shouldMirror(url)) urls.add(url);
    } catch {}
  });
  
  // @import in CSS
  html.replace(/@import\s+["']([^"']+)["']/gi, (_, urlStr) => {
    try {
      const url = new URL(urlStr, baseUrl).href;
      if (shouldMirror(url)) urls.add(url);
    } catch {}
  });
  
  return Array.from(urls);
}

async function discoverPage(url) {
  if (visitedPages.has(url)) return;
  visitedPages.add(url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      console.warn(`⚠️  ${response.status} ${url}`);
      return;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      // Not HTML, treat as asset
      const localPath = getLocalPath(url, true);
      if (localPath && !assetsToDownload.has(url)) {
        assetsToDownload.set(url, localPath);
      }
      return;
    }
    
    const html = await response.text();
    pagesToDownload.add(url);
    
    // Extract all URLs (for assets)
    const urls = extractAllUrls(html, url);
    for (const assetUrl of urls) {
      if (!visitedAssets.has(assetUrl)) {
        visitedAssets.add(assetUrl);
        const localPath = getLocalPath(assetUrl, true);
        if (localPath) {
          assetsToDownload.set(assetUrl, localPath);
        }
      }
    }
    
    // Extract ALL page links (not just asset links) - parse HTML directly
    const pageLinks = new Set();
    
    // Extract all href attributes that point to nobad.day pages
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      try {
        const linkUrl = new URL(match[1], url).href;
        const urlObj = new URL(linkUrl);
        if (urlObj.hostname.includes('nobad.day') &&
            !linkUrl.includes('#') &&
            !linkUrl.includes('checkout') &&
            !linkUrl.includes('account') &&
            !linkUrl.includes('admin') &&
            (linkUrl.match(/\/blogs\/|\/pages\/|\/products\/|\/collections\/|^https?:\/\/nobad\.day\/?$/) || linkUrl === BASE_URL)) {
          pageLinks.add(linkUrl);
        }
      } catch {}
    }
    
    // Special handling for blog index page - extract all blog post links more aggressively
    if (url.includes('/blogs/news') && !url.includes('/blogs/news/')) {
      // This is the blog index page, extract all blog post links with various patterns
      const blogPostPatterns = [
        /href=["']([^"']*\/blogs\/news\/[^"']+)["']/gi,
        /data-href=["']([^"']*\/blogs\/news\/[^"']+)["']/gi,
        /url\(["']?([^"']*\/blogs\/news\/[^"']+)["']?\)/gi,
      ];
      
      for (const pattern of blogPostPatterns) {
        while ((match = pattern.exec(html)) !== null) {
          let blogUrl = match[1];
          // Convert relative to absolute
          if (blogUrl.startsWith('/')) {
            blogUrl = BASE_URL + blogUrl;
          } else if (!blogUrl.startsWith('http')) {
            try {
              blogUrl = new URL(blogUrl, url).href;
            } catch {}
          }
          if (blogUrl.includes('/blogs/news/') && !blogUrl.includes('#') && !blogUrl.includes('checkout')) {
            pageLinks.add(blogUrl);
          }
        }
      }
    }
    
    for (const pageUrl of pageLinks) {
      if (!visitedPages.has(pageUrl) && pagesToDownload.size < 500) {
        await discoverPage(pageUrl);
        await new Promise(r => setTimeout(r, 100)); // Rate limit
      }
    }
    
  } catch (error) {
    console.error(`❌ Error discovering ${url}:`, error.message);
  }
}

async function downloadAsset(url, localPath) {
  if (downloadedAssets.has(url)) {
    return true; // Already downloaded
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      console.warn(`⚠️  ${response.status} ${url}`);
      return false;
    }
    
    const fullPath = path.join(MIRROR_DIR, localPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    const contentType = response.headers.get('content-type') || '';
    const isBinary = contentType.includes('image/') ||
                     contentType.includes('font/') ||
                     contentType.includes('application/octet-stream') ||
                     localPath.match(/\.(woff|woff2|ttf|otf|eot|png|jpg|jpeg|gif|svg|webp|ico|pdf)$/i);
    
    if (isBinary) {
      const buffer = await response.arrayBuffer();
      await fs.writeFile(fullPath, Buffer.from(buffer));
    } else {
      const text = await response.text();
      await fs.writeFile(fullPath, text, 'utf8');
      
      // If it's CSS, extract more URLs
      if (contentType.includes('text/css') || localPath.endsWith('.css')) {
        const cssUrls = extractAllUrls(text, url);
        for (const cssUrl of cssUrls) {
          if (!assetsToDownload.has(cssUrl) && shouldMirror(cssUrl)) {
            const cssLocalPath = getLocalPath(cssUrl, true);
            if (cssLocalPath) {
              assetsToDownload.set(cssUrl, cssLocalPath);
            }
          }
        }
      }
    }
    
    downloadedAssets.add(url);
    return true;
  } catch (error) {
    console.error(`❌ Error downloading ${url}:`, error.message);
    return false;
  }
}

async function downloadPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      redirect: 'follow'
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const localPath = getLocalPath(url);
    if (!localPath) return null;
    
    // Rewrite URLs in HTML
    let modifiedHtml = html;
    for (const [assetUrl, assetLocalPath] of assetsToDownload.entries()) {
      const relativePath = path.relative(
        path.dirname(localPath),
        assetLocalPath
      ).replace(/\\/g, '/');
      const relativeUrl = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      
      // Replace all occurrences
      modifiedHtml = modifiedHtml.replace(
        new RegExp(escapeRegex(assetUrl), 'g'),
        relativeUrl
      );
    }
    
    // Rewrite absolute site URLs to relative
    modifiedHtml = modifiedHtml.replace(
      new RegExp(`https?://${BASE_URL.replace('https://', '')}`, 'gi'),
      ''
    );
    modifiedHtml = modifiedHtml.replace(
      new RegExp(`https?://www\\.${BASE_URL.replace('https://', '')}`, 'gi'),
      ''
    );
    
    const fullPath = path.join(MIRROR_DIR, localPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, modifiedHtml, 'utf8');
    
    return localPath;
  } catch (error) {
    console.error(`❌ Error downloading page ${url}:`, error.message);
    return null;
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function rewriteUrlsInFiles() {
  console.log('\n🔄 Rewriting URLs in all files...');
  
  async function processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let modified = content;
      let changed = false;
      
      // Rewrite all asset URLs
      for (const [assetUrl, assetLocalPath] of assetsToDownload.entries()) {
        const relativePath = path.relative(
          path.dirname(filePath),
          path.join(MIRROR_DIR, assetLocalPath)
        ).replace(/\\/g, '/');
        const relativeUrl = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
        
        if (modified.includes(assetUrl)) {
          modified = modified.replace(
            new RegExp(escapeRegex(assetUrl), 'g'),
            relativeUrl
          );
          changed = true;
        }
      }
      
      // Rewrite base URL
      modified = modified.replace(
        new RegExp(`https?://${BASE_URL.replace('https://', '')}`, 'gi'),
        ''
      );
      modified = modified.replace(
        new RegExp(`https?://www\\.${BASE_URL.replace('https://', '')}`, 'gi'),
        ''
      );
      
      if (changed) {
        await fs.writeFile(filePath, modified, 'utf8');
      }
    } catch {
      // Skip binary files
    }
  }
  
  async function walkDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.name.match(/\.(html|css|js|json)$/i)) {
        await processFile(fullPath);
      }
    }
  }
  
  await walkDir(MIRROR_DIR);
  console.log('✅ URL rewriting complete');
}

async function main() {
  console.log(`🔄 Starting EXACT 1:1 mirror of ${BASE_URL}...\n`);
  
  // Clean output directory
  await fs.rm(MIRROR_DIR, { recursive: true, force: true });
  await fs.mkdir(MIRROR_DIR, { recursive: true });
  
  // Phase 1: Discover all pages and assets
  console.log('📋 Phase 1: Discovering pages and assets...');
  for (const url of priorityUrls) {
    await discoverPage(url);
  }
  console.log(`   Found ${pagesToDownload.size} pages and ${assetsToDownload.size} assets\n`);
  
  // Phase 2: Download everything (with recursive discovery)
  console.log('📥 Phase 2: Downloading assets...');
  let assetCount = 0;
  let previousSize = 0;
  let passes = 0;
  const maxPasses = 5; // Limit recursion depth
  
  // Keep downloading until no new assets are discovered
  while (assetsToDownload.size > previousSize && passes < maxPasses) {
    previousSize = assetsToDownload.size;
    passes++;
    
    if (passes > 1) {
      console.log(`   Pass ${passes}: ${assetsToDownload.size - downloadedAssets.size} new assets discovered`);
    }
    
    // Download all assets (including newly discovered ones)
    const assetsToProcess = Array.from(assetsToDownload.entries());
    for (const [url, localPath] of assetsToProcess) {
      if (await downloadAsset(url, localPath)) {
        assetCount++;
        if (assetCount % 10 === 0) {
          console.log(`   Downloaded ${assetCount} assets...`);
        }
      }
      await new Promise(r => setTimeout(r, 100)); // Rate limit
    }
  }
  console.log(`   ✅ Downloaded ${assetCount} assets (${passes} passes)\n`);
  
  console.log('📄 Phase 2: Downloading pages...');
  let pageCount = 0;
  for (const url of pagesToDownload) {
    const localPath = await downloadPage(url);
    if (localPath) {
      pageCount++;
      console.log(`   ${pageCount}. ${localPath}`);
    }
    await new Promise(r => setTimeout(r, 200)); // Rate limit
  }
  console.log(`   ✅ Downloaded ${pageCount} pages\n`);
  
  // Phase 3: Final URL rewriting pass
  await rewriteUrlsInFiles();
  
  console.log(`\n✅ Mirror complete!`);
  console.log(`   Pages: ${pageCount}`);
  console.log(`   Assets: ${assetCount}`);
  console.log(`   Total files: ${pageCount + assetCount}`);
  console.log(`   Output: ${MIRROR_DIR}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review ${MIRROR_DIR}/`);
  console.log(`   2. Test locally: cd ${MIRROR_DIR} && python3 -m http.server 8000`);
  console.log(`   3. Deploy to your hosting provider`);
}

main().catch(console.error);

