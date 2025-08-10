/*
  Warnings:

  - You are about to drop the column `locale` on the `ProductPrices` table. All the data in the column will be lost.
  - You are about to drop the column `locale` on the `ProductVariantCombinationPrice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currency,productId]` on the table `ProductPrices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[currency,combinationId]` on the table `ProductVariantCombinationPrice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProductPrices_locale_currency_productId_key";

-- DropIndex
DROP INDEX "ProductVariantCombinationPrice_locale_currency_combinationI_key";

-- AlterTable
ALTER TABLE "ProductPrices" DROP COLUMN "locale";

-- AlterTable
ALTER TABLE "ProductVariantCombinationPrice" DROP COLUMN "locale";

-- CreateIndex
CREATE UNIQUE INDEX "ProductPrices_currency_productId_key" ON "ProductPrices"("currency", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantCombinationPrice_currency_combinationId_key" ON "ProductVariantCombinationPrice"("currency", "combinationId");
