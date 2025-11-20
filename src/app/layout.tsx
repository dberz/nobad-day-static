import type { Metadata } from "next";
import { readFileSync } from 'fs';
import { join } from 'path';

export const metadata: Metadata = {
  title: "No Bad Days - Recovery and brain health products",
  description: "No Bad Days",
};

function fixUrl(url: string): string {
  // Fix protocol-relative URLs
  if (url.startsWith('//')) {
    // //nobad.day/... -> /...
    if (url.startsWith('//nobad.day/')) {
      return url.replace('//nobad.day/', '/');
    }
    // //cdn.shopify.com/... -> /cdn/...
    if (url.includes('cdn.shopify.com') || url.includes('shopifycdn.com')) {
      return url.replace(/\/\/[^/]+\//, '/cdn/');
    }
    // Other protocol-relative -> remove //
    return url.replace(/^\/\//, '/');
  }
  // Fix absolute URLs
  return url
    .replace(/https:\/\/nobad\.day\//g, '/')
    .replace(/http:\/\/nobad\.day\//g, '/')
    .replace(/https:\/\/[^/]+\.(shopify\.com|shopifycdn\.com)\//g, '/cdn/');
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read and process head content from mirrored HTML
  const stylesheets: Array<{ href: string; media?: string }> = [];
  const scripts: Array<{ src: string; defer?: boolean; async?: boolean; type?: string }> = [];
  
  try {
    const htmlPath = join(process.cwd(), 'public', 'index.html');
    const html = readFileSync(htmlPath, 'utf8');
    const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
    
    if (headMatch) {
      const headContent = headMatch[1];
      
      // Extract stylesheets
      const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
      let match;
      while ((match = linkRegex.exec(headContent)) !== null) {
        const linkTag = match[0];
        const hrefMatch = linkTag.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
          const href = fixUrl(hrefMatch[1]);
          // Skip checkout/storefront CSS
          if (!href.includes('checkout') && 
              !href.includes('shopifycloud/storefront') &&
              !href.includes('perf-kit')) {
            const mediaMatch = linkTag.match(/media=["']([^"']+)["']/i);
            stylesheets.push({
              href,
              media: mediaMatch ? mediaMatch[1] : undefined
            });
          }
        }
      }
      
      // Extract non-checkout scripts
      const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;
      while ((match = scriptRegex.exec(headContent)) !== null) {
        const scriptTag = match[0];
        const srcMatch = scriptTag.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
          const src = fixUrl(srcMatch[1]);
          // Only include theme scripts, skip checkout/storefront
          if (!src.includes('checkout') && 
              !src.includes('shopifycloud/storefront') &&
              !src.includes('shop.app') &&
              !src.includes('trekkie') &&
              !src.includes('shopify_pay') &&
              !src.includes('perf-kit') &&
              !src.includes('scripts.js')) { // Skip scripts.js that causes errors
            const isESM = src.includes('.esm.js');
            scripts.push({
              src,
              defer: scriptTag.includes('defer') || isESM,
              async: scriptTag.includes('async'),
              type: isESM ? 'module' : undefined
            });
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors, use defaults
  }

  return (
    <html lang="en" className="js">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Inject stylesheets */}
        {stylesheets.map((link, i) => (
          <link
            key={i}
            rel="stylesheet"
            href={link.href}
            media={link.media}
          />
        ))}
        {/* Inject scripts */}
        {scripts.map((script, i) => (
          <script
            key={i}
            src={script.src}
            defer={script.defer}
            async={script.async}
            type={script.type}
          />
        ))}
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
