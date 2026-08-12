-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
