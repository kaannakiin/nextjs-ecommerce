/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `VariantOption` table. All the data in the column will be lost.
  - You are about to drop the `_ProductVariantCombinationToVariantOption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VariantOptionTranslation" DROP CONSTRAINT "VariantOptionTranslation_variantOptionId_fkey";

-- DropForeignKey
ALTER TABLE "VariantTranslation" DROP CONSTRAINT "VariantTranslation_variantId_fkey";

-- DropForeignKey
ALTER TABLE "_ProductVariantCombinationToVariantOption" DROP CONSTRAINT "_ProductVariantCombinationToVariantOption_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductVariantCombinationToVariantOption" DROP CONSTRAINT "_ProductVariantCombinationToVariantOption_B_fkey";

-- AlterTable
ALTER TABLE "ProductVariantGroupOption" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "VariantOption" DROP COLUMN "sortOrder";

-- DropTable
DROP TABLE "_ProductVariantCombinationToVariantOption";

-- CreateTable
CREATE TABLE "ProductVariantCombinationOption" (
    "id" TEXT NOT NULL,
    "combinationId" TEXT NOT NULL,
    "productVariantGroupId" TEXT NOT NULL,
    "variantOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantCombinationOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariantCombinationOption_combinationId_idx" ON "ProductVariantCombinationOption"("combinationId");

-- CreateIndex
CREATE INDEX "ProductVariantCombinationOption_variantOptionId_idx" ON "ProductVariantCombinationOption"("variantOptionId");

-- CreateIndex
CREATE INDEX "ProductVariantCombinationOption_productVariantGroupId_idx" ON "ProductVariantCombinationOption"("productVariantGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantCombinationOption_combinationId_productVarian_key" ON "ProductVariantCombinationOption"("combinationId", "productVariantGroupId");

-- CreateIndex
CREATE INDEX "ProductVariantGroupOption_productVariantGroupId_sortOrder_idx" ON "ProductVariantGroupOption"("productVariantGroupId", "sortOrder");

-- AddForeignKey
ALTER TABLE "VariantOptionTranslation" ADD CONSTRAINT "VariantOptionTranslation_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "VariantOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantTranslation" ADD CONSTRAINT "VariantTranslation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantCombinationOption" ADD CONSTRAINT "ProductVariantCombinationOption_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "ProductVariantCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantCombinationOption" ADD CONSTRAINT "ProductVariantCombinationOption_productVariantGroupId_fkey" FOREIGN KEY ("productVariantGroupId") REFERENCES "ProductVariantGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantCombinationOption" ADD CONSTRAINT "ProductVariantCombinationOption_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "VariantOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
