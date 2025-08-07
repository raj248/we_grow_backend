/*
  Warnings:

  - You are about to drop the `PurchaseOption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "PurchaseOption";

-- CreateTable
CREATE TABLE "TopupOptions" (
    "id" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "googleProductId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopupOptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopupOptions_googleProductId_key" ON "TopupOptions"("googleProductId");
