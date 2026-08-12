'use client';

import { useState, useEffect } from 'react';

type Invoice = {
  id: string;
  fileName: string;
  blobUrl: string;
  uploadedAt: string;
  status: string;
};

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  async function loadInvoices() {
    const res = await fetch('/api/invoices');
    const data = await res.json();
    setInvoices(data);
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    setUploading(false);
    form.reset();
    loadInvoices();
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

      <h2 style={{ marginTop: '2rem' }}>Facturas subidas</h2>
      {invoices.length === 0 && <p>Todavía no has subido ninguna factura.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {invoices.map((invoice) => (
          <li key={invoice.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #333' }}>
            <strong>{invoice.fileName}</strong> — {invoice.status} —{' '}
            {new Date(invoice.uploadedAt).toLocaleString('es-ES')}
          </li>
        ))}
      </ul>
    </main>
  );
}