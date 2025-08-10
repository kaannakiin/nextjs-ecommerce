/*
  Warnings:

  - You are about to drop the column `name` on the `ProductVariantCombinationTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `ProductVariantCombinationTranslation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ProductVariantCombinationTranslation_locale_slug_key";

-- DropIndex
DROP INDEX "ProductVariantCombinationTranslation_slug_idx";

-- AlterTable
ALTER TABLE "ProductVariantCombinationTranslation" DROP COLUMN "name",
DROP COLUMN "slug";
