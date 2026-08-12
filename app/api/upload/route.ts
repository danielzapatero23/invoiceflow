import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request): Promise<NextResponse> {
  const form = await request.formData();
  const file = form.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No se ha subido ningún fichero' }, { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: 'private',
    addRandomSuffix: true,
  });

  const invoice = await prisma.invoice.create({
    data: {
      fileName: file.name,
      fileSize: file.size,
      blobUrl: blob.url,
    },
  });

  return NextResponse.json(invoice);
}