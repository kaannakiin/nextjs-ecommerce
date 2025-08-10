/*
  Warnings:

  - You are about to drop the column `priceAdjustment` on the `ProductVariantCombination` table. All the data in the column will be lost.
  - You are about to drop the column `priceAdjustmentType` on the `ProductVariantCombination` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductVariantCombination" DROP COLUMN "priceAdjustment",
DROP COLUMN "priceAdjustmentType";

-- CreateTable
CREATE TABLE "ProductVariantCombinationPrice" (
    "id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "locale" "Locale" NOT NULL DEFAULT 'TR',
    "price" DOUBLE PRECISION NOT NULL,
    "discountedPrice" DOUBLE PRECISION,
    "buyedPrice" DOUBLE PRECISION,
    "combinationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantCombinationPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantCombinationTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'TR',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "combinationId" TEXT NOT NULL,

    CONSTRAINT "ProductVariantCombinationTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariantCombinationPrice_combinationId_idx" ON "ProductVariantCombinationPrice"("combinationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantCombinationPrice_locale_currency_combinationI_key" ON "ProductVariantCombinationPrice"("locale", "currency", "combinationId");

-- CreateIndex
CREATE INDEX "ProductVariantCombinationTranslation_slug_idx" ON "ProductVariantCombinationTranslation"("slug");

-- CreateIndex
CREATE INDEX "ProductVariantCombinationTranslation_combinationId_idx" ON "ProductVariantCombinationTranslation"("combinationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantCombinationTranslation_locale_combinationId_key" ON "ProductVariantCombinationTranslation"("locale", "combinationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantCombinationTranslation_locale_slug_key" ON "ProductVariantCombinationTranslation"("locale", "slug");

-- AddForeignKey
ALTER TABLE "ProductVariantCombinationPrice" ADD CONSTRAINT "ProductVariantCombinationPrice_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "ProductVariantCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantCombinationTranslation" ADD CONSTRAINT "ProductVariantCombinationTranslation_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "ProductVariantCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
