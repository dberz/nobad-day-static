import { readFileSync } from 'fs';
import { join } from 'path';

export default function Home() {
  // Read the mirrored index.html
  const htmlPath = join(process.cwd(), 'public', 'index.html');
  
  let html = '';
  try {
    html = readFileSync(htmlPath, 'utf8');
    
    // Fix protocol-relative URLs more carefully
    html = html.replace(/\/\/([^/]+\.(nobad\.day|shopify\.com|shopifycdn\.com))\//g, '/cdn/');
    html = html.replace(/\/\/nobad\.day\//g, '/');
    // Fix absolute URLs
    html = html.replace(/https:\/\/([^/]+\.(nobad\.day|shopify\.com|shopifycdn\.com))\//g, '/cdn/');
    html = html.replace(/https:\/\/nobad\.day\//g, '/');
    html = html.replace(/http:\/\/nobad\.day\//g, '/');
    
  } catch (error) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Homepage not found</h1>
        <p>Make sure index.html exists in public/</p>
        <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1] : html;

  // Remove inline styles, links, and scripts from body (they cause hydration issues)
  // These should only be in <head>
  bodyContent = bodyContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  bodyContent = bodyContent.replace(/<link[^>]*>/gi, '');
  // Remove all script tags from body, especially scripts.js which causes errors
  bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  bodyContent = bodyContent.replace(/<script[^>]*scripts\.js[^>]*><\/script>/gi, '');
  
  // Remove Shopify-specific inline scripts and data attributes that cause issues
  bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?window\.Shopify[\s\S]*?<\/script>/gi, '');
  bodyContent = bodyContent.replace(/data-shopify[^=]*="[^"]*"/gi, '');
  bodyContent = bodyContent.replace(/data-sections[^=]*="[^"]*"/gi, '');

  return <div dangerouslySetInnerHTML={{ __html: bodyContent }} />;
}
