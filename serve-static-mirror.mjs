#!/usr/bin/env node
/**
 * Simple static file server for the exact mirrored site
 * Serves files directly from static-mirror/
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIRROR_DIR = path.join(__dirname, 'static-mirror');
const PORT = 8000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.atom': 'application/atom+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
};

const server = http.createServer(async (req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0].split('#')[0];
  
  // Remove leading slash
  filePath = filePath.substring(1);
  
  let fullPath = path.join(MIRROR_DIR, filePath);
  
  try {
    let stats = await fs.stat(fullPath);
    
    // If it's a directory, check if there's a .html file with the same name first
    if (stats.isDirectory()) {
      // Check if there's a file like "blogs/news.html" when "blogs/news" is a directory
      const htmlPath = filePath + '.html';
      const htmlFullPath = path.join(MIRROR_DIR, htmlPath);
      try {
        const htmlStats = await fs.stat(htmlFullPath);
        if (htmlStats.isFile()) {
          // Serve the .html file instead of looking for index.html
          const content = await fs.readFile(htmlFullPath);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
          return;
        }
      } catch {
        // .html file doesn't exist, continue to check for index.html
      }
      
      // No .html file found, look for index.html in the directory
      filePath = path.join(filePath, 'index.html');
      fullPath = path.join(MIRROR_DIR, filePath);
      stats = await fs.stat(fullPath);
    }
    
    const content = await fs.readFile(fullPath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    // If file doesn't exist and has no extension, try adding .html
    if (!path.extname(filePath)) {
      try {
        const htmlPath = filePath + '.html';
        const htmlFullPath = path.join(MIRROR_DIR, htmlPath);
        const content = await fs.readFile(htmlFullPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
        return;
      } catch (htmlError) {
        // .html file doesn't exist either, fall through to 404
      }
    }
    
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`<h1>404 Not Found</h1><p>File not found: ${filePath}</p>`);
  }
});

// Check if directory exists
fs.access(MIRROR_DIR).then(() => {
  server.listen(PORT, () => {
    console.log(`🌐 Static site preview server running at:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`\n📁 Serving from: ${MIRROR_DIR}`);
    console.log(`\n🛑 Press Ctrl+C to stop`);
  });
}).catch(() => {
  console.error(`❌ Error: ${MIRROR_DIR} directory not found!`);
  console.log(`\n💡 Run 'npm run mirror:exact' first to create the static mirror.`);
  process.exit(1);
});

