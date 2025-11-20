#!/usr/bin/env node
/**
 * Fetch all blog posts from the blog index page
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIRROR_DIR = path.join(__dirname, 'site-mirror');
const BASE_URL = 'https://nobad.day';

async function fetchBlogPosts() {
  console.log('🔍 Fetching blog posts from blog index...\n');

  // Read the blog index HTML
  const blogIndexPath = path.join(MIRROR_DIR, 'blogs', 'news.html');
  let blogIndexHtml;
  
  try {
    blogIndexHtml = await fs.readFile(blogIndexPath, 'utf8');
  } catch (error) {
    console.error('❌ Blog index not found. Run mirror first: npm run mirror:node');
    process.exit(1);
  }

  // Extract all blog post URLs
  const blogPostRegex = /href=["']([^"']*\/blogs\/news\/[^"']+)["']/gi;
  const blogPosts = new Set();
  let match;

  while ((match = blogPostRegex.exec(blogIndexHtml)) !== null) {
    let url = match[1];
    // Convert relative to absolute
    if (url.startsWith('/')) {
      url = BASE_URL + url;
    }
    if (url.startsWith(BASE_URL + '/blogs/news/')) {
      blogPosts.add(url);
    }
  }

  console.log(`📝 Found ${blogPosts.size} blog posts to download:\n`);

  let downloaded = 0;
  for (const url of blogPosts) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️  ${response.status} ${url}`);
        continue;
      }

      const urlObj = new URL(url);
      let filePath = urlObj.pathname;
      
      if (!path.extname(filePath)) {
        filePath += '.html';
      }

      const fullPath = path.join(MIRROR_DIR, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      const content = await response.text();
      await fs.writeFile(fullPath, content, 'utf8');

      downloaded++;
      console.log(`✅ ${downloaded}/${blogPosts.size}. ${urlObj.pathname}`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`❌ Error downloading ${url}:`, error.message);
    }
  }

  console.log(`\n✅ Downloaded ${downloaded} blog posts!`);
}

fetchBlogPosts().catch(console.error);

