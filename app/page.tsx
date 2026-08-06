'use client';

import { useState } from 'react';

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setUrl(data.url);
    setUploading(false);
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>InvoiceFlow</h1>
      <p>Sube una factura en PDF</p>

      <form onSubmit={handleUpload}>
        <input type="file" name="file" accept=".pdf" required />
        <button type="submit" disabled={uploading}>
          {uploading ? 'Subiendo...' : 'Subir factura'}
        </button>
      </form>

      {url && (
        <p>
          Subido correctamente:{' '}
          <a href={url} target="_blank" rel="noopener noreferrer">
            ver PDF
          </a>
        </p>
      )}
    </main>
  );
}