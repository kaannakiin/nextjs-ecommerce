/*
  Warnings:

  - You are about to drop the column `value` on the `VariantOptionTranslation` table. All the data in the column will be lost.
  - Added the required column `value` to the `VariantOption` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VariantOption" ADD COLUMN     "value" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VariantOptionTranslation" DROP COLUMN "value";
