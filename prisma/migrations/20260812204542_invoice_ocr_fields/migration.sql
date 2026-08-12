-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDIENTE', 'PROCESANDO', 'PROCESADO', 'ERROR');

-- Migrate existing text status values to the new enum labels before changing the column type
UPDATE "Invoice" SET "status" = 'PENDIENTE' WHERE "status" = 'pending';
UPDATE "Invoice" SET "status" = 'PROCESANDO' WHERE "status" = 'processing';
UPDATE "Invoice" SET "status" = 'PROCESADO' WHERE "status" IN ('processed', 'completed', 'done');
UPDATE "Invoice" SET "status" = 'ERROR' WHERE "status" IN ('error', 'failed');

-- AlterTable: switch "status" from text to the InvoiceStatus enum
ALTER TABLE "Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus" USING ("status"::"InvoiceStatus");
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE';

-- AlterTable: add OCR extraction columns
ALTER TABLE "Invoice"
  ADD COLUMN "rawText" TEXT,
  ADD COLUMN "errorMessage" TEXT,
  ADD COLUMN "supplierName" TEXT,
  ADD COLUMN "supplierVat" TEXT,
  ADD COLUMN "invoiceNumber" TEXT,
  ADD COLUMN "issueDate" TIMESTAMP(3),
  ADD COLUMN "baseAmount" DECIMAL(12,2),
  ADD COLUMN "taxAmount" DECIMAL(12,2),
  ADD COLUMN "totalAmount" DECIMAL(12,2),
  ADD COLUMN "currency" TEXT DEFAULT 'EUR',
  ADD COLUMN "processedAt" TIMESTAMP(3);
