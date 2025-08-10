/*
  Warnings:

  - A unique constraint covering the columns `[variantId,value]` on the table `VariantOption` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "VariantOption" ADD COLUMN     "colorHex" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductVariantImage" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "combinationId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantGroup" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantGroupOption" (
    "id" TEXT NOT NULL,
    "productVariantGroupId" TEXT NOT NULL,
    "variantOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantGroupOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantCombination" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "barcode" TEXT,
    "priceAdjustment" DOUBLE PRECISION,
    "priceAdjustmentType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductVariantCombinationToVariantOption" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductVariantCombinationToVariantOption_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ProductVariantImage_combinationId_idx" ON "ProductVariantImage"("combinationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantImage_combinationId_assetId_key" ON "ProductVariantImage"("combinationId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantImage_combinationId_order_key" ON "ProductVariantImage"("combinationId", "order");

-- CreateIndex
CREATE INDEX "ProductVariantGroup_productId_idx" ON "ProductVariantGroup"("productId");

-- CreateIndex
CREATE INDEX "ProductVariantGroup_variantId_idx" ON "ProductVariantGroup"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantGroup_productId_variantId_key" ON "ProductVariantGroup"("productId", "variantId");

-- CreateIndex
CREATE INDEX "ProductVariantGroupOption_productVariantGroupId_idx" ON "ProductVariantGroupOption"("productVariantGroupId");

-- CreateIndex
CREATE INDEX "ProductVariantGroupOption_variantOptionId_idx" ON "ProductVariantGroupOption"("variantOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantGroupOption_productVariantGroupId_variantOpti_key" ON "ProductVariantGroupOption"("productVariantGroupId", "variantOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantCombination_sku_key" ON "ProductVariantCombination"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantCombination_barcode_key" ON "ProductVariantCombination"("barcode");

-- CreateIndex
CREATE INDEX "ProductVariantCombination_productId_idx" ON "ProductVariantCombination"("productId");

-- CreateIndex
CREATE INDEX "ProductVariantCombination_sku_idx" ON "ProductVariantCombination"("sku");

-- CreateIndex
CREATE INDEX "ProductVariantCombination_isActive_idx" ON "ProductVariantCombination"("isActive");

-- CreateIndex
CREATE INDEX "_ProductVariantCombinationToVariantOption_B_index" ON "_ProductVariantCombinationToVariantOption"("B");

-- CreateIndex
CREATE INDEX "VariantOption_variantId_idx" ON "VariantOption"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantOption_variantId_value_key" ON "VariantOption"("variantId", "value");

-- AddForeignKey
ALTER TABLE "ProductVariantImage" ADD CONSTRAINT "ProductVariantImage_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "ProductVariantCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantImage" ADD CONSTRAINT "ProductVariantImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantGroup" ADD CONSTRAINT "ProductVariantGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantGroup" ADD CONSTRAINT "ProductVariantGroup_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantGroupOption" ADD CONSTRAINT "ProductVariantGroupOption_productVariantGroupId_fkey" FOREIGN KEY ("productVariantGroupId") REFERENCES "ProductVariantGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantGroupOption" ADD CONSTRAINT "ProductVariantGroupOption_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "VariantOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantCombination" ADD CONSTRAINT "ProductVariantCombination_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductVariantCombinationToVariantOption" ADD CONSTRAINT "_ProductVariantCombinationToVariantOption_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductVariantCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductVariantCombinationToVariantOption" ADD CONSTRAINT "_ProductVariantCombinationToVariantOption_B_fkey" FOREIGN KEY ("B") REFERENCES "VariantOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
