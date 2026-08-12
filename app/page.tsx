'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Inbox, Loader2, Trash2, Upload, X } from 'lucide-react';

type Invoice = {
  id: string;
  fileName: string;
  fileSize: number | null;
  blobUrl: string;
  uploadedAt: string;
  status: string;
};

const STATUS_META: Record<string, { label: string; dot: string }> = {
  pendiente: { label: 'Pendiente', dot: '#8A8A94' },
  procesando: { label: 'Procesando', dot: '#3B82F6' },
  procesado: { label: 'Procesado', dot: '#22C55E' },
  error: { label: 'Error', dot: '#EF4444' },
};

function getStatusMeta(status: string) {
  return STATUS_META[status.toLowerCase()] ?? { label: status, dot: '#8A8A94' };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

type Toast = { type: 'success' | 'error'; message: string };

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('Failed to load invoices');
      const data = await res.json();
      setInvoices(data);
    } catch {
      showToast('error', 'No se han podido cargar las facturas');
    } finally {
      setLoadingInvoices(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount for the initial invoice list
    loadInvoices();
  }, [loadInvoices]);

  function handleRemoveFile() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');

      form.reset();
      setSelectedFile(null);
      await loadInvoices();
      showToast('success', `"${file.name}" subida correctamente`);
    } catch {
      showToast('error', 'No se ha podido subir la factura');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(invoice: Invoice) {
    const confirmed = window.confirm(`¿Eliminar "${invoice.fileName}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(invoice.id);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      await loadInvoices();
      showToast('success', `"${invoice.fileName}" eliminada`);
    } catch {
      showToast('error', `No se ha podido eliminar "${invoice.fileName}"`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <header className="flex h-14 items-center border-b border-[#232328] px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <span className="text-sm font-semibold text-white">InvoiceFlow</span>
            <span className="text-xs text-[#8A8A94]">Gestión de facturas con extracción automática por IA</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <section className="rounded-lg border border-[#232328] bg-[#131316] p-5">
          <h2 className="text-sm font-medium text-zinc-200">Sube una factura</h2>

          <form onSubmit={handleUpload} className="mt-4">
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              name="file"
              accept=".pdf"
              required
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />

            {selectedFile ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#2E2E35] bg-[#0F0F12] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-[#8A8A94]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-200">{selectedFile.name}</p>
                    <p className="text-xs text-[#8A8A94]">{formatSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  aria-label="Quitar archivo"
                  className="shrink-0 rounded-md p-1.5 text-[#8A8A94] transition-colors hover:bg-white/5 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className="flex h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#2E2E35] px-6 text-center transition-colors hover:border-[#3A3A42] hover:bg-white/[0.02]"
              >
                <Upload className="h-5 w-5 text-[#8A8A94]" />
                <p className="text-sm text-zinc-300">Arrastra un PDF o haz clic para seleccionar</p>
                <p className="text-xs text-[#8A8A94]">Solo PDF · máx. 10 MB</p>
              </label>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-[#1E1E23] disabled:text-[#8A8A94]"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? 'Subiendo...' : 'Subir factura'}
            </button>
          </form>
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-medium text-zinc-200">Facturas subidas</h2>
            {!loadingInvoices && invoices.length > 0 && (
              <span className="text-sm text-[#8A8A94]">({invoices.length})</span>
            )}
          </div>

          {!loadingInvoices && invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Inbox className="h-8 w-8 text-[#4A4A52]" />
              <p className="text-sm text-[#8A8A94]">Aún no has subido ninguna factura</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#232328]">
              <table className="w-full table-fixed border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#232328]">
                    <th className="w-[40%] px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#8A8A94]">
                      Archivo
                    </th>
                    <th className="w-[90px] whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#8A8A94]">
                      Tamaño
                    </th>
                    <th className="w-[168px] whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#8A8A94]">
                      Fecha
                    </th>
                    <th className="w-[120px] whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#8A8A94]">
                      Estado
                    </th>
                    <th className="w-[120px] whitespace-nowrap px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-[#8A8A94]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingInvoices
                    ? [0, 1, 2].map((i) => (
                        <tr key={i} className="h-11 border-b border-[#1C1C20] last:border-b-0">
                          <td className="px-4">
                            <div className="h-3 w-32 animate-pulse rounded bg-[#1E1E23]" />
                          </td>
                          <td className="px-4">
                            <div className="h-3 w-12 animate-pulse rounded bg-[#1E1E23]" />
                          </td>
                          <td className="px-4">
                            <div className="h-3 w-24 animate-pulse rounded bg-[#1E1E23]" />
                          </td>
                          <td className="px-4">
                            <div className="h-3 w-16 animate-pulse rounded bg-[#1E1E23]" />
                          </td>
                          <td className="px-4">
                            <div className="ml-auto flex w-fit gap-2">
                              <div className="h-6 w-16 animate-pulse rounded bg-[#1E1E23]" />
                              <div className="h-6 w-6 animate-pulse rounded bg-[#1E1E23]" />
                            </div>
                          </td>
                        </tr>
                      ))
                    : invoices.map((invoice) => {
                        const meta = getStatusMeta(invoice.status);
                        const isDeleting = deletingId === invoice.id;
                        return (
                          <tr
                            key={invoice.id}
                            className={`h-11 border-b border-[#1C1C20] transition-colors last:border-b-0 hover:bg-[#17171B] ${
                              isDeleting ? 'opacity-50' : ''
                            }`}
                          >
                            <td className="truncate px-4 text-zinc-200" title={invoice.fileName}>
                              {invoice.fileName}
                            </td>
                            <td className="whitespace-nowrap px-4 text-[#8A8A94]">
                              {invoice.fileSize != null ? formatSize(invoice.fileSize) : '—'}
                            </td>
                            <td className="whitespace-nowrap px-4 text-[#8A8A94]">{formatDate(invoice.uploadedAt)}</td>
                            <td className="whitespace-nowrap px-4">
                              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
                                <span
                                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: meta.dot }}
                                />
                                {meta.label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled
                                  className="rounded-md border border-[#232328] px-2.5 py-1 text-xs font-medium text-[#8A8A94] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Procesar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(invoice)}
                                  disabled={isDeleting}
                                  aria-label="Eliminar factura"
                                  className="rounded-md p-1.5 text-[#8A8A94] transition-colors hover:bg-white/5 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#8A8A94]"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-emerald-500/25 bg-[#0F1912] text-emerald-300'
              : 'border-red-500/25 bg-[#1A1113] text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 translate-y-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 translate-y-0.5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
