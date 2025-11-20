#!/usr/bin/env node
/**
 * Complete 1:1 mirror of nobad.day
 * Downloads all pages, assets, and rewrites URLs to be local
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIRROR_DIR = path.join(__dirname, 'static-mirror');
const BASE_URL = 'https://nobad.day';

const visited = new Set();
const assetMap = new Map(); // Maps remote URL to local path
const queue = [];
let processed = 0;
let downloaded = 0;
const maxFiles = 5000;

// Priority URLs to crawl first
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

// Domains to mirror assets from
const ASSET_DOMAINS = [
  'nobad.day',
  'cdn.shopify.com',
  'shopifycdn.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

function isAssetDomain(url) {
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
    let filePath = urlObj.pathname;
    
    // Handle root
    if (filePath === '/') {
      return '/index.html';
    }
    
    // Remove query strings and hashes
    filePath = filePath.split('?')[0].split('#')[0];
    
    // For assets from external domains, preserve domain structure
    if (isAsset && !urlObj.hostname.includes('nobad.day')) {
      const domain = urlObj.hostname.replace(/\./g, '_');
      filePath = `/cdn/${domain}${filePath}`;
    }
    
    // Ensure proper extensions
    if (!path.extname(filePath)) {
      if (urlObj.pathname.match(/^\/(blogs|pages|products|collections)/)) {
        filePath += '.html';
      } else if (urlObj.pathname === '/cart') {
        filePath = '/cart.html';
      } else {
        // Try to infer from content-type or URL pattern
        if (url.includes('.css') || url.includes('/css/')) {
          filePath += '.css';
        } else if (url.includes('.js') || url.includes('/js/')) {
          filePath += '.js';
        } else {
          filePath += '.html';
        }
      }
    }
    
    return filePath;
  } catch (e) {
    return null;
  }
}

async function downloadFile(url, localPath) {
  if (visited.has(url)) {
    return assetMap.get(url);
  }
  
  visited.add(url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.warn(`⚠️  ${response.status} ${url}`);
      return null;
    }

    const fullPath = path.join(MIRROR_DIR, localPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Determine if it's binary or text
    const contentType = response.headers.get('content-type') || '';
    const isBinary = contentType.includes('image/') || 
                     contentType.includes('font/') ||
                     contentType.includes('application/octet-stream') ||
                     localPath.match(/\.(woff|woff2|ttf|otf|eot|png|jpg|jpeg|gif|svg|webp|ico)$/i);

    if (isBinary) {
      const buffer = await response.arrayBuffer();
      await fs.writeFile(fullPath, Buffer.from(buffer));
    } else {
      const content = await response.text();
      await fs.writeFile(fullPath, content, 'utf8');
    }

    assetMap.set(url, localPath);
    downloaded++;
    
    if (downloaded % 10 === 0) {
      console.log(`📥 ${downloaded} files downloaded... ${localPath}`);
    } else {
      console.log(`✅ ${downloaded}. ${localPath}`);
    }

    return localPath;
  } catch (error) {
    console.error(`❌ Error downloading ${url}:`, error.message);
    return null;
  }
}

function extractUrls(content, baseUrl, type = 'html') {
  const urls = new Set();
  
  if (type === 'html') {
    // Extract href attributes
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      try {
        const url = new URL(match[1], baseUrl).href;
        if (isAssetDomain(url)) {
          urls.add({ url, type: 'href' });
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }

    // Extract src attributes
    const srcRegex = /src=["']([^"']+)["']/gi;
    while ((match = srcRegex.exec(content)) !== null) {
      try {
        const url = new URL(match[1], baseUrl).href;
        if (isAssetDomain(url)) {
          urls.add({ url, type: 'src' });
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }

    // Extract CSS @import and link[rel=stylesheet]
    const cssLinkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
    while ((match = cssLinkRegex.exec(content)) !== null) {
      try {
        const url = new URL(match[1], baseUrl).href;
        if (isAssetDomain(url)) {
          urls.add({ url, type: 'stylesheet' });
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }

    // Extract inline style attributes
    const styleRegex = /style=["']([^"']+)["']/gi;
    while ((match = styleRegex.exec(content)) !== null) {
      const styleContent = match[1];
      const urlMatches = styleContent.match(/url\(["']?([^"')]+)["']?\)/gi);
      if (urlMatches) {
        for (const urlMatch of urlMatches) {
          const urlStr = urlMatch.replace(/url\(["']?|["']?\)/gi, '');
          try {
            const url = new URL(urlStr, baseUrl).href;
            if (isAssetDomain(url)) {
              urls.add({ url, type: 'style' });
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }
      }
    }
  } else if (type === 'css') {
    // Extract url() references in CSS
    const urlRegex = /url\(["']?([^"')]+)["']?\)/gi;
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      try {
        const url = new URL(match[1], baseUrl).href;
        if (isAssetDomain(url)) {
          urls.add({ url, type: 'css-url' });
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }

    // Extract @import statements
    const importRegex = /@import\s+["']([^"']+)["']/gi;
    while ((match = importRegex.exec(content)) !== null) {
      try {
        const url = new URL(match[1], baseUrl).href;
        if (isAssetDomain(url)) {
          urls.add({ url, type: 'css-import' });
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
  } else if (type === 'js') {
    // Extract fetch/XMLHttpRequest URLs (basic patterns)
    const fetchRegex = /(?:fetch|XMLHttpRequest|\.src\s*=|\.href\s*=)\s*["']([^"']+)["']/gi;
    let match;
    while ((match = fetchRegex.exec(content)) !== null) {
      try {
        const url = new URL(match[1], baseUrl).href;
        if (isAssetDomain(url)) {
          urls.add({ url, type: 'js-url' });
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
  }

  return Array.from(urls);
}

async function processPage(url) {
  if (visited.has(url)) return;
  
  const localPath = getLocalPath(url);
  if (!localPath) return;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    console.warn(`⚠️  ${response.status} ${url}`);
    return;
  }

  const contentType = response.headers.get('content-type') || '';
  
  if (!contentType.includes('text/html')) {
    // Not an HTML page, treat as asset
    await downloadFile(url, localPath);
    return;
  }

  visited.add(url);
  const html = await response.text();
  
  // Extract all URLs from HTML
  const urls = extractUrls(html, url, 'html');
  
  // Download assets first
  for (const { url: assetUrl } of urls) {
    if (!visited.has(assetUrl)) {
      const assetLocalPath = getLocalPath(assetUrl, true);
      if (assetLocalPath) {
        await downloadFile(assetUrl, assetLocalPath);
        
        // If it's a CSS file, extract URLs from it
        if (assetUrl.includes('.css') || assetUrl.match(/\/css\//)) {
          try {
            const cssResponse = await fetch(assetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              }
            });
            if (cssResponse.ok) {
              const cssContent = await cssResponse.text();
              const cssUrls = extractUrls(cssContent, assetUrl, 'css');
              for (const { url: cssUrl } of cssUrls) {
                if (!visited.has(cssUrl)) {
                  const cssAssetPath = getLocalPath(cssUrl, true);
                  if (cssAssetPath) {
                    await downloadFile(cssUrl, cssAssetPath);
                  }
                }
              }
            }
          } catch (e) {
            // Skip CSS processing errors
          }
        }
      }
    }
  }

  // Rewrite URLs in HTML
  let modifiedHtml = html;
  for (const { url: assetUrl, type } of urls) {
    const localAssetPath = assetMap.get(assetUrl);
    if (localAssetPath) {
      // Convert to relative path
      const relativePath = path.relative(path.dirname(localPath), localAssetPath).replace(/\\/g, '/');
      const relativeUrl = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      
      if (type === 'href' || type === 'src' || type === 'stylesheet') {
        modifiedHtml = modifiedHtml.replace(
          new RegExp(`(["'])${escapeRegex(assetUrl)}(["'])`, 'g'),
          `$1${relativeUrl}$2`
        );
      } else if (type === 'style') {
        modifiedHtml = modifiedHtml.replace(
          new RegExp(`url\\(["']?${escapeRegex(assetUrl)}["']?\\)`, 'gi'),
          `url("${relativeUrl}")`
        );
      }
    }
  }

  // Also rewrite absolute URLs to relative
  modifiedHtml = modifiedHtml.replace(
    new RegExp(`https?://${BASE_URL.replace('https://', '')}`, 'gi'),
    ''
  );

  // Save the modified HTML
  const fullPath = path.join(MIRROR_DIR, localPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, modifiedHtml, 'utf8');

  processed++;
  console.log(`📄 ${processed}. Page: ${localPath}`);

  // Extract page links for crawling
  const pageLinks = extractUrls(html, url, 'html')
    .map(({ url: linkUrl }) => linkUrl)
    .filter(linkUrl => {
      try {
        const urlObj = new URL(linkUrl);
        return urlObj.hostname.includes('nobad.day') && 
               !linkUrl.includes('#') &&
               !linkUrl.includes('checkout') &&
               !linkUrl.includes('account') &&
               !linkUrl.includes('admin');
      } catch {
        return false;
      }
    });

  // Add new pages to queue
  for (const linkUrl of pageLinks) {
    if (!visited.has(linkUrl) && queue.length < 500) {
      queue.push(linkUrl);
    }
  }

  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 200));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function rewriteAssetUrls() {
  console.log('\n🔄 Rewriting URLs in downloaded files...');
  
  async function processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let modified = content;
      let changed = false;

      // Rewrite absolute URLs to relative
      for (const [remoteUrl, localPath] of assetMap.entries()) {
        const relativePath = path.relative(path.dirname(filePath), path.join(MIRROR_DIR, localPath))
          .replace(/\\/g, '/');
        const relativeUrl = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
        
        if (modified.includes(remoteUrl)) {
          modified = modified.replace(new RegExp(escapeRegex(remoteUrl), 'g'), relativeUrl);
          changed = true;
        }
      }

      // Rewrite base URL references
      modified = modified.replace(
        new RegExp(`https?://${BASE_URL.replace('https://', '')}`, 'gi'),
        ''
      );

      if (changed) {
        await fs.writeFile(filePath, modified, 'utf8');
      }
    } catch (e) {
      // Skip binary files or errors
    }
  }

  // Process all HTML, CSS, and JS files
  async function walkDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.name.match(/\.(html|css|js)$/i)) {
        await processFile(fullPath);
      }
    }
  }

  await walkDir(MIRROR_DIR);
  console.log('✅ URL rewriting complete');
}

async function main() {
  console.log(`🔄 Starting EXACT 1:1 mirror of ${BASE_URL}...`);
  console.log(`📁 Output directory: ${MIRROR_DIR}`);
  console.log(`🎯 Will download all pages, assets, and rewrite URLs\n`);

  // Clean and create output directory
  await fs.rm(MIRROR_DIR, { recursive: true, force: true });
  await fs.mkdir(MIRROR_DIR, { recursive: true });

  // Add priority URLs first
  for (const url of priorityUrls) {
    queue.push(url);
  }

  // Process queue
  while (queue.length > 0 && processed < maxFiles) {
    const url = queue.shift();
    await processPage(url);
  }

  console.log(`\n🔄 Post-processing: Rewriting URLs...`);
  await rewriteAssetUrls();

  console.log(`\n✅ Mirror complete!`);
  console.log(`   Pages processed: ${processed}`);
  console.log(`   Files downloaded: ${downloaded}`);
  console.log(`   Total files: ${processed + downloaded}`);
  console.log(`   Output: ${MIRROR_DIR}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review the static-mirror/ directory`);
  console.log(`   2. Copy to your hosting provider`);
  console.log(`   3. Configure your domain to point to the static files`);
}

main().catch(console.error);

