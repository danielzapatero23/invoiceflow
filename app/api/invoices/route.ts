import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const invoices = await prisma.invoice.findMany({
    orderBy: { uploadedAt: 'desc' },
  });

  return NextResponse.json(invoices);
}