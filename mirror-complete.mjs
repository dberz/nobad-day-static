#!/usr/bin/env node
/**
 * Complete mirror of nobad.day - downloads everything
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIRROR_DIR = path.join(__dirname, 'site-mirror');
const BASE_URL = 'https://nobad.day';

const visited = new Set();
const queue = [BASE_URL];
let processed = 0;
const maxFiles = 2000; // Much higher limit

// Priority URLs to crawl first
const priorityUrls = [
  BASE_URL,
  `${BASE_URL}/blogs/news`,
  `${BASE_URL}/pages/about`,
  `${BASE_URL}/pages/contact`,
  `${BASE_URL}/pages/terms-and-conditions`,
  `${BASE_URL}/pages/privacy-policy`,
  `${BASE_URL}/products/no-bad-days`,
];

async function download(url) {
  if (visited.has(url)) return;
  visited.add(url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️  ${response.status} ${url}`);
      return;
    }

    const urlObj = new URL(url);
    let filePath = urlObj.pathname;
    
    // Handle root
    if (filePath === '/') {
      filePath = '/index.html';
    }
    
    // Determine file extension from content-type or URL
    const contentType = response.headers.get('content-type') || '';
    if (!path.extname(filePath)) {
      if (contentType.includes('text/html')) {
        filePath += '.html';
      } else if (contentType.includes('text/css')) {
        filePath += '.css';
      } else if (contentType.includes('javascript')) {
        filePath += '.js';
      } else if (urlObj.pathname.match(/^\/(blogs|pages|products|collections)/)) {
        filePath += '.html';
      }
    }

    const fullPath = path.join(MIRROR_DIR, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const content = await response.text();
    await fs.writeFile(fullPath, content, 'utf8');

    processed++;
    if (processed % 10 === 0) {
      console.log(`📥 ${processed} files... ${urlObj.pathname}`);
    } else {
      console.log(`✅ ${processed}. ${urlObj.pathname}`);
    }

    // Extract links for crawling (only HTML pages)
    if (contentType.includes('text/html')) {
      const links = extractLinks(content, url);
      
      // Prioritize blog posts and pages
      const blogLinks = links.filter(l => l.includes('/blogs/'));
      const pageLinks = links.filter(l => l.includes('/pages/'));
      const otherLinks = links.filter(l => !l.includes('/blogs/') && !l.includes('/pages/'));
      
      // Add blog/page links first, then others
      for (const link of [...blogLinks, ...pageLinks, ...otherLinks]) {
        if (link.startsWith(BASE_URL) && !visited.has(link) && queue.length < 500) {
          queue.push(link);
        }
      }
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.error(`❌ Error downloading ${url}:`, error.message);
  }
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  
  // Extract href attributes
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    try {
      const link = new URL(match[1], baseUrl).href;
      if (link.startsWith(BASE_URL)) {
        links.add(link);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }

  // Extract src attributes for assets
  const srcRegex = /src=["']([^"']+)["']/gi;
  while ((match = srcRegex.exec(html)) !== null) {
    try {
      const link = new URL(match[1], baseUrl).href;
      if (link.startsWith(BASE_URL) || link.includes('cdn.shopify.com')) {
        links.add(link);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }

  // Extract CSS imports
  const cssRegex = /url\(["']?([^"')]+)["']?\)/gi;
  while ((match = cssRegex.exec(html)) !== null) {
    try {
      const link = new URL(match[1], baseUrl).href;
      if (link.startsWith(BASE_URL) || link.includes('cdn.shopify.com')) {
        links.add(link);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }

  return Array.from(links);
}

async function main() {
  console.log(`🔄 Starting COMPLETE site mirror of ${BASE_URL}...`);
  console.log(`📁 Output directory: ${MIRROR_DIR}`);
  console.log(`🎯 Will download up to ${maxFiles} files\n`);

  await fs.mkdir(MIRROR_DIR, { recursive: true });

  // Add priority URLs first
  for (const url of priorityUrls) {
    if (!visited.has(url)) {
      queue.push(url);
    }
  }

  while (queue.length > 0 && processed < maxFiles) {
    const url = queue.shift();
    await download(url);
  }

  console.log(`\n✅ Mirror complete!`);
  console.log(`   Processed: ${processed} files`);
  console.log(`   Output: ${MIRROR_DIR}`);
  console.log(`\n📝 Next: Copy to public/`);
  console.log(`   cp -r site-mirror/* public/`);
}

main().catch(console.error);

