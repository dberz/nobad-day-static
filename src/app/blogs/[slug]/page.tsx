'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function BlogPost() {
  const params = useParams();
  const slug = params?.slug as string;
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    // Try different possible paths
    const paths = [
      `/blogs/${slug}.html`,
      `/blogs/news/${slug}.html`,
      `/blogs/${slug}/index.html`,
    ];

    const tryLoad = async () => {
      for (const filePath of paths) {
        try {
          const res = await fetch(filePath);
          if (res.ok) {
            const content = await res.text();
            const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            setHtml(bodyMatch ? bodyMatch[1] : content);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Try next path
        }
      }
      setHtml('<div style="padding: 2rem;"><h1>Blog post not found</h1></div>');
      setLoading(false);
    };

    tryLoad();
  }, [slug]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

