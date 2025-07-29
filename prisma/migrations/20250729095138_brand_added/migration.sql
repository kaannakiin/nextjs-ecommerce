-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brandId" TEXT;

-- CreateTable
CREATE TABLE "ProductBrandTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'TR',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBrandTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBrand" (
    "id" TEXT NOT NULL,
    "imageId" TEXT,
    "parentBrandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBrand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductBrandTranslation_slug_idx" ON "ProductBrandTranslation"("slug");

-- CreateIndex
CREATE INDEX "ProductBrandTranslation_brandId_idx" ON "ProductBrandTranslation"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBrandTranslation_locale_brandId_key" ON "ProductBrandTranslation"("locale", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBrandTranslation_locale_slug_key" ON "ProductBrandTranslation"("locale", "slug");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBrandTranslation" ADD CONSTRAINT "ProductBrandTranslation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBrand" ADD CONSTRAINT "ProductBrand_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBrand" ADD CONSTRAINT "ProductBrand_parentBrandId_fkey" FOREIGN KEY ("parentBrandId") REFERENCES "ProductBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
