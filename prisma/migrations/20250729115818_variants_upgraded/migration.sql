/*
  Warnings:

  - A unique constraint covering the columns `[locale,variantOptionId]` on the table `VariantOptionTranslation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[locale,slug]` on the table `VariantOptionTranslation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "VariantOptionTranslation_slug_idx" ON "VariantOptionTranslation"("slug");

-- CreateIndex
CREATE INDEX "VariantOptionTranslation_variantOptionId_idx" ON "VariantOptionTranslation"("variantOptionId");

-- CreateIndex
CREATE INDEX "VariantOptionTranslation_locale_variantOptionId_idx" ON "VariantOptionTranslation"("locale", "variantOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantOptionTranslation_locale_variantOptionId_key" ON "VariantOptionTranslation"("locale", "variantOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantOptionTranslation_locale_slug_key" ON "VariantOptionTranslation"("locale", "slug");
