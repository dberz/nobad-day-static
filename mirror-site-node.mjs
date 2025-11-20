#!/usr/bin/env node
/**
 * Mirror nobad.day to static files using Node.js
 * Enhanced to crawl all pages and blog posts
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIRROR_DIR = path.join(__dirname, 'site-mirror');
const BASE_URL = 'https://nobad.day';

const visited = new Set();
const queue = [BASE_URL];
const maxDepth = 5;
let processed = 0;
const maxFiles = 500; // Increased limit

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
    
    // Ensure .html extension for pages
    if (!path.extname(filePath) && urlObj.pathname.match(/^\/(blogs|pages|products|collections)/)) {
      filePath += '.html';
    } else if (!path.extname(filePath) && !urlObj.pathname.includes('.')) {
      filePath += '.html';
    }

    const fullPath = path.join(MIRROR_DIR, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const content = await response.text();
    await fs.writeFile(fullPath, content, 'utf8');

    processed++;
    console.log(`✅ ${processed}. ${url} → ${filePath}`);

    // Extract links for crawling (only HTML pages)
    if (response.headers.get('content-type')?.includes('text/html')) {
      const links = extractLinks(content, url);
      
      // Prioritize blog posts and pages
      const blogLinks = links.filter(l => l.includes('/blogs/') || l.includes('/pages/'));
      const otherLinks = links.filter(l => !l.includes('/blogs/') && !l.includes('/pages/'));
      
      // Add blog/page links first, then others
      for (const link of [...blogLinks, ...otherLinks]) {
        if (link.startsWith(BASE_URL) && !visited.has(link) && queue.length < 200) {
          queue.push(link);
        }
      }
    }

    // Rate limiting - slower for more files
    await new Promise(resolve => setTimeout(resolve, 300));
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
  console.log(`🔄 Starting full site mirror of ${BASE_URL}...`);
  console.log(`📁 Output directory: ${MIRROR_DIR}`);
  console.log(`🎯 Focusing on: pages, blog posts, and assets\n`);

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
  console.log(`\n📝 Next: Copy to public/ and restart dev server`);
}

main().catch(console.error);
