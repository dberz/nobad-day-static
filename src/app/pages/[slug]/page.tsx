'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function StaticPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const filePath = `/pages/${slug}.html`;

    fetch(filePath)
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
        setHtml('<div style="padding: 2rem;"><h1>Page not found</h1></div>');
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

