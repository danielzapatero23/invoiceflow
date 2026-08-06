import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

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

  return NextResponse.json(blob);
}