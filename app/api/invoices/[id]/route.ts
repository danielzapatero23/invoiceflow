import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  }

  try {
    await del(invoice.blobUrl);
  } catch (error) {
    console.error(`No se pudo borrar el blob de la factura ${id}:`, error);
  }

  await prisma.invoice.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
