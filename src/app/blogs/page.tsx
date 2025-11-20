'use client';

import { useEffect, useState } from 'react';

export default function BlogIndex() {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/blogs/news.html')
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(content => {
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        setHtml(bodyMatch ? bodyMatch[1] : content);
        setLoading(false);
      })
      .catch(() => {
        setHtml('<div style="padding: 2rem;"><h1>Blog not found</h1></div>');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

