#!/usr/bin/env node
/**
 * Simple static file server for the mirrored site
 * Serves files directly from site-mirror/
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIRROR_DIR = path.join(__dirname, 'site-mirror');
const PORT = 3001;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

const server = http.createServer(async (req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  
  // Remove leading slash
  filePath = filePath.substring(1);
  
  const fullPath = path.join(MIRROR_DIR, filePath);
  
  try {
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    
    const content = await fs.readFile(path.join(MIRROR_DIR, filePath));
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 Not Found</h1>');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Static site server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n📁 Serving from: ${MIRROR_DIR}`);
  console.log(`\n🛑 Press Ctrl+C to stop`);
});

